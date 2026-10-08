import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import '../project-media.js';
import '../project-view.js';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../launch-refinements.css',import.meta.url),'utf8');
const themeCss=readFileSync(new URL('../future-design.css',import.meta.url),'utf8');
const shared=readFileSync(new URL('../project-view.js',import.meta.url),'utf8');
const serverDetail=readFileSync(new URL('../src/pages/projects/[slug].ts',import.meta.url),'utf8');
const drawer=shared+app.slice(app.indexOf('function projectDetailContent(product'),app.indexOf("document.addEventListener('input'",app.indexOf('function detailDrawer(product)')));
test('detail view uses the invitation screenshot layout and relevant information',()=>{
 assert.match(drawer,/class="recipient-art"/);
 assert.match(drawer,/class="detail-product-signal"/);
 assert.match(shared,/class="detail-category-icon"/);
 assert.match(shared,/categoryPaths\[category\]/);
 assert.match(shared,/class="detail-product-meta"/);
 assert.doesNotMatch(shared,/detail-product-meta[^\n]*product\.stage/);
 assert.doesNotMatch(drawer,/<small>\$\{esc\(product\.price\)\} · \$\{esc\(product\.category\)\}/);
 assert.match(drawer,/class="recipient-art-chrome"/);
 assert.match(drawer,/class="recipient-art-viewport"/);
 assert.match(drawer,/detail-note-brand-icon[^>]*viewBox="0 0 256 256"/);
 assert.doesNotMatch(drawer,/--project-wallpaper|Good to know/);
 assert.doesNotMatch(drawer,/What saving does|About opening this app/);
 assert.match(drawer,/Try this app ↗/);
 assert.match(drawer,/Ask the maker a question or share a thought/);
 assert.match(drawer,/Posts immediately\./);
 assert.doesNotMatch(drawer,/Public after review\./);
 assert.match(shared,/Be the first to review this app/);
 assert.doesNotMatch(shared,/Receive feedback back/);
 const nudgeLayout=globalThis.CWProjectView.conversation({slug:'layout-check',communityReviewCount:0},{loading:false});
 assert.ok(nudgeLayout.indexOf('conversation-tabs')<nudgeLayout.indexOf('feedback-nudge'));
 assert.doesNotMatch(shared,/data-open-feedback|feedback-nudge-arrow/);
 assert.match(shared,/feedback-nudge-doodle/);
 assert.match(themeCss,/@keyframes feedback-arrow-line/);
 assert.match(themeCss,/@keyframes feedback-sticker-pop/);
 assert.match(themeCss,/@media\(prefers-reduced-motion:reduce\) \{ \.feedback-nudge/);
 assert.match(shared,/\$\{video\(product.video\)\}<\/div><\/section>/);
 assert.doesNotMatch(drawer+serverDetail,/Connects to the video provider|project-video-note/);
 assert.match(css,/\.mealmap-detail \.project-screenshot\{[^}]*object-fit:contain/);
 assert.match(css,/\.listing-preview-card \.listing-preview-hero>img\{[^}]*object-fit:contain/);
 assert.match(app,/listing-preview-card project-detail-content invitation-detail mealmap-detail/);
 assert.match(app,/data-showcase-theme="\$\{esc\(CWProjectView\.theme\(product\)\)\}"/);
 assert.match(themeCss,/\.listing-preview-card\.invitation-detail\[data-showcase-theme\] \.recipient-copy h2 \{[^}]*overflow-wrap:anywhere/);
});
test('demo belongs inside the app card after the app link, with no player loaded until clicked',()=>{
 const product={slug:'demo',name:'Demo app',url:'https://example.com',video:'https://youtu.be/dQw4w9WgXcQ'};
 const html=globalThis.CWProjectView.hero(product);
 assert.equal((html.match(/Watch demo/g)||[]).length,1);
 assert.match(html,/external-destination[\s\S]*project-video[\s\S]*Watch demo[\s\S]*<\/div><\/div><\/section>$/);
 assert.match(html,/data-load-video="https:\/\/www.youtube-nocookie.com\/embed\/dQw4w9WgXcQ"/);
 assert.doesNotMatch(html,/<iframe/);
 for(const video of ['', 'javascript:alert(1)', 'https://unapproved.example/video'])assert.doesNotMatch(globalThis.CWProjectView.hero({...product,video}),/Watch demo|project-video/);
 assert.doesNotMatch(serverDetail,/class="project-video/);
 assert.doesNotMatch(app,/\$\{videoPlayer\(product.video\)\}/);
});
test('project destination shows the exact destination URL',()=>{
 const source=app.slice(app.indexOf('function projectDestination'),app.indexOf('function categoryIcon'));
 const context={};
 Function('context','window',`${source};context.destination=projectDestination;`)(context,{location:{origin:'https://trymybuild.com'}});
 assert.equal(context.destination('projects/afterschool-together/index.html'),'https://trymybuild.com/projects/afterschool-together/index.html');
 assert.equal(context.destination('/projects/example'),'https://trymybuild.com/projects/example');
 assert.equal(context.destination('https://example.com/tool'),'https://example.com/tool');
});
test('the signup preview shows the launch action without making it clickable',()=>{
 const product={slug:'preview-app',name:'Preview app',url:'https://example.com'};
 const disabled=globalThis.CWProjectView.hero(product,{preview:true,disabledLaunch:true});
 assert.match(disabled,/<button class="primary-button preview-try-disabled"[^>]+disabled[^>]*>Try this app ↗<\/button>/);
 assert.doesNotMatch(disabled,/href="https:\/\/example\.com"/);
 const published=globalThis.CWProjectView.hero(product);
 assert.match(published,/<a class="primary-button" href="https:\/\/example\.com"/);
 assert.doesNotMatch(published,/preview-try-disabled/);
});
test('categories wrap and violet accents apply to navigation and illustration panels',()=>{
 assert.match(css,/\.category-strip-scroll\{flex-wrap:wrap;overflow:visible/);
 assert.match(css,/\.site-header nav button:hover/);
 assert.match(css,/\.share-visual,\.share-visual-intro\{background:#493064/);
});
test('app detail background animates and respects reduced motion',()=>{
 assert.match(themeCss,/\.project-detail-content \.recipient-hero,[\s\S]*animation:app-showcase-wash 4s linear infinite alternate/);
 assert.match(themeCss,/--showcase-glow,#e7d5f7\) 18%/);
 assert.match(themeCss,/--showcase-wash,#ded2ec\) 12%/);
 assert.match(themeCss,/--showcase-glow,#e7d5f7\) 20%/);
 assert.match(themeCss,/animation:app-showcase-glow 3s ease-in-out infinite alternate/);
 assert.match(themeCss,/@keyframes app-showcase-glow/);
 assert.match(themeCss,/@media\(prefers-reduced-motion:reduce\)[\s\S]*\.detail-dialog\.invitation-detail\[data-showcase-theme\] \.recipient-hero[\s\S]*animation:none/);
});
test('each launch app carries its own preview-matched detail palette',()=>{
 const themes={
  afterschooltogether:'afterschool',stackscout:'stackscout',gamegrid:'gamegrid',lessonlab:'lessonlab',
  cartcompare:'cartcompare',pocketbalance:'pocketbalance',dayframe:'dayframe',mealmap:'mealmap',
  homerhythm:'homerhythm',packlight:'packlight',briefbuilder:'briefbuilder','codexnest-d43ff0':'codexnest'
 };
 for(const [slug,theme] of Object.entries(themes)){
  assert.equal(globalThis.CWProjectView.theme({slug,category:'Technology'}),theme);
  assert.match(themeCss,new RegExp(`data-showcase-theme="${theme}"`));
 }
 assert.match(shared,/detail-note-icon[\s\S]*currentColor|detail-note-icon/);
 assert.match(themeCss,/--app-accent/);
});
test('catalog project drawer stays intentionally narrow without shrinking shared pages',()=>{
 assert.match(themeCss,/\.detail-dialog\.mealmap-detail\.invitation-detail\s*\{[\s\S]*?width:min\(440px,calc\(100vw - 24px\)\);[\s\S]*?max-width:440px/);
 assert.match(themeCss,/data-showcase-theme="codexnest"[^}]*\.public-detail-header \.invite-actions \{[^}]*flex-wrap:nowrap/);
});
test('similar apps use one detailed card per row in the narrow project drawer',()=>{
 assert.match(app,/similar-card-copy/);
 assert.match(app,/similar-card-summary/);
 assert.match(app,/\$\{esc\(p\.summary \|\| p\.purpose\)\}/);
 assert.match(themeCss,/:is\(\[data-public-project\],\.detail-dialog\) \.similar-grid \{[^}]*grid-template-columns:1fr/);
 assert.match(themeCss,/:is\(\[data-public-project\],\.detail-dialog\) \.similar-card \{[\s\S]*?grid-template-columns:minmax\(0,42%\) minmax\(0,1fr\)/);
});
test('light project canvas keeps the accent vectors moving with reduced-motion support',()=>{
 assert.match(themeCss,/linear-gradient\(145deg,#fff,#fbfaf7\)/);
 assert.match(themeCss,/\.recipient-copy h2,[\s\S]*?data-showcase-theme="stackscout"[^}]*\{[\s\S]*?color:#1f1b1d/);
 assert.match(themeCss,/\.detail-orbit \{ animation:detail-orbit-float 7s ease-in-out infinite alternate/);
 assert.match(themeCss,/@keyframes detail-orbit-float/);
 assert.match(themeCss,/@media\(prefers-reduced-motion:reduce\)[\s\S]*\.detail-orbit \{ animation:none/);
});
test('first-review sticker disappears after a non-admin community review',()=>{
 const first=globalThis.CWProjectView.conversation({slug:'new-app',communityReviewCount:0},{loading:false});
 const reviewed=globalThis.CWProjectView.conversation({slug:'reviewed-app',communityReviewCount:1},{loading:false});
 assert.match(first,/data-feedback-nudge/);
 assert.doesNotMatch(reviewed,/data-feedback-nudge|Be the first to review this app/);
 const migration=readFileSync(new URL('../database/032_first_community_review_count.sql',import.meta.url),'utf8');
 assert.match(migration,/u\.system_role<>'admin'/);
 assert.match(migration,/f\.attempt<>'not_tried'/);
 assert.match(migration,/f\.moderation_status<>'hidden'/);
});
