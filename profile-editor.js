(() => {
let avatarValue;
function selected(value){document.querySelectorAll('[data-avatar]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.avatar===value)));}

document.querySelectorAll('[data-avatar]').forEach(button => button.onclick = () => { avatarValue=button.dataset.avatar;selected(avatarValue); document.getElementById('avatar-preview').src=avatarValue || 'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#dcebdd"/><text x="48" y="60" text-anchor="middle" font-size="36" fill="#17332a">'+(document.getElementById('displayName').value.trim().slice(0,1)||'M').replace(/[<>&"']/g,'')+'</text></svg>'); });
document.getElementById('photo').onchange = async event => {
 const file=event.target.files[0]; if(!file)return;
 const status=document.getElementById('profile-status');
 if(file.size>5*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)){status.textContent='Choose a JPG, PNG, or WebP under 5 MB.';return;}
 try {const bitmap=await createImageBitmap(file); const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const edge=Math.min(bitmap.width,bitmap.height);canvas.getContext('2d').drawImage(bitmap,(bitmap.width-edge)/2,(bitmap.height-edge)/2,edge,edge,0,0,256,256);bitmap.close();avatarValue=canvas.toDataURL('image/jpeg',0.85);selected(undefined);document.getElementById('avatar-preview').src=avatarValue;status.textContent='Photo ready. Save your profile to apply it.';}catch{status.textContent='That photo could not be read.';}
};
document.getElementById('profile-form').addEventListener('submit', async event => {
 event.preventDefault(); const form=event.currentTarget, values=new FormData(form), button=form.querySelector('button[type="submit"]'), status=document.getElementById('profile-status');
 button.disabled=true; status.textContent='Saving…';
 try { const result=await fetch('/api/me',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({creatorType:values.get('creatorType'),location:values.get('location'),locationPublic:values.get('locationPublic')==='on',avatar:avatarValue,website:values.get('website'),displayName:values.get('displayName'),label:values.get('label'),bio:values.get('bio'),isPublic:values.get('isPublic')==='on'})}); const data=await result.json(); if(!result.ok)throw new Error(data.error||'Please try again.'); status.textContent='Your profile is saved.'; }
 catch(error){status.textContent=error.message||'Your profile could not be saved. Please try again.';} finally{button.disabled=false;}
});
})();
