import {e} from './feedback-ui';
import {pricingKind} from './listing-policy.mjs';
export function invitationFields(row:any={},admin=false,language='en'){
 const es=!admin&&language==='es',t=(en:string,spanish:string)=>es?spanish:en;
 const pricing=row.price_label==='Not confirmed'?'unconfirmed':pricingKind(row.price_label||'Free');
 const input=(name:string,label:string,value:string,max:number,type='text')=>`<label>${label}<input name="${name}" type="${type}" value="${e(value||'')}" maxlength="${max}" ${['title','url','recipientEmail'].includes(name)?'required':''}></label>`;
 const area=(name:string,label:string,value:string,max:number,placeholder:string)=>`<label>${label}<textarea name="${name}" maxlength="${max}" rows="3" placeholder="${e(placeholder)}">${e(value||'')}</textarea></label>`;
 const stages=['Still taking shape','Ready for a first try','Being tested by early users','Finished and launched'];
 return `${admin?input('recipientEmail','Creator’s email',row.recipient_email,254,'email'):''}
 ${input('title',t('App name','Nombre de la app'),row.title,80)}${input('url',t('App website','Sitio web de la app'),row.external_url,2000,'url')}
 ${input('does',t('What it does','Qué hace'),row.headline,140)}
 ${area('helps',t('How it helps','Cómo ayuda'),row.help_text,500,t('What will someone gain from using your app?','¿Qué obtiene alguien al usar tu app?'))}
 ${area('firstTry',t('One thing to try first','Una cosa para probar primero'),row.first_try,500,t('Give someone one simple action to start with.','Indica una acción sencilla para empezar.'))}
 <details ${!admin&&pricing==='unconfirmed'?'open':''}><summary>${t('Category, stage and pricing','Categoría, etapa y precio')}</summary>${input('category',t('Category','Categoría'),row.category||'Technology',48)}
 <label>${t('Stage','Etapa')}<select name="stage">${stages.map((s,i)=>`<option value="${e(s)}" ${s===(row.stage||'Ready for a first try')?'selected':''}>${e(es?['En desarrollo','Lista para probar','En pruebas con primeros usuarios','Terminada y lanzada'][i]:s)}</option>`).join('')}</select></label>
 <label>${t('Your app’s pricing','Precio de tu app')}<select name="pricing" required>${admin||pricing==='unconfirmed'?`<option value="unconfirmed" ${pricing==='unconfirmed'?'selected':''} ${admin?'':'disabled'}>${admin?'Not confirmed':t('Choose your app’s pricing','Elige el precio de tu app')}</option>`:''}${[['free',t('Free','Gratis')],['paid',t('Paid','De pago')],['freemium',t('Free + paid options','Gratis con opciones de pago')]].map(([v,l])=>`<option value="${v}" ${v===pricing?'selected':''}>${l}</option>`).join('')}</select></label>
 <input type="hidden" name="video" value="${e(row.video_url||'')}"></details>`;
}
export function invitationPreview(row:any,image:string){
 return `<article class="listing-invitation-card" aria-label="Proposed app listing"><header><span class="eyebrow" data-preview-category>${e(row.category||'Your app')}</span><span class="listing-invitation-badge">Unlisted preview</span><h2 data-preview-title>${e(row.title||'Your app name')}</h2><p class="listing-invitation-headline" data-preview-does>${e(row.headline||'A clear introduction to your app')}</p></header>
 <div class="listing-invitation-art">${image?`<img data-invitation-screenshot src="${e(image)}" alt="Website screenshot for ${e(row.title||'your app')}">`:'<p data-image-placeholder>Capture or upload a screenshot to see your app here.</p><img data-invitation-screenshot alt="Your app screenshot" hidden>'}</div>
 <div class="listing-invitation-notes"><section><span aria-hidden="true">01</span><h3>How it helps</h3><p data-preview-helps>${e(row.help_text||'Explain what someone will gain from using your app.')}</p></section>
 <section><span aria-hidden="true">02</span><h3>One thing to try first</h3><p data-preview-firstTry>${e(row.first_try||'Give someone one simple action to start with.')}</p></section></div></article>`;
}
export const invitationAssets='<link rel="stylesheet" href="/listing-invitations.css"><script src="/listing-invitations.js" defer></script>';
