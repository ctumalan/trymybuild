import type {APIRoute} from 'astro';
import {memberContext} from '../../server/workspace';
import {origin} from '../../server/auth';
import {sameOrigin} from '../../server/security.mjs';
import {allowRequest} from '../../server/abuse';
import {validId,validSlug} from '../../server/feedback-policy.mjs';
export const POST:APIRoute=async context=>{
 if(!sameOrigin(context.request,origin(context)))return new Response('Forbidden',{status:403});
 try{const m=await memberContext(context);if(!m||!m.user.emailVerified)return new Response('Sign in with a verified email.',{status:401});if(!await allowRequest(m.user.id,'community-credits',10))return new Response('Please wait a minute.',{status:429});
  const raw=await context.request.text();if(raw.length>2000)return new Response('Too large',{status:413});const f=Object.fromEntries(new URLSearchParams(raw));if(!validId(f.id)||!['create','cancel'].includes(f.action)||!validSlug(f.slug))return context.redirect('/dashboard/community?error=1',303);
  const back=f.returnTo==='projects'?'/dashboard?view=creator&':'/dashboard/community?';
  const question=(f.question||'').trim();if(f.action==='create'&&(question.length<10||question.length>300))return new Response('Ask one specific question of 10–300 characters.',{status:400});
  if(f.action==='create'&&f.responseCommitment!=='on')return new Response('Commit to replying to each tester within two days.',{status:400});
  const r=await m.db.rpc('cw_launch_feedback_request',{p_user:m.member.id,p_id:f.id,p_slug:f.slug,p_action:f.action,p_question:question});return context.redirect(back+(r.error?'error':'saved')+'=1',303);
 }catch{return context.redirect('/dashboard/community?error=1',303);}
};
