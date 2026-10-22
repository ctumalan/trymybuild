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
  return adminSurface('Account deletion requests',`<div class="admin-queue-intro"><div><strong>Deletion request queue</strong><p>Confirm the account holder before completing an irreversible deletion.</p></div><span>${r.count||0} pending</span></div><div class="admin-request-list">${r.data.length?r.data.map(row=>{const name=profiles.data?.find(p=>p.user_id===row.user_id)?.display_name||'Member',initials=name.split(/\s+/).map((part:string)=>part[0]).join('').slice(0,2).toUpperCase();return `<article class="admin-account-request"><span class="admin-member-avatar" aria-hidden="true">${e(initials)}</span><div><strong>${e(name)}</strong><small>Requested ${e(new Date(row.requested_at).toLocaleString('en-US',{timeZone:'America/Los_Angeles',month:'short',day:'numeric',year:'numeric'}))}</small><span>Member reference: ${e(row.user_id)}</span></div><em class="admin-status waiting">Pending</em><a class="secondary-button" href="/admin/workspace?tab=people">View member</a></article>`;}).join(''):'<div class="admin-empty-state"><span aria-hidden="true">✓</span><strong>No pending requests</strong><p>New deletion requests will appear here.</p></div>'}</div>${pages('/admin/account-requests',page,r.count||0)}`,'privacy');
 }catch{return adminSurface('Account deletion requests','<p class="admin-note" role="alert">Requests could not be loaded. Confirm account-security setup is complete, then retry.</p>','privacy',503);}
};
