import test from 'node:test';
import assert from 'node:assert/strict';
import {workspaceFixtures,moduleFixture} from '../scripts/workspace-fixtures.mjs';
import {sameOrigin} from '../src/server/security.mjs';
const ctx=path=>({url:new URL(path,'https://example.invalid'),params:{},cookies:{get(){}},redirect:(href,status)=>new Response(null,{status,headers:{location:href}})});
const paired={id:'11111111-1111-4111-8111-111111111111',state:'matched',complete:false,given:null,received:null,partner:{slug:'sample-guest',title:'Daily sketchbook',maker:'Another maker',question:'Was it clear how to save your first drawing?',task:'Draw and save one sketch.'}};
test('exchange page distinguishes waiting, one response and both responses without guaranteeing feedback',async()=>{
 const f=workspaceFixtures();let state=null;
 const rpc=f.db.rpc;f.db.rpc=async(name,args)=>name==='cw_maker_exchange_state'?{data:state,error:null}:rpc(name,args);
 const route=moduleFixture('src/pages/dashboard/exchange.ts',['GET'],f.scope).GET;
 const html=async()=> (await route(ctx('/dashboard/exchange'))).text();
 assert.match(await html(),/Join the maker feedback exchange/);
 state={...paired,state:'waiting',partner:null};
 assert.match(await html(),/Waiting for another maker/);assert.doesNotMatch(await html(),/name="action" value="join"/);
 state=paired;assert.match(await html(),/Was it clear how to save your first drawing/);assert.match(await html(),/hasn’t shared qualifying feedback/);
 state={...paired,given:f.id};assert.match(await html(),/Feedback shared/);assert.doesNotMatch(await html(),/You both shared feedback/);
 state={...paired,given:f.id,received:f.id,complete:true};assert.match(await html(),/You both shared feedback/);assert.match(await html(),/Join the maker feedback exchange/);
});
test('exchange forms escape creator content and only offer owned published public apps',async()=>{
 const f=workspaceFixtures();f.db.rpc=async()=>({data:null,error:null});
 f.tables.projects[0].title='<script>bad</script>';
 const route=moduleFixture('src/pages/dashboard/exchange.ts',['GET'],f.scope).GET;
 const html=await (await route(ctx('/dashboard/exchange'))).text();
 assert.match(html,/&lt;script&gt;bad&lt;\/script&gt;/);assert.doesNotMatch(html,/<option[^>]+value="sample-(?:1|2|guest)"/);
 f.tables.feedback_requests=[{id:f.id,user_id:f.owner,project_slug:'sample-0',question:'What did you expect to happen after saving?',status:'queued'}];
 const existing=await (await route(ctx('/dashboard/exchange'))).text();assert.match(existing,/uses your existing open feedback request/);assert.match(existing,/required readonly/);
});
test('missing exchange schema does not pretend a join succeeded, and guests get a sign-in destination',async()=>{
 const f=workspaceFixtures();f.db.rpc=async()=>({data:null,error:{message:'Missing function'}});
 assert.equal((await f.routes['/dashboard/exchange'](ctx('/dashboard/exchange'))).status,503);
 const guest=moduleFixture('src/pages/dashboard/exchange.ts',['GET'],{...f.scope,memberContext:async()=>null}).GET;
 const response=await guest(ctx('/dashboard/exchange'));assert.equal(response.status,401);assert.match(await response.text(),/next=%2Fdashboard%2Fexchange/);
});
test('exchange endpoint requires origin, verified membership, bounded question and both commitments',async()=>{
 const f=workspaceFixtures(),scope={...f.scope,sameOrigin,origin:()=> 'https://example.invalid',allowRequest:async()=>true};
 const route=moduleFixture('src/pages/api/maker-exchange.ts',['POST'],scope).POST;
 const fields={action:'join',id:f.id,slug:'sample-0',question:'Was it clear how to save a grocery list?',responseCommitment:'on',exchangeCommitment:'on',user_id:f.author};
 const call=(data,origin='https://example.invalid')=>route({...ctx('/api/maker-exchange'),request:new Request('https://example.invalid/api/maker-exchange',{method:'POST',headers:{origin},body:new URLSearchParams(data)})});
 for(const bad of [{question:'short'},{exchangeCommitment:''},{responseCommitment:''},{id:'bad'},{action:'delete'},{slug:'../private'}])assert.equal((await call({...fields,...bad})).status,400);
 assert.equal((await call(fields,'https://evil.invalid')).status,403);
 const response=await call(fields);assert.equal(response.headers.get('location'),'/dashboard/exchange?saved=1');
 assert.ok(f.db.calls.some(([name,args])=>name==='cw_join_maker_exchange'&&args.p_user===f.owner));
 await call({action:'leave',id:f.id});assert.ok(f.db.calls.some(([name,args])=>name==='cw_leave_maker_exchange'&&args.p_user===f.owner));
 const denied=moduleFixture('src/pages/api/maker-exchange.ts',['POST'],{...scope,memberContext:async()=>({user:{emailVerified:false}})}).POST;
 assert.equal((await denied({...ctx('/api/maker-exchange'),request:new Request('https://example.invalid/api/maker-exchange',{method:'POST',headers:{origin:'https://example.invalid'},body:new URLSearchParams(fields)})})).status,401);
});
test('opting into a normal request routes to the exchange; normal requests stay available',async()=>{
 const f=workspaceFixtures(),route=moduleFixture('src/pages/api/community-credits.ts',['POST'],{...f.scope,sameOrigin,origin:()=> 'https://example.invalid',allowRequest:async()=>true}).POST;
 const fields={action:'create',id:f.id,slug:'sample-0',question:'Was it clear how to save a grocery list?',responseCommitment:'on',returnTo:'projects'};
 const call=extra=>route({...ctx('/api/community-credits'),request:new Request('https://example.invalid/api/community-credits',{method:'POST',headers:{origin:'https://example.invalid'},body:new URLSearchParams({...fields,...extra})})});
 assert.equal((await call({})).headers.get('location'),'/dashboard?view=creator&saved=1');
 assert.equal((await call({exchangeCommitment:'on'})).headers.get('location'),'/dashboard/exchange?saved=1');
 assert.ok(f.db.calls.some(([name])=>name==='cw_join_maker_exchange'));assert.ok(f.db.calls.some(([name])=>name==='cw_launch_feedback_request'));
});
