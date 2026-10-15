import type {APIRoute} from 'astro';
import {randomUUID} from 'node:crypto';
import {memberContext} from '../../../server/workspace';
import {json,origin} from '../../../server/auth';
import {sameOrigin} from '../../../server/security.mjs';
import {normalizeInvitation,invitationOpen,INVITATION_TTL_MS} from '../../../server/listing-invitation.mjs';
import {signedInvitation,INVITATION_BUCKET} from '../../../server/listing-invitation-store';
import {reencodeImage} from '../../../server/listing-store';
import {validId} from '../../../server/feedback-policy.mjs';
import {allowRequest} from '../../../server/abuse';

export const POST:APIRoute=async context=>{
 if(!sameOrigin(context.request,origin(context)))return json({error:'Request not allowed.'},403);
 try{
  const m=await memberContext(context);if(!m?.admin||!m.user.emailVerified)return json({error:'Administrator access required.'},403);
  if(!await allowRequest(m.user.id,'listing-invitations',20,60))return json({error:'Please wait before making another change.'},429);
  const raw=await context.request.text();if(raw.length>12_000_000)return json({error:'That image is too large.'},413);
  const body=JSON.parse(raw);if(!validId(body.id))return json({error:'Reload this form before saving.'},400);
  const before=await m.db.from('listing_invitations').select('*').eq('id',body.id).eq('created_by',m.member.id).maybeSingle();if(before.error)throw before.error;
  if(body.action==='revoke'){
   if(!Number.isSafeInteger(body.version))return json({error:'Reload before withdrawing this invitation.'},400);
   const r=await m.db.from('listing_invitations').update({revoked_at:new Date().toISOString(),lock_version:body.version+1,updated_at:new Date().toISOString()})
    .eq('id',body.id).eq('created_by',m.member.id).eq('lock_version',body.version).is('claimed_by',null).is('revoked_at',null).select('id').maybeSingle();
   if(r.error)throw r.error;
   return r.data?json({ok:true,revoked:true}):json({error:'The invitation changed or was claimed. Reload to check.'},409);
  }
  if(before.data&&body.version===undefined)return links(body.id,context); // Retried creation, never duplicate/overwrite.
  if(before.data&&!invitationOpen(before.data))return json({error:'This invitation is closed. Create a new one if needed.'},409);
  if(before.data&&body.version!==before.data.lock_version)return json({error:'This preview changed. Reload before saving.'},409);
  if(!before.data&&body.version!==undefined)return json({error:'Invitation not found.'},404);
  const normalized=normalizeInvitation(body);if('error' in normalized)return json({error:normalized.error},400);
  const fields:any={...normalized.value};delete fields.sharing_preference;
  if(body.image){
   const match=typeof body.image==='string'&&body.image.match(/^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+=*)$/);
   if(!match)return json({error:'Upload a PNG, JPG or WebP screenshot.'},400);
   let image;try{image=await reencodeImage(Buffer.from(match[1],'base64'));}catch{return json({error:'Choose a valid screenshot under 5 MB.'},400);}
   const key=`invitations/${body.id}/${randomUUID()}.jpg`;
   const stored=await m.db.storage.from(INVITATION_BUCKET).upload(key,image.bytes,{contentType:image.contentType,upsert:false});if(stored.error)throw stored.error;
   fields.preview_path=key;
   fields.preview_source=body.source==='captured'?'captured':'uploaded';
   fields.preview_source_url=fields.preview_source==='captured'?fields.external_url:'';
   fields.preview_captured_at=fields.preview_source==='captured'?new Date().toISOString():null;
  }else if(!before.data?.preview_path)return json({error:'Capture or upload a screenshot before creating the invitation.'},400);
  let saved;
  if(before.data){
   saved=await m.db.from('listing_invitations').update({...fields,lock_version:body.version+1,updated_at:new Date().toISOString()})
    .eq('id',body.id).eq('created_by',m.member.id).eq('lock_version',body.version).is('claimed_by',null).is('revoked_at',null).gt('expires_at',new Date().toISOString()).select('id').maybeSingle();
  }else {
   const created=Date.now();
   saved=await m.db.from('listing_invitations').insert({...fields,id:body.id,created_by:m.member.id,created_at:new Date(created).toISOString(),expires_at:new Date(created+INVITATION_TTL_MS).toISOString()}).select('id').single();
  }
  if(saved.error){
   // A retried insert may race with its first request. Return only this admin's existing invitation.
   if(!before.data&&saved.error.code==='23505'){
    const retry=await m.db.from('listing_invitations').select('id').eq('id',body.id).eq('created_by',m.member.id).maybeSingle();if(retry.data)return links(body.id,context);
   }
   throw saved.error;
  }
  if(!saved.data)return json({error:'This invitation changed while saving. Reload to check.'},409);
  // Keep prior images on uncertain writes. Never delete an object which a claimed project may reference.
  return links(body.id,context);
 }catch{return json({error:'Saving was not confirmed. Reload to check your invitations before retrying.'},503);}
};
function links(id:string,context:any){
 const token=signedInvitation(id),base=origin(context);
 return json({ok:true,adminUrl:'/admin/invitations?id='+id,previewUrl:new URL('/listing-invitation/'+token,base).href,imageUrl:new URL('/api/listing-invitation/'+token+'/image?card=1',base).href});
}
