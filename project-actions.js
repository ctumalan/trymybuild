document.addEventListener('click',async event=>{
 const play=event.target.closest('[data-load-video]');if(play){const url=CWMedia.videoUrl(play.dataset.loadVideo);if(url){const frame=document.createElement('iframe');frame.src=url;frame.title='Project video';frame.allow='fullscreen; picture-in-picture';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation');frame.setAttribute('allowfullscreen','');frame.referrerPolicy='strict-origin-when-cross-origin';play.parentElement.replaceChildren(frame);}return;}
 const button=event.target.closest('[data-save-public]');if(!button)return;
 const status=button.closest('article,section,main')?.querySelector('[data-save-status]');button.disabled=true;
 try{const me=await fetch('/api/me').then(r=>r.json());if(!me.authenticated){window.CWJoin.offer({action:'save',slug:button.dataset.savePublic,project:button.closest('.cw-overlay:not(.profile-panel)')?.querySelector('[data-public-project]')?.dataset.publicProject});return;}
 const r=await fetch('/api/saved',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:button.dataset.savePublic,saved:button.dataset.saved!=='true'})});if(!r.ok)throw Error();button.dataset.saved=button.dataset.saved==='true'?'false':'true';button.textContent=button.dataset.saved==='true'?'♥ Saved':'♡ Save';if(status)status.textContent=button.dataset.saved==='true'?'Saved to your dashboard.':'Removed from saved projects.';window.dispatchEvent(new Event('cw-saved-changed'));
 }catch{if(status)status.textContent='That change could not be saved. Please try again.';}finally{button.disabled=false;}
});

function hydratePublicSaves(){fetch('/api/saved').then(r=>r.ok?r.json():null).then(data=>{if(!Array.isArray(data?.saved))return;document.querySelectorAll('[data-save-public]').forEach(button=>{const saved=data.saved.includes(button.dataset.savePublic);button.dataset.saved=String(saved);button.textContent=saved?'♥ Saved':'♡ Save';});}).catch(()=>{});}
hydratePublicSaves();window.addEventListener('cw-saved-changed',hydratePublicSaves);window.addEventListener('cw-panel-ready',hydratePublicSaves);
// Release notes contain creator text; insert it as text, never HTML.
if(location.pathname.startsWith('/projects/')&&document.querySelector('.recipient-answers')){
 const slug=location.pathname.split('/')[2];
 fetch('/api/builds/'+encodeURIComponent(slug)).then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{
  if(!data.events.length)return;
  const section=document.createElement('section');section.className='cw-panel';section.id='build-updates';
  const heading=document.createElement('h2');heading.textContent='Builds & improvements';section.append(heading);
  const current=data.builds.find(b=>b.id===data.active),label=document.createElement('p');label.textContent='Active build: '+(current?.version||'Not selected');section.append(label);
  for(const event of [...data.events].reverse()){
   const build=data.builds.find(b=>b.id===event.buildId);if(!build)continue;
   const item=document.createElement('article');item.id='build-'+event.id;
   const title=document.createElement('h3');title.textContent='Build '+build.version;
   const date=document.createElement('p');date.className='cw-meta';date.textContent='Activated '+new Date(event.createdAt).toLocaleDateString();
   const notes=document.createElement('p');notes.textContent=build.notes;item.append(title,date,notes);section.append(item);
  }
  document.querySelector('.recipient-answers').after(section);
  if(/^#build-[0-9a-f-]+$/.test(location.hash))document.getElementById(location.hash.slice(1))?.scrollIntoView();
 }).catch(()=>{});
}

// The app catalog has its own return prompts. Other public views keep the same timing.
if(!document.getElementById('app')){
 let visit;const prompted=new Set();
 document.addEventListener('click',event=>{const link=event.target.closest('[data-try-app]');if(link)visit={slug:link.dataset.tryApp,awayAt:null};});
 const depart=()=>{if(visit&&visit.awayAt===null)visit.awayAt=Date.now();};
 async function returned(){
  if(!visit||visit.awayAt===null||document.visibilityState!=='visible'||!document.hasFocus())return;
  const elapsed=Date.now()-visit.awayAt,slug=visit.slug;visit=null;if(elapsed<7000)return;
  const kind=elapsed<15000?'quick':elapsed>120000?'detailed':'comment';if(prompted.has(slug+kind)||document.querySelector('.invitation-dialog[open],.return-feedback-dialog[open]'))return;prompted.add(slug+kind);
  if(kind==='detailed'){window.CWGuidedFeedback.open(slug);return;}
  if(kind==='quick'){const dialog=document.createElement('dialog');dialog.className='return-feedback-dialog';const choices=[['too_much_to_read','Too much to read'],['hard_to_understand','Hard to understand'],['unexpected','Not what I expected'],['curious','Just curious']];dialog.innerHTML='<h2>A quick thought?</h2><p>Anything that made you stop exploring?</p><form><fieldset><legend>Select any that fit</legend>'+choices.map(([v,l])=>'<label><input type="checkbox" name="reason" value="'+v+'">'+l+'</label>').join('')+'</fieldset><button class="primary-button" type="submit">Send response</button><p role="status"></p></form><button type="button" data-dismiss>Not now</button>';document.body.append(dialog);dialog.showModal();const close=()=>{dialog.close();dialog.remove();};dialog.querySelector('[data-dismiss]').onclick=close;dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();const reasons=[...dialog.querySelectorAll('input:checked')].map(i=>i.value),status=dialog.querySelector('[role=status]');if(!reasons.length){status.textContent='Choose an option first.';return;}const button=dialog.querySelector('[type=submit]');button.disabled=true;try{const r=await fetch('/api/quick-feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug,reasons,requestId:dialog.dataset.requestId||=crypto.randomUUID()})}),data=await r.json();if(!r.ok)throw Error(data.error);status.textContent=data.message;dialog.querySelector('[data-dismiss]').textContent='Done';}catch(error){status.textContent=error.message;button.disabled=false;}};return;}
  const field=document.querySelector('[data-public-comment="'+slug+'"] textarea');field?.focus();
 }
 window.addEventListener('blur',depart);window.addEventListener('focus',returned);document.addEventListener('visibilitychange',()=>document.visibilityState==='hidden'?depart():returned());
}
