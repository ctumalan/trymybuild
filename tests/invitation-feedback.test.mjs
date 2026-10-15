import test from 'node:test';
import assert from 'node:assert/strict';
import {feedbackPanel,invitationFeedback,renderInvitationFeedback} from '../src/server/invitation-feedback.mjs';
import {invitationOpen} from '../src/server/listing-invitation.mjs';
import {moduleFixture} from '../scripts/workspace-fixtures.mjs';
const id='87829b6d-f5bb-4a3d-afd1-c823a3d812f0';
test('feedback is invitation-specific and safely renders prose with a stable email destination',()=>{
 assert.equal(renderInvitationFeedback('another-invitation'),'');
 assert.match(renderInvitationFeedback(id),/id="founder-feedback"/);
 assert.match(renderInvitationFeedback(id),/haven’t tested the signed-in/);
 const html=feedbackPanel({...invitationFeedback(id),headline:'<script>bad()</script>',notes:[{title:'<img>',text:'<a href="evil">click</a>'}]});
 assert.doesNotMatch(html,/<script>|<img>|<a href="evil"/);
 assert.match(html,/&lt;script&gt;/);
});
test('feedback stays behind the invitation lifecycle checks and is below its app preview',async()=>{
 let row={id,expires_at:new Date(Date.now()+86400000).toISOString(),title:'Fir & Field',recipient_email:'maker@example.com'};
 const surface=(_title,body,_unused,status=200)=>new Response(body,{status});
 const scope={Response,invitationOpen,loadInvitation:async()=>row,currentUser:async()=>null,ensureMember:async()=>null,renderInvitationFeedback,invitationAssets:'',surface,e:String,unavailable:()=>new Response('Unavailable'),invitationFields:()=>'',invitationPreview:()=>'<article>App preview</article>'};
 const route=moduleFixture('src/pages/listing-invitation/[token].ts',['GET'],scope).GET;
 const request={params:{token:'fixture'},url:new URL('https://example.com/')};
 const open=await route(request),html=await open.text();
 assert.ok(html.indexOf('App preview')<html.indexOf('id="founder-feedback"'));
 assert.match(html,/My feedback on your app/);
 for(const patch of [{revoked_at:new Date().toISOString()},{expires_at:new Date(0).toISOString()},{claimed_by:'different-owner'}]){
  const original=row;row={...original,...patch};
  const closed=await route(request);assert.equal(closed.status,410);assert.doesNotMatch(await closed.text(),/My feedback|604decordesign/);row=original;
 }
});
