import {invitationOpen} from './listing-invitation.mjs';
import {signedInvitation} from './listing-invitation-store';
import {invitationSetupPath,setupLanguage} from './setup-language.mjs';
import {e} from './feedback-ui';

// A public preview token never grants access to another recipient's invitations.
export async function pendingInvitations(db:any,user:any) {
 if(!user?.emailVerified||!user.email)return [];
 const result=await db.from('listing_invitations').select('id,title,created_at,expires_at,claimed_by,revoked_at')
  .eq('recipient_email',user.email.trim().toLowerCase()).is('claimed_by',null).is('revoked_at',null)
  .order('created_at',{ascending:false}).limit(50);
 if(result.error)throw result.error;
 return (result.data||[]).filter((row:any)=>invitationOpen(row)).slice(0,5);
}
export async function pendingInvitationNotice(context:any,m:any) {
 try{
  const rows=await pendingInvitations(m.db,m.user);
  if(!rows.length)return '';
  const language=setupLanguage(context.url,context.request),es=language==='es';
  return `<link rel="stylesheet" href="/listing-invitations.css"><section class="cw-panel pending-invitations" lang="${language}" aria-label="${es?'Invitaciones pendientes':'Pending app invitations'}"><h2>${es?'Tu cuenta está lista. Guarda la vista previa de tu app.':'Your account is ready. Save your app preview.'}</h2><p>${es?'Crear la cuenta no guarda ni publica la app. Abre tu invitación, confirma los datos y guarda el borrador. Después podrás publicarlo.':'Creating an account does not save or publish the app. Open your invitation, confirm the details, and save the draft. Then you can publish it.'}</p>${rows.map((row:any)=>`<p><a class="primary-button" href="${e(invitationSetupPath(signedInvitation(row.id),language,true))}">${es?'Continuar con':'Continue with'} ${e(row.title)} →</a></p>`).join('')}</section>`;
 }catch{
  console.warn('Pending app invitations could not be loaded');
  return '<p class="cw-notice">If you received an app invitation, reopen the preview link in your email to continue saving it. Si recibiste una invitación, abre el enlace de tu correo para guardar tu app.</p>';
 }
}
