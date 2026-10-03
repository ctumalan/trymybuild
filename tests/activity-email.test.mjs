import test from 'node:test';
import assert from 'node:assert/strict';
import {activityEmail,deliverActivityEmails} from '../src/server/activity-email.mjs';
function setup({disabled=false,inactive=false,verified=true,fail=false}={}){
 const changes=[],requests=[];
 const db={rpc:async()=>({data:[{notification_id:'n1',lease_id:'lease',attempts:1}]}),from(table){const q={select(){return q;},eq(){return q;},single:async()=>({data:table==='users'?{workos_user_id:'user',account_status:inactive?'deleted':'active'}:{id:'n1',user_id:'owner',title:'New comment',href:'/dashboard/messages?project=app'}}),maybeSingle:async()=>({data:{feedback_alerts:!disabled}}),update(values){changes.push(values);return q;},then(resolve){return Promise.resolve({error:null}).then(resolve);}};return q;}};
 const deps={apiKey:'test',getUser:async()=>({email:'owner@example.com',emailVerified:verified}),fetch:async(url,options)=>{requests.push({url,options});return {ok:!fail};}};
 return {db,deps,changes,requests};
}
test('activity emails link to the relevant conversation and escape user content',()=>{
 const m=activityEmail({title:'New <script>\ncomment',href:'/dashboard/messages?project=app&thread=1'});
 assert.match(m.text,/https:\/\/trymybuild.com\/dashboard\/messages/);assert.ok(!m.html.includes('<script>'));assert.ok(!m.subject.includes('\n'));
 for(const href of ['https://evil.example','//evil.example','/\\evil.example'])assert.match(activityEmail({href}).text,/https:\/\/trymybuild.com\/dashboard\/notifications/);
});
test('verified recipients get email with stable idempotency and completion recorded',async()=>{
 const s=setup();assert.deepEqual(await deliverActivityEmails(s.db,s.deps),{sent:1,skipped:0,failed:0});
 assert.equal(s.requests[0].options.headers['Idempotency-Key'],'activity/n1');assert.ok(s.changes[0].sent_at);
 assert.deepEqual(JSON.parse(s.requests[0].options.body).to,['owner@example.com']);
});
test('opted-out, deleted, and unverified recipients are skipped',async()=>{
 for(const options of [{disabled:true},{inactive:true},{verified:false}]){const s=setup(options);assert.equal((await deliverActivityEmails(s.db,s.deps)).skipped,1);assert.equal(s.requests.length,0);assert.ok(s.changes[0].skipped_at);}
});
test('provider failures remain queued with backoff',async()=>{const s=setup({fail:true});assert.equal((await deliverActivityEmails(s.db,s.deps)).failed,1);assert.ok(Date.parse(s.changes[0].available_at)>Date.now());assert.ok(!s.changes[0].sent_at);});
