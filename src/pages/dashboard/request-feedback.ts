import type {APIRoute} from 'astro';
import {randomUUID} from 'node:crypto';
import {memberContext,workspace} from '../../server/workspace';
import {signIn,e,unavailable} from '../../server/feedback-ui';
export const GET:APIRoute=async context=>{
 try{
  const m=await memberContext(context);if(!m)return signIn('/dashboard?view=creator');
  const slug=context.url.searchParams.get('project')||'';
  const project=await m.db.from('projects').select('slug,title').eq('slug',slug).eq('owner_user_id',m.member.id).eq('listing_status','published').maybeSingle();
  if(project.error)throw project.error;
  if(!project.data)return new Response('Choose one of your published projects.',{status:404});
  return workspace('Ask for feedback',`<section class="cw-panel"><h2>${e(project.data.title)}</h2><p>Give a willing tester one clear question to answer. For example: “Was it clear how to save your first plan?”</p><form method="post" action="/api/community-credits" data-credit-request><input type="hidden" name="action" value="create"><input type="hidden" name="id" value="${randomUUID()}"><input type="hidden" name="slug" value="${e(slug)}"><input type="hidden" name="returnTo" value="projects"><label>What would you like to learn?<textarea name="question" minlength="10" maxlength="300" required></textarea></label><p>Your question will appear with this published project in the community feedback list. Don’t include private information.</p><p>No credit charge. One open request per creator. Participation is voluntary; a response or introduction is not guaranteed.</p><button class="primary-button">Request feedback</button></form><p><a href="/dashboard?view=creator">Back to My projects</a></p></section>`,'creator',m.admin);
 }catch{return unavailable();}
};
