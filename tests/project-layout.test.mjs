import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../launch-refinements.css',import.meta.url),'utf8');
const shared=readFileSync(new URL('../project-view.js',import.meta.url),'utf8');
const drawer=shared+app.slice(app.indexOf('function projectDetailContent(product'),app.indexOf("document.addEventListener('input'",app.indexOf('function detailDrawer(product)')));
test('detail view uses the invitation screenshot layout and relevant information',()=>{
 assert.match(drawer,/class="recipient-art"/);
 assert.doesNotMatch(drawer,/--project-wallpaper|Good to know/);
 assert.doesNotMatch(drawer,/What saving does|About opening this app/);
 assert.match(drawer,/Try this app ↗/);
 assert.match(drawer,/Start the conversation/);
 assert.match(drawer,/videoPlayer\(product.video\)/);
 assert.match(css,/\.mealmap-detail \.project-screenshot\{[^}]*object-fit:contain/);
 assert.match(css,/\.listing-preview-card \.listing-preview-hero>img\{[^}]*object-fit:contain/);
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
