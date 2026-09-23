import test from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import {workspaceFixtures,moduleFixture,read} from '../scripts/workspace-fixtures.mjs';
import {sameOrigin} from '../src/server/security.mjs';
import {feedbackDestination} from '../src/server/feedback-policy.mjs';
const ctx=path=>({url:new URL(path,'https://example.invalid'),params:{},cookies:{get(){}},redirect:(href,status)=>new Response(null,{status,headers:{location:href}})});
test('retired community route redirects and sidebar preserves Saved apps',async()=>{
 const f=workspaceFixtures(),r=await f.routes['/dashboard/community'](ctx('/dashboard/community'));assert.equal(r.status,302);assert.equal(r.headers.get('location'),'/dashboard/overview');
 const html=await f.scope.surface('Dashboard','', 'overview').text();assert.doesNotMatch(html,/Give &amp; receive feedback|Saved &amp; feedback/);assert.match(html,/Saved apps/);
});
test('guest identity is server-signed, expires, resists tampering and uses a protected cookie',()=>{
 const jar=new Map(),options=[],context={cookies:{get:key=>jar.has(key)?{value:jar.get(key)}:undefined,set(key,value,o){jar.set(key,value);options.push(o);}},url:new URL('https://example.invalid')};
 const api=moduleFixture('src/server/guest-comments.ts',['guestToken'],{...crypto,Buffer,env:()=> 'secret'.repeat(10),cookieOptions:()=>({httpOnly:true,secure:true,sameSite:'lax'}),Date});
 assert.equal(api.guestToken(context),null);const first=api.guestToken(context,true);assert.match(first,/^[a-f0-9]{64}$/);assert.equal(api.guestToken(context),first);assert.equal(options[0].httpOnly,true);assert.equal(options[0].secure,true);assert.equal(options[0].maxAge,604800);
 const cookie=jar.get('cw_guest_comments');jar.set('cw_guest_comments',cookie.slice(0,-1)+(cookie.endsWith('a')?'b':'a'));assert.equal(api.guestToken(context),null);
 jar.set('cw_guest_comments','a'.repeat(64)+'.0.'+'b'.repeat(64));assert.equal(api.guestToken(context),null);
});
test('participation copy preserves records without imposing reward ladders',()=>{
 const f=workspaceFixtures(),html=f.scope.communityMap({balance:2,slots:2,used:1,towardNext:3,verification:{earned:27,hasPublished:false,eligible:false}});
 assert.doesNotMatch(html,/<progress |5 creators →|50 →|1 credit →/);assert.match(html,/Recorded balance/);assert.match(html,/Browsing or selecting interests does not sign you up/);assert.match(html,/not an automatic matching service/);
});
test('project menu invites testers and exposes the feedback request',()=>{
 const f=workspaceFixtures();for(const p of f.tables.projects){const html=f.scope.projectActions(p);assert.match(html,/data-invite-project/);assert.match(html,/Invite testers/);assert.match(html,/Request feedback|Publish before requesting feedback|Cancel feedback request/);}
});
test('empty project lists avoid empty database filters and deleted profiles are not public',async()=>{
 const f=workspaceFixtures();await f.scope.requestState(f.db,f.owner,[]);assert.ok(!f.db.calls.some(c=>c[0]==='feedback_requests'));
 f.tables.users[0].account_status='deleted';assert.equal(await f.scope.publicProfile(f.db,'sample-creator'),null);
});
test('profile stats include only published projects and private self profiles have no share action',async()=>{
 const f=workspaceFixtures();const route=moduleFixture('src/server/profile-view.ts',['profileView'],f.scope).profileView;
 let r=await route({...ctx('/people/sample-creator'),params:{slug:'sample-creator'}});assert.equal(r.status,200);let html=await r.text();assert.match(html,/Public project activity/);assert.match(html,/data-share-profile="sample-creator"/);assert.doesNotMatch(html,/Trip notebook|sample-1/);
 f.tables.profiles[0].is_public=false;r=await route({...ctx('/people/me'),params:{slug:'me'}});html=await r.text();assert.match(html,/Make your profile public before sharing/);assert.doesNotMatch(html,/data-share-profile/);
 assert.equal(feedbackDestination('/people/sample-creator'),'/people/sample-creator');assert.notEqual(feedbackDestination('//evil.example/people/test'),'//evil.example/people/test');
});
test('general messages enforce sign-in, same origin, membership and bounds before writes',async()=>{
 const f=workspaceFixtures(),deps={...f.scope,sameOrigin,json:(data,status=200)=>Response.json(data,{status}),origin:()=> 'https://example.invalid',allowRequest:async()=>true,publicProfile:async()=>({user_id:f.author})};
 const api=moduleFixture('src/pages/api/direct-messages.ts',['POST'],deps).POST;
 const request=(fields,origin='https://example.invalid')=>new Request('https://example.invalid/api/direct-messages',{method:'POST',headers:{origin},body:new URLSearchParams(fields)});
 const valid={action:'send',recipient:'sample-reviewer',requestId:f.id,message:'Hello there'};
 assert.equal((await api({...ctx('/api/direct-messages'),request:request(valid,'https://evil.invalid')})).status,403);
 assert.equal((await api({...ctx('/api/direct-messages'),request:request({...valid,message:'x'.repeat(2001)})})).status,400);
 assert.equal((await api({...ctx('/api/direct-messages'),request:request({...valid,thread:f.id})})).status,404);
 const guest=moduleFixture('src/pages/api/direct-messages.ts',['POST'],{...deps,memberContext:async()=>null}).POST;assert.equal((await guest({...ctx('/api/direct-messages'),request:request(valid)})).status,401);
 const result=await api({...ctx('/api/direct-messages'),request:request(valid)});assert.equal(result.status,200);assert.ok(f.db.calls.some(c=>c[0]==='cw_send_direct_message'&&c[1].p_actor===f.owner&&c[1].p_recipient===f.author));
});
test('guest success is optional signup only after confirmed submission; no automatic email claim',()=>{
 const app=read('app.js'),polish=read('interaction-polish.js');assert.match(app,/if\(data.guest\)window.CWGuestComment\?\.offer\(status\)/);assert.match(polish,/in-site notification/);assert.match(polish,/Not now/);assert.match(polish,/No email is sent/);
 assert.match(read('src/pages/api/comment-updates.ts'),/sameOrigin/);assert.match(read('src/pages/auth/callback.ts'),/claimGuestComments/);assert.match(read('src/pages/api/experiences.ts'),/guest-comment-network',3,3600/);
});
test('motion respects reduced motion; textareas grow; sharing remains a deliberate action',()=>{
 const css=read('ui-refinements.css'),js=read('interaction-polish.js'),share=read('share-invitation.js');assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/resize:none!important/);assert.match(js,/Math.min\(280/);assert.match(js,/localStorage.getItem\('trymybuild-brand-intro'\)/);
 assert.match(share,/Open email draft/);assert.match(share,/data-send-invitation/);for(const label of ['Text','Copy invitation','Choose an app','Gmail in browser','Yahoo in browser'])assert.ok(share.includes(label));assert.match(share,/data-share-profile/);
 assert.doesNotMatch(read('app.js').slice(read('app.js').indexOf('function detailDrawer'),read('app.js').indexOf("document.addEventListener('input'")),/What saving does|About opening this app/);
});
test('a native invitation keeps Escape and keyboard focus above the project drawer',()=>{
 const app=read('app.js');
 const handler=app.slice(app.indexOf('document.addEventListener("keydown"'),app.indexOf('document.addEventListener("input"'));
 assert.match(handler,/if \(event.defaultPrevented \|\| document.querySelector\('\.cw-overlay\[open\], \.invitation-dialog\[open\], \.return-feedback-dialog\[open\]'\)\) return;/);
 assert.ok(handler.indexOf('.invitation-dialog[open]')<handler.indexOf('event.key === "Escape"'));
 assert.match(read('share-invitation.js'),/dialog.addEventListener\('cancel',e=>\{e.preventDefault\(\);close\(\);\}\)/);
});
