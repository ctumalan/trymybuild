import type {APIRoute} from 'astro';
import {memberContext} from '../../server/workspace';
import {origin} from '../../server/auth';
import {sameOrigin} from '../../server/security.mjs';
import {allowRequest} from '../../server/abuse';
import {validId,validSlug} from '../../server/feedback-policy.mjs';
export const POST:APIRoute=async context=>{
 if(!sameOrigin(context.request,origin(context)))return new Response('Forbidden',{status:403});
 try{
  const m=await memberContext(context);if(!m||!m.user.emailVerified)return new Response('Sign in with a verified email.',{status:401});
  if(!await allowRequest(m.user.id,'maker-exchange',10))return new Response('Please wait a minute.',{status:429});
  const raw=await context.request.text();if(raw.length>2000)return new Response('Too large',{status:413});
  const f=Object.fromEntries(new URLSearchParams(raw));
  if(!validId(f.id)||!['join','leave'].includes(f.action))return new Response('Choose an exchange action.',{status:400});
  let result;
  if(f.action==='join'){
   const question=(f.question||'').trim();
   if(!validSlug(f.slug)||question.length<10||question.length>300)return new Response('Choose your app and ask one question of 10–300 characters.',{status:400});
   if(f.exchangeCommitment!=='on'||f.responseCommitment!=='on')return new Response('Agree to share firsthand feedback and reply to your maker.',{status:400});
   result=await m.db.rpc('cw_join_maker_exchange',{p_user:m.member.id,p_id:f.id,p_slug:f.slug,p_question:question});
  }else result=await m.db.rpc('cw_leave_maker_exchange',{p_user:m.member.id,p_id:f.id});
  return context.redirect('/dashboard/exchange?'+(result.error?'error':'saved')+'=1',303);
 }catch{return context.redirect('/dashboard/exchange?error=1',303);}
};
