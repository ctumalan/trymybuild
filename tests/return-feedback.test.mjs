import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import '../project-view.js';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('project detail try links retain the return-feedback hook',()=>{
 const product={slug:'one',name:'One',url:'https://example.com/'};
 const live=globalThis.CWProjectView.hero(product);
 assert.match(live,/data-try-app="one"[^>]*>Try this app ↗<\/a>/);
 const ownPreview=globalThis.CWProjectView.hero(product,{preview:true,launchLabel:'Open your site ↗'});
 assert.match(ownPreview,/>Open your site ↗<\/a>/);
 assert.doesNotMatch(ownPreview,/data-try-app/);
 assert.match(source,/armReturnFeedback\(tryApp.dataset.tryApp\)/);
});
function setup(){
 let now=0,shows=0;
 const elements=new Map();
 const dialog={classList:{add(){},remove(){}},setAttribute(){},querySelector(s){if(!elements.has(s))elements.set(s,{setAttribute(){},focus(){},addEventListener(type,handler){this[type]=handler;}});return elements.get(s);},addEventListener(){},showModal(){shows++;},close(){},remove(){}};
 const document={visibilityState:'visible',hasFocus:()=>true,activeElement:{matches:()=>false},querySelector:()=>null,createElement:()=>dialog,body:{append(){}},addEventListener(){}};
 const ctx=vm.createContext({document,window:{addEventListener(){}},Date:{now:()=>now},projects:[{slug:'one',name:'One'}],esc:String,projectCommentComposer:()=>'<form>saved draft</form>',guidedReturnComposer:()=>'<form data-guided-feedback><textarea></textarea></form>'});
 vm.runInContext(source.slice(source.indexOf('const promptedReturnApps'),source.indexOf('function detailDrawer')),ctx);
 return {ctx,document,dialog,elements,tick:n=>now+=n,shows:()=>shows};
}
test('shows the light private signal after a real return and only once per app',()=>{
 const x=setup();x.ctx.armReturnFeedback('one');x.tick(20000);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),0);
 x.ctx.markFeedbackDeparture();x.tick(7000);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),1);
 assert.match(x.dialog.innerHTML,/How did One go\?/);assert.match(x.dialog.innerHTML,/data-quick-return-feedback/);assert.match(x.dialog.innerHTML,/10 seconds · Private/);assert.doesNotMatch(x.dialog.innerHTML,/saved draft/);
 x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(200000);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),1);
});
test('brief returns do not create a delayed popup',()=>{
 const x=setup();x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(2000);x.ctx.maybeShowReturnFeedback();x.tick(20000);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),0);
});
test('does not interrupt another modal or an active editor',()=>{
 for(const blocked of ['modal','editor']){const x=setup();x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(15000);if(blocked==='modal')x.document.querySelector=()=>({});else x.document.activeElement.matches=()=>true;x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),0);}
});

for (const [ms,kind] of [[6999,'none'],[7000,'quick'],[14999,'quick'],[15000,'quick'],[120001,'quick']]) {
 test(`return after ${ms}ms selects ${kind}`,()=>{
  const x=setup();x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(ms);x.ctx.maybeShowReturnFeedback();
  assert.equal(x.shows(),kind==='none'?0:1);
  if(kind==='quick'){assert.match(x.dialog.innerHTML,/data-quick-return-feedback/);assert.doesNotMatch(x.dialog.innerHTML,/saved draft|data-guided-feedback/);}
 });
}

test('each app independently receives one quick prompt regardless of visit length',()=>{
 const x=setup();x.ctx.projects.push({slug:'two',name:'Two'});
 for(const [slug,ms] of [['one',10000],['two',160000]]){x.ctx.armReturnFeedback(slug);x.ctx.markFeedbackDeparture();x.tick(ms);x.ctx.maybeShowReturnFeedback();}
 assert.equal(x.shows(),2);assert.match(x.dialog.innerHTML,/How did Two go\?/);
});

test('opting out suppresses the one automatic prompt at every visit length',()=>{const x=setup();x.ctx.window.CWReturnPrompts={suppressed:kind=>kind==='quick',option:()=>'<label>Don’t show this again</label>'};for(const ms of [10000,16000,120001]){x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(ms);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),0);}});
test('quick response vocabulary is the same task-progress vocabulary used by the guided path',()=>{
 const x=setup();x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(10000);x.ctx.maybeShowReturnFeedback();
 for(const label of ['I completed it','I got stuck','I couldn’t start','I’m still exploring'])assert.match(x.dialog.innerHTML,new RegExp(label));
 assert.match(x.dialog.innerHTML,/Want to say more\?/);assert.match(x.dialog.innerHTML,/Send privately/);assert.doesNotMatch(x.dialog.innerHTML,/2 minutes/);
});
test('guided markup uses three honest steps and keeps public sharing after private submission',()=>{
 const guided=source.slice(source.indexOf('function guidedReturnComposer'),source.indexOf("window.addEventListener('cw-saved-changed'"));
 for(const step of ['Your experience','The moment','Send it'])assert.match(guided,new RegExp(step));
 assert.match(guided,/data-return-step="1"/);assert.match(guided,/data-return-step="2" hidden/);assert.match(guided,/data-return-step="3" hidden/);
 assert.match(guided,/name="visibility" value="private"/);assert.doesNotMatch(guided,/value="public"/);
 assert.match(source,/showSuccess[\s\S]*Share a public tip/);assert.match(source,/showPublicTip/);assert.match(source,/They can reply in Messages/);
});
