import { allowRequest } from '../../server/abuse';
import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { currentUser, json, origin } from '../../server/auth';
import { database, databaseReady, ensureMember } from '../../server/database';
import { sameOrigin } from '../../server/security.mjs';
import { normalizeDraft, publishReadiness, slugify, pricingKind, PROJECT_STATUS_LABELS } from '../../server/listing-policy.mjs';
import { saveDraft, submit, unpublish } from '../../server/listing-service.mjs';
import { projectStore } from '../../server/listing-store';
import { PROJECT_FIELDS } from '../../server/catalog-db';
import { publicationAccess } from '../../server/community-credits';

function ownedView(row: any) {
  return {
    price: row.price_label || 'Free', pricing: pricingKind(row.price_label || 'Free'), sharingPreference: row.sharing_preference || 'not_sure', video: row.video_url || '', id: row.id, slug: row.slug, title: row.title, category: row.category, stage: row.stage,
    status: row.listing_status, statusLabel: (PROJECT_STATUS_LABELS as Record<string, string>)[row.listing_status] || row.listing_status,
    headline: row.headline, help: row.help_text, firstTry: row.first_try, url: row.external_url,
    preview: row.preview_public_url || '', hasImage: !!row.preview_path,
    ownershipStatus: row.ownership_status, submittedAt: row.submitted_at, publishedAt: row.published_at, updatedAt: row.updated_at,
    lockVersion: row.lock_version, readiness: publishReadiness(row),
  };
}
const reply = (result: any) => {
  if (result.error) return json({ error: result.error, ...(result.missing ? { missing: result.missing } : {}) }, result.status || 400);
  return json({ ok: true, project: ownedView(result.project), reviewReset: !!result.reviewReset, idempotent: !!result.idempotent, created: !!result.created });
};

export const GET: APIRoute = async context => {
  const user = await currentUser(context);
  if (!user) return json({ error: 'Please sign in.' }, 401);
  if (!databaseReady()) return json({ error: 'Projects are being connected.' }, 503);
  try {
    const member = await ensureMember(user);
    const { data, error } = await database().from('projects').select(PROJECT_FIELDS)
      .eq('owner_user_id', member.id).order('updated_at', { ascending: false });
    if (error) throw error;
    return json({ projects: (data || []).map(ownedView) });
  } catch { return json({ error: 'Your projects could not be loaded. Please try again.' }, 503); }
};

export const POST: APIRoute = async context => {
  if (!sameOrigin(context.request, origin(context))) return json({ error: 'Request not allowed.' }, 403);
  const user = await currentUser(context);
  if (!user) return json({ error: 'Please sign in.' }, 401);
  if (!user.emailVerified) return json({error:'Verify your email before making changes.'},403);
  if (!databaseReady()) return json({ error: 'Publishing is being connected.' }, 503);
  try {
    if (!await allowRequest(user.id, 'projects')) return json({error:'Please wait a minute before trying again.'},429);
    const raw = await context.request.text();
    if (raw.length > 20000) return json({ error: 'Request too large.' }, 413);
    const body = JSON.parse(raw);
    const member = await ensureMember(user);
    const store = projectStore(database());

    if(body.action==='delete'){
      if(body.confirm!=='DELETE'||!Number.isSafeInteger(body.version))return json({error:'Confirm deletion of this private draft.'},400);
      const result=await database().rpc('cw_delete_unused_draft',{p_user:member.id,p_id:body.id,p_version:body.version});
      if(result.error)return json({error:'This draft could not be deleted. Reload it; only unused private drafts without project activity can be deleted.'},409);
      // Only remove the owned, now-unreferenced preview after the database confirms deletion.
      let cleanupPending=false;
      if(typeof result.data==='string'&&result.data.startsWith(`previews/${member.id}/${body.id}/`)){
        try{const removed=await database().storage.from('project-previews').remove([result.data]);cleanupPending=!!removed.error;}catch{cleanupPending=true;}
        if(cleanupPending){console.warn('Deleted draft preview needs cleanup',body.id);await database().from('operations_log').insert({actor_id:member.id,target_id:body.id,action:'project.preview_cleanup_pending',reason:result.data}).then(()=>{},()=>{});}
      }
      return json({ok:true,deleted:true,cleanupPending});
    }
    if (body.action === 'save') {
      const clientToken = typeof body.clientToken === 'string' ? body.clientToken.trim() : '';
      if (!body.id && !(clientToken.length >= 8 && clientToken.length <= 100)) {
        return json({ error: 'A draft identity (id or clientToken) is required.' }, 400);
      }
      const { value, error } = normalizeDraft(body);
      if (error || !value) return json({ error: error || 'Nothing to save.' }, 400);
      const result = await saveDraft(store, { ownerId: member.id, id: body.id, clientToken, input: value },
        { slugify, randomSuffix: () => randomBytes(3).toString('hex') });
      return reply(result);
    }
    if (body.action === 'submit') {
      const access=await publicationAccess(database(),member.id,String(body.id||''));
      if(!access.allowed)return json({error:`You are using ${access.used} of ${access.slots} active project places. Unpublish a project or contact support; reviewing is not required.`,href:'/dashboard/help'},403);
      return reply(await submit(store, { ownerId: member.id, id: body.id }));
    }
    if (body.action === 'unpublish') return reply(await unpublish(store, { ownerId: member.id, id: body.id }));
    return json({ error: 'Unknown action.' }, 400);
  } catch { return json({ error: 'That change could not be saved. Your work is safe; please try again.' }, 503); }
};
