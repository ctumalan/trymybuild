import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import {contentSecurityPolicy} from '../src/server/content-security-policy.mjs';
import {selectedInterests,recommendationInterests} from '../src/server/interest-policy.mjs';
import {previewUrl} from '../src/server/preview-network.mjs';
import {validWish,normalizeWishCategory,wishCategories} from '../src/server/wish-policy.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('app.js');
function fn(name) {
 const start=source.indexOf('function '+name+'(');
 assert.ok(start>=0,name);
 const end=source.indexOf('\nfunction ',start+1);
 return source.slice(start,end);
}
function renderers() {
 const product={slug:'sample',name:'Sample',category:'Technology',stage:'Ready',color:'green',preview:'/preview.png',url:'https://example.com',summary:'Useful app',outcome:'Helps people',price:'Free'};
 const creator={slug:'maker',name:'Maker',label:'Builder',initials:'M',color:'green'};
 const context=vm.createContext({URL,location:{origin:'https://trymybuild.com'},window:{CW_SERVER:true},openedCatalogApps:new Set(),projectCommentDraft:()=>'',projectDestination:()=> 'Opens example.com',projects:[product],state:{selected:product,saved:new Set(),communityPosts:[],session:null},creatorFor:()=>creator,creatorVerificationBadge:()=>'',categoryIcon:()=>'',experienceCount:()=>0,projectCommentComposer:()=>''});
 vm.runInContext(source.split('\n').find(line=>line.startsWith('const esc =')),context);
 for(const name of ['safeProjectUrl','avatar','creatorLink','productCard','catalogRow','experienceCard','feedbackPage'])vm.runInContext(fn(name),context);
 return {context,product,creator};
}
test('catalog, account cards, feedback and creator identity escape stored markup',()=>{
 const {context,product,creator}=renderers();
 const hostile='"><svg onload=alert(1)> & "quoted"';
 for(const key of ['slug','name','category','stage','color','preview','summary','outcome','price'])product[key]=hostile;
 for(const key of ['slug','name','label','color','avatar','initials'])creator[key]=hostile;
 for(const html of [context.productCard(product),context.catalogRow(product),context.creatorLink(product),context.experienceCard({projectSlug:product.slug,response:hostile},true),context.feedbackPage()]){
  assert.ok(!html.includes(hostile));
  assert.doesNotMatch(html,/<svg\s+onload/);
  assert.ok(html.includes('&lt;svg'));
  assert.ok(html.includes('&quot;'));
 }
});
test('navigation rejects executable protocols and credentials but keeps valid URLs',()=>{
 const {context}=renderers();
 for(const url of ['javascript:alert(1)','data:text/html,<script>alert(1)</script>','https://user:pass@example.com','\njavascript:alert(1)'])assert.equal(context.safeProjectUrl(url),'#');
 assert.equal(context.safeProjectUrl('/projects/demo'),'https://trymybuild.com/projects/demo');
 assert.equal(context.safeProjectUrl('https://example.com/?q="hello"'),'https://example.com/?q=%22hello%22');
 assert.ok(source.includes('href="${esc(safeProjectUrl(product.url))}"'));
 context.location.origin='http://127.0.0.1:4324';
 assert.equal(context.safeProjectUrl('projects/example/index.html'),'http://127.0.0.1:4324/projects/example/index.html');
 assert.equal(context.safeProjectUrl(''),'#');
});
test('discussion request state initializes before server startup calls it',()=>{
 assert.ok(source.indexOf('let discussionRequest=0;')<source.indexOf('void loadDailyComments();'));
});
function route(path,stubs) {
 const code=stripTypeScriptTypes(read(path).replace(/^import .*;\n/gm,'').replaceAll('export ',''));
 const context=vm.createContext({URL,Response,JSON,...stubs});
 vm.runInContext(code+'\nglobalThis.handlers={'+(code.includes('const GET')?'GET,':'')+(code.includes('const POST')?'POST':'')+'};',context);
 return context.handlers;
}
const json=(body,status=200)=>new Response(JSON.stringify(body),{status});
const request=body=>({request:new Request('https://trymybuild.com/api/test',{method:'POST',headers:{origin:'https://trymybuild.com'},body:JSON.stringify(body)})});
test('automatic capture rejects guests, unverified accounts and exhausted or unavailable shared limits',async()=>{
 for(const mode of ['guest','unverified','limited','unavailable','allowed']){
  let captured=0;const limits=[];
  const api=route('src/pages/api/listing-preview.ts',{json,origin:()=>'',sameOrigin:()=>true,previewUrl,currentUser:async()=>mode==='guest'?null:{id:'account',emailVerified:mode!=='unverified'},allowRequest:async(...args)=>{limits.push(args);if(mode==='unavailable')throw Error();return mode!=='limited';},capturePreview:async()=>{captured++;return {image:'test'};}});
  const response=await api.POST(request({url:'https://example.com'}));
  assert.equal(captured,mode==='allowed'?1:0);
  if(mode==='guest')assert.equal(response.status,401);
  if(mode==='unverified')assert.equal(response.status,403);
  if(mode==='limited')assert.equal(response.status,429);
  if(mode==='allowed'){assert.equal(response.status,200);assert.deepEqual(limits.map(x=>x.slice(1)),[['listing-preview',3,60],['listing-preview-day',20,86400]]);}
 }
});
test('wish feed filters published only and submissions use the atomic capped procedure',async()=>{
 const filters=[];let rpcCall;
 const query={select(){return this;},eq(...args){filters.push(args);return this;},order(){return this;},limit:async()=>({data:[],error:null})};
 const db={from:()=>query,rpc:async(...args)=>{rpcCall=args;return {data:args[0]==='cw_wish_categories'?[]:{outcome:'submitted',status:'pending'},error:null};}};
 const api=route('src/pages/api/wishes.ts',{json,origin:()=>'',sameOrigin:()=>true,database:()=>db,databaseReady:()=>true,memberContext:async()=>({user:{id:'auth',emailVerified:true},member:{id:'member'},db}),allowRequest:async()=>true,validWish,normalizeWishCategory,wishCategories});
 assert.equal((await api.GET({url:new URL('https://trymybuild.test/api/wishes')})).status,200);
 assert.deepEqual(filters,[['moderation_status','published']]);
 const result=await api.POST(request({category:'Technology',description:'Help me organize useful bookmarks'}));
 assert.equal(result.status,200);assert.equal((await result.json()).status,'pending');
 assert.equal(rpcCall[0],'cw_submit_wish');assert.equal(rpcCall[1].p_user,'member');
});
test('selected interests validate, deduplicate, and survive personalization being disabled',()=>{
 assert.deepEqual(selectedInterests(['Travel','Travel']),['Travel']);
 assert.equal(selectedInterests(['<script>']),null);
 assert.equal(selectedInterests('Travel'),null);
 assert.deepEqual(selectedInterests([]),[]);
 assert.deepEqual(recommendationInterests({selected_interests:['Travel'],interests:['Technology'],personalization:false}),['Travel']);
 assert.deepEqual(recommendationInterests({selected_interests:['Travel'],interests:['Technology','Travel']}),['Travel','Technology']);
 const api=read('src/pages/api/dashboard.ts');
 assert.ok(api.includes("fields.getAll('interest')"));
 assert.ok(api.includes('selected_interests:interests'));
 assert.ok(!api.slice(api.indexOf("f.action==='preferences-reset'")).includes('selected_interests:'));
 assert.ok(read('src/pages/api/onboarding.ts').includes('selected_interests:interests'));
});
test('prepared migration moderates wishes, serializes caps and protects moderator decisions',()=>{
 const sql=read('database/019_launch_safety.sql');
 assert.match(sql,/default 'pending'/);
 assert.match(sql,/account_status='active' for update/);
 assert.match(sql,/>=10/);
 assert.match(sql,/item.revision<>p_revision/);
 assert.match(sql,/insert into operations_log/);
 assert.match(sql,/revoke all on function public.cw_review_wish.*from public,anon,authenticated/);
 assert.match(sql,/selected_interests=interests/);
});
test('script policy blocks inline handlers, eval and plugins; site fonts are local',()=>{
 const script=contentSecurityPolicy.split('; ').find(x=>x.startsWith('script-src '));
 assert.ok(!script.includes('unsafe-inline'));assert.ok(!script.includes('unsafe-eval'));
 assert.match(contentSecurityPolicy,/script-src-attr 'none'/);assert.match(contentSecurityPolicy,/object-src 'none'/);assert.match(contentSecurityPolicy,/form-action 'self'/);
 assert.doesNotMatch(read('src/pages/index.ts'),/<script>/);assert.doesNotMatch(read('src/pages/dashboard/profile.ts'),/<script>/);
 assert.match(read('scripts/prepare-site.mjs'),/profile-editor.js/);
 assert.doesNotMatch(read('index.html'),/fonts.google/);
 assert.doesNotMatch(read('assets/fonts/fonts.css'),/https?:/);
 for(const file of readdirSync(new URL('../assets/fonts/',import.meta.url)).filter(f=>f.endsWith('.woff2')))assert.equal(readFileSync(new URL('../assets/fonts/'+file,import.meta.url)).subarray(0,4).toString(),'wOF2');
});
