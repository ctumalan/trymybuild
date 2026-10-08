// Invitations are reviewed here; the chosen app handles delivery.
(()=>{
 const escape=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));let dismissPrevious;
 document.addEventListener('click',async event=>{
  const copy=event.target.closest('[data-copy-feedback-link]');
  if(copy?.dataset.copyFeedbackLink){
   event.preventDefault();
   const status=copy.closest('.tester-handoff')?.querySelector('[data-copy-feedback-status]');
   try{await navigator.clipboard.writeText(new URL('/projects/'+encodeURIComponent(copy.dataset.copyFeedbackLink)+'?invite=1',location.origin).href);if(status)status.textContent='Feedback link copied. Share it with someone who could use your app.';}
   catch{if(status)status.textContent='Could not copy. Open your feedback page and copy its address.';}
   return;
  }

  const trigger=event.target.closest('[data-share-product],[data-invite-project],[data-share-profile]');if(!trigger)return;event.preventDefault();dismissPrevious?.();
  const slug=trigger.dataset.shareProduct||trigger.dataset.inviteProject,profile=trigger.dataset.shareProfile,dialog=document.createElement('dialog');dialog.className='invitation-dialog';dialog.setAttribute('aria-labelledby','invite-title');
  dialog.innerHTML='<button type="button" class="invite-close" aria-label="Close invitation">×</button><h2 id="invite-title">Your invitation</h2><p role="status">Preparing preview…</p>';document.body.append(dialog);dialog.showModal();
  let imageFile,imageUrl,extraPdf,disposeSocial;const controller=new AbortController();
  const close=()=>{disposeSocial?.();controller.abort();if(imageUrl)URL.revokeObjectURL(imageUrl);dialog.close();dialog.remove();trigger.isConnected&&trigger.focus({preventScroll:true});dismissPrevious=undefined;};dismissPrevious=close;dialog.querySelector('.invite-close').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  try{
   const r=await fetch(profile?'/api/profile-invitation/'+encodeURIComponent(profile):'/api/invitation/'+encodeURIComponent(slug),{signal:controller.signal});if(!r.ok)throw Error();const p=await r.json();if(!dialog.isConnected)return;
   const trial=Boolean(p.isOwner&&p.trialQuestion),graphicEmail=Boolean(!profile&&!p.privateListing&&p.image),inviteUrl=p.feedbackUrl||p.url,defaultText=profile?`Meet ${p.name} on TryMyBuild and explore their projects.`:trial?`Hi! I selected you as one of the first people to try ${p.name}. Would you spend about 5–10 minutes trying this: ${p.firstTry || 'the main feature'}? I especially want to learn: ${p.trialQuestion} Open the link, try the app, then return to the Feedback tab. I’d like to hear what worked and where you got stuck.`:p.isOwner?`Hi! I’ve been working on ${p.name}, and it’s ready for a first try. Would you try ${p.firstTry || 'the main feature'}? I’d like to learn what felt useful, confusing, or missing. Open the link, try the app, then return to the Feedback tab.`:`Hi! I found ${p.name} and thought you might enjoy it. Would you give it a try? I’d love to hear what you think.`;
   const preview=graphicEmail?`<section class="invitation-preview invitation-preview-graphic" aria-label="Project preview"><figure><a href="${escape(inviteUrl)}" target="_blank" rel="noopener"><img src="${escape(p.image)}" alt="Invitation to try ${escape(p.name)}"></a><figcaption><strong>${escape(p.name)}</strong><span>${escape(p.category)} · Built by ${escape(p.builder)}</span></figcaption>${trial?`<div class="invitation-trial-details"><p><strong>Try this:</strong> ${escape(p.firstTry)}</p><p><strong>Question:</strong> ${escape(p.trialQuestion)}</p></div>`:''}</figure></section>`:`<section class="invitation-preview" aria-label="Project preview"><article>${p.image?`<a href="${escape(inviteUrl)}" target="_blank" rel="noopener"><img src="${escape(p.image)}" alt="${escape(p.name)} — ${escape(p.description)}"></a>`:''}<div><span class="eyebrow">${escape(p.category)}</span><h3>${escape(p.name)}</h3><p>${escape(p.description)}</p>${trial?`<p><strong>Try this:</strong> ${escape(p.firstTry)}</p><p><strong>Question:</strong> ${escape(p.trialQuestion)}</p>`:''}<small>Built by ${escape(p.builder)}</small></div></article></section>`;
   const memberInvites=p.isOwner&&!p.privateListing?`<section class="suggested-testers" data-suggested-testers><div><p class="eyebrow">TryMyBuild members</p><h3>Invite someone who wants a feedback swap</h3><p>These members agreed to appear as suggested testers. If you invite someone, offer to try their app and share honest feedback too.</p></div><div class="suggested-tester-list" data-suggested-list><p class="cw-meta" role="status">Finding available members…</p></div></section>`:'';
   dialog.innerHTML=`<button type="button" class="invite-close" aria-label="Close invitation">×</button><h2 id="invite-title">${p.isOwner?'Invite a tester':'Your invitation'}</h2><label for="invite-message">Your message</label><textarea id="invite-message" maxlength="500">${escape(defaultText)}</textarea>${preview}${memberInvites}${p.privateListing?'<p class="cw-meta">Your listing stays private. This shares your app’s own link.</p>':''}<label for="invite-url">${profile?'Profile':p.isOwner?'Feedback':'Project'} link</label><input id="invite-url" readonly value="${escape(inviteUrl)}"><fieldset class="invite-delivery"><legend>Send with</legend>${[['email','Email'],['text','Text'],['copy','Copy invitation'],['link','Copy link'],['native','Choose an app']].map(([v,l],i)=>`<label><input type="radio" name="delivery" value="${v}" ${i===0?'checked':''}>${l}</label>`).join('')}</fieldset><div data-email-controls><label for="email-provider">Email app</label><select id="email-provider"><option value="device">Default email app</option><option value="gmail">Gmail in browser</option><option value="yahoo">Yahoo in browser</option><option value="outlook">Outlook in browser</option>${graphicEmail?'<option value="illustrated">Copy illustrated invitation</option>':''}</select>${graphicEmail?'<label class="invite-check"><input type="checkbox" id="include-image">Include project image</label><p class="cw-meta" data-image-help hidden>Your draft includes the message and link. To add the image, download it and use your email composer’s photo icon. Or choose “Copy illustrated invitation” to paste a linked image in a supported composer.</p><a class="cw-link" data-image-download hidden>Download PNG</a><label class="invite-check"><input type="checkbox" id="include-pdf">Add a PDF</label><div data-pdf-controls hidden><label for="invite-document">PDF · up to 10 MB</label><input id="invite-document" type="file" accept=".pdf,application/pdf"><p class="cw-meta">Attach it yourself in browser email. Files stay on this device.</p><p data-document-status role="status"></p></div>':''}</div><button class="primary-button" type="button" data-send-invitation>Open email draft</button><p class="cw-meta">Review and send in your chosen app.</p><p data-invite-status role="status" aria-live="polite"></p>`;
   const suggested=dialog.querySelector('[data-suggested-testers]');
   if(suggested){
    const list=suggested.querySelector('[data-suggested-list]');
    fetch('/api/suggested-testers?project='+encodeURIComponent(slug),{signal:controller.signal}).then(result=>result.ok?result.json():Promise.reject()).then(data=>{
     if(!dialog.isConnected)return;const testers=Array.isArray(data.testers)?data.testers:[];
     list.innerHTML=testers.length?testers.map(t=>{const initials=String(t.name||'Member').split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();return `<article class="suggested-tester"><a class="suggested-tester-profile" href="/people/${encodeURIComponent(t.slug)}" target="_blank" rel="noopener">${t.avatar?`<img src="${escape(t.avatar)}" alt="">`:`<span aria-hidden="true">${escape(initials)}</span>`}<span><strong>${escape(t.name)}</strong><small>${escape(t.label||'TryMyBuild member')}</small></span></a><p>${escape(t.bio||`Offering a feedback swap for ${t.project.title}.`)}</p><small>Wants feedback on <strong>${escape(t.project.title)}</strong>${t.project.category?' · '+escape(t.project.category):''}</small><button type="button" class="secondary-button" data-invite-member="${escape(t.slug)}" data-member-name="${escape(t.name)}" data-member-project="${escape(t.project.title)}">Invite &amp; offer feedback</button><p data-member-invite-status role="status"></p></article>`;}).join(''):'<p class="cw-meta">No opted-in members are available right now. You can still share the invitation directly.</p>';
    }).catch(error=>{if(error?.name!=='AbortError'&&dialog.isConnected)list.innerHTML='<p class="cw-meta">Member suggestions are unavailable right now. You can still share the invitation directly.</p>';});
   }
   if(p.social&&!profile&&!p.privateListing&&!p.isOwner){
    const personal=document.createElement('div');personal.dataset.personalPanel='';
    const title=dialog.querySelector('#invite-title');
    while(title.nextSibling)personal.append(title.nextSibling);
    dialog.append(personal);
    const modes=document.createElement('div');modes.className='share-modes';modes.setAttribute('role','group');modes.setAttribute('aria-label','Sharing style');
    modes.innerHTML='<button type="button" data-share-style="social" aria-pressed="true">Social media</button><button type="button" data-share-style="personal" aria-pressed="false">Email & text</button>';
    title.after(modes);
    const panel=document.createElement('section');panel.dataset.socialPanel='';panel.innerHTML='<p role="status">Designing your social post…</p>';dialog.append(panel);
    personal.hidden=true;title.textContent='Share '+p.name;dialog.classList.add('has-social-sharing');
    modes.addEventListener('click',event=>{const button=event.target.closest('[data-share-style]');if(!button)return;const social=button.dataset.shareStyle==='social';personal.hidden=social;panel.hidden=!social;dialog.classList.toggle('social-view',social);modes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});
    dialog.classList.add('social-view');
    import('/social-share.js').then(module=>{if(dialog.isConnected)disposeSocial=module.mountSocialShare(panel,p,controller.signal);}).catch(()=>{if(dialog.isConnected)panel.innerHTML='<p role="status">Social tools are unavailable. You can still share using Email & text.</p>';});
   }
   dialog.querySelector('.invite-close').onclick=close;const message=dialog.querySelector('#invite-message'),status=dialog.querySelector('[data-invite-status]'),body=()=>message.value.trim()+'\n\n'+inviteUrl;
   dialog.addEventListener('click',async event=>{
    const button=event.target.closest('[data-invite-member]');if(!button)return;
    const output=button.parentElement.querySelector('[data-member-invite-status]'),first=button.dataset.memberName.split(/\s+/)[0]||'there';button.disabled=true;button.textContent='Sending invitation…';output.textContent='';
    const directMessage=`Hi ${first}! I’d like to invite you to try ${p.name}. ${p.firstTry?`A good place to start is: ${p.firstTry}. `:''}I’d especially like to learn what felt useful, confusing, or missing. Since you volunteered for a feedback swap, I’d also be happy to try ${button.dataset.memberProject} and share what I notice. ${inviteUrl}`;
    try{const response=await fetch('/api/direct-messages',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({action:'send',recipient:button.dataset.inviteMember,requestId:crypto.randomUUID(),message:directMessage})});const data=await response.json();if(!response.ok)throw Error(data.error||'The invitation could not be sent.');const href=typeof data.href==='string'&&data.href.startsWith('/dashboard/messages?direct=')?data.href:'/dashboard/messages';button.textContent='Invitation sent';output.innerHTML=`Sent privately. <a href="${escape(href)}">Open conversation →</a>`;}
    catch(error){button.disabled=false;button.textContent='Invite & offer feedback';output.textContent=error.message||'The invitation could not be sent.';}
   });
   const prepareImage=async()=>{if(imageFile)return imageFile;const result=await fetch(p.image,{signal:controller.signal});if(!result.ok||!result.headers.get('content-type')?.includes('image/png'))throw Error('The image is unavailable. Retry or send the project link.');imageFile=new File([await result.blob()],String(slug).replace(/[^a-zA-Z0-9_-]/g,'-')+'-invitation.png',{type:'image/png'});if(!dialog.isConnected)return;imageUrl=URL.createObjectURL(imageFile);const a=dialog.querySelector('[data-image-download]');a.href=imageUrl;a.download=imageFile.name;a.hidden=!dialog.querySelector('#include-image')?.checked;return imageFile;};
   const updateAction=()=>{const delivery=dialog.querySelector('[name="delivery"]:checked').value,provider=dialog.querySelector('#email-provider').value;dialog.querySelector('[data-send-invitation]').textContent=delivery==='email'?(provider==='illustrated'?'Copy illustrated invitation':'Open email draft'):delivery==='text'?'Open text message':delivery==='native'?'Choose an app':delivery==='link'?'Copy link':'Copy invitation';};
   dialog.addEventListener('change',async event=>{
    if(event.target.name==='delivery')dialog.querySelector('[data-email-controls]').hidden=event.target.value!=='email';
    if(event.target.id==='email-provider'&&event.target.value==='illustrated'){const image=dialog.querySelector('#include-image');if(image){image.checked=true;image.dispatchEvent(new Event('change',{bubbles:true}));}}
    if(event.target.id==='include-image'){if(!event.target.checked&&dialog.querySelector('#email-provider').value==='illustrated')dialog.querySelector('#email-provider').value='device';dialog.querySelector('[data-image-help]').hidden=!event.target.checked;dialog.querySelector('[data-image-download]').hidden=!event.target.checked;if(event.target.checked)try{await prepareImage();}catch(error){status.textContent=error.message;}}
    if(event.target.id==='include-pdf'){dialog.querySelector('[data-pdf-controls]').hidden=!event.target.checked;if(!event.target.checked)extraPdf=undefined;}
    updateAction();
    if(event.target.id==='invite-document'){extraPdf=undefined;const file=event.target.files[0],out=dialog.querySelector('[data-document-status]');if(!file)return;if(file.size>10*1024*1024||!/^%PDF-/.test(await file.slice(0,5).text())){event.target.value='';out.textContent='Choose a valid PDF under 10 MB.';return;}extraPdf=file;out.textContent=file.name+' ready.';}
   });
   dialog.querySelector('[data-send-invitation]').onclick=async()=>{
    const delivery=dialog.querySelector('[name="delivery"]:checked').value,provider=dialog.querySelector('#email-provider').value,includeImage=dialog.querySelector('#include-image')?.checked,includePdf=dialog.querySelector('#include-pdf')?.checked;
    const subject='Try '+p.name;status.textContent='';
    try{
     if(delivery==='copy'||delivery==='link'){await navigator.clipboard.writeText(delivery==='link'?inviteUrl:body());status.textContent='Copied. Paste it into your conversation.';return;}
     if(delivery==='native'){if(!navigator.share)throw Error('Sharing is unavailable here. Choose Email, Text, or Copy.');await navigator.share({text:message.value.trim(),url:inviteUrl});return;}
     if(delivery==='text'){location.href='sms:?body='+encodeURIComponent(body());return;}
     if(provider==='illustrated'){
      if(!navigator.clipboard?.write||typeof ClipboardItem==='undefined')throw Error('Formatted copying is unavailable. Download the PNG and insert it in your email.');
      const html=`<div style="font-family:Arial,sans-serif;max-width:600px"><p>${escape(message.value.trim()).replace(/\n/g,'<br>')}</p><a href="${escape(inviteUrl)}"><img src="${escape(p.image)}" alt="${escape(p.name)}: ${escape(p.description)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0"></a><p><a href="${escape(inviteUrl)}">${escape(inviteUrl)}</a></p></div>`;
      await navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([body()],{type:'text/plain'})})]);status.textContent='Clickable illustrated email copied. Paste it in your email composer.'+(includePdf&&extraPdf?' Attach your PDF separately.':'');return;
     }
     if(provider==='device'&&(includeImage||includePdf)&&navigator.share){const files=[...(includeImage?[await prepareImage()]:[]),...(includePdf&&extraPdf?[extraPdf]:[])];if(files.length&&navigator.canShare?.({files})){await navigator.share({files,text:body()});return;}}
     const params=new URLSearchParams({subject,body:body()});let url='mailto:?'+params;
     if(provider==='gmail')url='https://mail.google.com/mail/?'+new URLSearchParams({view:'cm',fs:'1',su:subject,body:body()});
     if(provider==='yahoo')url='https://compose.mail.yahoo.com/?'+params;
     if(provider==='outlook')url='https://outlook.live.com/mail/0/deeplink/compose?'+params;
     if(provider==='device')location.href=url;else {window.open(url,'_blank','noopener,noreferrer');status.textContent='Review the draft in your browser email. Sign in there if needed.';}
     status.textContent+=(includeImage?' Insert the downloaded PNG in your draft.':'')+(includePdf&&extraPdf?' Attach your PDF before sending.':'');
    }catch(error){if(error.name!=='AbortError')status.textContent=error.message||'Unable to share. Copy the project link and try again.';}
   };

  }catch(error){if(error.name!=='AbortError'&&dialog.isConnected)dialog.querySelector('[role="status"]').textContent='This invitation is temporarily unavailable. Please try again.';}
 });
})();
