// Short-return prompts can be paused for this visit, never permanently.
(()=>{
 const legacyKey='trymybuild-hide-short-return-prompts';
 const key='trymybuild-short-return-pause-session-v1';
 const idleMs=30*60*1000;
 const day=now=>new Date(now).toDateString();
 let pause=null;
 try{pause=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
 const persist=()=>{try{if(pause)sessionStorage.setItem(key,JSON.stringify(pause));else sessionStorage.removeItem(key);}catch{/* In-memory preference still works for this page. */}};
 const active=()=>{
  if(!pause)return false;
  const now=Date.now();
  if(!Number.isFinite(pause.lastSeen)||pause.lastSeen>now||now-pause.lastSeen>=idleMs||pause.day!==day(now)){
   pause=null;persist();return false;
  }
  return true;
 };
 // Migrate a former permanent opt-out once into a temporary preference.
 try{if(localStorage.getItem(legacyKey)==='1'&&!active())pause={lastSeen:Date.now(),day:day(Date.now())};localStorage.removeItem(legacyKey);}catch{}
 active();persist();
 const touch=()=>{if(active()){pause.lastSeen=Date.now();persist();}};
 const suppressed=kind=>kind!=='detailed'&&active();
 const option=()=>'<label class="return-prompt-preference"><input type="checkbox" data-hide-short-return-prompts'+(active()?' checked':'')+'> Don’t ask again this session</label>';
 window.CWReturnPrompts={suppressed,option};
 document.addEventListener('change',event=>{
  if(!event.target.matches('[data-hide-short-return-prompts]'))return;
  pause=event.target.checked?{lastSeen:Date.now(),day:day(Date.now())}:null;persist();
 });
 // Hidden/restored tabs do not extend a pause indefinitely. Expiry itself
 // never opens a dialog; the next eligible app visit triggers the usual flow.
 document.addEventListener('visibilitychange',touch);
 window.addEventListener('pagehide',touch);
 window.addEventListener('pageshow',touch);
 window.setInterval(()=>{if(document.visibilityState==='visible')touch();},60000);
})();
