import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {normalizeDraft} from '../src/server/listing-policy.mjs';
import {submit} from '../src/server/listing-service.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const entry=read('community-entry.js'),app=read('app.js');
test('listing validation highlights only invalid answers and clears corrected fields',()=>{
 const ctx=vm.createContext({CWListingRules:{valid:value=>{const count=value.trim().split(/\s+/).length;return count>=4&&count<=10;}},listingUrl:value=>/^https?:\/\//.test(value)});
 const start=app.indexOf('function markListingFieldsForAttention(form)');
 vm.runInContext(app.slice(start,app.indexOf("document.addEventListener('invalid'",start)),ctx);
 const field=(key,value)=>({dataset:{listingField:key},value,validity:{valid:true},setAttribute(name,value){this[name]=value;}});
 const fields=[field('does','Too short'),field('helps','This has four words'),field('firstTry','one two three four five six seven eight nine ten eleven')];
 const form={dataset:{},querySelectorAll:()=>fields};
 assert.equal(ctx.markListingFieldsForAttention(form),fields[0]);
 assert.deepEqual(fields.map(f=>f['aria-invalid']),['true','false','true']);
 fields[0].value='Now this has four';fields[2].value='Try these four words';
 assert.equal(ctx.markListingFieldsForAttention(form),null);
 assert.deepEqual(fields.map(f=>f['aria-invalid']),['false','false','false']);
});
test('app confirmation suggests a short editable name from the submitted link',()=>{
 const ctx=vm.createContext({URL});
 vm.runInContext(app.slice(app.indexOf('function listingUrl('),app.indexOf('let listingCapture =')),ctx);
 assert.equal(ctx.listingNameFromUrl('https://www.my-useful-app.com/welcome'),'My Useful App');
 assert.equal(ctx.listingNameFromUrl('javascript:alert(1)'),'');
});
function scope(){const ctx=vm.createContext({document:{addEventListener(){}},state:{session:null},listingDraft:{},esc:String,homeView:'find',homeViewTabs:()=>'<nav>Tabs</nav>'});vm.runInContext(entry,ctx);vm.runInContext(app.slice(app.indexOf('function homeHowItWorks()'),app.indexOf('function catalogSearchWords(')),ctx);return ctx;}
test('sharing choices use a private default and preserve explicit intent',()=>{
 const ctx=scope();assert.match(ctx.sharingPreferenceFields(),/value="not_sure" checked/);
 assert.equal((ctx.sharingPreferenceFields().match(/type="radio"/g)||[]).length,3);
 for(const sharingPreference of ['private','public','not_sure'])assert.equal(normalizeDraft({sharingPreference}).value.sharing_preference,sharingPreference);
 assert.ok(normalizeDraft({sharingPreference:'publish-now'}).error);
 ctx.listingDraft.serverStatus='published';assert.match(ctx.sharingPreferenceNote('private'),/does not change/);
});
test('private and undecided drafts cannot be submitted for public review',async()=>{
 for(const sharing_preference of ['private','not_sure']){
  let wrote=false;const store={findOwnedById:async()=>({listing_status:'draft',sharing_preference}),updateOwnedGuarded:async()=>{wrote=true;}};
  const result=await submit(store,{ownerId:'owner',id:'draft'});
  assert.equal(result.status,400);assert.equal(wrote,false);assert.match(result.error,/Choose Publicly/);
 }
});
test('promo has exactly five benefits and a member-aware call to action',()=>{
 const ctx=scope();assert.equal((ctx.membershipPromo().match(/<li>/g)||[]).length,5);
 assert.match(ctx.membershipPromo(),/Free to join\. Better together\./);
 assert.doesNotMatch(ctx.membershipPromo(),/Make more of your membership/);
 assert.match(ctx.membershipPromo(),/one honest observation/);assert.match(ctx.membershipPromo(),/Create my free account/);assert.doesNotMatch(ctx.membershipPromo(),/Earn community credits|Unlock additional project slots/);
 ctx.state.session={authenticated:true};assert.match(ctx.membershipPromo(),/Open my dashboard/);assert.doesNotMatch(ctx.membershipPromo(),/Create my free account/);
});
test('guest information is available without account creation',()=>{
 const ctx=scope();assert.match(ctx.aboutPage(),/Christian Tumalan/);assert.match(ctx.contactPage(),/mailto:hello@trymybuild.com/);
 assert.match(ctx.aboutPage(),/src="\/assets\/avatars\/chris-nava-founder.jpg"/);
 assert.match(ctx.aboutPage(),/alt="Christian Tumalan, founder of TryMyBuild, in his recording studio"/);
 assert.doesNotMatch(ctx.aboutPage(),/class="home-how"|Small contributions\. Better projects\./);
 assert.doesNotMatch(app.slice(app.indexOf('function discover('),app.indexOf('function discussionDraftKey(')),/homeHowItWorks\(/);
 assert.match(read('index.html'),/data-route="contact">Contact/);
 const menu=read('account-nav.js').split('let root=anchor.closest')[0];assert.match(menu,/data-route="contact"/);
});
test('signup interests stay visible and retain multiple saved choices',()=>{
 const ctx=scope();ctx.categoryCatalog=[{name:'Music & audio'},{name:'Technology'},{name:'Family life'}];
 ctx.localStorage={getItem:key=>key==='trymybuild-signup-interests'?'["Music & audio","Technology"]':'false'};
 const html=ctx.welcomeAccountPage();
 assert.match(html,/<div class="interest-options">/);
 assert.doesNotMatch(html,/interest-select|data-interest-summary/);
 assert.equal((html.match(/name="interest"/g)||[]).length,3);
 assert.equal((html.match(/ checked/g)||[]).length,2);
 assert.doesNotMatch(html,/<details[^>]*\bopen\b/);
});
test('category picker includes the full menu and custom category input',()=>{
 const ctx=vm.createContext({categoryCatalog:[{name:'Technology'},{name:'Science & research'}],listingDraft:{category:'Science & research'},listingCategoryOtherOpen:false,normalizeCategory:s=>s,esc:String});
 vm.runInContext(app.slice(app.indexOf('function listingCategoryPicker()'),app.indexOf('function listingPreview()')),ctx);
 assert.match(ctx.listingCategoryPicker(),/value="Science & research" selected/);
 ctx.listingCategoryOtherOpen=true;assert.match(ctx.listingCategoryPicker(),/Suggest a category/);assert.match(ctx.listingCategoryPicker(),/data-listing-category-custom/);
});
test('inspiration keeps the feedback quote and remains dismissible',()=>{
 const ctx=scope();assert.equal(vm.runInContext('creatorQuotes.length',ctx),3);
 assert.match(ctx.quoteCardContent(),/Paul Graham/);assert.match(ctx.quoteCardContent(),/data-quote-dismiss/);
 assert.doesNotMatch(entry,/And the only way to do great work is to love what you do/);
 assert.match(entry,/shownQuoteIndexes.has\(index\)/);
 assert.match(entry,/document.body.append\(card\)/);
 assert.doesNotMatch(entry,/closest\('label'\).after\(card\)/);
 assert.match(read('launch-refinements.css'),/position:fixed;top:88px;right:24px/);
 assert.doesNotMatch(ctx.quoteCardContent(),/Next quote|A little encouragement/);
});
test('quote automatically disappears after eight seconds without repeating on input',()=>{
 const listeners=[],timers=[];let removed=false,appended=0;
 const card={setAttribute(){},remove(){removed=true;}};
 const ctx=vm.createContext({document:{addEventListener(type,fn){listeners.push({type,fn});},createElement(){return card;},body:{append(){appended++;}}},setTimeout(fn,delay){timers.push({fn,delay});}});
 vm.runInContext(entry,ctx);
 const input=listeners.find(l=>l.type==='input').fn;
 const event={target:{matches:()=>true,value:'My app',dataset:{listingField:'title'}}};
 input(event);assert.equal(appended,1);assert.equal(removed,false);
 assert.equal(timers[0].delay,8000);timers[0].fn();assert.equal(removed,true);
 input(event);assert.equal(appended,1);
});
test('old session dismissal cannot block a fresh visit and returning resets the quote',()=>{
 const listeners=[];let active=true,shown=0;
 const ctx=vm.createContext({sessionStorage:{getItem(){return '1';}},document:{addEventListener(type,fn){listeners.push({type,fn});},querySelector(selector){return selector==='[data-inline-listing]'&&active?{}:null;},createElement(){return {setAttribute(){},remove(){}};},body:{append(){shown++;}}},setTimeout(){},clearTimeout(){}});
 vm.runInContext(entry,ctx);
 const input=listeners.find(l=>l.type==='input').fn,event={target:{matches:()=>true,value:'My app',dataset:{listingField:'title'}}};
 ctx.syncQuoteVisibility();input(event);assert.equal(shown,1);
 input(event);assert.equal(shown,1);
 active=false;ctx.syncQuoteVisibility();active=true;ctx.syncQuoteVisibility();input(event);assert.equal(shown,2);
});
test('help-field quote waits for the first quote and shows only once per visit',()=>{
 const listeners=[],timers=[],cards=[];
 const ctx=vm.createContext({document:{addEventListener(type,fn){listeners.push({type,fn});},querySelector(){return {};},createElement(){return {setAttribute(){},remove(){this.removed=true;}};},body:{append(card){cards.push(card);}}},setTimeout(fn,delay){timers.push({fn,delay});},clearTimeout(){}});
 vm.runInContext(entry,ctx);ctx.syncQuoteVisibility();
 const input=listeners.find(l=>l.type==='input').fn;
 const type=field=>input({target:{matches:()=>true,value:'Some useful words',dataset:{listingField:field}}});
 type('title');type('helps');type('helps');
 assert.equal(cards.length,1);assert.match(cards[0].innerHTML,/Paul Graham/);
 assert.equal(timers[0].delay,8000);timers[0].fn();
 assert.equal(cards[0].removed,true);assert.equal(cards.length,2);
 assert.match(cards[1].innerHTML,/GOV.UK Service Manual/);
 assert.equal(timers[1].delay,8000);timers[1].fn();
 assert.equal(cards[1].removed,true);type('helps');type('title');assert.equal(cards.length,2);
});
test('stage selection queues Gretzky after both earlier quotes without repeats',()=>{
 const listeners=[],timers=[],cards=[];
 const ctx=vm.createContext({document:{addEventListener(type,fn){listeners.push({type,fn});},querySelector(){return {};},createElement(){return {setAttribute(){},remove(){this.removed=true;}};},body:{append(card){cards.push(card);}}},setTimeout(fn,delay){timers.push({fn,delay});},clearTimeout(){}});
 vm.runInContext(entry,ctx);ctx.syncQuoteVisibility();
 const dispatch=(type,field)=>listeners.filter(l=>l.type===type).forEach(l=>l.fn({target:{closest:()=>null,matches:selector=>selector.includes('[data-listing-field'),value:'Ready for a first try',dataset:{listingField:field}}}));
 dispatch('input','title');dispatch('input','helps');dispatch('input','stage');dispatch('change','stage');dispatch('change','stage');
 assert.equal(cards.length,1);timers[0].fn();assert.equal(cards.length,2);
 assert.match(cards[1].innerHTML,/GOV.UK/);timers[1].fn();assert.equal(cards.length,3);
 assert.match(cards[2].innerHTML,/You miss 100% of the shots you don't take/);
 assert.match(cards[2].innerHTML,/Wayne Gretzky/);assert.doesNotMatch(cards[2].innerHTML,/undefined/);
 assert.equal(timers[2].delay,8000);timers[2].fn();assert.equal(cards[2].removed,true);
 dispatch('change','stage');assert.equal(cards.length,3);
});
