import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { currentUser, env, json, origin } from '../../../server/auth';
import { database, databaseReady, ensureMember } from '../../../server/database';
import { sameOrigin } from '../../../server/security.mjs';
import { isFounder } from '../../../server/admin-policy.mjs';
import { canViewProject } from '../../../server/listing-policy.mjs';
import { projectStore, reencodeImage } from '../../../server/listing-store';
import { replaceImage, restoreImage } from '../../../server/listing-service.mjs';

const BUCKET = 'project-previews';

// Extract raw bytes from a data: URL. sharp (in reencodeImage) is the authoritative validator.
function dataUrlBytes(value: unknown): Buffer | null {
  if (typeof value !== 'string') return null;
  const m = value.match(/^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/);
  if (!m) return null;
  try { return Buffer.from(m[1], 'base64'); } catch { return null; }
}

// Replace or restore a project's preview. Owner-only; new files are re-encoded server-side and stored
// as versioned objects. The previous image remains available in the bounded rollback history.
export const POST: APIRoute = async context => {
  if (!sameOrigin(context.request, origin(context))) return json({ error: 'Request not allowed.' }, 403);
  const user = await currentUser(context);
  if (!user) return json({ error: 'Please sign in.' }, 401);
  if (!databaseReady()) return json({ error: 'Image storage is being connected.' }, 503);
  try {
    const raw = await context.request.text();
    if (raw.length > 12_000_000) return json({ error: 'That image is too large.' }, 413);
    const body = JSON.parse(raw);
    const member = await ensureMember(user);
    const store = projectStore(database());
    if (body.action === 'restore') {
      const result = await restoreImage(store, { ownerId: member.id, slug: context.params.slug || '', historyId: typeof body.historyId === 'string' ? body.historyId : '' });
      if (result.error) return json({ error: result.error }, result.status || 400);
      return json({ saved: true, preview: result.project.preview_public_url, previewSource: result.project.preview_source, previewSourceUrl: result.project.preview_source_url || '', previewCapturedAt: result.project.preview_captured_at || '', previewHistory: result.project.preview_history || [], reviewReset: !!result.reviewReset });
    }
    const bytes = dataUrlBytes(body.image);
    if (!bytes) return json({ error: 'Upload a valid PNG, JPG, or WebP image.' }, 400);
    const result = await replaceImage(store, { ownerId: member.id, slug: context.params.slug || '', bytes, source: body.source, sourceUrl: body.sourceUrl, capturedAt: body.capturedAt }, {
      reencode: reencodeImage,
      keyFactory: (owner: string, pid: string) => `previews/${owner}/${pid}/${Date.now()}-${randomBytes(4).toString('hex')}.jpg`,
    });
    if (result.error) return json({ error: result.error }, result.status || 400);
    return json({ saved: true, preview: result.project.preview_public_url, previewSource: result.project.preview_source, previewSourceUrl: result.project.preview_source_url || '', previewCapturedAt: result.project.preview_captured_at || '', previewHistory: result.project.preview_history || [], reviewReset: !!result.reviewReset });
  } catch { return json({ error: 'The image could not be saved. Your listing image is unchanged; please retry.' }, 503); }
};

// Serve a preview. Published → anyone; drafts/in-review/unpublished → owner or admin only.
export const GET: APIRoute = async context => {
  if (!databaseReady()) return new Response('Not found', { status: 404 });
  try {
    const db = database();
    const { data: row, error } = await db.from('projects').select('id,slug,owner_user_id,listing_status,preview_path').eq('slug', context.params.slug || '').maybeSingle();
    if (error || !row || !row.preview_path) return new Response('Not found', { status: 404 });
    let viewerId: string | null = null, isAdmin = false;
    const user = await currentUser(context);
    if (user) { isAdmin = isFounder(user.id, env('FOUNDER_WORKOS_USER_ID'), user.email, env('FOUNDER_EMAIL'), user.emailVerified); try { viewerId = (await ensureMember(user)).id; } catch { viewerId = null; } }
    if (!canViewProject(row, viewerId, isAdmin)) return new Response('Not found', { status: 404 });
    if (row.preview_path.startsWith('/assets/')) return context.redirect(row.preview_path, 302);
    const dl = await db.storage.from(BUCKET).download(row.preview_path);
    if (dl.error || !dl.data) return new Response('Not found', { status: 404 });
    const buffer = Buffer.from(await dl.data.arrayBuffer());
    const type = dl.data.type || 'image/jpeg';
    const cache = row.listing_status === 'published' ? 'public, max-age=300' : 'private, no-store';
    return new Response(buffer, { headers: { 'Content-Type': type, 'Cache-Control': cache, 'X-Content-Type-Options': 'nosniff' } });
  } catch { return new Response('Not found', { status: 404 }); }
};
