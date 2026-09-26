import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../entry-intro.js',import.meta.url),'utf8');

function setup({seen=false,reduced=false,width=400,value='',storageBlocked=false,promptWidth=null}={}) {
 const events={},timers=new Map(),classes=new Set(),storage=new Map();let now=0,id=0,resize;
 if(seen)storage.set('trymybuild-entry-intro-seen','1');
 const track={scrollWidth:600,style:{setProperty(k,v){this[k]=v;}}};
 const prompt={clientWidth:promptWidth,classList:{toggle(k,v){this[k]=v;}},querySelector:()=>track};
 const input={value,placeholder:'Paste your app’s URL'};
 const field={classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},querySelector:()=>input,
  append(el){this.overlay=el;el.parent=this;}};
 const document={hidden:false,activeElement:null,querySelector:s=>s==='.entry-placeholder'?(promptWidth===null?null:prompt):field,
  addEventListener(type,fn){events[type]=fn;},createElement(){return {children:[],style:{},scrollWidth:230,clientWidth:width,
   setAttribute(k,v){this[k]=v;},append(el){this.children.push(el);},remove(){if(this.parent)this.parent.overlay=null;}};}};
 const motion={matches:reduced,addEventListener(type,fn){events.motion=fn;}};
 const context={window:{},document,matchMedia:()=>motion,Date:{now:()=>now},
  sessionStorage:{getItem:k=>{if(storageBlocked)throw Error();return storage.get(k);},setItem:(k,v)=>{if(storageBlocked)throw Error();storage.set(k,v);}},
  setTimeout(fn,ms){timers.set(++id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},
  ResizeObserver:class{constructor(fn){resize=fn;}observe(){}disconnect(){}}};
 vm.runInNewContext(source,context);
 return {input,field,document,classes,timers,storage,prompt,track,mount:()=>context.window.CWEntryIntro.mount(document),
  tick:ms=>{now=ms;},event:type=>events[type]({target:{closest:()=>field}}),resize:()=>resize(),motion:()=>events.motion({matches:true})};
}

test('intro rolls two lines then restores the untouched placeholder',()=>{
 const s=setup();s.mount();assert.ok(s.classes.has('is-introducing'));
 assert.deepEqual(Array.from(s.field.overlay.children,line=>line.textContent),['Share what you are building.','Find apps that make life easier.']);
 assert.equal(s.field.overlay['aria-hidden'],'true');assert.equal(s.input.value,'');
 assert.equal(s.input.placeholder,'Paste your app’s URL');
 const timer=[...s.timers.values()][0];assert.equal(timer.ms,6200);timer.fn();
 assert.equal(s.field.overlay,null);assert.equal(s.classes.size,0);s.mount();assert.equal(s.field.overlay,null);
});
test('async catalog rerenders continue the same timeline rather than replaying',()=>{
 const s=setup();s.mount();s.tick(2000);s.mount();
 assert.equal(s.field.overlay.children[0].style.animationDelay,'-2000ms');
 assert.equal([...s.timers.values()][0].ms,4200);
});
test('touch, keyboard focus, typing and mode changes cancel immediately without editing input',()=>{
 for(const type of ['pointerdown','focusin','keydown','input','change','click']){
  const s=setup();s.mount();s.input.value='my app';s.event(type);
  assert.equal(s.field.overlay,null,type);assert.equal(s.input.value,'my app');assert.equal(s.timers.size,0);
  s.mount();assert.equal(s.field.overlay,null);
 }
});
test('repeat visits, reduced motion, prefilled inputs and cramped fields skip animation',()=>{
 for(const options of [{seen:true},{reduced:true},{value:'https://example.com/'},{width:180}]){
  const s=setup(options);s.mount();assert.equal(s.classes.size,0);assert.equal(s.timers.size,0);
 }
 const s=setup();s.document.activeElement=s.input;s.mount();assert.equal(s.classes.size,0);
});
test('shrinking a mobile field or enabling reduced motion restores the placeholder',()=>{
 const s=setup();s.mount();s.field.overlay.clientWidth=180;s.resize();assert.equal(s.classes.size,0);
 const other=setup();other.mount();other.motion();assert.equal(other.classes.size,0);
});
test('unavailable session storage still allows one interruptible intro per page',()=>{
 const s=setup({storageBlocked:true});s.mount();assert.ok(s.classes.has('is-introducing'));
 s.event('focusin');s.mount();assert.equal(s.classes.size,0);
});

test('teleprompter adapts to the field width even after the opening slogan has been seen',()=>{
 const s=setup({seen:true,promptWidth:280});s.mount();
 assert.equal(s.track.style['--entry-travel'],'-320px');
 assert.ok(parseFloat(s.track.style['--entry-duration'])>15);
 assert.equal(s.prompt.classList['is-scrolling'],true);
 s.prompt.clientWidth=700;s.resize();
 assert.equal(s.prompt.classList['is-scrolling'],false);
 assert.equal(s.track.style['--entry-travel'],'-0px');
});
