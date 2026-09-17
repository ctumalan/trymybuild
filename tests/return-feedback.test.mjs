import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('listing and project detail try links use the same return-feedback hook',()=>{
 for(const [start,end] of [['function catalogRow(', 'const projectPresentation'],['function projectDetailContent(', "document.addEventListener('input'"]]){
  const section=source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
  assert.match(section,/data-try-app="\$\{esc\(product.slug\)\}"/);
  assert.match(section,/>Try this (?:app|project) ↗<\/a>/);
 }
 assert.match(source,/armReturnFeedback\(tryApp.dataset.tryApp\)/);
});
function setup(){
 let now=0,shows=0;
 const elements=new Map();
 const dialog={setAttribute(){},querySelector(s){if(!elements.has(s))elements.set(s,{setAttribute(){},focus(){},addEventListener(type,handler){this[type]=handler;}});return elements.get(s);},addEventListener(){},showModal(){shows++;},close(){},remove(){}};
 const document={visibilityState:'visible',hasFocus:()=>true,activeElement:{matches:()=>false},querySelector:()=>null,createElement:()=>dialog,body:{append(){}},addEventListener(){}};
 const ctx=vm.createContext({document,window:{addEventListener(){}},Date:{now:()=>now},projects:[{slug:'one',name:'One'}],esc:String,projectCommentComposer:()=>'<form>saved draft</form>',guidedReturnComposer:()=>'<form data-guided-feedback><textarea></textarea></form>'});
 vm.runInContext(source.slice(source.indexOf('const promptedReturnApps'),source.indexOf('function detailDrawer')),ctx);
 return {ctx,document,dialog,elements,tick:n=>now+=n,shows:()=>shows};
}
test('only prompts after departure and at least 15 seconds for a written review, once per app',()=>{
 const x=setup();x.ctx.armReturnFeedback('one');x.tick(20000);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),0);
 x.ctx.markFeedbackDeparture();x.tick(15000);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),1);
 assert.match(x.dialog.innerHTML,/How was One/);assert.match(x.dialog.innerHTML,/saved draft/);
 x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(20000);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),1);
});
test('brief returns do not create a delayed popup',()=>{
 const x=setup();x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(2000);x.ctx.maybeShowReturnFeedback();x.tick(20000);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),0);
});
test('does not interrupt another modal or an active editor',()=>{
 for(const blocked of ['modal','editor']){const x=setup();x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(15000);if(blocked==='modal')x.document.querySelector=()=>({});else x.document.activeElement.matches=()=>true;x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),0);}
});

for (const [ms,kind] of [[6999,'none'],[7000,'quick'],[14999,'quick'],[15000,'review']]) {
 test(`return after ${ms}ms selects ${kind}`,()=>{
  const x=setup();x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(ms);x.ctx.maybeShowReturnFeedback();
  assert.equal(x.shows(),kind==='none'?0:1);
  if(kind==='quick'){assert.match(x.dialog.innerHTML,/data-quick-return-feedback/);assert.doesNotMatch(x.dialog.innerHTML,/saved draft/);}
  if(kind==='review'){assert.match(x.dialog.innerHTML,/saved draft/);assert.doesNotMatch(x.dialog.innerHTML,/data-quick-return-feedback/);}
 });
}

test('quick response does not suppress a later detailed review for the same app',()=>{
 const x=setup();
 const visit=ms=>{x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(ms);x.ctx.maybeShowReturnFeedback();};
 visit(10000);assert.equal(x.shows(),1);assert.match(x.dialog.innerHTML,/data-quick-return-feedback/);
 visit(16000);assert.equal(x.shows(),2);assert.match(x.dialog.innerHTML,/How was One/);
 visit(16000);visit(10000);assert.equal(x.shows(),2);
});
test('each app independently receives its quick and detailed prompts',()=>{
 const x=setup();x.ctx.projects.push({slug:'two',name:'Two'});
 for(const slug of ['one','two']) {
  for(const ms of [10000,16000]){x.ctx.armReturnFeedback(slug);x.ctx.markFeedbackDeparture();x.tick(ms);x.ctx.maybeShowReturnFeedback();}
 }
 assert.equal(x.shows(),4);assert.match(x.dialog.innerHTML,/How was Two/);
});

for(const [ms,detailed] of [[120000,false],[120001,true]])test(`long visit boundary ${ms}ms selects the correct feedback form`,()=>{const x=setup();x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(ms);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),1);assert.equal(x.dialog.innerHTML.includes('data-guided-feedback'),detailed);});
test('a written review does not suppress the later guided feedback form',()=>{const x=setup();for(const ms of [16000,120001]){x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(ms);x.ctx.maybeShowReturnFeedback();}assert.equal(x.shows(),2);assert.match(x.dialog.innerHTML,/data-guided-feedback/);});
test('opting out skips both short prompt types while long visits still open guided feedback',()=>{const x=setup();x.ctx.window.CWReturnPrompts={suppressed:kind=>kind!=='detailed',option:()=>'<label>Don’t show this again</label>'};for(const ms of [10000,16000]){x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(ms);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),0);}x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(120001);x.ctx.maybeShowReturnFeedback();assert.equal(x.shows(),1);assert.match(x.dialog.innerHTML,/data-guided-feedback/);assert.doesNotMatch(x.dialog.innerHTML,/Don’t show this again/);});
test('the return-prompt preference is not submitted as a feedback reason',async()=>{
 const x=setup();let payload;
 x.ctx.crypto={randomUUID:()=> 'request-id'};x.ctx.fetch=async(url,request)=>{payload=JSON.parse(request.body);return {ok:true,json:async()=>({ok:true,message:'Received'})};};
 x.dialog.querySelectorAll=selector=>selector==='input[name=reason]:checked'?[{value:'3'}]:[{value:'3'},{value:'on'}];
 x.ctx.armReturnFeedback('one');x.ctx.markFeedbackDeparture();x.tick(10000);x.ctx.maybeShowReturnFeedback();
 const form=x.elements.get('form');form.dataset={};form.querySelector=()=>({});await form.submit({preventDefault(){},currentTarget:form});
 assert.deepEqual(payload.reasons,['curious']);
});
