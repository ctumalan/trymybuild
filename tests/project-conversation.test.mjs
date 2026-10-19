import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {moduleFixture} from '../scripts/workspace-fixtures.mjs';
const source=readFileSync(new URL('../project-view.js',import.meta.url),'utf8');
const setup=extra=>vm.createContext({document:{readyState:'loading',addEventListener(){}},Date,window:{addEventListener(){}},...extra});
test('conversation renders escaped public comments with dates and only trusted creator labels',()=>{
 const c=setup();vm.runInContext(source,c);
 const html=c.CWProjectView.conversationFeed([{author:'<img onerror=bad>',response:'<script>bad</script>',createdAt:'2026-09-28T10:00:00Z',isCreator:true},{author:'Creator',response:'Hello',createdAt:'bad'}]);
 assert.doesNotMatch(html,/<script>|<img onerror/);assert.match(html,/datetime="2026-09-28/);
 assert.equal((html.match(/class="conversation-creator"/g)||[]).length,1);
 assert.doesNotMatch(html,/Invalid Date/);
});
test('only the signed-in author receives an edit control',()=>{
 const c=setup();vm.runInContext(source,c);
 const own=c.CWProjectView.conversationFeed([{id:'11111111-1111-4111-8111-111111111111',author:'Christian',response:'My comment',createdAt:'2026-10-19',canEdit:true}]);
 const other=c.CWProjectView.conversationFeed([{id:'22222222-2222-4222-8222-222222222222',author:'Someone else',response:'Their comment',createdAt:'2026-10-19',canEdit:false}]);
 assert.match(own,/data-edit-comment="11111111-1111-4111-8111-111111111111">Edit<\/button>/);
 assert.doesNotMatch(other,/data-edit-comment|>Edit<\/button>/);
});
test('comment API identifies the viewer’s own public comment',async()=>{
 const owner='11111111-1111-4111-8111-111111111111',comment='22222222-2222-4222-8222-222222222222';
 const query=data=>{const q={select(){return q;},eq(){return q;},in(){return q;},order(){return q;},limit(){return q;},maybeSingle:async()=>({data:Array.isArray(data)?data[0]||null:data,error:null}),then(resolve){return Promise.resolve({data:Array.isArray(data)?data:[data],error:null}).then(resolve);}};return q;};
 const db={from(table){if(table==='users')return query({id:owner});if(table==='profiles')return query([{user_id:owner,display_name:'Christian',identity_label:'Creator',avatar_path:''}]);return query([{id:comment,project_slug:'sample',response:'My comment',created_at:'2026-10-19T17:00:00Z',author_user_id:owner,projects:{listing_status:'published',owner_user_id:owner}}]);}};
 const scope={Response,databaseReady:()=>true,database:()=>db,currentUser:async()=>({id:'workos-user'}),json:(body,status=200)=>Response.json(body,{status})};
 const GET=moduleFixture('src/pages/api/experiences.ts',['GET'],scope).GET;
 const data=await(await GET({url:new URL('https://trymybuild.com/api/experiences?project=sample')})).json();
 assert.equal(data.posts[0].canEdit,true);
});
test('comment edits require the matching signed-in author',async()=>{
 const owner='11111111-1111-4111-8111-111111111111',comment='22222222-2222-4222-8222-222222222222';let memberId=owner,saved='';
 const db={from(table){if(table==='projects'){const q={select(){return q;},eq(){return q;},maybeSingle:async()=>({data:{slug:'sample'},error:null})};return q;}const filters={};let change={};const q={update(value){change=value;return q;},eq(key,value){filters[key]=value;return q;},neq(){return q;},select(){return q;},maybeSingle:async()=>{const allowed=filters.id===comment&&filters.project_slug==='sample'&&filters.author_user_id===owner;if(allowed)saved=change.response;return {data:allowed?{id:comment}:null,error:null};}};return q;}};
 const scope={Response,sameOrigin:()=>true,origin:()=> 'https://trymybuild.com',currentUser:async()=>({id:'workos-user'}),databaseReady:()=>true,thoughtfulComment:()=>true,validId:value=>value===comment,allowRequest:async()=>true,ensureMember:async()=>({id:memberId}),database:()=>db,json:(body,status=200)=>Response.json(body,{status})};
 const POST=moduleFixture('src/pages/api/experiences.ts',['POST'],scope).POST;
 const context=()=>({request:{text:async()=>JSON.stringify({slug:'sample',response:'Updated comment',editId:comment})}});
 const updated=await POST(context());assert.equal(updated.status,200);assert.equal(saved,'Updated comment');assert.equal((await updated.json()).message,'Your comment was updated.');
 memberId='33333333-3333-4333-8333-333333333333';const forbidden=await POST(context());assert.equal(forbidden.status,403);assert.match((await forbidden.json()).error,/only edit your own/);
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
