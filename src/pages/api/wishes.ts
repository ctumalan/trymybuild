import type { APIRoute } from 'astro';
import { json, origin } from '../../server/auth';
import { database, databaseReady } from '../../server/database';
import { memberContext } from '../../server/workspace';
import { sameOrigin } from '../../server/security.mjs';
import { allowRequest } from '../../server/abuse';
import { validWish, normalizeWishCategory, wishCategories } from '../../server/wish-policy.mjs';
export const GET: APIRoute = async ({url}) => {
 try {
  if(!databaseReady())return json({error:'Wish lists are not connected yet.'},503);
  const rawCategory=url.searchParams.get('category');
  const category=rawCategory?normalizeWishCategory(rawCategory):'';
  if(rawCategory&&!category)return json({error:'Choose a valid wish category.'},400);
  const db=database();
  const registry=await db.rpc('cw_wish_categories');
  if(registry.error)throw registry.error;
  let query=db.from('community_wishes').select('id,category,description,created_at',{count:'exact'}).eq('moderation_status','published');
  // Include legacy spellings that normalize to the same category.
  if(category)query=query.in('category',[...new Set([category,...(registry.data||[]).filter((name:string)=>normalizeWishCategory(name)===category)])]);
  const result=await query.order('created_at',{ascending:false}).limit(200);
  if(result.error)throw result.error;
  return json({wishes:(result.data||[]).map(wish=>({...wish,category:normalizeWishCategory(wish.category)})),categories:[...new Set([...wishCategories,...(registry.data||[]).map(normalizeWishCategory).filter(Boolean)])],hasMore:(result.count||0)>200});
 }catch{return json({error:'Wish lists are temporarily unavailable.'},503);}
};
export const POST: APIRoute = async context => {
 if(!sameOrigin(context.request,origin(context)))return json({error:'Request not allowed.'},403);
 try {
  const m=await memberContext(context);if(!m)return json({error:'Sign in to submit your wish.'},401);
  if(!m.user.emailVerified)return json({error:'Verify your email before submitting a wish.'},403);
  if(!await allowRequest(m.user.id,'community-wishes',5,3600))return json({error:'Please wait before sharing more wishes.'},429);
  const raw=await context.request.text();if(raw.length>262144)return json({error:'Request too large.'},413);
  const body=JSON.parse(raw),category=normalizeWishCategory(body?.category),description=typeof body?.description==='string'?body.description.trim():'';
  if(!validWish(category,description))return json({error:'Choose a category or enter a new one (2–48 characters), and describe your wish.'},400);
  const result=await m.db.rpc('cw_submit_wish',{p_user:m.member.id,p_category:category,p_description:description});
  if(result.error)throw result.error;
  if(result.data?.outcome==='limit')return json({error:'You can have up to 10 wishes awaiting review or published. Contact us if you need to withdraw an older wish.'},409);
  return json({saved:true,...result.data});
 }catch{return json({error:'Your wish could not be submitted. Your draft is still on this device.'},503);}
};
