import type { APIRoute } from 'astro';
import { json,origin } from '../../server/auth';
import { sameOrigin } from '../../server/security.mjs';
import { previewUrl } from '../../server/preview-network.mjs';
import { capturePreview } from '../../server/preview-capture.mjs';
import { currentUser } from '../../server/auth';
import { allowRequest } from '../../server/abuse';
export const POST:APIRoute=async context=>{
 if(!sameOrigin(context.request,origin(context)))return json({error:'Request not allowed.'},403);
 try{
  const user=await currentUser(context);
  // Guests can preview public sites before creating an account. Use the adapter's
  // client address (never a caller-supplied forwarding header) for shared limits.
  const verified=!!user?.emailVerified;
  const identifier=verified?user!.id:context.clientAddress;
  if(!identifier)return json({error:'Automatic preview is temporarily unavailable. Upload a screenshot or try again later.'},503);
  const action=verified?'listing-preview':'listing-preview-guest';
  // Database-backed counters work across concurrent serverless instances; fail closed.
  if(!await allowRequest(identifier,action,verified?3:2,60)||!await allowRequest(identifier,action+'-day',verified?20:6,86400))return json({error:'Screenshot limit reached. Upload an image or try again later.'},429);
  const raw=await context.request.text();if(raw.length>5000)return json({error:'Link is too long.'},413);
  let url;try{url=previewUrl(JSON.parse(raw).url).href;}catch{return json({error:'Enter a public http or https website link.'},400);}
  return json(await capturePreview(url));
 }catch{return json({error:'We couldn’t capture this page. It may require sign-in or block previews. Upload a screenshot, retry, or continue without an image.'},422);}
};
