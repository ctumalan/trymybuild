import type {APIRoute} from 'astro';
import {database,databaseReady} from '../../server/database';
import {env,json} from '../../server/auth';

const publicAvatar=(value:unknown,fallback='')=>typeof value==='string'&&(/^\/(?!\/)/.test(value)||/^https:\/\//.test(value))?value:fallback;

export const GET:APIRoute=async()=>{
 try{
  if(!databaseReady())return json({error:'Tester preview is temporarily unavailable.'},503);
  const db=database(),testers:any[]=[];const seen=new Set<string>();
  const founderWorkosId=env('FOUNDER_WORKOS_USER_ID');
  if(founderWorkosId){
   const founderUser=await db.from('users').select('id,account_status').eq('workos_user_id',founderWorkosId).maybeSingle();
   if(founderUser.error)throw founderUser.error;
   if(founderUser.data?.account_status==='active'){
    const founderId=founderUser.data.id;
    const [profile,project]=await Promise.all([
     db.from('profiles').select('user_id,slug,display_name,identity_label,bio,avatar_path').eq('user_id',founderId).eq('is_public',true).maybeSingle(),
     db.from('projects').select('slug,title,category,owner_user_id').eq('owner_user_id',founderId).eq('listing_status','published').eq('visibility','public').order('published_at',{ascending:false}).limit(1).maybeSingle()
    ]);
    if(profile.error||project.error)throw Error('Founder preview unavailable');
    if(profile.data&&project.data){
     const person:any=profile.data,founderProject:any=project.data;
     testers.push({slug:person.slug,name:person.display_name,label:person.identity_label||'',bio:person.bio||'',avatar:publicAvatar(person.avatar_path,'/assets/avatars/chris-nava-founder.jpg'),project:{title:founderProject.title,category:founderProject.category||''}});
     seen.add(founderId);
    }
   }
  }
  const entries=await db.from('maker_exchange_entries').select('user_id,project_slug,joined_at').eq('state','waiting').order('joined_at').limit(18);
  if(entries.error)throw entries.error;if(!entries.data.length)return json({testers});
  const userIds=[...new Set(entries.data.map((entry:any)=>entry.user_id))],projectSlugs=[...new Set(entries.data.map((entry:any)=>entry.project_slug))];
  const [profiles,users,projects]=await Promise.all([
   db.from('profiles').select('user_id,slug,display_name,identity_label,bio,avatar_path').in('user_id',userIds).eq('is_public',true),
   db.from('users').select('id,account_status').in('id',userIds),
   db.from('projects').select('slug,title,category,owner_user_id').in('slug',projectSlugs).eq('listing_status','published').eq('visibility','public')
  ]);
  if(profiles.error||users.error||projects.error)throw Error('Tester preview unavailable');
  const active=new Set(users.data.filter((user:any)=>user.account_status==='active').map((user:any)=>user.id));
  const profileByUser=new Map(profiles.data.map((profile:any)=>[profile.user_id,profile])),projectBySlug=new Map(projects.data.map((project:any)=>[project.slug,project]));
  for(const entry of entries.data){
   if(seen.has(entry.user_id)||!active.has(entry.user_id))continue;
   const profile:any=profileByUser.get(entry.user_id),project:any=projectBySlug.get(entry.project_slug);
   if(!profile||!project||project.owner_user_id!==entry.user_id)continue;
   seen.add(entry.user_id);testers.push({slug:profile.slug,name:profile.display_name,label:profile.identity_label||'',bio:profile.bio||'',avatar:publicAvatar(profile.avatar_path),project:{title:project.title,category:project.category||''}});
   if(testers.length===4)break;
  }
  return json({testers});
 }catch{return json({error:'Tester preview is temporarily unavailable.'},503);}
};
