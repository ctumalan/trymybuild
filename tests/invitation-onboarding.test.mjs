import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {moduleFixture,mockDatabase,workspaceFixtures} from '../scripts/workspace-fixtures.mjs';
import {setupLanguage,invitationSetupPath,publishSetupPath} from '../src/server/setup-language.mjs';
import {invitationOpen,invitationToken,invitationId,claimInvitation} from '../src/server/listing-invitation.mjs';
import {feedbackDestination,validSlug} from '../src/server/feedback-policy.mjs';
import {submit} from '../src/server/listing-service.mjs';
import {publishReadiness} from '../src/server/listing-policy.mjs';
import {accountSetupEmail,welcomeEmail,sendAccountSetupWelcome} from '../src/server/welcome-email.mjs';
const id='77777777-7777-4777-8777-777777777777',owner='88888888-8888-4888-8888-888888888888',email='maker@example.invalid',secret='synthetic-fixture-private-key-at-least-32-characters',token=invitationToken(id,secret);
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const invite={id,title:'Sample PDF',recipient_email:email,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+86400000).toISOString(),claimed_by:null,revoked_at:null};
const readyProject=()=>({id,slug:'sample-pdf',owner_user_id:owner,title:'Sample PDF',external_url:'https://example.invalid',category:'Productivity',headline:'Combine PDF files',help_text:'Keep documents together',first_try:'Combine two sample files',preview_path:'previews/sample.jpg',preview_public_url:'/api/project-image/sample-pdf',listing_status:'draft',visibility:'draft',sharing_preference:'private',lock_version:3});

test('setup language follows explicit selection and preserves only allowlisted invitation and publication destinations',()=>{
 assert.equal(setupLanguage(new URL('https://local.invalid/?lang=es'),new Request('https://local.invalid',{headers:{'accept-language':'en'}})),'es');
 assert.equal(setupLanguage(new URL('https://local.invalid/'),new Request('https://local.invalid',{headers:{'accept-language':'fr,es-MX;q=0.9,en;q=0.5'}})),'es');
 for(const path of [invitationSetupPath(token,'es',true),invitationSetupPath(token,'en',true)+'&share=copy',publishSetupPath('sample-pdf','es')])assert.equal(feedbackDestination(path),path);
 for(const suffix of ['&lang=en','&next=https://evil.invalid','&step=publish','&share=unknown','#claim'])assert.equal(feedbackDestination(invitationSetupPath(token,'es',true)+suffix),'/?account=1');
 for(const path of ['/dashboard/publish?project=../admin','/dashboard/publish?project=sample&lang=es&owner=other','/listing-invitation/'+token+'?lang=es&lang=es','//evil.invalid/'])assert.equal(feedbackDestination(path),'/?account=1');
});

test('pending invitation recovery belongs only to the verified recipient and excludes expired, revoked and claimed invitations',async()=>{
 const db=mockDatabase({listing_invitations:[invite,{...invite,id:'other',recipient_email:'other@example.invalid'},{...invite,id:'claimed',claimed_by:owner},{...invite,id:'revoked',revoked_at:new Date().toISOString()},{...invite,id:'expired',expires_at:'2000-01-01'},{...invite,id:'legacy',created_at:new Date(Date.now()-12*86400000).toISOString()}]});
 const scope={invitationOpen,signedInvitation:()=>token,invitationSetupPath,setupLanguage,e,console};
 const helpers=moduleFixture('src/server/pending-invitations.ts',['pendingInvitations','pendingInvitationNotice'],scope);
 assert.deepEqual((await helpers.pendingInvitations(db,{email,emailVerified:true})).map(r=>r.id),[id]);
 assert.equal((await helpers.pendingInvitations(db,{email,emailVerified:false})).length,0);
 const html=await helpers.pendingInvitationNotice({url:new URL('https://local.invalid/?lang=es')},{db,user:{email,emailVerified:true}});
 assert.match(html,/Tu cuenta está lista/);assert.match(html,/step=save/);assert.doesNotMatch(html,/other@example/);
});

test('both dashboard entry points recover a matching invitation rather than leaving an empty account',async()=>{
 const f=workspaceFixtures();f.tables.projects=[];f.tables.listing_invitations=[{...invite,recipient_email:'sample@example.invalid'}];
 for(const [path,params] of [['/dashboard?view=creator',{}],['/dashboard/overview',{section:'overview'}]]){
  const route=path.startsWith('/dashboard?')?f.routes['/dashboard']:f.routes['/dashboard/overview'];
  const response=await route({url:new URL(path,'https://local.invalid'),params});
  assert.equal(response.status,200);assert.match(await response.text(),/Continue with Sample PDF/);
 }
});

test('signup return opens the recipient save form without accepting terms or writing an app',()=>{
 const opened=[],handlers={},source=readFileSync(new URL('../listing-invitations.js',import.meta.url),'utf8');
 const context={URLSearchParams,location:new URL('https://local.invalid/'+token+'?lang=es&step=save'),history:{},Set,document:{readyState:'complete',querySelector:s=>s==='#invitation-app-panel'?{innerHTML:'Preview',dataset:{resumeClaim:'true'}}:s==='#invitation-claim-panel'?{innerHTML:'Confirm app ownership and terms'}:null,addEventListener:(type,fn)=>{handlers[type]=fn;}},window:{CWPanels:{show:html=>opened.push(html)},dispatchEvent(){},addEventListener(){}},Event};
 vm.runInNewContext(source,context);assert.deepEqual(opened,['Confirm app ownership and terms']);
});

function publishFixture({verified=true,authenticated=true,foreign=false,allowed=true}={}){
 const project=readyProject(),writes=[];
 const store={findOwnedBySlug:async user=>!foreign&&user===owner?{...project}:null,findOwnedById:async(user,pid)=>user===owner&&pid===id?{...project}:null,updateOwnedGuarded:async(pid,user,expected,patch)=>{
  if(pid!==id||user!==owner||expected.lockVersion!==project.lock_version||expected.status!==project.listing_status)return null;
  writes.push(patch);Object.assign(project,patch,{lock_version:project.lock_version+1});return {...project};
 }};
 const scope={Response,URL,validSlug,setupLanguage,publishSetupPath,e,publishReadiness,submit,projectStore:()=>store,publicationAccess:async()=>({allowed}),allowRequest:async()=>true,origin:()=> 'https://local.invalid',sameOrigin:(req,base)=>req.headers.get('origin')===base,memberContext:async()=>authenticated?{user:{id:'workos',emailVerified:verified},member:{id:owner},db:{},admin:false}:null,signIn:path=>new Response(null,{status:302,headers:{location:'/auth/sign-in?next='+encodeURIComponent(path)}}),unavailable:()=>new Response('Unavailable',{status:503}),workspace:(_title,body)=>new Response(body)};
 const routes=moduleFixture('src/pages/dashboard/publish.ts',['GET','POST'],scope);
 const ctx=(body,origin='https://local.invalid')=>({url:new URL('https://local.invalid'+publishSetupPath(project.slug,'es')),request:new Request('https://local.invalid/dashboard/publish',{method:body?'POST':'GET',headers:{origin},...(body?{body:new URLSearchParams(body)}:{})}),redirect:(href,status)=>new Response(null,{status,headers:{location:href}})});
 return {project,writes,routes,ctx};
}
test('publication guide reads only the owner draft and requires deliberate confirmation for its reviewed version',async()=>{
 const f=publishFixture();
 const html=await(await f.routes.GET(f.ctx())).text();assert.match(html,/borrador privado/);assert.match(html,/Publicar mi app/);assert.doesNotMatch(html,/type="checkbox"[^>]*checked/);assert.equal(f.writes.length,0);
 for(const body of [{version:'3'},{version:'2',confirmPublic:'yes'},{version:'garbage',confirmPublic:'yes'}])assert.match((await f.routes.POST(f.ctx(body))).headers.get('location'),/error=publish/);
 assert.equal(f.project.sharing_preference,'private');assert.equal(f.writes.length,0);
 assert.equal((await f.routes.POST(f.ctx({version:'3',confirmPublic:'yes'}))).status,303);
 assert.equal(f.project.listing_status,'published');assert.equal(f.project.visibility,'public');assert.equal(f.project.sharing_preference,'public');assert.equal(f.writes.length,1);
 assert.match(await(await f.routes.GET(f.ctx())).text(),/Tu app ya es pública/);
});
test('publication rejects cross-origin, unverified, foreign, over-limit and incomplete attempts',async()=>{
 for(const options of [{verified:false},{authenticated:false},{foreign:true},{allowed:false}]){
  const f=publishFixture(options);await f.routes.POST(f.ctx({version:'3',confirmPublic:'yes'}));assert.equal(f.writes.length,0);
 }
 const cross=publishFixture();assert.equal((await cross.routes.POST(cross.ctx({version:'3',confirmPublic:'yes'},'https://evil.invalid'))).status,403);assert.equal(cross.writes.length,0);
 const incomplete=publishFixture();incomplete.project.headline='';await incomplete.routes.POST(incomplete.ctx({version:'3',confirmPublic:'yes'}));assert.equal(incomplete.writes.length,0);assert.equal(incomplete.project.sharing_preference,'private');
});

test('claim finishes at the localized publishing guide and requests a welcome only after a confirmed claim',async()=>{
 const project=readyProject(),calls=[];
 const scope={Response,URL,json:(data,status=200)=>Response.json(data,{status}),origin:()=> 'https://local.invalid',sameOrigin:()=>true,memberContext:async()=>({user:{email,emailVerified:true},member:{id:owner},db:{}}),allowRequest:async()=>true,env:()=>secret,invitationId,claimInvitation,invitationStore:()=>({find:async()=>({...invite,lock_version:0}),claim:async()=>project}),sendFirstProjectWelcome:async data=>calls.push(data),publishSetupPath};
 const route=moduleFixture('src/pages/api/listing-invitation/[token]/claim.ts',['POST'],scope).POST;
 const data={title:'Sample PDF',url:'https://example.invalid/',does:'Combine PDF files',helps:'Keep files together',firstTry:'Combine two sample files',category:'Productivity',pricing:'free',version:0,language:'es',confirm:'yes',terms:'yes'};
 const run=body=>route({params:{token},request:new Request('https://local.invalid/api/claim',{method:'POST',body:JSON.stringify(body)})});
 assert.equal((await run({...data,terms:''})).status,400);assert.equal(calls.length,0);
 const response=await run(data);assert.equal(response.status,200);assert.equal((await response.json()).href,publishSetupPath(project.slug,'es'));assert.equal(calls[0].language,'es');assert.equal(project.listing_status,'draft');
});

test('account-only and saved-draft welcome emails explain their different states in English and Spanish',()=>{
 for(const language of ['en','es']){
  const account=accountSetupEmail({user:{firstName:'Eduardo'},invitation:{title:'PDF <Tool>',path:invitationSetupPath(token,language,true)},language});
  const saved=welcomeEmail({user:{firstName:'Eduardo'},profile:{},project:readyProject(),language});
  assert.match(account.actionUrl,/step=save/);assert.match(saved.actionUrl,/dashboard\/publish/);assert.match(saved.text,/optional|opcional/);assert.match(account.html,/PDF &lt;Tool&gt;/);assert.doesNotMatch(account.text,/safely in your dashboard/);
  if(language==='es'){assert.match(account.text,/Crear|registro|cuenta/);assert.match(saved.html,/Publicar mi app/);assert.match(saved.html,/lang="es"/);}
 }
});

test('account setup email is idempotent and does not send to old or unverified accounts',async()=>{
 const flags=new Map(),sent=[];
 const db={from:table=>({select:()=>({eq:()=>({single:async()=>({data:{created_at:new Date().toISOString()}})})}),insert:async row=>{if(flags.has(row.key))return {error:{code:'23505'}};flags.set(row.key,row);return {};},update:()=>({eq:async()=>({})}),delete:()=>({eq:async key=>{flags.delete(key);}})})};
 const deps={env:key=>key==='RESEND_API_KEY'?'fake':'',fetch:async(_url,options)=>{sent.push(JSON.parse(options.body));return Response.json({id:'email'});}};
 const args={db,user:{email,emailVerified:true},member:{id:owner},language:'es',findInvitation:async()=>({title:'Sample',path:invitationSetupPath(token,'es',true)})};
 assert.equal((await sendAccountSetupWelcome(args,deps)).sent,true);
 assert.equal((await sendAccountSetupWelcome(args,deps)).skipped,true);assert.equal(sent.length,1);
 assert.equal((await sendAccountSetupWelcome({...args,user:{email,emailVerified:false}},deps)).skipped,true);assert.equal(sent.length,1);
 const oldDb={from:()=>({select:()=>({eq:()=>({single:async()=>({data:{created_at:'2000-01-01'}})})})})};
 assert.equal((await sendAccountSetupWelcome({...args,db:oldDb},deps)).skipped,true);
});
