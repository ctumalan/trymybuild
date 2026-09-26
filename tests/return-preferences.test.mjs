import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../return-preferences.js',import.meta.url),'utf8');
const key='trymybuild-short-return-pause-session-v1',legacy='trymybuild-hide-short-return-prompts';
const storage=map=>({getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)});
function page({session=new Map(),local=new Map(),at=new Date(2026,8,26,12).getTime(),blocked=false}={}){
 let now=at;const events={},winEvents={};let heartbeat;
 class Clock extends Date{static now(){return now;}}
 const unavailable={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}};
 const document={visibilityState:'visible',addEventListener:(k,f)=>events[k]=f};
 const window={addEventListener:(k,f)=>winEvents[k]=f,setInterval:f=>heartbeat=f};
 vm.runInNewContext(source,{Date:Clock,sessionStorage:blocked?unavailable:storage(session),localStorage:blocked?unavailable:storage(local),window,document});
 return {api:window.CWReturnPrompts,session,local,document,events,winEvents,heartbeat:()=>heartbeat(),advance:n=>now+=n,opt:value=>events.change({target:{matches:()=>true,checked:value}})};
}
test('session opt-out survives refresh/navigation but not a fresh tab session',()=>{
 const p=page();p.opt(true);
 assert.match(p.api.option(),/Don’t ask again this session/);
 for(const kind of ['quick','comment'])assert.equal(p.api.suppressed(kind),true);
 assert.equal(p.api.suppressed('detailed'),false);
 const refresh=page({session:p.session,local:p.local});assert.equal(refresh.api.suppressed('quick'),true);
 assert.equal(page({local:p.local}).api.suppressed('quick'),false);
 refresh.opt(false);assert.equal(page({session:p.session}).api.suppressed('comment'),false);
});
test('old permanent opt-out migrates once and cannot silence a future visit',()=>{
 const local=new Map([[legacy,'1']]);const p=page({local});
 assert.equal(p.api.suppressed('quick'),true);assert.equal(local.has(legacy),false);
 assert.equal(page({local}).api.suppressed('quick'),false);
});
test('restored session expires after 30 minutes away without firing a popup',()=>{
 const p=page();p.opt(true);p.document.visibilityState='hidden';p.events.visibilitychange();
 p.advance(30*60*1000);p.heartbeat();p.document.visibilityState='visible';p.events.visibilitychange();
 assert.equal(p.api.suppressed('quick'),false);assert.equal(p.session.has(key),false);
});
test('active use retains the pause but never carries it into the next day',()=>{
 const p=page({at:new Date(2026,8,26,23,40).getTime()});p.opt(true);
 for(let i=0;i<19;i++){p.advance(60000);p.heartbeat();assert.equal(p.api.suppressed('comment'),true);}
 p.advance(60000);p.heartbeat();assert.equal(p.api.suppressed('comment'),false);
});
test('restored browser storage is checked immediately on load',()=>{
 const at=new Date(2026,8,26,12).getTime(),p=page({at});p.opt(true);
 assert.equal(page({session:p.session,at:at+31*60000}).api.suppressed('quick'),false);
});
test('malformed storage fails open and unavailable storage still allows a page-local pause',()=>{
 for(const value of ['{bad','true','{"lastSeen":"wrong"}'])assert.equal(page({session:new Map([[key,value]])}).api.suppressed('quick'),false);
 const p=page({blocked:true});p.opt(true);assert.equal(p.api.suppressed('quick'),true);p.opt(false);assert.equal(p.api.suppressed('quick'),false);
});
