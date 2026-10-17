import type {APIRoute} from 'astro';
import {loadInvitation} from '../../../../server/listing-invitation-store';
import {invitationOpen} from '../../../../server/listing-invitation.mjs';
import {currentUser,json,origin} from '../../../../server/auth';

export const GET:APIRoute=async context=>{
 try{
  const token=context.params.token||'',row=await loadInvitation(token),user=await currentUser(context);
  if(!user)return json({error:'Create an account to share this app.'},401);
  const matches=user.emailVerified&&user.email.trim().toLowerCase()===row?.recipient_email;
  if(!row||!invitationOpen(row)||!matches)return json({error:'This invitation is not available to this account.'},403);
  const base=origin(context),url=new URL('/listing-invitation/'+token,base).href;
  return json({
   name:row.title,description:row.headline||row.summary,category:row.category,builder:'you',url,
   firstTry:row.first_try,isOwner:false,privateListing:false,
   social:{headline:row.headline||row.title,description:row.help_text||row.summary,image:new URL('/api/listing-invitation/'+token+'/image?card=1',base).href}
  });
 }catch{return json({error:'Sharing is temporarily unavailable.'},503);}
};
