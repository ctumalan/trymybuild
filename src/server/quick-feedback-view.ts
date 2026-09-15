import {e} from './feedback-ui';
import {quickFeedbackOptions} from './quick-feedback.mjs';
export async function quickFeedbackPanel(db:any,slug:string,owner:string){
 // Verify ownership even when called outside the project dashboard.
 const project=await db.from('projects').select('slug').eq('slug',slug).eq('owner_user_id',owner).maybeSingle();
 if(project.error||!project.data)return '';
 const result=await db.from('quick_app_feedback').select('reasons,created_at').eq('project_slug',slug).order('created_at',{ascending:false}).limit(100);
 if(result.error)return '<section class="cw-panel"><h2>Quick visitor responses</h2><p>Quick responses are not available yet.</p></section>';
 const rows=result.data||[];
 if(!rows.length)return '<section class="cw-panel"><h2>Quick visitor responses</h2><p>No quick responses yet. Visitors can share a few choices after a short visit to your app.</p></section>';
 const counts=Object.entries(quickFeedbackOptions).map(([key,label])=>`<li>${e(label)}: <strong>${rows.filter((r:any)=>r.reasons.includes(key)).length}</strong></li>`).join('');
 return `<section class="cw-panel"><h2>Quick visitor responses</h2><p>Private to you · Latest ${rows.length} responses, up to 100. Visitors can select more than one reason. These are early impressions, not reviews or proof of time spent using the app.</p><ul>${counts}</ul><details><summary>View individual responses</summary>${rows.map((r:any)=>`<p><time>${e(new Date(r.created_at).toLocaleDateString('en-US'))}</time> — ${r.reasons.map((key:string)=>e(quickFeedbackOptions[key as keyof typeof quickFeedbackOptions]||key)).join(' · ')}</p>`).join('')}</details></section>`;
}
