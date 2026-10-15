import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
function fixture(hash='#invitation-review'){
 const handlers={};let focused='',scrolled='',modalOpened=false;
 const view=name=>({hidden:name==='claim',querySelector:()=>({focus(){focused=name;}}),scrollIntoView(){scrolled=name;}});
 const preview=view('preview'),claim=view('claim'),review={scrollIntoView(){scrolled='review';}};
 const location={hash};
 const document={readyState:'complete',querySelector(selector){return {'[data-invitation-preview]':preview,'[data-invitation-claim-view]':claim,'#invitation-review':review,'#founder-feedback':review}[selector]||null;},addEventListener(type,fn){(handlers[type]||=[]).push(fn);}};
 const window={addEventListener(type,fn){(handlers[type]||=[]).push(fn);},CWPanels:{show(){modalOpened=true;}}};
 vm.runInNewContext(readFileSync(new URL('../listing-invitations.js',import.meta.url),'utf8'),{document,window,location,Set});
 return {location,preview,claim,get focused(){return focused;},get scrolled(){return scrolled;},get modalOpened(){return modalOpened;},fire(type,target){for(const fn of handlers[type]||[])fn({preventDefault(){},target:{closest:selector=>selector===target?{}:null}});}};
}
test('review email anchors remain native and arrival never opens a modal or forces a scroll tour',()=>{
 for(const hash of ['#invitation-review','#founder-feedback','']){
  const f=fixture(hash);assert.equal(f.location.hash,hash);assert.equal(f.modalOpened,false);assert.equal(f.scrolled,'');assert.equal(f.preview.hidden,false);
 }
});
test('creator can edit and return without losing the existing claim form',()=>{
 const f=fixture();const original=f.claim;
 f.fire('click','[data-invitation-edit]');assert.equal(f.preview.hidden,true);assert.equal(f.claim.hidden,false);assert.equal(f.focused,'claim');
 f.fire('click','[data-invitation-open]');assert.equal(f.preview.hidden,false);assert.equal(f.claim.hidden,true);assert.equal(f.claim,original);assert.equal(f.modalOpened,false);
});
test('a review anchor reveals the preview when the creator is currently editing',()=>{
 const f=fixture('#founder-feedback');f.fire('click','[data-invitation-edit]');f.fire('hashchange');
 assert.equal(f.preview.hidden,false);assert.equal(f.claim.hidden,true);assert.equal(f.scrolled,'review');assert.equal(f.location.hash,'#founder-feedback');
});
