import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {validWish,wishCategories} from '../src/server/wish-policy.mjs';
import {feedbackDestination} from '../src/server/feedback-policy.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const app=read('app.js'),entry=read('community-entry.js');
test('wish word limits are enforced at both boundaries',()=>{
 for(const n of [0,1,3,12,20])assert.equal(validWish('Technology',Array(n).fill('word').join(' ')),false);
 for(const n of [4,5,10,11])assert.equal(validWish('Technology',Array(n).fill('word').join(' ')),true);
 assert.equal(validWish('Invented category','Help me plan my meals'),true);
 assert.equal(validWish('Technology',null),false);
 assert.equal(validWish('Technology','!!! ... --- ???'),false);
});
test('wish categories include the complete existing category menu',()=>{
 const source=app.slice(app.indexOf('const categoryCatalog'),app.indexOf('const primaryCategoryNames'));
 assert.deepEqual(wishCategories,[...source.matchAll(/name: "([^"]+)"/g)].map(x=>x[1]));
 assert.equal(wishCategories.length,33);
});
test('compact comments have unique labels, contextual placeholders and hidden empty send arrow',()=>{
 const ctx=vm.createContext({projectCommentDraft:()=>'',commentWordCount:()=>0,state:{communityPosts:[]},esc:String});
 vm.runInContext(app.slice(app.indexOf('function projectCommentComposer('),app.indexOf('function detailDrawer(')),ctx);
 const p={slug:'example'};
 assert.match(ctx.projectCommentComposer(p,true),/Be the first one to review this project/);
 assert.match(ctx.projectCommentComposer(p,true),/id="comment-card-example"/);
 assert.match(ctx.projectCommentComposer(p),/id="comment-detail-example"/);
 assert.match(ctx.projectCommentComposer(p),/Mention one or two improvements/);
 assert.match(ctx.projectCommentComposer(p),/aria-label="Send comment" hidden/);
 assert.doesNotMatch(ctx.projectCommentComposer(p),/>Post comment</);
 ctx.projectCommentDraft=()=>'<script>bad</script>';
 ctx.esc=s=>String(s).replaceAll('<','&lt;');
 assert.doesNotMatch(ctx.projectCommentComposer(p),/<script>/);
});
test('comment input has its own flexible grid track; counters and status cannot squeeze it',()=>{
 const css=read('launch-refinements.css');
 const form=css.match(/\.compact-comment\.detail-comment-form\{([^}]+)\}/)?.[1];
 assert.match(form,/display:grid/);
 assert.match(form,/grid-template-columns:minmax\(0,1fr\) 44px/);
 assert.match(form,/width:100%/);
 assert.match(form,/max-width:none/);
 assert.match(css,/\.compact-comment \[data-project-comment-count\],\.compact-comment \[data-comment-status\]\{[^}]*grid-column:1\/-1/);
 assert.match(css,/\.compact-comment \[data-comment-status\]:empty\{display:none\}/);
 assert.match(css,/\.card-comments \.inline-help\[open\]\{grid-column:1\/-1\}/);
});
test('listing journey asks for one decision at a time and keeps tab navigation',()=>{
 const ctx=vm.createContext({document:{addEventListener(){}},listingField:(name)=>`FIELD:${name}`,listingIdentityConfirmation:()=>'<div>APP CONFIRMATION</div>',listingStep:0,listingDraft:{stage:'Ready for a first try',sharingPreference:'not_sure'},esc:String});
 vm.runInContext(entry,ctx);
 let html=ctx.inlineListingForm();assert.match(html,/FIELD:url/);assert.doesNotMatch(html,/FIELD:title|Who should see it/);
 assert.match(html,/role="progressbar"/);assert.match(html,/aria-valuenow="1"/);assert.equal((html.match(/FIELD:/g)||[]).length,1);
 ctx.listingStep=1;html=ctx.inlineListingForm();assert.match(html,/APP CONFIRMATION/);assert.match(html,/FIELD:title/);assert.doesNotMatch(html,/FIELD:url|FIELD:does/);
 for(const [step,field] of [[2,'does'],[3,'helps'],[4,'firstTry']]){ctx.listingStep=step;html=ctx.inlineListingForm();assert.match(html,new RegExp('FIELD:'+field));assert.equal((html.match(/FIELD:/g)||[]).length,1);}
 ctx.listingStep=5;html=ctx.inlineListingForm();assert.match(html,/How ready is it\?/);assert.equal((html.match(/data-listing-stage=/g)||[]).length,4);
 ctx.listingStep=6;html=ctx.inlineListingForm();assert.match(html,/Who should see it\?/);assert.match(html,/Invite only/);assert.match(html,/Public/);assert.match(html,/Decide later/);assert.doesNotMatch(html,/Not sure yet/);
 assert.match(html,/data-inline-listing/);assert.match(html,/button type="submit" class="primary-button" disabled/);
 assert.match(entry,/data-listing-stage[^\n]+requestCreatorQuote\(2\)/);
 assert.match(app,/homeViewTabs\('test'\).*listingJourney\(\)/);
 assert.doesNotMatch(app,/Meet the creator|<h3>Tell the creator<\/h3>/);
});
test('signup and wish return paths remain same-origin and strictly allowlisted',()=>{
 assert.equal(feedbackDestination('/?welcome=1'),'/?welcome=1');
 assert.equal(feedbackDestination('/?wish=1#wish-list'),'/?wish=1#wish-list');
 assert.notEqual(feedbackDestination('https://evil.example/?welcome=1'),'https://evil.example/?welcome=1');
});
test('wish persistence protects writes and participates in account deletion',()=>{
 const api=read('src/pages/api/wishes.ts'),sql=read('database/016_community_wishes.sql');
 for(const expected of ['sameOrigin','emailVerified','allowRequest','validWish'])assert.ok(api.includes(expected));
 assert.match(sql,/enable row level security/);
 assert.match(sql,/new.account_status='deleted'/);
 assert.match(sql,/delete from community_wishes where user_id=new.id/);
 assert.match(read('scripts/prepare-site.mjs'),/'community-entry.js'/);
});
test('wish table access is limited to the server role',()=>{
 const migration=readFileSync(new URL('../database/018_community_wishes_service_access.sql',import.meta.url),'utf8');
 assert.match(migration,/grant select, insert, update, delete on public\.community_wishes to service_role/);
 assert.doesNotMatch(migration,/to anon|to authenticated|disable row level security/i);
});
