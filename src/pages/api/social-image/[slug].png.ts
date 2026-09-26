import type { APIRoute } from 'astro';
import { getPublishedProject } from '../../../server/catalog-db';
import { origin } from '../../../server/auth';
import { loadInvitationScreenshot } from '../../../server/invitation-image.mjs';
import { renderSocialImage, socialFormats } from '../../../server/social-share.mjs';
export const GET: APIRoute = async context => {
 const format=context.url.searchParams.get('format')||'facebook';
 if(!Object.hasOwn(socialFormats,format))return new Response('Unknown format',{status:400});
 try {
  const project=await getPublishedProject(context.params.slug||'');
  if(!project)return new Response('Project unavailable',{status:404,headers:{'Cache-Control':'no-store'}});
  const image=await renderSocialImage(project,await loadInvitationScreenshot(project,origin(context)),format,{headline:context.url.searchParams.get('headline'),description:context.url.searchParams.get('description')});
  return new Response(new Uint8Array(image),{headers:{'Content-Type':'image/png','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Preview unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
};
