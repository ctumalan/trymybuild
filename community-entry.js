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
 if(['published','in_review'].includes(listingDraft.serverStatus))return `<fieldset class="sharing-preference"><legend>Listing visibility</legend><p>${listingDraft.serverStatus==='published'?'Your listing is public.':'Your listing is awaiting public review.'} To change this, use ${listingDraft.serverStatus==='published'?'Unpublish':'Withdraw from review'} in project settings below.</p></fieldset>`;
 const preference=listingDraft.sharingPreference || 'not_sure';
 return `<fieldset class="sharing-preference"><legend>How would you like to share your app?</legend><div>${[['private','Privately'],['public','Publicly'],['not_sure','Not sure yet']].map(([value,label])=>`<label><input type="radio" name="sharingPreference" data-sharing-preference value="${value}" ${preference===value?'checked':''}>${label}</label>`).join('')}</div><p data-sharing-note>${sharingPreferenceNote(preference)}</p></fieldset>`;
}
function sharingPreferenceNote(preference) {
 if(['published','in_review'].includes(listingDraft.serverStatus))return 'This preference does not change your existing publication status. Use Unpublish or Withdraw from review in project settings to take the listing out of public review or discovery.';
 return preference==='public'?'When you’re ready, submit your listing for public review. This choice does not publish it.':preference==='private'?'Keep your listing out of the public catalog. You can share your own app link with people you choose; its access settings are controlled by your app.':'Keep a private draft and decide later.';
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
 return `<section class="page-shell">${homeViewTabs(homeView)}<article class="public-info founder-info"><p class="eyebrow">About TryMyBuild</p><h1>Useful ideas deserve a place to grow.</h1><div class="founder-story"><img class="founder-photo" src="/assets/avatars/chris-nava-founder.jpg" alt="Christian Tumalan, founder of TryMyBuild, in his recording studio" width="1084" height="971"><div><h2>Christian Tumalan · Founder</h2><p>TryMyBuild was founded by Christian Tumalan, a Grammy-winning musician with a curiosity for building useful things. After creating his own apps using rapidly evolving AI tools, Christian wanted a place to share his work, hear honest feedback, and help others do the same. TryMyBuild grew from that need: a community where people discover useful apps, creators learn from real users, and everyday problems inspire what gets built next.</p><button class="text-button" data-route="contact">Get in touch →</button></div></div></article></section>`;
}
function contactPage() {
 return `<section class="page-shell">${homeViewTabs(homeView)}<article class="public-info"><p class="eyebrow">Contact</p><h1>Have a question?</h1><p>You don’t need an account to get in touch.</p><a class="primary-button" href="mailto:hello@trymybuild.com">hello@trymybuild.com</a><p class="privacy-note">Opens your email app. Please don’t send passwords or sensitive account details.</p>${state.session?.authenticated?'<a href="/dashboard/help">View your support requests →</a>':'<p>Already a member? <a href="/dashboard/help">Sign in to track a support request.</a></p>'}</article></section>`;
}
document.addEventListener('change',event=>{
 if(!event.target.matches('[data-sharing-preference]'))return;
 listingDraft.sharingPreference=event.target.value;saveListingDraft();
 const note=event.target.closest('fieldset')?.querySelector('[data-sharing-note]');if(note)note.textContent=sharingPreferenceNote(event.target.value);
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
 const steps=[
  {title:'Start with your app link.',copy:'We’ll use it to prepare your listing.',fields:listingField('url','App link','https://your-app.com'),next:'Continue'},
  {title:'Is this the right app?',copy:'Confirm the name and image people will see.',fields:`${listingIdentityConfirmation()}${listingField('title','App name','Your app name')}`,next:'Yes, continue'},
  {title:'What does your app do?',copy:'Describe the result in 4–10 words.',fields:listingField('does','One clear sentence','For example: Turns ingredients into meal ideas.',true),next:'Continue'},
  {title:'How does it help?',copy:'Name the practical benefit in 4–10 words.',fields:listingField('helps','The benefit','For example: Makes dinner decisions easier and reduces waste.',true),next:'Continue'},
  {title:'What should someone try first?',copy:'Give visitors one clear starting point in 4–10 words.',fields:listingField('firstTry','First action','For example: Enter three ingredients from your fridge.',true),next:'Continue'},
  {title:'How ready is it?',copy:'Choose the closest stage. You can change it later.',fields:`<div class="choice-grid listing-stage-choices" role="group" aria-label="Project stage">${['Still taking shape','Ready for a first try','Being tested by early users','Finished and launched'].map(stage=>`<button type="button" class="choice-button ${stage===listingDraft.stage?'is-selected':''}" aria-pressed="${stage===listingDraft.stage}" data-listing-stage="${stage}"><span aria-hidden="true">${stage===listingDraft.stage?'✓':''}</span>${stage}</button>`).join('')}</div>`,next:'Continue'},
  {title:'Who should see it?',copy:'Choose how you want to begin.',fields:listingJourneyVisibility(),next:'Preview my listing'}
 ];
 const step=steps[listingStep]||steps[0],first=listingStep===0,visibility=listingStep===steps.length-1;
 return `<section class="inline-listing listing-journey-step ${first?'listing-journey-first':''}"><div class="journey-progress" role="progressbar" aria-label="Create your listing" aria-valuemin="1" aria-valuemax="${steps.length}" aria-valuenow="${listingStep+1}"><span style="width:${(listingStep+1)/steps.length*100}%"></span></div><p class="eyebrow">Create your listing · ${listingStep+1} of ${steps.length}</p><h1>${step.title}</h1><p class="journey-copy">${step.copy}</p><form data-listing-step data-inline-listing>${step.fields}<div class="journey-actions"><button type="submit" class="primary-button" ${visibility&&listingDraft.sharingPreference==='not_sure'?'disabled':''}>${step.next}</button>${first?'':'<button class="secondary-button" type="button" data-listing-back>Back</button>'}</div>${visibility?'<button class="share-browse-link listing-decide-later" type="button" data-listing-decide-later>Decide later</button>':''}<p data-listing-status role="status"></p><p class="privacy-note">${visibility?'Nothing is shared or published yet.':'Your draft stays on this device.'}</p></form></section>`;
}

function listingJourneyVisibility(){
 const preference=listingDraft.sharingPreference||'not_sure';
 return `<fieldset class="journey-visibility"><legend class="sr-only">Choose who should see your app</legend>${[['private','Invite only','Share with people you choose.'],['public','Public','Apply to appear in TryMyBuild discovery.']].map(([value,title,copy])=>`<label class="visibility-card"><input type="radio" name="sharingPreference" data-sharing-preference value="${value}" ${preference===value?'checked':''} required><span><strong>${title}</strong><small>${copy}</small></span></label>`).join('')}</fieldset>`;
}
function welcomeAccountPage() {
 let selected=[],alerts=false;try{selected=JSON.parse(localStorage.getItem('trymybuild-signup-interests')||'[]');alerts=localStorage.getItem('trymybuild-signup-alerts')==='true';}catch{}
 return `<section class="page-shell">${homeViewTabs(homeView)}<section class="welcome-account"><h1>Welcome to TryMyBuild.</h1><p>Create your account to save useful projects and receive notifications when new apps match your interests.</p><form data-welcome-signup><fieldset><legend>What interests you? <small>Click as many as you want</small></legend><div class="interest-options">${categoryCatalog.map(c=>`<label><input type="checkbox" name="interest" value="${esc(c.name)}" ${selected.includes(c.name)?'checked':''}>${esc(c.name)}</label>`).join('')}</div></fieldset><label><input type="checkbox" name="alerts" ${alerts?'checked':''}> Notify me about new apps matching these interests</label><label class="legal-agreement"><input type="checkbox" required><span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</span></label><button class="primary-button">Create my account</button><a href="/auth/sign-in">Already a member? Sign in</a><p data-signup-status role="status"></p></form><p>Are you a creator? <button class="text-button" data-home-view="test">List your project—it’s free!</button></p></section></section>`;
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
 return `<section class="wish-list" id="wish-list"><h2>Community wish list</h2><p>Real needs. Ideas worth building. What do you wish an app could do?</p>
 <form data-wish-form>
 <label>Category<select name="category" data-wish-category-filter aria-describedby="wish-category-hint">${wishCategoryOptions()}</select></label>
 <small id="wish-category-hint">Browse wishes here, or choose a category for your own wish.</small>
 <label class="wish-custom-category" data-wish-custom-wrap ${other?'':'hidden'}>Name your category<input name="customCategory" type="text" minlength="2" maxlength="48" list="wish-category-suggestions" placeholder="For example, Pet care" aria-describedby="wish-custom-hint" value="${esc(customWishCategory)}" ${other?'required':'disabled'}><small id="wish-custom-hint">Existing matches are reused. New categories become available to everyone after your wish is approved.</small></label>
 <datalist id="wish-category-suggestions">${wishCategoryNames().map(name=>`<option value="${esc(name)}"></option>`).join('')}</datalist>
 <div class="wish-items" aria-live="polite">${wishResults()}</div>
 <label>What should the app do?<textarea name="description" rows="2" maxlength="180" required placeholder="Describe your wish in 4–11 words">${esc(description)}</textarea></label><small data-wish-count>${commentWordCount(description)} / 4–11 words</small><button class="primary-button">Submit my wish</button><p class="privacy-note">Wishes are reviewed before publication. Up to 10 pending or published wishes per account. <a href="mailto:hello@trymybuild.com?subject=Wish%20list%20report">Report a wish or request removal</a>.</p><p data-wish-status role="status">${esc(wishSubmissionNotice)}</p></form></section>`;
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
document.addEventListener('click',event=>{if(event.target.closest('[data-wish-focus]')){document.querySelector('[data-wish-form] textarea')?.focus();}});
document.addEventListener('change',event=>{
 if(!event.target.matches('[data-wish-category-filter]'))return;
 const form=event.target.closest('[data-wish-form]');
 wishCategory=event.target.value;wishSubmissionNotice='';form.querySelector('[data-wish-status]').textContent='';
 updateWishCategoryForm(form);refreshWishResults();
 if(wishCategory==='__other__'){wishLoadVersion++;wishesLoading=false;form.elements.customCategory.focus();}
 else void loadCommunityWishes();
});

document.addEventListener('change',event=>{
 const form=event.target.closest('[data-welcome-signup]');
 if(form){try{localStorage.setItem('trymybuild-signup-interests',JSON.stringify(new FormData(form).getAll('interest')));localStorage.setItem('trymybuild-signup-alerts',String(form.elements.alerts.checked));}catch{}}
 const wish=event.target.closest('[data-wish-form]');
 if(wish){try{saveWishDraft(wish);}catch{}}
});
document.addEventListener('cw:account-ready',async event=>{
 if(!event.detail?.authenticated)return;
 try{
  if(localStorage.getItem('trymybuild-signup-pending')!=='1')return;
  const r=await fetch('/api/onboarding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({interests:JSON.parse(localStorage.getItem('trymybuild-signup-interests')||'[]'),alerts:localStorage.getItem('trymybuild-signup-alerts')==='true'})});
  if(!r.ok)throw Error();
  localStorage.removeItem('trymybuild-signup-pending');
 }catch{const note=document.createElement('p');note.setAttribute('role','status');note.textContent='Your account is ready, but your interests could not be saved. You can update them in account preferences.';document.querySelector('main')?.prepend(note);}
});
document.addEventListener('input',event=>{
 const form=event.target.closest('[data-wish-form]');if(!form)return;
 const description=form.elements.description.value,count=commentWordCount(description);
 customWishCategory=form.elements.customCategory.value;
 if(event.target===form.elements.customCategory)event.target.setCustomValidity('');
 form.querySelector('[data-wish-count]').textContent=`${count} / 4–11 words`;
 if(event.target===form.elements.description)form.elements.description.setCustomValidity(count>=4&&count<=11?'':'Use 4–11 words.');
 try{saveWishDraft(form);}catch{}
});
document.addEventListener('submit',async event=>{
 const signup=event.target.closest('[data-welcome-signup]');
 if(signup){event.preventDefault();try{localStorage.setItem('trymybuild-signup-interests',JSON.stringify(new FormData(signup).getAll('interest')));localStorage.setItem('trymybuild-signup-alerts',String(signup.elements.alerts.checked));localStorage.setItem('trymybuild-signup-pending','1');}catch{}if(!window.CW_SERVER){signup.querySelector('[data-signup-status]').textContent='Account creation is available on the connected site. Your choices are saved locally.';return;}location.href='/auth/sign-in?signup=1&next='+encodeURIComponent('/?welcome=1');return;}
 const form=event.target.closest('[data-wish-form]');if(!form)return;event.preventDefault();
 const selection=form.elements.category.value,category=canonicalWishCategory(selection==='__other__'?form.elements.customCategory.value:selection),description=form.elements.description.value.trim(),status=form.querySelector('[data-wish-status]'),count=commentWordCount(description);
 if(!category){status.textContent=selection==='All'?'Choose a category for your wish, or select Other… to add one.':'Enter a clear category name using 2–48 characters.';const field=selection==='__other__'?form.elements.customCategory:form.elements.category;field.setCustomValidity(status.textContent);field.reportValidity();return;}
 if(count<4||count>11){status.textContent='Describe your wish in 4–11 words.';return;}
 try{saveWishDraft(form);}catch{status.textContent='Your draft could not be saved. Enable browser storage before continuing.';return;}
 if(!window.CW_SERVER){status.textContent='Your wish is saved as a local draft. Public submission is available on the connected site.';return;}
 if(!state.session?.authenticated){location.href='/auth/sign-in?signup=1&next='+encodeURIComponent('/?wish=1#wish-list');return;}
 const button=form.querySelector('button');button.disabled=true;
 try{const response=await fetch('/api/wishes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category,description})});const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to submit wish.');localStorage.removeItem('trymybuild-wish-draft');form.elements.description.value='';form.elements.description.setCustomValidity('');wishSubmissionNotice=data.outcome==='duplicate'?(data.status==='published'?'You already shared this wish. It is published.':data.status==='hidden'?'This wish is hidden after review. Contact us if you would like to appeal.':'This wish is already awaiting review.'):`Your wish in ${category} was submitted for review. Thank you for sharing a real need.`;status.textContent=wishSubmissionNotice;form.querySelector('[data-wish-count]').textContent='0 / 4–11 words';await loadCommunityWishes();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}
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
 if(new URLSearchParams(location.search).has('wish')){state.route='discover';homeView='find';render();document.getElementById('wish-list')?.scrollIntoView();}
});
