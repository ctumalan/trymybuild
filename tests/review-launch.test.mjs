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
test('filter uses creator type and verified account data and preview pairs screenshot with description',()=>{
 const app=read('app.js'),css=read('launch-refinements.css');
 assert.match(app,/creatorMatchesFilters\(creatorFor\(product\), state\.creatorType, state\.verifiedOnly\)/);
 assert.match(app,/Filter &amp; sort/);assert.doesNotMatch(app,/filter-trust/);
 assert.match(app,/Minimum: 4 words · Maximum: 10 words/);
 assert.match(css,/listing-preview-hero>img\{position:static/);
 assert.match(app,/class="legal-agreement"[\s\S]*<span>I agree to the/);
});
test('creator type and earned builder verification are separate accessible filters',()=>{
 const app=read('app.js');
 assert.match(app,/<label for="creator-filter">Creators<\/label>/);
 assert.match(app,/<select id="creator-filter" data-creator-type-select>/);
 assert.match(app,/>All creators<\/option><option[^>]+>Independent<\/option><option[^>]+>Companies<\/option>/);
 assert.doesNotMatch(app,/>Verified creators only<\/option>/);
 assert.match(app,/id="verified-builder-filter" type="checkbox" data-verified-select/);
 assert.match(app,/state\.creatorType = event\.target\.value/);
 assert.match(app,/state\.verifiedOnly = event\.target\.checked/);
 assert.match(app,/aria-label="About builder verification" aria-expanded="false" aria-controls="creator-verification-help"/);
 assert.match(app,/id="creator-verification-help" class="creator-verification-help" hidden/);
 assert.match(app,/Verified Builder is earned by independent creators after qualifying contributions and confirmation that they own their published app\./);
 assert.doesNotMatch(app,/Results follow your sorting choice—not advertising\./);
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
test('discovery keeps categories inside filters above a responsive compact app grid',()=>{
 const app=read('app.js'),css=read('launch-refinements.css');
 assert.match(app,/<nav class="category-strip" aria-label="Filter apps by category">/);
 assert.match(app,/class="category-strip-scroll"/);
 assert.doesNotMatch(app,/<aside class="filter-panel">/);
 assert.match(app,/<div class="catalog-results"><div class="results-heading">[\s\S]*<div class="catalog-controls">[\s\S]*<nav class="category-strip"/);
 assert.match(css,/\.discover-page \.catalog-list,.profile-work \.catalog-list\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:1050px\)\{\.discover-page \.catalog-list,.profile-work \.catalog-list\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:680px\)[\s\S]*\.discover-page \.catalog-list,.profile-work \.catalog-list\{grid-template-columns:minmax\(0,1fr\)/);
});
