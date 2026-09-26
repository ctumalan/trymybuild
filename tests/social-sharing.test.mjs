import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {suggestedSocialPost} from '../social-share.js';
import {socialCopy,socialFormats,socialPageUrl,socialImageUrl,renderSocialImage} from '../src/server/social-share.mjs';
import {moduleFixture,workspaceFixtures} from '../scripts/workspace-fixtures.mjs';
const project={slug:'afterschooltogether',name:'AfterSchool Together',category:'Family life',summary:'Check the day’s activities against your travel times.',preview:'/assets/previews/afterschooltogether.png'};
test('social headlines lead with the need and editable copy is bounded without changing project data',()=>{
 const original=JSON.stringify(project);
 assert.match(socialCopy(project).headline,/make every pickup/);
 const custom=socialCopy(project,{headline:'  A\n better\t plan  ',description:'x'.repeat(200)});
 assert.equal(custom.headline,'A better plan');assert.equal(custom.description.length,160);
 assert.equal(socialCopy({...project,slug:'new-app'}).headline,project.summary);
 assert.equal(JSON.stringify(project),original);
});
test('social URLs preserve text safely and update when artwork changes',()=>{
 const copy={headline:'A "quote" & <idea>?',description:'A better plan.'};
 const page=new URL(socialPageUrl(project,'https://trymybuild.com',copy));
 assert.equal(page.pathname,'/projects/afterschooltogether');assert.equal(page.searchParams.get('headline'),copy.headline);
 const image=new URL(socialImageUrl(project,page.origin,'story',copy));
 assert.equal(image.searchParams.get('format'),'story');assert.equal(image.searchParams.get('headline'),copy.headline);
 assert.notEqual(image.href,socialImageUrl({...project,preview:'/new.png'},page.origin,'story',copy));
});
test('three original compositions export correct dimensions, include screenshots and tolerate bad inputs',async()=>{
 const shot=await sharp({create:{width:30,height:30,channels:3,background:'#ff0000'}}).png().toBuffer();
 for(const [format,size] of Object.entries(socialFormats)){
  const image=await renderSocialImage(project,shot,format),meta=await sharp(image).metadata();
  assert.equal(meta.width,size.width);assert.equal(meta.height,size.height);
  const point=format==='facebook'?{left:700,top:200}:format==='story'?{left:200,top:1100}:{left:200,top:800};
  const pixel=await sharp(image).extract({...point,width:1,height:1}).removeAlpha().raw().toBuffer();assert.deepEqual([...pixel],[255,0,0]);
 }
 const long={...project,name:'<script>&'.repeat(100),category:'Long category '.repeat(50)};
 const fallback=await renderSocialImage(long,Buffer.from('bad'),'instagram',{headline:'A very long headline '.repeat(40),description:'Helpful text '.repeat(80)});
 assert.equal((await sharp(fallback).metadata()).height,1350);
 await assert.rejects(renderSocialImage(project,null,'unknown'));
});
test('social artwork endpoint never renders private listings and rejects unknown formats',async()=>{
 let rendered=0;
 const base={Response,Uint8Array,socialFormats,origin:()=> 'https://trymybuild.com',getPublishedProject:async()=>null,loadInvitationScreenshot:async()=>null,renderSocialImage:async()=>{rendered++;return new Uint8Array();}};
 const route=moduleFixture('src/pages/api/social-image/[slug].png.ts',['GET'],base).GET;
 assert.equal((await route({url:new URL('https://trymybuild.com/api/social-image/private.png'),params:{slug:'private'}})).status,404);
 assert.equal((await route({url:new URL('https://trymybuild.com/api/social-image/private.png?format=bad'),params:{slug:'private'}})).status,400);
 assert.equal(rendered,0);
});
test('custom social link metadata is escaped while recipient content stays unchanged',async()=>{
 const f=workspaceFixtures();
 const url=new URL('https://example.invalid/projects/sample-0?social=1');url.searchParams.set('headline','Need "this" <script>?');url.searchParams.set('description','One & two');
 const response=await f.routes['/projects/sample-0']({url,params:{slug:'sample-0'},cookies:{get(){}}});
 const html=await response.text();assert.equal(response.status,200);
 assert.match(html,/og:title" content="Need &quot;this&quot; &lt;script&gt;\?/);
 assert.match(html,/og:image" content="https:\/\/example.invalid\/api\/social-image/);
 assert.match(html,/Plan the week with your whole family/);
 assert.doesNotMatch(html,/<script>\?/);
});
test('private app invitation remains personal, while public invitations provide social artwork',async()=>{
 const f=workspaceFixtures(),scope={...f.scope,socialCopy,socialImageUrl,json:(body,status=200)=>Response.json(body,{status})};
 const context=slug=>({url:new URL('https://example.invalid/api/invitation/'+slug),params:{slug},cookies:{get(){}}});
 const get=moduleFixture('src/pages/api/invitation/[slug].ts',['GET'],scope).GET;
 const pub=await(await get(context('sample-0'))).json();assert.ok(pub.social);assert.equal(pub.isOwner,true);
 f.tables.projects.find(p=>p.slug==='sample-1').external_url='https://private.example';
 const priv=await(await get(context('sample-1'))).json();assert.equal(priv.privateListing,true);assert.equal(priv.social,undefined);
 const guest=moduleFixture('src/pages/api/invitation/[slug].ts',['GET'],{...scope,currentUser:async()=>null}).GET;
 assert.equal((await guest(context('sample-1'))).status,404);
});

test('suggested posts distinguish the maker from someone recommending the app',()=>{
 const copy=socialCopy(project),visitor=suggestedSocialPost(project,copy),maker=suggestedSocialPost({...project,isOwner:true,firstTry:'Add a day of activities.'},copy);
 assert.match(visitor,/Found AfterSchool Together/);assert.doesNotMatch(visitor,/I’m building/);
 assert.match(maker,/I’m building AfterSchool Together/);assert.match(maker,/Try this: Add a day of activities/);
 assert.match(maker,/What would make this more useful to you/);
 assert.doesNotMatch(maker,/link in bio|100%|guaranteed/i);
});
