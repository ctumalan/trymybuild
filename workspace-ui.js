// In-place reading uses the same protected routes as full pages; no client grants access.
(() => {
 let dialog,opener,loadVersion=0;const parents=[];
 function closePanel(){const target=dialog;if(!target||target.dataset.closing)return;loadVersion++;if(matchMedia('(prefers-reduced-motion: reduce)').matches){target.close();return;}target.dataset.closing='true';target.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${target.classList.contains('profile-panel')?'-':''}65px)`}],{duration:200,easing:'ease-in',fill:'forwards'}).finished.then(()=>target.isConnected&&target.dataset.closing==='true'&&target.close(),()=>{});}
 const allowed=url=>url.origin===location.origin&&(/^\/(people|projects)\/[a-z0-9-]+$/.test(url.pathname)||['/admin/project','/dashboard/project'].includes(url.pathname));
 function show(content,kind='project'){
  if(dialog?.dataset.closing){delete dialog.dataset.closing;dialog.getAnimations().forEach(animation=>animation.cancel());}
  if(kind==='project'&&dialog?.classList.contains('profile-panel')){parents.push({dialog,opener});dialog=undefined;}
  if(!dialog){opener=document.activeElement;dialog=document.createElement('dialog');dialog.className='cw-overlay';dialog.setAttribute('aria-label','Details');dialog.innerHTML='<header class="overlay-toolbar"><span>TryMyBuild</span><button type="button" aria-label="Close detail window">×</button></header><div class="overlay-content"></div>';document.body.append(dialog);dialog.querySelector('button').onclick=closePanel;dialog.addEventListener('cancel',event=>{event.preventDefault();closePanel();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closePanel();}});dialog.addEventListener('close',()=>{loadVersion++;dialog.remove();opener?.isConnected&&opener.focus({preventScroll:true});const parent=parents.pop();dialog=parent?.dialog||null;opener=parent?.opener;});dialog.showModal();}
  dialog.classList.toggle('profile-panel',kind==='profile');dialog.querySelector('.overlay-content').replaceChildren(content);return dialog;
 }
 async function open(href,kind='project'){
  const url=new URL(href,location.origin);if(!allowed(url))return;
  const loading=document.createElement('p');loading.textContent='Loading…';show(loading,kind);const version=++loadVersion;
  try{const response=await fetch(url,{credentials:'same-origin',headers:{Accept:'text/html'}});if(!response.ok)throw Error(response.status===404?'This profile or project is not available.':'Unable to load this view. Please try again.');
   const doc=new DOMParser().parseFromString(await response.text(),'text/html'),content=doc.querySelector('[data-panel-content]')||doc.querySelector('.cw-admin-content')||doc.querySelector('main');if(!content)throw Error('This view could not be loaded.');
   content.querySelectorAll('script,iframe,object,embed,base').forEach(el=>el.remove());
   if(content.matches('[data-public-project]')){content.querySelectorAll(':scope > .invite-actions').forEach(el=>el.remove());}
   if(version!==loadVersion||!dialog)return;show(content,kind);dialog.querySelector('.overlay-toolbar button').focus({preventScroll:true});window.dispatchEvent(new Event('cw-panel-ready'));
  }catch(error){if(version!==loadVersion||!dialog)return;const p=document.createElement('p');p.setAttribute('role','alert');p.textContent=error.message;show(p,kind);}
 }
 window.CWPanels={open,show(html,kind){const template=document.createElement('template');template.innerHTML=html;show(template.content,kind);}};
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[data-panel],a[href^="/projects/"],a[href^="/people/"],a[href^="/admin/project?"],a[href^="/dashboard/project?"]');
  if(link&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey&&event.button===0){const url=new URL(link.href);if(allowed(url)){event.preventDefault();event.stopPropagation();const menu=link.closest('.account-menu');if(menu){menu.open=false;menu.querySelector('summary').focus();}open(url.href,url.pathname.startsWith('/people/')?'profile':'project');}}
  document.querySelectorAll('.inline-help[open],.project-actions[open]').forEach(el=>{if(!el.contains(event.target))el.open=false;});
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape'){const opened=[...document.querySelectorAll('.inline-help[open],.project-actions[open]')];if(opened.length){event.preventDefault();opened.forEach(el=>el.open=false);opened.at(-1).querySelector('summary').focus();}}});
 function composer(form){const field=form.querySelector('textarea[name="message"]');if(!field)return;const count=(field.value.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[]).length;form.querySelector('.send-arrow').hidden=!field.value.trim();const output=form.querySelector('[data-inline-count]');if(output){output.textContent=`${count} / 7–150 words`;output.hidden=!field.value.trim();}field.setCustomValidity(count>=7&&count<=150?'':'Write 7–150 words.');}
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
