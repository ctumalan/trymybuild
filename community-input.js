document.addEventListener('input',event=>{
 const field=event.target.closest('[data-community-field]');if(!field)return;
 const count=(field.value.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[]).length;
 const output=document.getElementById(field.dataset.counterId);if(output){output.textContent=`Word count: ${count}`;output.classList.toggle('invalid',count>0&&(count<7||count>150));if(!output.nextElementSibling?.classList.contains('word-rules')){const rules=document.createElement('small');rules.className='word-rules';rules.textContent='Minimum: 7 words · Maximum: 150 words';output.after(rules);}}
 field.setCustomValidity(count>=7&&count<=150?'':'Write 7–150 words.');
});
document.querySelectorAll('[data-community-field]').forEach(field=>field.dispatchEvent(new Event('input',{bubbles:true})));
const dashboardMenu=document.querySelector('.cw-dashboard-menu');
if(dashboardMenu){const narrow=matchMedia('(max-width:760px)');const adapt=()=>{dashboardMenu.open=!narrow.matches;};adapt();narrow.addEventListener('change',adapt);}
const revealCreditRules=()=>{if(location.hash==='#credit-rules'){const rules=document.getElementById('credit-rules');if(rules)rules.open=true;}};
revealCreditRules();addEventListener('hashchange',revealCreditRules);
document.querySelectorAll('[data-mark-thread-read]').forEach(form=>{
 fetch(form.action,{method:'POST',body:new URLSearchParams(new FormData(form)),credentials:'same-origin'}).catch(()=>{});
});
document.addEventListener('change',event=>{
 if(event.target.name!=='attempt')return;
 const prompt=document.querySelector('[data-review-prompt]');
 if(prompt)prompt.textContent=event.target.value==='not_tried'?'What would you like to ask? (No automatic credit until you try it.)':['stuck','blocked'].includes(event.target.value)?'What were you trying to do, and what stopped you?':'What did you try, and what happened?';
});

// Keep completed feedback locally through joining. Posting always requires a member.
(()=>{
 const key=slug=>'trymybuild-guided-feedback:'+slug;
 const save=form=>{try{localStorage.setItem(key(form.elements.slug.value),JSON.stringify(Object.fromEntries(new FormData(form))));return true;}catch{return false;}};
 const hydrate=root=>root.querySelectorAll('[data-guided-feedback]').forEach(form=>{let draft;try{draft=JSON.parse(localStorage.getItem(key(form.elements.slug.value))||'null');}catch{}if(draft)for(const [name,value] of Object.entries(draft)){const field=form.elements.namedItem(name);if(!field)continue;if(field instanceof RadioNodeList){for(const input of field)input.checked=input.value===value;}else if(name!=='slug')field.value=value;}form.querySelectorAll('[data-community-field]').forEach(field=>field.dispatchEvent(new Event('input',{bubbles:true})));});
 let feedbackDialog=null,modalId=0;
 async function open(slug){
  if(!/^[a-z0-9-]+$/.test(slug)||feedbackDialog?.isConnected)return;
  const opener=document.activeElement,dialog=document.createElement('dialog');feedbackDialog=dialog;
  dialog.className='return-feedback-dialog guided-feedback-dialog';dialog.setAttribute('aria-labelledby','guided-feedback-title');
  dialog.innerHTML='<button type="button" class="return-feedback-close" aria-label="Close feedback">×</button><h2 id="guided-feedback-title">Give feedback</h2><div data-feedback-body><p role="status">Loading feedback form…</p></div>';
  const close=()=>{dialog.close();dialog.remove();if(feedbackDialog===dialog)feedbackDialog=null;opener?.isConnected&&opener.focus({preventScroll:true});};
  dialog.querySelector('button').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  document.body.append(dialog);dialog.showModal();
  try{
   const response=await fetch('/tell/'+encodeURIComponent(slug),{credentials:'same-origin'});if(!response.ok)throw Error();
   const doc=new DOMParser().parseFromString(await response.text(),'text/html'),panel=doc.querySelector('[data-guided-panel]');if(!panel)throw Error();if(!dialog.isConnected)return;
   panel.querySelectorAll('script,iframe,object,embed,base').forEach(el=>el.remove());panel.className='guided-feedback-content';panel.querySelector('h1,h2')?.remove();
   // The underlying page can contain another feedback form. Keep imported labels unique.
   const ids=new Map(),prefix='guided-modal-'+(++modalId)+'-';panel.querySelectorAll('[id]').forEach(el=>{ids.set(el.id,prefix+el.id);el.id=prefix+el.id;});
   panel.querySelectorAll('[for],[aria-describedby],[data-counter-id]').forEach(el=>{for(const attribute of ['for','aria-describedby','data-counter-id'])if(el.hasAttribute(attribute))el.setAttribute(attribute,el.getAttribute(attribute).split(' ').map(id=>ids.get(id)||id).join(' '));});
   const name=doc.querySelector('.cw-project h2')?.textContent;if(name)dialog.querySelector('h2').textContent='Give feedback on '+name;
   dialog.querySelector('[data-feedback-body]').replaceChildren(panel);hydrate(dialog);
  }catch{
   if(!dialog.isConnected)return;const region=dialog.querySelector('[data-feedback-body]'),notice=document.createElement('p'),link=document.createElement('a');notice.setAttribute('role','alert');notice.textContent='The feedback form could not load. Please try the feedback page.';link.href='/tell/'+encodeURIComponent(slug);link.textContent='Open feedback page';region.replaceChildren(notice,link);
  }
 }
 window.CWGuidedFeedback={hydrate,open};hydrate(document);window.addEventListener('cw-panel-ready',()=>hydrate(document));
 document.addEventListener('click',event=>{const link=event.target.closest('a[data-guided-open]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();open(link.dataset.guidedOpen);});
 window.addEventListener('cw-feedback-resume',event=>{if(!location.pathname.startsWith('/tell/'))open(event.detail);});
 document.addEventListener('input',event=>{const form=event.target.closest('[data-guided-feedback]');if(form)save(form);});document.addEventListener('change',event=>{const form=event.target.closest('[data-guided-feedback]');if(form)save(form);});
 document.addEventListener('submit',async event=>{
  const form=event.target.closest('[data-guided-feedback]');if(!form)return;event.preventDefault();const status=form.querySelector('[data-guided-status]'),count=(form.elements.message.value.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[]).length;
  if(count<7||count>150){status.textContent='Write 7–150 words about your experience.';form.elements.message.focus();return;}
  if(!save(form)){status.textContent='Your browser cannot keep this draft. Enable site storage before joining.';return;}
  const button=form.querySelector('[type="submit"]');button.disabled=true;
  try{const me=await fetch('/api/me').then(r=>{if(!r.ok)throw Error('Unable to check your account. Please try again.');return r.json();});if(!me.authenticated){window.CWJoin.offer({action:'feedback',slug:form.elements.slug.value,project:form.closest('.return-feedback-dialog')?form.elements.slug.value:undefined,browse:window.CWBrowseContext?.()});return;}
   const r=await fetch('/api/feedback',{method:'POST',headers:{Accept:'application/json'},body:new URLSearchParams(new FormData(form))}),data=await r.json();if(!r.ok)throw Error(data.error);localStorage.removeItem(key(form.elements.slug.value));form.reset();status.textContent=data.duplicate?'You already started a conversation on this app.':'Your feedback was sent.';const a=document.createElement('a');a.href=data.href;a.textContent=' Open in Messages';status.append(a);
  }catch(error){status.textContent=error.message||'Unable to send. Your draft is kept.';}finally{button.disabled=false;}
 });
})();
