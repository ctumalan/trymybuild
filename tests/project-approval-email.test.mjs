import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectApprovalEmail,sendProjectApprovalEmail} from '../src/server/project-approval-email.mjs';
const project={id:'p1',slug:'my-app',title:'App <script>',lock_version:7};
test('approval email escapes creator content and links to the published project',()=>{const m=projectApprovalEmail(project);assert.match(m.html,/App &lt;script&gt;/);assert.match(m.text,/https:\/\/trymybuild.com\/projects\/my-app/);assert.match(m.text,/dashboard\?view=creator/);});
test('sends only to the creator with a revision-specific duplicate key',async()=>{let request;await sendProjectApprovalEmail({project,email:'creator@example.com'},{env:()=> 'test',fetch:async(url,options)=>{request=options;return new Response('{}');}});assert.deepEqual(JSON.parse(request.body).to,['creator@example.com']);assert.equal(request.headers['Idempotency-Key'],'project-approved/p1/7');});
test('missing setup and failed delivery are surfaced',async()=>{await assert.rejects(sendProjectApprovalEmail({project,email:'creator@example.com'},{env:()=>''}),/not configured/);await assert.rejects(sendProjectApprovalEmail({project,email:'creator@example.com'},{env:()=> 'test',fetch:async()=>new Response('',{status:503})}),/failed/);});
