(() => {
const form=document.getElementById('profile-form');
if(!form)return;
const status=document.getElementById('profile-status'),editorAvatar=document.getElementById('avatar-preview'),previewAvatar=document.querySelector('[data-profile-preview-avatar]'),nameInput=document.getElementById('displayName'),labelInput=document.getElementById('label'),bioInput=document.getElementById('bio'),websiteInput=document.getElementById('website'),locationInput=document.getElementById('location'),locationPublic=form.elements.locationPublic,isPublic=form.elements.isPublic;
let avatarValue,usingInitial=document.querySelector('[data-avatar=""]')?.getAttribute('aria-pressed')==='true',photoReady=form.dataset.photoReady==='true';
const cleanInitial=()=>nameInput.value.trim().slice(0,1).replace(/[<>&"']/g,'')||'M';
const initialAvatar=()=> 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#dcebdd"/><text x="48" y="60" text-anchor="middle" font-size="36" fill="#17332a">'+cleanInitial()+'</text></svg>');
function setAvatar(src){editorAvatar.src=src;previewAvatar.src=src;}
function selected(value){document.querySelectorAll('[data-avatar]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.avatar===value)));}
function text(target,value,fallback){document.querySelector(target).textContent=value.trim()||fallback;}
function updateReadiness(){
 const ready={photo:photoReady,bio:Boolean(bioInput.value.trim()),website:Boolean(websiteInput.value.trim())};let complete=0;
 Object.entries(ready).forEach(([key,value])=>{const item=document.querySelector('[data-profile-ready="'+key+'"]');item.classList.toggle('is-complete',value);if(value)complete+=1;});
 const title=document.querySelector('[data-profile-readiness-title]'),copy=document.querySelector('[data-profile-readiness-copy]'),remaining=3-complete;
 title.textContent=complete===3?'Your profile is ready':remaining+' step'+(remaining===1?'':'s')+' to strengthen your profile';
 copy.textContent=complete===3?'People can quickly understand who you are and what you make.':'Add the missing details when you are ready.';
}
function updatePreview(){
 text('[data-profile-preview-name]',nameInput.value,'Your name');text('[data-profile-preview-label]',labelInput.value,'What you do');text('[data-profile-preview-bio]',bioInput.value,'Tell people what you make and what you care about.');
 const place=document.querySelector('[data-profile-preview-location]'),showPlace=locationPublic.checked&&locationInput.value.trim();place.hidden=!showPlace;place.textContent=showPlace?'⌖ '+locationInput.value.trim():'';
 const website=document.querySelector('[data-profile-preview-website]'),websiteValue=websiteInput.value.trim();website.hidden=!websiteValue;website.textContent=websiteValue.replace(/^https?:\/\//,'').replace(/\/$/,'');try{const url=new URL(websiteValue);website.href=['http:','https:'].includes(url.protocol)?url.href:'#';}catch{website.href='#';}
 const publicNow=isPublic.checked,chip=document.querySelector('[data-profile-visibility-chip]'),copy=document.querySelector('[data-profile-visibility-copy]'),switchText=document.querySelector('.profile-visibility-switch span');chip.textContent=publicNow?'Public':'Private';chip.className=publicNow?'profile-stage-visibility is-public':'profile-stage-visibility is-private';copy.textContent=publicNow?'Anyone can view your profile.':'Only you can view your profile.';switchText.textContent=publicNow?'Public':'Private';
 if(usingInitial)setAvatar(initialAvatar());
 updateReadiness();
}
function markChanged(){status.textContent='Unsaved changes.';updatePreview();}
document.querySelectorAll('[data-profile-edit]').forEach(button=>button.onclick=()=>{const input=document.getElementById(button.dataset.profileEdit);input?.focus();input?.scrollIntoView({behavior:'smooth',block:'center'});});
document.querySelectorAll('[data-avatar]').forEach(button=>button.onclick=()=>{avatarValue=button.dataset.avatar;usingInitial=!avatarValue;photoReady=Boolean(avatarValue);selected(avatarValue);setAvatar(avatarValue||initialAvatar());document.querySelector('.profile-avatar-picker')?.removeAttribute('open');markChanged();});
document.getElementById('photo').onchange=async event=>{
 const file=event.target.files[0];if(!file)return;
 if(file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type)){status.textContent='Choose a JPG, PNG, or WebP under 5 MB.';return;}
 try{const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=canvas.height=256;const edge=Math.min(bitmap.width,bitmap.height);canvas.getContext('2d').drawImage(bitmap,(bitmap.width-edge)/2,(bitmap.height-edge)/2,edge,edge,0,0,256,256);bitmap.close();avatarValue=canvas.toDataURL('image/jpeg',.85);usingInitial=false;photoReady=true;selected(undefined);setAvatar(avatarValue);updateReadiness();status.textContent='Photo ready. Save changes to apply it.';}catch{status.textContent='That photo could not be read.';}
};
for(const input of [nameInput,labelInput,bioInput,websiteInput,locationInput,locationPublic,isPublic])input.addEventListener(input.type==='checkbox'?'change':'input',markChanged);
form.addEventListener('submit',async event=>{
 event.preventDefault();const values=new FormData(form),button=form.querySelector('button[type="submit"]');button.disabled=true;status.textContent='Saving…';
 try{const result=await fetch('/api/me',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({creatorType:values.get('creatorType'),location:values.get('location'),locationPublic:values.get('locationPublic')==='on',avatar:avatarValue,website:values.get('website'),displayName:values.get('displayName'),label:values.get('label'),bio:values.get('bio'),isPublic:values.get('isPublic')==='on'})}),data=await result.json();if(!result.ok)throw new Error(data.error||'Please try again.');status.textContent='Your profile is saved.';}
 catch(error){status.textContent=error.message||'Your profile could not be saved. Please try again.';}finally{button.disabled=false;}
});
updatePreview();
})();
