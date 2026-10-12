(() => {
 const admin=document.querySelector('[data-listing-invitation-admin]'),claim=document.querySelector('[data-listing-invitation-claim]'),form=admin||claim;
 document.querySelector('[data-copy-invitation]')?.addEventListener('click',async()=>{const input=document.querySelector('[data-invitation-link]'),status=document.querySelector('[data-copy-status]');try{await navigator.clipboard.writeText(input.value);status.textContent='Preview link copied.';}catch{input.select();status.textContent='Select and copy the preview link above.';}});
 if(!form)return;
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
})();
