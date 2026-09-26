// Local-only preview: catalog fixtures, production renderers, no database or sending.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {moduleFixture,workspaceFixtures} from './workspace-fixtures.mjs';
import {renderSocialImage,socialFormats,socialCopy,socialImageUrl,socialPageUrl} from '../src/server/social-share.mjs';
import {renderInvitationImage,invitationImageUrl} from '../src/server/invitation-image.mjs';
import {contentSecurityPolicy} from '../src/server/content-security-policy.mjs';
const root=new URL('../',import.meta.url),source=await readFile(new URL('app.js',root),'utf8');
const projects=vm.runInNewContext(source.match(/^const projects = (\[[\s\S]*?\n\]);/)[1]).map(p=>({...p,preview:`/assets/previews/${p.slug}.png`,creator:{name:'TryMyBuild Studio'},presentation:{headline:p.outcome,help:p.summary,firstTry:p.slug==='afterschooltogether'?'Add a day of activities and review the pickup plan.':p.outcome}}));
const scope={...workspaceFixtures().scope,json:(body,status=200)=>Response.json(body,{status}),Uint8Array,socialCopy,socialImageUrl,socialPageUrl,socialFormats,renderSocialImage,invitationImageUrl,currentUser:async()=>null,getPublishedProject:async slug=>projects.find(p=>p.slug===slug),listPublished:async()=>projects,loadInvitationScreenshot:p=>readFile(new URL(p.preview.slice(1),root))};
const invitation=moduleFixture('src/pages/api/invitation/[slug].ts',['GET'],scope).GET;
const socialImage=moduleFixture('src/pages/api/social-image/[slug].png.ts',['GET'],scope).GET;
const projectPage=moduleFixture('src/pages/projects/[slug].ts',['GET'],scope).GET;
const port=Number(process.argv[2]||4326);
http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,`http://127.0.0.1:${port}`),slug=url.pathname.split('/').at(-1).replace(/\.png$/,''),context={url,params:{slug},cookies:{get(){}}};let response;
 if(req.method!=='GET')response=new Response('Preview only: no writes',{status:405});
 else if(url.pathname.startsWith('/api/invitation/'))response=await invitation(context);
 else if(url.pathname.startsWith('/api/social-image/'))response=await socialImage(context);
 else if(url.pathname.startsWith('/api/invitation-image/')){const p=await scope.getPublishedProject(slug);response=p?new Response(await renderInvitationImage(p,await scope.loadInvitationScreenshot(p)),{headers:{'Content-Type':'image/png'}}):new Response('Not found',{status:404});}
 else if(url.pathname.startsWith('/projects/'))response=await projectPage(context);
 else if(url.pathname.startsWith('/api/'))response=Response.json({error:'Not available in this local preview'},{status:503});
 else{const file=url.pathname==='/'?'index.html':url.pathname.slice(1);if(file.includes('..')||!(/^(assets\/)/.test(file)||/^[\w-]+\.(html|css|js)$/.test(file)))throw Error('Not found');const type={js:'text/javascript',css:'text/css',html:'text/html',svg:'image/svg+xml',png:'image/png',woff2:'font/woff2'}[file.split('.').at(-1)]||'application/octet-stream';response=new Response(await readFile(new URL(file,root)),{headers:{'Content-Type':type}});}
 res.writeHead(response.status,{...Object.fromEntries(response.headers),'Content-Security-Policy':contentSecurityPolicy,'Cache-Control':'no-store'});res.end(Buffer.from(await response.arrayBuffer()));
}catch(error){console.error(error.message);res.writeHead(500);res.end('Local preview unavailable');}}).listen(port,'127.0.0.1',()=>console.log(`Social sharing preview: http://127.0.0.1:${port}`));
