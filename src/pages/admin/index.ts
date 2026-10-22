import type { APIRoute } from 'astro';
import { adminUser, htmlEscape as e } from '../../server/admin';
import { currentUser, env } from '../../server/auth';
import { database } from '../../server/database';

import {adminSurface} from '../../server/feedback-ui';
const sections = ['overview','comments','people','projects','verification','activity'];
const labels = ['Overview','Public comments','People','App review','Verification','Activity log'];
function page(content:string,section:string,status=200) { return adminSurface(labels[sections.indexOf(section)]||'Administration',content,section,status); }
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
  let body = '';
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
      body += `<div class="admin-queue-intro"><div><strong>Public comment moderation</strong><p>Review what appears publicly on app pages.</p></div><span>${result.count||0} ${filter}</span></div><nav class="admin-nav admin-segmented" aria-label="Comment status">${['pending','published','hidden'].map(s=>`<a href="/admin?section=comments&status=${s}" ${s===filter?'aria-current="page"':''}>${s==='pending'?'Awaiting review':s==='published'?'Published':'Hidden'}</a>`).join('')}</nav>`;
      const ids = [...new Set(result.data.map(r=>r.author_user_id).filter(Boolean))];
      const profiles = ids.length ? await db.from('profiles').select('user_id,display_name').in('user_id',ids) : {data:[],error:null};
      if(profiles.error) throw new Error();
      body += `<div class="admin-moderation-list">${result.data.length ? result.data.map(r=>{const name=profiles.data?.find(p=>p.user_id===r.author_user_id)?.display_name || (r.author_user_id?'Member':'Guest'),initials=name.split(/\s+/).slice(0,2).map((x:string)=>x[0]).join('').toUpperCase();return `<article class="admin-comment-row moderation-row"><span class="admin-member-avatar" aria-hidden="true">${e(initials)}</span><div class="moderation-copy"><header><strong>${e(name)}</strong><span class="admin-app-chip">${e(r.project_slug)}</span><time>${when(r.created_at)}</time></header><p class="admin-comment">${e(r.response)}</p></div><details class="project-actions"><summary aria-label="Review comment">Review</summary><div class="project-action-menu"><strong>Moderation decision</strong><form action="/api/admin/review" method="post"><input type="hidden" name="id" value="${e(r.id)}"><input type="hidden" name="previous" value="${e(r.moderation_status)}"><input type="hidden" name="expected" value="${e(r.response)}"><label>Decision<select name="status"><option value="published">Publish</option><option value="hidden">Hide</option><option value="pending">Return to review</option></select></label><label>Reason for your decision<input name="reason" minlength="3" maxlength="300" required placeholder="Why this decision?"></label><label class="cw-choice"><input type="checkbox" name="confirm" value="yes" required> I reviewed this comment.</label><button class="primary-button" type="submit">Save decision</button></form></div></details></article>`;}).join('') : '<div class="admin-empty-state"><span aria-hidden="true">✓</span><strong>No comments here</strong><p>This moderation queue is clear.</p></div>'}</div>`;
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
      body += `<section class="admin-review-queue"><header><div><h2>Awaiting review</h2><p>Publishing makes an app discoverable in the catalog and on its creator’s profile.</p></div><span>${queue.data.length}</span></header>${queue.data.length?queue.data.map(r=>`<article class="admin-app-review"><div class="admin-app-review-preview">${r.preview_public_url?`<img src="${e(r.preview_public_url)}" alt="Preview of ${e(r.title||'app')}">`:'<span aria-hidden="true">▦</span>'}</div><div><span class="admin-app-chip">${e(r.category||'Uncategorized')}</span><h3>${e(r.title||'Untitled')}</h3><p>${e(r.summary||'No summary provided.')}</p><small>${e(ownerName(r.owner_user_id))}</small></div><a class="primary-button" href="/admin/project?slug=${encodeURIComponent(r.slug)}">Review app →</a></article>`).join(''):'<div class="admin-empty-state"><span aria-hidden="true">✓</span><strong>No apps waiting</strong><p>The publication queue is clear.</p></div>'}</section>`;
      const result = await db.from('projects').select('slug,title,visibility,listing_status,owner_user_id,ownership_status',{count:'exact'}).order('title').order('id').range(offset,offset+24);
      if(result.error) throw new Error();
      body += `<section class="admin-records"><header><div><h2>All apps</h2><p>${result.count||0} database records</p></div></header><div class="admin-record-list">${result.data.map(r=>`<a class="admin-record-row" href="/admin/project?slug=${encodeURIComponent(r.slug)}"><span class="admin-record-icon" aria-hidden="true">${e((r.title||'A').slice(0,1).toUpperCase())}</span><span><strong>${e(r.title)}</strong><small>${r.owner_user_id?'Creator assigned':'No member owner'}</small></span><em class="admin-status ${e(r.listing_status||r.visibility)}">${e(r.listing_status||r.visibility)}</em><b aria-hidden="true">›</b></a>`).join('')}</div></section>`+pagination(section,offset,result.count||0);
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
