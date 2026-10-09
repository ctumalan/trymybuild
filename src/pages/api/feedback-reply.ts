import { allowRequest } from '../../server/abuse';
import type { APIRoute } from 'astro';
import { currentUser,origin,json } from '../../server/auth';
import { database,ensureMember } from '../../server/database';
import { sameOrigin } from '../../server/security.mjs';
import { thoughtfulComment,validId,threadAccess } from '../../server/feedback-policy.mjs';
export const POST:APIRoute=async context=>{
 if(!sameOrigin(context.request,origin(context)))return json({error:'Request not allowed.'},403);
 const user=await currentUser(context);if(!user)return json({error:'Please sign in.'},401);
 let id='';
 try{
  if(!user.emailVerified)return json({error:'Verify your email before posting.'},403);
  if(!await allowRequest(user.id,'feedback-reply'))return json({error:'Please wait a minute before trying again.'},429);
  const raw=await context.request.text();if(raw.length>262144)return json({error:'Request too large.'},413);
  const body=Object.fromEntries(new URLSearchParams(raw));
  if(!validId(body.id)||!validId(body.requestId)||!thoughtfulComment(body.message))return json({error:'Write a reply.'},400);
  id=body.id;const member=await ensureMember(user),db=database();
  const item=await db.from('creator_feedback').select('author_user_id,project_slug').eq('id',id).maybeSingle();
  if(item.error)throw item.error;
  const project=item.data?await db.from('projects').select('owner_user_id').eq('slug',item.data.project_slug).maybeSingle():{data:null,error:null};
  if(project.error)throw project.error;
  if(!item.data||!project.data||!threadAccess(member.id,item.data.author_user_id,project.data.owner_user_id))return json({error:'Conversation not found.'},404);
  const result=await db.rpc('cw_feedback_reply',{p_actor:member.id,p_id:id,p_message:body.message.trim(),p_request:body.requestId});
  if(result.error)throw result.error;
  if(context.request.headers.get('accept')?.includes('application/json'))return json({ok:true,message:'Reply sent.'});
  return context.redirect(`/dashboard/messages?thread=${id}&sent=1`,303);
 }catch{if(context.request.headers.get('accept')?.includes('application/json'))return json({error:'Your reply could not be confirmed. Your text is still here; you can retry safely.'},503);return context.redirect(id?`/dashboard/messages?thread=${id}&error=1`:'/dashboard?error=1',303);}
};
