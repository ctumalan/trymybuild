import type { APIRoute } from 'astro';
import { adminUser } from '../../server/admin';
import { database } from '../../server/database';
import { surface, adminSurface, unavailable, e, signals, pageNumber, pages } from '../../server/feedback-ui';
export const GET:APIRoute=async context=>{
 if(!await adminUser(context))return surface('Private administration','<h1>Administrator access required.</h1>','',403);
 try{
  const db=database(),page=pageNumber(context.url.searchParams.get('page'));
  const historyView=context.url.searchParams.get('view')==='history';
  let html=`<div class="admin-queue-intro"><div><strong>Public creator feedback</strong><p>Only feedback intentionally shared in public enters this queue.</p></div></div><nav class="cw-row admin-segmented"><a href="/admin/feedback" ${!historyView?'aria-current="page"':''}>Review queue</a><a href="/admin/feedback?view=history" ${historyView?'aria-current="page"':''}>Decision history</a></nav>`;
  if(context.url.searchParams.has('notice'))html+='<p class="cw-notice" role="status">'+(context.url.searchParams.get('notice')==='saved'?'Decision saved and recorded.':'The decision was not confirmed. Reload before trying again.')+'</p>';
  if(historyView){
   const result=await db.from('feedback_review_history').select('id,feedback_id,actor_user_id,previous_status,new_status,reason,created_at',{count:'exact'}).order('created_at',{ascending:false}).order('id').range(page*25,page*25+24);
   if(result.error)throw result.error;
   html+=`<div class="admin-activity-list">${result.data.map(r=>`<article class="admin-activity-row"><span class="admin-activity-icon" aria-hidden="true">✓</span><div><strong>${e(r.previous_status)} → ${e(r.new_status)}</strong><p>${e(r.reason)}</p><small>Feedback ${e(r.feedback_id)}</small></div><time>${e(new Date(r.created_at).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}))}</time></article>`).join('')||'<div class="admin-empty-state"><span aria-hidden="true">✓</span><strong>No decisions yet</strong><p>Completed reviews will appear here.</p></div>'}</div>`;
   html+=pages('/admin/feedback?view=history',page,result.count||0);
  }else{
   const status=['pending','published','hidden'].includes(context.url.searchParams.get('status')||'')?context.url.searchParams.get('status')!:'pending';
   html+=`<nav class="admin-inline-tabs">${['pending','published','hidden'].map(s=>`<a href="/admin/feedback?status=${s}" ${s===status?'aria-current="page"':''}>${s}</a>`).join('')}</nav><p class="admin-context-note">Private feedback never appears here and cannot be published.</p>`;
   const result=await db.from('creator_feedback').select('*',{count:'exact'}).eq('visibility','public').eq('moderation_status',status).order('created_at',{ascending:false}).order('id').range(page*25,page*25+24);
   if(result.error)throw result.error;
   html+=`<div class="admin-feedback-list">${result.data.map(row=>`<article class="admin-feedback-review"><header><div><span class="admin-app-chip">${e(row.project_slug)}</span><h2>Community member</h2><small>${e(new Date(row.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}))} · Self-reported experience</small></div><em class="admin-status ${e(row.moderation_status)}">${e(row.moderation_status)}</em></header>${signals(row)}${row.message?`<blockquote>${e(row.message)}</blockquote>`:''}<form class="admin-decision-form" action="/api/admin/feedback-review" method="post"><input type="hidden" name="id" value="${e(row.id)}"><input type="hidden" name="previous" value="${e(row.moderation_status)}"><label>Decision<select name="status" required><option value="">Choose a decision</option><option value="published">Publish</option><option value="hidden">Hide</option><option value="pending">Return to review</option></select></label><label>Reason<input type="text" name="reason" minlength="3" maxlength="300" required placeholder="Why this decision?"></label><label class="cw-choice"><input type="checkbox" name="confirm" value="yes" required> I reviewed this feedback.</label><button class="primary-button" type="submit">Save decision</button></form></article>`).join('')||'<div class="admin-empty-state"><span aria-hidden="true">✓</span><strong>No feedback here</strong><p>This review queue is clear.</p></div>'}</div>`;
   html+=pages('/admin/feedback?status='+status,page,result.count||0);
  }
  return adminSurface('Feedback review',html,'feedback');
 }catch{return unavailable();}
};
