import {STUDIO} from './catalog-db';
export async function publicProfile(db:any,slug:string){
 if(slug===STUDIO.slug){const r=await db.from('projects').select('owner_user_id').eq('is_studio',true).eq('listing_status','published').not('owner_user_id','is',null).order('slug').limit(1);if(r.error)throw r.error;return {...STUDIO,display_name:STUDIO.name,user_id:r.data[0]?.owner_user_id||'',is_public:true};}
 const r=await db.from('profiles').select('user_id,slug,display_name,identity_label,bio,avatar_path,is_public,website,creator_type,location,location_public,verified').eq('slug',slug).eq('is_public',true).maybeSingle();if(r.error)throw r.error;if(!r.data)return null;
 const user=await db.from('users').select('account_status').eq('id',r.data.user_id).maybeSingle();if(user.error)throw user.error;if(user.data?.account_status!=='active')return null;
 const badge=await db.rpc('cw_badge_progress',{p_user:r.data.user_id});
 if(badge.error)throw badge.error;const b=badge.data?.[0];return {...r.data,verified:!!b?.verified&&Number(b.reviews)>=5&&Number(b.creators)>=3&&b.ownership_confirmed&&r.data.creator_type!=='company'};
}
