// Progressive enhancement: controls remain usable without motion or browser storage.
(() => {
 const joinKey='trymybuild-join-context';
 window.CWJoin={
  offer(options={}){
   if(document.querySelector('.join-dialog[open]'))return;
   const opener=document.activeElement,dialog=document.createElement('dialog');dialog.className='invitation-dialog join-dialog';dialog.setAttribute('aria-labelledby','join-title');
   dialog.innerHTML='<button type="button" class="invite-close" aria-label="Close">×</button><h2 id="join-title">'+ (options.action==='save'?'Save this app for later':'Join to post your feedback')+'</h2><p>'+ (options.action==='save'?'You need an account to save apps.':'Your feedback is ready. Create an account or sign in to post it.')+'</p><div class="invite-actions"><a class="primary-button" data-join-signup>Create my account now</a><a class="secondary-button" data-join-signin>Sign in</a><button class="text-button" type="button" data-join-dismiss>Not now</button></div><p data-join-status role="status"></p>';
   const destination=location.pathname==='/'?'/':location.pathname;
   for(const [selector,signup] of [['[data-join-signup]',true],['[data-join-signin]',false]]){
    const link=dialog.querySelector(selector);link.href='/auth/sign-in?'+(signup?'signup=1&':'')+'next='+encodeURIComponent(destination);
    link.onclick=event=>{try{const profile=document.querySelector('.profile-panel [data-profile-slug]')?.dataset.profileSlug;sessionStorage.setItem(joinKey,JSON.stringify({...options,path:location.pathname+location.search+location.hash,scroll:document.body.style.position==='fixed'?Math.abs(parseFloat(document.body.style.top)||0):scrollY,profile,profileScroll:document.querySelector('.profile-panel')?.scrollTop||0,projectInPanel:!!document.querySelector('.cw-overlay:not(.profile-panel) [data-public-project]'),profileTab:document.querySelector('.profile-panel [data-profile-tab][aria-selected="true"]')?.dataset.profileTab,projectScroll:document.querySelector('.detail-scroll')?.scrollTop||document.querySelector('.cw-overlay:not(.profile-panel)')?.scrollTop||0,at:Date.now()}));}catch{event.preventDefault();dialog.querySelector('[data-join-status]').textContent='Your browser cannot keep this view through sign-in. Enable site storage and try again.';}};
   }
   const close=()=>{dialog.close();dialog.remove();opener?.isConnected&&opener.focus({preventScroll:true});};dialog.querySelector('.invite-close').onclick=close;dialog.querySelector('[data-join-dismiss]').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();close();});document.body.append(dialog);dialog.showModal();
  },
  async restore(session){
   if(!session?.authenticated||this.restoring)return;let context;try{context=JSON.parse(sessionStorage.getItem(joinKey)||'null');}catch{return;}if(!context)return;
   if(Date.now()-context.at>3600000){sessionStorage.removeItem(joinKey);return;}this.restoring=true;
   try{
    if(context.action==='save'){const r=await fetch('/api/saved',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:context.slug,saved:true})});if(!r.ok)throw Error('Your app could not be saved. Please try Save again.');}
    sessionStorage.removeItem(joinKey);
    const url=new URL(context.path,location.origin);if(url.origin===location.origin&&url.pathname===location.pathname)history.replaceState({},'',url);
    if(context.browse)window.CWRestoreBrowse?.(context.browse);
    if(context.profile)await window.CWPanels?.open('/people/'+context.profile,'profile');
    if(context.profileTab)document.querySelector('.profile-panel [data-profile-tab="'+context.profileTab+'"]')?.click();
    if(context.project){if(context.projectInPanel||context.profile)await window.CWPanels?.open('/projects/'+context.project,'project');else if(window.CWOpenProject){if(!window.CWOpenProject(context.project))window.addEventListener('cw-catalog-ready',()=>{window.CWOpenProject(context.project);window.CWSetDetailScroll?.(context.scroll||0,context.projectScroll||0);if(document.body.style.position==='fixed')document.body.style.top='-'+(context.scroll||0)+'px';},{once:true});}else await window.CWPanels?.open('/projects/'+context.project,'project');}
    window.CWSetDetailScroll?.(context.scroll||0,context.projectScroll||0);
    const profilePanel=document.querySelector('.profile-panel');if(profilePanel)profilePanel.scrollTop=context.profileScroll||0;const projectPanel=document.querySelector('.detail-scroll')||document.querySelector('.cw-overlay:not(.profile-panel)');if(projectPanel)projectPanel.scrollTop=context.projectScroll||0;
    if(document.body.style.position==='fixed')document.body.style.top='-'+(context.scroll||0)+'px';else window.scrollTo(0,context.scroll||0);window.dispatchEvent(new Event('cw-saved-changed'));
    if(context.action==='feedback')window.dispatchEvent(new CustomEvent('cw-feedback-resume',{detail:context.slug}));
   }catch(error){const p=document.createElement('p');p.className='cw-notice';p.setAttribute('role','alert');p.textContent=error.message;document.querySelector('main')?.prepend(p);}finally{this.restoring=false;}
  }
 };
 if(!document.getElementById('app'))fetch('/api/me').then(r=>r.ok?r.json():null).then(s=>window.CWJoin.restore(s)).catch(()=>{});
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 window.CWGuestComment={offer(status){const box=document.createElement('div');box.className='guest-comment-followup';box.innerHTML='<p>Sign up to get an in-site notification when your comment is published.</p><button type="button" class="secondary-button" data-comment-updates>Sign up for updates</button><button type="button" data-dismiss-comment-updates>Not now</button><small>Use this browser within 7 days. No email is sent.</small>';status.append(box);}};
 document.addEventListener('click',async event=>{const dismiss=event.target.closest('[data-dismiss-comment-updates]');if(dismiss){dismiss.closest('.guest-comment-followup').remove();return;}const button=event.target.closest('[data-comment-updates]');if(!button)return;button.disabled=true;try{const r=await fetch('/api/comment-updates',{method:'POST'}),data=await r.json();if(!r.ok)throw Error(data.error);location.href=data.href;}catch(error){button.disabled=false;button.closest('.guest-comment-followup').querySelector('small').textContent=error.message||'Please try again.';}});
 const grow=field=>{if(!field?.matches?.('textarea')||!field.getClientRects().length)return;const y=window.scrollY;field.style.height='auto';const h=Math.min(280,Math.max(56,field.scrollHeight+2));field.style.height=h+'px';field.style.overflowY=field.scrollHeight>h?'auto':'hidden';if(window.scrollY!==y)window.scrollTo(0,y);};
 const scan=root=>{if(root.matches?.('textarea'))grow(root);root.querySelectorAll?.('textarea').forEach(grow);};
 document.addEventListener('input',event=>grow(event.target));
 document.addEventListener('reset',event=>requestAnimationFrame(()=>scan(event.target)));
 document.addEventListener('toggle',event=>{if(event.target.open)requestAnimationFrame(()=>scan(event.target));},true);
 let pending=false;const refresh=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;scan(document);});};
 new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true});window.addEventListener('resize',refresh);scan(document);
 try{if(!localStorage.getItem('trymybuild-brand-intro')){localStorage.setItem('trymybuild-brand-intro','seen');if(!reduced()){const brand=document.querySelector('.site-header .brand, .cw-bar .cw-brand');brand?.classList.add('brand-intro');setTimeout(()=>brand?.classList.remove('brand-intro'),650);}}}catch{}
 document.addEventListener('click',event=>{
  const summary=event.target.closest('.catalog-filter-menu>summary');if(!summary)return;
  const details=summary.parentElement,content=details.querySelector('.catalog-filter-options');
  if(reduced()||!content)return;event.preventDefault();
  if(details.dataset.animating)return;
  if(details.open){details.dataset.animating='true';content.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-6px)'}],{duration:180,easing:'ease-in'}).finished.finally(()=>{details.open=false;delete details.dataset.animating;});}
  else{details.open=true;content.animate([{opacity:0,transform:'translateY(-6px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'ease-out'});}
 });
})();
