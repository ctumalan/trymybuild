import {communityMap} from '../../server/community-map';
import type {APIRoute} from 'astro';
import {memberContext,workspace,notice} from '../../server/workspace';
import {signIn,e,unavailable} from '../../server/feedback-ui';
import {creditSummary,feedbackQueue} from '../../server/community-credits';
export const GET:APIRoute=async context=>{
 try{const m=await memberContext(context);if(!m)return signIn('/dashboard/community');const [s,queue]=await Promise.all([creditSummary(m.db,m.member.id),feedbackQueue(m.db,m.member.id)]);
  const body=`${notice(context)}${communityMap(s)}<section id="review-projects"><h2>Projects asking for your perspective</h2><p>Choose something you can meaningfully try. Feedback must contain 7–150 words and discuss the project respectfully.</p>${queue.map((x:any)=>`<article class="cw-panel"><p class="eyebrow">${e(x.project.category)}</p><h3>${e(x.project.title)}</h3><p>${e(x.project.summary)}</p><p><strong>The creator’s question:</strong> ${e(x.question||'Was the first task clear, and what would make it easier?')}</p><a class="primary-button" href="/projects/${e(x.project_slug)}">Try this project</a> <a class="secondary-button" href="/tell/${e(x.project_slug)}">Give feedback</a></article>`).join('')||'<p class="cw-panel">No projects are waiting right now. Browse the catalog and help any project that interests you.</p>'}</section><details class="cw-panel contribution-history"><summary>Your contribution history</summary>${s.qualifications.slice(0,10).map((q:any)=>`<article class="contribution-row"><strong>${e(q.project_slug)}</strong><p>${e(q.status)} · ${e(q.reason)}</p></article>`).join('')||'<p class="cw-panel">Your qualifying project feedback will appear here.</p>'}<p><a href="/community-guidelines">Read the Community Guidelines</a></p></details>`;
  return workspace('Give & receive feedback',body,'community',m.admin);
 }catch{return unavailable();}
};
