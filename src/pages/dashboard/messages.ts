import type {APIRoute} from 'astro';
import {memberContext,workspace} from '../../server/workspace';
import {e,signIn,unavailable,pageNumber} from '../../server/feedback-ui';
import {validId} from '../../server/feedback-policy.mjs';
import {directConversation} from '../../server/direct-messages';
import {quickFeedbackPanel} from '../../server/quick-feedback-view';
import {conversation} from '../../server/conversation';
export const GET:APIRoute=async context=>{
 try{const m=await memberContext(context);if(!m)return signIn('/dashboard/messages');
  const project=(context.url.searchParams.get('project')||'').slice(0,80),unread=context.url.searchParams.get('unread')==='1',page=pageNumber(context.url.searchParams.get('inboxPage')),direct=context.url.searchParams.get('direct'),id=direct||context.url.searchParams.get('thread'),kind=['project','direct'].includes(context.url.searchParams.get('kind')||'')?context.url.searchParams.get('kind')!:'all',sort=['oldest','project'].includes(context.url.searchParams.get('sort')||'')?context.url.searchParams.get('sort')!:'newest';
  const owned=await m.db.from('projects').select('slug,title').eq('owner_user_id',m.member.id);if(owned.error)throw owned.error;
  const inboxProject=owned.data.find((p:any)=>p.slug===project)?.title||project;
  const result=await m.db.rpc('cw_combined_inbox',{p_user:m.member.id,p_project:inboxProject,p_unread:unread,p_page:page,p_sort:sort,p_kind:kind});if(result.error)throw result.error;
  const rows=result.data||[],params=new URLSearchParams({project,sort,kind,...(unread?{unread:'1'}:{})});
  const selected=id&&validId(id)?await (direct?directConversation:conversation)(m.db,m.member.id,id,context.url):null;
  const filter=`<form class="cw-message-toolbar" method="get"><label>Find a project or person<input name="project" value="${e(project)}" placeholder="Project or person" maxlength="80"></label><label>Type<select name="kind">${[['all','All conversations'],['project','Project feedback'],['direct','Private messages']].map(([v,l])=>`<option value="${v}" ${kind===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Show<select name="unread"><option value="0">All messages</option><option value="1" ${unread?'selected':''}>Unread only</option></select></label><label>Sort<select name="sort">${[['newest','Newest first'],['oldest','Oldest first'],['project','Project name']].map(([v,l])=>`<option value="${v}" ${sort===v?'selected':''}>${l}</option>`).join('')}</select></label><button class="secondary-button">Apply</button><a href="/dashboard/messages">Reset</a></form>`;
  const item=(r:any,body='')=>`<details class="message-item" data-conversation="${e(r.id)}" data-conversation-kind="${e(r.kind)}" ${body?'open':''}><summary><strong>${e(r.title)}</strong><small>${r.kind==='direct'?'Private message · ':''}${r.unread?'● Unread · ':''}${e(new Date(r.last_at).toLocaleDateString('en-US'))}</small><small>${e(r.counterpart)}</small><p>${e(r.last_message.slice(0,140))}</p></summary><div class="message-body" ${body?'data-loaded="true"':''}>${body}</div></details>`;
  let contents=rows.map((r:any)=>item(r,r.id===id?selected||'':'')).join('');
  if(selected&&!rows.some((r:any)=>r.id===id))contents=`<details class="message-item" data-conversation="${e(id)}" data-conversation-kind="${direct?'direct':'project'}" open><summary><strong>Selected conversation</strong></summary><div class="message-body" data-loaded="true">${selected}</div></details>`+contents;
  const notice=context.url.searchParams.has('error')?'<p class="cw-notice" role="alert">That action was not saved. Reload the conversation and try again.</p>':context.url.searchParams.has('sent')||context.url.searchParams.has('saved')?'<p class="cw-notice" role="status">Saved successfully.</p>':'';
  const matched=owned.data.filter((p:any)=>!project||(p.slug+' '+p.title).toLowerCase().includes(project.toLowerCase()));
  let activity='';if(kind!=='direct'&&!unread&&matched.length){
   const comments=await m.db.from('project_experiences').select('id,project_slug,response,created_at,moderation_status').in('project_slug',matched.map((p:any)=>p.slug)).order('created_at',{ascending:false}).range(page*25,page*25+24);if(comments.error)throw comments.error;
   activity=`<section class="cw-panel"><h2>Project comments</h2>${comments.data.map((c:any)=>`<article class="project-comment-message"><strong>${e(matched.find((p:any)=>p.slug===c.project_slug)?.title||c.project_slug)}</strong><small class="cw-meta">${e(new Date(c.created_at).toLocaleDateString('en-US'))} · ${c.moderation_status==='published'?'Published':c.moderation_status==='hidden'?'Hidden':'Awaiting review'}</small><p>${e(c.response)}</p><a href="/projects/${e(c.project_slug)}">View app and conversation →</a></article>`).join('')||'<p>No project comments yet.</p>'}${comments.data.length===25?`<a href="?${e(params.toString())}&amp;inboxPage=${page+1}">More comments →</a>`:''}</section>`;
   if(project){for(const p of matched)activity+=await quickFeedbackPanel(m.db,p.slug,m.member.id);}
  }
  return workspace('Messages' ,`${filter}${notice}${id&&!selected?'<p class="cw-notice">That conversation is unavailable to this account.</p>':''}<div class="message-stream">${contents||'<p class="cw-panel">No conversations match these filters. Your project conversations and replies will appear here.</p>'}</div>${activity}<nav class="cw-row" aria-label="Inbox pages">${page?`<a href="?${e(params.toString())}&amp;inboxPage=${page-1}">Previous</a>`:''}${rows.length===25&&Number(rows[0]?.total_count)>(page+1)*25?`<a href="?${e(params.toString())}&amp;inboxPage=${page+1}">Next</a>`:''}</nav>`,'messages',m.admin);
 }catch{return unavailable();}
};
