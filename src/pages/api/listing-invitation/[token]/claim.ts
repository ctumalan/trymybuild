import type {APIRoute} from 'astro';
import {memberContext} from '../../../../server/workspace';
import {json,origin,env} from '../../../../server/auth';
import {sameOrigin} from '../../../../server/security.mjs';
import {claimInvitation,invitationId} from '../../../../server/listing-invitation.mjs';
import {invitationStore} from '../../../../server/listing-invitation-store';
import {allowRequest} from '../../../../server/abuse';
export const POST:APIRoute=async context=>{
 if(!sameOrigin(context.request,origin(context)))return json({error:'Request not allowed.'},403);
 try{
  const m=await memberContext(context);if(!m)return json({error:'Sign in to save this app.'},401);
  if(!await allowRequest(m.user.id,'claim-listing-invitation',10,60))return json({error:'Please wait before trying again.'},429);
  const id=invitationId(context.params.token,env('WORKOS_COOKIE_PASSWORD'));if(!id)return json({error:'Invitation unavailable.'},404);
  const raw=await context.request.text();if(raw.length>20000)return json({error:'App details are too long.'},413);
  const body=JSON.parse(raw);if(body.confirm!=='yes'||body.terms!=='yes')return json({error:'Confirm this is your app and agree to the terms before saving.'},400);
  const result=await claimInvitation(invitationStore(m.db),{id,memberId:m.member.id,user:m.user,version:body.version,input:body});
  if(result.error)return json({error:result.error},result.status);
  return json({ok:true,href:'/?listing=settings&project='+encodeURIComponent(result.project.slug),idempotent:!!result.idempotent});
 }catch{return json({error:'Saving was not confirmed. Reload this preview to check before trying again.'},503);}
};
