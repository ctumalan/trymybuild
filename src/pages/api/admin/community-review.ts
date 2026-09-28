import type {APIRoute} from 'astro';
import {adminUser} from '../../../server/admin';
import {origin} from '../../../server/auth';
import {database,ensureMember} from '../../../server/database';
import {sameOrigin} from '../../../server/security.mjs';
import {validId} from '../../../server/feedback-policy.mjs';
export const POST:APIRoute=async context=>{
 if(!sameOrigin(context.request,origin(context)))return new Response('Forbidden',{status:403});const user=await adminUser(context);if(!user)return new Response('Administrator access required',{status:403});
 let kind='credits';try{const raw=await context.request.text();if(raw.length>2000)throw Error();const f=Object.fromEntries(new URLSearchParams(raw));kind=['daily','wishes'].includes(f.kind)?f.kind:'credits';if(!validId(f.id)||!f.reason||f.reason.length>300)throw Error();const actor=await ensureMember(user);
  const r=kind==='wishes'?await database().rpc('cw_review_wish',{p_actor:actor.id,p_founder:user.id,p_id:f.id,p_revision:Number(f.revision),p_status:f.status,p_reason:f.reason.trim()}):kind==='daily'?await database().rpc('cw_daily_review',{p_actor:actor.id,p_id:f.id,p_previous:f.previous,p_status:f.status,p_reason:f.reason.trim()}):await database().rpc('cw_credit_review',{p_actor:actor.id,p_feedback:f.id,p_status:f.status,p_reason:f.reason.trim(),p_revision:Number(f.revision)});
  return context.redirect(`/admin/community?kind=${kind}&${r.error?'error':'saved'}=1`,303);
 }catch{return context.redirect(`/admin/community?kind=${kind}&error=1`,303);}
};
