import {notificationPreferences} from '../../server/notifications';
import {readBuilds} from '../../server/builds';
import type { APIRoute } from 'astro';
import { memberContext } from '../../server/workspace';
import { allowRequest } from '../../server/abuse';
export const GET:APIRoute=async context=>{
 try{
  const m=await memberContext(context);if(!m)return new Response('Sign in required',{status:401});
  if(!await allowRequest(m.user.id,'export',2,300))return new Response('Please wait five minutes before another export',{status:429});
  const read=async(table:string,key:string)=>{let rows:any[]=[];for(let page=0;;page++){const order=['profiles','account_preferences','account_deletion_requests'].includes(table)?'user_id':table==='feedback_reads'?'read_at':table==='category_engagement'?'updated_at':table==='maker_exchange_entries'?'joined_at':'created_at';const r=await m.db.from(table).select('*').eq(key,m.member.id).order(order).range(page*500,page*500+499);if(r.error)throw r.error;rows.push(...r.data);if(r.data.length<500)return rows;}};
  const tables=[['maker_exchange_entries','user_id'],['community_wishes','user_id'],['feedback_reads','user_id'],['profiles','user_id'],['projects','owner_user_id'],['saved_projects','user_id'],['creator_feedback','author_user_id'],['feedback_replies','author_user_id'],['project_experiences','author_user_id'],['daily_discussion_comments','user_id'],['feedback_qualifications','user_id'],['credit_ledger','user_id'],['feedback_requests','user_id'],['project_slot_grants','user_id'],['project_slot_assignments','user_id'],['account_preferences','user_id'],['category_engagement','user_id'],['notifications','user_id'],['support_cases','user_id'],['support_messages','author_id'],['account_deletion_requests','user_id']];
  const output:any={exportedAt:new Date().toISOString(),email:m.user.email};
  output.notificationPreferences=await notificationPreferences(m.db,m.member.id);
  for(const [t,k] of tables)output[t]=await read(t,k);
  output.feedbackRecognitionGiven=await read('feedback_ratings','creator_user_id');
  output.guestComments=(await read('project_experiences','guest_subscriber')).map(({guest_hash,...row}:any)=>row);
  const mine=[...await read('direct_threads','member_a'),...await read('direct_threads','member_b')];
  output.directThreads=[...new Map(mine.map((t:any)=>[t.id,t])).values()];
  output.directMessages=[];
  for(const thread of output.directThreads){for(let page=0;;page++){const r=await m.db.from('direct_messages').select('id,thread_id,sender_id,message,created_at').eq('thread_id',thread.id).order('created_at').order('id').range(page*500,page*500+499);if(r.error)throw r.error;output.directMessages.push(...r.data);if(r.data.length<500)break;}}
  output.blockedMembers=await read('direct_blocks','blocker');
  output.feedbackRecognitionReceived=await read('feedback_ratings','reviewer_user_id');
  output.projectBuilds=await Promise.all(output.projects.map(async(p:any)=>({project:p.slug,...await readBuilds(m.db,p.id)})));
  return new Response(JSON.stringify(output,null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="trymybuild-my-data.json"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response('Your export could not be completed. Please try again.',{status:503});}
};
