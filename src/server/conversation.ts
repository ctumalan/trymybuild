import {randomUUID} from 'node:crypto';
import {e,feedbackCard,pages,pageNumber} from './feedback-ui';
import {replyComposer} from './dashboard-cards';
import {threadAccess} from './feedback-policy.mjs';
export async function conversation(db:any,userId:string,id:string,url:URL) {
 const item=await db.from('creator_feedback').select('*').eq('id',id).maybeSingle();if(item.error)throw item.error;
 const f=item.data;if(!f)return null;
 const result=await db.from('projects').select('title,owner_user_id').eq('slug',f.project_slug).maybeSingle();if(result.error)throw result.error;
 const project=result.data;if(!project||!threadAccess(userId,f.author_user_id,project.owner_user_id))return null;
 const page=pageNumber(url.searchParams.get('page'));
 const [replyResult,profileResult,qualification,ratingResult]=await Promise.all([
  db.from('feedback_replies').select('id,author_user_id,message,created_at',{count:'exact'}).eq('feedback_id',id).order('created_at',{ascending:false}).order('id').range(page*25,page*25+24),
  db.from('profiles').select('user_id,display_name').in('user_id',[f.author_user_id,project.owner_user_id].filter(Boolean)),
  db.from('feedback_qualifications').select('status,reason').eq('feedback_id',id).maybeSingle(),
  db.from('feedback_ratings').select('total,reason,revision').eq('feedback_id',id).maybeSingle()
 ]);
 if([replyResult,profileResult,qualification,ratingResult].some(r=>r.error))throw Error('Conversation unavailable');
 const name=(uid:string)=>profileResult.data.find((p:any)=>p.user_id===uid)?.display_name||'Member';
 const rating=ratingResult.data,qualified=qualification.data?.status==='qualified';
 const report=(reply='')=>`<details class="cw-panel"><summary>Report ${reply?'reply':'feedback'}</summary><form method="post" action="/api/messages"><input type="hidden" name="action" value="report"><input type="hidden" name="id" value="${e(id)}"><input type="hidden" name="reply" value="${e(reply)}"><input type="hidden" name="requestId" value="${randomUUID()}"><label>What should our moderators review?<textarea name="reason" minlength="10" maxlength="1000" required></textarea></label><p class="cw-meta">Reports are reviewed, not automatically punished. Honest criticism is allowed.</p><button class="secondary-button">Send report</button></form></details>`;
 const latest=replyResult.data[0]?.created_at||f.created_at;
 const read=page===0?`<form data-mark-thread-read action="/api/messages" method="post"><input type="hidden" name="action" value="read"><input type="hidden" name="id" value="${e(id)}"><input type="hidden" name="seenThrough" value="${e(latest)}"></form>`:'';
 return `<section data-conversation-content aria-label="Selected conversation"><a href="/projects/${e(f.project_slug)}">View project</a>${feedbackCard(f,project.title,name(f.author_user_id),false)}${report()}${rating?.total>1?`<p class="cw-notice">${rating.total===5?'Useful':'Made a difference'} · ${e(rating.reason)}</p>`:''}
 ${userId===project.owner_user_id&&qualified&&(rating?.total||1)<10?`<details class="cw-panel"><summary>Recognize this feedback</summary><p>Your recognition is optional. Tell the reviewer what helped you, not whether their feedback praised your app.</p><form method="post" action="/api/messages"><input type="hidden" name="action" value="rate"><input type="hidden" name="id" value="${e(id)}"><input type="hidden" name="revision" value="${rating?.revision||0}"><label>Impact<select name="total" required>${(rating?.total||1)<5?'<option value="5">Useful</option>':''}<option value="10">Made a difference</option></select></label><label>What did it help you improve?<textarea name="reason" minlength="10" maxlength="300" required></textarea></label><p><a href="/dashboard/community#credit-rules">Participation guidelines</a></p><button class="primary-button">Recognize feedback</button></form></details>`:''}
 <section class="cw-panel"><h3>Conversation</h3><p class="cw-meta">Replies stay between you and the creator. Moderators may access reported conversations for safety and support.</p>${[...replyResult.data].reverse().map((r:any)=>`<article class="cw-reply"><strong>${e(name(r.author_user_id))}</strong><p class="cw-message">${e(r.message)}</p><small>${e(new Date(r.created_at).toLocaleString('en-US'))}</small>${r.author_user_id!==userId?report(r.id):''}</article>`).join('')||'<p>No replies yet.</p>'}${pages('/dashboard/messages?thread='+id,page,replyResult.count||0)}
 ${replyComposer(id,randomUUID())}</section>${read}</section>`;
}
