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
 assert.doesNotMatch(drawer,/--project-wallpaper|Good to know/);
 assert.doesNotMatch(drawer,/What saving does|About opening this app/);
 assert.match(drawer,/Try this app ↗/);
 assert.match(drawer,/Ask the maker a question or share a thought/);
 assert.match(shared,/\$\{video\(product.video\)\}<\/div><\/section>/);
 assert.doesNotMatch(drawer+serverDetail,/Connects to the video provider|project-video-note/);
 assert.match(css,/\.mealmap-detail \.project-screenshot\{[^}]*object-fit:contain/);
 assert.match(css,/\.listing-preview-card \.listing-preview-hero>img\{[^}]*object-fit:contain/);
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
