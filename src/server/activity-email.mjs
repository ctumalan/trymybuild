const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function activityEmail(notification){
 const path=typeof notification.href==='string'&&notification.href.startsWith('/')&&!notification.href.startsWith('//')&&!notification.href.includes('\\')?notification.href:'/dashboard/notifications';
 const url=new URL(path,'https://trymybuild.com').href;
 const title=String(notification.title||'New feedback on TryMyBuild').replace(/[\r\n]/g,' ').slice(0,180);
 return {subject:title,text:`${title}\n\nView and reply: ${url}\n\nManage feedback alerts: https://trymybuild.com/dashboard/notifications`,html:`<h1>${escape(title)}</h1><p>There is a new update waiting for you on TryMyBuild.</p><p><a href="${escape(url)}">View and reply</a></p><p><a href="https://trymybuild.com/dashboard/notifications">Manage feedback alerts</a></p>`};
}
export async function deliverActivityEmails(db,deps){
 const claimed=await db.rpc('cw_claim_activity_emails',{p_limit:10});if(claimed.error)throw claimed.error;
 const result={sent:0,skipped:0,failed:0};
 for(const job of claimed.data||[]){
  const finish=async values=>{const updated=await db.from('notification_email_queue').update(values).eq('notification_id',job.notification_id).eq('lease_id',job.lease_id);if(updated.error)throw updated.error;};
  try{
   const n=await db.from('notifications').select('id,user_id,title,href').eq('id',job.notification_id).single();if(n.error)throw n.error;
   const [member,pref]=await Promise.all([db.from('users').select('workos_user_id,account_status').eq('id',n.data.user_id).single(),db.from('account_preferences').select('feedback_alerts').eq('user_id',n.data.user_id).maybeSingle()]);
   if(member.error||pref.error)throw member.error||pref.error;
   if(member.data.account_status!=='active'||pref.data?.feedback_alerts===false){await finish({skipped_at:new Date().toISOString()});result.skipped++;continue;}
   const user=await deps.getUser(member.data.workos_user_id);
   if(!user.emailVerified||!user.email){await finish({skipped_at:new Date().toISOString()});result.skipped++;continue;}
   const response=await deps.fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+deps.apiKey,'Content-Type':'application/json','Idempotency-Key':'activity/'+job.notification_id},body:JSON.stringify({from:deps.from||'TryMyBuild <notifications@trymybuild.com>',to:[user.email],...activityEmail(n.data)}),signal:AbortSignal.timeout(10000)});
   if(!response.ok)throw Error('Email delivery failed');
   await finish({sent_at:new Date().toISOString()});result.sent++;
  }catch{
   result.failed++;
   await finish({available_at:new Date(Date.now()+Math.min(3600,60*2**Math.min(job.attempts,6))*1000).toISOString()});
  }
 }
 return result;
}
