// Shared server pages expose the same public destinations beside the account photo.
document.querySelectorAll('.cw-bar nav').forEach(nav => {
 const account = nav.querySelector('[data-account-nav]');
 if (!account || nav.querySelector('.header-menu-links')) return;
 const links = document.createElement('div'); links.className = 'header-menu-links';
 for (const anchor of [...nav.querySelectorAll('a:not([data-account-nav])')]) {
  anchor.classList.add((anchor.hasAttribute('data-guest-listing') || anchor.classList.contains('header-menu-action')) ? 'header-menu-action' : 'header-menu-link');
  links.append(anchor);
 }
 for (const [text,href] of [['Articles','/article'],['About','/?page=about'],['Contact','/?page=contact']]) {
  const a=document.createElement('a');a.textContent=text;a.href=href;a.className='header-menu-link';
  const action=links.querySelector('.header-menu-action'); links.insertBefore(a,action);
 }
 nav.insertBefore(links,account);
});
// Collapse website destinations without moving the account photo to another row.
document.querySelectorAll('.site-header nav, .cw-bar nav').forEach(nav => {
 const links = nav.querySelector('.header-menu-links');
 if (!links) return;
 links.id ||= 'website-menu-links';
 let toggle = nav.querySelector('.header-nav-toggle');
 if (!toggle) {
  toggle = document.createElement('button');
  toggle.type = 'button'; toggle.className = 'header-nav-toggle';
  toggle.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  nav.insertBefore(toggle, links);
 }
 toggle.setAttribute('aria-controls', links.id);
 const setOpen = open => {
  links.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close website menu' : 'Open website menu');
 };
 setOpen(false);
 toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  if (open) nav.querySelectorAll('.account-menu[open]').forEach(account => account.open = false);
  setOpen(open);
 });
 links.addEventListener('click', event => { if (event.target.closest('a')) setOpen(false); });
 document.addEventListener('click', event => {
  if (!links.contains(event.target) && !toggle.contains(event.target)) setOpen(false);
 });
 document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
   setOpen(false); toggle.focus();
  }
 });
 window.matchMedia('(max-width: 820px)').addEventListener('change', () => setOpen(false));
});
window.CWAccountMenu = {
 mount(session) {
  document.querySelectorAll('[data-account-nav], .profile-button').forEach(anchor => {
   if (!session.authenticated) {
    const root=document.createElement('details');root.className='account-menu';
    root.innerHTML='<summary class="account-avatar" aria-label="Open account menu">T</summary><div class="account-menu-panel"><a href="/?welcome=1" data-route="account">Create my account</a><a href="/auth/sign-in">Sign in</a></div>';
    anchor.replaceWith(root);return;
   }
   let root=anchor.closest('.account-menu');
   if(!root){root=document.createElement('details');root.className='account-menu';anchor.replaceWith(root);}
   root.replaceChildren();
   const summary=document.createElement('summary');summary.className='account-avatar';summary.setAttribute('aria-label','Open my account menu');
   if(session.user.avatar){const img=document.createElement('img');img.src=session.user.avatar;img.alt='';summary.append(img);}else summary.textContent=(session.user.displayName||'M').slice(0,1).toUpperCase();
   const panel=document.createElement('div');panel.className='account-menu-panel';
   const name=document.createElement('strong');name.textContent=session.user.displayName;panel.append(name);
   const links=[['View profile','/people/me'],['My dashboard','/dashboard/overview']];
   for(const [text,href] of links){const a=document.createElement('a');a.href=href;a.textContent=text;panel.append(a);}
   const form=document.createElement('form');form.method='post';form.action='/auth/sign-out';const button=document.createElement('button');button.textContent='Log out';form.append(button);panel.append(form);
   root.append(summary,panel);
  });
  document.querySelectorAll('[data-guest-listing]').forEach(el=>el.hidden=!!session.authenticated);
 }
};
document.addEventListener('click',event=>document.querySelectorAll('.account-menu[open]').forEach(el=>{if(!el.contains(event.target))el.open=false;}));
document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.account-menu[open]').forEach(el=>{el.open=false;el.querySelector('summary').focus();});});
(async () => {
  if(!window.CW_SERVER && document.querySelector('#app')){window.CWAccountMenu.mount({authenticated:false});return;}
  try {
    const r = await fetch('/api/me'); if (!r.ok) return; const session = await r.json();
    window.CWAccountMenu.mount(session);
    document.dispatchEvent(new CustomEvent('cw:account-ready',{detail:session}));
    if (session.authenticated && session.databaseReady && ['/dashboard','/dashboard/overview'].includes(location.pathname)) {
      let draft; try { draft = JSON.parse(localStorage.getItem('creatorworks-listing-draft-v1') || '{}'); } catch {}
      if (draft?.title?.trim() && draft?.url?.trim() && !draft.serverId && (!draft.accountOwner || draft.accountOwner === session.user.id)) {
        const notice = document.createElement('p'); notice.className = 'cw-notice'; notice.setAttribute('role','status'); notice.textContent = 'Saving your project draft to your account…'; document.querySelector('main')?.prepend(notice);
        try {
          draft.clientToken ||= crypto.randomUUID(); localStorage.setItem('creatorworks-listing-draft-v1', JSON.stringify(draft));
          const saved = await fetch('/api/projects', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save',clientToken:draft.clientToken,title:draft.title,url:draft.url,does:draft.does,helps:draft.helps,firstTry:draft.firstTry,category:draft.category,stage:draft.stage,pricing:draft.pricing||'free',video:draft.video,sharingPreference:draft.sharingPreference||'not_sure'})});
          const result = await saved.json(); if(!saved.ok || !result.project) throw new Error();
          Object.assign(draft,{serverId:result.project.id,serverSlug:result.project.slug,serverStatus:result.project.status,accountOwner:session.user.id,imported:'yes'});
          localStorage.setItem('creatorworks-listing-draft-v1',JSON.stringify(draft));
          location.replace('/dashboard/overview');
        } catch { notice.innerHTML = 'Your draft is still saved on this device. <a href="/?listing=settings">Continue saving your project</a>.'; }
      }
    }
    document.querySelectorAll('[data-guest-listing]').forEach(el => { el.hidden = !!session.authenticated; });
  } catch {}
})();
