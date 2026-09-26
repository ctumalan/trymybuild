import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const urlCode=source.slice(source.indexOf('function homepageAppUrl('),source.indexOf('function discoveryHero('));
const handlerStart=source.indexOf("document.addEventListener('submit', event => {\n  const form = event.target.closest('[data-discovery-entry]')");
const handlerCode=source.slice(handlerStart,source.indexOf("document.addEventListener('submit'",handlerStart+1));
function setup(value,prior='',approve=true){
 let submit,saves=0,renders=0,scrolled=0;const status={textContent:''};
 const c=vm.createContext({URL,listingDraft:{url:prior,title:''},state:{route:'discover'},listingSettings:false,listingStep:0,document:{addEventListener:(_,fn)=>submit=fn,getElementById:()=>({scrollIntoView(){scrolled++;},focus(){}})},matchMedia:()=>({matches:true}),confirm:()=>approve,listingUrl:v=>v,listingNameFromUrl:()=> 'Example',invalidateListingCapture(){},resetListingDraft(){c.listingDraft.url='';},saveListingDraft:()=>{saves++;return true;},ensureListingScreenshot(){},render(){renders++;}});
 vm.runInContext(urlCode+handlerCode,c);
 return {c,run:()=>submit({preventDefault(){},target:{closest:()=>({querySelector:s=>s==='[data-catalog-search]'?{value}:status})}}),counts:()=>({saves,renders,scrolled})};
}
test('combined entry recognizes web URLs and keeps ordinary searches as searches',()=>{
 const {c}=setup('');
 for(const input of ['finalprompt.ai','https://finalprompt.ai/path?q=1','www.example.com'])assert.ok(c.homepageAppUrl(input));
 for(const input of ['meal planner','hello','javascript:alert(1)','https://','https://user:pass@example.com','ftp://example.com'])assert.equal(c.homepageAppUrl(input),'');
 assert.equal(c.homepageAppUrl(' finalprompt.ai '),'https://finalprompt.ai/');
});
test('search submission only moves to the catalog',()=>{const x=setup('meal planner');x.c.state.entryMode='search';x.run();assert.deepEqual(x.counts(),{saves:0,renders:1,scrolled:1});assert.equal(x.c.state.route,'discover');});
test('URL submission saves the URL and advances past the URL question',()=>{const x=setup('finalprompt.ai');x.run();assert.equal(x.c.listingDraft.url,'https://finalprompt.ai/');assert.equal(x.c.listingStep,1);assert.equal(x.c.state.route,'share');assert.equal(x.counts().saves,1);});
test('declining a draft replacement preserves the existing draft',()=>{const x=setup('finalprompt.ai','https://existing.example/',false);x.run();assert.equal(x.c.listingDraft.url,'https://existing.example/');assert.deepEqual(x.counts(),{saves:0,renders:0,scrolled:0});});

test('a URL starts a draft regardless of the previous search mode',()=>{const x=setup('finalprompt.ai');x.c.state.entryMode='search';x.run();assert.equal(x.c.state.route,'share');assert.equal(x.counts().saves,1);});
test('keywords search regardless of previous URL mode',()=>{const x=setup('meal planner');x.c.state.entryMode='list';x.run();assert.deepEqual(x.counts(),{saves:0,renders:1,scrolled:1});assert.equal(x.c.state.query,'meal planner');});

test('listing questions, preview, account and settings retain the same navigation',()=>{
 const fn=name=>{const start=source.indexOf('function '+name+'(');return source.slice(start,source.indexOf('\n}',start)+2);};
 const context=vm.createContext({URL,esc:v=>v,state:{entryMode:'list'},homeView:'test',listingStep:0,listingSettings:false,
  inlineListingForm:()=>'<h1>Question</h1>',listingPreview:()=>'<div>Preview</div>',
  listingAccountPage:()=>'<h1>Account</h1>',listingSettingsPage:()=>'<h1>Settings</h1>'});
 vm.runInContext(urlCode+fn('discoveryHero')+fn('discover')+fn('listingJourney'),context);
 for(let step=0;step<=8;step++){
  context.listingStep=step;
  const html=context.discover(true);
  assert.match(html,/future-discover listing-in-place/);
  assert.match(html,/data-entry-mode="search"[^>]*>← Back to apps<\/button>/);
  assert.match(html,/class="listing-entry-panel"/);
 }
 context.listingSettings=true;
 assert.match(context.discover(true),/Back to apps[\s\S]*<h1>Settings<\/h1>/);
});

test('browsing mid-listing and returning preserves the draft and current question',()=>{
 const start=source.indexOf("  const entryMode = event.target.closest('[data-entry-mode]')");
 const end=source.indexOf("  const browseApps",start);
 const handler=source.slice(start,end);
 const draft={url:'https://example.com/',title:'My app',does:'A useful app for people'};
 const context=vm.createContext({state:{route:'share',listingInProgress:true},homeView:'test',listingStep:4,listingDraft:draft,renderMenuChange(){}});
 vm.runInContext('function choose(event){'+handler+'}',context);
 for(const mode of ['search','list']){
  context.choose({target:{closest:()=>({dataset:{entryMode:mode}})}});
  assert.equal(context.state.route,mode==='search'?'discover':'share');
  assert.equal(context.listingStep,4);
  assert.equal(context.listingDraft,draft);
 }
});


test('empty and ambiguous inputs remain searches and do not create drafts',()=>{
 for (const value of ['', '   ', 'meal planner', 'Technology', 'https://', 'example']) {
  const x=setup(value);x.run();
  assert.equal(x.counts().saves,0);
  assert.equal(x.c.state.route,'discover');
 }
});
test('the action describes the detected intent as input changes',()=>{
 const {c}=setup('');
 for (const [value,label,sharing] of [['','Continue',false],['planning','Search apps →',false],['finalprompt.ai','Share your app →',true],['family life','Search apps →',false],['','Continue',false]]) {
  const input={value},button={},reassurance={},status={};
  c.updateHomepageEntry({querySelector:s=>({'[data-catalog-search]':input,'[data-entry-submit]':button,'[data-entry-reassurance]':reassurance,'[data-entry-status]':status}[s])});
  assert.equal(button.textContent,label);
  assert.equal(reassurance.hidden,!sharing);
  assert.equal(c.state.query,sharing?'':value);
 }
});
