import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {structuredFeedbackInput,feedbackDestination} from '../src/server/feedback-policy.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const input={slug:'test-app',helpful:'not_yet',price:'free',visibility:'private',attempt:'blocked',focus:'bugs',message:'The registration button stayed disabled after every required field was completed.'};
test('homepage assets resolve beside index.html for local-file previews',()=>{
 const html=read('index.html');
 const assets=[...html.matchAll(/<(?:link|script|img)\b[^>]*?(?:href|src)="([^"]+)"/g)].map(match=>match[1]).filter(path=>!/^https?:/.test(path));
 assert.ok(assets.includes('styles.css'));
 assert.ok(assets.includes('launch-refinements.css'));
 for(const path of assets){
  assert.ok(!path.startsWith('/'),`Local asset must be relative: ${path}`);
  assert.ok(existsSync(new URL('../'+path,import.meta.url)),`Missing local asset: ${path}`);
 }
 assert.match(read('scripts/prepare-site.mjs'),/launch-refinements\.css/);
});
test('guided feedback requires valid attempt and focus, without a positive-rating condition',()=>{
 assert.equal(structuredFeedbackInput(input).helpful,'not_yet');
 for(const bad of [{attempt:'toString'},{focus:'__proto__'},{attempt:undefined},{focus:undefined}])assert.equal(structuredFeedbackInput({...input,...bad}),null);
 assert.equal(structuredFeedbackInput({...input,attempt:'not_tried',helpful:'yes'}).helpful,'not_tried');
});
test('messages return paths cannot smuggle external redirects',()=>{
 assert.equal(feedbackDestination('/dashboard/messages'),'/dashboard/messages');
 assert.equal(feedbackDestination('/dashboard/messages?thread=11111111-1111-4111-8111-111111111111'),'/dashboard/messages?thread=11111111-1111-4111-8111-111111111111');
 assert.equal(feedbackDestination('/dashboard/messages?thread=x&next=https://evil.test'),'/?account=1');
});
test('unified message actions bind to authenticated participants and preserve report moderation',()=>{
 const api=read('src/pages/api/messages.ts');
 assert.match(api,/sameOrigin/);assert.match(api,/threadAccess\(m.member.id/);assert.match(api,/eq\('feedback_id',id\)/);
 assert.match(api,/kind:'report'/);assert.doesNotMatch(api,/moderation_status:'hidden'|cw_credit_review/);
 assert.match(api,/p_actor:m.member.id/);assert.match(api,/ignoreDuplicates:true/);
});
test('deleted users are excluded, stale proof is explicit, and cleanup has a retry',()=>{
 assert.match(read('src/pages/admin/workspace.ts'),/neq\('users.account_status','deleted'\)/);
 assert.match(read('src/server/workspace.ts'),/No account was removed/);
 assert.match(read('src/pages/api/admin/manage.ts'),/retry-erasure/);
});
test('review navigation shares the admin shell',()=>{
 for(const page of ['index','community','feedback','project'])assert.match(read('src/pages/admin/'+page+'.ts'),/adminSurface/);
 assert.match(read('src/server/feedback-ui.ts'),/\['messages','\/dashboard\/messages','Messages'\]/);
});
test('catalog stays simple while listing preview pairs screenshot with description',()=>{
 const app=read('app.js'),css=read('launch-refinements.css');
 assert.match(app,/creatorMatchesFilters\(creatorFor\(product\), state\.creatorType, state\.verifiedOnly\)/);
 assert.doesNotMatch(app,/Filter &amp; sort/);assert.doesNotMatch(app,/filter-trust/);
 assert.match(app,/class="catalog-wish-card" data-wish-focus/);
 assert.match(app,/A short sentence is enough · Up to/);
 assert.match(css,/listing-preview-hero>img\{position:static/);
 assert.match(app,/class="legal-agreement"[\s\S]*<span>I agree to the/);
});
test('creator filters compose without treating companies as verified builders',()=>{
 const app=read('app.js');
 const source=app.slice(app.indexOf('function creatorMatchesFilters'),app.indexOf('function experienceCount'));
 const context={};
 Function('context',`${source};context.match=creatorMatchesFilters;`)(context);
 assert.equal(context.match({type:'independent',verified:false},'all',false),true);
 assert.equal(context.match({type:'company',verified:true},'company',false),true);
 assert.equal(context.match({type:'independent',verified:true},'independent',true),true);
 assert.equal(context.match({type:'company',verified:true},'all',true),false);
 assert.equal(context.match({type:'independent',verified:true},'company',false),false);
});
test('discovery gives heading, categories, and the wish action separate zones',()=>{
 const app=read('app.js'),css=read('launch-refinements.css'),future=read('future-design.css');
 assert.match(app,/<nav class="discovery-categories" aria-label="Browse apps by category">/);
 assert.match(app,/More categories/);
 assert.doesNotMatch(app,/<aside class="filter-panel">/);
 assert.match(app,/\$\{discoveryHero\(\)\}<div id="home-panel"[\s\S]*\$\{catalogCategoryNavigation\(\)\}/);
 assert.doesNotMatch(app,/class="catalog-filter-menu"/);
 assert.match(app,/Missing an app\?<br>Start the idea\./);
 assert.match(future,/\.discovery-categories \{[^}]*border-block/);
 assert.match(future,/\.results-heading \+ \.discovery-categories \{[^}]*flex-wrap:nowrap/);
 assert.match(future,/\.results-heading \+ \.discovery-categories \{[^}]*overflow:visible/);
 assert.match(future,/\.discovery-categories details>div \{[^}]*overflow-y:auto/);
 assert.match(future,/@media\(max-width:620px\) \{[\s\S]*?\.discovery-categories details>div \{ position:absolute; top:calc\(100% \+ 8px\); right:0;/);
 assert.doesNotMatch(future,/\.discovery-categories details>div \{ position:fixed; inset:auto/);
 assert.match(future,/\.discovery-categories summary:focus-visible \{[^}]*outline:none/);
 assert.match(future,/\.catalog-wish-card \{[^}]*max-width:300px/);
 assert.match(css,/\.discover-page \.catalog-list,.profile-work \.catalog-list\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:1050px\)\{\.discover-page \.catalog-list,.profile-work \.catalog-list\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:680px\)[\s\S]*\.discover-page \.catalog-list,.profile-work \.catalog-list\{grid-template-columns:minmax\(0,1fr\)/);
});
