// Local synthetic screens. All writes are disabled; no customer data or credentials.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {workspaceFixtures} from './workspace-fixtures.mjs';
const {routes,db,id}=workspaceFixtures(),root=new URL('../',import.meta.url);
const peer={slug:'sample-guest',title:'Daily sketchbook',maker:'Sample Reviewer',question:'Was it clear how to save your first drawing?',task:'Draw and save one sketch.'};
const matched={id,state:'matched',complete:false,given:null,received:null,partner:peer};
const states={join:null,waiting:{...matched,state:'waiting',partner:null},matched,given:{...matched,given:id},complete:{...matched,given:id,received:id,complete:true},cancelled:{...matched,state:'cancelled'}};
const originalRpc=db.rpc;let state=null;
db.rpc=async(name,args)=>name==='cw_maker_exchange_state'?{data:state,error:null}:originalRpc(name,args);
const port=Number(process.argv[2]||4393);
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:'+port);
  if(req.method!=='GET'){res.writeHead(503);res.end('Local preview only. Sending is disabled.');return;}
  let response;
  if(url.pathname==='/dashboard/exchange'){
   state=states[url.searchParams.get('state')||'join']||null;
   const context={url,params:{},cookies:{get(){}},redirect:(href,status)=>new Response(null,{status,headers:{location:href}})};
   response=await routes['/dashboard/exchange'](context);
  }else{
   const path=url.pathname.slice(1);if(path.includes('..')||!(/^(assets\/)/.test(path)||/^[\w-]+\.(js|css)$/.test(path)))throw Error('Not found');
   response=new Response(await readFile(new URL(path,root)),{headers:{'Content-Type':path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.svg')?'image/svg+xml':path.endsWith('.png')?'image/png':'application/octet-stream'}});
  }
  res.writeHead(response.status,{...Object.fromEntries(response.headers),'Cache-Control':'no-store'});res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(404);res.end('Local preview route unavailable');}
}).listen(port,'127.0.0.1',()=>console.log('Synthetic exchange preview: http://127.0.0.1:'+port+'/dashboard/exchange'));
