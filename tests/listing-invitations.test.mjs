import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {invitationToken,invitationId,invitationOpen,invitationExpiresAt,INVITATION_TTL_MS,normalizeInvitation,claimInvitation} from '../src/server/listing-invitation.mjs';
import {feedbackDestination} from '../src/server/feedback-policy.mjs';
import {moduleFixture} from '../scripts/workspace-fixtures.mjs';

const secret='a-private-test-secret-longer-than-thirty-two-characters';
const id=randomUUID(),memberId=randomUUID(),email='maker@example.com';
const row=()=>({id,recipient_email:email,created_at:new Date().toISOString(),expires_at:new Date(Date.now()+86400000).toISOString(),lock_version:2,claimed_by:null,revoked_at:null});
const input={title:'Example app',url:'https://example.com/',category:'Technology',does:'Keep your plans together',helps:'Make the next step easier to see.',firstTry:'Create one plan.',pricing:'freemium'};
test('preview tokens cannot be guessed, modified or reused for a different invitation or secret',()=>{
 const token=invitationToken(id,secret);
 assert.equal(invitationId(token,secret),id);
 assert.equal(invitationId(token,'b'.repeat(40)),null);
 assert.equal(invitationId(randomUUID()+token.slice(36),secret),null);
 assert.equal(invitationId(token.slice(0,-1)+(token.endsWith('a')?'b':'a'),secret),null);
 assert.equal(invitationId(id,secret),null);
 assert.throws(()=>invitationToken(id,'short'));
 assert.equal(feedbackDestination('/listing-invitation/'+token),'/listing-invitation/'+token);
 for(const value of ['//evil.com','https://evil.com/listing-invitation/'+token,'/listing-invitation/'+token+'?next=https://evil.com','/listing-invitation/'+token+'/../admin'])assert.equal(feedbackDestination(value),'/?account=1');
});
test('invitation preparation validates recipient and app without granting ownership or publication',()=>{
 const r=normalizeInvitation({...input,recipientEmail:' Maker@Example.com ',owner_user_id:'attacker',listing_status:'published',is_studio:true});
 assert.equal(r.value.recipient_email,email);assert.equal(r.value.headline,input.does);
 assert.equal(r.value.price_label,'Free + paid options');
 for(const key of ['owner_user_id','listing_status','is_studio'])assert.equal(key in r.value,false);
 assert.ok(normalizeInvitation({...input,recipientEmail:'not-an-email'}).error);
 assert.ok(normalizeInvitation({...input,url:'javascript:alert(1)',recipientEmail:email}).error);
 assert.ok(normalizeInvitation({...input,title:'',recipientEmail:email}).error);
});
test('a readable preview requires an active, unclaimed invitation',()=>{
 assert.equal(invitationOpen(row()),true);
 for(const patch of [{claimed_by:memberId},{revoked_at:new Date().toISOString()},{expires_at:new Date(Date.now()-1000).toISOString()}])assert.equal(invitationOpen({...row(),...patch}),false);
 assert.equal(invitationOpen(null),false);
});
test('unclaimed previews close at the 48-hour boundary, including legacy invitations; edits never extend the deadline',()=>{
 const created=Date.parse('2026-10-15T18:00:00Z');
 const legacy={...row(),created_at:new Date(created).toISOString(),updated_at:new Date(created+INVITATION_TTL_MS).toISOString(),expires_at:new Date(created+30*86400000).toISOString()};
 assert.equal(invitationExpiresAt(legacy),created+INVITATION_TTL_MS);
 assert.equal(invitationOpen(legacy,created+INVITATION_TTL_MS-1),true);
 assert.equal(invitationOpen(legacy,created+INVITATION_TTL_MS),false);
 assert.equal(invitationOpen(legacy,created+INVITATION_TTL_MS+1),false);
 assert.equal(invitationExpiresAt({...legacy,expires_at:new Date(created+1000).toISOString()}),created+1000);
 for(const patch of [{created_at:null},{created_at:'invalid'},{expires_at:'invalid'}])assert.equal(invitationOpen({...legacy,...patch},created),false);
});
test('expired legacy previews cannot be claimed, while an already saved draft remains available',async()=>{
 const expired={...row(),created_at:new Date(Date.now()-INVITATION_TTL_MS-1000).toISOString(),expires_at:new Date(Date.now()+30*86400000).toISOString()};
 let writes=0;const project={id:randomUUID(),slug:'saved-before-expiry'};
 const store={find:async()=>expired,claim:async()=>writes++,findProject:async()=>project};
 const args={id,memberId,user:{email,emailVerified:true},version:2,input};
 assert.equal((await claimInvitation(store,args)).status,410);assert.equal(writes,0);
 store.find=async()=>({...expired,claimed_by:memberId,project_id:project.id});
 assert.equal((await claimInvitation(store,args)).project.slug,project.slug);assert.equal(writes,0);
});
test('creating an invitation stores a server-controlled 48-hour deadline instead of the legacy database default',async()=>{
 let inserted;
 const q={select(){return q;},eq(){return q;},maybeSingle:async()=>({data:null}),insert(value){inserted=value;return {select:()=>({single:async()=>({data:{id}})})};}};
 const db={from:()=>q,storage:{from:()=>({upload:async()=>({})})}};
 const scope={Response,URL,Buffer,Date,randomUUID,normalizeInvitation,invitationOpen,INVITATION_TTL_MS,sameOrigin:()=>true,origin:()=> 'https://example.com',json:(body,status=200)=>new Response(JSON.stringify(body),{status}),validId:()=>true,allowRequest:async()=>true,memberContext:async()=>({admin:true,user:{id:'admin',emailVerified:true},member:{id:memberId},db}),reencodeImage:async()=>({bytes:Buffer.from('test image'),contentType:'image/jpeg'}),INVITATION_BUCKET:'project-previews',signedInvitation:()=> 'signed-token'};
 const POST=moduleFixture('src/pages/api/admin/listing-invitations.ts',['POST'],scope).POST;
 const response=await POST({request:{text:async()=>JSON.stringify({...input,id,recipientEmail:email,image:'data:image/png;base64,dGVzdA==',expires_at:'2099-01-01T00:00:00Z'})}});
 assert.equal(response.status,200);
 assert.equal(Date.parse(inserted.expires_at)-Date.parse(inserted.created_at),INVITATION_TTL_MS);
});
test('claim uses the verified invited identity and preserves recipient edits, without trusting client authority',async()=>{
 let called=0;
 const store={find:async()=>row(),claim:async(...args)=>{called++;assert.equal(args[1],memberId);assert.equal(args[2],email);assert.equal(args[3],2);assert.equal(args[4].help_text,'My own benefit');assert.equal(args[4].first_try,'My own first step');assert.equal(args[4].owner_user_id,undefined);return{id:randomUUID(),slug:'claimed-app'};}};
 const base={id,memberId,user:{email:'Maker@Example.com',emailVerified:true},version:2,input:{...input,helps:'My own benefit',firstTry:'My own first step',owner_user_id:'attacker',listing_status:'published'}};
 assert.equal((await claimInvitation(store,base)).project.slug,'claimed-app');assert.equal(called,1);
 for(const patch of [{user:{email,emailVerified:false}},{user:{email:'another@example.com',emailVerified:true}},{version:1},{memberId:null}])assert.ok((await claimInvitation(store,{...base,...patch})).error);
 assert.equal(called,1);
});
test('claimed retries return the existing draft without overwriting it; removal does not resurrect it',async()=>{
 let writes=0;const project={id:randomUUID(),slug:'existing'};
 const store={find:async()=>({...row(),claimed_by:memberId,project_id:project.id}),findProject:async()=>project,claim:async()=>{writes++;}};
 const base={id,memberId,user:{email,emailVerified:true},version:2,input};
 assert.equal((await claimInvitation(store,base)).idempotent,true);assert.equal(writes,0);
 store.findProject=async()=>null;assert.equal((await claimInvitation(store,base)).status,410);assert.equal(writes,0);
 store.find=async()=>({...row(),claimed_by:randomUUID()});assert.equal((await claimInvitation(store,base)).status,409);
});
test('expired, revoked and missing invitations cannot create projects; failed transaction reports uncertainty',async()=>{
 const base={id,memberId,user:{email,emailVerified:true},version:2,input};let writes=0;
 for(const record of [null,{...row(),expires_at:new Date(0).toISOString()},{...row(),revoked_at:new Date().toISOString()}]){
  assert.ok((await claimInvitation({find:async()=>record,claim:async()=>writes++},base)).error);
 }
 assert.equal(writes,0);
 const result=await claimInvitation({find:async()=>row(),claim:async()=>{throw Error('connection lost');}},base);
 assert.equal(result.status,409);assert.match(result.error,/Reload/);
});
test('preview renders untrusted creator text as text and offers the two requested editable fields',()=>{
 const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const view=moduleFixture('src/server/listing-invitation-view.ts',['invitationFields','invitationPreview'],{e,pricingKind:()=> 'free'});
 const html=view.invitationPreview({title:'<script>bad()</script>',help_text:'<img onerror=bad()>',first_try:'Try <one>'},'/api/safe-image');
 assert.doesNotMatch(html,/<script>|<img onerror/);assert.match(html,/&lt;script&gt;/);
 const fields=view.invitationFields({help_text:'A benefit',first_try:'A task'});
 assert.match(fields,/>How it helps<textarea name="helps"/);assert.match(fields,/>One thing to try first<textarea name="firstTry"/);
 assert.doesNotMatch(fields,/recipient_email|owner_user_id|listing_status/);
});
