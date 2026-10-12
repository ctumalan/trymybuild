import {createHash} from 'node:crypto';
import {renderStudioInvitation,studioInvitationVersion} from './studio-invitation.mjs';
export const socialFormats={facebook:{width:1200,height:630},instagram:{width:1080,height:1350},story:{width:1080,height:1920}};
const clean=(value,max)=>Array.from(String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim()).slice(0,max).join('');
const hooks={
 afterschooltogether:'Two kids. Three activities. Can you make every pickup?',
 stackscout:'Too many tools. Which ones fit your build?',
 gamegrid:'Game time changed. Is everyone on the same page?',
 pocketbalance:'Where is your money going this month?',
 dayframe:'A full to-do list. A day with limits.',
 mealmap:'Another week. What’s for dinner?',
 homerhythm:'Small home jobs. Easy to forget.',
 packlight:'Ready for the trip. Without the extra baggage.',
 briefbuilder:'An idea in your head. A brief others can use.',
 cartcompare:'Which purchase is actually worth it?',
 lessonlab:'A whole lesson. A limited amount of time.'
};
export function socialCopy(project,overrides={}) {
 return {headline:clean(overrides.headline,110)||hooks[project.slug]||'Give it a try. Share what you think.',
 description:clean(overrides.description,160)||clean(project.presentation?.help||project.summary||project.presentation?.headline||project.category,160)};
}
export function socialImageUrl(project,base,format='facebook',overrides={}) {
 const copy=socialCopy(project,overrides),url=new URL(`/api/social-image/${encodeURIComponent(project.slug)}.png`,base);
 const v=createHash('sha256').update(JSON.stringify([studioInvitationVersion,project.name,project.presentation,project.preview,project.category,project.url,project.creator?.name,copy,format])).digest('hex').slice(0,12);
 url.search=new URLSearchParams({format,...copy,v}).toString();return url.href;
}
export function socialPageUrl(project,base,overrides={}) {
 const url=new URL(`/projects/${encodeURIComponent(project.slug)}`,base);
 url.search=new URLSearchParams({...socialCopy(project,overrides),social:'1'}).toString();return url.href;
}
export async function renderSocialImage(project,screenshot,format='facebook',overrides={}) {
 if(!Object.hasOwn(socialFormats,format))throw Error('Unknown social format');
 return renderStudioInvitation(project,screenshot,{...socialFormats[format],copy:socialCopy(project,overrides)});
}
