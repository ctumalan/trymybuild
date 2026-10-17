import type {APIRoute} from 'astro';
import {database} from '../../../../server/database';
import {json,origin} from '../../../../server/auth';
import {sameOrigin} from '../../../../server/security.mjs';
import {loadInvitation} from '../../../../server/listing-invitation-store';
import {allowRequest} from '../../../../server/abuse';

export const POST:APIRoute=async context=>{
 if(!sameOrigin(context.request,origin(context)))return json({error:'Request not allowed.'},403);
 try{
  const token=context.params.token||'',row=await loadInvitation(token);
  if(!row)return json({error:'This invitation is unavailable.'},404);
  if(!await allowRequest(row.id,'decline-listing-invitation',5,60))return json({error:'Please wait before trying again.'},429);
  if(row.claimed_by)return json({error:'This preview has already been saved to an account.'},409);
  if(row.revoked_at)return json({ok:true,declined:true});
  const result=await database().from('listing_invitations').update({revoked_at:new Date().toISOString(),lock_version:row.lock_version+1,updated_at:new Date().toISOString()})
   .eq('id',row.id).eq('lock_version',row.lock_version).is('claimed_by',null).is('revoked_at',null).select('id').maybeSingle();
  if(result.error)throw result.error;
  if(!result.data)return json({error:'This invitation changed. Reload to check its status.'},409);
  return json({ok:true,declined:true});
 }catch{return json({error:'This preview could not be removed. Please try again.'},503);}
};
