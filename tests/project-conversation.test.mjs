import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../project-view.js',import.meta.url),'utf8');
const setup=extra=>vm.createContext({document:{readyState:'loading',addEventListener(){}},Date,window:{addEventListener(){}},...extra});
test('conversation renders escaped public comments with dates and only trusted creator labels',()=>{
 const c=setup();vm.runInContext(source,c);
 const html=c.CWProjectView.conversationFeed([{author:'<img onerror=bad>',response:'<script>bad</script>',createdAt:'2026-09-28T10:00:00Z',isCreator:true},{author:'Creator',response:'Hello',createdAt:'bad'}]);
 assert.doesNotMatch(html,/<script>|<img onerror/);assert.match(html,/datetime="2026-09-28/);
 assert.equal((html.match(/class="conversation-creator"/g)||[]).length,1);
 assert.doesNotMatch(html,/Invalid Date/);
});
test('long conversations show three recent comments and expand the rest',()=>{
 const c=setup();vm.runInContext(source,c);
 const posts=Array.from({length:5},(_,i)=>({author:'User '+i,response:'Comment '+i,createdAt:`2026-09-2${i}T00:00:00Z`}));
 const html=c.CWProjectView.conversationFeed(posts);
 assert.equal((html.split('<details')[0].match(/class="conversation-post"/g)||[]).length,3);
 assert.match(html,/View all 5 comments/);assert.ok(html.indexOf('Comment 4')<html.indexOf('Comment 3'));
 assert.equal(c.CWProjectView.conversationFeed([]),'');
});
test('conversation and feedback share one visible flow without tab controls',()=>{
 const c=setup();vm.runInContext(source,c);const html=c.CWProjectView.conversation({slug:'example'});
 assert.doesNotMatch(html,/role="tab"|role="tabpanel"|data-conversation-panel/);
 assert.match(html,/aria-label="Conversation and feedback"/);assert.match(html,/data-inline-feedback/);
 assert.match(html,/data-public-comment="example"/);
 assert.ok(html.indexOf('data-conversation-feed')<html.indexOf('data-public-comment'));
});
test('a response for a closed app does not overwrite the next app or its draft',async()=>{
 let resolve;const feed={innerHTML:''},count={textContent:''};
 const region={dataset:{conversation:'one'},isConnected:true,querySelector:s=>s==='[data-conversation-feed]'?feed:count};
 const c=setup({window:{addEventListener(){}},document:{readyState:'loading',addEventListener(){},querySelector:()=>region},fetch:()=>new Promise(r=>resolve=r)});vm.runInContext(source,c);
 const loading=c.CWProjectView.loadProjectConversation(region);region.isConnected=false;
 resolve({ok:true,json:async()=>({connected:true,posts:[{projectSlug:'one',response:'Old response'}]})});await loading;
 assert.doesNotMatch(feed.innerHTML,/Old response/);
});
test('failed loading offers retry and successful loading filters to the current app',async()=>{
 const feed={innerHTML:''},count={textContent:''};const region={dataset:{conversation:'one'},isConnected:true,querySelector:s=>s==='[data-conversation-feed]'?feed:count};
 const c=setup({window:{addEventListener(){}},document:{readyState:'loading',addEventListener(){},querySelector:()=>region},fetch:async()=>({ok:false,json:async()=>({})})});vm.runInContext(source,c);
 await c.CWProjectView.loadProjectConversation(region);assert.match(feed.innerHTML,/data-conversation-retry/);
 c.fetch=async()=>({ok:true,json:async()=>({posts:[{projectSlug:'one',response:'Visible',author:'Guest'},{projectSlug:'two',response:'Other app'}]})});
 await c.CWProjectView.loadProjectConversation(region);assert.equal(count.textContent,1);assert.match(feed.innerHTML,/Visible/);assert.doesNotMatch(feed.innerHTML,/Other app/);
});

test('structured feedback mounts when expanded, without a tab or eager form load',()=>{
 const events={},mounts=[],inline={},feed={},count={};
 const expander={open:false,matches:s=>s==='[data-feedback-expand]',querySelector:()=>inline};
 const region={dataset:{conversation:'example'},isConnected:true,querySelector:s=>s==='[data-inline-feedback]'?inline:s==='[data-feedback-expand]'?expander:s==='[data-conversation-feed]'?feed:count};
 const c=setup({document:{readyState:'loading',addEventListener:(t,f)=>events[t]=f,querySelectorAll:()=>[region]},window:{addEventListener(){},CWGuidedFeedback:{mountInline:r=>mounts.push(r)}},fetch:async()=>({ok:false,json:async()=>({})})});
 vm.runInContext(source,c);events.DOMContentLoaded();events.DOMContentLoaded();assert.equal(mounts.length,0);
 expander.open=true;events.toggle({target:expander});assert.equal(mounts[0],inline);
});
test('a catalog drawer inserted after hydration can expand structured feedback',()=>{
 const events={},mounts=[],inline={};
 const c=setup({document:{readyState:'loading',addEventListener:(t,f)=>events[t]=f},window:{addEventListener(){},CWGuidedFeedback:{mountInline:r=>mounts.push(r)}}});
 vm.runInContext(source,c);
 const expander={open:false,matches:s=>s==='[data-feedback-expand]',querySelector:()=>inline};
 events.toggle({target:expander});assert.equal(mounts.length,0);
 expander.open=true;events.toggle({target:expander});assert.equal(mounts[0],inline);
});
test('public reviews and comments share chronological order with a feedback label',()=>{
 const c=setup();vm.runInContext(source,c);
 const html=c.CWProjectView.discussionFeed([{author:'Commenter',response:'Older comment',createdAt:'2026-10-08'}],[{author:'Tester',message:'Newer review',createdAt:'2026-10-09',attempt:'stuck',focus:'ease'}]);
 assert.ok(html.indexOf('Newer review')<html.indexOf('Older comment'));
 assert.match(html,/App feedback/);assert.match(html,/Tried it and got stuck/);
});
test('review updates keep the feed and show a short private review note without duplicate proof',()=>{
 const c=setup();vm.runInContext(source,c);const feed={},count={setAttribute(){}},label={},evidence={};
 const region={dataset:{},conversationPosts:[{response:'Existing comment'}],querySelector:s=>({'[data-conversation-feed]':feed,'[data-feedback-count]':count,'[data-review-count-label]':label,'[data-review-evidence]':evidence}[s]||null)};
 c.CWProjectView.applyReviewEvidence(region,{total:2,publicCount:1,reviews:[{message:'Public feedback'}]});
 assert.match(feed.innerHTML,/Existing comment/);assert.match(feed.innerHTML,/Public feedback/);
 assert.match(evidence.innerHTML,/1 review shared privately/);assert.doesNotMatch(evidence.innerHTML,/review-evidence-summary|review-proof/);
 assert.equal(count.textContent,2);
});
