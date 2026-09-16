import type {APIRoute} from 'astro';
import {requestState} from './project-requests';
import {memberContext,workspace,notice} from './workspace';
import {signIn,e,unavailable,pageNumber,pages} from './feedback-ui';
import {OWNED_CARD_FIELDS,ownedProjectCard,miniPreview,savedReviewComposer} from './dashboard-cards';
const savedToggle=(slug:string,title='this project')=>'<button class="secondary-button saved-toggle" type="button" data-save-public="'+e(slug)+'" data-saved="true" aria-label="Save or unsave '+e(title)+'">♥ Saved</button><p data-save-status role="status"></p>';
export const projectDashboard:APIRoute=async context=>{
 const view=context.url.searchParams.get('view');if(!['creator','visitor'].includes(view||''))return context.redirect('/dashboard/overview',302);
 try{const m=await memberContext(context);if(!m)return signIn('/dashboard?view='+view);const page=pageNumber(context.url.searchParams.get('page'));
  if(view==='creator'){
   const [owned,unread]=await Promise.all([m.db.from('projects').select(OWNED_CARD_FIELDS,{count:'exact'}).eq('owner_user_id',m.member.id).order('updated_at',{ascending:false}).order('id').range(page*24,page*24+23),m.db.rpc('cw_project_unread',{p_user:m.member.id})]);if(owned.error)throw owned.error;
   const requests=await requestState(m.db,m.member.id,owned.data.map((p:any)=>p.slug));
   const counts=new Map((unread.data||[]).map((r:any)=>[r.slug,Number(r.unread_count)]));
   return workspace('My projects',`${notice(context)}<div class="projects-heading"><p>All your projects, in one place.</p><a class="primary-button" href="/?listing=settings&amp;new=1">＋ Add project</a></div><div class="owned-project-grid">${owned.data.map((p:any)=>ownedProjectCard(requests(p),unread.error?null:Number(counts.get(p.slug)||0))).join('')||'<p class="cw-panel">Your first project starts with an idea. Add a project to create a private draft.</p>'}</div><nav class="cw-row" aria-label="Project pages">${page?`<a href="?view=creator&amp;page=${page-1}">Previous</a>`:''}<span>${owned.count||0} projects</span>${(page+1)*24<(owned.count||0)?`<a href="?view=creator&amp;page=${page+1}">Next</a>`:''}</nav>`,'creator',m.admin);
  }
  const saved=await m.db.from('saved_projects').select('project_slug',{count:'exact'}).eq('user_id',m.member.id).order('created_at',{ascending:false}).order('project_slug').range(page*12,page*12+11);if(saved.error)throw saved.error;
  const slugs=saved.data.map((r:any)=>r.project_slug);
  const [projects,reviews]=slugs.length?await Promise.all([m.db.from('projects').select('slug,title,preview_public_url,preview_path,is_studio,listing_status,owner_user_id,summary').in('slug',slugs),m.db.from('creator_feedback').select('id,project_slug').eq('author_user_id',m.member.id).in('project_slug',slugs)]):[{data:[],error:null},{data:[],error:null}];if(projects.error||reviews.error)throw Error();
  const cards=slugs.map((slug:string)=>{const p=projects.data.find((r:any)=>r.slug===slug);if(!p||p.listing_status!=='published')return '<article class="saved-project-card"><p>This saved project is no longer publicly available.</p>'+savedToggle(slug)+'</article>';const existing=reviews.data.find((r:any)=>r.project_slug===slug);
   return `<article class="saved-project-card">${miniPreview(p)}<h2><a href="/projects/${e(p.slug)}">${e(p.title)}</a></h2>${savedToggle(p.slug,p.title)}<p>${e(p.summary||'')}</p>${existing?`<p>You’ve already reviewed this project.</p><a class="secondary-button" href="/dashboard/messages?thread=${e(existing.id)}">Read and reply in Messages</a>`:p.owner_user_id===m.member.id?'<p>This is your project. Read visitor feedback in Messages.</p>':`<a class="secondary-button" href="/tell/${e(p.slug)}">Give feedback</a>`}</article>`;}).join('');
  return workspace('Saved apps',`<p>Your useful discoveries, ready to try and review.</p><div class="saved-project-grid">${cards||'<p class="cw-panel">Nothing saved yet. <a href="/">Find an app →</a></p>'}</div><nav class="cw-row">${page?`<a href="?view=visitor&amp;page=${page-1}">Previous</a>`:''}<span>${saved.count||0} saved projects</span>${(page+1)*12<(saved.count||0)?`<a href="?view=visitor&amp;page=${page+1}">Next</a>`:''}</nav><p><a href="/dashboard/messages">All my feedback & replies →</a></p>`,'visitor',m.admin);
 }catch{return unavailable();}
};
