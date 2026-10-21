import type {APIRoute} from 'astro';
import {memberContext} from '../../server/workspace';
import {origin} from '../../server/auth';
import {sameOrigin} from '../../server/security.mjs';
import {allowRequest} from '../../server/abuse';
import {validId,validSlug} from '../../server/feedback-policy.mjs';
import {publicProfile} from '../../server/public-profile';
export const POST:APIRoute=async context=>{
 if(!sameOrigin(context.request,origin(context)))return new Response('Forbidden',{status:403});
 try{
  const m=await memberContext(context);if(!m||!m.user.emailVerified)return new Response('Sign in with a verified email.',{status:401});
  if(!await allowRequest(m.user.id,'maker-exchange',10))return new Response('Please wait a minute.',{status:429});
  const raw=await context.request.text();if(raw.length>2000)return new Response('Too large',{status:413});
  const f=Object.fromEntries(new URLSearchParams(raw));
  if(!validId(f.id)||!['join','request','leave'].includes(f.action))return new Response('Choose an exchange action.',{status:400});
  let result;
  if(['join','request'].includes(f.action)){
   const question=(f.question||'').trim();
   if(!validSlug(f.slug)||question.length<10||question.length>300)return new Response('Choose your app and ask one question of 10–300 characters.',{status:400});
   if(f.exchangeCommitment!=='on'||f.responseCommitment!=='on')return new Response('Agree to share firsthand feedback and reply to your maker.',{status:400});
   if(f.action==='request'&&f.partner!=='queue'){
    if(!validSlug(f.partner||''))return new Response('Choose an available feedback partner.',{status:400});
    const [partner,project]=await Promise.all([
     publicProfile(m.db,f.partner),
     m.db.from('projects').select('slug,title,first_try').eq('slug',f.slug).eq('owner_user_id',m.member.id).eq('listing_status','published').eq('visibility','public').maybeSingle()
    ]);
    if(!partner?.user_id||partner.user_id===m.member.id||project.error||!project.data)return new Response('This feedback partner is no longer available.',{status:409});
    const first=String(partner.display_name||'there').split(/\s+/)[0],url=new URL('/projects/'+encodeURIComponent(project.data.slug)+'?invite=1',origin(context)).href;
    const message=`Hi ${first}! I’d like to request a feedback swap for ${project.data.title}. ${project.data.first_try?`A good place to start is: ${project.data.first_try}. `:''}I’d especially like to learn: ${question} I’ll try your app too and reply when you share feedback. ${url}`;
    result=await m.db.rpc('cw_send_direct_message',{p_actor:m.member.id,p_recipient:partner.user_id,p_request:f.id,p_message:message});
    if(result.error)return context.redirect('/dashboard/exchange?error=1',303);
    return context.redirect('/dashboard/messages?direct='+encodeURIComponent(result.data)+'&saved=1',303);
   }
   result=await m.db.rpc('cw_join_maker_exchange',{p_user:m.member.id,p_id:f.id,p_slug:f.slug,p_question:question});
  }else result=await m.db.rpc('cw_leave_maker_exchange',{p_user:m.member.id,p_id:f.id});
  return context.redirect('/dashboard/exchange?'+(result.error?'error':'saved')+'=1',303);
 }catch{return context.redirect('/dashboard/exchange?error=1',303);}
};
