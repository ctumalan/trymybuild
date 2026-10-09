// Shared project presentation and conversation UI for catalog, profiles and public links.
(() => {
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categoryThemes = {"Family life": "coral", "Technology": "teal", "Sports & teams": "blue", "Teaching & learning": "gold", "Shopping": "coral", "Money": "green", "Personal planning": "violet", "Food & home": "gold", "Travel": "blue", "Creative work": "teal", "AI & automation": "violet", "Business & operations": "blue", "Developer tools": "teal", "Design": "coral", "Communication": "blue", "Data & analytics": "violet", "Customer support": "green", "Health & wellness": "green", "Marketing & sales": "coral", "Music & audio": "violet", "Productivity": "teal", "Social & community": "gold", "Security & privacy": "blue", "HR & recruiting": "coral", "Legal": "blue", "Real estate": "green", "Events": "gold", "Gaming": "violet", "Media & entertainment": "coral", "Science & research": "teal", "Sustainability": "green", "Accessibility": "blue", "Utilities": "teal"};
const projectThemes = {afterschooltogether:"afterschool",stackscout:"stackscout",gamegrid:"gamegrid",lessonlab:"lessonlab",cartcompare:"cartcompare",pocketbalance:"pocketbalance",dayframe:"dayframe",mealmap:"mealmap",homerhythm:"homerhythm",packlight:"packlight",briefbuilder:"briefbuilder"};
function theme(product) { const slug=String(product.slug||''); return slug.startsWith('codexnest')?'codexnest':projectThemes[slug]||categoryThemes[product.category]||"teal"; }
const categoryPaths = {
 "Family life": '<circle cx="8.5" cy="7" r="3"/><path d="M3 20v-1.4a5.5 5.5 0 0 1 11 0V20"/><circle cx="17.5" cy="11" r="2.2"/><path d="M14.9 20v-1a3.2 3.2 0 0 1 6.4 0v1"/>',
 "Technology": '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
 "Sports & teams": '<circle cx="12" cy="12" r="9"/><path d="M12 3c2.3 2.2 3.5 5.2 3.5 9S14.3 18.8 12 21M3.5 9h17M3.5 15h17"/>',
 "Teaching & learning": '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H12v17h4.5A3.5 3.5 0 0 1 20 22V5.5Z"/>',
 "Shopping": '<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.6 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6"/>',
 "Money": '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h5M7 10h5M7 14h3"/>',
 "Personal planning": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-13 5 2 2 4-4"/>',
 "Food & home": '<path d="M3 11 12 3l9 8v10h-6v-6H9v6H3V11Z"/>',
 "Travel": '<path d="m22 2-7 20-4-9-9-4 20-7Z"/>',
 "Creative work": '<path d="m12 3 1.7 4.6L18 9.3 13.7 11 12 16l-1.7-5L6 9.3l4.3-1.7L12 3Zm7 11 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/>'
};
function categoryIcon(category) { return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${categoryPaths[category] || categoryPaths.Technology}</svg>`; }
const helpIcon = '<svg class="detail-note-icon detail-note-brand-icon" viewBox="0 0 256 256" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><g stroke-width="10"><path d="M128 22v20M63 43l13 15M193 43l-13 15M35 94h20M201 94h20"/><path d="M79 113a50 50 0 1 1 98 0"/></g><g stroke-width="12"><path d="M35 140c13 44 53 69 95 69 43 0 77-22 91-57"/><path d="M105 185h35v-31l29-17"/></g><circle cx="170" cy="136" r="7" fill="currentColor" stroke="none"/><circle cx="222" cy="151" r="7" fill="currentColor" stroke="none"/></g></svg>';
const tryIcon = '<svg class="detail-note-icon" viewBox="0 0 48 48" aria-hidden="true"><circle cx="22" cy="26" r="13"/><circle cx="22" cy="26" r="7"/><circle class="detail-note-icon-fill" cx="22" cy="26" r="2.5"/><path d="m22 26 11-11M31 9v8h8M33 15l6-6"/></svg>';
function video(value) {
 const url = globalThis.CWMedia?.videoUrl(value);
 return url ? `<div class="project-video project-video-compact"><button type="button" class="project-video-trigger" data-load-video="${esc(url)}"><span class="project-video-play" aria-hidden="true"><svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor"><path d="M6 3.8a.8.8 0 0 1 1.2-.7l9 6.2a.8.8 0 0 1 0 1.4l-9 6.2a.8.8 0 0 1-1.2-.7z"/></svg></span><span>Watch demo</span></button></div>` : '';
}
function hero(product, options = {}) {
 const presentation = product.presentation || {};
  const launchAction = !product.url ? '' : options.disabledLaunch
    ? '<button class="primary-button preview-try-disabled" type="button" disabled aria-label="Try this app, available after saving">Try this app ↗</button>'
    : `<a class="primary-button" href="${esc(product.url)}" target="_blank" rel="noopener noreferrer" ${options.preview?'':`data-try-app="${esc(product.slug)}"`}>Try this app ↗</a>`;
  return `<section class="recipient-hero"><div class="detail-signal-grid" aria-hidden="true"></div><div class="detail-orbit detail-orbit-one" aria-hidden="true"></div><div class="detail-orbit detail-orbit-two" aria-hidden="true"></div><div class="recipient-copy"><p class="detail-product-signal">${product.category?`<span class="detail-category-icon">${categoryIcon(product.category)}</span><span>${esc(product.category)}</span>`:''}</p>${product.price?`<p class="detail-product-meta"><span>${esc(product.price)}</span></p>`:''}<h2 ${options.titleId ? `id="${esc(options.titleId)}"` : ""}>${esc(presentation.headline||product.name)}</h2></div><div class="recipient-preview-column"><div class="recipient-art"><div class="recipient-art-chrome" aria-hidden="true"><span class="recipient-art-controls"><i></i><i></i><i></i></span><strong>Product preview</strong><span class="recipient-art-live"><i class="detail-live-dot"></i>Live</span></div><div class="recipient-art-viewport">${product.preview?`<img ${options.preview?'data-listing-screenshot':''} src="${esc(product.preview)}" alt="Preview of ${esc(product.name)}" referrerpolicy="no-referrer">`:''}</div>${product.url?`<span class="external-destination">${esc(product.url)}</span>`:''}</div><div class="detail-creator">${options.creator || ""}</div>${launchAction}${video(product.video)}</div><div class="recipient-copy recipient-notes-copy"><div class="detail-description-notes"><div><div class="detail-note-label"><span class="detail-note-number">01</span>${helpIcon}<h3>How it helps</h3></div><p>${esc(presentation.help)}</p></div><div><div class="detail-note-label"><span class="detail-note-number">02</span>${tryIcon}<h3>One thing to try first</h3></div><p>${esc(presentation.firstTry)}</p></div></div></div></section>`;
}
function composer(slug) {
 const id = 'public-conversation-' + slug, draft = '';
  return `<form class="detail-comment-form conversation-composer" data-public-comment="${esc(slug)}"><label class="visually-hidden" for="comment-${esc(id)}">Leave a public comment</label><div class="conversation-input-shell"><textarea id="comment-${esc(id)}" name="comment" rows="1" required placeholder="Ask the maker a question or share a thought.">${esc(draft)}</textarea><div class="comment-composer-tools"><details class="conversation-guidelines"><summary aria-label="Comment guidelines">?</summary><p>Discuss the app, not the person. One comment per app; sign in to update yours. Guests appear as Guest. <a href="/community-guidelines">Community guidelines</a></p></details><button class="comment-send" type="submit" aria-label="Post comment" ${draft.trim()?'':'hidden'}><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor"><path d="M3 3.7c-.5-.2-1 .3-.8.8l3 6.5 9.5 1-9.5 1-3 6.5c-.2.5.3 1 .8.8l18-8.5a.9.9 0 0 0 0-1.6L3 3.7Z"/></svg></button></div></div><p data-comment-status role="status" aria-live="polite"></p></form>`;
}
function conversationPost(post) {
  const when = new Date(post.createdAt);
  const dated = Number.isFinite(when.getTime());
  return `<article class="conversation-post"><span class="person-avatar small" aria-hidden="true">${post.avatar ? `<img src="${esc(post.avatar)}" alt="">` : esc(post.initials || 'G')}</span><div class="conversation-post-body"><div class="conversation-bubble"><header><strong>${esc(post.author || 'Guest')}</strong>${post.isCreator === true ? '<span class="conversation-creator">Creator</span>' : ''}</header><p>${esc(post.response)}</p></div>${dated ? `<time datetime="${esc(when.toISOString())}" title="${esc(when.toLocaleString())}">${esc(when.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}))}</time>` : ''}</div></article>`;
}
function conversationFeed(posts) {
  if (!posts.length) return '';
  const sorted = [...posts].sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0));
  return sorted.slice(0,3).map(conversationPost).join('') + (sorted.length>3 ? `<details class="conversation-more"><summary>View all ${sorted.length} comments</summary>${sorted.slice(3).map(conversationPost).join('')}</details>` : '');
}
const reviewAttemptLabels = {completed:'Tried the main feature',stuck:'Tried it and got stuck',blocked:'Could not get started'};
const reviewFocusLabels = {ease:'Ease of use',bugs:'Something went wrong',results:'The results',explanation:'Understanding the app',development:'What to develop next'};
function reviewQuantity(count) { return `${count} ${count === 1 ? 'early user' : 'early users'}`; }
function reviewProof(count) {
  return count > 0 ? `<div class="review-proof" data-review-proof><span class="review-proof-check" aria-hidden="true">&#10003;</span><span><strong>${reviewQuantity(count)}</strong> shared feedback</span></div>` : '';
}
function reviewCard(review) {
  const when = new Date(review.createdAt), dated = Number.isFinite(when.getTime());
  const initials = String(review.author||'Member').split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toUpperCase();
  const signals = [reviewAttemptLabels[review.attempt],reviewFocusLabels[review.focus]].filter(Boolean);
  return `<article class="public-review-card"><header><span class="person-avatar small" aria-hidden="true">${review.avatar?`<img src="${esc(review.avatar)}" alt="">`:esc(initials||'M')}</span><span><strong>${esc(review.author||'TryMyBuild member')}</strong><small>App feedback</small></span>${dated?`<time datetime="${esc(when.toISOString())}">${esc(when.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}))}</time>`:''}</header>${signals.length?`<p class="public-review-signals">${signals.map(signal=>`<span>${esc(signal)}</span>`).join('')}</p>`:''}<p>${esc(review.message)}</p></article>`;
}
function reviewEvidenceMarkup(data) {
 const total=Math.max(0,Number(data.total)||0),publicCount=Math.max(0,Number(data.publicCount)||0);
 const privateCount=Math.max(0,total-publicCount);
 return privateCount ? `<p class="private-review-note">${privateCount} ${privateCount===1?'review shared':'reviews shared'} privately with the creator.</p>` : '';
}
function discussionFeed(posts=[],reviews=[]) {
 const items=[...posts.map(post=>({date:post.createdAt,html:conversationPost(post)})),...reviews.map(review=>({date:review.createdAt,html:reviewCard(review)}))].sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0));
 return items.slice(0,3).map(item=>item.html).join('')+(items.length>3?`<details class="conversation-more"><summary>View all ${items.length} comments and reviews</summary>${items.slice(3).map(item=>item.html).join('')}</details>`:'');
}
function renderDiscussion(region) {
 const feed=region.querySelector('[data-conversation-feed]');if(!feed)return;
 feed.innerHTML=discussionFeed(region.conversationPosts||[],region.reviewEvidence?.reviews||[])+(region.conversationError?'<p class="conversation-empty">Comments couldn’t load. <button type="button" class="text-button" data-conversation-retry>Try again</button></p>':'');
}
function conversation(product, options = {}) {
 const posts = options.posts || [], id = esc(product.slug), reviewCount = Math.max(0,Number(product.communityReviewCount)||0);
  return `<section class="project-conversation conversation-flow" data-conversation="${id}" data-review-total="${reviewCount}" aria-label="Conversation and feedback"><header class="conversation-flow-heading"><span class="conversation-flow-count"><span data-conversation-count>${posts.length}</span> comments</span><span class="conversation-flow-count">· <span data-feedback-count>${reviewCount}</span> <span data-review-count-label>${reviewCount===1?'review':'reviews'}</span></span></header><div data-review-evidence aria-live="polite">${reviewEvidenceMarkup({total:reviewCount,publicCount:0,reviews:[]})}</div><div class="conversation-feed" data-conversation-feed aria-live="polite">${options.loading !== false ? '<p class="conversation-empty">Loading conversation…</p>' : conversationFeed(posts)}</div>${options.composer || composer(product.slug)}<details class="conversation-feedback-inline" data-feedback-expand><summary>Tried the app? <strong>Give feedback →</strong></summary><div class="feedback-tab-intro"><h2>Share your experience</h2><p>Try the app, then share what worked and what could improve.</p></div><div data-inline-feedback data-feedback-slug="${id}"><p role="status">Loading feedback options…</p></div></details></section>`;
}

async function loadProjectConversation(region) {
  if (!region) return;
  const slug = region.dataset.conversation;
  const feed = region.querySelector('[data-conversation-feed]');
  const request = {}; region.conversationRequest = request;
  feed.innerHTML = '<p class="conversation-empty">Loading conversation…</p>';
  try {
    const response = await fetch('/api/experiences?project='+encodeURIComponent(slug));
    const data = await response.json();
    if (!response.ok || data.connected === false || !Array.isArray(data.posts)) throw Error();
    if (!region.isConnected || region.conversationRequest !== request) return;
    const posts = data.posts.filter(post=>post.projectSlug===slug);

    region.conversationPosts=posts;region.conversationError=false;renderDiscussion(region);
    region.querySelector('[data-conversation-count]').textContent = posts.length;
  } catch {
    if (region.isConnected && region.conversationRequest === request) {region.conversationError=true;renderDiscussion(region);}
  }
}
function applyReviewEvidence(region,data) {
  if (!region || !data) return;
  const total=Math.max(0,Number(data.total)||0);region.dataset.reviewTotal=String(total);
  const count=region.querySelector('[data-feedback-count]');if(count){count.textContent=total;count.setAttribute('aria-label',`${total} ${total===1?'review':'reviews'}`);}
  const label=region.querySelector('[data-review-count-label]');if(label)label.textContent=total===1?'review':'reviews';
  region.reviewEvidence=data;renderDiscussion(region);
  const evidence=region.querySelector('[data-review-evidence]');if(evidence)evidence.innerHTML=reviewEvidenceMarkup(data);
}
function recordCommunityReview(region,confirmedTotal) {
  const total=Number.isFinite(Number(confirmedTotal))?Math.max(0,Number(confirmedTotal)):Math.max(0,Number(region?.dataset.reviewTotal)||0)+1;
  applyReviewEvidence(region,{total,publicCount:region?.reviewEvidence?.publicCount||0,reviews:region?.reviewEvidence?.reviews||[]});
}
async function loadProjectReviews(region) {
  if (!region) return;
  const request={};region.reviewRequest=request;
  try {
    const response=await fetch('/api/reviews?project='+encodeURIComponent(region.dataset.conversation)),data=await response.json();
    if(!response.ok||data.connected===false)throw Error();
    if(region.isConnected&&region.reviewRequest===request)applyReviewEvidence(region,data);
  } catch { /* Keep the server-provided aggregate when public evidence is unavailable. */ }
}
globalThis.CWProjectView = {theme,hero,video, conversation, conversationFeed, discussionFeed, loadProjectConversation, loadProjectReviews, recordCommunityReview, applyReviewEvidence};
if (typeof document === 'undefined') return;
document.addEventListener('click', event => {
 const retry = event.target.closest('[data-conversation-retry]');
 if (retry) void loadProjectConversation(retry.closest('[data-conversation]'));
});
// Native catalog drawers are added after page hydration too.
document.addEventListener('toggle', event => {
 const expander=event.target;
 if(expander.matches?.('[data-feedback-expand]')&&expander.open)
  void window.CWGuidedFeedback?.mountInline(expander.querySelector('[data-inline-feedback]'));
},true);
function hydrate() {
 document.querySelectorAll('[data-public-project] [data-conversation]').forEach(region => {
  if (region.dataset.conversationReady) return;
  region.dataset.conversationReady = 'true';
  try {
   if (localStorage.getItem('trymybuild-feedback-ready:'+region.dataset.conversation)) {
    region.dataset.feedbackReady='true';
    const label=region.querySelector('[data-feedback-tab-label]');if(label)label.textContent='Give feedback';
   }
  } catch {}
  void loadProjectConversation(region);void loadProjectReviews(region);
  const expander=region.querySelector('[data-feedback-expand]');
  if(typeof location!=='undefined'&&new URLSearchParams(location.search).get('invite')==='1'&&expander)expander.open=true;
 });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hydrate);
else hydrate();
window.addEventListener('cw-panel-ready', hydrate);
})();
