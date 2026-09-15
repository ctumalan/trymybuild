import {quickFeedbackPanel} from '../../server/quick-feedback-view';
import type {APIRoute} from 'astro';
import {memberContext,workspace} from '../../server/workspace';
import {signIn,e,unavailable} from '../../server/feedback-ui';
import {projectActions,shortStatus} from '../../server/dashboard-cards';
export const GET:APIRoute=async context=>{
 try{const m=await memberContext(context);if(!m)return signIn('/dashboard?view=creator');const r=await m.db.from('projects').select('*').eq('slug',context.url.searchParams.get('slug')||'').eq('owner_user_id',m.member.id).maybeSingle();if(r.error)throw r.error;if(!r.data)return new Response('Project not found',{status:404});const p=r.data;
 return workspace(p.title||'Project',`<div data-panel-content data-project-card><div class="projects-heading"><h1>${e(p.title||'Untitled draft')}</h1>${projectActions(p)}</div><p><span class="project-status ${e(p.listing_status)}">${e(shortStatus(p.listing_status))}</span> · ${e(p.price_label||'Free')} · ${e(p.category)}</p>${p.preview_public_url?`<img src="${e(p.preview_public_url)}" alt="Project preview" style="max-height:320px">`:''}<h2>What it does</h2><p>${e(p.headline||p.summary||'Not added yet')}</p><h2>How it helps</h2><p>${e(p.help_text||'Not added yet')}</p><h2>Try first</h2><p>${e(p.first_try||'Not added yet')}</p><p><a href="/dashboard/messages?project=${encodeURIComponent(p.title)}">Read comments and reply →</a></p>${await quickFeedbackPanel(m.db,p.slug,m.member.id)}<p data-project-action-status role="status"></p></div>`,'creator',m.admin);
 }catch{return unavailable();}
};
