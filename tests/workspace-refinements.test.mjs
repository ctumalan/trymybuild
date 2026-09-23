import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDraft,pricingKind} from '../src/server/listing-policy.mjs';
import {isMaterialChange,saveDraft} from '../src/server/listing-service.mjs';
import {sessionLabel} from '../src/server/account-security.mjs';
import {sameOrigin} from '../src/server/security.mjs';
import {workspaceFixtures,moduleFixture,read} from '../scripts/workspace-fixtures.mjs';
const context=(path,params={})=>({url:new URL(path,'https://example.invalid'),params,redirect:(href,status)=>new Response(null,{status,headers:{location:href}}),cookies:{get(){}}});
test('pricing categories round trip and old clients preserve existing pricing',()=>{
 for(const [pricing,label,free] of [['free','Free',true],['freemium','Free + paid options',false],['paid','Paid',false]]){
  const {value,error}=normalizeDraft({pricing});assert.equal(error,undefined);assert.equal(value.price_label,label);assert.equal(value.is_free,free);assert.equal(pricingKind(label),pricing);
 }
 assert.equal(pricingKind('$5 per month'),'paid');assert.ok(normalizeDraft({pricing:'__proto__'}).error);
 assert.equal(Object.hasOwn(normalizeDraft({}).value,'price_label'),false);
 assert.equal(isMaterialChange({price_label:'$5',is_free:false},{}),false);
 assert.equal(isMaterialChange({price_label:'Free',is_free:true},{price_label:'Free + paid options',is_free:false}),true);
 assert.match(read('app.js'),/listingDraft.pricing = p.pricing/);
});
test('editing a paid listing without changing pricing retains the existing price amount',async()=>{
 const row={id:'example',listing_status:'published',lock_version:0,price_label:'$5 per month',is_free:false};
 const store={findOwnedById:async()=>row,updateOwnedGuarded:async(id,owner,guard,patch)=>({...row,...patch})};
 const result=await saveDraft(store,{ownerId:'owner',id:row.id,input:{price_label:'Paid',is_free:false}});
 assert.equal(result.project.price_label,'$5 per month');assert.equal(result.reviewReset,false);
});
test('projects are one collection with Add project first and settings behind ellipsis',async()=>{
 const f=workspaceFixtures(),response=await f.routes['/dashboard'](context('/dashboard?view=creator')),html=await response.text();assert.equal(response.status,200);
 assert.equal((html.match(/data-project-card/g)||[]).length,6);assert.ok(html.indexOf('＋ Add project')<html.indexOf('data-project-card'));
 assert.doesNotMatch(html,/Your next insight starts|Manage builds & release notes|project-selector/);
 assert.match(html,/<details class="project-actions">/);assert.match(html,/2 unread conversations/);assert.match(html,/mini-preview/);
 assert.match(html,/data-project-action="delete"/);assert.match(html,/data-project-action="unpublish"/);
 const published=f.scope.projectActions(f.tables.projects[0]);assert.doesNotMatch(published,/data-project-action="delete"/);
 assert.doesNotMatch(f.scope.projectActions({...f.tables.projects[1],published_at:'2026-01-01'}),/data-project-action="delete"/);
});
test('overview advertises qualifying reviews and keeps factual activity',async()=>{
 const f=workspaceFixtures(),response=await f.routes['/dashboard/overview'](context('/dashboard/overview',{section:'overview'})),html=await response.text();assert.equal(response.status,200);
 for(const dest of ['?view=creator','?view=visitor','/dashboard/notifications','/dashboard/help','/dashboard/messages'])assert.ok(html.includes(dest));
 assert.match(html,/Founder exception—not earned through feedback/);assert.match(html,/Apps you could help improve/);assert.match(html,/Project performance/);assert.match(html,/Not tracked/);assert.doesNotMatch(html,/Unlock another project slot|Become a Verified Creator/);
 const panel=f.scope.performancePanel([{slug:'<script>',title:'<img>',saved_projects:[{count:9}],project_experiences:[{count:3}],creator_feedback:[{count:2}]}],1);
 assert.match(panel,/<td>5<\/td><td>9<\/td>/);assert.doesNotMatch(panel,/<script>|<img>/);
});
test('saved project review is directly accessible and cannot silently invent qualification answers',async()=>{
 const f=workspaceFixtures(),html=await (await f.routes['/dashboard'](context('/dashboard?view=visitor'))).text();
 assert.match(html,/Give feedback/);assert.match(html,/href="\/tell\/sample-guest"/);assert.doesNotMatch(html,/action="\/api\/feedback"/);
 f.tables.projects.find(p=>p.slug==='sample-guest').listing_status='draft';
 const hidden=await (await f.routes['/dashboard'](context('/dashboard?view=visitor'))).text();assert.doesNotMatch(hidden,/Daily sketchbook/);assert.match(hidden,/no longer publicly available/);
});
test('messages use server-side sorting and inline conversations, with one empty state',async()=>{
 const f=workspaceFixtures(),html=await (await f.routes['/dashboard/messages'](context('/dashboard/messages?sort=oldest&unread=1&thread='+f.id))).text();
 assert.match(html,/class="cw-message-toolbar"/);assert.match(html,/data-conversation-content/);assert.match(html,/data-inline-compose/);assert.match(html,/aria-label="Send reply" hidden/);
 assert.equal(f.db.calls.find(c=>c[0]==='cw_combined_inbox')[1].p_sort,'oldest');
 const privateRoute=moduleFixture('src/pages/dashboard/thread/[id].ts',['GET'],{...f.scope,memberContext:async()=>null}).GET;
 assert.equal((await privateRoute(context('/dashboard/thread/'+f.id+'?fragment=1',{id:f.id}))).status,401);
 assert.equal(await f.scope.conversation(f.db,'unrelated-user',f.id,new URL('https://example.invalid')),null);
});
test('maker sees the reply commitment while an invited tester is waiting',async()=>{
 const f=workspaceFixtures();f.tables.feedback_requests=[{id:f.id,user_id:f.owner,project_slug:'sample-0',question:'Where did the first task become unclear?',status:'queued',created_at:'2026-09-12T15:00:00Z'}];
 const thread=await f.scope.conversation(f.db,f.owner,f.id,new URL('https://example.invalid/dashboard/messages?thread='+f.id));
 assert.match(thread,/This tester is waiting for you/);assert.match(thread,/Reply within two days/);
});
test('public profiles preserve visibility while own preview stays authenticated',async()=>{
 const f=workspaceFixtures(),profile=moduleFixture('src/server/profile-view.ts',['profileView'],{...f.scope,STUDIO:{slug:'studio'},listPublished:async()=>[],projectCard:()=>''}).profileView;
 f.tables.profiles[0].is_public=false;
 assert.equal((await profile(context('/people/sample-creator',{slug:'sample-creator'}))).status,404);
 const own=await profile(context('/people/me',{slug:'me'}));assert.equal(own.status,200);assert.match(await own.text(),/Your private profile preview/);
 const guest=moduleFixture('src/server/profile-view.ts',['profileView'],{...f.scope,STUDIO:{slug:'studio'},currentUser:async()=>null}).profileView;
 assert.equal((await guest(context('/people/me',{slug:'me'}))).status,401);
});
test('security sessions are compact and comment moderation retains all safeguards',async()=>{
 assert.equal(sessionLabel('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/153.0.0.0 Safari/537.36'),'Chrome on Mac');
 const f=workspaceFixtures(),security=await(await f.routes['/dashboard/security'](context('/dashboard/security'))).text();assert.match(security,/class="session-row"/);assert.match(security,/This session/);assert.match(security,/<details><summary>Details/);
 const moderation=await(await f.routes['/admin'](context('/admin?section=comments'))).text();assert.match(moderation,/moderation-row/);
 for(const field of ['previous','expected','reason','confirm'])assert.ok(moderation.includes('name="'+field+'"'));
 for(const action of ['Publish','Hide','Return to review','Save decision'])assert.ok(moderation.includes(action));
});
test('inline reply JSON preserves server ownership and origin checks',async()=>{
 const f=workspaceFixtures();
 const deps={...f.scope,sameOrigin,origin:()=> 'https://example.invalid',json:(body,status=200)=>Response.json(body,{status}),allowRequest:async()=>true};
 const reply=moduleFixture('src/pages/api/feedback-reply.ts',['POST'],deps).POST;
 const request=origin=>new Request('https://example.invalid/api/feedback-reply',{method:'POST',headers:{origin,accept:'application/json'},body:new URLSearchParams({id:f.id,requestId:f.id,message:'Thank you for explaining where the search went wrong.'})});
 const result=await reply({...context('/api/feedback-reply'),request:request('https://example.invalid')});assert.equal(result.status,200);assert.equal((await result.json()).message,'Reply sent.');
 assert.ok(f.db.calls.some(c=>c[0]==='cw_feedback_reply'&&c[1].p_actor===f.owner));
 assert.equal((await reply({...context('/api/feedback-reply'),request:request('https://evil.invalid')})).status,403);
 const outsider=moduleFixture('src/pages/api/feedback-reply.ts',['POST'],{...deps,ensureMember:async()=>({id:'44444444-4444-4444-8444-444444444444'})}).POST;
 assert.equal((await outsider({...context('/api/feedback-reply'),request:request('https://example.invalid')})).status,404);
});
