import {e} from './feedback-ui';
import {pricingKind} from './listing-policy.mjs';
export function invitationFields(row:any={},admin=false){
 const input=(name:string,label:string,value:string,max:number,type='text')=>`<label>${label}<input name="${name}" type="${type}" value="${e(value||'')}" maxlength="${max}" ${['title','url','recipientEmail'].includes(name)?'required':''}></label>`;
 const area=(name:string,label:string,value:string,max:number,placeholder:string)=>`<label>${label}<textarea name="${name}" maxlength="${max}" rows="3" placeholder="${e(placeholder)}">${e(value||'')}</textarea></label>`;
 const stages=['Still taking shape','Ready for a first try','Being tested by early users','Finished and launched'];
 return `${admin?input('recipientEmail','Creator’s email',row.recipient_email,254,'email'):''}
 ${input('title','App name',row.title,80)}${input('url','App website',row.external_url,2000,'url')}
 ${input('does','What it does',row.headline,140)}
 ${area('helps','How it helps',row.help_text,500,'What will someone gain from using your app?')}
 ${area('firstTry','One thing to try first',row.first_try,500,'Give someone one simple action to start with.')}
 <details><summary>Category, stage and pricing</summary>${input('category','Category',row.category||'Technology',48)}
 <label>Stage<select name="stage">${stages.map(s=>`<option ${s===(row.stage||'Ready for a first try')?'selected':''}>${e(s)}</option>`).join('')}</select></label>
 <label>Your app’s pricing<select name="pricing">${[['free','Free'],['paid','Paid'],['freemium','Free + paid options']].map(([v,l])=>`<option value="${v}" ${v===pricingKind(row.price_label||'Free')?'selected':''}>${l}</option>`).join('')}</select></label>
 <input type="hidden" name="video" value="${e(row.video_url||'')}"></details>`;
}
export function invitationPreview(row:any,image:string){
 return `<article class="listing-invitation-card" aria-label="Proposed app listing"><header><span class="eyebrow" data-preview-category>${e(row.category||'Your app')}</span><span class="listing-invitation-badge">Private preview</span><h2 data-preview-title>${e(row.title||'Your app name')}</h2><p class="listing-invitation-headline" data-preview-does>${e(row.headline||'A clear introduction to your app')}</p></header>
 <div class="listing-invitation-art">${image?`<img data-invitation-screenshot src="${e(image)}" alt="Website screenshot for ${e(row.title||'your app')}">`:'<p data-image-placeholder>Capture or upload a screenshot to see your app here.</p><img data-invitation-screenshot alt="Your app screenshot" hidden>'}</div>
 <div class="listing-invitation-notes"><section><span aria-hidden="true">01</span><h3>How it helps</h3><p data-preview-helps>${e(row.help_text||'Explain what someone will gain from using your app.')}</p></section>
 <section><span aria-hidden="true">02</span><h3>One thing to try first</h3><p data-preview-firstTry>${e(row.first_try||'Give someone one simple action to start with.')}</p></section></div></article>`;
}
export const invitationAssets='<link rel="stylesheet" href="/listing-invitations.css"><script src="/listing-invitations.js" defer></script>';
