/* Homepage journeys. Drafts remain on this device until explicitly submitted. */
let communityWishes = [];
let wishesLoaded = false;
let wishCategory = 'All';
let wishSubmissionNotice = '';
let publicWishCategories = [];
let customWishCategory = '';
let wishSelectionReady = false;
let wishesLoading = false;
let wishesHaveMore = false;
let wishLoadVersion = 0;
function sharingPreferenceFields() {
 if(listingDraft.serverStatus==='published')return `<fieldset class="sharing-preference"><legend>Listing visibility</legend><p>${listingDraft.serverStatus==='published'?'Your listing is public.':'Your listing is awaiting public review.'} To change this, use ${listingDraft.serverStatus==='published'?'Unpublish':'Withdraw from review'} ${listingDraft.serverStatus==='published'?'in project settings below':'in the My apps dashboard’s ⋯ menu'}.</p></fieldset>`;
 const preference=listingDraft.sharingPreference || 'not_sure';
 return `<fieldset class="sharing-preference"><legend>How would you like to share your app?</legend><div>${[['private','Privately'],['public','Publicly'],['not_sure','Not sure yet']].map(([value,label])=>`<label><input type="radio" name="sharingPreference" data-sharing-preference value="${value}" ${preference===value?'checked':''}>${label}</label>`).join('')}</div><p data-sharing-note>${sharingPreferenceNote(preference)}</p></fieldset>`;
}
function sharingPreferenceNote(preference) {
 if(listingDraft.serverStatus==='published')return 'This preference does not change your existing publication status. Use Unpublish in project settings.';
 return preference==='public'?'When you’re ready, publish your listing instantly. This choice does not publish it.':preference==='private'?'Keep your listing out of the public catalog. You can share your own app link with people you choose; its access settings are controlled by your app.':'Keep a private draft and decide later.';
}
function membershipPromo() {
 return `<section class="membership-promo" id="home-community"><p class="eyebrow">Free to join. Better together.</p><h2>Build better. Discover more. Help each other.</h2><ol>${[
 ['Get real feedback','Invite friends and community members to try your app and share what could improve.'],
 ['Help a creator','Try something that interests you and share one honest observation.'],
 ['Start a conversation','Ask one specific question about your project, then reply to the people who help.'],
 ['Keep your favorites close','Save useful apps and opt in to notifications about new ones matching your interests.'],
 ['Inspire what gets built next','Share a wish—or turn someone’s need into your next project.']
 ].map(([title,copy])=>`<li><strong>${title}</strong><p>${copy}</p></li>`).join('')}</ol><div class="promo-actions">${state.session?.authenticated?'<a class="primary-button" href="/dashboard/overview">Open my dashboard</a>':'<button class="primary-button" data-route="account">Create my free account</button>'}<a href="/dashboard/overview">Your creator progress →</a></div></section>`;
}
function aboutPage() {
 return `<section class="page-shell"><article class="public-info founder-info"><p class="eyebrow">About TryMyBuild</p><h1>Useful ideas deserve a place to grow.</h1><div class="founder-story"><img class="founder-photo" src="/assets/avatars/chris-nava-founder.jpg" alt="Christian Tumalan, founder of TryMyBuild, in his recording studio" width="1084" height="971"><div><h2>Christian Tumalan · Founder</h2><p>TryMyBuild was founded by Christian Tumalan, a Grammy-winning musician with a curiosity for building useful things. After creating his own apps using rapidly evolving AI tools, Christian wanted a place to share his work, hear honest feedback, and help others do the same. TryMyBuild grew from that need: a community where people discover useful apps, creators learn from real users, and everyday problems inspire what gets built next.</p><h3 class="founder-contact-heading">Get in touch</h3><nav class="founder-social-links" aria-label="Contact Christian and follow TryMyBuild"><a href="mailto:hello@trymybuild.com" aria-label="Email Christian Tumalan"><span class="founder-social-icon founder-social-email" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 5h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm9 7.1L20.2 7H3.8L12 12.1ZM3 17h18V9.1l-8.5 5.3a1 1 0 0 1-1 0L3 9.1V17Z"/></svg></span><span>Email</span></a><a href="https://www.facebook.com/christian.tumalan" target="_blank" rel="noopener noreferrer" aria-label="Christian Tumalan on Facebook"><span class="founder-social-icon founder-social-facebook" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14.4 8.2V6.5c0-.8.5-1 1-1h2.5V2.1L14.8 2c-3.1 0-4.5 1.9-4.5 4.3v1.9H8v3.9h2.3V22h4.1v-9.9h3l.5-3.9h-3.5Z"/></svg></span><span>Personal Facebook</span></a><a href="https://www.reddit.com/user/Abject_Height_322/" target="_blank" rel="noopener noreferrer" aria-label="Christian Tumalan on Reddit"><span class="founder-social-icon founder-social-reddit" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20.4 10.1a2.3 2.3 0 0 0-3.8-1.7 11 11 0 0 0-3.6-1l.8-3.5 2.5.6a1.8 1.8 0 1 0 .3-1.3l-3.2-.8a.7.7 0 0 0-.8.5l-1 4.4a11.2 11.2 0 0 0-4.2 1.1 2.3 2.3 0 1 0-2.6 3.7v.7c0 3.1 3.2 5.6 7.2 5.6s7.2-2.5 7.2-5.6v-.7c.7-.4 1.2-1.1 1.2-2Zm-12.6 1.8a1.2 1.2 0 1 1 2.4 0 1.2 1.2 0 0 1-2.4 0Zm7.3 3.4c-.9.9-2.6 1-3.1 1s-2.2-.1-3.1-1a.5.5 0 0 1 .7-.7c.5.5 1.6.7 2.4.7s1.9-.2 2.4-.7a.5.5 0 1 1 .7.7Zm-1.3-3.4a1.2 1.2 0 1 1 2.4 0 1.2 1.2 0 0 1-2.4 0Z"/></svg></span><span>Personal Reddit</span></a><a href="https://www.facebook.com/profile.php?id=61594750508539" target="_blank" rel="noopener noreferrer" aria-label="TryMyBuild on Facebook"><span class="founder-social-icon founder-social-facebook" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14.4 8.2V6.5c0-.8.5-1 1-1h2.5V2.1L14.8 2c-3.1 0-4.5 1.9-4.5 4.3v1.9H8v3.9h2.3V22h4.1v-9.9h3l.5-3.9h-3.5Z"/></svg></span><span>TryMyBuild Facebook</span></a></nav></div></div></article></section>`;
}
function contactPage() {
 return `<section class="page-shell"><article class="public-info contact-info"><p class="eyebrow">Contact</p><h1>Have a question?</h1><p>You don’t need an account to get in touch.</p><a class="primary-button" href="mailto:hello@trymybuild.com">hello@trymybuild.com</a><p class="privacy-note">Opens your email app. Please don’t send passwords or sensitive account details.</p>${state.session?.authenticated?'<a href="/dashboard/help">View your support requests →</a>':'<p>Already a member? <a href="/dashboard/help">Sign in to track a support request.</a></p>'}</article></section>`;
}
document.addEventListener('change',event=>{
 if(!event.target.matches('[data-sharing-preference]'))return;
 listingDraft.sharingPreference=event.target.value;saveListingDraft();
 const note=event.target.closest('fieldset')?.querySelector('[data-sharing-note]');if(note)note.textContent=sharingPreferenceNote(event.target.value);
 const assurance=event.target.closest('.listing-preview-decision')?.querySelector('.listing-visibility-assurance');
 if(assurance)assurance.textContent=event.target.value==='public'?'You chose public when ready. Your app stays private until you finish the required details and publish it.':'Private is selected. Only you can see this draft in your dashboard.';
 const actions=document.querySelector('[data-listing-settings-actions]');
 if(actions){
  const publishes=event.target.value==='public';
  const save=actions.querySelector('.listing-final-save'),publish=actions.querySelector('.listing-final-publish'),note=actions.querySelector('.privacy-note');
  if(save)save.hidden=publishes;
  if(publish)publish.hidden=!publishes;
  if(note)note.textContent=publishes?'Publishing adds the app to the public catalog and opens its catalog page. You can unpublish later.':'Your app stays private until you choose to publish it.';
 }
 const form=event.target.closest('[data-listing-step]');if(form)form.querySelector('button[type="submit"]')?.removeAttribute('disabled');
});
const creatorQuotes=[
 {text:'The feedback you get from engaging directly with your earliest users will be the best you ever get.',author:'Paul Graham',source:'https://paulgraham.com/ds.html'},
 {text:'focus on the user’s problem rather than possible solutions',author:'GOV.UK Service Manual',source:'https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs'},
 {text:"You miss 100% of the shots you don't take",author:'Wayne Gretzky'}
];
let quoteIndex=0,quoteDismissed=false,quoteFormActive=false,quoteTimer=null,activeQuoteCard=null;
const pendingQuotes=[];
const shownQuoteIndexes=new Set();
function syncQuoteVisibility() {
 const active=!!document.querySelector('[data-inline-listing]');
 if(active&&!quoteFormActive){shownQuoteIndexes.clear();quoteDismissed=false;}
 if(!active){clearTimeout(quoteTimer);activeQuoteCard?.remove();activeQuoteCard=null;pendingQuotes.length=0;}
 quoteFormActive=active;
}
function quoteCardContent(){const q=creatorQuotes[quoteIndex];return `<button class="quote-dismiss" type="button" data-quote-dismiss aria-label="Dismiss inspiration">×</button><blockquote>“${q.text}”</blockquote>${q.source?`<a href="${q.source}" target="_blank" rel="noopener noreferrer">${q.author} · Source</a>`:`<span>${q.author}</span>`}`;}
function showCreatorQuote(index){
 quoteIndex=index;
 const card=document.createElement('aside');card.className='creator-quote';card.setAttribute('aria-label','Inspiration for creators');card.innerHTML=quoteCardContent();
 activeQuoteCard=card;document.body.append(card);
 quoteTimer=setTimeout(()=>{
  card.remove();activeQuoteCard=null;
  if(pendingQuotes.length&&!quoteDismissed&&quoteFormActive)showCreatorQuote(pendingQuotes.shift());
 },8000);
}
function requestCreatorQuote(index){
 if(quoteDismissed||shownQuoteIndexes.has(index))return;
 shownQuoteIndexes.add(index);
 if(index===1)shownQuoteIndexes.add(0);
 if(activeQuoteCard){pendingQuotes.push(index);return;}
 showCreatorQuote(index);
}
document.addEventListener('input',event=>{
 if(!event.target.matches('[data-inline-listing] [data-listing-field]')||!event.target.value.trim()||event.target.dataset.listingField==='stage')return;
 requestCreatorQuote(event.target.dataset.listingField==='helps'?1:0);
});
document.addEventListener('change',event=>{
 if(event.target.matches('[data-inline-listing] select[data-listing-field="stage"]')&&event.target.value)requestCreatorQuote(2);
});
document.addEventListener('click',event=>{
 const stage=event.target.closest('[data-inline-listing] [data-listing-stage]');if(stage)requestCreatorQuote(2);
 if(event.target.closest('[data-quote-dismiss]')){quoteDismissed=true;clearTimeout(quoteTimer);pendingQuotes.length=0;activeQuoteCard?.remove();activeQuoteCard=null;}
});
function inlineListingForm() {
 return `<section class="inline-listing listing-journey-step listing-journey-first"><p class="eyebrow">Create your app page</p><h1>Type your app URL</h1><p class="journey-copy">We’ll prepare a preview first. You can complete the details after your draft is safely in your dashboard.</p><form data-listing-step data-inline-listing>${listingField('url','App link','https://your-app.com')}<div class="journey-actions"><button type="submit" class="primary-button">Preview my app</button></div><p data-listing-status role="status"></p><p class="privacy-note">Nothing is published at this step.</p></form></section>`;
}

function listingJourneyVisibility(){
 const preference=['private','public'].includes(listingDraft.sharingPreference)?listingDraft.sharingPreference:'private';
 return `<fieldset class="journey-visibility"><legend class="sr-only">Choose who should see your app</legend>${[['private','Keep it private while I finish','Only you can see the saved draft.'],['public','Make it public when it’s ready','Finish the required details, then publish it yourself.']].map(([value,title,copy])=>`<label class="visibility-card"><input type="radio" name="sharingPreference" data-sharing-preference value="${value}" ${preference===value?'checked':''} required><span><strong>${title}</strong><small>${copy}</small></span></label>`).join('')}</fieldset>`;
}
function accountSignupJourney() {
 const visitor=new URLSearchParams(location.search).get('journey')==='visitor';
 const draft=!visitor&&listingDraft.title?.trim()&&listingUrl(listingDraft.url);
 return {visitor,appName:draft?listingDraft.title.trim():'',destination:visitor?'/?welcome=1':draft?'listing-dashboard':'/dashboard/overview'};
}
function welcomeAccountPage() {
 const journey=accountSignupJourney();
 const heading=journey.appName?`Create your account to save ${esc(journey.appName)}.`:'Create your free account.';
 const copy=journey.visitor?'Save apps, share feedback, and support creators. You can choose recommendations after you join.':journey.appName?'Your preview is ready. Save it as a private draft, then publish when you’re ready.':'List your app and get feedback from real people. Start privately and publish when you’re ready.';
 return `<section class="page-shell account-page"><section class="welcome-account account-signup"><p class="eyebrow">${journey.visitor?'Discover useful apps':'For creators'}</p><h1>${heading}</h1><p class="account-signup-copy">${copy}</p><form data-welcome-signup><label class="legal-agreement"><input type="checkbox" name="terms" required><span>I agree to the <a href="/terms" target="_blank" rel="noopener">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span></label><button type="submit" class="primary-button">Create my account →</button><p class="privacy-note">Choose how to sign in on the next screen. Free to join.</p><p data-signup-status role="status"></p></form><p class="account-signin">Already a member? <a href="/auth/sign-in?next=${encodeURIComponent(journey.destination)}">Sign in</a></p><p class="account-journey-switch">${journey.visitor?'<a href="/?welcome=1">Building an app? Create a creator account →</a>':'<a href="/?welcome=1&journey=visitor">Here to discover apps? Join as a visitor →</a>'}</p></section></section>`;
}
function optionalRecommendationsPage() {
 let selected=state.session?.preferences?.selected_interests;
 if(!Array.isArray(selected)){try{selected=JSON.parse(localStorage.getItem('trymybuild-signup-interests')||'[]');}catch{selected=[];}}
 if(!Array.isArray(selected))selected=[];
 const options=categories=>categories.map(c=>`<label><input type="checkbox" name="interest" value="${esc(c.name)}" ${selected.includes(c.name)?'checked':''}>${esc(c.name)}</label>`).join('');
 return `<section class="page-shell account-page"><section class="welcome-account account-recommendations"><p class="eyebrow">Your account is ready · Optional</p><h1>Want recommendations?</h1><p>Pick a few interests—or skip for now. You can change these in <a href="/dashboard/preferences">your preferences</a> anytime.</p><form data-recommendation-preferences><fieldset><legend>What interests you?</legend><div class="interest-options">${options(categoryCatalog.slice(0,8))}</div><details class="recommendation-more"><summary>More interests</summary><div class="interest-options">${options(categoryCatalog.slice(8))}</div></details></fieldset><label class="recommendation-alerts"><input type="checkbox" name="alerts"> Notify me about new apps matching these interests</label><div class="recommendation-actions"><button class="primary-button" type="submit">Save preferences</button><a href="/" class="secondary-button" data-skip-recommendations>Skip for now →</a></div><p data-recommendation-status role="status" aria-live="polite"></p></form></section></section>`;
}
function canonicalWishCategory(value) {
 if(typeof value!=='string')return '';
 const clean=value.normalize('NFKC').replace(/\s+/g,' ').trim();
 if(clean.length>48||/^(all(?: categories)?|other(?:\.{3}|…)?|__other__)$/i.test(clean)||/:\/\//.test(clean))return '';
 return normalizeCategory(clean.toLocaleLowerCase());
}
function wishCategoryNames() {
 return [...new Set([...categoryCatalog.map(c=>c.name),...publicWishCategories.map(canonicalWishCategory).filter(Boolean)])];
}
function readWishDraft() {
 try{const draft=JSON.parse(localStorage.getItem('trymybuild-wish-draft')||'{}');return draft&&typeof draft==='object'?draft:{};}catch{return {};}
}
function restoreWishSelection() {
 if(wishSelectionReady)return;
 wishSelectionReady=true;
 const draft=readWishDraft(),category=canonicalWishCategory(draft.category);
 customWishCategory=typeof draft.customCategory==='string'?draft.customCategory:'';
 if(draft.category==='__other__'){wishCategory='__other__';return;}
 if(category){wishCategory=wishCategoryNames().includes(category)?category:'__other__';if(wishCategory==='__other__')customWishCategory=category;}
}
function wishCategoryOptions() {
 const names=wishCategoryNames();
 // Keep the current selection even if a category is withdrawn while this form is open.
 if(!['All','__other__'].includes(wishCategory)&&!names.includes(wishCategory))names.push(wishCategory);
 return `<option value="All" ${wishCategory==='All'?'selected':''}>All categories</option>${names.map(name=>`<option value="${esc(name)}" ${wishCategory===name?'selected':''}>${esc(name)}</option>`).join('')}<option value="__other__" ${wishCategory==='__other__'?'selected':''}>Other…</option>`;
}
function wishResults() {
 if(wishCategory==='__other__')return '';
 if(wishesLoading)return '<p role="status">Loading wishes…</p>';
 const wishes=communityWishes.filter(w=>wishCategory==='All'||canonicalWishCategory(w.category)===wishCategory);
 return wishes.map(w=>`<article><small>${esc(w.category)}</small><p>${esc(w.description)}</p><a class="wish-report" href="mailto:hello@trymybuild.com?subject=Report%20wish%20${encodeURIComponent(w.id)}">Report this wish</a></article>`).join('')+(wishesHaveMore?'<small>Showing the latest 200 wishes. Choose a category to narrow the list.</small>':'')||`<p>${wishesLoaded?'No wishes here yet. Share the first idea.':(window.CW_SERVER?'Wish lists are temporarily unavailable. Please try again later.':'Community wishes are not connected in this preview yet.')}</p>`;
}
function wishListSection() {
 restoreWishSelection();
 const draft=readWishDraft(),description=typeof draft.description==='string'?draft.description:(state.query||''),other=wishCategory==='__other__';
 return `<section class="wish-list" id="wish-list"><h2 id="wish-dialog-title">Submit a wish</h2><p>Real needs. Ideas worth building. What do you wish an app could do?</p>
 <form data-wish-form>
 <label>Category<select name="category" data-wish-category-filter aria-describedby="wish-category-hint">${wishCategoryOptions()}</select></label>
 <small id="wish-category-hint">Browse wishes here, or choose a category for your own wish.</small>
 <label class="wish-custom-category" data-wish-custom-wrap ${other?'':'hidden'}>Name your category<input name="customCategory" type="text" minlength="2" maxlength="48" list="wish-category-suggestions" placeholder="For example, Pet care" aria-describedby="wish-custom-hint" value="${esc(customWishCategory)}" ${other?'required':'disabled'}><small id="wish-custom-hint">Existing matches are reused. New categories become available to everyone after your wish is approved.</small></label>
 <datalist id="wish-category-suggestions">${wishCategoryNames().map(name=>`<option value="${esc(name)}"></option>`).join('')}</datalist>
 <div class="wish-items" aria-live="polite">${wishResults()}</div>
 <label>What should the app do?<textarea name="description" rows="2" required placeholder="Describe what you wish existed">${esc(description)}</textarea></label><button class="primary-button">Submit my wish</button><p class="privacy-note">Wishes are reviewed before publication. Up to 10 pending or published wishes per account. <a href="mailto:hello@trymybuild.com?subject=Wish%20list%20report">Report a wish or request removal</a>.</p><p data-wish-status role="status">${esc(wishSubmissionNotice)}</p></form></section>`;
}
function saveWishDraft(form) {
 localStorage.setItem('trymybuild-wish-draft',JSON.stringify({category:form.elements.category.value,customCategory:form.elements.customCategory.value,description:form.elements.description.value}));
}
function updateWishCategoryForm(form) {
 const other=wishCategory==='__other__',input=form.elements.customCategory;
 form.querySelector('[data-wish-custom-wrap]').hidden=!other;
 input.required=other;input.disabled=!other;input.setCustomValidity('');
 form.elements.category.setCustomValidity('');
}
function openWishDialog() {
 const existing=document.querySelector('.wish-dialog');
 if(existing){existing.querySelector('textarea')?.focus();return;}
 const opener=document.activeElement,dialog=document.createElement('dialog');
 dialog.className='return-feedback-dialog wish-dialog';
 dialog.setAttribute('aria-labelledby','wish-dialog-title');
 dialog.innerHTML='<button type="button" class="return-feedback-close" aria-label="Close wish form">×</button>'+wishListSection();
 const close=()=>dialog.close();
 dialog.querySelector('.return-feedback-close').addEventListener('click',close);
 dialog.addEventListener('click',event=>{
  if(event.target!==dialog)return;
  const box=dialog.getBoundingClientRect();
  if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close();
 });
 dialog.addEventListener('close',()=>{
  dialog.remove();
  if(opener?.isConnected)opener.focus({preventScroll:true});
  else document.querySelector('[data-wish-focus]')?.focus({preventScroll:true});
 });
 document.body.append(dialog);dialog.showModal();
 dialog.querySelector('textarea')?.focus({preventScroll:true});
 void loadCommunityWishes();
}
document.addEventListener('click',event=>{if(event.target.closest('[data-wish-focus]'))openWishDialog();});
document.addEventListener('change',event=>{
 if(!event.target.matches('[data-wish-category-filter]'))return;
 const form=event.target.closest('[data-wish-form]');
 wishCategory=event.target.value;wishSubmissionNotice='';form.querySelector('[data-wish-status]').textContent='';
 updateWishCategoryForm(form);refreshWishResults();
 if(wishCategory==='__other__'){wishLoadVersion++;wishesLoading=false;form.elements.customCategory.focus();}
 else void loadCommunityWishes();
});

document.addEventListener('change',event=>{
 const wish=event.target.closest('[data-wish-form]');
 if(wish){try{saveWishDraft(wish);}catch{}}
});
document.addEventListener('input',event=>{
 const form=event.target.closest('[data-wish-form]');if(!form)return;
 const description=form.elements.description.value;
 customWishCategory=form.elements.customCategory.value;
 if(event.target===form.elements.customCategory)event.target.setCustomValidity('');
 if(event.target===form.elements.description)form.elements.description.setCustomValidity(description.trim()?'':'Describe your wish.');
 try{saveWishDraft(form);}catch{}
});
document.addEventListener('submit',async event=>{
 const signup=event.target.closest('[data-welcome-signup]');
 if(signup){
  event.preventDefault();
  if(!signup.reportValidity())return;
  if(!window.CW_SERVER){signup.querySelector('[data-signup-status]').textContent='Account creation is available on the connected site.';return;}
  const journey=accountSignupJourney();
  if(journey.appName&&!saveListingDraft()){signup.querySelector('[data-signup-status]').textContent='Your preview could not be saved for sign-in. Enable site storage and try again.';return;}
  signup.querySelector('button[type="submit"]').disabled=true;
  location.assign('/auth/sign-in?signup=1&next='+encodeURIComponent(journey.destination));return;
 }
 const recommendations=event.target.closest('[data-recommendation-preferences]');
 if(recommendations){
  event.preventDefault();
  const status=recommendations.querySelector('[data-recommendation-status]'),button=recommendations.querySelector('button[type="submit"]');
  if(!state.session?.authenticated){status.textContent='Sign in before saving preferences.';return;}
  button.disabled=true;status.textContent='Saving…';
  try{
   const interests=new FormData(recommendations).getAll('interest'),alerts=recommendations.elements.alerts.checked;
   const response=await fetch('/api/onboarding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({interests,alerts})});
   if(!response.ok)throw Error('Your preferences could not be saved. Try again, or skip for now.');
   try{localStorage.removeItem('trymybuild-signup-pending');}catch{}
   location.assign('/');
  }catch(error){status.textContent=error.message||'Your preferences could not be saved. You can skip for now.';}
  finally{button.disabled=false;}
  return;
 }
 const form=event.target.closest('[data-wish-form]');if(!form)return;event.preventDefault();
 const selection=form.elements.category.value,category=canonicalWishCategory(selection==='__other__'?form.elements.customCategory.value:selection),description=form.elements.description.value.trim(),status=form.querySelector('[data-wish-status]');
 if(!category){status.textContent=selection==='All'?'Choose a category for your wish, or select Other… to add one.':'Enter a clear category name using 2–48 characters.';const field=selection==='__other__'?form.elements.customCategory:form.elements.category;field.setCustomValidity(status.textContent);field.reportValidity();return;}
 if(!description){status.textContent='Describe your wish.';return;}
 try{saveWishDraft(form);}catch{status.textContent='Your draft could not be saved. Enable browser storage before continuing.';return;}
 if(!window.CW_SERVER){status.textContent='Your wish is saved as a local draft. Public submission is available on the connected site.';return;}
 if(!state.session?.authenticated){location.href='/auth/sign-in?signup=1&next='+encodeURIComponent('/?wish=1#wish-list');return;}
 const button=form.querySelector('button');button.disabled=true;
 try{const response=await fetch('/api/wishes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category,description})});const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to submit wish.');localStorage.removeItem('trymybuild-wish-draft');form.elements.description.value='';form.elements.description.setCustomValidity('');wishSubmissionNotice=data.outcome==='duplicate'?(data.status==='published'?'You already shared this wish. It is published.':data.status==='hidden'?'This wish is hidden after review. Contact us if you would like to appeal.':'This wish is already awaiting review.'):`Your wish in ${category} was submitted for review. Thank you for sharing a real need.`;status.textContent=wishSubmissionNotice;await loadCommunityWishes();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}
});
// Update only the results, leaving the composer, focus, and catalog filters intact.
function refreshWishResults(){
 const section=document.getElementById('wish-list');if(!section)return;
 section.querySelector('.wish-items').innerHTML=wishResults();
}
async function loadCommunityWishes(){
 if(!window.CW_SERVER)return;
 restoreWishSelection();
 const version=++wishLoadVersion;
 wishesLoading=true;wishesLoaded=false;communityWishes=[];wishesHaveMore=false;refreshWishResults();
 try{
  const selected=['All','__other__'].includes(wishCategory)?'':wishCategory;
  const r=await fetch('/api/wishes'+(selected?'?category='+encodeURIComponent(selected):''));if(!r.ok)throw Error();
  const data=await r.json();if(version!==wishLoadVersion)return;
  communityWishes=Array.isArray(data.wishes)?data.wishes:[];publicWishCategories=Array.isArray(data.categories)?data.categories:[];wishesHaveMore=Boolean(data.hasMore);wishesLoaded=true;
  const form=document.querySelector('[data-wish-form]');
  if(form){form.elements.category.innerHTML=wishCategoryOptions();form.querySelector('datalist').innerHTML=wishCategoryNames().map(name=>`<option value="${esc(name)}"></option>`).join('');}
 }catch{}finally{if(version===wishLoadVersion){wishesLoading=false;refreshWishResults();}}
}
document.addEventListener('DOMContentLoaded',async()=>{
 await loadCommunityWishes();
 const page=new URLSearchParams(location.search).get('page');if(['about','contact'].includes(page)){state.route=page;render();}
 if(new URLSearchParams(location.search).has('welcome')){state.route='account';render();}
 if(new URLSearchParams(location.search).has('wish')){state.route='discover';homeView='find';render();openWishDialog();}
});
