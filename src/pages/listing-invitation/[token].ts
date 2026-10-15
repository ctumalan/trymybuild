import type {APIRoute} from 'astro';
import {loadInvitation} from '../../server/listing-invitation-store';
import {invitationOpen} from '../../server/listing-invitation.mjs';
import {invitationFields,invitationAssets} from '../../server/listing-invitation-view';
import {surface,e,unavailable} from '../../server/feedback-ui';
import {currentUser} from '../../server/auth';
import {ensureMember} from '../../server/database';
import {renderInvitationFeedback} from '../../server/invitation-feedback.mjs';
import {invitationCatalogPage} from '../../server/invitation-catalog-view';
import {listPublished} from '../../server/catalog-db';
export const GET:APIRoute=async context=>{
 try{
  const token=context.params.token||'',row=await loadInvitation(token);
  const user=await currentUser(context),sameEmail=user?.emailVerified&&user.email.trim().toLowerCase()===row?.recipient_email;
  if(row?.claimed_by&&sameEmail){
   const member=await ensureMember(user!);
   if(member.id===row.claimed_by)return privatePage(surface('Your app is saved',`${invitationAssets}<section class="cw-panel"><h1>Your app is saved.</h1><p>You manage this listing from your dashboard. It was saved as a private draft. Only you can choose to publish it.</p><a class="primary-button" href="/dashboard?view=creator">Open my apps</a></section>${renderInvitationFeedback(row.id)}`));
  }
  if(!invitationOpen(row))return privatePage(surface('Preview unavailable','<section class="cw-panel"><h1>This preview is no longer available.</h1><p>The invitation may have expired, been withdrawn or already been claimed.</p><a href="/?listing=settings">Create your own app listing</a></section>','',410));
  const wrongAccount=!!user&&!sameEmail;
  const form=`<form class="cw-panel" data-listing-invitation-claim data-token="${e(token)}" data-version="${row.lock_version}" data-authenticated="${!!user}" data-matching-account="${!!sameEmail}"><p class="eyebrow">Make it yours</p><h2>Edit your app’s introduction</h2><p>Confirm the details before saving your private draft.</p>${invitationFields(row)}<label class="cw-choice"><input name="confirm" type="checkbox" value="yes" required> This is my app and I can manage its listing.</label><label class="cw-choice"><input name="terms" type="checkbox" value="yes" required> <span>I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span></label>${wrongAccount?`<p role="alert">You’re signed in as ${e(user!.email)}. Use the email address that received this invitation to claim it.</p><p>Switch accounts from the app preview, then use the invited email.</p>`:`<button class="primary-button" type="submit">${user?'Save this app to my account':'Continue to save my app'}</button>`}<p data-invitation-status role="status"></p><p class="cw-meta">${user?'':'You’ll create an account or sign in with the email that received this invitation. '}Saving is free and creates a private draft. Review the screenshot and publishing options in your dashboard before making it public.</p></form>`;
  let published:any[]=[];try{published=await listPublished();}catch{/* The private invitation remains usable if catalog reads fail. */}
  return privatePage(surface('A preview for '+row.title,invitationAssets+invitationCatalogPage(row,token,published,!!sameEmail,wrongAccount,form),'',200,false,false,{invitation:true}));
 }catch{return privatePage(unavailable());}
};
function privatePage(response:Response){response.headers.set('Referrer-Policy','no-referrer');response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');return response;}
