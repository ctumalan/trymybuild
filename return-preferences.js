// A browser preference applies to short return prompts across all project views.
(()=>{
 const key='trymybuild-hide-short-return-prompts';
 const suppressed=kind=>{if(kind==='detailed')return false;try{return localStorage.getItem(key)==='1';}catch{return false;}};
 const option=()=>'<label class="return-prompt-preference"><input type="checkbox" data-hide-short-return-prompts> Don’t show this again</label>';
 window.CWReturnPrompts={suppressed,option};
 document.addEventListener('change',event=>{if(!event.target.matches('[data-hide-short-return-prompts]'))return;try{if(event.target.checked)localStorage.setItem(key,'1');else localStorage.removeItem(key);}catch{const status=event.target.closest('dialog')?.querySelector('[role=status]');if(status)status.textContent='This browser cannot remember your preference.';}});
})();
