import type {APIRoute} from 'astro';
import {memberContext,workspace} from '../../server/workspace';
import {e,signIn,unavailable} from '../../server/feedback-ui';
import {sameOrigin} from '../../server/security.mjs';
import {origin} from '../../server/auth';
import {setupLanguage,publishSetupPath} from '../../server/setup-language.mjs';
import {validSlug} from '../../server/feedback-policy.mjs';
import {publishReadiness} from '../../server/listing-policy.mjs';
import {submit} from '../../server/listing-service.mjs';
import {projectStore} from '../../server/listing-store';
import {publicationAccess} from '../../server/community-credits';
import {allowRequest} from '../../server/abuse';

export const GET:APIRoute=async context=>{
 try{
  const slug=context.url.searchParams.get('project')||'';
  if(!validSlug(slug))return new Response('Not found',{status:404});
  const language=setupLanguage(context.url,context.request),es=language==='es',t=(en:string,spanish:string)=>es?spanish:en;
  const m=await memberContext(context);if(!m)return signIn(publishSetupPath(slug,language));
  const project=await projectStore(m.db).findOwnedBySlug(m.member.id,slug);
  if(!project)return new Response('Not found',{status:404});
  const ready=publishReadiness(project),live=project.listing_status==='published';
  const langs=`<nav class="setup-language" aria-label="Language / Idioma"><a href="${e(publishSetupPath(slug,'en'))}" lang="en">English</a><a href="${e(publishSetupPath(slug,'es'))}" lang="es">Español</a></nav>`;
  const steps=t('1. Account created → 2. App saved → 3. Publish','1. Cuenta creada → 2. App guardada → 3. Publicar');
  const errors=context.url.searchParams.has('error')?`<p class="cw-notice" role="alert">${t('Publication was not confirmed. Your draft is safe. Review the current details and try again, or contact Help & contact.','No se confirmó la publicación. Tu borrador está guardado. Revisa los datos e inténtalo de nuevo o contacta con Ayuda.')}</p>`:'';
  const details=[['App website','Sitio web',project.external_url],['Category','Categoría',project.category],['Pricing','Precio',project.price_label],['What it does','Qué hace',project.headline],['How it helps','Cómo ayuda',project.help_text],['One thing to try first','Una cosa para probar primero',project.first_try]];
  const review=`<section class="cw-panel"><h2>${e(project.title)}</h2>${project.preview_public_url?`<img class="setup-app-preview" src="${e(project.preview_public_url)}" alt="${e(project.title)}">`:''}<dl>${details.map(([en,spanish,value])=>`<dt><strong>${t(en,spanish)}</strong></dt><dd>${e(value||t('Not supplied','Sin completar'))}</dd>`).join('')}</dl><a href="/?listing=settings&amp;project=${e(slug)}">${t('Edit app details (English editor)','Editar datos (editor en inglés)')} →</a></section>`;
  const action=live?`<section class="cw-panel"><h2>${t('Your app is live','Tu app ya es pública')}</h2><p>${t('People can find it in Explore apps and open its public listing.','Las personas pueden encontrarla en Explorar apps y abrir su página pública.')}</p><a class="primary-button" href="/projects/${e(slug)}">${t('Open public app page','Abrir página pública')} →</a></section>`:
   `<section class="cw-panel"><h2>${t('Your app is saved privately. Publish it when ready.','Tu app está guardada como borrador privado. Publícala cuando quieras.')}</h2><p>${t('Your account and draft are ready. They do not make the app public. Publishing adds this listing to Explore apps so people can find it.','Tu cuenta y tu borrador están listos. Eso no hace pública la app. Publicar añade esta página a Explorar apps para que las personas la encuentren.')}</p><p>${t('A complete creator profile, a Verified badge, reviews and payment are not required to publish your first app.','No necesitas completar el perfil de creador, obtener una insignia, escribir reseñas ni pagar para publicar tu primera app.')}</p>${ready.ready?`<form method="post" action="${e(publishSetupPath(slug,language))}"><input type="hidden" name="version" value="${project.lock_version}"><label class="cw-choice"><input type="checkbox" name="confirmPublic" value="yes" required> ${t('I want this app listing to be public and discoverable.','Quiero que esta página de mi app sea pública y se pueda descubrir.')}</label><button class="primary-button">${t('Publish my app','Publicar mi app')}</button></form>`:`<p role="status">${t('Some required details are missing or need shorter answers. Open Edit app details above to complete the name, website, category, description, benefit, first task and screenshot. Then return here.','Faltan datos obligatorios o algunas respuestas son demasiado largas. Abre Editar datos arriba para completar nombre, sitio web, categoría, descripción, beneficio, primera tarea y captura. Después vuelve aquí.')}</p>`}</section>`;
  return workspace(t('Finish publishing your app','Termina de publicar tu app'),`<div class="setup-publish-guide" lang="${language}"><link rel="stylesheet" href="/listing-invitations.css">${langs}<p class="invitation-setup-steps">${steps}</p>${errors}${action}${review}<p><a href="/dashboard?view=creator">${t('My apps','Mis apps')}</a> · <a href="/dashboard/help">${t('Need help?','¿Necesitas ayuda?')}</a></p></div>`,'creator',m.admin);
 }catch{return unavailable();}
};
export const POST:APIRoute=async context=>{
 if(!sameOrigin(context.request,origin(context)))return new Response('Forbidden',{status:403});
 try{
  const m=await memberContext(context);if(!m?.user.emailVerified)return new Response('Forbidden',{status:403});
  if(!await allowRequest(m.user.id,'projects'))return new Response('Please wait before trying again.',{status:429});
  const slug=context.url.searchParams.get('project')||'',language=setupLanguage(context.url,context.request);
  if(!validSlug(slug))return new Response('Not found',{status:404});
  const data=await context.request.formData(),store=projectStore(m.db),project=await store.findOwnedBySlug(m.member.id,slug);
  if(!project)return new Response('Not found',{status:404});
  const fail=()=>context.redirect(publishSetupPath(slug,language)+'&error=publish',303);
  if(data.get('confirmPublic')!=='yes'||!/^\d+$/.test(String(data.get('version')||'')))return fail();
  const access=await publicationAccess(m.db,m.member.id,project.id);if(!access.allowed)return fail();
  const result=await submit(store,{ownerId:m.member.id,id:project.id,confirmPublic:true,version:Number(data.get('version'))});
  return result.error?fail():context.redirect(publishSetupPath(slug,language),303);
 }catch{return unavailable();}
};
