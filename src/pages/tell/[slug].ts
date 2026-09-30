import type { APIRoute } from 'astro';
import { currentUser } from '../../server/auth';
import { database, databaseReady, ensureMember } from '../../server/database';
import { surface, e, signals, feedbackCard, pageNumber, pages } from '../../server/feedback-ui';
import { validSlug } from '../../server/feedback-policy.mjs';
import { getProjectRow } from '../../server/catalog-db';
import {activeFeedbackRequest,trialBrief} from '../../server/project-requests';
const choices = (name:string, options:Record<string,string>) => `<div class="cw-choices">${Object.entries(options).map(([value,label])=>`<label class="cw-choice"><input type="radio" name="${name}" value="${value}" required>${e(label)}</label>`).join('')}</div>`;
export const GET:APIRoute = async context => {
 const slug=context.params.slug;
 if(!validSlug(slug)) return surface('Not found','<h1>Project not found.</h1>','',404);
 if(!databaseReady()) return surface('Not found','<h1>Project not found.</h1>','',404);
 let product:any=null, ownerId:string|null=null, ownerReady=false, isOwner=false, creator='The creator', creatorAvatar='', publicRows:any[]=[], ownerRows:any[]=[], count=0, existingRow:any=null, trialRequest:any=null;
 const page=pageNumber(context.url.searchParams.get('page'));
 const user=await currentUser(context);
 let ready=false;
 try {
  const db=database();
  const row=await getProjectRow(slug!);
  // Public "Tell the creator" pages exist only for published listings; drafts never leak here.
  if(!row || row.listing_status!=='public' && row.listing_status!=='published') return surface('Not found','<h1>Project not found.</h1>','',404);
  product={ name:row.title, category:row.category, summary:row.summary, preview:row.preview_public_url||`/assets/previews/${slug}.png`, url:row.external_url, firstTry:row.first_try };
  ownerId=row.owner_user_id; ownerReady=!!row.owner_user_id;
  if(row.is_studio) creator='TryMyBuild Studio';
  else if(ownerId){ const prof=await db.from('profiles').select('display_name,avatar_path').eq('user_id',ownerId).maybeSingle(); creator=prof.data?.display_name || 'The creator';creatorAvatar=prof.data?.avatar_path||''; }
  trialRequest=await activeFeedbackRequest(db,slug!);
  const feedback=await db.from('creator_feedback').select('id,author_user_id,helpful,price,message,created_at').eq('project_slug',slug!).eq('visibility','public').eq('moderation_status','published').order('created_at',{ascending:false}).order('id').range(page*25,page*25+24);
  if(feedback.error) throw feedback.error;
  const total=await db.from('creator_feedback').select('id',{count:'exact',head:true}).eq('project_slug',slug!).eq('visibility','public').eq('moderation_status','published');
  if(total.error) throw total.error;
  const ids=[...new Set(feedback.data.map(r=>r.author_user_id))];
  const profiles=ids.length?await db.from('profiles').select('user_id,display_name').in('user_id',ids):{data:[],error:null};
  if(profiles.error)throw profiles.error;
  publicRows=feedback.data.map(r=>({...r,author:profiles.data?.find(p=>p.user_id===r.author_user_id)?.display_name||'Member'}));count=total.count||0;ready=true;
  if(user){
   const member=await ensureMember(user);isOwner=member.id===ownerId;
   if(isOwner){
    const received=await db.from('creator_feedback').select('id,author_user_id,attempt,focus,helpful,price,message,created_at,visibility,moderation_status').eq('project_slug',slug!).order('created_at',{ascending:false}).limit(10);if(received.error)throw received.error;
    const authorIds=[...new Set(received.data.map((r:any)=>r.author_user_id))],authors=authorIds.length?await db.from('profiles').select('user_id,display_name').in('user_id',authorIds):{data:[],error:null};if(authors.error)throw authors.error;
    ownerRows=received.data.map((r:any)=>({...r,author:authors.data?.find((p:any)=>p.user_id===r.author_user_id)?.display_name||'Member'}));
   }else{
    const own=await db.from('creator_feedback').select('id').eq('project_slug',slug!).eq('author_user_id',member.id).maybeSingle();if(own.error)throw own.error;existingRow=own.data;
   }
  }
 } catch {ready=false;}
 if(!product) return surface('Not found','<h1>Project not found.</h1>','',404);
 const url=product.url && product.url.startsWith('projects/')?`/${product.url}`:product.url;
 const isTrial=!!trialRequest?.question;
 const invited=context.url.searchParams.get('invite')==='1';
 const prompt=isTrial?`<div class="trial-form-prompt"><strong>Your task</strong><p>${e(product.firstTry||'Try the main feature and notice what happens.')}</p><strong>${e(creator)} wants to learn</strong><p>${e(trialRequest.question)}</p><small>${e(creator)} has committed to replying within two days.</small></div>`:'';
 const notice=context.url.searchParams.has('error')?'<p class="cw-notice" role="alert">Your feedback was not saved. Complete each choice and write 7–150 words.</p>':'';
 const received=ownerRows.length?`<div class="owner-feedback-list">${ownerRows.map(row=>feedbackCard(row,'Feedback from '+row.author,row.author)).join('')}</div>`:'<p class="owner-feedback-empty">No feedback yet. Invite someone who could genuinely use this app.</p>';
 const ownerForm=ownerRows.length?`<section class="cw-panel owner-feedback-panel" data-guided-panel><div class="owner-feedback-heading"><div><p class="eyebrow">Your app</p><h1>Feedback received</h1><p>${ownerRows.length} ${ownerRows.length===1?'response':'responses'} so far.</p></div><button type="button" class="secondary-button" data-invite-project="${e(slug)}">Invite another tester</button></div>${received}<a class="cw-link" href="/dashboard/messages?project=${encodeURIComponent(product.name)}">View all conversations →</a></section>`:`<section class="cw-panel owner-feedback-panel" data-guided-panel><p class="eyebrow">Your app</p><h1>Get feedback on your app</h1><p>Invite someone to try it and share an honest first reaction.</p>${received}<button type="button" class="primary-button" data-invite-project="${e(slug)}">Invite a tester</button></section>`;
 const form=isOwner?ownerForm:existingRow?`<section class="cw-panel" data-guided-panel><h2>Feedback sent</h2><p>Continue the conversation or read the creator’s reply.</p><a class="primary-button" href="/dashboard/messages?thread=${e(existingRow.id)}">Open conversation →</a></section>`:`<section class="cw-panel" data-guided-panel><h1>${isTrial?'Tell '+e(creator)+' what happened.':invited?'Share your first reaction.':'Tell the creator.'}</h1><p>${isTrial?'A specific observation is more useful than praise.':invited?'Try the app, then return here to share what felt useful, confusing, or missing.':'What worked? What would make it better?'}</p>${prompt}${!ready||!ownerReady?'<p class="cw-notice">This feedback inbox is being connected. You can try the project now; sending feedback isn’t available yet.</p>':''}<form action="/api/feedback" method="post" data-guided-feedback><input type="hidden" name="slug" value="${e(slug)}"><input type="hidden" name="price" value="unsure"><fieldset><legend>1. Were you able to complete the task?</legend>${choices('attempt',{completed:'Yes, I completed it',stuck:'Partly—I got stuck',blocked:'No—I couldn’t get started',not_tried:'I haven’t tried it yet'})}</fieldset><fieldset><legend>2. Where did you hesitate or get stuck?</legend>${choices('focus',{ease:'Finding my way around',bugs:'Something went wrong',results:'The result surprised me',explanation:'I did not understand something',development:'I have an idea for what comes next'})}</fieldset><label for="message" data-review-prompt>3. What did you expect, and what happened?</label><textarea id="message" name="message" maxlength="800" required data-community-field data-counter-id="feedback-word-count" data-compact-counter aria-describedby="feedback-word-count" placeholder="Describe one specific moment. What did you expect to happen next?"></textarea><div class="feedback-field-footer"><small id="feedback-word-count" class="word-counter">0 / 150 words</small><a href="/community-guidelines">Feedback guidelines</a></div><fieldset><legend>4. Would you use this app?</legend>${choices('helpful',{yes:'Yes',somewhat:'With improvements',not_yet:'No',unclear:'Not sure'})}</fieldset><fieldset><legend>Who can see this?</legend>${choices('visibility',{private:'Creator only',public:'Community'})}<p class="cw-meta feedback-visibility-note" data-feedback-visibility-note aria-live="polite">Choose who can see your feedback.</p><noscript><p class="cw-meta">Creator only: visible to you and the creator; admins may access it for safety and support. Community: shown with your display name after review.</p></noscript></fieldset><button class="primary-button" type="submit" ${!ready||!ownerReady?'disabled':''}>${isTrial?'Finish trial and send':'Send feedback'} →</button><p data-guided-status role="status"></p></form></section>`;
 const destination=url?new URL(url,context.url.origin).href:'';
 return surface(`Tell the creator · ${product.name}`,`${notice}<div class="cw-grid"><aside class="cw-project cw-panel"><a href="/projects/${e(slug)}">← Project details</a><img src="${e(product.preview)}" alt="${e(product.name)} website preview"><p class="eyebrow">${e(product.category)}</p><h2>${e(product.name)}</h2><p>${e(product.summary)}</p><p class="cw-meta">${ownerReady?'A conversation with '+e(creator):'This inbox is being connected'}</p>${url?`<a class="primary-button" href="${e(url)}" target="_blank" rel="noopener noreferrer">Try ${e(product.name)} ↗</a><small class="external-destination">${e(destination)}</small>`:''}<p class="cw-meta">Then come back here. Clicking is not proof of use or purchase.</p></aside><div>${trialBrief({firstTry:product.firstTry,creatorName:creator,creatorAvatar},{question:trialRequest?.question})}${form}<section><h2>What people shared</h2><p class="cw-meta">Public, self-reported feedback—not verified purchases or proof of use.</p>${publicRows.length?publicRows.map(row=>`<article class="cw-panel"><strong>${e(row.author)}</strong>${signals(row)}<p class="cw-message">${e(row.message)}</p></article>`).join(''):'<p>No public feedback yet.</p>'}${pages('/tell/'+slug+'?public=1',page,count)}</section></div></div>`);
};
