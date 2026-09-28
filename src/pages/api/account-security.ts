import { allowRequest } from '../../server/abuse';
import type { APIRoute } from 'astro';
import { accountSession } from '../../server/account-session';
import { validProof, revokeAllSessions } from '../../server/account-security.mjs';
import { env, origin, SESSION_COOKIE, workos } from '../../server/auth';
import { sameOrigin } from '../../server/security.mjs';
import { database, ensureMember } from '../../server/database';
import { isFounder } from '../../server/admin-policy.mjs';
const resetTimes = new Map<string,number>(); // Additional per-instance throttle; provider rate limits still apply.
export const POST: APIRoute = async context => {
 const back = (notice:string) => context.redirect(`/dashboard/security?notice=${notice}`,303);
 if (!sameOrigin(context.request,origin(context))) return new Response('Forbidden',{status:403});
 try {
  const session = await accountSession(context);
  if (!session) return context.redirect('/auth/sign-in?next=%2Fdashboard%2Fsecurity',303);
  if (!await allowRequest(session.user.id,'account-security',10)) return back('wait');
  const raw = await context.request.text();
  if(raw.length>2048)return new Response('Request too large',{status:413});
  const form = new URLSearchParams(raw), action=form.get('action');
  if(action==='revoke-session') {
   const sessionId=form.get('sessionId');const rows=await (await workos().userManagement.listSessions(session.user.id)).autoPagination();
   if(!rows.some(s=>s.id===sessionId&&s.userId===session.user.id&&s.status==='active'))return back('error');
   await workos().userManagement.revokeSession({sessionId:sessionId!});return back('session');
  }
  if (action === 'password-reset') {
   if(session.authenticationMethod !== 'Password') return back('provider');
   const now=Date.now();
   for(const [id,time] of resetTimes)if(now-time>60000)resetTimes.delete(id);
   if(resetTimes.has(session.user.id)||resetTimes.size>=2000)return back('wait');
   resetTimes.set(session.user.id,now);
   // Never return or log the reset token/URL. WorkOS sends its configured email.
   await workos().userManagement.createPasswordReset({email:session.user.email});
   return back('reset');
  }
  if (action === 'change-email') {
   if(!validProof(context.cookies.get('cw_security_fresh')?.value,session.user.id,'fresh',env('WORKOS_COOKIE_PASSWORD'))) return back('reauth');
   const email=(form.get('email')||'').trim();
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return back('invalid-email');
   await workos().userManagement.updateUser({userId:session.user.id,email,emailVerified:false});
   await workos().userManagement.sendVerificationEmail({userId:session.user.id});
   await revokeAllSessions(workos().userManagement,session.user.id);
   context.cookies.delete(SESSION_COOKIE,{path:'/'});
   context.cookies.delete('cw_security_fresh',{path:'/'});
   return context.redirect('/auth/sign-in?next=%2Fdashboard%2Fsecurity',303);
  }
  if(action==='revoke-all') {
   if(form.get('confirm')!=='yes')return back('confirm');
   await revokeAllSessions(workos().userManagement,session.user.id);
   context.cookies.delete(SESSION_COOKIE,{path:'/'});
   context.cookies.delete('cw_security_fresh',{path:'/'});
   context.cookies.delete('cw_security_challenge',{path:'/'});
   return context.redirect('/auth/sign-in?next=%2Fdashboard%2Fsecurity',303);
  }
  if(action==='request-deletion'||action==='cancel-deletion') {
   if(isFounder(session.user.id,env('FOUNDER_WORKOS_USER_ID'),session.user.email,env('FOUNDER_EMAIL'),session.user.emailVerified))return back('founder');
   if(!validProof(context.cookies.get('cw_security_fresh')?.value,session.user.id,'fresh',env('WORKOS_COOKIE_PASSWORD')))return back('reauth');
   if(action==='request-deletion'&&(form.get('confirmation')!=='DELETE'||form.get('confirm')!=='yes'))return back('confirm');
   const member=await ensureMember(session.user), db=database();
   const now=new Date().toISOString();
   const result=action==='request-deletion'
     ? await db.from('account_deletion_requests').upsert({user_id:member.id,status:'pending',erasure_consent:true,requested_at:now,updated_at:now},{onConflict:'user_id',ignoreDuplicates:true})
     : await db.from('account_deletion_requests').update({status:'cancelled',updated_at:now}).eq('user_id',member.id).eq('status','pending');
   if(result.error)throw result.error;
   // Re-open a previously cancelled request, but preserve timestamps for duplicate pending submissions.
   if(action==='request-deletion') {
    const reopened=await db.from('account_deletion_requests').update({status:'pending',erasure_consent:true,requested_at:now,updated_at:now}).eq('user_id',member.id).eq('status','cancelled');
    if(reopened.error)throw reopened.error;
   }
   context.cookies.delete('cw_security_fresh',{path:'/'});
   return back(action==='request-deletion'?'requested':'cancelled');
  }
  return new Response('Unknown action',{status:400});
 }catch{return back('error');}
};
