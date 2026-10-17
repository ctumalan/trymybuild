import type {APIRoute} from 'astro';
import {loadInvitation} from '../../../../server/listing-invitation-store';
import {invitationOpen} from '../../../../server/listing-invitation.mjs';
import {currentUser,json,origin} from '../../../../server/auth';

export const GET:APIRoute=async context=>{
 try{
  const token=context.params.token||'',row=await loadInvitation(token),user=await currentUser(context);
  if(!row||!invitationOpen(row))return json({error:'This invitation is no longer available.'},410);
  const matches=Boolean(user?.emailVerified&&user.email.trim().toLowerCase()===row.recipient_email);
  const base=origin(context),url=new URL('/listing-invitation/'+token,base).href,image=new URL('/api/listing-invitation/'+token+'/image?card=1',base).href;
  return json({
   name:row.title,description:row.headline||row.summary,category:row.category,builder:'you',image,url,
   firstTry:row.first_try,isOwner:false,privateListing:false,canShare:matches,
   social:{headline:row.headline||row.title,description:row.help_text||row.summary,image}
  });
 }catch{return json({error:'Sharing is temporarily unavailable.'},503);}
};
