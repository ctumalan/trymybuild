import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('informational routes render their own content without a submission hero',()=>{
 const scope=vm.createContext({document:{addEventListener(){}},state:{session:null},discoveryHero:()=>{throw Error('Submission hero on information page');}});
 vm.runInContext(read('community-entry.js'),scope);
 assert.match(scope.aboutPage(),/Useful ideas deserve a place to grow/);
 assert.match(scope.contactPage(),/Have a question/);
});
test('article includes the shared navigation and account menu',()=>{
 const article=read('src/pages/article.astro'),layout=read('src/layouts/EditorialLayout.astro');
 assert.match(article,/import EditorialLayout/);assert.match(article,/<EditorialLayout/);
 assert.match(layout,/class="cw-bar"/);assert.match(layout,/aria-label="Website navigation"/);
 assert.match(layout,/href="\/\?listing=settings"/);assert.match(layout,/data-account-nav/);
 assert.match(layout,/src="\/account-nav.js"/);assert.doesNotMatch(layout,/class="masthead"/);
});
