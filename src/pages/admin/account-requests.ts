import type { APIRoute } from 'astro';
import { adminUser } from '../../server/admin';
import { database } from '../../server/database';
import { surface, e, pageNumber, pages, adminSurface } from '../../server/feedback-ui';
export const GET:APIRoute=async context=>{
 if(!await adminUser(context))return surface('Access required','<h1>Administrator access required.</h1>','',403);
 try {
  const page=pageNumber(context.url.searchParams.get('page')),db=database();
  const r=await db.from('account_deletion_requests').select('id,user_id,requested_at',{count:'exact'}).eq('status','pending').order('requested_at').order('id').range(page*25,page*25+24);
  if(r.error)throw r.error;
  const ids=r.data.map(item=>item.user_id);
  const profiles=ids.length?await db.from('profiles').select('user_id,display_name').in('user_id',ids):{data:[],error:null};
  if(profiles.error)throw profiles.error;
  return adminSurface('Account deletion requests',`<p class="admin-context-note">Review each request with the account holder before any irreversible action. This page records requests; deletion is completed from Privacy requests.</p>${r.data.length?r.data.map(row=>`<article class="cw-panel"><h2>${e(profiles.data?.find(p=>p.user_id===row.user_id)?.display_name||'Member')}</h2><p>Requested ${e(new Date(row.requested_at).toLocaleString('en-US',{timeZone:'America/Los_Angeles'}))} Pacific</p><p class="cw-meta">Member reference: ${e(row.user_id)}</p><a href="/admin/workspace?tab=people">View member →</a></article>`).join(''):'<div class="admin-empty-state"><span aria-hidden="true">✓</span><strong>No pending requests</strong><p>New deletion requests will appear here.</p></div>'}${pages('/admin/account-requests',page,r.count||0)}`,'privacy');
 }catch{return adminSurface('Account deletion requests','<p class="admin-note" role="alert">Requests could not be loaded. Confirm account-security setup is complete, then retry.</p>','privacy',503);}
};
