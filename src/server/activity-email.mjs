const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function activityEmail(notification){
 const path=typeof notification.href==='string'&&notification.href.startsWith('/')&&!notification.href.startsWith('//')&&!notification.href.includes('\\')?notification.href:'/dashboard/notifications';
 const url=new URL(path,'https://trymybuild.com').href;
 const title=String(notification.title||'New feedback on TryMyBuild').replace(/[\r\n]/g,' ').slice(0,180);
 const admin=notification.kind==='admin';
 const action=admin?'Open admin workspace':notification.kind==='publication'?'View project update':'View and reply';
 const footer=admin?'This administrator alert is sent for important TryMyBuild activity.':'Manage email alerts: https://trymybuild.com/dashboard/notifications';
 return {subject:title,text:`${title}\n\n${action}: ${url}\n\n${footer}`,html:`<h1>${escape(title)}</h1><p>There is a new update waiting for you on TryMyBuild.</p><p><a href="${escape(url)}">${escape(action)}</a></p><p>${admin?escape(footer):'<a href="https://trymybuild.com/dashboard/notifications">Manage email alerts</a>'}</p>`};
}
const feedbackKinds=new Set(['feedback','comment','quick-feedback','message']);
const shouldDeliver=(kind,pref)=>kind==='admin'||kind==='support'||(kind==='publication'?pref?.publication_alerts!==false:feedbackKinds.has(kind)&&pref?.feedback_alerts!==false);
const errorStatus=error=>Number(error?.status)||0;
export async function deliverActivityEmails(db,deps){
 const claimed=await db.rpc('cw_claim_activity_emails',{p_limit:10});if(claimed.error)throw claimed.error;
 const result={sent:0,skipped:0,failed:0};
 for(const job of claimed.data||[]){
  const finish=async values=>{const updated=await db.from('notification_email_queue').update({...values,lease_id:null}).eq('notification_id',job.notification_id).eq('lease_id',job.lease_id);if(updated.error)throw updated.error;};
  try{
   const n=await db.from('notifications').select('id,user_id,kind,title,href').eq('id',job.notification_id).single();if(n.error)throw n.error;
   const [member,pref]=await Promise.all([db.from('users').select('workos_user_id,account_status').eq('id',n.data.user_id).single(),db.from('account_preferences').select('feedback_alerts,publication_alerts').eq('user_id',n.data.user_id).maybeSingle()]);
   if(member.error||pref.error)throw member.error||pref.error;
   if(member.data.account_status!=='active'||!shouldDeliver(n.data.kind,pref.data)){await finish({skipped_at:new Date().toISOString(),last_error:null});result.skipped++;continue;}
   const user=await deps.getUser(member.data.workos_user_id);
   if(!user.emailVerified||!user.email){await finish({skipped_at:new Date().toISOString(),last_error:null});result.skipped++;continue;}
   const response=await deps.fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+deps.apiKey,'Content-Type':'application/json','Idempotency-Key':'activity/'+job.notification_id},body:JSON.stringify({from:deps.from||'TryMyBuild <notifications@trymybuild.com>',to:[user.email],...activityEmail(n.data)}),signal:AbortSignal.timeout(10000)});
   if(!response.ok){const error=Error('Email delivery failed');error.status=response.status;throw error;}
   await finish({sent_at:new Date().toISOString(),last_error:null});result.sent++;
  }catch(error){
   result.failed++;
   const status=errorStatus(error),attempts=Math.max(1,Number(job.attempts)||1),permanent=(status>=400&&status<500&&![408,429].includes(status))||attempts>=8;
   const details=status?`provider:${status}`:attempts>=8?'retry-limit':'temporary';
   await finish(permanent?{failed_at:new Date().toISOString(),last_error:details}:{available_at:new Date(Date.now()+Math.min(3600,60*2**Math.min(attempts,6))*1000).toISOString(),last_error:details});
  }
 }
 return result;
}
