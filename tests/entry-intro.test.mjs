import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('entry-intro.js');
function setup({seen=false,reduced=false,storageBlocked=false}={}) {
 const events={},timers=new Map(),classes=new Set(),storage=new Map();let count=0,resize;
 if(seen)storage.set('trymybuild-discovery-intro-seen','1');
 const brand={textContent:'Get human feedback on your early app.',classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
 const track={scrollWidth:600,style:{setProperty(k,v){this[k]=v;}}};
 const prompt={clientWidth:280,querySelector:()=>track,classList:{toggle(k,v){this[k]=v;}}};
 const document={hidden:false,querySelector:s=>s==='.discovery-promise'?brand:s==='.entry-placeholder'?prompt:null,addEventListener:(t,f)=>events[t]=f};
 const context={document,window:{},matchMedia:()=>({matches:reduced,addEventListener:(t,f)=>events.motion=f}),Date,
 sessionStorage:{getItem:k=>{if(storageBlocked)throw Error();return storage.get(k);},setItem:(k,v)=>{if(storageBlocked)throw Error();storage.set(k,v);}},
 setTimeout:(f,ms)=>{timers.set(++count,{f,ms});return count;},clearTimeout:k=>timers.delete(k),ResizeObserver:class{constructor(f){resize=f;}observe(){}disconnect(){}}};
 vm.runInNewContext(source,context);
 return {brand,classes,timers,track,prompt,mount:()=>context.window.CWEntryIntro.mount(document),resize:()=>resize(),event:t=>events[t]({target:{closest:()=>true}})};
}
test('the persistent promise is above the search form, not beside the logo',()=>{
 assert.match(read('app.js'),/class="discovery-promise"><span>Stop guessing\. Get <em>human feedback[\s\S]*?<\/em> on your early app<\/span><\/h1>/);
 assert.match(read('app.js'),/class="discovery-instrument-copy">Invite people to try your app, find out what’s confusing, and talk it through honestly\.<\/p>/);
 assert.doesNotMatch(read('index.html'),/class="brand-intro"/);
 assert.ok(read('app.js').indexOf('class="discovery-promise"')<read('app.js').indexOf('class="discovery-entry"'));
});
test('the reveal completes with the promise still visible and does not replay on render',()=>{
 const s=setup();s.mount();assert.ok(s.classes.has('is-introducing'));const timer=[...s.timers.values()][0];
 s.mount();assert.equal(s.timers.size,1);assert.equal([...s.timers.values()][0],timer);
 timer.f();assert.equal(s.classes.size,0);assert.match(s.brand.textContent,/Get human feedback/);s.mount();assert.equal(s.timers.size,0);
});
test('repeat visits and reduced motion keep the slogan without animation',()=>{
 for(const options of [{seen:true},{reduced:true}]){const s=setup(options);s.mount();assert.equal(s.classes.size,0);assert.equal(s.timers.size,0);assert.match(s.brand.textContent,/Get human feedback/);}
});
test('interacting with search settles the reveal without removing the slogan',()=>{
 for(const type of ['pointerdown','focusin','keydown','input','change','click']){const s=setup();s.mount();s.event(type);assert.equal(s.classes.size,0);assert.match(s.brand.textContent,/Get human feedback/);}
});
test('unavailable storage still allows one reveal per page',()=>{
 const s=setup({storageBlocked:true});s.mount();s.event('focusin');s.mount();assert.equal(s.classes.size,0);
});
test('the search teleprompter still adapts independently to available width',()=>{
 const s=setup({seen:true});s.mount();assert.equal(s.track.style['--entry-travel'],'-320px');
 s.prompt.clientWidth=700;s.resize();assert.equal(s.prompt.classList['is-scrolling'],false);
});
