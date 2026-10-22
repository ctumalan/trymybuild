import type {APIRoute} from 'astro';
import {loadInvitation,invitationStore} from '../../server/listing-invitation-store';
import {invitationOpen} from '../../server/listing-invitation.mjs';
import {invitationFields,invitationAssets} from '../../server/listing-invitation-view';
import {surface,e,unavailable} from '../../server/feedback-ui';
import {currentUser} from '../../server/auth';
import {ensureMember,database} from '../../server/database';
import {renderInvitationFeedback} from '../../server/invitation-feedback.mjs';
import {invitationCatalogPage} from '../../server/invitation-catalog-view';
import {listPublished} from '../../server/catalog-db';
import {setupLanguage,publishSetupPath} from '../../server/setup-language.mjs';
export const GET:APIRoute=async context=>{
 try{
  const token=context.params.token||'',row=await loadInvitation(token);
  const language=setupLanguage(context.url,context.request),es=language==='es',t=(en:string,spanish:string)=>es?spanish:en;
  const user=await currentUser(context),sameEmail=user?.emailVerified&&user.email.trim().toLowerCase()===row?.recipient_email;
  if(row?.claimed_by&&sameEmail){
   const member=await ensureMember(user!);
   if(member.id===row.claimed_by){
    const project=await invitationStore(database()).findProject(row.project_id,member.id);
    if(project)return privatePage(surface(t('Your app is saved','Tu app está guardada'),`${invitationAssets}<section class="cw-panel" lang="${language}"><h1>${t('Your app is saved to your account.','Tu app está guardada en tu cuenta.')}</h1><p>${t('Open the publishing steps to check its status, review it and make it public when ready.','Abre los pasos de publicación para ver su estado, revisarla y hacerla pública cuando quieras.')}</p><a class="primary-button" href="${e(publishSetupPath(project.slug,language))}">${t('Review publication status','Revisar estado de publicación')} →</a></section>${renderInvitationFeedback(row.id)}`));
   }
  }
  if(!invitationOpen(row))return privatePage(surface('Preview unavailable','<section class="cw-panel"><h1>This preview is no longer available.</h1><p>The invitation may have expired, been withdrawn or already been claimed.</p><a href="/?listing=settings">Create your own app listing</a></section>','',410));
  const wrongAccount=!!user&&!sameEmail;
  const form=`<form class="cw-panel" data-listing-invitation-claim data-language="${language}" data-token="${e(token)}" data-version="${row.lock_version}" data-authenticated="${!!user}" data-matching-account="${!!sameEmail}"><p class="eyebrow">${t('Step 2 of 3 · Save your app','Paso 2 de 3 · Guarda tu app')}</p><h2>${t('Your account is ready. Now save','Tu cuenta está lista. Ahora guarda')} ${e(row.title)}.</h2><p>${t('Confirm these details and save a private draft. Next you can review and publish it. You do not need to enter your URL again or finish a creator profile.','Confirma estos datos y guarda un borrador privado. Después podrás revisarlo y publicarlo. No necesitas volver a introducir tu URL ni completar un perfil de creador.')}</p><input type="hidden" name="language" value="${language}">${invitationFields(row,false,language)}<label class="cw-choice"><input name="confirm" type="checkbox" value="yes" required> ${t('This is my app and I can manage its listing.','Esta es mi app y puedo gestionar su publicación.')}</label><label class="cw-choice"><input name="terms" type="checkbox" value="yes" required> <span>${t('I agree to the','Acepto los')} <a href="/terms" target="_blank" rel="noopener noreferrer">${t('Terms of Service','Términos del servicio')}</a> ${t('and','y la')} <a href="/privacy" target="_blank" rel="noopener noreferrer">${t('Privacy Policy','Política de privacidad')}</a>.</span></label>${wrongAccount?`<p role="alert">${t('You’re signed in as','Has iniciado sesión como')} ${e(user!.email)}. ${t('Use the email address that received this invitation to claim it.','Usa el correo que recibió esta invitación para guardar la app.')}</p><p>${t('Switch accounts from the app preview, then use the invited email.','Cambia de cuenta desde la vista previa y usa el correo invitado.')}</p>`:`<button class="primary-button" type="submit">${user?t('Save app &amp; continue to publishing','Guardar app y continuar a publicar'):t('Continue to save my app','Continuar para guardar mi app')}</button>`}<p data-invitation-status role="status"></p><p class="cw-meta">${t('Saving creates a private draft. It does not publish the app. The next screen explains how to make it public.','Guardar crea un borrador privado. No publica la app. La siguiente pantalla explica cómo hacerla pública.')}</p></form>`;
  let published:any[]=[];try{published=await listPublished();}catch{/* The private invitation remains usable if catalog reads fail. */}
  return privatePage(surface('A preview for '+row.title,invitationAssets+invitationCatalogPage(row,token,published,!!sameEmail,wrongAccount,form,language,context.url.searchParams.get('step')==='save'),'',200,false,false,{invitation:true}));
 }catch{return privatePage(unavailable());}
};
function privatePage(response:Response){response.headers.set('Referrer-Policy','no-referrer');response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');return response;}
