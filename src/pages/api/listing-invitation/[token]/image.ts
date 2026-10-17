import type {APIRoute} from 'astro';
import {loadInvitation,invitationScreenshot} from '../../../../server/listing-invitation-store';
import {renderInvitationImage} from '../../../../server/invitation-image.mjs';
import {socialFormats} from '../../../../server/social-share.mjs';
export const GET:APIRoute=async context=>{
 const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
 try{
  const row=await loadInvitation(context.params.token||'',true);if(!row)return new Response('Preview unavailable',{status:404,headers});
  const screenshot=await invitationScreenshot(row);
  const card=context.url.searchParams.get('card')==='1',format=context.url.searchParams.get('format')||'';
  const size=Object.hasOwn(socialFormats,format)?socialFormats[format]:{};
  const image=card?await renderInvitationImage({name:row.title,url:row.external_url,category:row.category,presentation:{headline:row.headline||row.summary},creator:{name:''}},screenshot,{listingPreview:true,...size}):screenshot;
  if(!image)return new Response('Preview unavailable',{status:404,headers});
  return new Response(new Uint8Array(image),{headers:{...headers,'Content-Type':card?'image/png':'image/jpeg',...(context.url.searchParams.get('download')==='1'?{'Content-Disposition':'attachment; filename="trymybuild-listing-preview.png"'}:{})}});
 }catch{return new Response('Preview unavailable',{status:503,headers});}
};
