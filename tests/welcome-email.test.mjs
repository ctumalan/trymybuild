import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {welcomeEmail,sendWelcomeEmail} from '../src/server/welcome-email.mjs';

const input={user:{firstName:'Ava',email:'ava@example.com'},profile:{display_name:'Ava Maker'},project:{id:'p1',slug:'safe-app',title:'Safe <App>',external_url:'https://example.com',preview_path:'previews/p1.webp',sharing_preference:'public'}};

test('founder welcome reports both completion scores and tells the truth about visibility',()=>{
 const message=welcomeEmail(input);
 assert.equal(message.appCompletion,50);assert.equal(message.profileCompletion,25);
 assert.match(message.text,/App page: 50% complete/);assert.match(message.text,/Creator profile: 25% complete/);
 assert.match(message.text,/still private/);assert.match(message.text,/Explain what the app is for/);
 assert.equal(message.dashboardUrl,'https://trymybuild.com/dashboard/overview?started=safe-app');
 assert.match(message.html,/Safe &lt;App&gt;/);assert.doesNotMatch(message.html,/<strong>Safe <App>/);
});

test('welcome delivery uses the creator address and a project-specific duplicate key',async()=>{
 let request;
 const result=await sendWelcomeEmail(input,{env:key=>({RESEND_API_KEY:'key',PUBLIC_APP_URL:'https://trymybuild.com',WELCOME_EMAIL_FROM:'Christian <hello@example.com>'}[key]||''),fetch:async(url,options)=>{request={url,options};return new Response('{"id":"mail-1"}',{status:200});}});
 assert.deepEqual(result,{sent:true,id:'mail-1'});assert.equal(request.url,'https://api.resend.com/emails');
 assert.equal(request.options.headers['Idempotency-Key'],'welcome/p1');
 const body=JSON.parse(request.options.body);assert.deepEqual(body.to,['ava@example.com']);assert.equal(body.from,'Christian <hello@example.com>');
});

test('welcome delivery is skipped when email is not configured',async()=>{
 let called=false;const result=await sendWelcomeEmail(input,{env:()=>'',fetch:async()=>{called=true;}});
 assert.deepEqual(result,{skipped:true});assert.equal(called,false);
});

test('welcome is requested after the preview upload and the server re-reads the owned project',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const upload=app.indexOf("listingDraft.imageUploadedFor = data.project.slug");
 const welcome=app.indexOf("action: 'welcome'",upload);
 assert.ok(upload>0&&welcome>upload);
 const api=readFileSync(new URL('../src/pages/api/projects.ts',import.meta.url),'utf8');
 assert.match(api,/body\.action === 'welcome'[\s\S]*findOwnedById\(member\.id/);
});
