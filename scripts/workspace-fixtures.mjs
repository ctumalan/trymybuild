// Local test fixtures only. The production build does not copy this file.
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import * as policy from '../src/server/feedback-policy.mjs';
import {sessionLabel,signInDescription} from '../src/server/account-security.mjs';
export const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
export function moduleFixture(path,names,scope){
 const source=read(path).replace(/^import .*;\n/gm,'').replace(/^export \{.*\};\n/gm,'').replaceAll('export ','');
 return vm.runInNewContext(stripTypeScriptTypes('(function(){'+source+';return {'+names.join(',')+'};})()'),scope);
}
export function mockDatabase(tables,rpcs={}){
 const calls=[];
 return {calls,from(table){let rows=[...(tables[table]||[])],range=null,head=false;const q={select(fields,options={}){head=!!options.head;calls.push([table,'select',fields]);return q;},eq(k,v){calls.push([table,'eq',k,v]);rows=rows.filter(r=>r[k]===v);return q;},neq(k,v){rows=rows.filter(r=>r[k]!==v);return q;},is(k,v){rows=rows.filter(r=>r[k]===v);return q;},in(k,v){rows=rows.filter(r=>v.includes(r[k]));return q;},lte(k,v){rows=rows.filter(r=>r[k]<=v);return q;},order(){return q;},limit(n){range=[0,n];return q;},range(a,b){range=[a,b+1];return q;},maybeSingle:async()=>({data:rows[0]||null,error:null}),single:async()=>({data:rows[0]||null,error:null}),then(resolve){return Promise.resolve({data:head?null:range?rows.slice(...range):rows,count:rows.length,error:null}).then(resolve);}};return q;},async rpc(name,args){calls.push([name,args]);return {data:rpcs[name]?.(args)||[],error:null};}};
}
export function workspaceFixtures(){
 const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const owner='22222222-2222-4222-8222-222222222222',author='33333333-3333-4333-8333-333333333333',id='11111111-1111-4111-8111-111111111111',now='2026-09-12T16:00:00Z';
 const projects=['Grocery planner','Trip notebook','Shared family calendar','A project name long enough to test narrow cards','Weather notes','Reading list'].map((title,i)=>({id:randomUUID(),slug:'sample-'+i,title,owner_user_id:owner,category:'Family life',listing_status:['published','draft','in_review'][i%3],price_label:'Free + paid options',preview_public_url:i%2?'':'/assets/previews/stackscout.png',preview_path:'',is_studio:false,published_at:i%3===0?now:null,lock_version:0,updated_at:now,summary:'Organize everyday tasks and spend more time together.',headline:'Plan the week with your whole family',help_text:'Keep useful plans in one shared place',first_try:'Create a list and invite your family',saved_projects:[{count:3+i}],project_experiences:[{count:i}],creator_feedback:[{count:2}]}));
 projects.push({...projects[0],slug:'sample-guest',id:randomUUID(),title:'Daily sketchbook',owner_user_id:author});
 const feedback={id,project_slug:'sample-0',author_user_id:author,helpful:'somewhat',price:'free',attempt:'completed',focus:'ease',visibility:'private',moderation_status:'pending',message:'I tried adding a grocery list but could not find the save button.',created_at:now};
 const tables={projects,creator_feedback:[feedback],profiles:[{user_id:owner,slug:'sample-creator',display_name:'Sample Creator',is_public:true,identity_label:'Building useful everyday tools',bio:'Local visual test profile.',avatar_path:'/assets/avatars/sun.svg',website:''},{user_id:author,slug:'sample-reviewer',display_name:'Sample Reviewer',is_public:true}],saved_projects:[{user_id:owner,project_slug:'sample-guest',created_at:now}],notifications:[],support_cases:[],feedback_replies:[],feedback_qualifications:[{feedback_id:id,status:'qualified',reason:'Original firsthand review'}],feedback_ratings:[],project_experiences:Array.from({length:6},(_,i)=>({id:randomUUID(),project_slug:'sample-0',author_user_id:author,response:'The calendar was easy to understand, but finding my saved plans took a few tries.',moderation_status:'pending',created_at:now})),account_deletion_requests:[]};
 const db=mockDatabase(tables,{cw_badge_progress:()=>[{reviews:2,creators:1,has_published:true,ownership_confirmed:false,verified:false,case_id:null}],cw_project_unread:()=>projects.map(p=>({slug:p.slug,unread_count:2})),cw_combined_inbox:()=>[{id,project_slug:'sample-0',title:'Grocery planner',counterpart:'Sample Reviewer',last_message:feedback.message,last_at:now,unread:true,total_count:1}]});
 const user={id:'fixture-user',firstName:'Sample',email:'sample@example.invalid',emailVerified:true},member={id:owner};
 const scope={...policy,e,Response,URL,URLSearchParams,Date,randomUUID,console,sessionLabel,signInDescription,memberContext:async()=>({user,member,db,admin:true}),currentUser:async()=>user,ensureMember:async()=>member,database:()=>db,databaseReady:()=>true,env:()=>'',isFounder:()=>true,adminUser:async()=>user,creditSummary:async()=>({balance:12}),accountSession:async()=>({user,sessionId:'fixture-session',authenticationMethod:'GoogleOAuth'}),validProof:()=>false,workos:()=>({userManagement:{listSessions:async()=>({autoPagination:async()=>[1,2].map(i=>({id:i===1?'fixture-session':'other',userId:user.id,status:'active',authMethod:'GoogleOAuth',createdAt:now,userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36'}))})}})};
 Object.assign(scope,moduleFixture('src/server/feedback-ui.ts',['surface','adminSurface','signals','feedbackCard','pages','pageNumber','signIn','unavailable'],scope));
 Object.assign(scope,moduleFixture('src/server/project-requests.ts',['activeFeedbackRequest','requestState','feedbackRequestAction','trialBrief'],scope));
 Object.assign(scope,moduleFixture('src/server/direct-messages.ts',['directComposer','directThread','directConversation'],scope));
 Object.assign(scope,moduleFixture('src/server/dashboard-cards.ts',['OWNED_CARD_FIELDS','shortStatus','miniPreview','projectActions','ownedProjectCard','performancePanel','replyComposer','savedReviewComposer'],scope));
 Object.assign(scope,moduleFixture('src/server/verification.ts',['verificationProgress','verificationCard'],scope));
 Object.assign(scope,moduleFixture('src/server/quick-feedback-view.ts',['quickFeedbackPanel'],scope));
 Object.assign(scope,moduleFixture('src/server/workspace.ts',['workspace','notice','empty'],scope));
 Object.assign(scope,moduleFixture('src/server/conversation.ts',['conversation'],scope));
 Object.assign(scope,moduleFixture('src/server/credit-rules.ts',['creditRules','creditSummaryCopy'],scope));
 Object.assign(scope,moduleFixture('src/server/community-map.ts',['communityMap'],scope));
 Object.assign(scope,moduleFixture('src/server/credit-explainer.ts',['creditExplainer'],scope));
 Object.assign(scope,moduleFixture('src/server/public-comment-ui.ts',['publicCommentComposer','projectFeedbackActions'],scope));
 Object.assign(scope,moduleFixture('src/server/project-detail-ui.ts',['projectDetailContent'],scope));
 Object.assign(scope,moduleFixture('src/server/project-ui.ts',['projectCard','publicActions'],scope));
 scope.creditSummary=async()=>({balance:12,slots:3,used:2,eligible:7,towardNext:2,verification:{earned:18,hasPublished:true,verified:false,caseId:null,eligible:false},projects,requests:[],qualifications:[]});
 scope.feedbackQueue=async()=>[];
 tables.users=[{id:owner,account_status:'active'},{id:author,account_status:'active'}];
 scope.STUDIO={slug:'creatorworks-studio',name:'TryMyBuild Studio'};
 Object.assign(scope,moduleFixture('src/server/public-profile.ts',['publicProfile'],scope));
 scope.listPublished=async()=>projects.filter(p=>p.listing_status==='published').map(p=>({...p,name:p.title,preview:p.preview_public_url||'/assets/previews/stackscout.png',url:'https://example.invalid',stage:'New',price:'Free',saveCount:6,reviewCount:3,recentCommentCount:3,presentation:{headline:p.headline,help:p.help_text,firstTry:p.first_try},creator:{name:'Sample Creator',slug:'sample-creator',initials:'SC',label:'Local sample creator',verified:false}}));
 scope.invitationImageUrl=(p,base)=>new URL('/assets/previews/stackscout.png',base).href;
 scope.getPublishedProject=async slug=>(await scope.listPublished()).find(p=>p.slug===slug)||null;
 scope.origin=context=>context.url.origin;
 scope.getProjectRow=async slug=>projects.find(p=>p.slug===slug);
 const routes={};
 for(const [path,file,name='GET'] of [['/dashboard','src/server/dashboard-projects.ts','projectDashboard'],['/dashboard/overview','src/pages/dashboard/[section].ts'],['/dashboard/messages','src/pages/dashboard/messages.ts'],['/dashboard/profile','src/pages/dashboard/profile.ts'],['/dashboard/security','src/pages/dashboard/security.ts'],['/dashboard/project','src/pages/dashboard/project.ts'],['/admin','src/pages/admin/index.ts'],['/admin/project','src/pages/admin/project.ts'],['/dashboard/thread/'+id,'src/pages/dashboard/thread/[id].ts']])routes[path]=moduleFixture(file,[name],scope)[name];
 routes['/dashboard/community']=moduleFixture('src/pages/dashboard/community.ts',['GET'],scope).GET;
 routes['/people/sample-creator']=moduleFixture('src/server/profile-view.ts',['profileView'],scope).profileView;
 routes['/projects/sample-0']=moduleFixture('src/pages/projects/[slug].ts',['GET'],scope).GET;
 routes['/tell/sample-0']=moduleFixture('src/pages/tell/[slug].ts',['GET'],scope).GET;
 return {scope,tables,db,id,owner,author,routes};
}
