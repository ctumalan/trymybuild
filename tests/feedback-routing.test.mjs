import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {workspaceFixtures,moduleFixture,read} from '../scripts/workspace-fixtures.mjs';

const context=slug=>({url:new URL('https://example.invalid/tell/'+slug),params:{slug},cookies:{get(){}}});
test('recipient feedback has one guided action with public visibility inside the form',async()=>{
 const f=workspaceFixtures(),html=await (await f.routes['/projects/sample-0'](context('sample-0'))).text();
 assert.match(html,/class="primary-button feedback-primary" href="\/tell\/sample-0" data-guided-open="sample-0">Give feedback/);
 assert.doesNotMatch(html,/<summary>Leave a public comment<\/summary>|data-public-comment=/);
 const composer=f.scope.publicCommentComposer("sample-0");assert.match(composer,/Guests appear as Guest/);assert.match(composer,/sign in to update yours/);
 assert.doesNotMatch(html,/Join before posting/);
});
test('guided page exposes guest form, owner guidance and existing thread without leaking drafts',async()=>{
 const f=workspaceFixtures(),guest=moduleFixture('src/pages/tell/[slug].ts',['GET'],{...f.scope,currentUser:async()=>null}).GET;
 let html=await (await guest(context('sample-0'))).text();assert.match(html,/data-guided-panel/);assert.match(html,/action="\/api\/feedback"/);assert.match(html,/data-guided-feedback/);
 html=await (await f.routes['/tell/sample-0'](context('sample-0'))).text();assert.match(html,/data-guided-panel/);assert.match(html,/Creators don’t submit reviews of their own projects/);assert.doesNotMatch(html,/data-guided-feedback/);
 const existing=moduleFixture('src/pages/tell/[slug].ts',['GET'],{...f.scope,currentUser:async()=>({id:f.author}),ensureMember:async()=>({id:f.author})}).GET;
 html=await (await existing(context('sample-0'))).text();assert.match(html,/data-guided-panel/);assert.match(html,new RegExp('/dashboard/messages\\?thread='+f.id));assert.doesNotMatch(html,/data-guided-feedback/);
 assert.equal((await guest(context('sample-1'))).status,404);
});
test('catalog loads the handlers needed by guided and native project overlays',()=>{
 const html=read('index.html');for(const file of ['community-input.js','public-comments.js','project-actions.js'])assert.match(html,new RegExp('src="'+file.replaceAll('.','\\.')+'" defer'));
 const app=read('app.js');assert.match(app,/data-guided-open="\$\{esc\(product.slug\)\}"/);assert.match(app,/window.CWBrowseContext/);
});
test('guided submission requires membership and creates a replyable review rather than a public comment',async()=>{
 const f=workspaceFixtures(),writes=[];
 const db={from(table){const query={select(){return query;},eq(){return query;},maybeSingle:async()=>({data:{owner_user_id:f.owner}}),insert(row){writes.push({table,row});return query;},single:async()=>({data:{id:f.id}})};return query;}};
 const fields={slug:'sample-0',attempt:'stuck',helpful:'not_yet',price:'free',focus:'ease',visibility:'private',message:'I tried editing yesterday’s plan but could not find the edit action.'};
 const request=()=>new Request('https://example.invalid/api/feedback',{method:'POST',headers:{accept:'application/json'},body:new URLSearchParams(fields)});
 const scope={...f.scope,json:(body,status=200)=>Response.json(body,{status}),database:()=>db,sameOrigin:()=>true,allowRequest:async()=>true,currentUser:async()=>({id:f.author,emailVerified:true}),ensureMember:async()=>({id:f.author})};
 const route=moduleFixture('src/pages/api/feedback.ts',['POST'],scope).POST;
 let response=await route({...context('sample-0'),request:request()});assert.equal(response.status,200);const data=await response.json();assert.equal(data.href,'/dashboard/messages?thread='+f.id);assert.match(data.message,/after approval/);
 assert.equal(writes.length,1);assert.equal(writes[0].table,'creator_feedback');assert.equal(writes[0].row.visibility,'private');assert.equal(writes[0].row.author_user_id,f.author);assert.equal(writes[0].row.message,fields.message);
 const guest=moduleFixture('src/pages/api/feedback.ts',['POST'],{...scope,currentUser:async()=>null}).POST;
 response=await guest({...context('sample-0'),request:request()});assert.equal(response.status,401);assert.equal(writes.length,1);
});

function modalFixture({ok=true,panelAvailable=true,deferred=false}={}){
 const calls=[],dialogs=[],listeners=new Map();let release;
 const attrs=data=>({id:data.id,getAttribute:k=>data[k]||'',hasAttribute:k=>k in data,setAttribute(k,v){data[k]=v;},data});
 const input=attrs({id:'message','aria-describedby':'feedback-word-count outside-note'}),counter=attrs({id:'feedback-word-count'}),label=attrs({for:'message'});
 const panel={className:'cw-panel',querySelector:()=>({remove(){}}),querySelectorAll:selector=>selector==='[id]'?[input,counter]:selector==='[for],[aria-describedby],[data-counter-id]'?[label,input]:[]};
 const region={replaceChildren(...children){this.children=children;}},heading={},closeButton={};
 const opener={isConnected:true,focus:()=>calls.push(['focus'])};
 const document={activeElement:opener,querySelectorAll:()=>[],addEventListener:(type,fn)=>listeners.set(type,fn),body:{append(dialog){dialog.isConnected=true;}},createElement(tag){
  if(tag!=='dialog')return{setAttribute(){}};
  const dialog={isConnected:false,setAttribute(){},addEventListener(){},querySelector:selector=>selector==='button'?closeButton:selector==='h2'?heading:region,querySelectorAll:()=>[],showModal:()=>calls.push(['modal']),close(){},remove(){this.isConnected=false;}};dialogs.push(dialog);return dialog;
 }};
 const window={addEventListener(){}};
 const fetch=async href=>{calls.push(['fetch',href]);if(deferred)await new Promise(resolve=>{release=resolve;});return{ok,text:async()=>''};};
 const scope={window,document,location:{pathname:'/'},localStorage:{getItem:()=>null},fetch,DOMParser:class{parseFromString(){return{querySelector:selector=>selector==='[data-guided-panel]'?(panelAvailable?panel:null):{textContent:'Example app'}};}}};
 vm.runInNewContext(read('community-input.js').slice(read('community-input.js').indexOf('// Keep completed feedback')),scope);
 return{api:window.CWGuidedFeedback,calls,dialogs,region,heading,input,counter,label,listeners,close:()=>closeButton.onclick(),release:()=>release()};
}
test('guided modal reads the existing route, labels imported controls uniquely, and restores focus',async()=>{
 const f=modalFixture();await f.api.open('sample-0');assert.deepEqual(f.calls,[['modal'],['fetch','/tell/sample-0']]);
 assert.equal(f.heading.textContent,'Give feedback on Example app');assert.equal(f.label.data.for,f.input.id);assert.equal(f.input.data['aria-describedby'],f.counter.id+' outside-note');assert.match(f.input.id,/^guided-modal-/);
 f.close();assert.equal(f.dialogs[0].isConnected,false);assert.deepEqual(f.calls.at(-1),['focus']);
});
test('closing a loading feedback modal discards its late response',async()=>{
 const f=modalFixture({deferred:true}),pending=f.api.open('sample-0');f.close();f.release();await pending;assert.equal(f.region.children,undefined);
});
test('feedback load failures expose a working full-page fallback and invalid slugs never fetch',async()=>{
 const f=modalFixture({ok:false});await f.api.open('sample-0');assert.equal(f.region.children[1].href,'/tell/sample-0');f.close();await f.api.open('../../private');assert.equal(f.dialogs.length,1);
});
test('an open modal prevents duplicate loads and modified clicks retain normal link behavior',async()=>{
 const f=modalFixture();await f.api.open('sample-0');await f.api.open('sample-0');assert.equal(f.dialogs.length,1);
 let prevented=false;f.listeners.get('click')({target:{closest:()=>({dataset:{guidedOpen:'sample-1'}})},button:0,ctrlKey:true,preventDefault(){prevented=true;}});assert.equal(prevented,false);assert.equal(f.dialogs.length,1);
});
