import type { APIContext } from 'astro';
import { currentUser, env } from './auth';
import { database, ensureMember } from './database';
import { isFounder } from './admin-policy.mjs';
import { surface, e } from './feedback-ui';
export async function memberContext(context:APIContext) {
 const user=await currentUser(context); if(!user)return null;
 return {user,member:await ensureMember(user),db:database(),admin:isFounder(user.id,env('FOUNDER_WORKOS_USER_ID'),user.email,env('FOUNDER_EMAIL'),user.emailVerified)};
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
 const landscape=active==='overview'?'<svg class="workspace-landscape" viewBox="0 0 390 92" aria-hidden="true"><circle cx="295" cy="25" r="21" fill="#ffe5a6"/><path d="M8 76c52-35 96-43 140-15 53-36 109-40 164-10 28-11 50-10 70-1v34H8Z" fill="#edf5ef"/><path d="M8 80c67-18 128-23 184-6 66-36 123-32 190-8v18H8Z" fill="#dfece3"/><path d="M272 84c13-18 32-28 57-31-18 8-31 18-40 31" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M96 66v-28m-5 13c0-8 2-15 5-19 4 4 6 11 6 19m213 3V22m-6 16c0-10 2-20 6-25 5 6 7 15 7 25" stroke="#4e8064" stroke-width="3" stroke-linecap="round"/></svg>':'';
 const intro=active==='overview'?'<p class="workspace-intro">Build, get feedback, and make progress — one step at a time.</p>':'';
 return surface(title,`<header class="workspace-heading ${identity?'workspace-welcome':''}">${picture}<div><h1>${e(title)}</h1>${identity?.verified?`<span class="creator-verified welcome-verified" title="${identity.founderException?'Founder exception—not earned through feedback':'Qualifying contribution and app ownership confirmed'}">✓ Verified</span>`:''}${intro}</div>${landscape}</header>${body}`,active,200,admin,false,{sidebarIdentity:identity});
}
export const empty=(text:string)=>`<p class="cw-empty">${e(text)}</p>`;
