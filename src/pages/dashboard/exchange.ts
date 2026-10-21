import type {APIRoute} from 'astro';
import {randomUUID} from 'node:crypto';
import {memberContext,workspace,notice} from '../../server/workspace';
import {signIn,unavailable} from '../../server/feedback-ui';
import {exchangeStatus,exchangeJoinForm,exchangeHowItWorks} from '../../server/maker-exchange-view';
export const GET:APIRoute=async context=>{
 try{
  const m=await memberContext(context);if(!m)return signIn('/dashboard/exchange');
  const [state,projects,request]=await Promise.all([
   m.db.rpc('cw_maker_exchange_state',{p_user:m.member.id}),
   m.db.from('projects').select('slug,title,preview_public_url,preview_path,is_studio').eq('owner_user_id',m.member.id).eq('listing_status','published').eq('visibility','public').order('updated_at',{ascending:false}),
   m.db.from('feedback_requests').select('id,project_slug,question').eq('user_id',m.member.id).eq('status','queued').limit(1).maybeSingle()
  ]);
  if(state.error||projects.error||request.error)throw Error('Exchange unavailable');
  const entry=Array.isArray(state.data)?state.data[0]||null:state.data;
  const canJoin=!entry||entry.complete||!['waiting','matched'].includes(entry.state);
  const status=exchangeStatus(entry);
  const content=canJoin
   ?`${status}<div class="exchange-onboarding" data-exchange-onboarding><div data-exchange-intro>${exchangeHowItWorks()}</div>${exchangeJoinForm(projects.data,request.data,randomUUID())}</div>`
   :`<div class="exchange-active">${status}</div>`;
  return workspace('Swap app feedback',`${notice(context)}<div class="exchange-page"><p class="exchange-lead">Get a useful outside perspective by showing up for another maker too.</p>${content}</div>`,'exchange',m.admin);
 }catch{return unavailable();}
};
