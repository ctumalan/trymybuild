import type { APIContext } from 'astro';
import { currentUser, env } from './auth';
import { database, ensureMember } from './database';
import { isFounder } from './admin-policy.mjs';
import { surface, e } from './feedback-ui';
export async function memberContext(context:APIContext) {
 const user=await currentUser(context); if(!user)return null;
 return {user,member:await ensureMember(user),db:database(),admin:isFounder(user.id,env('FOUNDER_WORKOS_USER_ID'))};
}
export function notice(context:APIContext) {
 const error=context.url.searchParams.get('error');
 if(error==='eligibility')return '<p class="cw-notice" role="alert">Your verification request was not confirmed. You need five qualifying approved reviews across three other creators, a published app, and an active independent creator account. If those requirements are met, try again or contact Help &amp; contact.</p>';
 if(error==='reauth')return '<p class="cw-notice" role="alert">No account was removed. Your identity confirmation expired. Confirm your identity in <a href="/dashboard/security">Account &amp; security</a>, then retry within five minutes.</p>';
 if(error==='cleanup')return '<p class="cw-notice" role="alert">The account is removed from the site, but external cleanup is not complete. See Privacy requests to retry the unfinished cleanup.</p>';
 return context.url.searchParams.has('saved')?'<p class="cw-notice" role="status">Your changes were saved.</p>':context.url.searchParams.has('error')?'<p class="cw-notice" role="alert">That change was not confirmed. Reload and try again.</p>':'';
}
export function workspace(title:string,body:string,active:string,admin=false,identity?:{name:string,avatar?:string,verified?:boolean,founderException?:boolean}) {
 const initials=(identity?.name||'Member').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
 const picture=identity?`<span class="workspace-avatar">${identity.avatar?`<img src="${e(identity.avatar)}" alt="">`:e(initials)}</span>`:'';
 return surface(title,`<header class="workspace-heading ${identity?'workspace-welcome':''}">${picture}<div><h1>${e(title)}</h1>${identity?.verified?`<span class="creator-verified welcome-verified" title="${identity.founderException?'Founder exception—not earned through feedback':'Qualifying contribution and app ownership confirmed'}">✓ Verified Creator</span>`:''}</div></header>${body}`,active,200,admin);
}
export const empty=(text:string)=>`<p class="cw-empty">${e(text)}</p>`;
