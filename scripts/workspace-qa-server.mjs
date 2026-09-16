// Run manually on localhost; synthetic data, no secrets, no production writes.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {workspaceFixtures} from './workspace-fixtures.mjs';
import {renderInvitationImage} from '../src/server/invitation-image.mjs';
import {contentSecurityPolicy} from '../src/server/content-security-policy.mjs';
const {routes,scope,id}=workspaceFixtures(),root=new URL('../',import.meta.url);
if(process.argv[3]==='guest')scope.currentUser=async()=>null;
const port=Number(process.argv[2]||4325);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid preview port');
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:'+port);
  if(req.method!=='GET'){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Local preview: sending is disabled. Your text is still here.'}));return;}
  const context={url,params:{section:url.pathname.split('/').at(-1),slug:url.pathname.split('/').at(-1),id},cookies:{get(){}},redirect:(href,status)=>new Response(null,{status,headers:{Location:href}})};
  let response;
  if(routes[url.pathname])response=await routes[url.pathname](context);
  else if(url.pathname.startsWith('/people/'))response=scope.surface('Sample Creator','<div data-panel-content><h1>Sample Creator</h1><p>Local profile preview. All interactions remain inside TryMyBuild.</p><a href="/dashboard/profile">Edit my profile</a></div>');
  else if(url.pathname==='/api/saved')response=Response.json({saved:[]});
  else if(url.pathname==='/api/catalog')response=Response.json({connected:true,projects:await scope.listPublished()});
  else if(url.pathname.startsWith('/api/invitation-image/')){const p=(await scope.listPublished()).find(p=>p.slug===context.params.slug.replace(/\.png$/,''));response=p?new Response(await renderInvitationImage(p,await readFile(new URL(p.preview.replace(/^\//,''),root))),{headers:{'Content-Type':'image/png'}}):new Response('Not found',{status:404});}
  else if(url.pathname.startsWith('/api/invitation/')){const p=(await scope.listPublished()).find(p=>p.slug===context.params.slug);response=p?Response.json({name:p.name,description:p.presentation.headline,category:p.category,builder:p.creator.name,url:url.origin+'/projects/'+p.slug,image:url.origin+'/api/invitation-image/'+p.slug+'.png',isOwner:false}):new Response('Not found',{status:404});}
  else if(url.pathname==='/api/me')response=Response.json({authenticated:process.argv[3]!=='guest',user:{id:'fixture-user',displayName:'Sample Creator'},member:{displayName:'Sample Creator'}});
  else if(url.pathname==='/api/analytics-config')response=Response.json({measurementId:'G-LOCALTEST'});
  else if(url.pathname.startsWith('/api/'))response=Response.json({error:'Not available in the local preview'},{status:503});
  else{const path=url.pathname==='/'?'index.html':url.pathname.slice(1);if(path.includes('..')||!(/^(assets\/|projects\/)/.test(path)||/^[\w-]+\.(html|js|css)$/.test(path)))throw Error('Not found');const type=path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.svg')?'image/svg+xml':path.endsWith('.png')?'image/png':'text/html';let content=await readFile(new URL(path,root));if(path==='index.html')content=Buffer.from(content.toString().replace('<script src="app.js">','<script src="/server-mode.js"></script><script src="app.js">'));response=new Response(content,{headers:{'Content-Type':type}});}
  res.writeHead(response.status,{...Object.fromEntries(response.headers),'Content-Security-Policy':contentSecurityPolicy,'Cache-Control':'no-store'});res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){console.error(error.message);res.writeHead(500);res.end('Local fixture unavailable');}
}).listen(port,'127.0.0.1',()=>console.log('Workspace preview: http://127.0.0.1:'+port+'/dashboard/community'));
