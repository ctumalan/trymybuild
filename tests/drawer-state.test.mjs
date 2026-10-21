import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../workspace-ui.js',import.meta.url),'utf8');
const factory=source.slice(source.indexOf(' function createDrawerState()'),source.indexOf(' window.CWDrawerState='));
function fixture(stableGutter=false){
 const style={position:'',top:'',left:'',width:'',overflow:'auto',paddingRight:'8px'};
 const root=(excluded=false,inert=false)=>({inert,matches:()=>excluded});
 const content=root(),alreadyInert=root(false,true),overlay=root(true),nativeDialog=root(true),scrolls=[];
 const context={document:{body:{style,children:[content,alreadyInert,overlay,nativeDialog]},documentElement:{clientWidth:1180}},window:{scrollX:0,scrollY:240,innerWidth:1200,scrollTo:options=>scrolls.push(options)},getComputedStyle:()=>({paddingRight:'8px',scrollbarGutter:stableGutter?'stable':''})};
 const state=vm.runInNewContext(`${factory};createDrawerState()`,context);
 return {state,style,content,alreadyInert,overlay,nativeDialog,scrolls};
}
test('drawers preserve existing body styles, scrollbar space, scroll position and inert state',()=>{
 const f=fixture(),before={...f.style};
 f.state.lock('catalog',{inertBackground:true});
 assert.equal(f.style.position,'fixed');assert.equal(f.style.top,'-240px');assert.equal(f.style.paddingRight,'28px');
 assert.equal(f.content.inert,true);assert.equal(f.overlay.inert,false);assert.equal(f.nativeDialog.inert,false);
 f.state.unlock('catalog');
 assert.deepEqual(f.style,before);assert.equal(f.content.inert,false);assert.equal(f.alreadyInert.inert,true);
 assert.equal(f.scrolls.length,1);assert.equal(f.scrolls[0].top,240);
});
test('closing a child drawer leaves the parent and background scroll locked',()=>{
 const f=fixture();f.state.lock('catalog',{inertBackground:true});f.state.lock('profile');f.state.lock('project');
 f.state.unlock('project');f.state.unlock('profile');
 assert.equal(f.style.position,'fixed');assert.equal(f.content.inert,true);assert.equal(f.scrolls.length,0);
 f.state.unlock('catalog');assert.equal(f.scrolls.length,1);
});
test('closing the catalog beneath a native dialog does not release its scroll lock',()=>{
 const f=fixture();f.state.lock('catalog',{inertBackground:true});f.state.lock('profile');
 f.state.unlock('catalog');assert.equal(f.content.inert,false);assert.equal(f.style.position,'fixed');assert.equal(f.scrolls.length,0);
 f.state.unlock('profile');assert.equal(f.style.position,'');assert.equal(f.scrolls.length,1);
});
test('reopening an existing owner and closing an absent owner are harmless',()=>{
 const f=fixture();f.state.unlock('catalog');assert.equal(f.scrolls.length,0);
 f.state.lock('catalog',{inertBackground:true});f.state.lock('catalog',{inertBackground:true});f.state.unlock('catalog');
 assert.equal(f.style.position,'');assert.equal(f.content.inert,false);assert.equal(f.scrolls.length,1);
});
test('a restored join position survives closing the last drawer',()=>{
 const f=fixture();f.state.lock('catalog',{inertBackground:true});f.style.top='-310px';f.state.unlock('catalog');
 assert.equal(f.scrolls[0].top,310);
});

test('a stable scrollbar gutter does not get reserved a second time',()=>{
 const f=fixture(true);f.state.lock('profile');assert.equal(f.style.paddingRight,'8px');f.state.unlock('profile');
});
