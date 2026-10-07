import { allowRequest } from '../../server/abuse';
import type { APIRoute } from 'astro';
import { currentUser, json, origin } from '../../server/auth';
import { database, databaseReady, ensureMember } from '../../server/database';
import { sameOrigin } from '../../server/security.mjs';
import { thoughtfulComment } from '../../server/feedback-policy.mjs';
import {validId} from '../../server/feedback-policy.mjs';
import {guestToken} from '../../server/guest-comments';

export const GET: APIRoute = async context => {
  if (!databaseReady()) return json({ posts: [], connected: false });
  let query=database().from('project_experiences').select('id,project_slug,response,created_at,author_user_id,projects!inner(listing_status,owner_user_id)').eq('projects.listing_status','published').eq('moderation_status','published');
  const slug=context.url.searchParams.get('project');if(slug)query=query.eq('project_slug',slug);
  const result = await query.order('created_at', { ascending: false }).limit(100);
  if (result.error) return json({ error: 'Community is temporarily unavailable.' }, 503);
  const ids = [...new Set(result.data.map(row => row.author_user_id).filter(Boolean))];
  const profiles = ids.length ? await database().from('profiles').select('user_id,display_name,identity_label,avatar_path').in('user_id', ids) : { data: [], error: null };
  if (profiles.error) return json({ error: 'Community is temporarily unavailable.' }, 503);
  return json({ connected: true, posts: result.data.map(row => {
    const profile = profiles.data?.find(item => item.user_id === row.author_user_id);
    const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
    const isCreator = Boolean(row.author_user_id && row.author_user_id === project?.owner_user_id);
    const author: string = row.author_user_id ? profile?.display_name || 'Member' : 'Guest';
    return { id: row.id, projectSlug: row.project_slug, response: row.response, author, isCreator, avatar: profile?.avatar_path || '', label: row.author_user_id ? profile?.identity_label || 'TryMyBuild member' : 'Guest participant', initials: author.split(/\s+/).slice(0, 2).map(word => word[0]).join(''), createdAt: row.created_at, source: 'community', signals: [] };
  }) });
};

export const POST: APIRoute = async context => {
  if (!sameOrigin(context.request, origin(context))) return json({ error: 'Request not allowed.' }, 403);
  const user = await currentUser(context);
  if (!databaseReady()) return json({ error: 'Community sharing is being connected.' }, 503);
  try {
    const raw=await context.request.text();if(raw.length>4000)return json({error:'Comment too long.'},413);
    const body = JSON.parse(raw);
    if (!thoughtfulComment(body.response) || typeof body.slug !== 'string') return json({ error: 'Please share a thoughtful observation of 7–150 words.' }, 400);
    if(!user){
      if(!validId(body.requestId))return json({error:'Please reload this comment box.'},400);
      const address=context.clientAddress;if(!address)return json({error:'Guest sharing is unavailable. Please sign in.'},503);
      if(!await allowRequest(address,'guest-comment-network',3,3600))return json({error:'Please wait before submitting another guest comment, or sign in.'},429);
      const hash=guestToken(context,true);if(!hash)throw Error();
      const db=database(),r=await db.rpc('cw_submit_guest_comment',{p_id:body.requestId,p_slug:body.slug,p_hash:hash,p_message:body.response.trim()});if(r.error)throw r.error;
      const published=await db.from('project_experiences').update({moderation_status:'published'}).eq('id',r.data).eq('project_slug',body.slug).eq('guest_hash',hash).neq('moderation_status','hidden').select('id').maybeSingle();
      if(published.error)throw published.error;if(!published.data)return json({error:'This comment is not available.'},409);
      return json({saved:true,guest:true,duplicate:r.data!==body.requestId,message:r.data===body.requestId?'Your comment is now public.':'You already posted a comment for this app. Your original comment is public.'});
    }
    if (!await allowRequest(user.id, 'experiences')) return json({error:'Please wait a minute before trying again.'},429);
    const member = await ensureMember(user);
    const db = database();
    const project = await db.from('projects').select('slug').eq('slug', body.slug).eq('listing_status', 'published').maybeSingle();
    if (!project.data) return json({ error: 'Project not found.' }, 404);
    const existing=await db.from('project_experiences').select('moderation_status').eq('project_slug',body.slug).eq('author_user_id',member.id).maybeSingle();
    if(existing.error)throw existing.error;if(existing.data?.moderation_status==='hidden')return json({error:'This comment cannot be republished.'},409);
    const result = await db.from('project_experiences').upsert({ project_slug: body.slug, author_user_id: member.id, response: body.response.trim(), moderation_status: 'published' }, { onConflict: 'project_slug,author_user_id' }).select('id').single();
    if (result.error) throw result.error;
    return json({ saved: true, message: 'Your comment is now public.' });
  } catch { return json({ error: 'Your experience could not be sent. Please try again.' }, 503); }
};
