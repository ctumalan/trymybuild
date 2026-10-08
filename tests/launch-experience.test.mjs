import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('signup and global navigation expose the legal agreement',()=>{
 const app=read('app.js'),css=read('future-design.css'),index=read('index.html'),terms=read('src/pages/terms.ts'),privacy=read('src/pages/privacy.ts');
 assert.match(app,/legal-agreement/);assert.match(app,/Terms of Service/);assert.match(app,/Privacy Policy/);
 assert.match(app,/data-listing-create-account/);assert.match(app,/location\.assign\('\/auth\/sign-in\?signup=1&next=listing-dashboard'\)/);
 assert.match(app,/Congratulations—your app has started\./);
 assert.match(app,/Sharing your app with the world takes courage, and it matters\. Taking the first step is usually the hardest\./);
 assert.doesNotMatch(app,/Save this preview now\. Add the description/);
 assert.match(css,/\.listing-preview-conversion \{[^}]*grid-template-columns:minmax\(0,1fr\)[^}]*width:min\(100%,760px\)[^}]*margin-inline:auto/);
 assert.match(css,/\.listing-preview-decision \{ position:static;/);
 assert.doesNotMatch(css,/\.listing-preview-conversion \{[^}]*1\.45fr/);
 assert.match(app,/projectDetailContent\(product,true,!editable\)/);
 assert.match(read('project-view.js'),/preview-try-disabled[^>]+disabled aria-label="Try this app, available after saving"/);
 const guestDecision=app.slice(app.indexOf('<div class="legal-signup">'),app.indexOf('</div>`}<p data-listing-account-status'));
 assert.ok(guestDecision.indexOf('listing-save-hero')<guestDecision.indexOf('legal-agreement'));
 assert.match(guestDecision,/Already have an account\? <a[^>]+>Sign in<\/a>/);assert.doesNotMatch(guestDecision,/secondary-button/);
 assert.match(app,/Agree to the Terms of Service and Privacy Policy to continue\./);
 assert.match(app,/location\.assign\('\/dashboard\/overview\?started='/);
 assert.match(index,/href="\/terms"/);assert.match(index,/href="\/privacy"/);
 assert.match(terms,/Your projects and content/);assert.match(privacy,/categories you open or select/);
});

test('personalization is measured, ranked, optional, and resettable',()=>{
 const sql=read('database/012_launch_experience.sql'),dashboard=read('src/pages/dashboard/[section].ts'),api=read('src/pages/api/category-interest.ts');
 assert.match(sql,/create table if not exists public\.category_engagement/);
 assert.match(sql,/order by clicks desc/);assert.match(sql,/personalization/);
 assert.match(dashboard,/Your learned priorities/);assert.match(dashboard,/preferences-reset/);
 assert.doesNotMatch(dashboard,/name="interests"/);assert.match(api,/cw_record_category_interest/);
});

test('permanent member removal is founder protected and deletes WorkOS identity',()=>{
 const sql=read('database/012_launch_experience.sql'),ui=read('src/pages/admin/workspace.ts'),api=read('src/pages/api/admin/manage.ts');
 assert.match(sql,/cw_admin_erase_account/);assert.match(sql,/target\.system_role='admin'/);
 assert.match(ui,/Permanently remove member/);assert.match(ui,/pattern="DELETE"/);
 assert.match(api,/validProof/);assert.match(api,/userManagement\.deleteUser/);
});
