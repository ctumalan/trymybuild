import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import {quickFeedbackInput,quickFeedbackOptions} from '../src/server/quick-feedback.mjs';
const id='11111111-1111-4111-8111-111111111111';
test('accepts only bounded known checkbox reasons and a valid app and request ID',()=>{
 assert.deepEqual(quickFeedbackInput({slug:'test-app',requestId:id,reasons:['curious','curious']}),{id,project_slug:'test-app',reasons:['curious']});
 for(const override of [{reasons:[]},{reasons:['made_up']},{reasons:['toString']},{reasons:Array(5).fill('curious')},{slug:'../secret'},{requestId:'invalid'}])assert.equal(quickFeedbackInput({slug:'test-app',requestId:id,reasons:['curious'],...override}),null);
});
const raw=readFileSync(new URL('../src/server/quick-feedback-view.ts',import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replace('export async function','async function');
function context(owner,rows=[]){
 let reads=0;const filters=[];
 const db={from(table){if(table==='quick_app_feedback')reads++;const q={select(){return q;},eq(k,v){filters.push([table,k,v]);return q;},maybeSingle:async()=>({data:owner?{slug:'test-app'}:null}),order(){return q;},limit:async()=>({data:rows})};return q;}};
 const c=vm.createContext({quickFeedbackOptions,e:s=>String(s).replaceAll('<','&lt;'),Date});vm.runInContext(stripTypeScriptTypes(raw),c);return {c,db,filters,reads:()=>reads};
}
test('non-owner cannot read response rows',async()=>{const x=context(false);assert.equal(await x.c.quickFeedbackPanel(x.db,'test-app','other-user'),'');assert.equal(x.reads(),0);assert.ok(x.filters.some(f=>f[1]==='owner_user_id'&&f[2]==='other-user'));});
test('owner sees counts and individual responses without visitor identifiers',async()=>{const x=context(true,[{reasons:['curious','unexpected'],created_at:'2026-09-15T12:00:00Z'}]);const html=await x.c.quickFeedbackPanel(x.db,'test-app','owner');assert.match(html,/Just curious: <strong>1/);assert.match(html,/Not what I expected: <strong>1/);assert.match(html,/View individual responses/);assert.doesNotMatch(html,/visitor_hash/);});
