// Local synthetic invitation preview. No production credentials, emails or accounts.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {moduleFixture,mockDatabase} from './workspace-fixtures.mjs';
import {invitationToken,invitationOpen,claimInvitation} from '../src/server/listing-invitation.mjs';
import {renderInvitationImage} from '../src/server/invitation-image.mjs';
import {pricingKind} from '../src/server/listing-policy.mjs';
const root=new URL('../',import.meta.url),port=Number(process.argv[2]||4396),base='http://127.0.0.1:'+port;
const id='77777777-7777-4777-8777-777777777777',member='88888888-8888-4888-8888-888888888888',secret='synthetic-fixture-not-a-production-secret-12345',token=invitationToken(id,secret);
const row={id,created_by:member,recipient_email:'maker@example.invalid',title:'Trip Notebook',external_url:'https://example.com/',category:'Travel',stage:'Ready for a first try',headline:'Keep the useful details of your next trip together.',help_text:'Spend less time hunting through tabs when you are away.',first_try:'Create one trip and add the first place you want to visit.',preview_path:'sample.jpg',price_label:'Free',lock_version:0,expires_at:new Date(Date.now()+30*86400000).toISOString(),created_at:new Date().toISOString(),claimed_by:null,revoked_at:null};
const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const scope={e,Response,URL,Date,pricingKind,console,origin:()=>base,validId:()=>true,signedInvitation:()=>token,invitationOpen,loadInvitation:async()=>row,ensureMember:async()=>({id:member})};
Object.assign(scope,moduleFixture('src/server/feedback-ui.ts',['surface','adminSurface','unavailable','signIn'],scope));
Object.assign(scope,moduleFixture('src/server/listing-invitation-view.ts',['invitationFields','invitationPreview','invitationAssets'],scope));
const db=mockDatabase({listing_invitations:[row]});let user=null,project=null;
scope.currentUser=async()=>user;scope.memberContext=async()=>({user:{email:'admin@example.invalid',emailVerified:true},member:{id:member},db,admin:true});
const admin=moduleFixture('src/pages/admin/invitations.ts',['GET'],scope).GET;
const creator=moduleFixture('src/pages/listing-invitation/[token].ts',['GET'],scope).GET;
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,base);let response;
  user=req.headers.cookie?.includes('fixture_creator=1')?{email:'maker@example.invalid',emailVerified:true}:null;
  const context={url,params:{token},redirect:(href,status)=>new Response(null,{status,headers:{location:href}})};
  if(url.pathname==='/admin/invitations')response=await admin(context);
  else if(url.pathname==='/listing-invitation/'+token)response=await creator(context);
  else if(url.pathname==='/auth/sign-in'){
   response=new Response(null,{status:303,headers:{Location:url.searchParams.get('next')||'/','Set-Cookie':'fixture_creator=1; Path=/; SameSite=Lax'}});
  }else if(url.pathname.endsWith('/claim')&&req.method==='POST'){
   const chunks=[];for await(const part of req)chunks.push(part);const body=JSON.parse(Buffer.concat(chunks).toString());
   const result=await claimInvitation({find:async()=>row,findProject:async()=>project,claim:async(_id,owner,_email,_version,details)=>{project={id:'local-project',slug:'local-trip-notebook',owner_user_id:owner,...details,visibility:'draft',listing_status:'draft'};row.claimed_by=owner;row.project_id=project.id;return project;}},{id,memberId:member,user,version:body.version,input:body});
   response=new Response(JSON.stringify(result.error?result:{href:'/?listing=settings&project=local-trip-notebook'}),{status:result.error?result.status:200,headers:{'Content-Type':'application/json'}});
  }else if(url.pathname==='/api/listing-invitation/'+token+'/image'){
   const screenshot=await readFile(new URL('assets/previews/packlight.png',root));const image=url.searchParams.get('card')==='1'?await renderInvitationImage({name:row.title,category:row.category,presentation:{headline:row.headline},creator:{name:''}},screenshot,{listingPreview:true}):screenshot;
   response=new Response(image,{headers:{'Content-Type':'image/png'}});
  }else if(url.pathname==='/'&&project){
   response=scope.surface('Saved private draft',`<h1>Saved to the creator’s account</h1><p>Local test only. This app is a private draft.</p><section class="cw-panel"><h2>${e(project.title)}</h2><h3>How it helps</h3><p>${e(project.help_text)}</p><h3>One thing to try first</h3><p>${e(project.first_try)}</p><p>Status ${e(project.listing_status)} · Visibility ${e(project.visibility)}</p></section>`);
  }else{
   if(req.method!=='GET')throw Error('Writes disabled on this fixture');
   const path=url.pathname.slice(1);if(path.includes('..')||!(/^assets\//.test(path)||/^[\w-]+\.(js|css)$/.test(path)))throw Error('Not found');
   response=new Response(await readFile(new URL(path,root)),{headers:{'Content-Type':path.endsWith('.js')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.svg')?'image/svg+xml':path.endsWith('.png')?'image/png':'application/octet-stream'}});
  }
  res.writeHead(response.status,{...Object.fromEntries(response.headers),'Cache-Control':'no-store'});res.end(Buffer.from(await response.arrayBuffer()));
 }catch(error){res.writeHead(404);res.end('Synthetic preview unavailable: '+error.message);}
}).listen(port,'127.0.0.1',()=>console.log('Synthetic creator preview: '+base+'/listing-invitation/'+token+'\nSynthetic admin preview: '+base+'/admin/invitations?id='+id));
