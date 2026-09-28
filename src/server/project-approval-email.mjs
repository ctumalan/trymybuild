const escape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function projectApprovalEmail(project) {
 const title=String(project.title||'Your project');
 const projectUrl='https://trymybuild.com/projects/'+encodeURIComponent(project.slug);
 const dashboardUrl='https://trymybuild.com/dashboard?view=creator';
 return {subject:'Your project is live on TryMyBuild',text:`${title} has been reviewed and approved. It is now publicly available on TryMyBuild.\n\nView your project: ${projectUrl}\nManage your project: ${dashboardUrl}\n\nShare your project link and invite people to try it and leave feedback.`,html:`<h1>Your project is live!</h1><p><strong>${escape(title)}</strong> has been reviewed and approved. It is now publicly available on TryMyBuild.</p><p><a href="${escape(projectUrl)}">View your project</a> · <a href="${escape(dashboardUrl)}">Manage your project</a></p><p>Share your project link and invite people to try it and leave feedback.</p>`};
}
export async function sendProjectApprovalEmail({project,email},deps={}) {
 const env=deps.env||(key=>process.env[key]||'');
 if(!env('RESEND_API_KEY')||!email)throw Error('Approval email is not configured');
 const message=projectApprovalEmail(project);
 const response=await (deps.fetch||fetch)('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env('RESEND_API_KEY'),'Content-Type':'application/json','Idempotency-Key':`project-approved/${project.id}/${project.lock_version}`},body:JSON.stringify({from:env('PROJECT_REVIEW_FROM')||'TryMyBuild <notifications@trymybuild.com>',to:[email],...message}),signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error(`Approval email failed (${response.status})`);
 return {sent:true};
}
