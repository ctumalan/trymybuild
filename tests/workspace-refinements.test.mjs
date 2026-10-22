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
test('apps use a status-aware management list with filters and secondary actions',async()=>{
 const f=workspaceFixtures(),response=await f.routes['/dashboard'](context('/dashboard?view=creator')),html=await response.text();assert.equal(response.status,200);
 assert.match(html,/My apps/);assert.doesNotMatch(html,/My projects/);
 assert.equal((html.match(/data-project-card/g)||[]).length,6);assert.ok(html.indexOf('+ Add app')<html.indexOf('data-project-card'));
 assert.doesNotMatch(html,/Your next insight starts|Manage builds & release notes|project-selector/);
 assert.match(html,/<details class="project-actions">/);assert.match(html,/class="unread-badge"[^>]*>2 unread</);assert.match(html,/mini-preview/);
 assert.match(html,/Manage your apps, drafts, and feedback/);assert.match(html,/All required details complete/);assert.match(html,/details remaining/);assert.match(html,/% complete/);
 assert.ok(html.indexOf('owned-project-grid')<html.indexOf('feedback-swap-banner'));assert.doesNotMatch(html,/All your projects|Add project|unread conversations/);
 assert.match(html,/data-project-action="delete"/);assert.match(html,/data-project-action="unpublish"/);
 const published=f.scope.projectActions(f.tables.projects[0]);assert.doesNotMatch(published,/data-project-action="delete"/);
 assert.doesNotMatch(f.scope.projectActions({...f.tables.projects[1],published_at:'2026-01-01'}),/data-project-action="delete"/);
 const draft=f.scope.ownedProjectCard(f.tables.projects[1],2),ready=f.scope.ownedProjectCard(f.tables.projects[2],2);assert.doesNotMatch(draft,/owned-project-metrics|unread-badge|\d+ saves/);assert.match(draft,/Continue setup/);assert.match(ready,/All required details complete/);assert.match(ready,/Review &amp; publish/);
 const filtered=await (await f.routes['/dashboard'](context('/dashboard?view=creator&status=drafts'))).text();assert.equal((filtered.match(/data-project-card/g)||[]).length,4);assert.doesNotMatch(filtered,/data-project-status="published"/);assert.match(filtered,/data-project-status="draft"/);assert.match(filtered,/data-project-status="in_review"/);assert.doesNotMatch(filtered,/>Ready<\/a>/);
});
test('overview leads with one next step, then status, apps, and feedback',async()=>{
 const f=workspaceFixtures(),response=await f.routes['/dashboard/overview'](context('/dashboard/overview',{section:'overview'})),html=await response.text();assert.equal(response.status,200);
 for(const dest of ['?view=creator','?view=visitor','/dashboard/notifications','/dashboard/help','/dashboard/messages'])assert.ok(html.includes(dest));
 assert.match(html,/class="dashboard-overview"/);assert.match(html,/Your apps/);assert.match(html,/Give &amp; get feedback/);
 assert.match(html,/class="workspace-landscape"/);assert.match(html,/class="overview-task-art"/);assert.match(html,/class="overview-kpi-icon"/);assert.match(html,/class="sidebar-account"/);
 assert.equal((html.match(/class="overview-app-card"/g)||[]).length,2);
 assert.doesNotMatch(html,/<p class="eyebrow">(?:Your next step|Your work|Feedback)<\/p>/);
 for(const [status,label] of [['published','View app'],['draft','Continue setup'],['in_review','Review & publish'],['unpublished','Publish']]){
  const project={...f.tables.projects[0],listing_status:status},card=f.scope.overviewProjectCard(project),owned=f.scope.ownedProjectCard(project,0);for(const markup of [card,owned])assert.match(markup,new RegExp('>'+label.replace('&','&amp;')+'<'));assert.match(card,/>\d+<\/strong> feedback/);
 }
 assert.equal(f.tables.projects[2].listing_status,'in_review');assert.notEqual(f.tables.projects[0].headline,f.tables.projects[1].headline);assert.match(f.tables.projects.at(-1).headline,/drawing idea/);
 assert.match(html,/Founder exception—not earned through feedback/);assert.doesNotMatch(html,/Apps you could help improve|Project performance|Not tracked|Unlock another project slot|Become a Verified Creator/);
 assert.equal((html.match(/class="primary-button"/g)||[]).length,1);
 for(const next of ['overview-primary','overview-kpis','overview-content-grid','overview-secondary-grid'])assert.ok(html.indexOf(next)>=0);
 assert.ok(html.indexOf('overview-primary')<html.indexOf('overview-kpis'));assert.ok(html.indexOf('overview-kpis')<html.indexOf('overview-content-grid'));assert.ok(html.indexOf('overview-content-grid')<html.indexOf('overview-secondary-grid'));
 const panel=f.scope.performancePanel([{slug:'<script>',title:'<img>',saved_projects:[{count:9}],project_experiences:[{count:3}],creator_feedback:[{count:2}]}],1);
 assert.match(panel,/<td>5<\/td><td>9<\/td>/);assert.doesNotMatch(panel,/<script>|<img>/);
});
test('overview layout stays compact and responsive',()=>{
 const css=read('ui-refinements.css');
 for(const rule of ['.overview-primary','.overview-kpis','.overview-content-grid','.overview-app-card','.overview-secondary-grid'])assert.match(css,new RegExp(rule.replace('.','\\.')));
 assert.match(css,/@media\(max-width:680px\)[^{]*\{\.overview-primary/);
});
test('saved project review is directly accessible and cannot silently invent qualification answers',async()=>{
 const f=workspaceFixtures(),html=await (await f.routes['/dashboard'](context('/dashboard?view=visitor'))).text();
 assert.match(html,/Give feedback/);assert.match(html,/href="\/tell\/sample-guest"/);assert.match(html,/saved-project-card compact-app-card/);assert.match(html,/class="saved-apps-toolbar"/);assert.match(html,/1<\/strong> saved app/);assert.match(html,/Feedback &amp; replies/);assert.doesNotMatch(html,/All my feedback|saved projects|action="\/api\/feedback"/);
 f.tables.projects.find(p=>p.slug==='sample-guest').listing_status='draft';
 const hidden=await (await f.routes['/dashboard'](context('/dashboard?view=visitor'))).text();assert.doesNotMatch(hidden,/Daily sketchbook/);assert.match(hidden,/no longer publicly available/);
});
test('notifications prioritize recent activity and keep delivery controls compact',async()=>{
 const f=workspaceFixtures();f.tables.notifications.push({id:f.id,user_id:f.owner,kind:'feedback',title:'New feedback on Grocery planner',href:'/dashboard/messages',created_at:'2026-10-22T15:00:00Z',read_at:null},{id:'44444444-4444-4444-8444-444444444444',user_id:f.owner,kind:'saved',title:'Daily sketchbook has an update',href:'/projects/sample-guest',created_at:'2026-10-21T15:00:00Z',read_at:'2026-10-21T16:00:00Z'});
 const route=moduleFixture('src/pages/dashboard/[section].ts',['GET'],{...f.scope,wishCategories:[],prepareNotifications:async()=>{},notificationPreferences:async()=>({review_opportunities:true,saved_updates:true,recommendations:false,activity_digest:false,draft_reminders:false})}).GET,response=await route(context('/dashboard/notifications',{section:'notifications'})),html=await response.text();assert.equal(response.status,200);
 assert.match(html,/class="notifications-page"/);assert.match(html,/1 unread notification/);assert.match(html,/class="notification-feed"/);assert.match(html,/Recent activity/);assert.match(html,/class="notification-item is-unread"/);assert.match(html,/class="notification-item is-read"/);assert.match(html,/class="notification-preferences"/);assert.equal((html.match(/class="notification-toggle"/g)||[]).length,7);assert.match(html,/Always on/);assert.match(html,/Save notification settings/);assert.doesNotMatch(html,/Notification settings<\/h2>|Summaries are prepared when you visit|push notifications are not enabled/);
});
test('privacy preferences and help use focused interactive layouts',async()=>{
 const f=workspaceFixtures(),route=moduleFixture('src/pages/dashboard/[section].ts',['GET'],{...f.scope,wishCategories:['Family life','Technology','Productivity'],prepareNotifications:async()=>{},notificationPreferences:async()=>({})}).GET;
 const privacy=await(await route(context('/dashboard/privacy',{section:'privacy'}))).text();assert.match(privacy,/class="privacy-dashboard"/);assert.match(privacy,/class="privacy-settings"/);assert.equal((privacy.match(/class="privacy-setting-row"/g)||[]).length,3);assert.match(privacy,/You’re in control/);assert.doesNotMatch(privacy,/class="cw-panel"/);
 const preferences=await(await route(context('/dashboard/preferences',{section:'preferences'}))).text();assert.match(preferences,/class="preferences-page"/);assert.match(preferences,/class="preferences-layout"/);assert.equal((preferences.match(/class="interest-chip"/g)||[]).length,3);assert.equal((preferences.match(/class="preference-toggle"/g)||[]).length,2);assert.match(preferences,/What you explore/);assert.doesNotMatch(preferences,/class="cw-panel"/);
 const help=await(await route(context('/dashboard/help',{section:'help'}))).text();assert.match(help,/class="help-page"/);assert.match(help,/class="help-layout"/);assert.match(help,/class="help-faq"/);assert.match(help,/class="help-contact"/);assert.match(help,/class="help-requests"/);assert.doesNotMatch(help,/<section class="cw-panel"><h2>Quick answers/);
 const css=read('ui-refinements.css');for(const selector of ['.privacy-dashboard','.preferences-layout','.help-layout','.cw-admin-layout>.cw-admin-nav','.admin-page-heading'])assert.ok(css.includes(selector));
});
test('public profile editor leads with essentials and previews changes before optional details',async()=>{
 const f=workspaceFixtures(),route=moduleFixture('src/pages/dashboard/profile.ts',['GET'],f.scope).GET,response=await route(context('/dashboard/profile')),html=await response.text();assert.equal(response.status,200);
 assert.match(html,/<h1>Public profile<\/h1>/);assert.match(html,/This is how other makers see you/);assert.match(html,/class="profile-studio-layout"/);assert.match(html,/class="profile-stage-card"/);assert.match(html,/class="profile-editor-rail"/);assert.match(html,/data-profile-preview-name/);assert.match(html,/Headline/);assert.match(html,/>Bio</);assert.match(html,/<details class="profile-more">/);assert.match(html,/More details/);assert.match(html,/class="profile-readiness"/);assert.match(html,/data-profile-ready="photo"/);assert.match(html,/class="profile-rail-visibility"/);assert.match(html,/Save changes/);assert.doesNotMatch(html,/Save my profile|>Sign out|class="profile-visibility-card"|class="profile-edit-card"/);
 assert.ok(html.indexOf('for="website"')<html.indexOf('<details class="profile-more">'));assert.equal((html.match(/View public profile ↗/g)||[]).length,1);
 const js=read('profile-editor.js');assert.match(js,/function updatePreview/);assert.match(js,/function updateReadiness/);assert.match(js,/data-profile-edit/);assert.match(js,/data-profile-visibility-chip/);
});
test('messages merge replyable feedback and read-only public comments into one responsive inbox',async()=>{
 const f=workspaceFixtures(),html=await (await f.routes['/dashboard/messages'](context('/dashboard/messages?sort=oldest&unread=1&thread='+f.id))).text();
 assert.match(html,/class="message-controls"/);assert.match(html,/class="message-app-filter"/);assert.match(html,/name="app"/);assert.match(html,/All apps/);assert.match(html,/class="messages-inbox"/);assert.match(html,/Feedback and private conversations about your apps/);assert.match(html,/class="feedback-conversation"/);assert.match(html,/class="conversation-app-header"/);assert.match(html,/class="feedback-focus-card"/);assert.match(html,/class="conversation-thread"/);assert.match(html,/data-inline-compose/);assert.match(html,/class="inline-composer conversation-composer"/);assert.match(html,/aria-label="Send reply" disabled/);
 assert.doesNotMatch(html,/>Apply<|>Reset</);assert.match(html,/Feedback · Grocery planner/);
 assert.equal(f.db.calls.find(c=>c[0]==='cw_combined_inbox')[1].p_sort,'oldest');
 const comment=f.tables.project_experiences[0],commentHtml=await(await f.routes['/dashboard/messages'](context('/dashboard/messages?comment='+comment.id))).text();
 assert.match(commentHtml,/Public comment/);assert.match(commentHtml,/Pending public moderation/);assert.match(commentHtml,/visible to you/);assert.match(commentHtml,/Public comments are read-only in Messages/);assert.doesNotMatch(commentHtml,/data-inline-compose/);
 await f.routes['/dashboard/messages'](context('/dashboard/messages?project=Grocery%20planner'));assert.equal(f.db.calls.filter(c=>c[0]==='cw_combined_inbox').at(-1)[1].p_project,'Grocery planner');
 const sentFeedback={...f.tables.creator_feedback[0],id:'44444444-4444-4444-8444-444444444444',project_slug:'sample-guest',author_user_id:f.owner,message:'The daily prompt was clear, but I wanted a quicker way to save my sketch.'},sentComment={...f.tables.project_experiences[0],id:'55555555-5555-4555-8555-555555555555',project_slug:'sample-guest',author_user_id:f.owner,response:'The drawing flow was easy to understand.'};f.tables.creator_feedback.push(sentFeedback);f.tables.project_experiences.push(sentComment);
 const sentHtml=await(await f.routes['/dashboard/messages'](context('/dashboard/messages?scope=sent'))).text();assert.match(sentHtml,/Sent by me/);assert.match(sentHtml,/Feedback and public comments you shared on other makers’ apps/);assert.match(sentHtml,/To Sample Reviewer/);assert.match(sentHtml,/Daily sketchbook/);assert.match(sentHtml,/The drawing flow was easy to understand/);
 const sentDetail=await(await f.routes['/dashboard/messages'](context('/dashboard/messages?scope=sent&comment='+sentComment.id))).text();assert.match(sentDetail,/Your comment/);assert.match(sentDetail,/View or edit on the app page/);
 const privateRoute=moduleFixture('src/pages/dashboard/thread/[id].ts',['GET'],{...f.scope,memberContext:async()=>null}).GET;
 assert.equal((await privateRoute(context('/dashboard/thread/'+f.id+'?fragment=1',{id:f.id}))).status,401);
 assert.equal(await f.scope.conversation(f.db,'unrelated-user',f.id,new URL('https://example.invalid')),null);
});
test('maker sees the reply commitment while an invited tester is waiting',async()=>{
 const f=workspaceFixtures();f.tables.feedback_requests=[{id:f.id,user_id:f.owner,project_slug:'sample-0',question:'Where did the first task become unclear?',status:'queued',created_at:'2026-09-12T15:00:00Z'}];
 const thread=await f.scope.conversation(f.db,f.owner,f.id,new URL('https://example.invalid/dashboard/messages?thread='+f.id));
 assert.match(thread,/This tester is waiting for you/);assert.match(thread,/Reply to your tester/);
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
 const f=workspaceFixtures(),security=await(await f.routes['/dashboard/security'](context('/dashboard/security'))).text();assert.match(security,/class="security-page"/);assert.match(security,/class="security-health-hero/);assert.match(security,/Your account is secure/);assert.match(security,/class="security-dashboard-grid"/);assert.equal((security.match(/class="security-setting-row"/g)||[]).length,3);assert.match(security,/Sign-in &amp; identity/);assert.match(security,/Security at a glance/);assert.match(security,/class="session-row"/);assert.match(security,/class="security-session-tag">This session/);assert.match(security,/Sign out everywhere/);assert.match(security,/class="security-danger-zone"/);assert.match(security,/Protected account/);assert.doesNotMatch(security,/class="cw-panel"|<h2>Sign-in details|<h2>Password|<h2>Delete account/);
 const securityCss=read('ui-refinements.css');assert.match(securityCss,/@media\(max-width:700px\)[^{]*\{[^}]*\.security-page-heading/);assert.match(securityCss,/\.security-setting-row>span\{grid-column:1\/-1;grid-row:2;overflow:visible[^}]*white-space:normal/);
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
