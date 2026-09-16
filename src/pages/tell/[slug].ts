import type { APIRoute } from 'astro';
import { currentUser } from '../../server/auth';
import { database, databaseReady, ensureMember } from '../../server/database';
import { surface, e, signals, pageNumber, pages } from '../../server/feedback-ui';
import { helpfulChoices, priceChoices, validSlug } from '../../server/feedback-policy.mjs';
import { getProjectRow } from '../../server/catalog-db';
import {attemptChoices,focusChoices} from '../../server/feedback-policy.mjs';
import {creditSummaryCopy} from '../../server/credit-rules';
const choices = (name:string, options:Record<string,string>) => `<div class="cw-choices">${Object.entries(options).map(([value,label])=>`<label class="cw-choice"><input type="radio" name="${name}" value="${value}" required>${e(label)}</label>`).join('')}</div>`;
export const GET:APIRoute = async context => {
 const slug=context.params.slug;
 if(!validSlug(slug)) return surface('Not found','<h1>Project not found.</h1>','',404);
 if(!databaseReady()) return surface('Not found','<h1>Project not found.</h1>','',404);
 let product:any=null, ownerId:string|null=null, ownerReady=false, isOwner=false, creator='The creator', publicRows:any[]=[], count=0, existingRow:any=null;
 const page=pageNumber(context.url.searchParams.get('page'));
 const user=await currentUser(context);
 let ready=false;
 try {
  const db=database();
  const row=await getProjectRow(slug!);
  // Public "Tell the creator" pages exist only for published listings; drafts never leak here.
  if(!row || row.listing_status!=='public' && row.listing_status!=='published') return surface('Not found','<h1>Project not found.</h1>','',404);
  product={ name:row.title, category:row.category, summary:row.summary, preview:row.preview_public_url||`/assets/previews/${slug}.png`, url:row.external_url };
  ownerId=row.owner_user_id; ownerReady=!!row.owner_user_id;
  if(row.is_studio) creator='TryMyBuild Studio';
  else if(ownerId){ const prof=await db.from('profiles').select('display_name').eq('user_id',ownerId).maybeSingle(); creator=prof.data?.display_name || 'The creator'; }
  const feedback=await db.from('creator_feedback').select('id,author_user_id,helpful,price,message,created_at').eq('project_slug',slug!).eq('visibility','public').eq('moderation_status','published').order('created_at',{ascending:false}).order('id').range(page*25,page*25+24);
  if(feedback.error) throw feedback.error;
  const total=await db.from('creator_feedback').select('id',{count:'exact',head:true}).eq('project_slug',slug!).eq('visibility','public').eq('moderation_status','published');
  if(total.error) throw total.error;
  const ids=[...new Set(feedback.data.map(r=>r.author_user_id))];
  const profiles=ids.length?await db.from('profiles').select('user_id,display_name').in('user_id',ids):{data:[],error:null};
  if(profiles.error)throw profiles.error;
  publicRows=feedback.data.map(r=>({...r,author:profiles.data?.find(p=>p.user_id===r.author_user_id)?.display_name||'Member'}));count=total.count||0;ready=true;
  if(user){const member=await ensureMember(user);isOwner=member.id===ownerId;const own=await db.from('creator_feedback').select('id').eq('project_slug',slug!).eq('author_user_id',member.id).maybeSingle();if(own.error)throw own.error;existingRow=own.data;}
 } catch {ready=false;}
 if(!product) return surface('Not found','<h1>Project not found.</h1>','',404);
 const url=product.url && product.url.startsWith('projects/')?`/${product.url}`:product.url;
 const notice=context.url.searchParams.has('error')?'<p class="cw-notice" role="alert">Your feedback was not saved. Complete each choice and write 7–150 words.</p>':'';
 const form=isOwner?'<section class="cw-panel" data-guided-panel><h1>Invite an honest conversation.</h1><p>This is your project’s feedback page. Share its address with someone who might use it.</p><a class="primary-button" href="/dashboard?view=creator">Open my creator inbox →</a><p class="cw-meta">Creators don’t submit reviews of their own projects.</p></section>':existingRow?`<section class="cw-panel" data-guided-panel><h2>Your conversation is already started.</h2><p>Add an update or see the creator’s reply.</p><a class="primary-button" href="/dashboard/messages?thread=${e(existingRow.id)}">Open my conversation →</a></section>`:`<section class="cw-panel" data-guided-panel><h1>Tell the creator.</h1><p>What worked? What would make it better?</p>${!ready||!ownerReady?'<p class="cw-notice">This feedback inbox is being connected. You can try the project now; sending feedback isn’t available yet.</p>':''}<form action="/api/feedback" method="post" data-guided-feedback><input type="hidden" name="slug" value="${e(slug)}"><fieldset><legend>1. What did you try?</legend>${choices('attempt',attemptChoices)}</fieldset><fieldset><legend>2. Did it help you?</legend>${choices('helpful',{yes:'Very useful',somewhat:'Somewhat useful',not_yet:'Not useful for me',unclear:'I couldn’t tell'})}</fieldset><fieldset><legend>3. How did the price feel?</legend>${choices('price',priceChoices)}</fieldset><fieldset><legend>4. What is your feedback about?</legend>${choices('focus',focusChoices)}</fieldset><label for="message" data-review-prompt>What did you try, and what happened?</label><textarea id="message" name="message" maxlength="800" required data-community-field data-counter-id="feedback-word-count" aria-describedby="feedback-conduct feedback-word-count" placeholder="Give one specific example and a suggestion, if you have one…"></textarea><p id="feedback-conduct" class="comment-conduct"><strong>Be thoughtful. Be respectful.</strong> Discuss the project, not the person. Share constructive observations using clear, considerate language. Insults, harassment, and abusive wording aren’t welcome. Honest disagreement is. <a href="/community-guidelines">Guidelines</a></p><small id="feedback-word-count" class="word-counter">0 / 7–150 words</small>${creditSummaryCopy}<fieldset><legend>5. Who can see your feedback?</legend>${choices('visibility',{private:'Just me and the creator',public:'Share with the community'})}<p class="cw-meta">Public feedback includes your display name and appears after review. Private feedback is never included in public reviews. Administrators may access records for safety and support.</p></fieldset><button class="primary-button" type="submit" ${!ready||!ownerReady?'disabled':''}>Send to the creator →</button><p data-guided-status role="status"></p></form></section>`;
 return surface(`Tell the creator · ${product.name}`,`${notice}<div class="cw-grid"><aside class="cw-project cw-panel"><a href="/?project=${e(slug)}">← Project details</a><img src="${e(product.preview)}" alt="${e(product.name)} website preview"><p class="eyebrow">${e(product.category)}</p><h2>${e(product.name)}</h2><p>${e(product.summary)}</p><p class="cw-meta">${ownerReady?'A conversation with '+e(creator):'This inbox is being connected'}</p>${url?`<a class="primary-button" href="${e(url)}" target="_blank" rel="noopener noreferrer">Try ${e(product.name)} ↗</a>`:''}<p class="cw-meta">Then come back here. Clicking is not proof of use or purchase.</p></aside><div>${form}<section><h2>What people shared</h2><p class="cw-meta">Public, self-reported feedback—not verified purchases. Pricing opinions are separate from usefulness.</p>${publicRows.length?publicRows.map(row=>`<article class="cw-panel"><strong>${e(row.author)}</strong>${signals(row)}<p class="cw-message">${e(row.message)}</p></article>`).join(''):'<p>No public feedback yet.</p>'}${pages('/tell/'+slug+'?public=1',page,count)}</section></div></div>`);
};
