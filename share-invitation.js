// Review the invitation before handing it to a sharing or email app.
(()=>{
 const escape=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let dismissPrevious;
 document.addEventListener('click',async event=>{
  const trigger=event.target.closest('[data-share-product],[data-invite-project],[data-share-profile]');if(!trigger)return;
  event.preventDefault();dismissPrevious?.();
  const slug=trigger.dataset.shareProduct||trigger.dataset.inviteProject,profile=trigger.dataset.shareProfile;
  const dialog=document.createElement('dialog');dialog.className='invitation-dialog';dialog.setAttribute('aria-labelledby','invite-title');
  dialog.innerHTML='<button type="button" class="invite-close" aria-label="Close invitation preview">×</button><h2 id="invite-title">Preview your invitation</h2><p role="status">Preparing the project preview…</p>';
  document.body.append(dialog);dialog.showModal();
  let imageFile,imageUrl,imageRequest,extraPdf,attachmentVersion=0;
  const close=()=>{imageRequest?.abort();if(imageUrl)URL.revokeObjectURL(imageUrl);attachmentVersion++;dialog.close();dialog.remove();trigger.focus();if(dismissPrevious===close)dismissPrevious=undefined;};
  dismissPrevious=close;dialog.querySelector('.invite-close').onclick=close;
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  try{
   const response=await fetch(profile?'/api/profile-invitation/'+encodeURIComponent(profile):'/api/invitation/'+encodeURIComponent(slug));
   if(!response.ok)throw Error();const p=await response.json();if(!dialog.isConnected)return;
   const graphicEmail=!profile&&!p.privateListing&&Boolean(p.image);
   const defaultText=profile?`Meet ${p.name} on TryMyBuild and explore their projects.`:`Take a look at ${p.name} on TryMyBuild. I’d love to hear what you think.`;
   dialog.innerHTML=`<button type="button" class="invite-close" aria-label="Close invitation preview">×</button><p class="eyebrow">Share something worth trying</p><h2 id="invite-title">Preview your invitation</h2><label for="invite-message">Your message</label><textarea id="invite-message" maxlength="500">${escape(defaultText)}</textarea><section class="invitation-preview" aria-label="Invitation preview"><p data-message-preview>${escape(defaultText)}</p><article>${p.image?`<img src="${escape(p.image)}" alt="Preview of ${escape(p.name)}">`:''}<div><span class="eyebrow">TryMyBuild · ${escape(p.category)}</span><h3>${escape(p.name)}</h3><p>${escape(p.description)}</p><small>Built by ${escape(p.builder)}</small><a href="${escape(p.url)}" target="_blank" rel="noopener">Preview recipient page ↗</a></div></article></section>${p.privateListing?'<p class="cw-notice">Your listing stays private. This shares only your app’s own link; its access settings are controlled by that app.</p>':''}<label for="invite-url">${profile?'Profile link':'Project link'}</label><input id="invite-url" readonly value="${escape(p.url)}"><p class="cw-meta">Each messaging app controls its link-preview appearance. Nothing has been sent.</p><details class="invitation-send-menu"><summary class="primary-button">Send invitation <span aria-hidden="true">⌄</span></summary><div class="invitation-send-options"><button type="button" data-invite-action="email">${graphicEmail?'Email with image':'Email'}</button><button type="button" data-invite-action="text">Text</button><button type="button" data-invite-action="copy">${profile?'Copy link':'Copy invitation'}</button>${!profile?'<button type="button" data-invite-action="link">Copy link</button>':''}<button type="button" data-invite-action="native">More options</button></div></details>${graphicEmail?'<section data-email-controls hidden aria-label="Email with project image"><h3>Email your invitation</h3><p>The project graphic is a PNG image. Your message and project link stay readable as text.</p><div class="invite-actions"><button type="button" class="primary-button" data-invite-action="email-copy">Copy illustrated email</button><button type="button" class="secondary-button" data-invite-action="image-share" hidden>Choose email app</button><a class="secondary-button" data-image-download hidden>Download PNG</a><button type="button" class="secondary-button" data-invite-action="email-draft">Open email draft</button></div><p class="cw-meta">Paste the illustrated email into your email composer. Formatting and image placement depend on your email app. Opening a draft fills in text and the link; insert the downloaded PNG yourself if needed.</p><details class="invitation-extra-documents"><summary>Optional PDF: instructions or supporting documents</summary><label for="invite-document">Add your PDF (up to 10 MB)</label><input id="invite-document" type="file" accept=".pdf,application/pdf"><p data-document-status role="status">No extra document selected. A PDF is not needed for the invitation.</p><button type="button" class="secondary-button" data-invite-action="remove-document" hidden>Remove PDF</button><p class="cw-meta">The PDF stays on your device until you share it. Copying an email does not attach files; attach your PDF separately when using an email draft or webmail.</p></details></section>':''}<p data-invite-status role="status"></p>`;
   dialog.querySelector('.invite-close').onclick=close;
   const message=dialog.querySelector('#invite-message'),status=dialog.querySelector('[data-invite-status]');
   const body=()=>message.value.trim()+'\n\n'+p.url;
   message.addEventListener('input',()=>{dialog.querySelector('[data-message-preview]').textContent=message.value;});
   const files=()=>imageFile?[imageFile,...(extraPdf?[extraPdf]:[])]:[];
   const updateShare=()=>{
    let supported=false;try{supported=Boolean(imageFile&&navigator.share&&navigator.canShare?.({files:files()}));}catch{}
    const button=dialog.querySelector('[data-invite-action="image-share"]');if(button)button.hidden=!supported;
   };
   const documentInput=dialog.querySelector('#invite-document');
   documentInput?.addEventListener('change',async()=>{
    const version=++attachmentVersion,file=documentInput.files[0];extraPdf=undefined;updateShare();
    dialog.querySelector('[data-invite-action="remove-document"]').hidden=true;
    const documentStatus=dialog.querySelector('[data-document-status]');
    if(!file){documentStatus.textContent='No extra document selected.';return;}
    if(!/\.pdf$/i.test(file.name)||file.size>10*1024*1024){documentInput.value='';documentStatus.textContent='Choose a PDF file no larger than 10 MB.';return;}
    try{
     const signature=await file.slice(0,5).text();if(version!==attachmentVersion||!dialog.isConnected)return;
     if(signature!=='%PDF-'){documentInput.value='';documentStatus.textContent='This file does not appear to be a PDF. Please choose another.';return;}
     extraPdf=file;documentStatus.textContent=file.name+' is ready as an optional attachment.';
     dialog.querySelector('[data-invite-action="remove-document"]').hidden=false;updateShare();
    }catch{if(version===attachmentVersion)documentStatus.textContent='This file could not be read. Please choose another.';}
   });
   const prepareImage=async()=>{
    dialog.querySelector('[data-email-controls]').hidden=false;
    if(imageFile){updateShare();status.textContent='Your PNG invitation is ready. Nothing has been sent.';return;}
    if(imageRequest)return;
    const request=new AbortController();imageRequest=request;status.textContent='Preparing your project image…';
    try{
     const result=await fetch(p.image,{signal:request.signal});
     if(!result.ok||!result.headers.get('content-type')?.includes('image/png'))throw Error();
     const blob=await result.blob();if(request.signal.aborted||!dialog.isConnected)return;
     imageFile=new File([blob],String(slug).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,100)+'-invitation.png',{type:'image/png'});imageUrl=URL.createObjectURL(imageFile);
     const download=dialog.querySelector('[data-image-download]');download.href=imageUrl;download.download=imageFile.name;download.hidden=false;
     updateShare();status.textContent='Your PNG invitation is ready. Nothing has been sent.';
    }catch(error){if(error.name!=='AbortError')status.textContent='The image could not be downloaded. You can still copy the illustrated email or open a text draft. Choose Email with image to retry.';}
    finally{if(imageRequest===request)imageRequest=undefined;}
   };
   dialog.addEventListener('click',async event=>{
    const action=event.target.closest('[data-invite-action]')?.dataset.inviteAction;if(!action)return;
    dialog.querySelector('.invitation-send-menu').open=false;
    try{
     if(action==='email'&&graphicEmail){await prepareImage();return;}
     if(action==='image-share'&&imageFile){await navigator.share({files:files(),title:'Try '+p.name,text:body()});status.textContent='Sharing options closed. Review the image, link, and any PDF in your email app before sending.';return;}
     if(action==='email-copy'){
      if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined'){status.textContent='Formatted copying is unavailable. Download the PNG, open your email draft, and insert the image.';return;}
      const html=`<div style="font-family:Arial,sans-serif;color:#302638;max-width:600px"><p>${escape(message.value.trim()).replace(/\n/g,'<br>')}</p><a href="${escape(p.url)}"><img src="${escape(p.image)}" alt="${escape(p.name)} project preview" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0"></a><h2>${escape(p.name)}</h2><p>${escape(p.description)}</p><p><a href="${escape(p.url)}" style="color:#6035aa;font-weight:bold">Try this project →</a></p><p><a href="${escape(p.url)}">${escape(p.url)}</a></p></div>`;
      await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([body()],{type:'text/plain'})})]);
      status.textContent='Illustrated email copied. Paste into your email composer and review it before sending.'+(extraPdf?' Attach '+extraPdf.name+' separately.':'');return;
     }
     if(action==='remove-document'){attachmentVersion++;extraPdf=undefined;documentInput.value='';dialog.querySelector('[data-document-status]').textContent='No extra document selected.';dialog.querySelector('[data-invite-action="remove-document"]').hidden=true;updateShare();return;}
     if(action==='email-draft'||action==='email'){location.href='mailto:?subject='+encodeURIComponent('Try '+p.name)+'&body='+encodeURIComponent(body());status.textContent=graphicEmail?'Your draft contains text and the link. Paste the illustrated email or insert the PNG, and attach any optional PDF before sending.':'Finish reviewing and send in your email app.';return;}
     if(action==='link'){await navigator.clipboard.writeText(p.url);status.textContent='Link copied. Paste it into Messages and send it on its own to request a graphic preview.';}
     if(action==='copy'){await navigator.clipboard.writeText(profile?p.url:body());status.textContent='Invitation copied. Paste it into your conversation.';}
     if(action==='native'&&!navigator.share){status.textContent='Choose Email, Text, or copy the link to use another app.';dialog.querySelector('#invite-url').select();return;}
     if(action==='native'){await navigator.share({title:p.name,text:message.value.trim(),url:p.url});status.textContent='Sharing options closed. Your app handles delivery.';}
     if(action==='text'){location.href='sms:?body='+encodeURIComponent(body());status.textContent='Finish reviewing and send in your messaging app.';}
    }catch(error){if(error.name!=='AbortError'){status.textContent=['image-share','email-copy'].includes(action)?'Automatic sharing is unavailable. Download the PNG and insert it into your email draft; attach any optional PDF separately.':'Automatic sharing is unavailable. Select and copy the project link above.';}}
   });
  }catch{if(dialog.isConnected)dialog.querySelector('[role="status"]').textContent='This invitation is unavailable. Only public profiles and published project listings can be shared here.';}
 });
})();
