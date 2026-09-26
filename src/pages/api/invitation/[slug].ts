import type { APIRoute } from 'astro';
import { getPublishedProject,getProjectRow } from '../../../server/catalog-db';
import {socialCopy, socialImageUrl} from '../../../server/social-share.mjs';
import { invitationImageUrl } from '../../../server/invitation-image.mjs';
import {database,ensureMember} from '../../../server/database';
import { origin,json,currentUser } from '../../../server/auth';
import {activeFeedbackRequest} from '../../../server/project-requests';
export const GET:APIRoute=async context=>{
 try{const p=await getPublishedProject(context.params.slug||'');if(!p){
  const user=await currentUser(context);if(!user)return json({error:'Project unavailable'},404);
  const member=await ensureMember(user),draft=await getProjectRow(context.params.slug||'');
  if(!draft||draft.owner_user_id!==member.id||!/^https?:\/\//.test(draft.external_url||''))return json({error:'Project unavailable'},404);
  return json({name:draft.title,description:draft.headline||draft.summary,category:draft.category,builder:'you',image:'',url:draft.external_url,privateListing:true,isOwner:true});
 }
 const user=await currentUser(context),member=user?await ensureMember(user):null,row=member?await getProjectRow(p.slug):null,request=await activeFeedbackRequest(database(),p.slug);
 const base=origin(context);return json({isOwner:!!member&&row?.owner_user_id===member.id,social:{...socialCopy(p),image:socialImageUrl(p,origin(context))},name:p.name,description:p.presentation.headline,category:p.category,builder:p.creator.name,image:invitationImageUrl(p,base),url:new URL('/projects/'+encodeURIComponent(p.slug),base).href,firstTry:p.presentation.firstTry,trialQuestion:request?.question||''});
 }catch{return json({error:'Preview unavailable'},503);}
};
