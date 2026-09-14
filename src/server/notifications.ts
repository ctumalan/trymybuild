import {recommendationInterests} from './interest-policy.mjs';
import {createHash} from 'node:crypto';
export const notificationDefaults={saved_updates:true,recommendations:false,activity_digest:false,draft_reminders:false,review_opportunities:true};
export const notificationKey=(id:string)=>'notification-preferences:'+id;
export async function notificationPreferences(db:any,id:string){const r=await db.from('site_settings').select('value').eq('key',notificationKey(id)).maybeSingle();if(r.error)throw r.error;return {...notificationDefaults,...r.data?.value};}
const stableId=(key:string)=>{const h=createHash('sha256').update(key).digest('hex').slice(0,32);return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;};
export async function prepareNotifications(db:any,id:string,admin:boolean){
 const pref=await notificationPreferences(db,id),since=new Date(Date.now()-7*86400000).toISOString(),week=String(Math.floor(Date.now()/(7*86400000)));
 const pending:any[]=[];const add=(key:string,kind:string,title:string,href:string)=>pending.push({id:stableId(id+':'+key),user_id:id,kind,title,href});
 const check=(r:any)=>{if(r.error)throw r.error;return r.data||[];};
 if(pref.review_opportunities){
  const prior=check(await db.from('creator_feedback').select('project_slug').eq('author_user_id',id));
  const candidates=check(await db.from('projects').select('slug,title,owner_user_id').eq('listing_status','published').order('published_at',{ascending:false}).limit(100));
  const eligible=candidates.filter((p:any)=>p.owner_user_id&&p.owner_user_id!==id&&!prior.some((f:any)=>f.project_slug===p.slug));
  const candidate=eligible[Number(week)%Math.max(eligible.length,1)];
  if(candidate){const profile=await db.from('profiles').select('display_name').eq('user_id',candidate.owner_user_id).maybeSingle();if(profile.error)throw profile.error;
   add('review-opportunity:'+week,'review-opportunity',`A project you might enjoy helping: help ${profile.data?.display_name||'the creator'} improve ${candidate.title}. Try & review →`,'/tell/'+candidate.slug);
  }
 }
 if(pref.saved_updates){const saved=check(await db.from('saved_projects').select('project_slug,created_at').eq('user_id',id));if(saved.length){
  const ps=check(await db.from('projects').select('id,slug,title,owner_user_id,published_at').in('slug',saved.map((x:any)=>x.project_slug)).eq('listing_status','published'));
  const states=ps.length?check(await db.from('site_settings').select('key,value').in('key',ps.map((p:any)=>'project-builds:'+p.id))):[];
  for(const p of ps){const savedAt=saved.find((s:any)=>s.project_slug===p.slug).created_at;
   if(p.published_at>savedAt&&p.published_at>since)add('saved:'+p.id+':'+p.published_at,'saved','A saved project is available: '+p.title,'/projects/'+p.slug);
   if(p.owner_user_id===id)continue;
   const state=states.find((s:any)=>s.key==='project-builds:'+p.id)?.value;
   for(const event of state?.events||[]){if(event.createdAt<=savedAt)continue;const build=state.builds.find((b:any)=>b.id===event.buildId);if(!build)continue;
    pending.push({id:stableId(id+':build:'+event.id),user_id:id,kind:'build',title:`${p.title} · Build ${build.version}: ${build.notes}`,href:'/projects/'+p.slug+'#build-'+event.id,created_at:event.createdAt});
   }
  }
 }}
 if(pref.recommendations){const r=await db.from('account_preferences').select('interests,selected_interests,personalization').eq('user_id',id).maybeSingle();if(r.error)throw r.error;const interests=recommendationInterests(r.data);if(interests.length){const ps=check(await db.from('projects').select('slug,title,category,owner_user_id').eq('listing_status','published').gt('published_at',since).order('published_at',{ascending:false}).limit(100));for(const p of ps.filter((p:any)=>p.owner_user_id!==id&&interests.some((i:string)=>i.toLowerCase()===p.category.toLowerCase())).slice(0,3))add('discovery:'+week+':'+p.slug,'discovery','New in your interests: '+p.title,'/projects/'+p.slug);}}
 if(pref.draft_reminders){for(const p of check(await db.from('projects').select('id,slug,title').eq('owner_user_id',id).eq('listing_status','draft').lt('updated_at',since)))add('draft:'+p.id,'draft','Ready to continue '+p.title+'?','/?listing=settings&project='+p.slug);}
 if(pref.activity_digest){for(const p of check(await db.from('projects').select('id,slug,title').eq('owner_user_id',id).eq('listing_status','published'))){const [s,f]=await Promise.all([db.from('saved_projects').select('project_slug',{head:true,count:'exact'}).eq('project_slug',p.slug).gt('created_at',since),db.from('creator_feedback').select('id',{head:true,count:'exact'}).eq('project_slug',p.slug).gt('created_at',since)]);if(s.error||f.error)throw Error('Activity unavailable');if(s.count+f.count>0)add('activity:'+week+':'+p.id,'activity',`${p.title}: ${s.count} saves and ${f.count} feedback entries in the last 7 days`,'/dashboard?view=creator&project='+p.slug);}}
 if(admin){const [ps,cs,ds]=await Promise.all([db.from('projects').select('id,slug,title,lock_version').eq('listing_status','in_review'),db.from('support_cases').select('id,subject,kind,revision').eq('status','open'),db.from('account_deletion_requests').select('user_id,requested_at').eq('status','pending')]);for(const p of check(ps))add('review:'+p.id+':'+p.lock_version,'admin','Project awaiting review: '+p.title,'/admin/project?slug='+p.slug);for(const c of check(cs))add('case:'+c.id+':'+c.revision,'admin','New '+c.kind+' request: '+c.subject,'/admin/workspace?tab=cases&case='+c.id);for(const d of check(ds))add('erasure:'+d.user_id+':'+d.requested_at,'admin','Account deletion request awaits review','/admin/workspace?tab=privacy');}
 if(pending.length){const r=await db.from('notifications').upsert(pending,{onConflict:'id',ignoreDuplicates:true});if(r.error)throw r.error;}
}
