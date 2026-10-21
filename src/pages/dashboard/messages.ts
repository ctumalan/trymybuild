import type {APIRoute} from 'astro';
import {memberContext,workspace} from '../../server/workspace';
import {e,signIn,unavailable,pageNumber} from '../../server/feedback-ui';
import {validId} from '../../server/feedback-policy.mjs';
import {directConversation} from '../../server/direct-messages';
import {conversation} from '../../server/conversation';

const initials=(name:string)=>name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'?';
const statusLabel=(status:string)=>status==='published'?'Published publicly':status==='hidden'?'Hidden':'Pending public moderation';

export const GET:APIRoute=async context=>{
 try{
  const m=await memberContext(context);if(!m)return signIn('/dashboard/messages');
  const legacyProject=(context.url.searchParams.get('project')||'').slice(0,80),unread=context.url.searchParams.get('unread')==='1',page=pageNumber(context.url.searchParams.get('inboxPage'));
  const rawKind=context.url.searchParams.get('kind')||'all',kind=rawKind==='project'?'feedback':['feedback','direct','comment'].includes(rawKind)?rawKind:'all';
  const sort=['oldest','project'].includes(context.url.searchParams.get('sort')||'')?context.url.searchParams.get('sort')!:'newest';
  const direct=context.url.searchParams.get('direct'),thread=context.url.searchParams.get('thread'),commentId=context.url.searchParams.get('comment');
  const selectedId=direct||thread;
  const owned=await m.db.from('projects').select('slug,title').eq('owner_user_id',m.member.id);if(owned.error)throw owned.error;
  const requestedApp=(context.url.searchParams.get('app')||'').slice(0,80),legacyApp=owned.data.find((p:any)=>p.slug===legacyProject||p.title.toLowerCase()===legacyProject.toLowerCase());
  const selectedProject=owned.data.find((p:any)=>p.slug===(requestedApp||legacyApp?.slug)),selectedApp=selectedProject?.slug||'';
  const search=(context.url.searchParams.get('q')||(!legacyApp?legacyProject:'')).slice(0,80),inboxSearch=selectedProject?.title||search;
  const rpcKind=kind==='feedback'?'project':kind==='direct'?'direct':'all';
  const result=await m.db.rpc('cw_combined_inbox',{p_user:m.member.id,p_project:inboxSearch,p_unread:unread,p_page:page,p_sort:sort,p_kind:rpcKind});if(result.error)throw result.error;
  const replyable=(kind==='comment'?[]:result.data||[]).map((r:any)=>({...r,kind:r.kind==='project'?'feedback':r.kind}));

  let comments:any[]=[];
  if(kind!=='feedback'&&kind!=='direct'&&!unread&&owned.data.length){
   const commentResult=await m.db.from('project_experiences').select('id,project_slug,author_user_id,response,created_at,moderation_status',{count:'exact'}).in('project_slug',selectedProject?[selectedProject.slug]:owned.data.map((p:any)=>p.slug)).order('created_at',{ascending:false}).range(page*25,page*25+24);if(commentResult.error)throw commentResult.error;
   const authorIds=[...new Set(commentResult.data.map((row:any)=>row.author_user_id).filter(Boolean))];
   const people=authorIds.length?await m.db.from('profiles').select('user_id,display_name,avatar_path').in('user_id',authorIds):{data:[],error:null};if(people.error)throw people.error;
   comments=commentResult.data.map((row:any)=>{
    const project=owned.data.find((p:any)=>p.slug===row.project_slug),person=people.data.find((p:any)=>p.user_id===row.author_user_id);
    return {id:row.id,kind:'comment',title:project?.title||row.project_slug,project_slug:row.project_slug,counterpart:person?.display_name||'Guest',avatar:person?.avatar_path||'',last_message:row.response,last_at:row.created_at,unread:false,moderation_status:row.moderation_status};
   }).filter((row:any)=>!search||(row.title+' '+row.counterpart+' '+row.last_message).toLowerCase().includes(search.toLowerCase()));
  }
  const entries=[...replyable,...comments].sort((a:any,b:any)=>sort==='project'?a.title.localeCompare(b.title):sort==='oldest'?+new Date(a.last_at)-+new Date(b.last_at):+new Date(b.last_at)-+new Date(a.last_at));
  const selected=selectedId&&validId(selectedId)?await (direct?directConversation:conversation)(m.db,m.member.id,selectedId,context.url):null;
  const selectedComment=commentId&&validId(commentId)?comments.find((row:any)=>row.id===commentId):null;
  const selectedKey=selectedComment?'comment:'+selectedComment.id:selectedId?(direct?'direct:':'feedback:')+selectedId:'';
  const query=(updates:Record<string,string|undefined>)=>{const params=new URLSearchParams();if(search)params.set('q',search);if(selectedApp)params.set('app',selectedApp);if(kind!=='all')params.set('kind',kind);if(unread)params.set('unread','1');if(sort!=='newest')params.set('sort',sort);for(const [key,value] of Object.entries(updates)){if(value===undefined)params.delete(key);else params.set(key,value);}const value=params.toString();return '/dashboard/messages'+(value?'?'+value:'');};
  const hrefFor=(row:any)=>row.kind==='direct'?query({direct:row.id}):row.kind==='comment'?query({comment:row.id}):query({thread:row.id});
  const entry=(row:any)=>{
   const key=row.kind+':'+row.id,active=key===selectedKey,type=row.kind==='direct'?'Private message':row.kind==='comment'?'Public comment':'Feedback',contextLabel=row.kind==='direct'?type:`${type} · ${row.title}`;
   return `<a class="message-list-item${row.unread?' is-unread':''}${active?' is-active':''}" href="${hrefFor(row)}" ${active?'aria-current="page"':''}><span class="message-avatar" aria-hidden="true">${row.avatar?`<img src="${e(row.avatar)}" alt="">`:e(initials(row.counterpart))}</span><span class="message-list-copy"><span class="message-person">${e(row.counterpart)}</span><span class="message-context">${e(contextLabel)}</span><span class="message-preview">${e(row.last_message.slice(0,140))}</span></span><span class="message-list-meta"><time datetime="${e(row.last_at)}">${e(new Date(row.last_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}))}</time>${row.unread?'<span class="unread-badge">Unread</span>':''}</span></a>`;
  };
  const publicCommentDetail=selectedComment?`<section class="message-detail-content public-comment-detail" aria-label="Selected public comment"><header class="message-thread-header"><div><span class="message-type-chip">Public comment</span><h2>${e(selectedComment.counterpart)}</h2><p>Comment on ${e(selectedComment.title)}</p></div><a class="message-view-app" href="/projects/${e(selectedComment.project_slug)}" data-panel>View app ↗</a></header><div class="public-comment-status ${e(selectedComment.moderation_status)}">${e(statusLabel(selectedComment.moderation_status))}${selectedComment.moderation_status==='pending'?' <span>(visible to you)</span>':''}</div><article class="public-comment-copy"><p>${e(selectedComment.last_message)}</p><time datetime="${e(selectedComment.last_at)}">${e(new Date(selectedComment.last_at).toLocaleString('en-US'))}</time></article><div class="public-comment-action"><strong>Public comments are read-only in Messages.</strong><p>${selectedComment.moderation_status==='published'?'Continue the discussion where other visitors can see it.':'This comment is not public yet. You can respond on the app page after moderation.'}</p><a class="secondary-button" href="/projects/${e(selectedComment.project_slug)}" data-panel>${selectedComment.moderation_status==='published'?'Reply publicly on your app page →':'View your app →'}</a></div></section>`:'';
  const detail=publicCommentDetail||selected||`<div class="message-detail-empty"><span aria-hidden="true">✉</span><h2>Select a conversation</h2><p>Choose a message on the left to read it and respond when replies are available.</p></div>`;
  const unreadCount=replyable.filter((row:any)=>row.unread).length;
  const tabs=[['all','All'],['unread','Unread'],['feedback','Feedback'],['direct','Private'],['comment','Public comments']].map(([value,label])=>{const current=value==='unread'?unread:!unread&&kind===value;const href=value==='unread'?query({unread:'1',kind:undefined}):query({kind:value==='all'?undefined:value,unread:undefined});return `<a href="${e(href)}" ${current?'aria-current="page"':''}>${e(label)}${value==='unread'&&unreadCount?` <span>${unreadCount}</span>`:''}</a>`;}).join('');
  const appOptions=[...owned.data].sort((a:any,b:any)=>a.title.localeCompare(b.title)).map((p:any)=>`<option value="${e(p.slug)}" ${selectedApp===p.slug?'selected':''}>${e(p.title)}</option>`).join('');
  const toolbar=`<form class="message-controls" method="get" data-message-filters><label class="message-search"><span class="visually-hidden">Search conversations</span><span aria-hidden="true">⌕</span><input name="q" value="${e(search)}" placeholder="Search people or messages…" maxlength="80"></label><label class="message-app-filter"><span>App</span><select name="app" data-message-app><option value="">All apps</option>${appOptions}</select></label>${kind!=='all'?`<input type="hidden" name="kind" value="${e(kind)}">`:''}${unread?'<input type="hidden" name="unread" value="1">':''}<label class="message-sort"><span class="visually-hidden">Sort conversations</span><select name="sort" data-message-sort>${[['newest','Newest first'],['oldest','Oldest first'],['project','App name']].map(([value,label])=>`<option value="${value}" ${sort===value?'selected':''}>${label}</option>`).join('')}</select></label></form><nav class="message-filter-tabs" aria-label="Message types"><span class="message-filter-label">Message type</span>${tabs}</nav>`;
  const notice=context.url.searchParams.has('error')?'<p class="cw-notice" role="alert">That action was not saved. Open the conversation and try again.</p>':context.url.searchParams.has('trial')?'<p class="cw-notice trial-sent-notice" role="status"><strong>Your feedback is with the maker.</strong> They committed to replying. This conversation will continue here.</p>':context.url.searchParams.has('feedback')?'<p class="cw-notice" role="status">Your feedback was sent to the maker.</p>':context.url.searchParams.has('sent')?'<p class="cw-notice" role="status">Reply sent.</p>':context.url.searchParams.has('saved')?'<p class="cw-notice" role="status">Saved successfully.</p>':'';
  const selectedUnavailable=(selectedId&&!selected)||(commentId&&!selectedComment)?'<p class="cw-notice" role="alert">That conversation is unavailable to this account.</p>':'';
  const list=entries.length?entries.map(entry).join(''):`<div class="message-list-empty"><strong>${unread?'You have no unread messages.':'No conversations found.'}</strong><p>${search||selectedApp?'Try a different search or clear the filters.':'Feedback and private messages about your apps will appear here.'}</p>${search||selectedApp||kind!=='all'||unread?'<a href="/dashboard/messages">Clear filters</a>':''}</div>`;
  const pagerParams=new URLSearchParams({...(search?{q:search}:{}),...(selectedApp?{app:selectedApp}:{}),...(kind!=='all'?{kind}:{}),...(unread?{unread:'1'}:{}),...(sort!=='newest'?{sort}: {})});
  const pager=`<nav class="message-pager" aria-label="Inbox pages">${page?`<a href="?${e(pagerParams.toString())}&amp;inboxPage=${page-1}">← Newer</a>`:''}${(replyable.length===25||comments.length===25)?`<a href="?${e(pagerParams.toString())}&amp;inboxPage=${page+1}">Older →</a>`:''}</nav>`;
  return workspace('Messages',`<div class="messages-page${selectedKey?' has-selection':''}"><p class="messages-intro">Feedback and private conversations about your apps.${unreadCount?` <strong>${unreadCount} unread</strong>`:''}</p>${toolbar}${notice}${selectedUnavailable}<div class="messages-inbox"><section class="message-list" aria-label="Conversations"><div class="message-list-scroll">${list}</div>${pager}</section><section class="message-detail" aria-label="Conversation detail"><a class="message-mobile-back" href="${e(query({}))}">← All messages</a>${detail}</section></div></div>`,'messages',m.admin);
 }catch{return unavailable();}
};
