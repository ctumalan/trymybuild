// Read-only live smoke checks. Does not use credentials or submit customer content.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
const base='https://trymybuild.com';
const get=async(path,status=200)=>{const r=await fetch(new URL(path,base),{signal:AbortSignal.timeout(30000),redirect:'manual'});assert.equal(r.status,status,path);return r;};
const home=await get('/');assert.ok(home.headers.get('content-security-policy'));assert.match(home.headers.get('x-robots-tag')||'',/noindex/);
assert.match(await home.text(),/<script src="\/server-mode.js"><\/script>/);
for(const path of ['/terms','/privacy','/api/health'])await get(path);
for(const file of ['app.js','server-mode.js','share-invitation.js','community-entry.js','workspace-ui.js','launch-refinements.css']){
 const live=Buffer.from(await (await get('/'+file)).arrayBuffer());assert.deepEqual(live,await readFile(new URL('../'+file,import.meta.url)),file+' must match committed release');
}
const catalog=await (await get('/api/catalog')).json();assert.ok(catalog.projects.length>0);
const slug=catalog.projects[0].slug,invitation=await(await get('/api/invitation/'+encodeURIComponent(slug))).json();
const imageUrl=new URL(invitation.image);assert.equal(imageUrl.origin,base);assert.match(imageUrl.pathname,/\/api\/invitation-image\/.+\.png$/);
const image=await get(imageUrl.href);assert.match(image.headers.get('content-type'),/image\/png/);
const metadata=await sharp(Buffer.from(await image.arrayBuffer())).metadata();assert.equal(metadata.width,1200);assert.equal(metadata.height,630);
const recipient=await(await get('/projects/'+encodeURIComponent(slug))).text();assert.ok(recipient.includes(invitation.image.replaceAll('&','&amp;')));assert.match(recipient,/og:image:type" content="image\/png/);
for(const path of ['/dashboard/community','/dashboard/request-feedback?project='+encodeURIComponent(slug),'/api/account-export'])await get(path,401);
await get('/admin/workspace',403);
for(const path of ['/.env.local','/RELEASE_2026-09-14.md','/database/023_organic_launch.sql','/ORGANIC_PARTICIPATION_LAUNCH.md'])await get(path,404);
console.log(JSON.stringify({checkedAt:new Date().toISOString(),site:base,publicRoutes:'PASS',publishedProjects:catalog.projects.length,releaseAssets:'exact match',invitationPNG:'1200x630',guestProtection:'PASS',privateFiles:'not served',searchIndexing:'unchanged: noindex'},null,2));
