import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

function fixture({hash='#invitation-review',reduced=false,ready='complete'}={}){
 const events=()=>{const handlers=new Map();return {addEventListener(type,fn){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(fn);},removeEventListener(type,fn){handlers.get(type)?.delete(fn);},fire(type){for(const fn of [...(handlers.get(type)||[])])fn({type});}};};
 const location=new URL('https://example.com/listing-invitation/signed-preview'+hash);
 let now=0,next=0,opened=false;const timers=new Map(),frames=new Map();
 const review={isConnected:true,getBoundingClientRect:()=>({top:1400-panel.scrollTop})};
 const panel={...events(),open:true,scrollTop:0,scrollHeight:2500,clientHeight:800,style:{scrollBehavior:'smooth'},querySelector:()=>review,getBoundingClientRect:()=>({top:0})};
 const document={...events(),readyState:ready,querySelector(selector){if(selector==='#invitation-app-panel')return {innerHTML:'App and review'};if(selector==='.cw-overlay[open]')return opened?panel:null;return null;}};
 const window={...events(),CWPanels:{show(){opened=true;}},dispatchEvent(event){window.fire(event.type);}};
 const context={document,window,location,history:{state:{},replaceState(_state,_title,path){const next=new URL(path,location);location.href=next.href;}},Event,Set,Math,matchMedia:()=>({matches:reduced}),performance:{now:()=>now},setTimeout(fn,ms){const id=++next;timers.set(id,{fn,due:now+ms});return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame(fn){const id=++next;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)};
 vm.runInNewContext(readFileSync(new URL('../listing-invitations.js',import.meta.url),'utf8'),context);
 const advance=to=>{for(const [id,timer] of [...timers])if(timer.due<=to){timers.delete(id);now=timer.due;timer.fn();}now=to;const pending=[...frames.values()];frames.clear();for(const fn of pending)fn(now);};
 return {document,window,panel,location,timers,frames,advance};
}
test('review email links show the app first, then travel gradually to the review',()=>{
 for(const hash of ['#invitation-review','#founder-feedback']){
  const f=fixture({hash});assert.equal(f.location.hash,'');assert.equal(f.panel.scrollTop,0);
  f.advance(899);assert.equal(f.panel.scrollTop,0);
  f.advance(900);assert.equal(f.panel.scrollTop,0);
  f.advance(2100);assert.equal(f.panel.scrollTop,688);
  f.advance(3300);assert.equal(f.panel.scrollTop,1376);assert.equal(f.location.hash,hash);assert.equal(f.panel.style.scrollBehavior,'smooth');
 }
});
test('visitor input stops the animation and leaves their scroll position alone',()=>{
 for(const type of ['wheel','touchstart','pointerdown','keydown','close']){
  const f=fixture();f.advance(900);f.advance(1500);f.panel.fire(type);f.panel.scrollTop=245;f.advance(5000);
  assert.equal(f.panel.scrollTop,245);assert.equal(f.frames.size,0);assert.equal(f.timers.size,0);assert.equal(f.location.hash,'#invitation-review');
 }
});
test('reduced motion reaches the review directly; plain preview links have no automatic tour',()=>{
 const reduced=fixture({reduced:true});assert.equal(reduced.panel.scrollTop,1376);assert.equal(reduced.timers.size,0);assert.equal(reduced.frames.size,0);
 const plain=fixture({hash:''});plain.advance(5000);assert.equal(plain.panel.scrollTop,0);assert.equal(plain.location.hash,'');
});
test('initial anchor scrolling remains suppressed until page assets have loaded',()=>{
 const f=fixture({ready:'interactive'});assert.equal(f.location.hash,'');f.document.fire('DOMContentLoaded');f.advance(5000);assert.equal(f.panel.scrollTop,0);assert.equal(f.timers.size,0);
 f.document.readyState='complete';f.window.fire('load');f.advance(5900);f.advance(8300);assert.equal(f.panel.scrollTop,1376);assert.equal(f.location.hash,'#invitation-review');
});
