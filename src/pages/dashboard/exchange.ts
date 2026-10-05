import type {APIRoute} from 'astro';
import {randomUUID} from 'node:crypto';
import {memberContext,workspace,notice} from '../../server/workspace';
import {signIn,unavailable} from '../../server/feedback-ui';
import {exchangeStatus,exchangeJoinForm} from '../../server/maker-exchange-view';
export const GET:APIRoute=async context=>{
 try{
  const m=await memberContext(context);if(!m)return signIn('/dashboard/exchange');
  const [state,projects,request]=await Promise.all([
   m.db.rpc('cw_maker_exchange_state',{p_user:m.member.id}),
   m.db.from('projects').select('slug,title').eq('owner_user_id',m.member.id).eq('listing_status','published').eq('visibility','public').order('updated_at',{ascending:false}),
   m.db.from('feedback_requests').select('id,project_slug,question').eq('user_id',m.member.id).eq('status','queued').limit(1).maybeSingle()
  ]);
  if(state.error||projects.error||request.error)throw Error('Exchange unavailable');
  const entry=state.data,canJoin=!entry||entry.complete||!['waiting','matched'].includes(entry.state);
  return workspace('Swap app feedback',`${notice(context)}<p>Two app creators help each other by trying each other’s apps and sharing feedback.</p>${exchangeStatus(entry)}${canJoin?exchangeJoinForm(projects.data,request.data,randomUUID()):''}<p><a href="/community-guidelines">Feedback guidelines</a> · <a href="/dashboard/messages">Your conversations</a></p>`,'exchange',m.admin);
 }catch{return unavailable();}
};
