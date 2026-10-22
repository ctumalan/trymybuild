import type { APIRoute } from 'astro';
import { authReady, authMessage, cookieOptions, env, origin, SESSION_COOKIE, workos } from '../../server/auth';
import { equalState } from '../../server/security.mjs';
import { ensureMember, databaseReady,database } from '../../server/database';
import {claimGuestComments} from '../../server/guest-comments';
import { feedbackDestination } from '../../server/feedback-policy.mjs';
import { signProof, validProof } from '../../server/account-security.mjs';
import {sendAccountSetupWelcome} from '../../server/welcome-email.mjs';
import {pendingInvitations} from '../../server/pending-invitations';
import {signedInvitation} from '../../server/listing-invitation-store';
import {setupLanguage,invitationSetupPath} from '../../server/setup-language.mjs';

export const GET: APIRoute = async context => {
  const securityChallenge = context.cookies.get('cw_security_challenge')?.value;
  context.cookies.delete('cw_security_challenge', {path:'/'});
  context.cookies.delete('cw_security_fresh', {path:'/'});
  const destination = feedbackDestination(context.cookies.get('cw_auth_destination')?.value);
  context.cookies.delete('cw_auth_destination', { path: '/' });
  const expected = context.cookies.get('cw_auth_state')?.value;
  const verifier = context.cookies.get('cw_auth_verifier')?.value;
  context.cookies.delete('cw_auth_state', { path: '/' });
  context.cookies.delete('cw_auth_verifier', { path: '/' });
  if (!authReady()) return authMessage('Sign-in setup is still being connected.');
  const code = context.url.searchParams.get('code');
  if (!code || !verifier || !equalState(context.url.searchParams.get('state'), expected)) {
    return authMessage('This sign-in link has expired. Please return to TryMyBuild and start sign-in again.', 400);
  }
  try {
    const result = await workos().userManagement.authenticateWithCode({
      clientId: env('WORKOS_CLIENT_ID'), code, codeVerifier: verifier,
      session: { sealSession: true, cookiePassword: env('WORKOS_COOKIE_PASSWORD') },
    });
    if (!result.user.emailVerified) return authMessage('Please verify your email on the sign-in page before continuing.',403);
    if (!result.sealedSession) return authMessage('We could not complete sign-in. Please try again.', 502);
    let member;
    if (databaseReady()) {member=await ensureMember(result.user);await claimGuestComments(context,database(),member.id);}
    context.cookies.set(SESSION_COOKIE, result.sealedSession, cookieOptions(context));
    if (validProof(securityChallenge,result.user.id,'challenge',env('WORKOS_COOKIE_PASSWORD'))) {
      context.cookies.set('cw_security_fresh',signProof(result.user.id,'fresh',env('WORKOS_COOKIE_PASSWORD')), {...cookieOptions(context),maxAge:300});
    }
    if(member){
      const language=setupLanguage(new URL(destination,origin(context)),context.request);
      await sendAccountSetupWelcome({db:database(),user:result.user,member,language,findInvitation:async()=>{
        const row=(await pendingInvitations(database(),result.user))[0];
        return row?{title:row.title,path:invitationSetupPath(signedInvitation(row.id),language,true)}:undefined;
      }},{env}).catch(()=>console.warn('Account setup email could not be sent'));
    }
    return context.redirect(destination, 303);
  } catch { return authMessage('We could not complete sign-in. Please return to the site and try again.', 502); }
};
