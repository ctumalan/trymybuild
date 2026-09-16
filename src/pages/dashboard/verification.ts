import type {APIRoute} from 'astro';
import {randomUUID} from 'node:crypto';
import {memberContext,workspace,notice} from '../../server/workspace';
import {signIn,unavailable} from '../../server/feedback-ui';
import {verificationProgress,verificationCard} from '../../server/verification';
export const GET:APIRoute=async context=>{
 try{
  const m=await memberContext(context);if(!m)return signIn('/dashboard/verification');
  const s=await verificationProgress(m.db,m.member.id);
  const form=s.eligible&&!s.verified&&!s.caseId?`<section class="cw-panel"><h2>Confirm your app ownership</h2><p>Share a public link that confirms you control your listed app, such as an app page linking back to your creator profile. Don’t include passwords or identity documents.</p><form method="post" action="/api/dashboard"><input type="hidden" name="action" value="case-create"><input type="hidden" name="section" value="verification"><input type="hidden" name="kind" value="verification"><input type="hidden" name="subject" value="Creator verification review"><input type="hidden" name="id" value="${randomUUID()}"><label for="evidence">Your connection to your app</label><textarea id="evidence" name="message" minlength="10" maxlength="4000" required></textarea><p class="cw-meta">We’ll review your request and reply in Help &amp; contact. Requesting a review does not automatically grant the badge.</p><button class="primary-button">Submit verification request</button></form></section>`:'';
  return workspace('Creator verification',notice(context)+verificationCard(s)+form,'overview',m.admin);
 }catch{return unavailable();}
};
