import type { APIRoute } from 'astro';
import { adminUser, htmlEscape as e } from '../../server/admin';
import { currentUser, env } from '../../server/auth';
import { database } from '../../server/database';

import {adminSurface} from '../../server/feedback-ui';
const sections = ['overview','comments','people','projects','verification','activity'];
const labels = ['Overview','Conversations','People','Projects','Verification','Activity'];
function page(content:string,section:string,status=200) { return adminSurface('Administration',content,section,status); }
const when = (value: string) => e(new Date(value).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

export const GET: APIRoute = async context => {
  const admin = await adminUser(context);
  if (!admin) {
    const user = await currentUser(context);
    if (!user) return page('<h1>Private administration</h1><p>Sign in with your founder account, then return here.</p><a class="primary-button" href="/auth/sign-in">Sign in</a>', '', 401);
    // Shows only the current person's identity, never another account or the configured founder ID.
    return page(`<h1>Administrator access required</h1><p>This account does not have administrative access.</p>${!env('FOUNDER_WORKOS_USER_ID') ? `<div class="admin-card"><h2>Founder setup</h2><p>To identify your account for setup, share this account ID in your TryMyBuild project conversation. This page cannot grant access.</p><code>${e(user.id)}</code><p>Signed in as ${e(user.email)}</p></div>` : ''}`, '', 403);
  }
  const section = sections.includes(context.url.searchParams.get('section') || '') ? context.url.searchParams.get('section')! : 'overview';
  const rawPage = Number(context.url.searchParams.get('page') || 0);
  const offset = (Number.isSafeInteger(rawPage) && rawPage >= 0 && rawPage < 100000 ? rawPage : 0) * 25;
  const db = database();
  let body = `<h1>${labels[sections.indexOf(section)]}</h1>`;
  const notice = context.url.searchParams.get('notice');
  if (notice) body += `<p class="admin-note" role="status">${notice === 'approval-email-failed' ? 'The project was published, but its confirmation email could not be sent. Check the email service configuration. Do not approve it again just to retry the email.' : notice === 'saved' ? 'Decision saved and recorded in the activity history.' : 'Nothing was confirmed. Reload and try again: the comment may have changed, or the review database setup may be incomplete.'}</p>`;
  try {
    if (section === 'overview') {
      const results = await Promise.all([db.from('users').select('id',{count:'exact',head:true}),db.from('projects').select('id',{count:'exact',head:true}),db.from('project_experiences').select('id',{count:'exact',head:true}).eq('moderation_status','pending'),db.from('projects').select('id',{count:'exact',head:true}).eq('listing_status','in_review')]);
      if (results.some(r=>r.error)) throw new Error();
      body += `<div class="admin-stats">${results.map((r,i)=>`<article class="admin-card"><strong>${r.count ?? 0}</strong>${['Registered accounts','Project records','Comments awaiting review','Listings awaiting review'][i]}</article>`).join('')}</div><section class="admin-card"><h2>What needs your attention?</h2><p>Review listings submitted for publication and comments waiting for review. Publishing a listing makes it publicly discoverable; publishing a comment makes its text and author’s display name visible.</p><a class="primary-button" href="/admin?section=projects">Review listings →</a> <a class="primary-button" href="/admin?section=comments">Review conversations →</a></section><p>Counts are real database records, not active-user or adoption estimates. Dates are shown in Pacific time.</p>`;
    } else if (section === 'comments') {
      const filter = ['pending','published','hidden'].includes(context.url.searchParams.get('status') || '') ? context.url.searchParams.get('status')! : 'pending';
      const result = await db.from('project_experiences').select('id,project_slug,author_user_id,response,moderation_status,created_at',{count:'exact'}).eq('moderation_status',filter).order('created_at',{ascending:false}).order('id').range(offset,offset+24);
      if (result.error) throw new Error();
      body += `<nav class="admin-nav" aria-label="Comment status">${['pending','published','hidden'].map(s=>`<a href="/admin?section=comments&status=${s}" ${s===filter?'aria-current="page"':''}>${s==='pending'?'Awaiting review':s==='published'?'Published':'Hidden'}</a>`).join('')}</nav>`;
      const ids = [...new Set(result.data.map(r=>r.author_user_id).filter(Boolean))];
      const profiles = ids.length ? await db.from('profiles').select('user_id,display_name').in('user_id',ids) : {data:[],error:null};
      if(profiles.error) throw new Error();
      body += result.data.length ? result.data.map(r=>`<article class="admin-card moderation-row"><div class="moderation-copy"><strong>${e(profiles.data?.find(p=>p.user_id===r.author_user_id)?.display_name || (r.author_user_id?'Member':'Guest'))} · ${e(r.project_slug)}</strong><small>${when(r.created_at)} · ${e(r.moderation_status)}</small><details><summary>${e(r.response.slice(0,110))}</summary><p class="admin-comment">${e(r.response)}</p></details></div><details class="project-actions"><summary aria-label="Moderation actions">⋯</summary><div class="project-action-menu"><form action="/api/admin/review" method="post"><input type="hidden" name="id" value="${e(r.id)}"><input type="hidden" name="previous" value="${e(r.moderation_status)}"><input type="hidden" name="expected" value="${e(r.response)}"><label>Decision<select name="status"><option value="published">Publish</option><option value="hidden">Hide</option><option value="pending">Return to review</option></select></label><label>Reason for your decision<input name="reason" minlength="3" maxlength="300" required placeholder="For example: Relevant question about this project"></label><label><input type="checkbox" name="confirm" value="yes" required> I have reviewed this comment and confirm my decision.</label><button class="primary-button" type="submit">Save decision</button></form></div></details></article>`).join('') : '<p class="admin-card">No comments in this queue.</p>';
      body += pagination(section, offset, result.count || 0, `&status=${filter}`);
    } else if (section === 'people') {
      const result = await db.from('profiles').select('slug,display_name,identity_label,is_public,created_at',{count:'exact'}).order('created_at',{ascending:false}).order('slug').range(offset,offset+24);
      if(result.error) throw new Error();
      body += `<p>Member profiles. Public labels do not grant permissions. Account suspension is not available in this first release.</p><div class="admin-card admin-table"><table><thead><tr><th>Name</th><th>Label</th><th>Profile visibility</th><th>Joined</th></tr></thead><tbody>${result.data.map(r=>`<tr><td>${e(r.display_name)}</td><td>${e(r.identity_label)}</td><td>${r.is_public?'Public':'Private'}</td><td>${when(r.created_at)}</td></tr>`).join('')}</tbody></table></div>`+pagination(section,offset,result.count||0);
    } else if (section === 'projects') {
      // Listings creators submitted for publication — approve to make them public, or return them.
      const queue = await db.from('projects').select('id,slug,title,category,summary,external_url,preview_public_url,owner_user_id,listing_status,lock_version,submitted_at').eq('listing_status','in_review').order('submitted_at',{ascending:true}).order('id');
      if(queue.error) throw new Error();
      const ownerIds=[...new Set(queue.data.map(r=>r.owner_user_id).filter(Boolean))];
      const ownerProfiles=ownerIds.length?await db.from('profiles').select('user_id,display_name').in('user_id',ownerIds):{data:[],error:null};
      if(ownerProfiles.error) throw new Error();
      const ownerName=(id:string)=>ownerProfiles.data?.find(p=>p.user_id===id)?.display_name||'A member';
      body += `<section class="admin-card"><h2>Listings awaiting review (${queue.data.length})</h2><p>Approving a listing makes it publicly discoverable across the catalog, search, and its creator’s profile. This confirms it can be shown publicly; it is not a quality or ownership guarantee, and it does not grant a verification badge.</p>${queue.data.length?queue.data.map(r=>`<article class="admin-card"><strong>${e(r.title||'Untitled')} · ${e(r.category||'Uncategorized')}</strong><p>${e(r.summary||'')}</p><a href="/admin/project?slug=${encodeURIComponent(r.slug)}">Review all project details and video →</a><p class="admin-comment">Creator: ${e(ownerName(r.owner_user_id))} · Link: ${e(r.external_url||'—')}</p>${r.preview_public_url?`<p><img src="${e(r.preview_public_url)}" alt="Preview of ${e(r.title||'listing')}" style="max-width:320px;border-radius:8px"></p>`:'<p class="admin-comment">No preview image.</p>'}<form action="/api/admin/project-review" method="post"><input type="hidden" name="id" value="${e(r.id)}"><input type="hidden" name="previous" value="${e(r.listing_status)}"><input type="hidden" name="version" value="${e(r.lock_version)}"><label>Decision<select name="status"><option value="published">Publish (make public)</option><option value="draft">Return to the creator as a draft</option></select></label><label>Reason (optional, shown only in your records)<input name="reason" maxlength="300" placeholder="For example: Looks good; publishing."></label><label><input type="checkbox" name="confirm" value="yes" required> I reviewed this listing and confirm my decision.</label><button class="primary-button" type="submit">Save decision</button></form></article>`).join(''):'<p>No listings are waiting for review.</p>'}</section>`;
      const result = await db.from('projects').select('slug,title,visibility,listing_status,owner_user_id,ownership_status',{count:'exact'}).order('title').order('id').range(offset,offset+24);
      if(result.error) throw new Error();
      body += '<h2>All project records</h2><p>The full database inventory. The public catalog now reads from these records.</p><div class="admin-card admin-table"><table><thead><tr><th>Project</th><th>Publication status</th><th>Account ownership</th></tr></thead><tbody>'+result.data.map(r=>`<tr><td><a href="/admin/project?slug=${encodeURIComponent(r.slug)}">${e(r.title)}</a></td><td>${e(r.listing_status||r.visibility)}</td><td>${r.owner_user_id?'Assigned':'Not attached to a member account'}</td></tr>`).join('')+'</tbody></table></div>'+pagination(section,offset,result.count||0);
    } else if (section === 'verification') {
      body += '<section class="admin-card"><h2>TryMyBuild Studio</h2><p>Founder-confirmed identity and control of the eleven in-house projects, September 4, 2026.</p><p>This is not independent verification or a product-quality guarantee. The existing badge is a catalog designation, not an administrator permission.</p><p>Granting verification to additional creators requires a separate review workflow. No badge can be purchased or self-selected here.</p></section>';
    } else {
      const result = await db.from('admin_activity').select('id,actor_user_id,target_id,action,previous_status,new_status,reason,created_at',{count:'exact'}).order('created_at',{ascending:false}).order('id').range(offset,offset+24);
      if(result.error) throw new Error();
      body += result.data.length ? result.data.map(r=>`<article class="admin-card"><strong>${e(r.action)} · ${e(r.previous_status)} → ${e(r.new_status)}</strong><p>${e(r.reason)}</p><small>${when(r.created_at)} · Actor ${e(r.actor_user_id)} · Comment ${e(r.target_id)}</small></article>`).join('') : '<p class="admin-card">No administrator decisions recorded yet.</p>';
      body += pagination(section,offset,result.count||0);
    }
    return page(body,section);
  } catch { return page(body+'<p class="admin-note" role="alert">This information could not be loaded. The dashboard database setup may be incomplete. No information has been changed. Please try again.</p>',section,503); }
};
function pagination(section: string, offset: number, count: number, extra = '') {
  return `<nav class="admin-pages" aria-label="Pages">${offset ? `<a href="/admin?section=${section}&page=${offset/25-1}${extra}">← Previous</a>` : ''}<span>${count ? `${offset+1}–${Math.min(offset+25,count)} of ${count}` : '0 records'}</span>${offset+25<count?`<a href="/admin?section=${section}&page=${offset/25+1}${extra}">Next →</a>`:''}</nav>`;
}
