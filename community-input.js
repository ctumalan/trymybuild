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
 const hydrate=root=>root.querySelectorAll('[data-guided-feedback]').forEach(form=>{let draft;try{draft=JSON.parse(localStorage.getItem(key(form.elements.slug.value))||'null');}catch{}if(!draft)return;for(const [name,value] of Object.entries(draft)){const field=form.elements.namedItem(name);if(!field)continue;if(field instanceof RadioNodeList){for(const input of field)input.checked=input.value===value;}else if(name!=='slug')field.value=value;}form.querySelectorAll('[data-community-field]').forEach(field=>field.dispatchEvent(new Event('input',{bubbles:true})));});
 window.CWGuidedFeedback={hydrate};hydrate(document);window.addEventListener('cw-panel-ready',()=>hydrate(document));
 document.addEventListener('input',event=>{const form=event.target.closest('[data-guided-feedback]');if(form)save(form);});document.addEventListener('change',event=>{const form=event.target.closest('[data-guided-feedback]');if(form)save(form);});
 document.addEventListener('submit',async event=>{
  const form=event.target.closest('[data-guided-feedback]');if(!form)return;event.preventDefault();const status=form.querySelector('[data-guided-status]'),count=(form.elements.message.value.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[]).length;
  if(count<7||count>150){status.textContent='Write 7–150 words about your experience.';form.elements.message.focus();return;}
  if(!save(form)){status.textContent='Your browser cannot keep this draft. Enable site storage before joining.';return;}
  const button=form.querySelector('[type="submit"]');button.disabled=true;
  try{const me=await fetch('/api/me').then(r=>{if(!r.ok)throw Error('Unable to check your account. Please try again.');return r.json();});if(!me.authenticated){window.CWJoin.offer({action:'feedback',slug:form.elements.slug.value,project:form.closest('.return-feedback-dialog')?form.elements.slug.value:undefined});return;}
   const r=await fetch('/api/feedback',{method:'POST',headers:{Accept:'application/json'},body:new URLSearchParams(new FormData(form))}),data=await r.json();if(!r.ok)throw Error(data.error);localStorage.removeItem(key(form.elements.slug.value));form.reset();status.textContent=data.duplicate?'You already started a conversation on this app.':'Your feedback was sent.';const a=document.createElement('a');a.href=data.href;a.textContent=' Open in Messages';status.append(a);
  }catch(error){status.textContent=error.message||'Unable to send. Your draft is kept.';}finally{button.disabled=false;}
 });
})();
