import {e} from './feedback-ui';
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
