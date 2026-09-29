// Shared project presentation and conversation UI for catalog, profiles and public links.
(() => {
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categoryThemes = {"Family life": "coral", "Technology": "teal", "Sports & teams": "blue", "Teaching & learning": "gold", "Shopping": "coral", "Money": "green", "Personal planning": "violet", "Food & home": "gold", "Travel": "blue", "Creative work": "teal", "AI & automation": "violet", "Business & operations": "blue", "Developer tools": "teal", "Design": "coral", "Communication": "blue", "Data & analytics": "violet", "Customer support": "green", "Health & wellness": "green", "Marketing & sales": "coral", "Music & audio": "violet", "Productivity": "teal", "Social & community": "gold", "Security & privacy": "blue", "HR & recruiting": "coral", "Legal": "blue", "Real estate": "green", "Events": "gold", "Gaming": "violet", "Media & entertainment": "coral", "Science & research": "teal", "Sustainability": "green", "Accessibility": "blue", "Utilities": "teal"};
function theme(product) { return product.slug === "stackscout" ? "stackscout" : categoryThemes[product.category] || "teal"; }
function hero(product, options = {}) {
 const presentation = product.presentation || {};
  return `<div class="detail-creator">${options.creator || ""}</div><section class="recipient-hero"><div class="recipient-copy"><h2 ${options.titleId ? `id="${esc(options.titleId)}"` : ""}>${esc(presentation.headline||product.name)}</h2><div class="detail-description-notes"><div><h3>How it helps</h3><p>${esc(presentation.help)}</p></div><div><h3>One thing to try first</h3><p>${esc(presentation.firstTry)}</p></div></div></div><div class="recipient-preview-column"><div class="recipient-art">${product.preview?`<img ${options.preview?'data-listing-screenshot':''} src="${esc(product.preview)}" alt="Preview of ${esc(product.name)}" referrerpolicy="no-referrer">`:''}<span>Made by a person. Ready for your perspective.</span></div>${product.url?`<a class="primary-button" href="${esc(product.url)}" target="_blank" rel="noopener noreferrer" ${options.preview?'':`data-try-app="${esc(product.slug)}"`}>Try this app ↗</a><small class="external-destination">${esc(product.url)}</small>`:''}</div></section>`;
}
function composer(slug) {
 const id = 'public-conversation-' + slug, draft = '', count = 0;
  return `<form class="detail-comment-form conversation-composer" data-public-comment="${esc(slug)}"><label class="visually-hidden" for="comment-${esc(id)}">Leave a public comment</label><textarea id="comment-${esc(id)}" name="comment" maxlength="800" rows="2" required aria-describedby="comment-count-${esc(id)}" placeholder="Ask the maker a question or share a thought.">${esc(draft)}</textarea><div class="conversation-compose-meta"><small>Public after review.</small><details class="conversation-guidelines"><summary>Guidelines</summary><p>Write 7–150 words. Discuss the app, not the person. One comment per app; sign in to update yours. Guests appear as Guest. <a href="/community-guidelines">Community guidelines</a></p></details><button class="comment-send" type="submit" aria-label="Post comment" ${draft.trim()?'':'hidden'}>Post comment</button></div><small id="comment-count-${esc(id)}" data-project-comment-count class="${draft.trim()?'word-counter':'visually-hidden'}">${count} / 7–150 words</small><p data-comment-status role="status" aria-live="polite"></p></form>`;
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
function conversation(product, options = {}) {
 const posts = options.posts || [], id = esc(product.slug);
  return `<section class="project-conversation" data-conversation="${id}" aria-label="Comments and feedback"><div class="conversation-tabs" role="tablist" aria-label="Join in"><button type="button" role="tab" id="conversation-tab-${id}" aria-controls="conversation-panel-${id}" aria-selected="true" tabindex="0" data-conversation-tab="comments">Conversation <span data-conversation-count>${posts.length || ''}</span></button><button type="button" role="tab" id="feedback-tab-${id}" aria-controls="feedback-panel-${id}" aria-selected="false" tabindex="-1" data-conversation-tab="feedback"><span data-feedback-tab-label>Feedback</span></button></div><div role="tabpanel" id="conversation-panel-${id}" aria-labelledby="conversation-tab-${id}" data-conversation-panel="comments"><div class="conversation-feed" data-conversation-feed aria-live="polite">${options.loading !== false ? '<p class="conversation-empty">Loading conversation…</p>' : conversationFeed(posts)}</div>${options.composer || composer(product.slug)}</div><div role="tabpanel" id="feedback-panel-${id}" aria-labelledby="feedback-tab-${id}" data-conversation-panel="feedback" hidden><div class="feedback-tab-intro"><h2>Share your experience</h2><p>Try the app, then share what worked and what could improve.</p></div><div data-inline-feedback data-feedback-slug="${id}"><p role="status">Loading feedback options…</p></div></div></section>`;
}
function selectConversationTab(tab) {
  const region = tab.closest('[data-conversation]');
  const selected = tab.dataset.conversationTab;
  region.querySelectorAll('[data-conversation-tab]').forEach(button => {
    const active = button === tab;
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  region.querySelectorAll('[data-conversation-panel]').forEach(panel => { panel.hidden = panel.dataset.conversationPanel !== selected; });
  if (selected === 'feedback') window.CWGuidedFeedback?.mountInline(region.querySelector('[data-inline-feedback]'));
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

    feed.innerHTML = conversationFeed(posts);
    region.querySelector('[data-conversation-count]').textContent = posts.length || '';
  } catch {
    if (region.isConnected && region.conversationRequest === request) feed.innerHTML = '<p class="conversation-empty">Comments couldn’t load. <button type="button" class="text-button" data-conversation-retry>Try again</button></p>';
  }
}
globalThis.CWProjectView = {theme,hero, conversation, conversationFeed, selectConversationTab, loadProjectConversation};
if (typeof document === 'undefined') return;
document.addEventListener('click', event => {
  const tab = event.target.closest('[data-conversation-tab]');
  if (tab) selectConversationTab(tab);
});
document.addEventListener('keydown', event => {
  const tab = event.target.closest('[data-conversation-tab]');
  if (!tab || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
  const next = event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs.at(-1) : tabs[(tabs.indexOf(tab)+1)%tabs.length];
  selectConversationTab(next);next.focus({preventScroll:true});
});


document.addEventListener('click', event => {
 const retry = event.target.closest('[data-conversation-retry]');
 if (retry) void loadProjectConversation(retry.closest('[data-conversation]'));
});
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
  void loadProjectConversation(region);
 });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hydrate);
else hydrate();
window.addEventListener('cw-panel-ready', hydrate);
})();
