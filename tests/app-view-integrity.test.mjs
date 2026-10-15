import test from 'node:test';
import assert from 'node:assert/strict';
import {workspaceFixtures,moduleFixture,read} from '../scripts/workspace-fixtures.mjs';

const context=slug=>({url:new URL('/dashboard/project?slug='+slug,'https://example.invalid'),cookies:{get(){}}});

test('dashboard app details retain the shared card, pricing, media, and owner tools',async()=>{
 const f=workspaceFixtures(),p=f.tables.projects[0];
 Object.assign(p,{price_label:'Paid',external_url:'https://example.com/tool',video_url:'https://youtu.be/dQw4w9WgXcQ',help_text:'Plan a week',first_try:'Add one task'});
 const response=await f.routes['/dashboard/project'](context(p.slug)),html=await response.text();
 assert.equal(response.status,200);
 assert.match(html,/class="recipient-main project-detail-content invitation-detail mealmap-detail owner-app-detail" data-showcase-theme="coral" data-panel-content data-project-card/);
 assert.match(html,/<header class="public-detail-header"><div class="detail-app-identity"><strong>Grocery planner<\/strong><small class="detail-app-pricing">Website pricing: Paid options<\/small><\/div>/);
 assert.ok(html.indexOf('detail-app-pricing')<html.indexOf('studio-app-card'));
 assert.doesNotMatch(html,/detail-product-meta/);
 assert.match(html,/studio-preview-link" href="https:\/\/example.com\/tool"/);
 assert.match(html,/data-load-video="https:\/\/www.youtube-nocookie.com\/embed\/dQw4w9WgXcQ"/);
 assert.match(html,/Plan a week/);
 assert.match(html,/Add one task/);
 assert.ok(html.indexOf('studio-app-card')<html.indexOf('owner-app-management'));
 assert.match(html,/data-invite-project="sample-0"/);
 assert.match(html,/data-project-action="unpublish"/);
 assert.match(html,/Read comments and reply/);
 // Presentation classes do not grant public access to an owner's private route.
 assert.doesNotMatch(html,/data-public-project/);
});

test('dashboard app presentation retains authentication and ownership restrictions',async()=>{
 const f=workspaceFixtures();
 const guest=moduleFixture('src/pages/dashboard/project.ts',['GET'],{...f.scope,memberContext:async()=>null}).GET;
 assert.equal((await guest(context('sample-0'))).status,401);
 assert.equal((await f.routes['/dashboard/project'](context('sample-guest'))).status,404);
 assert.equal((await f.routes['/dashboard/project'](context('missing'))).status,404);
 const draft=await (await f.routes['/dashboard/project'](context('sample-1'))).text();
 assert.match(draft,/studio-app-card/);
 assert.doesNotMatch(draft,/trial-owner-actions|class="invite-actions"/);
});

test('app panel styling follows the shared detail wrapper across public and owner routes',()=>{
 const panels=read('workspace-ui.js'),css=read('future-design.css');
 assert.match(panels,/content\.matches\?\.\('\.project-detail-content\.invitation-detail'\)\|\|content\.querySelector\?\.\('\.project-detail-content\.invitation-detail'\)/);
 assert.match(css,/\.project-detail-content\.invitation-detail,[\s\S]*?background-image:url\('\/assets\/brand\/studio-paper-grain.svg'\);[\s\S]*?background-size:256px 256px/);
});
