import type {APIRoute} from 'astro';
import {randomUUID} from 'node:crypto';
import {memberContext,workspace} from '../../server/workspace';
import {signIn,e,unavailable} from '../../server/feedback-ui';
export const GET:APIRoute=async context=>{
 try{
  const m=await memberContext(context);if(!m)return signIn('/dashboard?view=creator');
  const slug=context.url.searchParams.get('project')||'';
  const project=await m.db.from('projects').select('slug,title,first_try').eq('slug',slug).eq('owner_user_id',m.member.id).eq('listing_status','published').maybeSingle();
  if(project.error)throw project.error;
  if(!project.data)return new Response('Choose one of your published projects.',{status:404});
  return workspace('Ask for feedback',`<section class="cw-panel"><p class="eyebrow">Short tester trial</p><h2>${e(project.data.title)}</h2><p><strong>Tester’s task:</strong> ${e(project.data.first_try||'Try the main feature and notice what happens.')}</p><p>Ask one neutral, specific question. Avoid questions such as “Do you love it?” Example: “Was it clear how to save your first plan?”</p><form method="post" action="/api/community-credits" data-credit-request><input type="hidden" name="action" value="create"><input type="hidden" name="id" value="${randomUUID()}"><input type="hidden" name="slug" value="${e(slug)}"><input type="hidden" name="returnTo" value="projects"><label>What would you like to learn?<textarea name="question" minlength="10" maxlength="300" required></textarea></label><p>This question will appear in the project’s trial brief. Don’t include private information.</p><label class="legal-agreement"><input type="checkbox" name="responseCommitment" required><span>I will personally reply to each tester within two days.</span></label><p>One open request per creator. Participation is voluntary, and TryMyBuild does not guarantee a match.</p><button class="primary-button">Open feedback request</button></form><p><a href="/dashboard?view=creator">Back to My projects</a></p></section>`,'creator',m.admin);
 }catch{return unavailable();}
};
