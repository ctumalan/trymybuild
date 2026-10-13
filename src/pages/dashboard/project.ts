import {projectDetailContent,projectTheme} from '../../server/project-detail-ui';
import {STUDIO,toClientProject} from '../../server/catalog-db';
import {quickFeedbackPanel} from '../../server/quick-feedback-view';
import type {APIRoute} from 'astro';
import {memberContext,workspace} from '../../server/workspace';
import {signIn,e,unavailable} from '../../server/feedback-ui';
import {projectActions,shortStatus} from '../../server/dashboard-cards';
import {requestState,feedbackRequestAction} from '../../server/project-requests';
export const GET:APIRoute=async context=>{
 try{const m=await memberContext(context);if(!m)return signIn('/dashboard?view=creator');const r=await m.db.from('projects').select('*').eq('slug',context.url.searchParams.get('slug')||'').eq('owner_user_id',m.member.id).maybeSingle();if(r.error)throw r.error;if(!r.data)return new Response('Project not found',{status:404});const withRequest=await requestState(m.db,m.member.id,[r.data.slug]),p=withRequest(r.data);
 const app=toClientProject(p,()=>p.is_studio?STUDIO:{name:m.user.firstName||'You',label:'Your app'});
 const headingActions=p.listing_status==='published'?`<div class="invite-actions"><button type="button" class="secondary-button" data-invite-project="${e(p.slug)}">Share</button></div>`:'';
 return workspace(p.title||'Project',`<div class="recipient-main project-detail-content invitation-detail mealmap-detail owner-app-detail" data-showcase-theme="${e(projectTheme(app))}" data-panel-content data-project-card>
 <header class="public-detail-header"><div><strong>${e(app.name||'Untitled draft')}</strong></div>${projectActions(p)}</header>
 ${projectDetailContent(app,headingActions)}
 <section class="owner-app-management" aria-label="Manage your app"><p><span class="project-status ${e(p.listing_status)}">${e(shortStatus(p.listing_status))}</span></p>
 ${p.listing_status==='published'?`<section class="cw-panel trial-owner-actions"><h2>Invite your first testers</h2><p>Ask one specific question, then send a personal invitation. Commit to replying so testers know a real person is listening.</p><div class="cw-row">${feedbackRequestAction(p)}<button type="button" class="secondary-button" data-invite-project="${e(p.slug)}">Prepare invitation</button></div><p><a href="/guides/first-app-testers">No audience yet? Start here →</a></p></section>`:''}
 <p><a href="/dashboard/messages?project=${encodeURIComponent(p.title)}">Read comments and reply →</a></p>${await quickFeedbackPanel(m.db,p.slug,m.member.id)}<p data-project-action-status role="status"></p></section></div>`,'creator',m.admin);
 }catch{return unavailable();}
};
