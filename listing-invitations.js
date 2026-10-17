(() => {
 const reviewHashes=new Set(['#invitation-review','#founder-feedback']);
 const arrivalHash=document.querySelector('#invitation-app-panel')&&reviewHashes.has(location.hash)?location.hash:'';
 let cancelReviewArrival=()=>{};
 // Suppress the browser's immediate fragment jump while the drawer is mounted.
 if(arrivalHash)history.replaceState(history.state,'',location.pathname+location.search);
 function reviewArrival(hash){
  cancelReviewArrival();
  const panel=document.querySelector('.cw-overlay[open]'),review=panel?.querySelector('#invitation-review');
  if(!panel||!review)return;
  const path=location.pathname+location.search,oldBehavior=panel.style.scrollBehavior;
  let delay,frame,stopped=false;
  panel.style.scrollBehavior='auto';panel.scrollTop=0;
  const destination=()=>Math.max(0,Math.min(panel.scrollHeight-panel.clientHeight,review.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop-24));
  const restoreHash=()=>{if(location.pathname+location.search===path&&!location.hash)history.replaceState(history.state,'',path+hash);};
  const stop=()=>{
   if(stopped)return;stopped=true;clearTimeout(delay);cancelAnimationFrame(frame);
   window.removeEventListener('load',begin);
   for(const type of ['wheel','touchstart','pointerdown','keydown'])panel.removeEventListener(type,stop,true);
   panel.removeEventListener('close',stop);panel.style.scrollBehavior=oldBehavior;
   if(document.readyState==='complete')restoreHash();else window.addEventListener('load',restoreHash,{once:true});
   if(cancelReviewArrival===stop)cancelReviewArrival=()=>{};
  };
  const begin=()=>{
   if(stopped)return;
   if(matchMedia('(prefers-reduced-motion: reduce)').matches){panel.scrollTop=destination();stop();return;}
   delay=setTimeout(()=>{
    const start=performance.now();
    const step=now=>{
     if(stopped)return;if(!panel.open||!review.isConnected){stop();return;}
     const progress=Math.min(1,(now-start)/2400),eased=progress<.5?4*progress**3:1-(-2*progress+2)**3/2;
     panel.scrollTop=destination()*eased;
     if(progress<1)frame=requestAnimationFrame(step);else stop();
    };
    frame=requestAnimationFrame(step);
   },900);
  };
  cancelReviewArrival=stop;
  for(const type of ['wheel','touchstart','pointerdown','keydown'])panel.addEventListener(type,stop,{capture:true,passive:true});
  panel.addEventListener('close',stop,{once:true});
  if(document.readyState==='complete')begin();else window.addEventListener('load',begin,{once:true});
 }
 const openInvitationPanel=(kind='app')=>{
  cancelReviewArrival();
  const template=document.querySelector(kind==='claim'?'#invitation-claim-panel':'#invitation-app-panel');
  if(!template||!window.CWPanels)return;
  window.CWPanels.show(template.innerHTML,'project');window.dispatchEvent(new Event('cw-panel-ready'));
 };
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-invitation-open]')){event.preventDefault();openInvitationPanel();}
  if(event.target.closest('[data-invitation-edit]')){event.preventDefault();openInvitationPanel('claim');}
  if(event.target.closest('[data-invitation-review]')){event.preventDefault();cancelReviewArrival();document.querySelector('.cw-overlay #invitation-review')?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
  const decline=event.target.closest('[data-decline-invitation]');
  if(decline){event.preventDefault();void declineInvitation(decline);}
 });
 async function declineInvitation(button){
  if(button.disabled||!confirm('Remove this private preview from TryMyBuild? This invitation link will stop working. Your own website will not be affected.'))return;
  const status=button.parentElement.querySelector('[data-decline-status]');button.disabled=true;status.textContent='Removing preview…';
  try{
   const response=await fetch('/api/listing-invitation/'+encodeURIComponent(button.dataset.declineInvitation)+'/decline',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),data=await response.json();
   if(!response.ok)throw Error(data.error||'This preview could not be removed.');
   cancelReviewArrival();
   const panel=button.closest('[data-panel-content]');
   panel.innerHTML='<section class="invitation-declined"><p class="eyebrow">Invitation declined</p><h1>This preview has been removed.</h1><p>TryMyBuild will no longer show this private preview. Your own website has not been changed.</p><a class="secondary-button" href="/">Explore TryMyBuild</a></section>';
  }catch(error){status.textContent=error.message;button.disabled=false;}
 }
 const boot=()=>{if(document.querySelector('#invitation-app-panel')){openInvitationPanel();if(arrivalHash)reviewArrival(arrivalHash);}mountInvitationForm();};
 if(document.readyState==='complete')boot();else document.addEventListener('DOMContentLoaded',boot,{once:true});
 window.addEventListener('cw-panel-ready',mountInvitationForm);
 window.addEventListener('hashchange',()=>{if(reviewHashes.has(location.hash)){const hash=location.hash;history.replaceState(history.state,'',location.pathname+location.search);openInvitationPanel();reviewArrival(hash);}});
 function mountInvitationForm(){
 const admin=document.querySelector('[data-listing-invitation-admin]'),claim=document.querySelector('[data-listing-invitation-claim]'),form=admin||claim;
 const testerTarget=document.querySelector('[data-listing-invitation-testers]'),esc=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
 if(testerTarget)fetch('/api/tester-preview').then(response=>response.ok?response.json():Promise.reject()).then(data=>{
  const testers=Array.isArray(data.testers)?data.testers:[];
  testerTarget.innerHTML=testers.length?testers.map(tester=>{const name=tester.name||'TryMyBuild member',initials=tester.initials||String(name).slice(0,2).toUpperCase(),details=[tester.label,tester.project?.category].filter(Boolean).join(' · ');return `<article class="listing-invitation-tester"><a href="/people/${encodeURIComponent(String(tester.slug||''))}">${tester.avatar?`<img src="${esc(tester.avatar)}" alt="" loading="lazy">`:`<span aria-hidden="true">${esc(initials)}</span>`}<span><strong>${esc(name)}</strong><small>${esc(details||'Open to early app feedback')}</small></span></a>${tester.bio?`<p>${esc(tester.bio)}</p>`:''}</article>`;}).join(''):'<p>No tester profiles are available right now. You can still invite people you know after publishing.</p>';
 }).catch(()=>{testerTarget.innerHTML='<p>Tester profiles are temporarily unavailable. You can still continue with your app.</p>';});
 document.querySelector('[data-copy-invitation]')?.addEventListener('click',async()=>{const input=document.querySelector('[data-invitation-link]'),status=document.querySelector('[data-copy-status]');try{await navigator.clipboard.writeText(input.value);status.textContent='Preview link copied.';}catch{input.select();status.textContent='Select and copy the preview link above.';}});
 if(!form||form.dataset.invitationMounted)return;form.dataset.invitationMounted='true';
 const status=form.querySelector('[data-invitation-status]'),button=form.querySelector('[type=submit]');
 let image='',source='uploaded',imageUrl='',busy=false;
 const formData=()=>Object.fromEntries(new FormData(form));
 function updatePreview(){for(const name of ['title','does','helps','firstTry','category']){const target=document.querySelector('[data-preview-'+name+']'),input=form.elements.namedItem(name);if(target&&input)target.textContent=input.value||({title:'Your app name',does:'A clear introduction to your app',helps:'Explain what someone will gain from using your app.',firstTry:'Give someone one simple action to start with.',category:'Your app'}[name]);}}
 const storageKey=claim?'trymybuild-invitation-edits:'+claim.dataset.token:'';
 function preserve(){if(!claim)return true;try{sessionStorage.setItem(storageKey,JSON.stringify({version:Number(form.dataset.version),details:formData()}));return true;}catch{return false;}}
 if(claim){try{const saved=JSON.parse(sessionStorage.getItem(storageKey)||'null');if(saved&&saved.version===Number(form.dataset.version)){for(const [name,value] of Object.entries(saved.details)){const field=form.elements.namedItem(name);if(field&&typeof value==='string'&&!['confirm','terms'].includes(name))field.value=value;}}}catch{}}
 form.addEventListener('input',()=>{updatePreview();preserve();});updatePreview();
 function showImage(data,kind){image=data;source=kind;imageUrl=form.elements.namedItem('url').value;const img=document.querySelector('[data-invitation-screenshot]');img.src=data;img.hidden=false;document.querySelector('[data-image-placeholder]')?.remove();}
 async function setBusy(run){if(busy)return;busy=true;const controls=[...form.querySelectorAll('button,input[type=file]')];for(const control of controls)control.disabled=true;try{await run();}finally{busy=false;for(const control of controls)control.disabled=false;}}
 admin?.querySelector('[data-invitation-capture]')?.addEventListener('click',()=>setBusy(async()=>{
  const label=form.querySelector('[data-invitation-image-status]'),url=form.elements.namedItem('url').value;label.textContent='Preparing website screenshot…';
  try{const r=await fetch('/api/listing-preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})}),data=await r.json();if(!r.ok)throw Error(data.error);showImage(data.image,'captured');label.textContent='Screenshot ready. Save the preview when the details look right.';}catch(error){label.textContent=error.message||'Capture failed. Upload a screenshot instead.';}
 }));
 admin?.querySelector('[data-invitation-upload]')?.addEventListener('change',event=>setBusy(async()=>{
  const file=event.target.files[0],label=form.querySelector('[data-invitation-image-status]');if(!file)return;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024){label.textContent='Choose a PNG, JPG or WebP under 5 MB.';return;}
  try{const bitmap=await createImageBitmap(file),scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();showImage(canvas.toDataURL('image/jpeg',.85),'uploaded');label.textContent='Screenshot ready. Save the preview when the details look right.';}catch{label.textContent='That image could not be read. Choose another screenshot.';}
 }));
 admin?.querySelector('[data-revoke-invitation]')?.addEventListener('click',()=>setBusy(async()=>{if(!confirm('Withdraw this preview link? The creator will no longer be able to claim it.'))return;status.textContent='Withdrawing invitation…';try{const r=await fetch('/api/admin/listing-invitations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'revoke',id:form.dataset.id,version:Number(form.dataset.version)})}),data=await r.json();if(!r.ok)throw Error(data.error);location.reload();}catch(error){status.textContent=error.message;}}));
 form.addEventListener('submit',event=>{event.preventDefault();void setBusy(async()=>{
  const details=formData();status.textContent='';
  if(claim&&claim.dataset.authenticated!=='true'){
   if(!preserve()){status.textContent='Your browser could not keep these edits for sign-in. Enable browser storage and try again.';return;}
   location.href='/auth/sign-in?signup=1&next='+encodeURIComponent(location.pathname);return;
  }
  if(claim&&claim.dataset.matchingAccount!=='true'){status.textContent='Use the email address that received this invitation.';return;}
  if(admin&&image&&source==='captured'&&details.url!==imageUrl){status.textContent='The website URL changed after capture. Capture it again or upload a screenshot for this URL.';return;}
  const payload={...details};let url;
  if(admin){if(!form.dataset.id)form.dataset.id=crypto.randomUUID();payload.id=form.dataset.id;if(form.dataset.version!==undefined)payload.version=Number(form.dataset.version);if(image){payload.image=image;payload.source=source;}url='/api/admin/listing-invitations';}
  else{payload.version=Number(form.dataset.version);url='/api/listing-invitation/'+claim.dataset.token+'/claim';}
  status.textContent='Saving private preview…';
  try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),data=await r.json();if(!r.ok)throw Error(data.error||'Saving was not confirmed. Reload to check before retrying.');if(claim){try{sessionStorage.removeItem(storageKey);}catch{}}location.href=admin?data.adminUrl+'&saved=1':data.href;}catch(error){status.textContent=error.message;}
 });});
 }
})();
