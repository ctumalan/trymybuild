import {e} from './feedback-ui';
export async function activeFeedbackRequest(db:any,slug:string){
 try{
  const result=await db.from('feedback_requests').select('id,user_id,project_slug,question,created_at,status').eq('project_slug',slug).eq('status','queued').order('created_at',{ascending:false}).limit(1).maybeSingle();
  return result.error?null:result.data;
 }catch{return null;}
}
export async function requestState(db:any,user:string,slugs:string[]){
 if(!slugs.length)return (p:any)=>({...p,feedbackRequest:''});
 const requests=await db.from('feedback_requests').select('id,project_slug').eq('user_id',user).eq('status','queued').in('project_slug',slugs);
 if(requests.error)throw Error('Request status unavailable');
 return (p:any)=>({...p,feedbackRequest:requests.data.find((r:any)=>r.project_slug===p.slug)?.id||''});
}
export function feedbackRequestAction(p:any){
 if(p.listing_status!=='published')return '<span class="cw-meta">Publish before requesting feedback</span>';
 if(!p.feedbackRequest)return `<a href="/dashboard/request-feedback?project=${encodeURIComponent(p.slug)}">Request feedback</a>`;
 return `<form method="post" action="/api/community-credits" data-credit-request><input type="hidden" name="id" value="${e(p.feedbackRequest)}"><input type="hidden" name="slug" value="${e(p.slug)}"><input type="hidden" name="action" value="cancel"><input type="hidden" name="returnTo" value="projects"><button>Cancel feedback request</button></form>`;
}

export function trialBrief(p:any,request:any){
 if(!request?.question)return '';
 const creator=p.creator||{},name=creator.name||p.creatorName||'The maker',avatar=creator.avatar||p.creatorAvatar||'',initials=String(name).split(/\s+/).filter(Boolean).slice(0,2).map((part:string)=>part[0]).join('').toUpperCase()||'M';
 const task=p.presentation?.firstTry||p.firstTry||'Try the main feature and notice what happens.';
 return `<section class="trial-brief" aria-labelledby="trial-brief-title"><div class="trial-maker">${avatar?`<img src="${e(avatar)}" alt="${e(name)}">`:`<span aria-hidden="true">${e(initials)}</span>`}<div><p class="eyebrow">A short trial with a real maker</p><h2 id="trial-brief-title">${e(name)} wants your perspective.</h2></div></div><dl><div><dt>Try this</dt><dd>${e(task)}</dd></div><div><dt>Time</dt><dd>About 5–10 minutes</dd></div><div><dt>The maker wants to learn</dt><dd>${e(request.question)}</dd></div></dl><p class="trial-reply-promise">${e(name)} has committed to replying within two days.</p></section>`;
}
