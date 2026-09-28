import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const source=app.slice(app.indexOf('function conversationPost('),app.indexOf('function detailDrawer('));
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const setup=extra=>vm.createContext({document:{addEventListener(){}},Date,esc,avatar:()=>'<span class="avatar"></span>',window:{},state:{communityPosts:[]},projectCommentComposer:()=>'<form>composer</form>',...extra});
test('conversation renders escaped public comments with dates and only trusted creator labels',()=>{
 const c=setup();vm.runInContext(source,c);
 const html=c.conversationFeed([{author:'<img onerror=bad>',response:'<script>bad</script>',createdAt:'2026-09-28T10:00:00Z',isCreator:true},{author:'Creator',response:'Hello',createdAt:'bad'}]);
 assert.doesNotMatch(html,/<script>|<img onerror/);assert.match(html,/datetime="2026-09-28/);
 assert.equal((html.match(/class="conversation-creator"/g)||[]).length,1);
 assert.doesNotMatch(html,/Invalid Date/);
});
test('long conversations show three recent comments and expand the rest',()=>{
 const c=setup();vm.runInContext(source,c);
 const posts=Array.from({length:5},(_,i)=>({author:'User '+i,response:'Comment '+i,createdAt:`2026-09-2${i}T00:00:00Z`}));
 const html=c.conversationFeed(posts);
 assert.equal((html.split('<details')[0].match(/class="conversation-post"/g)||[]).length,3);
 assert.match(html,/View all 5 comments/);assert.ok(html.indexOf('Comment 4')<html.indexOf('Comment 3'));
 assert.match(c.conversationFeed([]),/What would you like to ask/);
});
test('each app gets accessible conversation and feedback panels with badge guidance',()=>{
 const c=setup();vm.runInContext(source,c);const html=c.projectConversation({slug:'example'});
 assert.equal((html.match(/role="tab"/g)||[]).length,2);assert.match(html,/data-conversation-tab="feedback">Your feedback/);
 assert.match(html,/data-conversation-panel="feedback" hidden/);assert.match(html,/data-inline-feedback/);
 assert.doesNotMatch(html,/conversation-header|conversation-feedback/);
 assert.match(html,/five approved qualifying reviews/);assert.match(html,/Ordinary comments do not count/);
 assert.doesNotMatch(html,/Had a chance|No public comments yet|Give feedback/);
});
test('a response for a closed app does not overwrite the next app or its draft',async()=>{
 let resolve;const feed={innerHTML:''},count={textContent:''};
 const region={dataset:{conversation:'one'},isConnected:true,querySelector:s=>s==='[data-conversation-feed]'?feed:count};
 const c=setup({window:{CW_SERVER:true},document:{addEventListener(){},querySelector:()=>region},fetch:()=>new Promise(r=>resolve=r)});vm.runInContext(source,c);
 const loading=c.loadProjectConversation();region.isConnected=false;
 resolve({ok:true,json:async()=>({connected:true,posts:[{projectSlug:'one',response:'Old response'}]})});await loading;
 assert.doesNotMatch(feed.innerHTML,/Old response/);assert.equal(c.state.communityPosts.length,0);
});
test('failed loading offers retry and successful loading filters to the current app',async()=>{
 const feed={innerHTML:''},count={textContent:''};const region={dataset:{conversation:'one'},isConnected:true,querySelector:s=>s==='[data-conversation-feed]'?feed:count};
 const c=setup({window:{CW_SERVER:true},document:{addEventListener(){},querySelector:()=>region},fetch:async()=>({ok:false,json:async()=>({})})});vm.runInContext(source,c);
 await c.loadProjectConversation();assert.match(feed.innerHTML,/data-conversation-retry/);
 c.fetch=async()=>({ok:true,json:async()=>({posts:[{projectSlug:'one',response:'Visible',author:'Guest'},{projectSlug:'two',response:'Other app'}]})});
 await c.loadProjectConversation();assert.equal(count.textContent,1);assert.match(feed.innerHTML,/Visible/);assert.doesNotMatch(feed.innerHTML,/Other app/);
});

test('tab changes preserve both panel instances and support keyboard navigation',()=>{
 const events={},mounts=[];const panelA={dataset:{conversationPanel:'comments'},hidden:false,draft:'Comment draft'},panelB={dataset:{conversationPanel:'feedback'},hidden:true,draft:'Feedback draft'};
 let tabs;const region={querySelectorAll:s=>s==='[data-conversation-tab]'?tabs:[panelA,panelB],querySelector:()=>panelB};
 const tab=kind=>({dataset:{conversationTab:kind},attributes:{},setAttribute(k,v){this.attributes[k]=v;},closest:s=>s==='[data-conversation]'?region:{querySelectorAll:()=>tabs},focus(){this.focused=true;}});
 tabs=[tab('comments'),tab('feedback')];
 const c=setup({document:{addEventListener:(t,f)=>events[t]=f},window:{CWGuidedFeedback:{mountInline:p=>mounts.push(p)}}});vm.runInContext(source,c);
 c.selectConversationTab(tabs[1]);assert.equal(panelA.hidden,true);assert.equal(panelB.hidden,false);assert.equal(tabs[1].attributes['aria-selected'],'true');assert.equal(mounts[0],panelB);
 events.keydown({target:{closest:()=>tabs[1]},key:'Home',preventDefault(){}});
 assert.equal(panelA.hidden,false);assert.equal(panelB.hidden,true);assert.equal(tabs[0].focused,true);assert.equal(panelA.draft,'Comment draft');assert.equal(panelB.draft,'Feedback draft');
});
