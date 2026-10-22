import {publishSetupPath} from './setup-language.mjs';
import {nextSetupStep, profileCompletion, projectCompletion} from './setup-completion.mjs';

const clean=value=>String(value||'').trim();
const escape=value=>clean(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const origin=value=>{try{return new URL(value||'https://trymybuild.com').origin;}catch{return 'https://trymybuild.com';}};

export function welcomeEmail({user={},profile={},project={},siteUrl,language='en'}={}) {
  const es=language==='es',t=(en,spanish)=>es?spanish:en;
  const app=projectCompletion(project),person=profileCompletion(profile);
  const firstName=clean(user.firstName)||clean(profile.display_name).split(/\s+/)[0]||t('there','');
  const title=clean(project.title)||t('your app','tu app'),live=project.listing_status==='published';
  const siteOrigin=origin(siteUrl);
  const dashboardUrl=new URL('/dashboard/overview',siteOrigin);
  if(project.slug)dashboardUrl.searchParams.set('started',project.slug);
  const actionUrl=new URL(project.slug?publishSetupPath(project.slug,language):'/dashboard?view=creator',siteOrigin).href;
  const logoUrl=new URL('/assets/brand/trymybuild-app-192.png',siteOrigin).href;
  const founderUrl=new URL('/assets/avatars/chris-nava-founder.jpg',siteOrigin).href;
  const aboutUrl=new URL('/?page=about',siteOrigin).href;
  const visibility=live?t('Your app is published and publicly discoverable.','Tu app está publicada y se puede descubrir públicamente.'):
    t('Your app is saved privately. It is still private until you explicitly choose Publish my app.','Tu app está guardada como borrador privado. Sigue siendo privada hasta que elijas Publicar mi app.');
  const subject=live?`${title} ${t('is live on TryMyBuild','ya está publicada en TryMyBuild')}`:`${title} ${t('is saved. Here is how to publish it.','está guardada. Así puedes publicarla.')}`;
  const steps=es?['Abre el enlace de abajo e inicia sesión con el mismo correo.','Revisa el nombre, enlace, descripción y captura. Completa los datos que falten.','Marca que quieres hacer pública la app y pulsa Publicar mi app. Después aparecerá en Explorar apps.']:
    ['Open the link below and sign in with the same email.','Review the name, link, description and screenshot. Finish any missing app details.','Confirm that you want the listing public and choose Publish my app. Then it appears in Explore apps.'];
  const optional=t('Your creator profile is optional. You do not need a Verified badge, reviews or payment to publish your first app.','Tu perfil de creador es opcional. No necesitas una insignia, reseñas ni pagar para publicar tu primera app.');
  const next=es?(app.percent<100?'Completa los datos de la app en el enlace de abajo.':'Revisa y publica tu app cuando quieras.'):app.percent<100?nextSetupStep(profile,project):'Review your app and choose Publish my app when ready.';
  const intro=live?t(`${title} is live on TryMyBuild.`,`${title} ya está publicada en TryMyBuild.`):t(`${title} is saved in your account. Saving and publishing are separate steps.`,`${title} está guardada en tu cuenta. Guardar y publicar son pasos distintos.`);
  const actionLabel=live?t('View publication status','Ver estado de publicación'):t('Review and publish my app','Revisar y publicar mi app');
  const text=[`${t('Hi','Hola')} ${firstName},`,'',intro,'',visibility,'',`${t('App page','Página de la app')}: ${app.percent}% ${t('complete','completa')}`,`${t('Creator profile','Perfil de creador')}: ${person.percent}% ${t('complete','completo')} (${t('optional','opcional')})`,`${t('A good next step','Siguiente paso')}: ${next}`,'',...(!live?steps.map((step,i)=>`${i+1}. ${step}`):[]),'',optional,'',`${actionLabel}: ${actionUrl}`,'',t('Need help? Reply and tell me which screen or button stopped you.','¿Necesitas ayuda? Responde y dime en qué pantalla o botón te quedaste.'),'','Christian Tumalan','Founder, TryMyBuild'].join('\n');
  const html=`<meta charset="utf-8"><div lang="${es?'es':'en'}" style="max-width:600px;margin:0 auto;padding:32px 22px;color:#19372f;font:16px/1.55 Arial,sans-serif"><a href="${escape(siteOrigin)}"><img src="${escape(logoUrl)}" width="54" height="54" alt="TryMyBuild" style="display:block;border:0;border-radius:14px"></a><p>${t('Hi','Hola')} ${escape(firstName)},</p><h1 style="font-size:28px;line-height:1.2">${escape(live?t('Your app is live.','Tu app ya es pública.'):t('Saved privately. Publish when ready.','Guardada como borrador. Publica cuando quieras.'))}</h1><p>${escape(intro)}</p><p><strong>${escape(visibility)}</strong></p>${!live?`<ol style="padding-left:24px">${steps.map(step=>`<li style="margin:12px 0">${escape(step)}</li>`).join('')}</ol>`:''}<p style="margin:24px 0"><a href="${escape(actionUrl)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#7545ad;color:white;text-decoration:none;font-weight:700">${escape(actionLabel)} →</a></p><p>${escape(optional)}</p><p>${t('App page','Página de la app')}: ${app.percent}% · ${t('Creator profile (optional)','Perfil de creador (opcional)')}: ${person.percent}%</p><p>${t('Need help? Reply and tell me which screen or button stopped you.','¿Necesitas ayuda? Responde y dime en qué pantalla o botón te quedaste.')}</p><table role="presentation"><tr><td style="padding-right:12px"><a href="${escape(aboutUrl)}"><img src="${escape(founderUrl)}" width="52" height="52" alt="Christian Tumalan" style="border-radius:50%"></a></td><td><strong>Christian Tumalan</strong><br>${t('Founder, TryMyBuild','Fundador de TryMyBuild')}</td></tr></table></div>`;
  return {subject,text,html,dashboardUrl:dashboardUrl.href,actionUrl,logoUrl,founderUrl,aboutUrl,appCompletion:app.percent,profileCompletion:person.percent};
}

export async function sendWelcomeEmail({user,profile,project,language='en'},deps={}) {
  const env=deps.env||(key=>process.env[key]||'');
  const apiKey=clean(env('RESEND_API_KEY')),email=clean(user?.email);
  if(!apiKey||!email)return {skipped:true};
  const message=welcomeEmail({user,profile,project,language,siteUrl:env('PUBLIC_APP_URL')});
  const response=await (deps.fetch||fetch)('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`welcome/${project.id}`.slice(0,256)},body:JSON.stringify({from:clean(env('WELCOME_EMAIL_FROM'))||'Christian at TryMyBuild <notifications@trymybuild.com>',to:[email],reply_to:'hello@trymybuild.com',subject:message.subject,text:message.text,html:message.html}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error(`Welcome email failed (${response.status})`);
  const result=await response.json().catch(()=>({}));
  return {sent:true,id:result.id||''};
}

export async function sendFirstProjectWelcome({db,user,member,project,language='en'},deps={}) {
  const env=deps.env||(key=>process.env[key]||'');
  if(!clean(env('RESEND_API_KEY'))||!clean(user?.email))return {skipped:true};
  const account=await db.from('users').select('created_at').eq('id',member.id).single();
  if(account.error)throw account.error;
  const created=Date.parse(account.data?.created_at||'');
  if(!Number.isFinite(created)||Date.now()-created>7*24*60*60*1000)return {skipped:true};
  const key=`welcome-email:${member.id}`;
  const claim=await db.from('site_settings').insert({key,value:{status:'sending',projectId:project.id},updated_at:new Date().toISOString()});
  if(claim.error){if(claim.error.code==='23505')return {skipped:true};throw claim.error;}
  try{
    const profile=await db.from('profiles').select('display_name,avatar_path,identity_label,bio').eq('user_id',member.id).single();
    if(profile.error)throw profile.error;
    const sent=await sendWelcomeEmail({user,profile:profile.data,project,language},deps);
    if(sent.sent)await db.from('site_settings').update({value:{status:'sent',projectId:project.id,sentAt:new Date().toISOString()},updated_at:new Date().toISOString()}).eq('key',key);
    else await db.from('site_settings').delete().eq('key',key);
    return sent;
  }catch(error){await db.from('site_settings').delete().eq('key',key);throw error;}
}

// Registration and saving a first project are distinct, transactional messages.
// Never describe an invitation as a saved app in the account-only message.
export function accountSetupEmail({user={},invitation,siteUrl,language='en'}={}) {
 const es=language==='es',t=(en,spanish)=>es?spanish:en;
 const firstName=clean(user.firstName)||t('there','');
 const siteOrigin=origin(siteUrl);
 const path=invitation?.path?.startsWith('/listing-invitation/')?invitation.path:'/dashboard/overview';
 const actionUrl=new URL(path,siteOrigin).href;
 const subject=t('Your account is ready. Next, save and publish your app.','Tu cuenta está lista. Ahora guarda y publica tu app.');
 const steps=invitation?[
  t(`Open your invitation for ${clean(invitation.title)} using the link below. Sign in with the email that received it.`,`Abre tu invitación para ${clean(invitation.title)} con el enlace de abajo. Inicia sesión con el correo que la recibió.`),
  t('Confirm the prepared details and choose Save app & continue to publishing. This creates a private draft.','Confirma los datos preparados y pulsa Guardar app y continuar a publicar. Esto crea un borrador privado.'),
  t('Review the draft, confirm you want the listing public, and choose Publish my app.','Revisa el borrador, confirma que quieres hacerlo público y pulsa Publicar mi app.')
 ]:[
  t('Open your dashboard and choose Add your app. Enter your app website.','Abre tu panel y elige Add your app. Introduce el sitio web de tu app.'),
  t('Confirm the app details and save your private draft.','Confirma los datos de la app y guarda el borrador privado.'),
  t('Open the saved app, choose Review and publish, then confirm publication.','Abre la app guardada, elige Review and publish y confirma la publicación.')
 ];
 const status=t('Your account is ready. Creating an account does not save or publish an app.','Tu cuenta está lista. Crear una cuenta no guarda ni publica la app.');
 const label=invitation?t('Continue with my app invitation','Continuar con la invitación de mi app'):t('Open my dashboard','Abrir mi panel');
 const help=t('Your creator profile is optional. If you get stuck, reply with the screen or button you see.','Tu perfil de creador es opcional. Si te quedas atascado, responde con la pantalla o el botón que ves.');
 const text=[`${t('Hi','Hola')} ${firstName},`,'',status,'',...steps.map((step,i)=>`${i+1}. ${step}`),'',`${label}: ${actionUrl}`,'',help,'','Christian Tumalan','TryMyBuild'].join('\n');
 const html=`<meta charset="utf-8"><div lang="${language==='es'?'es':'en'}" style="max-width:600px;margin:0 auto;padding:28px 22px;color:#19372f;font:16px/1.55 Arial,sans-serif"><p>${t('Hi','Hola')} ${escape(firstName)},</p><h1 style="font-size:28px;line-height:1.2">${t('Your account is ready.','Tu cuenta está lista.')}</h1><p>${escape(status)}</p><ol style="padding-left:24px">${steps.map(step=>`<li style="margin:12px 0">${escape(step)}</li>`).join('')}</ol><p style="margin:24px 0"><a href="${escape(actionUrl)}" style="display:inline-block;padding:12px 18px;background:#7545ad;color:white;border-radius:10px;text-decoration:none">${escape(label)} →</a></p><p>${escape(help)}</p><p><strong>Christian Tumalan</strong><br>TryMyBuild</p></div>`;
 return {subject,text,html,actionUrl};
}

export async function sendAccountSetupWelcome({db,user,member,language,findInvitation},deps={}) {
 const env=deps.env||(key=>process.env[key]||'');
 if(!user?.emailVerified||!clean(user.email)||!clean(env('RESEND_API_KEY')))return {skipped:true};
 const account=await db.from('users').select('created_at').eq('id',member.id).single();
 if(account.error)throw account.error;
 const age=Date.now()-Date.parse(account.data?.created_at||'');
 if(!Number.isFinite(age)||age<0||age>10*60*1000)return {skipped:true};
 const key=`account-setup-email:${member.id}`;
 const claim=await db.from('site_settings').insert({key,value:{status:'sending'},updated_at:new Date().toISOString()});
 if(claim.error){if(claim.error.code==='23505')return {skipped:true};throw claim.error;}
 try{
  const invitation=await findInvitation?.();
  const message=accountSetupEmail({user,invitation,language,siteUrl:env('PUBLIC_APP_URL')});
  const response=await (deps.fetch||fetch)('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${clean(env('RESEND_API_KEY'))}`,'Content-Type':'application/json','Idempotency-Key':`account-setup/${member.id}`},body:JSON.stringify({from:clean(env('WELCOME_EMAIL_FROM'))||'Christian at TryMyBuild <notifications@trymybuild.com>',to:[user.email],reply_to:'hello@trymybuild.com',subject:message.subject,text:message.text,html:message.html}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error(`Account welcome email failed (${response.status})`);
  await db.from('site_settings').update({value:{status:'sent',sentAt:new Date().toISOString()},updated_at:new Date().toISOString()}).eq('key',key);
  return {sent:true};
 }catch(error){await db.from('site_settings').delete().eq('key',key);throw error;}
}
