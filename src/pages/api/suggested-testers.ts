import type {APIRoute} from 'astro';
import {memberContext} from '../../server/workspace';
import {json} from '../../server/auth';
import {validSlug} from '../../server/feedback-policy.mjs';

export const GET:APIRoute=async context=>{
 try{
  const m=await memberContext(context);if(!m||!m.user.emailVerified)return json({error:'Sign in with a verified email to invite members.'},401);
  const slug=context.url.searchParams.get('project')||'';if(!validSlug(slug))return json({error:'Choose a published app.'},400);
  const app=await m.db.from('projects').select('slug,title,owner_user_id').eq('slug',slug).eq('owner_user_id',m.member.id).eq('listing_status','published').eq('visibility','public').maybeSingle();
  if(app.error)throw app.error;if(!app.data)return json({error:'Only the app owner can invite suggested testers.'},404);
  const entries=await m.db.from('maker_exchange_entries').select('request_id,user_id,project_slug,joined_at').eq('state','waiting').neq('user_id',m.member.id).order('joined_at').limit(18);
  if(entries.error)throw entries.error;if(!entries.data.length)return json({testers:[]});
  const userIds=[...new Set(entries.data.map((entry:any)=>entry.user_id))],projectSlugs=[...new Set(entries.data.map((entry:any)=>entry.project_slug))];
  const [profiles,users,projects,prior]=await Promise.all([
   m.db.from('profiles').select('user_id,slug,display_name,identity_label,bio,avatar_path').in('user_id',userIds).eq('is_public',true),
   m.db.from('users').select('id,account_status').in('id',userIds),
   m.db.from('projects').select('slug,title,category,owner_user_id').in('slug',projectSlugs).eq('listing_status','published').eq('visibility','public'),
   m.db.from('creator_feedback').select('author_user_id').eq('project_slug',slug).in('author_user_id',userIds)
  ]);
  if(profiles.error||users.error||projects.error||prior.error)throw Error('Suggestions unavailable');
  const active=new Set(users.data.filter((user:any)=>user.account_status==='active').map((user:any)=>user.id)),reviewed=new Set(prior.data.map((row:any)=>row.author_user_id));
  const profileByUser=new Map(profiles.data.map((profile:any)=>[profile.user_id,profile])),projectBySlug=new Map(projects.data.map((project:any)=>[project.slug,project]));
  const testers=[];const seen=new Set();
  for(const entry of entries.data){
   if(seen.has(entry.user_id)||!active.has(entry.user_id)||reviewed.has(entry.user_id))continue;
   const profile:any=profileByUser.get(entry.user_id),project:any=projectBySlug.get(entry.project_slug);
   if(!profile||!project||project.owner_user_id!==entry.user_id)continue;
   seen.add(entry.user_id);testers.push({slug:profile.slug,name:profile.display_name,label:profile.identity_label||'',bio:profile.bio||'',avatar:profile.avatar_path||'',project:{slug:project.slug,title:project.title,category:project.category||''}});
   if(testers.length===6)break;
  }
  return json({testers});
 }catch{return json({error:'Suggested testers are temporarily unavailable.'},503);}
};
