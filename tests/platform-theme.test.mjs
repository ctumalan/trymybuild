import test from 'node:test';
import assert from 'node:assert/strict';
import {workspaceFixtures,read} from '../scripts/workspace-fixtures.mjs';
test('every platform shell loads the shared theme after its existing styles',async()=>{
 const f=workspaceFixtures();
 const context=(path,params={})=>({url:new URL(path+(path==='/dashboard'?'?view=creator':''),'https://example.invalid'),params,cookies:{get(){}},redirect:(url,status)=>new Response(null,{status,headers:{location:url}})});
 for(const [path,params] of [['/dashboard',{ }],['/dashboard/overview',{section:'overview'}],['/dashboard/messages',{}],['/dashboard/security',{}],['/people/sample-creator',{slug:'sample-creator'}],['/projects/sample-0',{slug:'sample-0'}],['/tell/sample-0',{slug:'sample-0'}],['/admin',{}]]){
  const html=await(await f.routes[path](context(path,params))).text();
  assert.match(html,/href="\/future-design.css"/,path);
  assert.ok(html.indexOf('/future-design.css')>html.indexOf('/ui-refinements.css'),path);
 }
 assert.match(read('src/server/auth.ts'),/href="\/future-design.css"/);
 assert.match(read('index.html'),/href="future-design.css"/);
 assert.match(read('scripts/prepare-site.mjs'),/future-design.css/);
});
