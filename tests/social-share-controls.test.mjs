import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../social-share.js',import.meta.url),'utf8').replaceAll('export function','function');
function harness(navigator={}) {
 const controls=new Map(),events={},documentEvents={},timers=new Map();let timerId=0,focused,revoked=0;
 const control=selector=>{
  if(!controls.has(selector))controls.set(selector,{
   selector,value:'',textContent:'',hidden:selector==='#social-share-options',disabled:false,dataset:{},attributes:{},events:{},
   setAttribute(k,v){this.attributes[k]=v;},addEventListener(k,fn){this.events[k]=fn;},
   after(){},focus(){focused=this;},select(){this.selected=true;},setSelectionRange(a,b){this.selection=[a,b];},
   matches(s){return s===selector;},closest(s){return s==='button'?this:s===selector?this:null;}
  });return controls.get(selector);
 };
 control('#social-headline').value='An easier day';control('#social-description').value='Plan your day.';
 const panel={innerHTML:'',querySelector:control,querySelectorAll:()=>[],contains:t=>controls.has(t.selector),addEventListener:(k,f)=>events[k]=f,removeEventListener:k=>delete events[k]};
 const created=[];
 const document={addEventListener:(k,f)=>documentEvents[k]=f,removeEventListener:k=>delete documentEvents[k],body:{append(){}},createElement:()=>{const el={after(){},click(){this.clicked=true;},remove(){}};created.push(el);return el;}};
 class TestURL extends URL {static createObjectURL(){return 'blob:test';}static revokeObjectURL(){revoked++;}}
 const context=vm.createContext({document,navigator,URL:TestURL,URLSearchParams,AbortController,File,fetch:async()=>({ok:true,headers:new Headers({'content-type':'image/png'}),blob:async()=>new Blob(['test'],{type:'image/png'})}),setTimeout:(f)=>{timers.set(++timerId,f);return timerId;},clearTimeout:id=>timers.delete(id)});
 vm.runInContext(source,context);
 const controller=new AbortController();context.mountSocialShare(panel,{name:'Sample',url:'https://example.com/projects/sample',social:{headline:'An easier day',description:'Plan your day.',image:'https://example.com/art.png'}},controller.signal);
 return {control,events,documentEvents,created,controller,get focused(){return focused;},get revoked(){return revoked;},
  click:selector=>events.click({target:control(selector)}),
  preview:async()=>{for(const [id,fn] of [...timers]){timers.delete(id);fn();}await new Promise(resolve=>setImmediate(resolve));}
 };
}

test('copy link confirms only after clipboard succeeds and keeps the share menu collapsed',async()=>{
 let finish,copied;const h=harness({clipboard:{writeText:text=>{copied=text;return new Promise(r=>finish=r);}}});
 const pending=h.click('[data-social-link]');
 assert.equal(h.control('[data-social-link]').textContent,'Copying…');
 assert.equal(h.control('[data-social-link]').disabled,true);
 finish();await pending;
 assert.equal(h.control('[data-social-link]').textContent,'✓ Link copied');
 assert.equal(h.control('[data-social-link]').disabled,false);
 assert.equal(h.control('#social-share-options').hidden,true);
 assert.equal(new URL(copied).pathname,'/projects/sample');assert.ok(copied.endsWith('&social=1'));
 h.controller.abort();assert.equal(Object.keys(h.documentEvents).length,0);
});
test('blocked clipboard offers the exact link, not the caption, for manual copying',async()=>{
 const h=harness({clipboard:{writeText:async()=>{throw Error('blocked');}}});await h.click('[data-social-link]');
 const field=h.control('#social-manual-copy');assert.match(field.value,/^https:\/\/example.com\/projects\/sample\?/);
 assert.equal(h.focused,field);assert.deepEqual(field.selection,[0,field.value.length]);assert.equal(h.created[0].hidden,false);
 assert.match(h.control('[data-social-status]').textContent,/Couldn’t copy automatically/);
 assert.equal(h.control('[data-social-link]').textContent,'Copy app link');h.controller.abort();
});
test('missing clipboard API preserves the whole post and link in manual fallback',async()=>{
 const h=harness();h.control('#social-caption').value='My custom post';await h.click('[data-social-copy]');
 assert.match(h.control('#social-manual-copy').value,/^My custom post\n\nhttps:/);h.controller.abort();
});
test('share disclosure closes on Escape without dismissing the surrounding dialog',async()=>{
 const h=harness();await h.click('[data-social-toggle]');assert.equal(h.control('[data-social-toggle]').attributes['aria-expanded'],'true');
 let prevented=false,stopped=false;h.events.keydown({key:'Escape',preventDefault(){prevented=true;},stopPropagation(){stopped=true;}});
 assert.ok(prevented&&stopped);assert.equal(h.control('#social-share-options').hidden,true);assert.equal(h.focused,h.control('[data-social-toggle]'));
 await h.click('[data-social-toggle]');h.documentEvents.click({target:{}});assert.equal(h.control('#social-share-options').hidden,true);h.controller.abort();
});
test('unsupported image sharing offers download, while cancellation never claims success',async()=>{
 const unsupported=harness();await unsupported.preview();await unsupported.click('[data-social-toggle]');await unsupported.click('[data-social-native]');
 assert.match(unsupported.control('[data-social-status]').textContent,/Download image instead/);assert.equal(unsupported.control('#social-share-options').hidden,false);unsupported.controller.abort();
 let shared;const canceled=harness({canShare:()=>true,share:async data=>{shared=data;throw Object.assign(Error(),{name:'AbortError'});}});
 await canceled.preview();await canceled.click('[data-social-native]');assert.equal(shared.files.length,1);
 assert.equal(canceled.control('[data-social-status]').textContent,'Sharing canceled. You can try again.');assert.equal(canceled.control('[data-social-native]').disabled,false);canceled.controller.abort();assert.equal(canceled.revoked,1);
});
test('successful native handoff and download show distinct feedback',async()=>{
 const h=harness({canShare:()=>true,share:async()=>{}});await h.preview();await h.click('[data-social-native]');
 assert.match(h.control('[data-social-status]').textContent,/handed to your chosen app/);
 await h.click('[data-social-download]');assert.match(h.control('[data-social-status]').textContent,/download started/);assert.equal(h.created.at(-1).clicked,true);h.controller.abort();
});
test('editing the link invalidates a pending copy confirmation',async()=>{
 let finish;const h=harness({clipboard:{writeText:()=>new Promise(r=>finish=r)}});const pending=h.click('[data-social-link]');
 h.control('#social-headline').value='New headline';h.control('#social-headline').events.input();finish();await pending;
 assert.equal(h.control('[data-social-link]').textContent,'Copy app link');assert.equal(h.control('[data-social-status]').textContent,'');h.controller.abort();
});
test('listing uses seven quiet dots with accessible progress and explicit private draft wording',()=>{
 const journey=readFileSync(new URL('../community-entry.js',import.meta.url),'utf8');
 assert.match(journey,/title:'Type your app URL'/);assert.match(journey,/Your draft stays private until you are ready to share it/);
 assert.match(journey,/journey-progress journey-dots/);assert.match(journey,/steps\.map\(\(_,index\)/);assert.match(journey,/role="progressbar"/);assert.match(journey,/aria-valuenow="\$\{listingStep\+1\}"/);
});
