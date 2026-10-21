// In-place reading uses the same protected routes as full pages; no client grants access.
(() => {
 // Shared ownership keeps the page locked while drawers are stacked.
 function createDrawerState(){
  const owners=new Map(),inertRoots=new Map();let saved;
  function restoreBackground(){for(const [element,inert] of inertRoots)element.inert=inert;inertRoots.clear();}
  return {
   lock(owner,{inertBackground=false}={}){
    if(owners.has(owner))return;
    if(!owners.size){
     const style=document.body.style,properties=['position','top','left','width','overflow','paddingRight'];
     saved={styles:Object.fromEntries(properties.map(key=>[key,style[key]])),x:window.scrollX,y:window.scrollY};
     const stableGutter=(getComputedStyle(document.documentElement).scrollbarGutter||'').includes('stable');
     const gutter=stableGutter?0:Math.max(0,window.innerWidth-document.documentElement.clientWidth);
     if(gutter)style.paddingRight=`${parseFloat(getComputedStyle(document.body).paddingRight||'0')+gutter}px`;
     style.position='fixed';style.top=`-${saved.y}px`;style.left=`-${saved.x}px`;style.width='100%';style.overflow='hidden';
    }
    owners.set(owner,inertBackground);
    if(inertBackground)for(const element of document.body.children){
     if(element.matches('dialog,[data-detail-overlay],script,style,link'))continue;
     if(!inertRoots.has(element))inertRoots.set(element,element.inert);
     element.inert=true;
    }
   },
   unlock(owner){
    if(!owners.delete(owner))return;
    if(![...owners.values()].some(Boolean))restoreBackground();
    if(owners.size)return;
    // Joining can restore a different catalog position while a drawer is open.
    const y=Number.parseFloat(document.body.style.top),x=Number.parseFloat(document.body.style.left);
    Object.assign(document.body.style,saved.styles);
    window.scrollTo({left:Number.isFinite(x)?-x:saved.x,top:Number.isFinite(y)?-y:saved.y,behavior:'instant'});
    saved=undefined;
   }
  };
 }
 window.CWDrawerState=createDrawerState();
 let dialog,opener,loadVersion=0,panelId=0;const parents=[];
 function closePanel(){const target=dialog;if(!target||target.dataset.closing)return;loadVersion++;if(matchMedia('(prefers-reduced-motion: reduce)').matches){target.close();return;}target.dataset.closing='true';target.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${target.classList.contains('profile-panel')?'-':''}65px)`}],{duration:200,easing:'ease-in',fill:'forwards'}).finished.then(()=>target.isConnected&&target.dataset.closing==='true'&&target.close(),()=>{});}
 const allowed=url=>url.origin===location.origin&&(/^\/(people|projects)\/[a-z0-9-]+$/.test(url.pathname)||['/admin/project','/dashboard/project'].includes(url.pathname));
 function show(content,kind='project'){
  if(dialog?.dataset.closing){delete dialog.dataset.closing;dialog.getAnimations().forEach(animation=>animation.cancel());}
  if(kind==='project'&&dialog?.classList.contains('profile-panel')){parents.push({dialog,opener});dialog=undefined;}
  if(!dialog){opener=document.activeElement;dialog=document.createElement('dialog');dialog.className='cw-overlay';dialog.setAttribute('aria-label','Details');dialog.innerHTML='<header class="overlay-toolbar"><span class="overlay-brand" aria-label="TryMyBuild"><img class="brand-mark" src="/assets/brand/trymybuild-mark.svg" width="40" height="40" alt=""><span class="brand-name">TryMy<span class="brand-name-works">Build</span></span></span><button type="button" aria-label="Close detail window">×</button></header><div class="overlay-content"></div>';document.body.append(dialog);dialog.querySelector('button').onclick=closePanel;dialog.addEventListener('cancel',event=>{event.preventDefault();closePanel();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePanel();}});const created=dialog,returnFocus=opener;dialog.addEventListener('close',()=>{loadVersion++;created.remove();window.CWDrawerState.unlock(created);const parent=parents.pop();dialog=parent?.dialog||null;opener=parent?.opener;returnFocus?.isConnected&&returnFocus.focus({preventScroll:true});});window.CWDrawerState.lock(created);dialog.showModal();}
  dialog.classList.toggle('profile-panel',kind==='profile');dialog.classList.toggle('public-project-panel',kind==='project'&&!!(content.matches?.('.project-detail-content.invitation-detail')||content.querySelector?.('.project-detail-content.invitation-detail')));dialog.querySelector('.overlay-content').replaceChildren(content);if(!dialog.contains(document.activeElement))dialog.querySelector('.overlay-toolbar button').focus({preventScroll:true});return dialog;
 }
 async function open(href,kind='project'){
  const url=new URL(href,location.origin);if(!allowed(url))return;
  const loading=document.createElement('p');loading.textContent='Loading…';show(loading,kind);const version=++loadVersion;
  try{const response=await fetch(url,{credentials:'same-origin',headers:{Accept:'text/html'}});if(!response.ok)throw Error(response.status===404?'This profile or project is not available.':'Unable to load this view. Please try again.');
   const doc=new DOMParser().parseFromString(await response.text(),'text/html'),content=doc.querySelector('[data-panel-content]')||doc.querySelector('.cw-admin-content')||doc.querySelector('main');if(!content)throw Error('This view could not be loaded.');
   content.querySelectorAll('script,iframe,object,embed,base').forEach(el=>el.remove());
   if(content.matches('[data-public-project]')){
    content.querySelectorAll(':scope > .invite-actions').forEach(el=>el.remove());
    // A creator profile may be opened above the same app's catalog drawer.
    // Keep imported labels and tabs distinct from that still-open view.
    const ids=new Map(),prefix='project-panel-'+(++panelId)+'-';
    content.querySelectorAll('[id]').forEach(el=>{ids.set(el.id,prefix+el.id);el.id=prefix+el.id;});
    content.querySelectorAll('[for],[aria-controls],[aria-labelledby],[aria-describedby]').forEach(el=>{
     for(const attr of ['for','aria-controls','aria-labelledby','aria-describedby'])if(el.hasAttribute(attr))el.setAttribute(attr,el.getAttribute(attr).split(' ').map(id=>ids.get(id)||id).join(' '));
    });
   }
   if(version!==loadVersion||!dialog)return;show(content,kind);dialog.querySelector('.overlay-toolbar button').focus({preventScroll:true});window.dispatchEvent(new Event('cw-panel-ready'));
  }catch(error){if(version!==loadVersion||!dialog)return;const p=document.createElement('p');p.setAttribute('role','alert');p.textContent=error.message;show(p,kind);}
 }
 window.CWPanels={open,show(html,kind){const template=document.createElement('template');template.innerHTML=html;show(template.content,kind);}};
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-panel],a[href^="/projects/"],a[href^="/people/"],a[href^="/admin/project?"],a[href^="/dashboard/project?"]');
  if(link&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0){const url=new URL(link.href);if(allowed(url)){event.preventDefault();event.stopPropagation();const menu=link.closest('.account-menu');if(menu){menu.open=false;menu.querySelector('summary').focus();}open(url.href,url.pathname.startsWith('/people/')?'profile':'project');}}
  document.querySelectorAll('.inline-help[open],.project-actions[open],.cw-member-menu[open]').forEach(el=>{if(!el.contains(event.target))el.open=false;});
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){const opened=[...document.querySelectorAll('.inline-help[open],.project-actions[open],.cw-member-menu[open]')];if(opened.length){event.preventDefault();opened.forEach(el=>el.open=false);opened.at(-1).querySelector('summary').focus();}}});
 function composer(form){const field=form.querySelector('textarea[name="message"]');if(!field)return;form.querySelector('.send-arrow').hidden=!field.value.trim();field.setCustomValidity(field.value.trim()?'':'Write a message.');}
 document.addEventListener('input',event=>{const form=event.target.closest('[data-inline-compose]');if(form)composer(form);});
 document.addEventListener('input',event=>{const form=event.target.closest('[data-direct-compose]');if(form)form.querySelector('.send-arrow').hidden=!form.elements.message.value.trim();});
 // Native validation must be able to focus required controls inside collapsed details.
 document.addEventListener('invalid',event=>{const detail=event.target.closest('details');if(detail)detail.open=true;},true);
 async function loadConversation(details){
  const region=details.querySelector('.message-body');if(!region||region.dataset.loaded==='true')return;
  region.textContent='Loading conversation…';
  try{const r=await fetch('/dashboard/'+(details.dataset.conversationKind==='direct'?'direct/':'thread/')+encodeURIComponent(details.dataset.conversation)+'?fragment=1');if(!r.ok)throw Error();const doc=new DOMParser().parseFromString(await r.text(),'text/html'),section=doc.querySelector('[data-conversation-content]');if(!section)throw Error();region.replaceChildren(section);region.dataset.loaded='true';
   markVisibleReads();
  }catch{region.innerHTML='<p role="alert">This conversation could not be loaded. Close and reopen to retry.</p>';}
 }
 function markVisibleReads(){document.querySelectorAll('[data-mark-thread-read]').forEach(form=>{if(form.dataset.marked||!form.getClientRects().length&&form.closest('details')&&!form.closest('details').open)return;form.dataset.marked='true';fetch(form.action,{method:'POST',body:new URLSearchParams(new FormData(form))}).then(r=>{if(!r.ok)delete form.dataset.marked;}).catch(()=>delete form.dataset.marked);});}
 new MutationObserver(markVisibleReads).observe(document.body,{childList:true,subtree:true});markVisibleReads();
 let messageFilterTimer;
 function applyMessageFilters(form){const params=new URLSearchParams(new FormData(form));for(const [key,value] of [...params])if(!String(value).trim()||key==='sort'&&value==='newest')params.delete(key);location.assign('/dashboard/messages'+(params.size?'?'+params:''));}
 document.addEventListener('change',event=>{const form=event.target.closest('[data-message-filters]');if(form&&event.target.matches('select'))applyMessageFilters(form);});
 document.addEventListener('input',event=>{const form=event.target.closest('[data-message-filters]');if(!form||!event.target.matches('input[name="q"]'))return;clearTimeout(messageFilterTimer);messageFilterTimer=setTimeout(()=>applyMessageFilters(form),350);});
 document.addEventListener('toggle',event=>{const details=event.target;if(details.matches?.('[data-conversation]')&&details.open)loadConversation(details);},true);
 document.addEventListener('submit',async event=>{
  const block=event.target.closest('[data-direct-block]');if(block){if(!confirm(block.elements.action.value==='block'?'Block messages between you and this person?':'Allow messages between you and this person again?'))event.preventDefault();return;}
  const direct=event.target.closest('[data-direct-compose]');if(direct){event.preventDefault();const field=direct.elements.message,status=direct.querySelector('[data-direct-status]'),button=direct.querySelector('.send-arrow');if(!direct.reportValidity())return;button.disabled=true;status.textContent='Sending…';
   try{const r=await fetch(direct.action,{method:'POST',body:new URLSearchParams(new FormData(direct))}),data=await r.json();if(!r.ok)throw Error(data.error);field.value='';direct.reset();direct.elements.requestId.value=crypto.randomUUID();button.hidden=true;status.textContent=data.message;const detail=direct.closest('[data-conversation]');if(detail){detail.querySelector('.message-body').dataset.loaded='false';await loadConversation(detail);}else{const link=document.createElement('a');link.href=data.href;link.textContent=' Open in Messages';status.append(link);}}
   catch(error){status.textContent=error.message||'Unable to send. Your text is still here.';}finally{button.disabled=false;}return;
  }
  const credit=event.target.closest('[data-credit-request]');if(credit){if(!confirm(credit.elements.action.value==='cancel'?'Cancel this feedback request?':'Post this question with your published project? There is no credit charge and a response is not guaranteed.'))event.preventDefault();return;}
  const form=event.target.closest('[data-inline-compose]');if(!form)return;event.preventDefault();composer(form);if(!form.reportValidity())return;
  const button=form.querySelector('.send-arrow'),status=form.querySelector('[data-inline-status]');button.disabled=true;status.textContent='Sending…';
  try{const r=await fetch(form.action,{method:'POST',headers:{Accept:'application/json'},body:new URLSearchParams(new FormData(form))});const data=await r.json();if(!r.ok)throw Error(data.error||'Your message was not sent.');
   if(data.duplicate){status.textContent='You already started a conversation on this project. ';const link=document.createElement('a');link.href=data.href;link.textContent='Open Messages to continue';status.append(link);return;}
   form.querySelector('textarea[name="message"]').value='';composer(form);status.textContent=data.message||'Sent.';if(form.elements.requestId)form.elements.requestId.value=crypto.randomUUID();
   const details=form.closest('[data-conversation]');if(details){details.querySelector('.message-body').dataset.loaded='false';await loadConversation(details);}else if(data.href){const a=document.createElement('a');a.href=data.href;a.textContent=' Open conversation';status.append(a);}
  }catch(error){status.textContent=error.message||'Your message was not sent. Your text is still here.';}finally{button.disabled=false;}
 });
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-project-action]');if(!button)return;
  const action=button.dataset.projectAction;
  if(action==='delete'&&!confirm('Delete this private draft? This cannot be undone. Published projects and projects with activity cannot be deleted here.'))return;
  if(action==='unpublish'&&!confirm('Remove this project from public discovery or withdraw its review? Your project and feedback will remain in your account.'))return;
  button.disabled=true;const status=button.closest('[data-project-card]')?.querySelector('[data-project-action-status]')||dialog?.querySelector('[data-project-action-status]');
  try{const r=await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id:button.dataset.id,version:Number(button.dataset.version),confirm:action==='delete'?'DELETE':undefined})}),data=await r.json();if(!r.ok)throw Error(data.error||'Not saved.');if(data.cleanupPending)alert('The draft was deleted, but its preview file needs cleanup. Please contact support.');location.reload();}catch(error){if(status)status.textContent=error.message;button.disabled=false;}
 });
})();

document.addEventListener('click',event=>{const tab=event.target.closest('[data-profile-tab]');if(!tab)return;const card=tab.closest('[data-profile-slug]');card.querySelectorAll('[data-profile-tab]').forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1;});card.querySelectorAll('[data-profile-pane]').forEach(p=>p.hidden=p.dataset.profilePane!==tab.dataset.profileTab);});

document.addEventListener('keydown',event=>{const tab=event.target.closest('[data-profile-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=[...tab.parentElement.querySelectorAll('[data-profile-tab]')],index=tabs.indexOf(tab),next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].click();tabs[next].focus();});

document.addEventListener('click',async event=>{
 const begin=event.target.closest('[data-exchange-begin]');
 if(begin){
  const onboarding=begin.closest('[data-exchange-onboarding]'),intro=onboarding?.querySelector('[data-exchange-intro]'),wizard=onboarding?.querySelector('[data-exchange-wizard]');
  if(intro&&wizard){intro.hidden=true;wizard.hidden=false;wizard.classList.add('is-entering');setTimeout(()=>wizard.classList.remove('is-entering'),260);wizard.querySelector('input[name="slug"]')?.focus();}
  return;
 }
 const move=event.target.closest('[data-exchange-next],[data-exchange-back]');
 if(move){
  const wizard=move.closest('[data-exchange-wizard]'),current=wizard?.querySelector('.exchange-wizard-step:not([hidden])');
  if(!wizard||!current)return;
  const step=Number(current.dataset.exchangeStep);
  if(move.matches('[data-exchange-next]')){
   const invalid=current.querySelector(':invalid');if(invalid){invalid.reportValidity();return;}
   if(step===2)await loadExchangePartners(wizard);
   showExchangeStep(wizard,step+1);
  }else if(step===1){
   wizard.hidden=true;const intro=wizard.closest('[data-exchange-onboarding]')?.querySelector('[data-exchange-intro]');if(intro){intro.hidden=false;intro.querySelector('[data-exchange-begin]')?.focus();}
  }else showExchangeStep(wizard,step-1);
  return;
 }
 const suggestion=event.target.closest('[data-exchange-prompt]');
 if(suggestion){
  const field=suggestion.closest('.exchange-start-form')?.querySelector('textarea[name="question"]');
  if(field&&!suggestion.disabled){field.value=suggestion.dataset.exchangePrompt;field.dispatchEvent(new Event('input',{bubbles:true}));field.focus();}
  return;
 }
 const dismiss=event.target.closest('[data-dismiss-exchange-ended]');
 if(dismiss)dismiss.closest('[data-exchange-ended]')?.remove();
});

function showExchangeStep(wizard,step){
 wizard.querySelectorAll('[data-exchange-step]').forEach(panel=>{const active=Number(panel.dataset.exchangeStep)===step;panel.hidden=!active;if(active){panel.classList.add('is-entering');setTimeout(()=>panel.classList.remove('is-entering'),260);}});
 wizard.querySelectorAll('[data-exchange-progress]').forEach(item=>{const value=Number(item.dataset.exchangeProgress);item.classList.toggle('is-current',value===step);item.classList.toggle('is-done',value<step);});
 const active=wizard.querySelector(`[data-exchange-step="${step}"]`);active?.setAttribute('tabindex','-1');active?.focus({preventScroll:true});active?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
}

async function loadExchangePartners(wizard){
 const slug=wizard.querySelector('input[name="slug"]:checked')?.value,list=wizard.querySelector('[data-exchange-partner-list]');
 if(!slug||!list||list.dataset.loadedFor===slug)return;
 list.innerHTML='<p class="cw-meta" role="status">Finding available partners…</p>';
 try{
  const response=await fetch('/api/suggested-testers?project='+encodeURIComponent(slug));if(!response.ok)throw Error();
  const data=await response.json(),testers=Array.isArray(data.testers)?data.testers:[];
  const cards=testers.map((tester,index)=>{const name=String(tester.name||'TryMyBuild maker'),initials=name.split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();return `<label class="exchange-partner-option"><input type="radio" name="partner" value="${exchangeEscape(tester.slug)}" ${index===0?'checked':''} required><span class="exchange-partner-avatar">${tester.avatar?`<img src="${exchangeEscape(tester.avatar)}" alt="">`:`<span aria-hidden="true">${exchangeEscape(initials)}</span>`}</span><span class="exchange-partner-copy"><strong>${exchangeEscape(name)}</strong><small>${exchangeEscape(tester.label||'TryMyBuild maker')}</small><span>Wants feedback on <b>${exchangeEscape(tester.project?.title||'their app')}</b></span></span><span class="exchange-partner-check" aria-hidden="true">✓</span></label>`;}).join('');
  const queue=`<label class="exchange-partner-option exchange-partner-queue"><input type="radio" name="partner" value="queue" ${testers.length?'':'checked'} required><span class="exchange-partner-avatar" aria-hidden="true">⌛</span><span class="exchange-partner-copy"><strong>Let TryMyBuild match me</strong><small>Join the queue if you do not have a preference.</small></span><span class="exchange-partner-check" aria-hidden="true">✓</span></label>`;
  list.innerHTML=cards+queue;list.dataset.loadedFor=slug;
 }catch{list.innerHTML='<p class="exchange-partner-error" role="status">Partners could not be loaded right now. Go back and try again.</p>';}
}

function exchangeEscape(value){return String(value||'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));}
