import type {APIRoute} from 'astro';
import {json,origin} from '../../server/auth';
import {database,databaseReady} from '../../server/database';
import {sameOrigin} from '../../server/security.mjs';
import {guestToken} from '../../server/guest-comments';
import {allowRequest} from '../../server/abuse';
import {quickFeedbackInput} from '../../server/quick-feedback.mjs';
export const POST:APIRoute=async context=>{
 if(!sameOrigin(context.request,origin(context)))return json({error:'Request not allowed.'},403);
 if(!databaseReady())return json({error:'Quick responses are not connected yet. Your choices have not been sent.'},503);
 try{
  const raw=await context.request.text();if(raw.length>2000)return json({error:'Request too large.'},413);
  let body;try{body=JSON.parse(raw);}catch{return json({error:'Invalid response.'},400);}
  const input=quickFeedbackInput(body);if(!input)return json({error:'Choose at least one of the listed options.'},400);
  if(!context.clientAddress||!await allowRequest(context.clientAddress,'quick-feedback',10,3600))return json({error:'Please wait before sending another response.'},429);
  const db=database();
  const project=await db.from('projects').select('slug,owner_user_id').eq('slug',input.project_slug).eq('listing_status','published').eq('visibility','public').maybeSingle();
  if(project.error)throw project.error;
  if(!project.data?.owner_user_id)return json({error:'This app is not accepting quick responses.'},404);
  const hash=guestToken(context,true);if(!hash)throw Error();
  const result=await db.from('quick_app_feedback').insert({...input,visitor_hash:hash});
  if(result.error?.code==='23505')return json({ok:true,duplicate:true,message:'A response has already been recorded. Your choices have not replaced it.'});
  if(result.error)throw result.error;
  return json({ok:true,message:'Thanks! Your response was shared privately with the creator.'});
 }catch{return json({error:'Your response could not be confirmed. Your choices are still here; please try again.'},503);}
};
