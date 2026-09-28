// Isolated browser QA: real route handlers, simulated identity and in-memory data.
// No credentials, outgoing messages, or production database access. Not published.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {workspaceFixtures,moduleFixture} from './workspace-fixtures.mjs';
import {sameOrigin} from '../src/server/security.mjs';
import {contentSecurityPolicy} from '../src/server/content-security-policy.mjs';

const f=workspaceFixtures(),root=new URL('../',import.meta.url),port=Number(process.argv[2]||4334);
f.tables.creator_feedback=[];f.tables.project_experiences=[];
f.tables.projects.forEach(p=>p.visibility='public');
const db={from(table){
 let rows=[...(f.tables[table]||[])],error=null,head=false;
 const q={select(fields,options={}){head=!!options.head;if(fields.includes('projects!inner'))rows=rows.map(r=>({...r,projects:f.tables.projects.find(p=>p.slug===r.project_slug)})).filter(r=>r.projects);return q;},
 eq(k,v){rows=rows.filter(r=>k.split('.').reduce((a,b)=>a?.[b],r)===v);return q;},
 in(k,vs){rows=rows.filter(r=>vs.includes(r[k]));return q;},lte(k,v){rows=rows.filter(r=>r[k]<=v);return q;},
 order(k,{ascending=true}={}){rows.sort((a,b)=>String(a[k]).localeCompare(String(b[k]))*(ascending?1:-1));return q;},
 range(a,b){rows=rows.slice(a,b+1);return q;},limit(n){rows=rows.slice(0,n);return q;},
 insert(value){if(table==='creator_feedback'&&f.tables[table].some(r=>r.project_slug===value.project_slug&&r.author_user_id===value.author_user_id)){error={code:'23505'};rows=[];return q;}const row={id:randomUUID(),created_at:new Date().toISOString(),...value};(f.tables[table]??=[]).push(row);rows=[row];return q;},
 upsert(value){const found=(f.tables[table]||[]).find(r=>r.project_slug===value.project_slug&&r.author_user_id===value.author_user_id);if(found){Object.assign(found,value);rows=[found];return q;}return q.insert(value);},
 single:async()=>({data:rows[0]||null,error}),maybeSingle:async()=>({data:rows[0]||null,error}),
 then(resolve,reject){return Promise.resolve({data:head?null:rows,count:rows.length,error}).then(resolve,reject);}};return q;},
 async rpc(name,args){
  if(name==='cw_combined_inbox')return {error:null,data:f.tables.creator_feedback.filter(r=>r.author_user_id===args.p_user||f.tables.projects.find(p=>p.slug===r.project_slug)?.owner_user_id===args.p_user).map(r=>({...r,kind:'project',title:f.tables.projects.find(p=>p.slug===r.project_slug).title,counterpart:'Sample Reviewer',last_message:r.message,last_at:r.created_at,unread:true,total_count:f.tables.creator_feedback.length}))};
  return {error:null,data:[]};
 }};
function handlers(role){
 const member={id:role==='creator'?f.owner:f.author};
 const user={id:'qa-'+role,firstName:role==='creator'?'Sample Creator':'Sample Reviewer',emailVerified:true};
 const scope={...f.scope,database:()=>db,ensureMember:async()=>member,currentUser:async()=>user,memberContext:async()=>({user,member,db,admin:false}),allowRequest:async()=>true,sameOrigin,json:(body,status=200)=>Response.json(body,{status}),guestToken:()=>null};
 return {comments:moduleFixture('src/pages/api/experiences.ts',['GET','POST'],scope),feedback:moduleFixture('src/pages/api/feedback.ts',['POST'],scope).POST,tell:moduleFixture('src/pages/tell/[slug].ts',['GET'],scope).GET,messages:moduleFixture('src/pages/dashboard/messages.ts',['GET'],scope).GET};
}
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://127.0.0.1:${port}`),role=req.headers.cookie?.includes('qa_role=creator')?'creator':'reviewer';
  if(url.pathname==='/qa/creator'||url.pathname==='/qa/reviewer'){res.writeHead(303,{'Set-Cookie':`qa_role=${url.pathname.split('/').at(-1)}; Path=/; SameSite=Strict`,'Location':url.pathname.endsWith('creator')?'/dashboard/messages':'/'});res.end();return;}
  let body='';for await(const chunk of req)body+=chunk;
  const request=new Request(url,{method:req.method,headers:req.headers,...(req.method!=='GET'&&req.method!=='HEAD'?{body}:{})});
  const context={url,request,params:{slug:url.pathname.split('/').at(-1)},clientAddress:'127.0.0.1',cookies:{get(){}},redirect:(href,status=303)=>new Response(null,{status,headers:{Location:href}})};
  const h=handlers(role);let response;
  if(url.pathname==='/api/experiences')response=await h.comments[req.method](context);
  else if(url.pathname==='/api/feedback'&&req.method==='POST')response=await h.feedback(context);
  else if(url.pathname.startsWith('/tell/'))response=await h.tell(context);
  else if(url.pathname==='/dashboard/messages')response=await h.messages(context);
  else if(url.pathname==='/api/catalog')response=Response.json({connected:true,projects:await f.scope.listPublished()});
  else if(url.pathname==='/api/me')response=Response.json({authenticated:true,user:{id:'qa-'+role,displayName:role==='creator'?'Sample Creator':'Sample Reviewer'},member:{displayName:role==='creator'?'Sample Creator':'Sample Reviewer'}});
  else if(url.pathname==='/api/saved')response=Response.json({saved:[]});
  else if(url.pathname.startsWith('/api/'))response=Response.json({error:'Not included in isolated QA'},{status:503});
  else{
   const path=url.pathname==='/'?'index.html':url.pathname.slice(1);if(path.includes('..')||!(/^assets\//.test(path)||/^[\w-]+\.(html|js|css)$/.test(path)))throw Error('Not found');
   const type={js:'text/javascript',css:'text/css',html:'text/html',svg:'image/svg+xml',png:'image/png',woff2:'font/woff2'}[path.split('.').at(-1)]||'application/octet-stream';
   let content=await readFile(new URL(path,root));
   if(path==='index.html')content=content.toString().replace('<script src="app.js">','<script src="server-mode.js"></script><script src="app.js">');
   response=new Response(content,{headers:{'Content-Type':type}});
  }
  if(response.headers.get('Content-Type')?.includes('text/html')){const html=(await response.text()).replace('<body>','<body><aside style="padding:10px;background:#fff3cd;color:#382b46">ISOLATED QA — simulated accounts and temporary data only. <a href="/qa/reviewer">Reviewer</a> · <a href="/qa/creator">Creator inbox</a></aside>');response=new Response(html,{status:response.status,headers:response.headers});}
  res.writeHead(response.status,{...Object.fromEntries(response.headers),'Content-Security-Policy':contentSecurityPolicy,'Cache-Control':'no-store'});res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){console.error(error.message);res.writeHead(500);res.end('Isolated QA request failed');}
}).listen(port,'127.0.0.1',()=>console.log(`Isolated feedback QA: http://127.0.0.1:${port}`));
