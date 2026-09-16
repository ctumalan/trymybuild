import test from 'node:test';
import assert from 'node:assert/strict';
import {workspaceFixtures,moduleFixture,read} from '../scripts/workspace-fixtures.mjs';
import {sameOrigin} from '../src/server/security.mjs';
const ctx=path=>({url:new URL(path,'https://example.invalid'),params:{},cookies:{get(){}},redirect:(href,status)=>new Response(null,{status,headers:{location:href}})});
test('feedback request form is owner-only, published-only, and asks a bounded public question',async()=>{
 const f=workspaceFixtures(),route=moduleFixture('src/pages/dashboard/request-feedback.ts',['GET'],f.scope).GET;
 const html=await (await route(ctx('/dashboard/request-feedback?project=sample-0'))).text();
 assert.match(html,/name="question" minlength="10" maxlength="300" required/);assert.match(html,/No credit charge/);assert.match(html,/Don’t include private information/);
 for(const slug of ['sample-1','sample-guest','unknown'])assert.equal((await route(ctx('/dashboard/request-feedback?project='+slug))).status,404);
 f.tables.projects[0].title='<script>bad</script>';
 assert.match(await (await route(ctx('/dashboard/request-feedback?project=sample-0'))).text(),/&lt;script&gt;bad&lt;\/script&gt;/);
});
test('request API checks origin, verified membership and question bounds before the no-charge RPC',async()=>{
 const f=workspaceFixtures(),scope={...f.scope,sameOrigin,origin:()=> 'https://example.invalid',allowRequest:async()=>true},route=moduleFixture('src/pages/api/community-credits.ts',['POST'],scope).POST;
 const fields={action:'create',slug:'sample-0',id:f.id,returnTo:'projects',question:'Was the first task clear enough to complete?'};
 const request=(data,origin='https://example.invalid')=>new Request('https://example.invalid/api/community-credits',{method:'POST',headers:{origin},body:new URLSearchParams(data)});
 assert.equal((await route({...ctx('/api/community-credits'),request:request(fields,'https://evil.invalid')})).status,403);
 assert.equal((await route({...ctx('/api/community-credits'),request:request({...fields,question:'short'})})).status,400);
 const guest=moduleFixture('src/pages/api/community-credits.ts',['POST'],{...scope,memberContext:async()=>null}).POST;
 assert.equal((await guest({...ctx('/api/community-credits'),request:request(fields)})).status,401);
 const r=await route({...ctx('/api/community-credits'),request:request(fields)});assert.equal(r.status,303);
 assert.ok(f.db.calls.some(x=>x[0]==='cw_launch_feedback_request'&&x[1].p_user===f.owner&&x[1].p_question===fields.question));
 assert.ok(!f.db.calls.some(x=>x[0]==='cw_credit_request'));
});
test('retired feedback dashboard redirects to Overview',async()=>{
 const f=workspaceFixtures(),r=await f.routes['/dashboard/community'](ctx('/dashboard/community'));assert.equal(r.status,302);assert.equal(r.headers.get('location'),'/dashboard/overview');
});
test('publication preflight uses server launch allowance, not reviewer milestones or assignment history',async()=>{
 const access=moduleFixture('src/server/community-credits.ts',['publicationAccess'],{}).publicationAccess;
 const make=(status,used=3)=>({rpc:async(name)=>{assert.equal(name,'cw_launch_project_access');return {data:[{slots:3,used}],error:null};},from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{listing_status:status},error:null})})});
 assert.equal((await access(make('draft'), 'member','project')).allowed,false);
 assert.equal((await access(make('draft',2),'member','project')).allowed,true);
 assert.equal((await access(make('published'),'member','project')).allowed,true);
});
test('launch migration preserves earned records and closes paid and free refund loopholes',()=>{
 const sql=read('database/023_organic_launch.sql');assert.match(sql,/cw_release_request_credit/);assert.match(sql,/coalesce\(sum\(amount\),0\)[\s\S]*?<0/);
 assert.doesNotMatch(sql,/delete from (credit_ledger|project_slot_grants|feedback_qualifications)|truncate /i);
 const qualification=sql.split('create or replace function public.cw_apply_qualification')[1].split('end $$;')[0];assert.doesNotMatch(qualification,/insert into project_slot_grants/);assert.match(qualification,/insert into credit_ledger/);
 assert.match(sql,/One open feedback request at a time/);assert.match(sql,/pg_advisory_xact_lock/);assert.doesNotMatch(sql,/progress.earned<50/);
});
