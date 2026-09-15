const projects = [
  { slug: "afterschooltogether", name: "AfterSchool Together", category: "Family life", icon: "A", color: "coral", summary: "Find out whether one adult can actually make every after-school trip.", purpose: "Turns a week of children's activities into the drop-offs and pickups it really requires, then checks them against your own travel times.", audience: "Parents coordinating several children's activities", stage: "New", price: "Free", url: "https://trymybuild.com/projects/afterschool-together/index.html", linkNote: "Opens here on TryMyBuild", accessNote: "No sign-in needed to try it", outcome: "Check whether your week's drop-offs and pickups actually work", note: "Made in-house by the TryMyBuild team. This is a new listing and community evidence has not been collected yet. It works entirely in your browser: no account, no cloud sync, and no maps or live traffic — travel times are the ones you enter." },
  { slug: "stackscout", name: "StackScout", category: "Technology", icon: "S", color: "teal", summary: "Compare technology choices without drowning in technical language.", purpose: "Helps you narrow down the right tools for a project by comparing what matters most.", audience: "People choosing technology for a new idea", stage: "New", price: "Free", url: "https://trymybuild.com/projects/stack-scout/index.html", linkNote: "Opens here on TryMyBuild", accessNote: "No sign-in needed to try it", outcome: "Choose a practical technology direction", note: "This is a new TryMyBuild listing. Community evidence has not been collected yet." },
  { slug: "gamegrid", name: "GameGrid", category: "Sports & teams", icon: "G", color: "blue", summary: "Turn scattered game details into one clear team schedule.", purpose: "Keeps practices, games, locations, and team plans together so fewer details get lost.", audience: "Coaches, players, and team organizers", stage: "New", price: "Free", url: "https://trymybuild.com/projects/game-grid/index.html", linkNote: "Opens here on TryMyBuild", accessNote: "No sign-in needed to try it", outcome: "Build and review a sports schedule", note: "This is a new TryMyBuild listing. Community evidence has not been collected yet." },
  { slug: "lessonlab", name: "LessonLab", category: "Teaching & learning", icon: "L", color: "gold", summary: "Build a balanced lesson around the time you actually have.", purpose: "Helps teachers shape a lesson with a clear beginning, activity, and close.", audience: "Teachers, tutors, and workshop leaders", stage: "New", price: "Free", url: "https://trymybuild.com/projects/lesson-lab/index.html", linkNote: "Opens here on TryMyBuild", accessNote: "No sign-in needed to try it", outcome: "Create a timed lesson plan", note: "This is a new TryMyBuild listing. Community evidence has not been collected yet." },
  { slug: "cartcompare", name: "CartCompare", category: "Shopping", icon: "C", color: "coral", summary: "Compare what purchases really cost before you decide.", purpose: "Places prices and practical differences side by side for a calmer buying decision.", audience: "Anyone comparing products or shopping options", stage: "New", price: "Free", url: "https://trymybuild.com/projects/cart-compare/index.html", linkNote: "Opens here on TryMyBuild", accessNote: "No sign-in needed to try it", outcome: "Compare the true cost of several choices", note: "This is a new TryMyBuild listing. Community evidence has not been collected yet." },
  { slug: "pocketbalance", name: "PocketBalance", category: "Money", icon: "P", color: "green", summary: "See your month clearly without building a complicated budget.", purpose: "Creates a simple snapshot of money coming in, going out, and remaining.", audience: "People who want a gentler view of monthly finances", stage: "New", price: "Free", url: "https://trymybuild.com/projects/pocket-balance/index.html", linkNote: "Opens here on TryMyBuild", accessNote: "No sign-in needed to try it", outcome: "Create a monthly financial snapshot", note: "This is a new TryMyBuild listing. Community evidence has not been collected yet." },
  { slug: "dayframe", name: "DayFrame", category: "Personal planning", icon: "D", color: "violet", summary: "Plan a day that respects your actual time and energy.", purpose: "Turns a long task list into a realistic daily plan with room to breathe.", audience: "Busy people who want a more realistic day", stage: "New", price: "Free", url: "https://trymybuild.com/projects/day-frame/index.html", linkNote: "Opens here on TryMyBuild", accessNote: "No sign-in needed to try it", outcome: "Shape a realistic plan for today", note: "This is a new TryMyBuild listing. Community evidence has not been collected yet." },
  { slug: "mealmap", name: "MealMap", category: "Food & home", icon: "M", color: "coral", summary: "Make a practical weeknight meal plan from what works for you.", purpose: "Reduces the daily question of what to cook by mapping meals across the week.", audience: "Households planning everyday meals", stage: "New", price: "Free", url: "https://trymybuild.com/projects/meal-map/index.html", linkNote: "Opens here on TryMyBuild", accessNote: "No sign-in needed to try it", outcome: "Create a weeknight meal plan", note: "This is a new TryMyBuild listing. Community evidence has not been collected yet." },
  { slug: "homerhythm", name: "HomeRhythm", category: "Food & home", icon: "H", color: "gold", summary: "Keep small home-maintenance jobs from becoming big surprises.", purpose: "Organizes recurring household care into a schedule you can actually follow.", audience: "Renters and homeowners managing a household", stage: "New", price: "Free", url: "https://trymybuild.com/projects/home-rhythm/index.html", linkNote: "Opens here on TryMyBuild", accessNote: "No sign-in needed to try it", outcome: "Build a home-maintenance rhythm", note: "This is a new TryMyBuild listing. Community evidence has not been collected yet." },
  { slug: "packlight", name: "PackLight", category: "Travel", icon: "P", color: "blue", summary: "Pack for a trip without carrying your whole closet.", purpose: "Builds a focused carry-on list around the trip, weather, and activities.", audience: "Travelers who want to pack lighter", stage: "New", price: "Free", url: "https://trymybuild.com/projects/pack-light/index.html", linkNote: "Opens here on TryMyBuild", accessNote: "No sign-in needed to try it", outcome: "Create a practical carry-on list", note: "This is a new TryMyBuild listing. Community evidence has not been collected yet." },
  { slug: "briefbuilder", name: "BriefBuilder", category: "Creative work", icon: "B", color: "teal", summary: "Turn a loose idea into a brief another person can understand.", purpose: "Guides creative thoughts into a clear purpose, audience, and direction.", audience: "Creators, freelancers, and small teams", stage: "New", price: "Free", url: "https://trymybuild.com/projects/brief-builder/index.html", linkNote: "Opens here on TryMyBuild", accessNote: "No sign-in needed to try it", outcome: "Create a focused creative brief", note: "This is a new TryMyBuild listing. Community evidence has not been collected yet." },
];

const creators = [
  {
    slug: "christian-tumalan",
    type: "independent",
    name: "Christian Tumalán",
    initials: "CT",
    label: "Musician · Founder of TryMyBuild",
    bio: "I am a working musician building practical tools and a more human way for independent creators to learn from the people they hope to help.",
  },
];

// The launch collection is attributed to its actual in-house studio.
creators.push({ slug: "creatorworks-studio", name: "TryMyBuild Studio", initials: "TMB",
  type: "company",
  label: "In-house creator · Founded by Christian Tumalán",
  bio: "Our launch collection of practical tools, built in-house at TryMyBuild. Try something useful and tell us what worked, what confused you, and what would make it better." });

projects.forEach((project, index) => {
  project.preview = `assets/previews/${project.slug}.png`;
  project.reviewCount = 0;
  project.saveCount = 0;
  project.recentOrder = projects.length - index;
});

const productBenefits = {
  afterschooltogether: ["Turn a week of activities into actual trips", "See which trips one adult cannot make", "Leave with a daily driver plan you can share"],
  stackscout: ["Compare choices side by side", "Focus on the tradeoffs that matter", "Leave with a practical direction"],
  gamegrid: ["Keep games and practices together", "Make locations easier to find", "Give the whole team one clear schedule"],
  lessonlab: ["Plan around the time you have", "Balance the lesson from start to finish", "Leave with a timed lesson plan"],
  cartcompare: ["See options side by side", "Compare the true cost", "Make a calmer buying decision"],
  pocketbalance: ["See money in and money out", "Understand what remains this month", "Get a simple financial snapshot"],
  dayframe: ["Turn tasks into a realistic day", "Plan around your available energy", "Leave room to breathe"],
  mealmap: ["Map meals across the week", "Reduce daily dinner decisions", "Build a practical weeknight plan"],
  homerhythm: ["Organize recurring home care", "See what needs attention next", "Keep small jobs from becoming surprises"],
  packlight: ["Plan around your trip and weather", "Pack for the activities ahead", "Build a focused carry-on list"],
  briefbuilder: ["Clarify the purpose of your idea", "Name the audience it should reach", "Create a brief others can understand"],
};

projects.forEach(project => { project.benefits = productBenefits[project.slug]; });
projects.forEach(project => { project.creatorSlug = "creatorworks-studio"; });

const categoryCatalog = [
  { name: "Family life", icon: "☺", prompt: "Keep family logistics workable", color: "coral" },
  { name: "Technology", icon: "⌘", prompt: "Choose tools with more confidence", color: "teal" },
  { name: "Sports & teams", icon: "◉", prompt: "Keep the whole team in sync", color: "blue" },
  { name: "Teaching & learning", icon: "✎", prompt: "Make learning easier to shape", color: "gold" },
  { name: "Shopping", icon: "◇", prompt: "Make a clearer buying decision", color: "coral" },
  { name: "Money", icon: "$", prompt: "Understand where things stand", color: "green" },
  { name: "Personal planning", icon: "✓", prompt: "Make room for what matters", color: "violet" },
  { name: "Food & home", icon: "⌂", prompt: "Make everyday home life lighter", color: "gold" },
  { name: "Travel", icon: "↗", prompt: "Prepare without overthinking", color: "blue" },
  { name: "Creative work", icon: "✦", prompt: "Give an idea a clearer shape", color: "teal" },
  { name: "AI & automation", icon: "✦", prompt: "Automate useful work", color: "violet" },
  { name: "Business & operations", icon: "◇", prompt: "Run everyday work more clearly", color: "blue" },
  { name: "Developer tools", icon: "⌘", prompt: "Build and maintain software", color: "teal" },
  { name: "Design", icon: "✦", prompt: "Shape clearer experiences", color: "coral" },
  { name: "Communication", icon: "◇", prompt: "Help people communicate", color: "blue" },
  { name: "Data & analytics", icon: "⌘", prompt: "Understand data and decisions", color: "violet" },
  { name: "Customer support", icon: "☺", prompt: "Help customers move forward", color: "green" },
  { name: "Health & wellness", icon: "☺", prompt: "Support healthier routines", color: "green" },
  { name: "Marketing & sales", icon: "↗", prompt: "Reach and serve customers", color: "coral" },
  { name: "Music & audio", icon: "✦", prompt: "Create and work with sound", color: "violet" },
  { name: "Productivity", icon: "✓", prompt: "Make work easier to finish", color: "teal" },
  { name: "Social & community", icon: "☺", prompt: "Bring people together", color: "gold" },
  { name: "Security & privacy", icon: "◇", prompt: "Protect people and their work", color: "blue" },
  { name: "HR & recruiting", icon: "☺", prompt: "Support people at work", color: "coral" },
  { name: "Legal", icon: "◇", prompt: "Make legal work easier to navigate", color: "blue" },
  { name: "Real estate", icon: "⌂", prompt: "Support property decisions", color: "green" },
  { name: "Events", icon: "✓", prompt: "Plan and run gatherings", color: "gold" },
  { name: "Gaming", icon: "◉", prompt: "Create and enjoy games", color: "violet" },
  { name: "Media & entertainment", icon: "✦", prompt: "Create and discover media", color: "coral" },
  { name: "Science & research", icon: "⌘", prompt: "Explore and explain evidence", color: "teal" },
  { name: "Sustainability", icon: "⌂", prompt: "Make lower-impact choices", color: "green" },
  { name: "Accessibility", icon: "☺", prompt: "Make experiences work for more people", color: "blue" },
  { name: "Utilities", icon: "⌘", prompt: "Solve a focused practical task", color: "teal" },
];

const primaryCategoryNames = categoryCatalog.slice(0, 10).map(category => category.name);
const categoryAliases = new Map([
  ['artificial intelligence', 'AI & automation'], ['ai', 'AI & automation'], ['automation', 'AI & automation'],
  ['business', 'Business & operations'], ['operations', 'Business & operations'],
  ['developer', 'Developer tools'], ['development', 'Developer tools'], ['software development', 'Developer tools'],
  ['education', 'Teaching & learning'], ['learning', 'Teaching & learning'],
  ['finance', 'Money'], ['financial', 'Money'], ['personal finance', 'Money'],
  ['food', 'Food & home'], ['home', 'Food & home'], ['health', 'Health & wellness'],
  ['marketing', 'Marketing & sales'], ['sales', 'Marketing & sales'],
  ['music', 'Music & audio'], ['audio', 'Music & audio'], ['community', 'Social & community'],
  ['sports', 'Sports & teams'], ['creative', 'Creative work'], ['planning', 'Personal planning'],
]);
const blockedCategoryWords = /(?:^|\s)(?:admin|administrator|all tools|everything|uncategorized|none|null)(?:\s|$)/i;

function normalizeCategory(value) {
  const clean = String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim().slice(0, 48);
  if (clean.length < 2 || blockedCategoryWords.test(clean) || !/^[\p{L}\p{N}][\p{L}\p{N} &'’+/.:-]*$/u.test(clean)) return '';
  const alias = categoryAliases.get(clean.toLocaleLowerCase());
  if (alias) return alias;
  const known = categoryCatalog.find(category => category.name.toLocaleLowerCase() === clean.toLocaleLowerCase());
  return known?.name || clean.replace(/\b\p{L}/gu, letter => letter.toLocaleUpperCase());
}

function categoryDefinition(name) {
  return categoryCatalog.find(category => category.name === name) || { name, icon: '◇', prompt: `Explore ${name.toLocaleLowerCase()}`, color: 'teal' };
}

function publishedCategories() {
  const counts = new Map();
  projects.forEach(project => {
    const name = normalizeCategory(project.category);
    if (name) counts.set(name, (counts.get(name) || 0) + 1);
  });
  return [...counts].map(([name, count]) => ({ ...categoryDefinition(name), count }))
    .sort((a, b) => (categoryCatalog.findIndex(c => c.name === a.name) + 1 || 999) - (categoryCatalog.findIndex(c => c.name === b.name) + 1 || 999) || a.name.localeCompare(b.name));
}

function readGuestPersonalization() { try { return localStorage.getItem('trymybuild-guest-personalization') !== 'off'; } catch { return false; } }
const storedCategoryClicks = (()=>{try{const value=JSON.parse(localStorage.getItem('trymybuild-category-clicks-v1')||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{return {};}})();
const rankedStoredCategories = Object.entries(storedCategoryClicks).sort((a,b)=>b[1]-a[1]).map(([name])=>name);
const state = {
  route: new URLSearchParams(location.search).get('listing') === 'settings' ? "share" : new URLSearchParams(location.search).has('account') ? "account" : "discover",
  session: null,
  selected: null,
  category: new URLSearchParams(location.search).get("category") || "All",
  sort: "recent",
  price: "all",
  creatorType: "all",
  verifiedOnly: false,
  filterOpen: false,
  query: "",
  saved: new Set(JSON.parse(localStorage.getItem("creatorworks-saved") || "[]")),
  interests: new Set(readGuestPersonalization()?rankedStoredCategories:[]),
  personalization: readGuestPersonalization(),
  preferencesHydrated: false,
  communityPosts: window.CW_SERVER ? [] : JSON.parse(localStorage.getItem("creatorworks-community-posts") || "[]"),
  dailyComments: [],
  discussionCategory: "",
  discussionError: "",
  discussionExpanded: false,
  profileSlug: null,
  creatorStep: 0,
  creator: { url: "", stage: "Someone can try it", audience: "", benefit: "", participant: "" },
};

// On the server the database is authoritative: the built-in list is NOT shown as a fallback. It stays
// only for the offline/no-server prototype. 'loading' until /api/catalog answers; 'error' shows a retry.
let catalogState = window.CW_SERVER ? 'loading' : 'ready';
let discussionRequest=0;
const app = document.querySelector("#app");
const nav = document.querySelector(".site-nav");
const menu = document.querySelector(".menu-toggle");
document.addEventListener('toggle',event=>{if(event.target.matches?.('.catalog-filter-menu')&&event.target.isConnected)state.filterOpen=event.target.open;},true);
let detailReturnFocus = null;
let detailProjectHistory = [];
let detailScrollY = 0;
const esc = value => String(value ?? "").replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
// Navigation must be validated as well as HTML-escaped.
function safeProjectUrl(value) {
  try {
    if(!String(value || '').trim())return '#';
    const url = new URL(String(value), location.origin + '/');
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '#';
  } catch { return '#'; }
}

function creatorFor(project) {
  return creators.find(creator => creator.slug === project.creatorSlug) || creators[0];
}

function creatorMatchesFilters(creator, creatorType = 'all', verifiedOnly = false) {
  const type = creator?.type === 'company' ? 'company' : 'independent';
  return (creatorType === 'all' || type === creatorType)
    && (!verifiedOnly || (type === 'independent' && creator?.verified === true));
}

function experienceCount(project) {
  return state.communityPosts.filter(post => post.projectSlug === project.slug).length;
}

function avatar(creator, className = "") {
  return `<span class="person-avatar ${esc(creator.color || "")} ${className}" aria-hidden="true">${creator.avatar ? `<img src="${esc(creator.avatar)}" alt="" />` : esc(creator.initials)}</span>`;
}

const studioVerification = 'Founder-confirmed: Christian Tumalán confirmed control of TryMyBuild Studio and its 11 listed projects on September 4, 2026. This is not independent verification or a guarantee of product quality.';

function creatorVerificationBadge(creator) {
  const verified = creator.verified === true || (!window.CW_SERVER && creator.slug === 'creatorworks-studio');
  const note = creator.slug === 'creatorworks-studio' ? studioVerification : 'Creator identity reviewed by TryMyBuild. Not a product-quality guarantee.';
  return verified ? `<span class="creator-verified" title="${esc(note)}">✓ Verified creator</span>` : '';
}

function creatorLink(project, compact = false, showVerification = true) {
  const creator = creatorFor(project);
  return `<button class="creator-link ${compact ? "is-compact" : ""}" data-profile="${esc(creator.slug)}">${avatar(creator)}<span><strong>${esc(creator.name)}</strong>${showVerification ? creatorVerificationBadge(creator) : ''}<small>${esc(creator.label)}</small></span></button>`;
}

function projectDestination(url) {
  return /^(?:https?:)?\/\//i.test(String(url || '')) ? 'Opens external website' : 'Opens here on TryMyBuild';
}

function categoryIcon(category) {
  const paths = {
    "Family life": '<circle cx="8.5" cy="7" r="3"/><path d="M3 20v-1.4a5.5 5.5 0 0 1 11 0V20"/><circle cx="17.5" cy="11" r="2.2"/><path d="M14.9 20v-1a3.2 3.2 0 0 1 6.4 0v1"/>',
    "Technology": '<path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14"/>',
    "Sports & teams": '<circle cx="12" cy="12" r="9"/><path d="M12 3c2.3 2.2 3.5 5.2 3.5 9S14.3 18.8 12 21M3.5 9h17M3.5 15h17"/>',
    "Teaching & learning": '<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H12v17h4.5A3.5 3.5 0 0 1 20 22V5.5Z"/>',
    "Shopping": '<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.6 11.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H6"/>',
    "Money": '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 12h5M7 10h5M7 14h3"/>',
    "Personal planning": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-13 5 2 2 4-4"/>',
    "Food & home": '<path d="M3 11 12 3l9 8v10h-6v-6H9v6H3V11Z"/>',
    "Travel": '<path d="m22 2-7 20-4-9-9-4 20-7Z"/>',
    "Creative work": '<path d="m12 3 1.7 4.6L18 9.3 13.7 11 12 16l-1.7-5L6 9.3l4.3-1.7L12 3Zm7 11 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z"/>',
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[category] || paths.Technology}</svg>`;
}

function productCard(product, compact = false) {
  const saved = state.saved.has(product.slug);
  return `<article class="product-card ${compact ? "compact" : ""}">
    <button class="save-button ${saved ? "is-saved" : ""}" data-save="${esc(product.slug)}" aria-label="${saved ? "Remove" : "Save"} ${esc(product.name)}">${saved ? "♥" : "♡"}</button>
    <button class="product-card-main" data-product="${esc(product.slug)}">
      <span class="product-preview"><img src="${esc(product.preview)}" alt="Preview of the ${esc(product.name)} website" loading="lazy" /></span>
      <span class="product-icon ${esc(product.color)}">${categoryIcon(product.category)}</span>
      <span class="product-meta"><span>${esc(product.category)}</span><span>${esc(product.stage)}</span></span>
      <strong>${esc(product.name)}</strong>
      <p>${esc(product.summary)}</p>
      <span class="product-outcome">You can: ${esc(product.outcome)}</span>
    </button>
    <div class="product-card-creator">${creatorLink(product, true)}</div>
    <div class="product-card-foot"><span>${esc(product.price)}</span><button data-product="${esc(product.slug)}">See how it helps <span>→</span></button><button type="button" class="secondary-button" data-share-product="${esc(product.slug)}" aria-label="Share ${esc(product.name)}">Share</button><span class="card-share-status" data-share-status role="status" aria-live="polite"></span></div>
  </article>`;
}

function catalogStatusPanel() {
  if (catalogState === 'loading') return `<div class="home-catalog-status" role="status"><p>Loading apps…</p></div>`;
  return `<div class="home-catalog-status" role="status"><p>Apps are temporarily unavailable.</p><button class="text-button" data-catalog-retry>Try again</button></div>`;
}
// Calendar dates keep a tip stable throughout the visitor's local day.
const creatorTips = [
  "The cheapest time to catch a flawed idea is before you build it. The most expensive is after you’ve built a system to prove it doesn’t work.",
  "Before adding another feature, watch someone try the one you already built. Their hesitation can show you what to improve next.",
  "Describe your project through the problem it solves. Give someone a clear reason to try it in one short sentence.",
  "Ask testers what they tried, where they got stuck, and what they expected. Specific questions make feedback easier to act on.",
  "Give your first visitor one useful thing to do. A clear first step makes a new project easier to explore.",
  "Test your shared link while signed out. Your first impression starts with what a new visitor can actually open.",
  "Choose one assumption to test today. A small experiment can teach you more than another week of polishing."
];
function dailyCreatorTip(now = new Date()) {
  const day = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const elapsed = Math.max(0, Math.floor((day - Date.UTC(2026, 8, 7)) / 86400000));
  const dayKey=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const person=state.session?.user,initials=(person?.displayName||'You').split(/\s+/).slice(0,2).map(word=>word[0]).join('').toUpperCase();
  const identity=person?avatar({avatar:person.avatar,initials},'small'):avatar({initials:'?'},'small');
  const draft=localStorage.getItem('trymybuild-daily-comment')||'',count=commentWordCount(draft);
  return `<section class="community-maker-question" aria-labelledby="community-maker-question-title"><p class="eyebrow" id="community-maker-question-title">Question for makers</p><blockquote>${esc(creatorTips[elapsed % creatorTips.length])}</blockquote><p>Has this happened to you?</p><form data-daily-discussion data-day="${dayKey}"><div class="daily-comment-compose"><div class="daily-comment-author">${identity}<span>${person?esc(person.displayName||'Your response'):'Your response'}</span></div><label><span class="visually-hidden">Your response</span><textarea name="message" maxlength="800" rows="3" placeholder="Share your perspective…" aria-describedby="daily-comment-guidance daily-comment-count">${esc(draft)}</textarea></label><div class="daily-comment-actions"><small id="daily-comment-count" data-daily-word-count class="word-counter ${count&&count<7?'invalid':''}">${count} / 7–150 words</small><button type="submit" aria-label="Post response">Post</button></div></div><p id="daily-comment-guidance" class="comment-conduct"><strong>Be thoughtful. Be respectful.</strong> Discuss ideas, not people. No insults or abusive wording. <a href="/community-guidelines">Guidelines</a></p><p data-daily-status role="status"></p></form><div class="daily-comment-list">${state.dailyComments.map(dailyCommentCard).join('')}</div></section>`;
}
function projectSaveCount(project) {
  const count = Number(project?.saveCount);
  return Number.isFinite(count) && count > 0 ? count : 0;
}
function compareCatalogProjects(a, b, sort = state.sort) {
  const newestFirst = (b.recentOrder || 0) - (a.recentOrder || 0);
  if (sort === "saved") return projectSaveCount(b) - projectSaveCount(a) || newestFirst;
  if (sort === "reviewed") return experienceCount(b) - experienceCount(a) || newestFirst;
  return newestFirst;
}
function catalogSortLabel(sort = state.sort) {
  if (sort === "saved") return "Most saved first.";
  if (sort === "reviewed") return "Most reviewed first.";
  return "Newest listings first.";
}
let homeView = 'find';
function homeViewTabs(active) {
  return `<div class="home-view-tabs" role="tablist" aria-label="What would you like to do?">${[['find','Explore apps'],['test','Share your app']].map(([key,label])=>`<button type="button" role="tab" id="home-tab-${key}" data-home-view="${key}" aria-controls="home-panel" aria-selected="${active===key}" tabindex="${active===key?'0':'-1'}">${label}</button>`).join('')}</div>`;
}
function selectHomeView(view) {
  const previous=homeView;
  homeView = view === 'test' ? 'test' : 'find';
  state.route = 'discover'; render();
  if(previous!==homeView&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
    const marker=document.querySelector('.home-view-tabs');marker?.classList.add(homeView==='test'?'slide-to-test':'slide-to-find');
    document.getElementById('home-panel')?.animate([{opacity:.45,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:250,easing:'ease-out'});
  }
  const tab = document.getElementById('home-tab-'+homeView);
  tab?.focus({preventScroll:true});
}
function homeHowItWorks() {
  return `<section class="home-how" aria-labelledby="home-how-title"><p class="eyebrow">How it works</p><h2 id="home-how-title">Small contributions. Better projects.</h2><ol><li><span>1</span><div><h3>Share your project</h3><p>Bring what you’re building and explain what someone should try.</p><button class="text-button" data-route="share">Share my app →</button></div></li><li><span>2</span><div><h3>Try someone else’s</h3><p>Explore a project. Share what worked, what confused you, or what could improve.</p><button class="text-button" data-home-view="find">Find an app →</button></div></li><li><span>3</span><div><h3>Learn and improve together</h3><p>Keep the conversation going and turn honest feedback into your next improvement.</p><a href="/dashboard/messages">Your conversations →</a></div></li></ol></section>`;
}
function catalogSearchWords(value) {
  const filler = new Set('i me my we our you your have has a an the with for to of in on is it that this need want looking find app apps tool tools help problem can do something please'.split(' '));
  return [...new Set(String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]+/g) || [])].filter(word => !filler.has(word));
}
function catalogWordsClose(a,b) {
  if(a===b)return true;
  if(a.length<4||b.length<4||Math.abs(a.length-b.length)>1)return false;
  if(a.length===b.length){
    const differences=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])differences.push(i);
    return differences.length===1 || (differences.length===2 && differences[1]===differences[0]+1 && a[differences[0]]===b[differences[1]] && a[differences[1]]===b[differences[0]]);
  }
  const shorter=a.length<b.length?a:b,longer=a.length<b.length?b:a;
  let i=0,j=0;while(i<shorter.length&&j<longer.length){if(shorter[i]===longer[j])i++;j++;if(j-i>1)return false;}return true;
}
function rankCatalogSearch(candidates,query) {
  const terms=catalogSearchWords(query);
  if(!query.trim())return {items:[...candidates].sort(compareCatalogProjects),suggestions:false};
  const ranked=candidates.map(product=>{
    const title=catalogSearchWords(product.name);
    const words=catalogSearchWords([product.name,product.category,product.summary,product.purpose,product.audience].filter(Boolean).join(' '));
    const score=terms.reduce((total,term)=>total+(title.includes(term)?6:words.includes(term)?3:words.some(word=>catalogWordsClose(term,word))?1:0),0);
    return {product,score};
  }).sort((a,b)=>b.score-a.score||compareCatalogProjects(a.product,b.product));
  const relevant=ranked.filter(result=>result.score>0);
  return {items:(relevant.length?relevant:ranked.slice(0,6)).map(result=>result.product),suggestions:!relevant.length};
}
function discover(communityFocused = false) {
  // Never fall back to the built-in catalog on the server; show loading/unavailable instead.
  const activeView = communityFocused ? 'test' : homeView;
  const tabs = homeViewTabs(activeView);
  if (activeView === 'test') return `<section class="page-shell discover-page home-creator-view">${tabs}<div id="home-panel" role="tabpanel" aria-labelledby="home-tab-test">${listingJourney()}</div></section>`;
  if (window.CW_SERVER && catalogState !== 'ready') return `<section class="page-shell discover-page">${tabs}<div id="home-panel" tabindex="-1" role="tabpanel" aria-labelledby="home-tab-find">${catalogStatusPanel()}</div></section>`;
  const candidates = projects.filter(product => {
    const categoryMatch = state.category === "All" || product.category === state.category;
    const kind = CWPricing.kind(product.price);
    const priceMatch = state.price === 'all' || state.price === kind;
    const creatorMatch = creatorMatchesFilters(creatorFor(product), state.creatorType, state.verifiedOnly);
    return categoryMatch && priceMatch && creatorMatch;
  });
  const searchResults=rankCatalogSearch(candidates,state.query);
  const filtered=searchResults.items;
  return `<section class="page-shell discover-page">
    ${tabs}<div id="home-panel" tabindex="-1" role="tabpanel" aria-labelledby="home-tab-find">
    <div class="catalog-controls">
      <label class="catalog-search"><span aria-hidden="true">⌕</span><input data-catalog-search value="${esc(state.query)}" aria-label="Search apps by task, need, or tool" placeholder="Search by task, need, or tool" /></label>
      <details class="catalog-filter-menu" ${state.filterOpen?'open':''}><summary>Filter &amp; sort${state.category !== 'All' ? ` · ${esc(state.category)}` : ''}${state.creatorType !== 'all' || state.verifiedOnly || state.price !== 'all' ? ' · active' : ''}</summary><div class="catalog-filter-options">
    <nav class="category-strip" aria-label="Filter apps by category"><div class="category-strip-scroll"><button data-category-filter="All" class="${state.category === "All" ? "is-selected" : ""}"><span>All apps</span><b>${projects.length}</b></button>${publishedCategories().map(category => `<button data-category-filter="${esc(category.name)}" class="${state.category === category.name ? "is-selected" : ""}">${categoryIcon(category.name)}<span>${esc(category.name)}</span><b>${category.count}</b></button>`).join("")}</div></nav>
      <label class="sort-control">Price <select data-price-select><option value="all" ${state.price === 'all' ? 'selected' : ''}>All prices</option><option value="free" ${state.price === 'free' ? 'selected' : ''}>Free</option><option value="freemium" ${state.price === 'freemium' ? 'selected' : ''}>Free + paid options</option><option value="paid" ${state.price === 'paid' ? 'selected' : ''}>Paid</option></select></label>
      <label class="sort-control">Sort by <select data-sort-select><option value="recent" ${state.sort === "recent" ? "selected" : ""}>Most recent</option><option value="reviewed" ${state.sort === "reviewed" ? "selected" : ""}>Most reviewed</option><option value="saved" ${state.sort === "saved" ? "selected" : ""}>Most saved</option></select></label>
      <div class="sort-control creator-filter-row"><label for="creator-filter">Creators</label><select id="creator-filter" data-creator-type-select><option value="all" ${state.creatorType === 'all' ? 'selected' : ''}>All creators</option><option value="independent" ${state.creatorType === 'independent' ? 'selected' : ''}>Independent</option><option value="company" ${state.creatorType === 'company' ? 'selected' : ''}>Companies</option></select></div>
      <div class="verified-builder-option"><label for="verified-builder-filter"><input id="verified-builder-filter" type="checkbox" data-verified-select ${state.verifiedOnly ? 'checked' : ''}> <span>Verified builders only</span></label><button type="button" class="creator-filter-info" data-verification-info aria-label="About builder verification" aria-expanded="false" aria-controls="creator-verification-help">?</button></div>
      <p id="creator-verification-help" class="creator-verification-help" hidden>Verified Builder is earned by independent creators after qualifying contributions and confirmation that they own their published app. It does not rate app quality.</p></div></details>
    </div>

    <div class="catalog-results"><div class="results-heading"><strong>${state.query.trim()?'Closest matches':`${filtered.length} ${filtered.length === 1 ? 'app' : 'apps'}`}</strong><span>${state.query.trim()&&!searchResults.suggestions?'Most relevant first.':catalogSortLabel()}</span></div>${state.query.trim()?`<p class="search-guidance">${searchResults.suggestions?'Try describing a specific task. Here are some apps to explore within your filters.':'Explore these apps, or tell creators what you still need.'} <button class="text-button" data-wish-focus>Submit a wish</button></p>`:''}<div class="catalog-list">${filtered.length ? filtered.map(product => catalogRow(product)).join("") : `<div class="empty-state"><h2>${state.query.trim()?'Explore more possibilities':'More apps are on the way'}</h2><p>There are no published apps within these filters yet. Broaden your filters or share what you need.</p><button class="secondary-button" data-clear-search>Browse all apps</button><button class="primary-button" data-wish-focus>Submit a wish</button></div>`}</div></div>
    ${wishListSection()}
  </div></section>`;
}

function discussionDraftKey(category = state.category) {
  return 'trymybuild-category-comment:' + encodeURIComponent(category);
}
function discussionDraft(category = state.category) {
  try { return localStorage.getItem(discussionDraftKey(category)) || ''; } catch { return ''; }
}
function saveDiscussionDraft(category, value) {
  try { localStorage.setItem(discussionDraftKey(category), value); return true; } catch { return false; }
}
function communityRail() {
  if (state.category === 'All') return '';
  const category=state.category, draft=discussionDraft(), count=commentWordCount(draft);
  const now=new Date(),day=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  const comments=state.discussionCategory===category?state.dailyComments:[];
  const posts=state.communityPosts.filter(post=>projects.some(project=>project.slug===post.projectSlug&&project.category===category));
  return `<section id="category-community" class="category-community" aria-labelledby="category-community-title">
    <header><h2 id="category-community-title">Conversations about ${esc(category.toLowerCase())}</h2><p>See what people tried, what helped, and what they’re still looking for.</p></header>
    <div class="category-conversations">${comments.length||posts.length?[...comments.map(dailyCommentCard),...posts.map(post=>experienceCard(post,true))].slice(0,state.discussionExpanded?Infinity:3).join(''):'<p class="category-community-empty">No conversations yet. What would make this part of your life easier?</p>'}</div>
    ${comments.length+posts.length>3?`<button class="text-button" data-more-conversations>${state.discussionExpanded?'Show fewer conversations':'See more conversations'}</button>`:''}
    ${state.discussionError?`<p role="status">${esc(state.discussionError)} <button class="text-button" data-retry-discussion>Try again</button></p>`:''}
    <form data-daily-discussion data-discussion-category="${esc(category)}" data-day="${day}">
      <div class="daily-comment-compose"><label for="category-comment">Share your experience or ask a question</label><textarea id="category-comment" name="message" maxlength="800" rows="3" placeholder="What has helped you, or what are you looking for?" aria-describedby="daily-comment-guidance daily-comment-count">${esc(draft)}</textarea>
      <div class="daily-comment-actions"><small id="daily-comment-count" data-daily-word-count class="word-counter">${count} / 7–150 words</small><button type="submit">${state.session?.authenticated?'Post comment':'Sign up to post'}</button></div></div>
      <p class="comment-conduct">${state.session?.authenticated?'Your comment will appear after moderation review.':'Write first. Your draft stays private in this browser. Create an account or sign in, then return here to post. Comments appear after moderation review.'}</p>
      <p id="daily-comment-guidance" class="comment-conduct"><strong>Be thoughtful. Be respectful.</strong> Discuss ideas, not people. <a href="/community-guidelines">Guidelines</a></p><p data-daily-status role="status"></p>
    </form>
  </section>`;
}

function projectFirstStep(product) {
  return projectPresentation[product.slug]?.[4] || 'Try one feature and share what worked or what got in your way.';
}
function homeCommunity() {
  const candidates = [...projects].sort((a,b) => Number(creatorFor(a).type === 'company') - Number(creatorFor(b).type === 'company')).slice(0,2);
  return `<section class="home-community" id="home-community" tabindex="-1" aria-labelledby="home-community-title"><p class="eyebrow">Community</p><div class="home-community-heading"><div><h2 id="home-community-title">Help a creator move forward</h2><p>A few minutes of your time can make the next version better.</p></div><a href="/dashboard/community#credit-rules">How participation works →</a></div><div class="home-community-grid">${candidates.length ? candidates.map(p=>`<article class="home-community-card">${creatorLink(p,true)}<h3>${esc(p.name)}</h3><p class="community-step-label">A first step to try</p><p>${esc(projectFirstStep(p))}</p><button class="text-button" data-product="${esc(p.slug)}">Try &amp; give feedback →</button></article>`).join('') : '<div class="home-community-empty"><h3>Bring the first conversation.</h3><p>Share a project you’re working on and invite people to try it.</p><button class="secondary-button" data-route="share">Share my app</button></div>'}</div><p class="home-community-note">Try a first task, then share what worked, what confused you, or what could improve.</p></section>`;
}
const openedCatalogApps = new Set();
function catalogRow(product) {
  const saved = state.saved.has(product.slug);
  const count = experienceCount(product);
return `<article class="catalog-row"><div class="row-media"><button class="row-preview" data-product="${esc(product.slug)}" aria-label="View ${esc(product.name)} details"><img src="${esc(product.preview)}" alt="Preview of the ${esc(product.name)} website" loading="lazy" /></button><div class="card-secondary-actions"><button class="save-button-row ${saved ? "is-saved" : ""}" data-save="${esc(product.slug)}" aria-label="${saved ? "Remove" : "Save"} ${esc(product.name)}">${saved ? "♥ Saved" : "♡ Save"}</button><button type="button" class="save-button-row" data-share-product="${esc(product.slug)}" aria-label="Share ${esc(product.name)}">Share</button></div></div><div class="row-copy"><div class="product-meta"><span class="price-badge">${esc(product.price)}</span><span>${esc(product.category)}</span>${product.stage && product.stage !== 'New' ? `<span>${esc(product.stage)}</span>` : ''}${Number(product.recentCommentCount)>=3?`<span class="activity-badge" title="Published comments and public reviews in the past 30 days">💬 Active discussion · ${Number(product.recentCommentCount)}</span>`:''}</div><button class="row-title" data-product="${esc(product.slug)}">${esc(product.name)}</button><p>${esc(product.summary)}</p>${creatorLink(product, true, false)}<div class="card-try-actions"><a class="primary-button" href="${esc(safeProjectUrl(product.url))}" target="_blank" rel="noopener noreferrer" data-try-app="${esc(product.slug)}" aria-label="Try ${esc(product.name)} (opens in a new tab)">Try this app ↗</a>${product.accessNote ? `<small>${esc(product.accessNote)}</small>` : ''}</div><section class="card-comments" aria-label="Comments on ${esc(product.name)}">${state.communityPosts.filter(post=>post.projectSlug===product.slug).slice(0,2).map(post=>experienceCard(post)).join('')}<p class="card-return-prompt" data-return-prompt="${esc(product.slug)}" ${openedCatalogApps.has(product.slug)?'':'hidden'}>Had a chance to try it? Tell the maker what you think.</p><details class="card-feedback" ${projectCommentDraft(product.slug).trim()?'open':''}><summary>Give feedback</summary>${projectCommentComposer(product, true)}</details></section></div></article>`;
}

const projectPresentation = {
  "afterschooltogether": [
    "A calmer school week",
    "Can one adult make every pickup?",
    "Check your children’s activities against the trips and travel times you enter.",
    "Spot overlapping trips before you’re trying to be in two places at once.",
    "Add a day of activities and review the pickup plan."
  ],
  "stackscout": [
    "Make sense of your options",
    "Compare tools. Choose your next step.",
    "Compare technology options around the needs of your project.",
    "Understand the tradeoffs without getting lost in technical language.",
    "Compare a few options for something you want to build."
  ],
  "gamegrid": [
    "Everyone on the same page",
    "Bring your team’s schedule together.",
    "Organize games, practices, times, and locations.",
    "Keep team details in one place instead of scattered messages.",
    "Add your team’s next practice and game."
  ],
  "lessonlab": [
    "More room to teach",
    "Plan a lesson that fits your time.",
    "Arrange lesson activities into a timed plan.",
    "See how the lesson fits together before you start teaching.",
    "Plan one lesson with an opening, activity, and close."
  ],
  "cartcompare": [
    "A clearer buying decision",
    "Compare purchases. See the real cost.",
    "Compare prices and practical differences between purchases.",
    "Make a decision with the important details side by side.",
    "Add two options you’re considering and compare them."
  ],
  "pocketbalance": [
    "A clearer month ahead",
    "See what comes in. Know what’s left.",
    "Organize monthly income and expenses into a simple snapshot.",
    "See where your money goes without building a complicated spreadsheet.",
    "Enter example income and expenses to explore a month."
  ],
  "dayframe": [
    "A little room to breathe",
    "Make a plan your day can actually hold.",
    "Arrange tasks into a daily plan around your available time.",
    "Notice an overloaded day before you commit to everything.",
    "Add a few tasks and shape a plan for today."
  ],
  "mealmap": [
    "Less “what’s for dinner?”",
    "Plan your dinners. See what they’ll cost.",
    "Organize your dinners and estimate their cost.",
    "Make fewer last-minute dinner decisions and keep your budget in sight.",
    "Add a few meals and see how your plan adds up."
  ],
  "homerhythm": [
    "Stay ahead of the little jobs",
    "Give home maintenance a place in your week.",
    "Organize recurring household tasks into a schedule.",
    "Keep track of routine care without relying on memory.",
    "Add a few maintenance jobs you want to remember."
  ],
  "packlight": [
    "Less to carry",
    "Pack for your trip. Leave the extras.",
    "Build a carry-on list around your trip and activities.",
    "Keep packing focused on what you need.",
    "Make a list for your next weekend away."
  ],
  "briefbuilder": [
    "Give your idea a clear direction",
    "Turn a loose idea into a useful brief.",
    "Organize a creative idea’s purpose, audience, and direction.",
    "Help someone else understand what you want to make.",
    "Describe one idea and shape it into a brief."
  ]
};

function commentWordCount(value) { return (String(value||'').match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[]).length; }
function projectCommentDraftKey(slug) { return 'trymybuild-project-comment:' + encodeURIComponent(slug); }
function projectCommentDraft(slug) {
  try { return localStorage.getItem(projectCommentDraftKey(slug)) || ''; } catch { return ''; }
}
function saveProjectCommentDraft(slug, value) {
  try { localStorage.setItem(projectCommentDraftKey(slug), value); return true; } catch { return false; }
}
function projectCommentComposer(product, compact = false, context = '') {
  const draft = projectCommentDraft(product.slug);
  const count = commentWordCount(draft);
  const id = (context || (compact ? 'card-' : 'detail-')) + product.slug;
  const empty = !state.communityPosts.some(post=>post.projectSlug===product.slug);
  const placeholder = compact && empty ? 'Be the first one to review this app' : 'What is the first thing you liked? Was the price right? What was confusing? Mention one or two improvements.';
  return `<form class="detail-comment-form compact-comment" data-project-comment="${esc(product.slug)}"><div class="comment-input-wrap"><label class="visually-hidden" for="comment-${esc(id)}">Add your comment</label><textarea id="comment-${esc(id)}" name="comment" maxlength="800" rows="2" required aria-describedby="comment-count-${esc(id)}" data-project-comment-field placeholder="${placeholder}">${esc(draft)}</textarea><button class="comment-send" type="submit" aria-label="Send comment" ${draft.trim()?'':'hidden'}>➤</button></div><details class="inline-help"><summary aria-label="Comment guidelines">?</summary><p><strong>Be thoughtful. Be respectful.</strong> Discuss the app, not the person. Use clear, considerate language. <a href="/community-guidelines">Guidelines</a>. Write 7–150 words. Guests appear as “Guest.”</p></details><small id="comment-count-${esc(id)}" data-project-comment-count class="${draft.trim()?'word-counter':'visually-hidden'}">${count} / 7–150 words</small><small class="comment-public-note">Public after review.</small><p data-comment-status role="status" aria-live="polite"></p></form>`;
}

// A return is an invitation to comment, never proof that an app was used.
const promptedReturnApps = new Set();
let pendingReturnFeedback = null;
function armReturnFeedback(slug) {
  pendingReturnFeedback = {slug, awayAt: null};
}
function markFeedbackDeparture() {
  if (pendingReturnFeedback && pendingReturnFeedback.awayAt === null) pendingReturnFeedback.awayAt = Date.now();
}
function maybeShowReturnFeedback() {
  if (document.visibilityState !== 'visible' || !document.hasFocus()) return;
  const pending = pendingReturnFeedback;
  if (!pending || pending.awayAt === null) return;
  pendingReturnFeedback = null;
  const awayMs = Date.now() - pending.awayAt;
  if (awayMs < 7000) return;
  const quick = awayMs < 15000;
  const promptKey = `${pending.slug}:${quick ? 'quick' : 'review'}`;
  if (promptedReturnApps.has(promptKey)) return;
  if (document.querySelector('dialog[open]') || document.activeElement?.matches('textarea, input, [contenteditable="true"]')) return;
  const product = projects.find(item => item.slug === pending.slug);
  if (!product) return;
  promptedReturnApps.add(promptKey);
  const previousFocus = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'return-feedback-dialog';
  dialog.setAttribute('aria-labelledby', 'return-feedback-title');
  const quickOptions = ['Too much to read', 'Hard to understand', 'Not what I expected', 'Just curious'];
  dialog.innerHTML = `<button type="button" class="return-feedback-close" aria-label="Close feedback prompt">×</button>${quick ? `<h2 id="return-feedback-title">A quick thought on ${esc(product.name)}?</h2><p>Was there anything that made you stop exploring?</p><form data-quick-return-feedback><fieldset><legend>Select any that fit</legend>${quickOptions.map((label,index)=>`<label><input type="checkbox" name="reason" value="${index}"><span>${label}</span></label>`).join('')}</fieldset><button class="primary-button return-feedback-send" type="submit">Send response</button><p class="quick-preview-note">Shared privately with the creator.</p><p data-quick-status role="status"></p></form>` : `<h2 id="return-feedback-title">How was ${esc(product.name)}?</h2><p>Your feedback can make the next version better. What worked, or what could be better?</p>${projectCommentComposer(product, false, 'return-')}`}<button type="button" class="text-button" data-return-dismiss>Not now</button>`;
  if (!quick) {
    const submit = dialog.querySelector('[type="submit"]');
    submit.textContent = 'Send feedback';
    submit.setAttribute('aria-label', 'Send feedback');
    submit.className = 'primary-button return-feedback-send';
    dialog.querySelector('textarea').placeholder = 'For example: “I liked how easy it was to get started. I’d love a way to…”';
  } else {
    dialog.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      const answers = [...dialog.querySelectorAll('input:checked')].map(input=>quickOptions[Number(input.value)]);
      const status = dialog.querySelector('[data-quick-status]');
      if (!answers.length) {status.textContent='Choose an option, or select Not now.';return;}
      const form = event.currentTarget;
      const button = form.querySelector('[type="submit"]');
      const reasonKeys = ['too_much_to_read','hard_to_understand','unexpected','curious'];
      const reasons = [...dialog.querySelectorAll('input:checked')].map(input=>reasonKeys[Number(input.value)]);
      form.dataset.requestId ||= crypto.randomUUID();
      button.disabled = true;
      status.textContent = 'Sending…';
      try {
        const response = await fetch('/api/quick-feedback', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:product.slug,reasons,requestId:form.dataset.requestId})});
        const data = await response.json();
        if (!response.ok || !data.ok) throw Error(data.error || 'Your response could not be sent.');
        status.textContent = data.message;
        dialog.querySelector('fieldset').disabled = true;
        dialog.querySelector('[data-return-dismiss]').textContent = 'Done';
      } catch(error) {status.textContent=error.message || 'Your response could not be sent. Please try again.';button.disabled=false;}

    });
  }
  const dismiss = () => {
    dialog.close(); dialog.remove();
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
  };
  dialog.querySelector('.return-feedback-close').onclick = dismiss;
  dialog.querySelector('[data-return-dismiss]').onclick = dismiss;
  dialog.addEventListener('cancel', event => {event.preventDefault(); dismiss();});
  dialog.addEventListener('click', event => {if (event.target === dialog) {const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dismiss();}});
  document.body.append(dialog);
  dialog.showModal();
  dialog.querySelector(quick ? 'input' : 'textarea').focus();
}
window.addEventListener('blur', markFeedbackDeparture);
window.addEventListener('focus', maybeShowReturnFeedback);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') markFeedbackDeparture();
  else maybeShowReturnFeedback();
});

function detailDrawer(product) {
  const copy = projectPresentation[product.slug] || ['', '',product.summary,'',''];
  const saved = state.saved.has(product.slug);
  return `<div class="detail-overlay" data-detail-overlay>
    <button class="detail-backdrop" data-detail-close aria-label="Close app details"></button>
    <section class="detail-dialog mealmap-detail invitation-detail" data-showcase-theme="${product.slug === 'stackscout' ? 'stackscout' : ['coral','teal','blue','gold','green','violet'].includes(product.color) ? product.color : 'teal'}" role="dialog" aria-modal="true" aria-labelledby="detail-title-${esc(product.slug)}" tabindex="-1">
      <div class="detail-scroll">
        <header class="mealmap-top">${detailProjectHistory.length ? `<button type="button" class="detail-back" data-detail-back aria-label="Back to ${esc(detailProjectHistory.at(-1).product.name)}" title="Previous project">←</button>` : ''}<div class="mealmap-wordmark">${esc(product.name)}<span class="detail-app-meta">${esc(product.price)} · ${esc(product.category)} · ${esc(product.stage)}</span><div class="detail-creator">${creatorLink(product,true)}</div></div><div class="detail-header-controls"><button class="detail-save ${saved ? "is-saved" : ""}" data-save="${esc(product.slug)}">${saved ? "♥ Saved" : "♡ Save"}</button><button type="button" class="detail-share" data-share-product="${esc(product.slug)}" aria-label="Share ${esc(product.name)}">Share</button><span class="detail-share-status" data-share-status role="status"></span><button class="detail-close" data-detail-close aria-label="Close ${esc(product.name)} details">×</button></div></header>
        <section class="recipient-hero"><div class="recipient-copy"><h2 id="detail-title-${esc(product.slug)}">${esc(copy[2])}</h2><div class="detail-description-notes"><div><h3>How it helps</h3><p>${esc(copy[3])}</p></div><div><h3>One thing to try first</h3><p>${esc(copy[4])}</p></div></div></div><div class="recipient-preview-column"><div class="recipient-art"><img src="${esc(product.preview)}" alt="Preview of ${esc(product.name)}"><span>Made by a person. Ready for your perspective.</span></div><a class="primary-button" href="${esc(safeProjectUrl(product.url))}" target="_blank" rel="noopener noreferrer" data-try-app="${esc(product.slug)}">Try this app ↗</a>${product.accessNote ? `<small class="app-access-note">${esc(product.accessNote)}</small>` : ''}</div></section>
        ${videoPlayer(product.video)}<div class="mealmap-after"><section class="mealmap-feedback">${projectCommentComposer(product)}<div class="mealmap-comments">${state.communityPosts.filter(post => post.projectSlug === product.slug).length ? state.communityPosts.filter(post => post.projectSlug === product.slug).map(post => experienceCard(post)).join('') : '<p>No reviews yet. Start the conversation.</p>'}</div></section></div>${similarSection(product)}
      </div>
    </section>
  </div>`;
}

document.addEventListener('input', event => {
  const projectField=event.target.closest('[data-project-comment-field]');
  if(projectField){const form=projectField.closest('[data-project-comment]'),count=commentWordCount(projectField.value),counter=form.querySelector('[data-project-comment-count]');saveProjectCommentDraft(form.dataset.projectComment,projectField.value);form.querySelector('[type="submit"]').hidden=!projectField.value.trim();counter.textContent=`${count} / 7–150 words`;counter.classList.toggle('visually-hidden',!projectField.value.trim());counter.classList.toggle('invalid',count>0&&(count<7||count>150));projectField.setCustomValidity(count>=7&&count<=150?'':'Write 7–150 words.');return;}
  const field=event.target.closest('[data-daily-discussion] textarea');if(!field)return;
  saveDiscussionDraft(field.closest('form').dataset.discussionCategory,field.value);const count=commentWordCount(field.value),counter=field.closest('form').querySelector('[data-daily-word-count]');
  counter.textContent=`${count} / 7–150 words`;counter.classList.toggle('invalid',count>0&&(count<7||count>150));field.setCustomValidity(count>=7&&count<=150?'':'Write 7–150 words.');
});
document.addEventListener('input',event=>{
  const field=event.target.closest('[data-feedback-response]');if(!field)return;const count=commentWordCount(field.value),output=field.closest('.feedback-card').querySelector('[data-feedback-word-count]');if(output){output.textContent=`${count} / 7–150 words`;output.classList.toggle('invalid',count>0&&count<7);}
});
document.addEventListener('submit', async event => {
  const daily=event.target.closest('[data-daily-discussion]');
  if(daily){
    event.preventDefault();const field=daily.elements.message,status=daily.querySelector('[data-daily-status]'),count=commentWordCount(field.value);
    if(count<7||count>150){status.textContent='Write a thoughtful response of 7–150 words.';field.focus();return;}
    if(!saveDiscussionDraft(daily.dataset.discussionCategory,field.value)){status.textContent='Your browser cannot save this draft. Copy your comment before signing in.';return;}
    if(!state.session?.authenticated){const destination='/?category='+encodeURIComponent(daily.dataset.discussionCategory)+'#category-community';location.href='/auth/sign-in?signup=1&next='+encodeURIComponent(destination);return;}
    const button=daily.querySelector('button');button.disabled=true;status.textContent='Posting…';
    try{const response=await fetch('/api/daily-comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({day:daily.dataset.day,category:daily.dataset.discussionCategory,message:field.value.trim()})}),data=await response.json();if(!response.ok)throw Error(data.error||'Unable to post');saveDiscussionDraft(daily.dataset.discussionCategory,'');field.value='';status.textContent=data.message;await loadDailyComments();}
    catch(error){status.textContent=error.message||'Your response could not be saved.';}finally{button.disabled=false;}return;
  }
  const form = event.target.closest('[data-project-comment]');
  if (!form) return;
  event.preventDefault();
  const field = form.elements.comment;
  const status = form.querySelector('[data-comment-status]');
  const count = commentWordCount(field.value);
  if(count<7||count>150){status.textContent='Write a thoughtful comment of 7–150 words.';field.focus();return;}
  if(!saveProjectCommentDraft(form.dataset.projectComment,field.value)){status.textContent='Your browser cannot save this draft. Copy your comment before joining.';return;}
  if(window.CW_SERVER&&!state.session){status.textContent='Checking your account…';try{state.session=await (await fetch('/api/me')).json();}catch{state.session={authenticated:false};}}
  if (!window.CW_SERVER&&!state.session?.authenticated) {
    state.route='account';render();
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = 'Sending…';
  try {
    form.dataset.requestId ||= crypto.randomUUID();
    const response = await fetch('/api/experiences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: form.dataset.projectComment, response: field.value.trim(),requestId:form.dataset.requestId }) });
    if(response.status===401){location.href='/auth/sign-in?signup=1&next='+encodeURIComponent('/?project='+encodeURIComponent(form.dataset.projectComment));return;}
    const data=await response.json();if (!response.ok) throw new Error(data.error||'Unable to send');
    if(data.duplicate){status.textContent=data.message;if(data.guest)window.CWGuestComment?.offer(status);return;}
    saveProjectCommentDraft(form.dataset.projectComment,'');status.textContent = data.message||'Your comment was sent for review.';
    if(data.guest)window.CWGuestComment?.offer(status);
    delete form.dataset.requestId;
    form.reset();field.value='';button.hidden=true;
    form.querySelector('[data-project-comment-count]').textContent='0 / 7–150 words';field.setCustomValidity('');
  } catch(error) { status.textContent = error.message||'Your comment could not be sent. Please try again.'; }
  finally { button.disabled = false; }
});

function openProductDetail(product, trigger) {
  if (!product) return;
  const current = document.querySelector('.detail-overlay');
  if (current) {
    if (state.selected?.slug === product.slug) return;
    detailProjectHistory.push({product: state.selected, scrollTop: current.querySelector('.detail-scroll')?.scrollTop || 0});
    state.selected = product;
    current.outerHTML = detailDrawer(product);
    document.querySelector('.detail-back')?.focus({preventScroll:true});
    return;
  }
  detailProjectHistory = [];
  closeProductDetail(false);
  state.selected = product;
  detailReturnFocus = trigger || document.activeElement;
  detailScrollY = window.scrollY;
  document.body.insertAdjacentHTML("beforeend", detailDrawer(product));
  document.body.classList.add("is-dialog-open");
  document.body.style.position = "fixed";
  document.body.style.top = `-${detailScrollY}px`;
  document.body.style.width = "100%";
  document.querySelector(".detail-close")?.focus();
}

function backProductDetail() {
  const previous = detailProjectHistory.pop();
  const current = document.querySelector('.detail-overlay');
  if (!previous || !current) return;
  state.selected = previous.product;
  current.outerHTML = detailDrawer(previous.product);
  document.querySelector('.detail-scroll').scrollTop = previous.scrollTop;
  (document.querySelector('.detail-back') || document.querySelector('.detail-close'))?.focus({preventScroll:true});
}

function closeProductDetail(restoreFocus = true) {
  const closing=document.querySelector('.detail-overlay');
  if(restoreFocus&&closing&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!closing.dataset.finished){
    if(closing.dataset.closing)return;closing.dataset.closing='true';
    closing.querySelector('.detail-dialog').animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(65px)'}],{duration:200,easing:'ease-in',fill:'forwards'});
    closing.querySelector('.detail-backdrop').animate([{opacity:1},{opacity:0}],{duration:200,fill:'forwards'});
    setTimeout(()=>{if(document.querySelector('.detail-overlay')===closing){closing.dataset.finished='true';closeProductDetail(true);}},210);return;
  }
  const wasOpen = Boolean(document.querySelector(".detail-overlay"));
  document.querySelector(".detail-overlay")?.remove();
  document.body.classList.remove("is-dialog-open");
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.width = "";
  if (restoreFocus && detailReturnFocus?.isConnected) detailReturnFocus.focus({ preventScroll: true });
  if (wasOpen) window.scrollTo({ top: detailScrollY, behavior: "auto" });
  detailReturnFocus = null;
  detailProjectHistory = [];
}

function experienceCard(post, showProject = false) {
  const project = projects.find(item => item.slug === post.projectSlug);
  if (!project) return "";
  return `<article class="experience-card"><div class="experience-person">${avatar({avatar:post.avatar,initials:post.initials||'G'},'small')}<span><strong>${esc(post.author || "Guest participant")}</strong><small>${esc(post.label || "TryMyBuild participant")}</small></span></div>${showProject ? `<button class="experience-project" data-product="${esc(project.slug)}">Tried ${esc(project.name)} <span>→</span></button>` : ""}<p>${esc(post.response)}</p>${post.signals?.length ? `<div class="experience-signals">${post.signals.map(signal => `<span>${esc(signal)}</span>`).join("")}</div>` : ""}<small class="experience-time">Shared from this prototype · ${esc(post.createdAt || "Recently")}</small></article>`;
}

function dailyCommentCard(post) {
  return `<article class="daily-comment ${post.status==='pending'?'is-pending':''}"><div class="experience-person">${avatar({avatar:post.avatar,initials:post.initials||'M'},'small')}<span><strong>${esc(post.author||'Member')}</strong><small>${esc(post.label||'TryMyBuild member')}</small></span></div><p>${esc(post.response)}</p><small>${post.status==='pending'?'Awaiting review · ':''}${esc(new Date(post.createdAt).toLocaleDateString())}</small></article>`;
}

function communityPage() { return discover(true); }

function profilePage() {
  const creator = creators.find(item => item.slug === state.profileSlug) || creators[0];
  const creatorProjects = projects.filter(project => project.creatorSlug === creator.slug);
  return `<section class="page-shell profile-page"><header class="profile-hero">${avatar(creator, "large")}<div><p class="eyebrow">Creator profile</p><h1>${esc(creator.name)}</h1>${creatorVerificationBadge(creator)}<strong>${esc(creator.label)}</strong><p>${esc(creator.bio)}</p></div></header><div class="profile-trust"><span>${creatorProjects.length} projects</span><span>Public creator profile</span></div>${creator.slug === "creatorworks-studio" ? `<p class="verification-explanation">${esc(studioVerification)}</p>` : ""}<section class="profile-work"><div class="section-heading"><div><p class="eyebrow">Creator’s Collection</p><h2>Practical tools, ready to explore.</h2></div></div><div class="catalog-list">${creatorProjects.map(catalogRow).join("")}</div></section></section>`;
}

function feedbackPage() {
  const product = state.selected || projects[0];
  const creator = creatorFor(product);
  if (window.CW_SERVER) return `<section class="page-shell feedback-page"><div class="feedback-card">${creatorLink(product, true)}<p class="eyebrow">Your experience with ${esc(product.name)}</p><h1>What happened when you tried it?</h1><p>Anyone who tries a project can respond. No invitation needed.</p>${state.session?.authenticated ? `<p>Sharing as ${esc(state.session.user.displayName)}.</p><div class="feedback-choices"><button data-feedback-choice>It helped me finish the task</button><button data-feedback-choice>I understood how it worked</button><button data-feedback-choice>I got stuck somewhere</button><button data-feedback-choice>I would use it again</button></div><label>Your observation<textarea data-feedback-response maxlength="800" placeholder="What worked? What could be better?"></textarea></label><p class="comment-conduct"><strong>Be thoughtful. Be respectful.</strong> Discuss the app, not the person. Insults, harassment, and abusive wording aren’t welcome. <a href="/community-guidelines">Guidelines</a></p><small data-feedback-word-count class="word-counter">0 / 7–150 words</small><p class="feedback-error" data-feedback-error aria-live="polite"></p><button class="primary-button" data-feedback-submit>Share my experience</button><p class="prototype-disclosure">Your name and observation will be public once reviewed. This feedback goes to TryMyBuild Studio.</p>` : '<p>Sign in so your observation has a person behind it.</p><a class="primary-button" href="/auth/sign-in">Sign in to respond</a>'}</div></section>`;
  return `<section class="page-shell feedback-page"><div class="feedback-card">${creatorLink(product, true)}<p class="eyebrow">Your experience with ${esc(product.name)}</p><h1>What happened when you tried it?</h1><p>You do not need an invitation. Share something useful with ${esc(creator.name.split(" ")[0])} and with people considering this project.</p><div class="feedback-identity"><label>Name to show<input data-feedback-name maxlength="60" placeholder="Your name or public nickname" /></label><label>How you describe yourself<input data-feedback-label maxlength="60" placeholder="For example: Musician or Parent" /></label></div><div class="feedback-choices"><button data-feedback-choice>It helped me finish the task</button><button data-feedback-choice>I understood how it worked</button><button data-feedback-choice>I got stuck somewhere</button><button data-feedback-choice>I would use it again</button></div><label>What should the creator understand?<textarea data-feedback-response maxlength="800" placeholder="Tell them what worked, what surprised you, or what got in your way."></textarea></label><p class="comment-conduct"><strong>Be thoughtful. Be respectful.</strong> Discuss the app, not the person. Insults, harassment, and abusive wording aren’t welcome. <a href="/community-guidelines">Guidelines</a></p><small data-feedback-word-count class="word-counter">0 / 7–150 words</small><p class="feedback-error" data-feedback-error aria-live="polite"></p><div class="form-actions"><button class="secondary-button" data-product="${esc(product.slug)}">Not now</button><button class="primary-button" data-feedback-submit>Share my experience</button></div><p class="prototype-disclosure">Prototype note: this is not a verified account yet. Your response is saved only in this browser and can be cleared with browser data.</p></div></section>`;
}

function readListingDraft() {
  const defaults = { title: '', url: '', does: '', helps: '', firstTry: '', pricing: 'free', stage: 'Ready for a first try', category: 'Technology', visibility: 'draft', sharingPreference: 'not_sure', image: '', imageData: '', imageSourceUrl: '', imageMode: '', imageCapturedAt: '', imageTheme: '', serverId: '', serverSlug: '', serverStatus: '', imported: '', imageUploadedFor: '', clientToken: '', video: '', accountOwner: '' };
  try {
    const saved = JSON.parse(localStorage.getItem('creatorworks-listing-draft-v1') || '{}');
    for (const key of Object.keys(defaults)) if (typeof saved[key] === 'string') defaults[key] = key === 'imageData' ? CWPreviewUtils.imageData(saved[key]) : saved[key].slice(0, 2000);
  } catch {}
  return defaults;
}
const listingDraft = readListingDraft();
let listingStep = 0;
let listingSettings = new URLSearchParams(location.search).get('listing') === 'settings';
let listingCategoryOtherOpen = !primaryCategoryNames.includes(normalizeCategory(listingDraft.category));
// Start a brand-new listing (independent of any existing draft), used by "＋ New listing".
function resetListingDraft() {
  Object.assign(listingDraft, { title: '', url: '', does: '', helps: '', firstTry: '', pricing: 'free', stage: 'Ready for a first try', category: 'Technology', visibility: 'draft', sharingPreference: 'not_sure', image: '', imageData: '', imageSourceUrl: '', imageMode: '', imageCapturedAt: '', imageTheme: '', serverId: '', serverSlug: '', serverStatus: '', imported: '', imageUploadedFor: '', clientToken: '', video: '', accountOwner: '' });
  try { localStorage.removeItem('creatorworks-listing-draft-v1'); } catch {}
}
if (new URLSearchParams(location.search).get('new') === '1') { resetListingDraft(); listingSettings = false; const url = new URL(location.href); url.searchParams.delete('new'); history.replaceState({}, '', url); }
function saveListingDraft() {
  try { localStorage.setItem('creatorworks-listing-draft-v1', JSON.stringify(listingDraft)); return true; }
  catch { return false; }
}
function listingUrl(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
function listingNameFromUrl(value) {
  const url = listingUrl(value); if (!url) return '';
  const host = new URL(url).hostname.replace(/^www\./i,'').split('.')[0];
  return host.split(/[-_]+/).filter(Boolean).map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(' ').slice(0,80);
}
let listingCapture = { state: 'idle', message: '', attempted: '', revision: 0, controller: null };
function listingImage() {
  // A stored image may be an absolute http(s) link or a same-origin server path (/api/project-image/…).
  const stored = listingDraft.image ? (listingDraft.image.startsWith('/') ? listingDraft.image : listingUrl(listingDraft.image)) : '';
  return listingDraft.imageSourceUrl === listingUrl(listingDraft.url) ? CWPreviewUtils.imageData(listingDraft.imageData) || stored : stored;
}
function refreshListingPreview() {
  const region = document.querySelector('[data-listing-preview-region]');
  if (region) region.outerHTML = listingPreview();
  const video = document.querySelector('[data-listing-video-preview]');
  if (video) video.innerHTML = videoPlayer(listingDraft.video);
}
function invalidateListingCapture() {
  listingCapture.revision++; listingCapture.controller?.abort(); listingCapture.state = 'idle'; listingCapture.message = ''; listingCapture.attempted = '';
  // A changed project link must never retain another project's automatic/uploaded image.
  if (listingDraft.imageSourceUrl !== listingUrl(listingDraft.url)) {
    listingDraft.imageData = ''; listingDraft.imageSourceUrl = ''; listingDraft.imageMode = ''; listingDraft.imageTheme = '';
  }
}
async function ensureListingScreenshot(force = false) {
  const url = listingUrl(listingDraft.url);
  if (!url || (!force && (listingImage() || listingCapture.attempted === url)) || listingCapture.state === 'loading') return;
  if (window.CW_SERVER && !state.session?.authenticated) {
    if(listingCapture.state==='sign-in-required')return;
    listingCapture.state='sign-in-required';
    listingCapture.message = 'Automatic screenshots are available after sign-in. You can upload your own screenshot or continue without one.';
    refreshListingPreview(); return;
  }
  const revision = ++listingCapture.revision;
  listingCapture.attempted = url; listingCapture.state = 'loading'; listingCapture.message = 'Capturing your website… You can keep going while it loads.';
  listingCapture.controller?.abort(); const controller = new AbortController(); listingCapture.controller = controller;
  refreshListingPreview();
  const timer = setTimeout(() => controller.abort(), 28000);
  try {
    const response = await fetch('/api/listing-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }), signal: controller.signal });
    const result = await response.json().catch(() => { throw Error('Website capture is unavailable. Retry or upload a screenshot.'); });
    if (!response.ok || !CWPreviewUtils.imageData(result.image)) throw Error(result.error || 'No screenshot was returned. Upload an image or retry.');
    if (revision !== listingCapture.revision || url !== listingUrl(listingDraft.url)) return;
    listingDraft.imageData = result.image; listingDraft.imageSourceUrl = url; listingDraft.imageMode = 'automatic'; listingDraft.imageCapturedAt = result.capturedAt || '';
    listingDraft.imageTheme = JSON.stringify(CWPreviewUtils.theme(result.appearance));
    listingCapture.state = 'ready'; listingCapture.message = saveListingDraft() ? 'Website screenshot added and saved with this draft.' : 'Image added, but your browser could not save it. Keep this tab open or choose a smaller image.';
  } catch (error) {
    if (revision !== listingCapture.revision) return;
    listingCapture.state = 'error'; listingCapture.message = error.name === 'AbortError' ? 'Capture took too long. Retry or upload your own screenshot.' : error.message;
  } finally { clearTimeout(timer); if (revision === listingCapture.revision) refreshListingPreview(); }
}
async function useListingScreenshot(file) {
  const error = CWPreviewUtils.fileError(file);
  if (error) { listingCapture.message = error; refreshListingPreview(); return; }
  const url = listingUrl(listingDraft.url), revision = ++listingCapture.revision;
  listingCapture.controller?.abort(); listingCapture.state = 'uploading'; listingCapture.attempted = url; listingCapture.message = 'Preparing your screenshot…'; refreshListingPreview();
  let bitmap;
  try {
    const bytes = new Uint8Array(await file.slice(0,12).arrayBuffer());
    const signature = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? 'image/jpeg' : bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71 ? 'image/png' : String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8,12)) === 'WEBP' ? 'image/webp' : '';
    if (signature !== file.type) throw Error('That file is not a supported screenshot. Choose a PNG, JPG, or WebP image.');
    bitmap = await createImageBitmap(file);
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 40000000) throw Error('Choose a screenshot smaller than 40 megapixels.');
    const canvas = document.createElement('canvas'), scale = Math.min(1,1280 / bitmap.width,1280 / bitmap.height);
    canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
    let image = canvas.toDataURL('image/jpeg', .8); if (image.length > 900000) image = canvas.toDataURL('image/jpeg', .55);
    if (!CWPreviewUtils.imageData(image)) throw Error('This image is too detailed to save. Try a smaller screenshot.');
    const sample = document.createElement('canvas'); sample.width = 12; sample.height = 12; const sampleCtx = sample.getContext('2d'); sampleCtx.drawImage(canvas,0,0,12,12);
    const pixels = sampleCtx.getImageData(0,0,12,12).data, colors = new Map(); let accent = '#173b30', saturation = 0;
    for (let i=0;i<pixels.length;i+=4) { const c = [pixels[i],pixels[i+1],pixels[i+2]], key = 'rgb(' + c.map(n=>Math.min(255,Math.round(n/32)*32)).join(',') + ')'; colors.set(key,(colors.get(key)||0)+1); const s = Math.max(...c)-Math.min(...c); if(s > saturation) { saturation = s; accent = key; } }
    const background = [...colors].sort((a,b)=>b[1]-a[1])[0]?.[0] || '#fff';
    if (revision !== listingCapture.revision || url !== listingUrl(listingDraft.url)) return;
    listingDraft.imageData = image; listingDraft.imageSourceUrl = url; listingDraft.imageMode = 'upload'; listingDraft.imageCapturedAt = ''; listingDraft.imageTheme = JSON.stringify(CWPreviewUtils.theme({ background, accent }));
    listingCapture.state = 'ready'; listingCapture.message = saveListingDraft() ? 'Your screenshot is saved with this draft on this device.' : 'Image added, but your browser could not save it. Keep this tab open or use a smaller image.';
  } catch (error) { if(revision === listingCapture.revision) {listingCapture.state = 'error'; listingCapture.message = error.message || 'We couldn’t read that image.';} }
  finally { bitmap?.close(); if(revision === listingCapture.revision) refreshListingPreview(); }
}
function listingImageControls() {
  const busy = ['loading','uploading'].includes(listingCapture.state);
  const guest = window.CW_SERVER && !state.session?.authenticated;
  return `<section class="listing-image-tools" aria-label="Website screenshot"><p role="status" aria-live="polite">${esc(listingCapture.message || (listingImage() ? 'Your website preview is ready.' : 'Add a screenshot of the page people will try.'))}</p><div class="listing-image-drop" data-listing-image-drop><label> ${listingImage() ? 'Replace screenshot' : 'Upload a screenshot'}<input type="file" data-listing-image-upload accept="image/png,image/jpeg,image/webp"></label><span>Or drop it here · PNG, JPG, WebP · up to 5 MB</span></div><button type="button" class="secondary-button" data-listing-capture ${guest?'hidden':''} ${busy?'disabled':''}>${busy?'Preparing image…':listingImage()?'Recapture website':'Retry website capture'}</button><p class="listing-image-note">Automatic capture reads only the public website, never a page signed in to your app. If it shows a login screen or misses interactive content, upload your own screenshot. Your draft stays on this device.</p></section>`;
}
document.addEventListener('click', event => { if(event.target.closest('[data-listing-capture]')) void ensureListingScreenshot(true); });
document.addEventListener('change', event => { if(event.target.matches('[data-listing-image-upload]')) void useListingScreenshot(event.target.files?.[0]); });
document.addEventListener('dragover', event => { if(event.target.closest('[data-listing-image-drop]')) {event.preventDefault();event.dataTransfer.dropEffect='copy';} });
document.addEventListener('drop', event => { if(event.target.closest('[data-listing-image-drop]')) {event.preventDefault();void useListingScreenshot(event.dataTransfer.files?.[0]);} });
document.addEventListener('error', event => { if(event.target.matches?.('[data-listing-screenshot]')) {listingCapture.state='error';listingCapture.message='That image could not be displayed. Upload another screenshot or retry capture.';listingDraft.imageData='';listingDraft.image='';saveListingDraft();refreshListingPreview();} },true);
function listingField(key, label, placeholder, multiline = false) {
  const control = multiline
    ? `<textarea data-listing-field="${key}" maxlength="140" required aria-describedby="words-${key}" placeholder="${placeholder}">${esc(listingDraft[key])}</textarea><small id="words-${key}" class="word-counter" data-word-counter="${key}">Word count: ${CWListingRules.count(listingDraft[key])}</small><small class="word-rules">Minimum: 4 words · Maximum: 10 words</small>`
    : `<input data-listing-field="${key}" value="${esc(listingDraft[key])}" maxlength="${key === 'url' ? 2000 : 80}" type="${key === 'url' ? 'url' : 'text'}" required placeholder="${placeholder}" />`;
  return `<label class="listing-field">${label}${control}</label>`;
}
function listingPricingField() { return '<label class="listing-field">Pricing<select data-listing-field="pricing">'+Object.entries(CWPricing.labels).map(([value,label])=>'<option value="'+value+'" '+(listingDraft.pricing===value?'selected':'')+'>'+label+'</option>').join('')+'</select></label>'; }
function listingCategoryPicker() {
  const normalized = normalizeCategory(listingDraft.category);
  const selected = categoryCatalog.find(c=>c.name.toLowerCase()===normalized.toLowerCase())?.name || normalized;
  const choice = listingCategoryOtherOpen || !categoryCatalog.some(c=>c.name===selected) ? '__other__' : selected;
  return `<fieldset class="listing-category-field"><legend>Category</legend>
    <label class="listing-field"><span class="sr-only">Choose a common category or Other</span><select data-listing-category-choice>
      ${categoryCatalog.map(({name}) => `<option value="${esc(name)}" ${choice === name ? 'selected' : ''}>${esc(name)}</option>`).join('')}
      <option value="__other__" ${choice === '__other__' ? 'selected' : ''}>Other…</option>
    </select></label>
    ${choice === '__other__' ? `<label class="listing-field listing-category-search">Suggest a category
      <input data-listing-category-custom list="creatorworks-category-catalog" value="${esc(selected)}" maxlength="48" autocomplete="off" placeholder="Start typing, for example: Music & audio" required aria-describedby="listing-category-help" />
      <datalist id="creatorworks-category-catalog">${categoryCatalog.map(category => `<option value="${esc(category.name)}"></option>`).join('')}</datalist>
    </label><p class="share-name-hint" id="listing-category-help">Choose a match when possible. If none fits, enter a short category people would naturally search for.</p>` : ''}
  </fieldset>`;
}
function listingPreview() {
  const url = listingUrl(listingDraft.url);
  const image = listingImage();
  queueMicrotask(() => { void ensureListingScreenshot(); });
  return `<div data-listing-preview-region><article class="listing-preview-card"><header class="mealmap-top"><span class="mealmap-wordmark">${esc(listingDraft.title || 'Your project')}<small>${esc(listingDraft.category)} · ${esc(listingDraft.stage)}</small></span></header><div class="mealmap-intro listing-preview-hero">${image ? `<img data-listing-screenshot src="${esc(image)}" alt="Preview of ${esc(listingDraft.title)}" referrerpolicy="no-referrer" />` : ''}<h2>${esc(listingDraft.does || listingDraft.title || 'Your project')}</h2></div><section class="mealmap-answers">${url ? `<div class="mealmap-action"><a class="primary-button" href="${esc(url)}" target="_blank" rel="noopener noreferrer">Open ${esc(listingDraft.title || 'project')} ↗</a></div>` : ''}<div class="mealmap-answer-grid"><article><h3>How does it help me?</h3><p>${esc(listingDraft.helps)}</p></article><article><h3>What feature should I try first?</h3><p>${esc(listingDraft.firstTry)}</p></article></div></section></article>${listingImageControls()}</div>`;
}
function listingIdentityConfirmation() {
  const image = listingImage();
  const busy = ['loading','uploading'].includes(listingCapture.state), guest = window.CW_SERVER && !state.session?.authenticated;
  const message = listingCapture.message || (image ? 'Your website preview is ready.' : 'We’ll capture the public page. You can replace the image.');
  queueMicrotask(() => { void ensureListingScreenshot(); });
  return `<div class="listing-identity-confirmation">${image ? `<img data-listing-screenshot src="${esc(image)}" alt="Screenshot captured from your app" referrerpolicy="no-referrer" />` : `<div class="listing-capture-placeholder" aria-hidden="true"><span></span><span></span><span></span></div>`}<div class="listing-identity-tools"><p role="status" aria-live="polite">${esc(message)}</p><div><label class="secondary-button">${image?'Replace image':'Upload screenshot'}<input class="sr-only" type="file" data-listing-image-upload accept="image/png,image/jpeg,image/webp"></label><button type="button" class="secondary-button" data-listing-capture ${guest?'hidden':''} ${busy?'disabled':''}>${busy?'Preparing…':'Retry capture'}</button></div></div></div>`;
}
function listingSettingsPage() {
  if (!window.CW_SERVER && !state.session) return listingAccountPage();
  if (!state.session) return `<section class="page-shell listing-review"><h1>Loading your account…</h1></section>`;
  if (!state.session.authenticated) return listingAccountPage();
  const name = esc(state.session.user?.displayName || 'a TryMyBuild member');
  const hasServer = !!listingDraft.serverId;
  const status = listingDraft.serverStatus;
  const statusNote = !hasServer ? 'Your answers are saved on this device only.'
    : status === 'in_review' ? 'Submitted for review. It appears in the catalog once an administrator approves it.'
    : status === 'published' ? 'Published and publicly discoverable.'
    : status === 'unpublished' ? 'Unpublished. Hidden from the catalog until you submit it again.'
    : 'Saved to your account as a private draft. Only you can see it.';
  const importCard = hasServer ? `<section class="cw-panel"><h2>Builds & updates</h2><p>Add release notes and choose which build is active. Announce improvements to people who saved your project.</p><a class="secondary-button" href="/dashboard/builds?project=${encodeURIComponent(listingDraft.serverSlug)}">Manage builds</a></section>` : `<div class="cw-panel listing-import"><h2>Save this draft to your account</h2><p>Your draft is currently on this device only. Save it to your account (${name}) so you can publish it and reach it from any device.</p><button class="primary-button" data-listing-save-server>Save to my account</button><p class="privacy-note">🔒 Nothing is published yet. Your on-device draft is kept until the save is confirmed.</p></div>`;
  const publishControls = !hasServer ? '' : `<div class="cw-panel"><p role="status" data-listing-server-status>${esc(statusNote)}</p><div class="form-actions">${status === 'published'
      ? `<a class="primary-button" href="/?category=${encodeURIComponent(listingDraft.category)}&highlight=${encodeURIComponent(listingDraft.serverSlug)}">View my project in catalog</a><button class="secondary-button" data-listing-unpublish>Unpublish</button>`
      : status === 'in_review'
        ? '<button class="secondary-button" data-listing-unpublish>Withdraw from review</button>'
        : '<button class="primary-button" data-listing-publish>Publish — submit for review</button>'}<a class="share-browse-link" href="/dashboard?view=creator">Go to My projects →</a></div><p class="privacy-note">Publishing sends your listing for a quick founder review before it appears publicly. You can unpublish anytime.</p></div>`;
  return `<section class="page-shell listing-review"><p class="eyebrow">Your project · Settings</p><h1>Make it yours.</h1><p>Signed in as ${name}.</p><form data-listing-settings>${sharingPreferenceFields()}${listingField('title', 'Project name', 'Your project name')}${listingField('url', 'Project link', 'https://your-project.com')}${listingCategoryPicker()}${listingPricingField()}${listingField('does','What does your project do?','Describe your project in 4–10 words.',true)}${listingField('helps','How does it help people?','Explain the benefit in 4–10 words.',true)}${listingField('firstTry','What should someone try first?','Suggest one action in 4–10 words.',true)}${videoField()}<p class="share-name-hint">Each answer needs 4–10 words. Edit your screenshot in the preview below. Categories appear in homepage filters only when a listing is published. Drafts never create public filters.</p><p data-video-status class="video-status" role="status"></p><div class="form-actions share-start-actions"><button class="primary-button" type="submit">${hasServer ? 'Save changes' : 'Save draft'}</button><button class="secondary-button" type="button" data-listing-review>Back</button><button type="button" class="secondary-button listing-reset-button" data-listing-reset>Start over</button></div><p data-listing-status role="status"></p></form>${importCard}${publishControls}${listingPreview()}</section>`;
}
function listingAccountPage() {
  return `<section class="page-shell listing-review"><p class="eyebrow">Keep your project yours</p><h1>Create your creator account.</h1><p>Your draft is ready. Sign up or sign in to continue to project settings.</p><form method="get" action="/auth/sign-in" class="legal-signup"><input type="hidden" name="signup" value="1"><input type="hidden" name="next" value="listing"><label class="legal-agreement"><input type="checkbox" required> <span>I agree to the <a href="/terms" target="_blank" rel="noopener">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener">Privacy Policy</a>.</span></label><button class="primary-button" type="submit">Create my account</button></form><div class="form-actions share-start-actions"><a class="share-browse-link" href="/auth/sign-in?next=listing">Already have an account? Sign in</a><button class="share-browse-link" data-listing-review>Back</button></div><p class="privacy-note">Your draft stays on this device through sign-in. Nothing is public yet.</p></section>`;
}
function sharePage() {
  return discover(true);
}
function listingJourney() {
  if (listingSettings) return listingSettingsPage();
  if (listingStep === 8) return listingAccountPage();
  if (listingStep < 7) return inlineListingForm();
  return `<section class="page-shell listing-review"><p class="eyebrow">8 · Preview your listing</p><h1>Ready to share.</h1><p>Check what visitors will see before you continue.</p>${listingPreview()}<div class="form-actions share-start-actions"><button class="primary-button" data-listing-share>Confirm and continue</button><button class="secondary-button" data-listing-back>Back</button><button type="button" class="secondary-button listing-reset-button" data-listing-reset>Start over</button></div><p class="privacy-note">Next: sign up or sign in, then confirm project settings. Nothing is published or sent yet.</p><p data-listing-status role="status"></p></section>`;
}
document.addEventListener('input', event => {
  const field = event.target.closest('[data-listing-field]');
  if (field) { const changed = listingDraft[field.dataset.listingField] !== field.value; listingDraft[field.dataset.listingField] = field.value; if (changed && field.dataset.listingField === 'url') invalidateListingCapture(); if(changed && field.dataset.listingField === 'image') listingDraft.imageData = ''; saveListingDraft(); if (changed && field.dataset.listingField === 'video') refreshListingPreview(); }
  const category = event.target.closest('[data-listing-category-custom]');
  if (category) { listingDraft.category = category.value; category.setCustomValidity(normalizeCategory(category.value)?'':'Enter a short, recognizable category name.'); saveListingDraft(); }
});
document.addEventListener('change', event => {
  const field = event.target.closest('[data-listing-field]');
  if (field) { const changed = listingDraft[field.dataset.listingField] !== field.value; listingDraft[field.dataset.listingField] = field.value; if (changed && field.dataset.listingField === 'url') invalidateListingCapture(); if(changed && field.dataset.listingField === 'image') listingDraft.imageData = ''; saveListingDraft(); if (changed && field.dataset.listingField === 'video') refreshListingPreview(); }
  const choice = event.target.closest('[data-listing-category-choice]');
  if (choice) {
    listingCategoryOtherOpen = choice.value === '__other__';
    if (!listingCategoryOtherOpen) listingDraft.category = normalizeCategory(choice.value);
    else if (categoryCatalog.some(c=>c.name.toLowerCase()===normalizeCategory(listingDraft.category).toLowerCase())) listingDraft.category = '';
    saveListingDraft(); renderMenuChange('[data-listing-category-choice]');
  }
  const category = event.target.closest('[data-listing-category-custom]');
  if (category) {
    const normalized = normalizeCategory(category.value);
    if (normalized) { listingDraft.category = normalized; category.value = normalized; saveListingDraft(); }
  }
});
function markListingFieldsForAttention(form) {
  form.dataset.validationAttempted = 'true';
  let firstInvalid = null;
  form.querySelectorAll('[data-listing-field]').forEach(field => {
    const key = field.dataset.listingField;
    const invalid = ['does','helps','firstTry'].includes(key)
      ? !CWListingRules.valid(field.value)
      : key === 'url' ? !listingUrl(field.value) : !field.validity.valid;
    field.setAttribute('aria-invalid', String(invalid));
    if (invalid && !firstInvalid) firstInvalid = field;
  });
  return firstInvalid;
}
document.addEventListener('invalid', event => {
  const form = event.target.closest('[data-listing-step], [data-listing-settings]');
  if (form) markListingFieldsForAttention(form);
}, true);
document.addEventListener('input', event => {
  const form = event.target.closest('[data-listing-step], [data-listing-settings]');
  if (form?.dataset.validationAttempted) markListingFieldsForAttention(form);
});
document.addEventListener('submit', event => {
  const form = event.target.closest('[data-listing-step], [data-listing-settings]');
  if (!form) return;
  event.preventDefault();
  const status = form.querySelector('[data-listing-status]');
  const firstInvalidField = markListingFieldsForAttention(form);
  const journeyFields = {0:['url'],1:['title'],2:['does'],3:['helps'],4:['firstTry']};
  const fields = form.hasAttribute('data-listing-settings') ? ['title','url','does','helps','firstTry'] : (journeyFields[listingStep] || []);
  if (fields.some(key => !listingDraft[key].trim())) { status.textContent = 'Please add a short answer to each field.'; return; }
  if ((form.hasAttribute('data-listing-settings') ? ['does','helps','firstTry'] : fields).some(key=>['does','helps','firstTry'].includes(key)&&!CWListingRules.valid(listingDraft[key]))) { status.textContent='Use 4–10 words before continuing.'; firstInvalidField?.focus(); return; }
  if (!listingUrl(listingDraft.url)) { status.textContent = 'Enter a complete http or https project link.'; return; }
  if (form.hasAttribute('data-listing-settings')) {
    const normalizedCategory = normalizeCategory(listingDraft.category);
    if (!normalizedCategory) { status.textContent = 'Choose a category or enter a short, recognizable category name.'; return; }
    listingDraft.category = normalizedCategory;
  }
  if (!saveListingDraft()) { status.textContent = 'Your browser could not save this draft. Please enable site storage before continuing.'; return; }
  if (form.hasAttribute('data-listing-settings')) {
    if (window.CW_SERVER && state.session?.authenticated) {
      // Material changes to a public/in-review listing send it back for review — warn first.
      if ((listingDraft.serverStatus === 'published' || listingDraft.serverStatus === 'in_review') &&
          !confirm('Saving changes takes this listing out of the public catalog and sends it back for review before it’s public again. Continue?')) {
        status.textContent = 'No changes saved.'; return;
      }
      status.textContent = 'Saving to your account…';
      saveServerListing(status).then(() => { status.textContent = 'Saved to your account. This listing is a private draft; publish it for review when you’re ready.'; render(); })
        .catch(error => { status.textContent = error.message || 'Could not save to your account. Your on-device draft is kept.'; });
    } else {
      status.textContent = 'Draft settings saved on this device. Your project has not been published.';
    }
    return;
  }
  if (listingStep === 0) { if (!listingDraft.title.trim()) listingDraft.title = listingNameFromUrl(listingDraft.url); saveListingDraft(); void ensureListingScreenshot(); }
  listingStep = Math.min(7,listingStep+1); render();
});

// Server-backed listing persistence. The on-device draft is never cleared until the server confirms,
// and the account is only ever attached after an explicit action by the signed-in creator.
async function saveServerListing(statusEl) {
  if (listingDraft.accountOwner && listingDraft.accountOwner !== state.session?.user?.id) throw new Error('This draft belongs to another account. Open a project from My projects or choose Start over.');
  if (listingDraft.video && !CWMedia.videoUrl(listingDraft.video)) throw new Error('Use a YouTube, Vimeo, or Loom video URL or iframe embed.');
  const body = { action: 'save', title: listingDraft.title, url: listingDraft.url, does: listingDraft.does, helps: listingDraft.helps, firstTry: listingDraft.firstTry, sharingPreference: listingDraft.sharingPreference, category: normalizeCategory(listingDraft.category), pricing: listingDraft.pricing, stage: listingDraft.stage, video: listingDraft.video };
  if (listingDraft.serverId) body.id = listingDraft.serverId;
  else {
    // Stable per-draft identity → retrying a create returns the same project instead of duplicating it.
    if (!listingDraft.clientToken) { listingDraft.clientToken = (self.crypto && crypto.randomUUID) ? crypto.randomUUID() : `t-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`; saveListingDraft(); }
    body.clientToken = listingDraft.clientToken;
  }
  const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok || !data.project) throw new Error(data.error || 'Could not save to your account.');
  listingDraft.serverId = data.project.id; listingDraft.serverSlug = data.project.slug; listingDraft.serverStatus = data.project.status; listingDraft.imported = 'yes'; listingDraft.accountOwner = state.session?.user?.id || '';
  saveListingDraft();
  if (listingDraft.imageData && listingDraft.imageUploadedFor !== data.project.slug) {
    if (statusEl) statusEl.textContent = 'Saving your screenshot…';
    const up = await fetch('/api/project-image/' + encodeURIComponent(data.project.slug), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: listingDraft.imageData }) });
    const upData = await up.json();
    if (!up.ok) throw new Error(upData.error || 'Your text saved, but the screenshot upload failed. Please retry.');
    listingDraft.imageUploadedFor = data.project.slug; saveListingDraft();
  }
  return data.project;
}

document.addEventListener('click', async event => {
  const saveBtn = event.target.closest('[data-listing-save-server]');
  const publishBtn = event.target.closest('[data-listing-publish]');
  const unpublishBtn = event.target.closest('[data-listing-unpublish]');
  if (!saveBtn && !publishBtn && !unpublishBtn) return;
  event.preventDefault();
  const statusEl = document.querySelector('[data-listing-server-status]') || document.querySelector('[data-listing-status]');
  const button = saveBtn || publishBtn || unpublishBtn;
  button.disabled = true;
  try {
    if (saveBtn) { await saveServerListing(statusEl); }
    else if (publishBtn) { if(listingDraft.sharingPreference && listingDraft.sharingPreference!=='public')throw new Error('Choose Publicly in sharing preferences before submitting for public review.'); await saveServerListing(statusEl); const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'submit', id: listingDraft.serverId }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Could not submit for review.'); listingDraft.serverStatus = data.project.status; saveListingDraft(); }
    else if (unpublishBtn) { const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'unpublish', id: listingDraft.serverId }) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Could not update.'); listingDraft.serverStatus = data.project.status; saveListingDraft(); }
    render();void loadDailyComments();
  } catch (error) { if (statusEl) statusEl.textContent = error.message || 'That did not work. Your draft is safe; please try again.'; button.disabled = false; }
});
document.addEventListener('click', event => {
  const stage = event.target.closest('[data-listing-stage]');
  if (stage) { listingDraft.stage = stage.dataset.listingStage; saveListingDraft(); render(); }
  if (event.target.closest('[data-listing-back]')) { listingStep = Math.max(0,listingStep-1); render(); }
  if (event.target.closest('[data-listing-review]')) { listingSettings = false; listingStep = 7; state.route = 'share'; render(); }
  if (event.target.closest('[data-listing-decide-later]')) { listingDraft.sharingPreference = 'not_sure'; saveListingDraft(); listingStep = 7; render(); }
  if (event.target.closest('[data-listing-share]')) {
    if (!saveListingDraft()) { document.querySelector('[data-listing-status]').textContent = 'Your browser could not save this draft. Please enable site storage before signing in.'; return; }
    if (state.session?.authenticated) { listingSettings = true; void saveServerListing().then(() => render()).catch(error => { const el = document.querySelector('[data-listing-status]'); if (el) el.textContent = error.message; }); } else listingStep = 8;
    render();
  }
});

function shareFrame(title, copy, body, nextLabel = "Continue") {
  const progress = ((state.creatorStep + 1) / 6) * 100;
  const visual = state.creatorStep === 3 ? `<aside class="share-visual share-visual-intro"><div class="share-visual-copy"><p class="eyebrow">For people who make things</p><h2>A small difference can mean a lot.</h2></div><div class="share-evidence"><p>“Focus on the user’s problem rather than possible solutions.”</p><p class="share-evidence-source">— GOV.UK Service Manual, guidance on understanding user needs. <a href="https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs" target="_blank" rel="noopener noreferrer">Source</a></p></div><img src="assets/illustrations/creatorworks-small-difference-v1.png" width="1536" height="1024" alt="The creator imagines someone feeling relieved after completing an everyday task with his project." /><p class="share-reassurance"><strong>What would a good experience look like?</strong> A little time saved, a frustrating task made easier, or something enjoyable created. Start with what you hope will happen—real feedback will help you find out.</p></aside>` : state.creatorStep === 2 ? `<aside class="share-visual share-visual-intro"><div class="share-visual-copy"><p class="eyebrow">For people who make things</p><h2>Someone you know might be glad you asked.</h2></div><div class="share-evidence"><p>We tend to underestimate how willing people are to help—and overestimate the inconvenience.</p><p class="share-evidence-source">Research by Xuan Zhao and Nicholas Epley, 2022. <a href="https://pubmed.ncbi.nlm.nih.gov/36067802/" target="_blank" rel="noopener noreferrer">Source</a></p></div><img src="assets/illustrations/creatorworks-reach-out-v1.png" width="1536" height="1024" alt="A hopeful creator holds his phone and imagines reaching out to a friend." /><p class="share-reassurance"><strong>Start with someone you can talk to.</strong> A friend can do more than leave a review—you can ask what confused them, hear why, and try an improvement together. Choose someone who might actually use your project, and invite honesty over encouragement.</p></aside>` : state.creatorStep === 1 ? `<aside class="share-visual share-visual-intro"><div class="share-visual-copy"><p class="eyebrow">For people who make things</p><h2>Let real use shape what comes next.</h2></div><div class="share-evidence"><p>“The feedback you get from engaging directly with your earliest users will be the best you ever get.”</p><p class="share-evidence-source">— Paul Graham, <a href="https://paulgraham.com/ds.html" target="_blank" rel="noopener noreferrer">Do Things That Don’t Scale</a>, 2013.</p></div><img src="assets/illustrations/creatorworks-first-user-v1.png" width="1536" height="1024" alt="The creator takes notes while an early user tries his project on a laptop." /><p class="share-reassurance"><strong>Start small. Learn from someone using what you’ve made.</strong> Their experience can reveal what works, what’s confusing, and what to improve next.</p></aside>` : state.creatorStep === 0 ? `<aside class="share-visual share-visual-intro"><div class="share-visual-copy"><p class="eyebrow">For people who make things</p><h2>You have an idea.<br>How do you know if it’s good?</h2></div><div class="share-evidence"><p><strong>42% of failed startups said people didn’t need their product.</strong></p><p class="share-evidence-source">Based on 101 failed startups studied by CB Insights. <a href="https://s3-us-west-2.amazonaws.com/cbi-content/research-reports/The-20-Reasons-Startups-Fail.pdf" target="_blank" rel="noopener noreferrer" aria-label="Read the CB Insights startup failure study (opens in a new tab)">Source</a></p></div><img src="assets/illustrations/creatorworks-idea-v1.png" width="1536" height="1024" alt="A smiling creator at his laptop imagines an idea, shown as a lightbulb in a thought bubble." /><p class="share-reassurance"><strong>You don’t have to figure it out alone.</strong> Share what you’re making with real people, hear what helps, and discover what to improve.</p></aside>` : `<aside class="share-visual"><div class="share-visual-copy"><p class="eyebrow">For people who make things</p><h2>You do not have to sell it yet.</h2><p>Share it with a few people. Learn what truly helps. Improve it with confidence.</p></div><img src="assets/illustrations/creatorworks-creator-benefit-v2.png" alt="A creator shares an early product, learns from trusted people, and improves it before selling." /></aside>`;
  return `<div class="share-layout${state.creatorStep < 4 ? " share-layout-intro" : ""}">${visual}<div class="share-work"><div class="share-progress"><span style="width:${progress}%"></span></div><p class="eyebrow">${state.creatorStep >= 2 && state.creatorStep <= 3 ? "Your project" : "Your private workspace"} · ${state.creatorStep + 1} of 6</p><h1>${title}</h1><p class="share-copy">${copy}</p>${body}<div class="form-actions${state.creatorStep < 4 ? " share-start-actions" : ""}">${state.creatorStep > 3 ? `<button class="secondary-button" data-share-back>Back</button>` : ""}<button class="primary-button" data-share-next>${nextLabel}</button>${state.creatorStep === 0 ? `<button type="button" class="share-browse-link" data-route="discover">Browse other projects</button>` : state.creatorStep > 0 && state.creatorStep < 4 ? `<button type="button" class="share-browse-link" data-share-back>Back</button>` : ""}</div><p class="privacy-note">🔒 ${state.creatorStep === 3 ? "Your best guess is enough for now." : state.creatorStep === 2 ? "No invitation is sent and nothing is published at this step." : "Private until you choose otherwise. Your work remains yours."}</p></div></div>`;
}

function shareStart() {
  return shareFrame("What are you making?", "Start with the place where someone can experience it.", `<label class="big-input">Project link<input data-creator-field="url" value="${esc(state.creator.url)}" placeholder="https://your-project.com" /></label><button class="drop-zone" data-demo-drop><span>＋</span><strong>Or add a safe preview</strong><small>Screenshot, short video, or public description</small></button>`, "I’m ready");
}
function shareStage() {
  const options = [
    ["I’m still shaping it", "Still taking shape", "I have an idea or early work, but nothing people can try yet."],
    ["Someone can try it", "Ready for a first try", "I have a working version someone can explore."],
    ["People already use it", "Being tested by early users", "A few people are using it and helping me improve it."],
    ["Finished and launched", "Finished and launched", "My project is publicly available, and I’m looking for feedback."]
  ];
  const choices = `<div class="choice-grid stage-choices" role="group" aria-label="Project stage">${options.map(([value, label, description]) => `<button type="button" class="choice-button ${value === state.creator.stage ? "is-selected" : ""}" aria-pressed="${value === state.creator.stage}" data-creator-choice="stage" data-value="${esc(value)}"><span aria-hidden="true">${value === state.creator.stage ? "✓" : ""}</span><div><strong>${label}</strong><small>${description}</small></div></button>`).join("")}</div>`;
  return shareFrame("What stage is your project at?", "Choose the closest match. It’s okay if you’re still figuring things out.", choices, "Continue");
}
function shareAudience() {
  return shareFrame("Anyone come to mind?", "If someone comes to mind, write their first name. You don’t have to predict their answer—or choose anyone right now.", `<label class="big-input">Their first name · Optional<input data-creator-field="participant" value="${esc(state.creator.participant)}" maxlength="60" placeholder="For example: Alex" aria-describedby="share-name-hint" /></label><p class="share-name-hint" id="share-name-hint">You can leave this blank and continue.</p><div class="share-optional-note"><strong>No one comes to mind? You can still move forward.</strong><p>List your project for others to discover, and decide later who you’d like to invite.</p></div>`, "Continue");
}
function shareBenefit() {
  const options = ["Save time", "Make a task easier", "Create or express something", "Stay organized", "Make a decision", "Learn something new", "Have fun or connect with others", "Something else"];
  const legacy = { "Save them time": "Save time", "Make something easier": "Make a task easier", "Help them create": "Create or express something", "Keep them organized": "Stay organized", "Help them decide": "Make a decision" };
  const selected = legacy[state.creator.benefit] || state.creator.benefit;
  const choices = `<div class="choice-grid benefit-choices" role="group" aria-label="Main project benefit">${options.map(option => `<button type="button" class="choice-button ${option === selected ? "is-selected" : ""}" aria-pressed="${option === selected}" data-creator-choice="benefit" data-value="${esc(option)}"><span aria-hidden="true">${option === selected ? "✓" : ""}</span>${option}</button>`).join("")}</div>${selected === "Something else" ? `<label class="big-input benefit-other">In a few words · Optional<input data-creator-field="benefitOther" value="${esc(state.creator.benefitOther || "")}" maxlength="160" placeholder="For example: feel more confident" /></label>` : ""}`;
  return shareFrame("What do you hope your project helps people do?", "Choose the closest match. You can refine it as you learn.", choices, "Continue");
}
function shareInvitation() {
  return shareFrame("Who could try it first?", "Begin with one honest conversation—not a public launch.", `<label class="big-input">First person<input data-creator-field="participant" value="${esc(state.creator.participant)}" placeholder="Their first name" /></label><div class="invitation-preview"><span>Private invitation</span><p>“I made something and thought of you. Would you try it and tell me what happened?”</p><small>One person · private link · not searchable</small></div>`, "Create my private invitation");
}
function shareComplete() {
  const name = state.creator.participant || "someone you trust";
  return shareFrame("You are ready for one honest conversation.", `Your work does not need to compete yet. Let ${esc(name)} experience it and tell you what is true.`, `<div class="completion-mark">✓</div><div class="completion-summary"><span>What happens next</span><strong>Share privately → Listen → Improve → Decide when you are ready</strong></div>`, "Return to the catalog");
}

function optionButtons(options, selected, field) {
  return `<div class="choice-grid">${options.map(option => `<button class="choice-button ${option === selected ? "is-selected" : ""}" data-creator-choice="${field}" data-value="${option}"><span>${option === selected ? "✓" : ""}</span>${option}</button>`).join("")}</div>`;
}

function accountPage() {
  if (window.CW_SERVER) return (state.session?.authenticated ? '<nav class="page-shell account-actions" aria-label="My workspaces"><a class="primary-button" href="/dashboard">For me →</a><a class="secondary-button" href="/dashboard?view=creator">Creator workspace →</a></nav>' : '') + serverAccountPage();
  return welcomeAccountPage();
}

function serverAccountPage() {
  const session = state.session;
  if (!session) return `<section class="account-hero"><h1>Your TryMyBuild</h1><p>Checking your sign-in…</p></section>`;
  if (!session.authenticated) return welcomeAccountPage();
  const person = session.user;
  return `<section class="page-shell feedback-page"><div class="feedback-card">${session.isAdmin ? '<p><a class="secondary-button" href="/admin">Administration →</a></p>' : ""}<p class="eyebrow">Your TryMyBuild</p><h1>Welcome, ${esc(person.displayName)}.</h1>${session.databaseReady ? `<form data-profile-form><div class="feedback-identity"><label>Your public name<input name="displayName" value="${esc(person.displayName)}" maxlength="60" required></label><label>How you describe yourself<input name="label" value="${esc(person.label || '')}" maxlength="60" placeholder="Musician, Parent, Engineer…"></label></div><label>A little about you<textarea name="bio" maxlength="500">${esc(person.bio || '')}</textarea></label><label class="profile-visibility"><input type="checkbox" name="isPublic" ${person.isPublic ? 'checked' : ''}> Make my profile public</label><p data-profile-status role="status"></p><button class="primary-button" type="submit">Save my profile</button></form>` : '<p>You are signed in. Profile saving is being connected; changes are not available yet.</p>'}<form action="/auth/sign-out" method="post"><button class="secondary-button" type="submit">Sign out</button></form><p>Not your account? Sign out first, then sign in or create an account with your own email.</p></div></section>`;
}

document.addEventListener('submit', async event => {
  if (!event.target.matches('[data-profile-form]')) return;
  event.preventDefault();
  const form = event.target;
  const values = new FormData(form);
  const status = form.querySelector('[data-profile-status]');
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = 'Saving…';
  try {
    const result = await fetch('/api/me', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({displayName: values.get('displayName'), label: values.get('label'), bio: values.get('bio'), isPublic: values.get('isPublic') === 'on'}) });
    const data = await result.json();
    if (!result.ok) throw new Error(data.error || 'Please try again.');
    state.session = await (await fetch('/api/me')).json();
    status.textContent = 'Your profile is saved.';
  } catch (error) { status.textContent = error.message || 'Your profile could not be saved.'; }
  finally { button.disabled = false; }
});

function renderMenuChange(selector) {
  const before = document.querySelector(selector);
  const top = before?.getBoundingClientRect().top;
  const scrollY = window.scrollY, scrollX = window.scrollX;
  render(true);
  const after = document.querySelector(selector);
  after?.focus({preventScroll:true});
  // Anchor to the control, since filtering can change the content height above it.
  const delta = top !== undefined && after ? after.getBoundingClientRect().top - top : 0;
  window.scrollTo({left:scrollX, top:after && top !== undefined ? window.scrollY + delta : scrollY, behavior:'instant'});
}
function render(preserveScroll = false) {
  const focusedSearch = document.activeElement?.matches('[data-catalog-search]') ? { start: document.activeElement.selectionStart, end: document.activeElement.selectionEnd } : null;
  closeProductDetail(false);
  const routes = { discover, community: communityPage, profile: profilePage, feedback: feedbackPage, share: sharePage, account: accountPage, about: aboutPage, contact: contactPage };
  app.innerHTML = (routes[state.route] || discover)();
  syncQuoteVisibility();
  document.querySelectorAll(".site-nav [data-route]").forEach(button => button.classList.toggle("is-active", button.dataset.route === state.route));
  nav.classList.remove("is-open");
  menu?.setAttribute("aria-expanded", "false");
  if (window.CW_SERVER) {
    document.querySelectorAll('[data-route="share"]').forEach(el => { el.hidden = false; });
    const profile = document.querySelector('.profile-button');
    if (profile) { profile.innerHTML = state.session?.authenticated ? avatar({ initials: (state.session.user?.displayName || 'M').slice(0,1).toUpperCase(), avatar: state.session.user?.avatar }) : state.session ? 'Sign in' : 'Checking account…';
    profile.setAttribute('aria-label', state.session?.authenticated ? 'My account' : 'Sign in to TryMyBuild');
    profile.classList.add('signed-out');
    profile.disabled = !state.session; }
    if(state.session) window.CWAccountMenu?.mount(state.session);
    if(state.session?.preferences) { state.personalization=state.session.preferences.personalization!==false;if(!state.preferencesHydrated){state.interests = new Set(state.session.preferences.interests || []);state.preferencesHydrated=true;} document.body.classList.toggle('hide-guidance', state.session.preferences.tips === false); }
  }
  const guestControls=document.querySelector('[data-guest-discovery]');
  if(guestControls){guestControls.hidden=!!state.session?.authenticated;guestControls.querySelector('input').checked=state.personalization;}
  if (focusedSearch) { const input = document.querySelector('[data-catalog-search]'); input?.focus({preventScroll:true}); input?.setSelectionRange(focusedSearch.start, focusedSearch.end); }
  else if (!preserveScroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

document.addEventListener('keydown', event => {
  if (!event.target.matches('[role="tab"][data-home-view]')) return;
  if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault();
  selectHomeView(event.key === 'Home' ? 'find' : event.key === 'End' ? 'test' : event.target.dataset.homeView === 'find' ? 'test' : 'find');
});
document.addEventListener("click", async event => {
  const tryApp = event.target.closest('[data-try-app]');
  if (tryApp) {
    armReturnFeedback(tryApp.dataset.tryApp);
    openedCatalogApps.add(tryApp.dataset.tryApp);
    document.querySelectorAll('[data-return-prompt]').forEach(prompt => {
      if (prompt.dataset.returnPrompt === tryApp.dataset.tryApp) {
        prompt.hidden = false;
        prompt.closest('.card-comments')?.classList.add('awaiting-feedback');
      }
    });
  }

  const viewButton = event.target.closest('[data-home-view]');
  if (viewButton) { selectHomeView(viewButton.dataset.homeView); return; }
  const homeSection = event.target.closest('[data-home-section]');
  if (homeSection) {
    selectHomeView(homeSection.dataset.homeSection === 'home-community' ? 'test' : 'find'); return;
  }
  const verificationInfo = event.target.closest('[data-verification-info]');
  if (verificationInfo) {
    const expanded = verificationInfo.getAttribute('aria-expanded') !== 'true';
    verificationInfo.setAttribute('aria-expanded', String(expanded));
    document.getElementById(verificationInfo.getAttribute('aria-controls')).hidden = !expanded;
    return;
  }
  if (event.target.closest("[data-detail-back]")) { backProductDetail(); return; }
  if (event.target.closest("[data-detail-close]")) { closeProductDetail(); return; }
  const profile = event.target.closest("[data-profile]");
  if (profile) { state.profileSlug = profile.dataset.profile; if(window.CW_SERVER && !state.profileSlug.startsWith("creator-"))window.CWPanels.open("/people/"+encodeURIComponent(state.profileSlug),"profile"); else window.CWPanels.show(profilePage(),"profile"); return; }
  const route = event.target.closest("[data-route]");
  if (route?.dataset.route === 'account' && window.CW_SERVER && state.session?.authenticated) { location.assign('/dashboard'); return; }
  if (route) { event.preventDefault(); state.route = route.dataset.route; if (state.route === 'share') homeView = 'test'; render(); app.focus({preventScroll:true}); return; }
  const productButton = event.target.closest("[data-product]");
  if (productButton) {
    const product = projects.find(item => item.slug === productButton.dataset.product);
    if(product)trackCategoryInterest(product.category);
    if (state.route !== "discover") { state.route = "discover"; state.category = "All"; state.query = ""; render(); }
    openProductDetail(product, productButton);
    return;
  }
  const categoryButton = event.target.closest("[data-category]");
  if (categoryButton) { selectDiscussionCategory(categoryButton.dataset.category); state.query = ""; state.route = "discover"; render(); return; }
  const categoryFilter = event.target.closest("[data-category-filter]");
  if (categoryFilter) { selectDiscussionCategory(categoryFilter.dataset.categoryFilter); trackCategoryInterest(state.category); return; }
  const interest = event.target.closest("[data-interest]");
  if (interest) {
    state.interests.has(interest.dataset.interest) ? state.interests.delete(interest.dataset.interest) : state.interests.add(interest.dataset.interest);
    localStorage.setItem("creatorworks-interests", JSON.stringify([...state.interests]));
    render();
    return;
  }
  const save = event.target.closest("[data-save]");
  if (save) {
    const wasSaved = state.saved.has(save.dataset.save);
    if (window.CW_SERVER) {
      if (!state.session?.authenticated) { state.route = 'account'; render(); return; }
      save.disabled = true;
      try {
        const response = await fetch('/api/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: save.dataset.save, saved: !wasSaved }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
      } catch (error) { save.textContent = error.message || 'Could not save. Try again.'; save.disabled = false; return; }
      save.disabled = false;
    }
    wasSaved ? state.saved.delete(save.dataset.save) : state.saved.add(save.dataset.save);
    const savedProject = projects.find(project => project.slug === save.dataset.save);
    if (savedProject) savedProject.saveCount = Math.max(0, projectSaveCount(savedProject) + (wasSaved ? -1 : 1));
    localStorage.setItem("creatorworks-saved", JSON.stringify([...state.saved]));
    if (save.closest(".detail-dialog")) {
      const isSaved = state.saved.has(save.dataset.save);
      save.textContent = isSaved ? "♥ Saved" : "♡ Save for later";
      save.classList.toggle("is-saved", isSaved);
      document.querySelectorAll(`[data-save="${save.dataset.save}"]:not(.detail-dialog *)`).forEach(button => {
        button.classList.toggle("is-saved", isSaved);
        button.textContent = button.classList.contains("save-button") ? (isSaved ? "♥" : "♡") : (isSaved ? "♥ Saved" : "♡ Save");
      });
    } else render();
    return;
  }
  if (event.target.closest("[data-clear-search]")) { state.query = ""; state.category = "All"; state.price = 'all'; state.creatorType = 'all'; state.verifiedOnly = false; render(); return; }
  const feedback = event.target.closest("[data-feedback]");
  if (feedback && window.CW_SERVER) { location.href = '/tell/' + encodeURIComponent(feedback.dataset.feedback); return; }
  if (feedback) { state.selected = projects.find(product => product.slug === feedback.dataset.feedback); state.route = "feedback"; render(); return; }
  if (event.target.closest("[data-feedback-submit]")) {
    const card = event.target.closest(".feedback-card");
    const response = card.querySelector("[data-feedback-response]").value.trim();
    const signals = [...card.querySelectorAll("[data-feedback-choice].is-selected")].map(button => button.textContent.trim());
    if (commentWordCount(response)<7||commentWordCount(response)>150) { card.querySelector("[data-feedback-error]").textContent = "Write a thoughtful observation of 7–150 words."; return; }
    if (window.CW_SERVER) {
      if (!state.session?.authenticated) { state.route = 'account'; render(); return; }
      const button = card.querySelector('[data-feedback-submit]');
      button.disabled = true;
      try {
        const result = await fetch('/api/experiences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: state.selected.slug, response: response || signals.join('. ') }) });
        const data = await result.json();
        if (!result.ok) throw new Error(data.error);
        card.innerHTML = `<div class="thank-you"><span>✓</span><h1>Thank you for sharing.</h1><p>Your experience has been sent for review. It will appear in Community once approved.</p><button class="primary-button" data-route="discover">Keep discovering</button></div>`;
      } catch (error) { card.querySelector('[data-feedback-error]').textContent = error.message || 'Please try again.'; button.disabled = false; }
      return;
    }
    const author = card.querySelector("[data-feedback-name]").value.trim() || "Guest participant";
    const words = author.split(/\s+/).filter(Boolean);
    const initials = words.slice(0, 2).map(word => word[0]).join("").toUpperCase() || "G";
    state.communityPosts.unshift({ id: String(Date.now()), projectSlug: state.selected.slug, author, initials, label: card.querySelector("[data-feedback-label]").value.trim() || "TryMyBuild participant", response: response || signals[0], signals, createdAt: "Just now" });
    localStorage.setItem("creatorworks-community-posts", JSON.stringify(state.communityPosts));
    card.innerHTML = `<div class="thank-you"><span>✓</span><h1>Your experience is now part of this project’s story.</h1><p>It will appear in the local community prototype on this device.</p><div class="form-actions"><button class="secondary-button" data-product="${esc(state.selected.slug)}">Return to ${esc(state.selected.name)}</button><button class="primary-button" data-route="community">See the community</button></div></div>`;
    return;
  }
  const creatorChoice = event.target.closest("[data-creator-choice]");
  if (creatorChoice) { state.creator[creatorChoice.dataset.creatorChoice] = creatorChoice.dataset.value; render(); return; }
  if (event.target.closest("[data-share-back]")) { state.creatorStep = Math.max(0, state.creatorStep - 1); render(); return; }
  if (event.target.closest("[data-share-next]")) { if (state.creatorStep === 5) { state.route = "discover"; state.creatorStep = 0; } else state.creatorStep += 1; render(); return; }
  const choice = event.target.closest("[data-feedback-choice]");
  if (choice) choice.classList.toggle("is-selected");
  if (event.target.closest("[data-demo-drop]")) { const zone = event.target.closest("[data-demo-drop]"); zone.innerHTML = `<span>✓</span><strong>Safe preview ready</strong><small>Nothing is public yet</small>`; }
});

document.addEventListener("keydown", event => {
  if (event.defaultPrevented || document.querySelector('.cw-overlay[open], .invitation-dialog[open], .return-feedback-dialog[open]')) return;
  const dialog = document.querySelector(".detail-dialog");
  if (!dialog) return;
  if (event.key === "Escape") { event.preventDefault(); closeProductDetail(); return; }
  if (event.key !== "Tab") return;
  const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

document.addEventListener("input", event => {
  if (event.target.matches("[data-catalog-search]")) { state.query = event.target.value;
    const template = document.createElement('template'); template.innerHTML = discover();
    const results = document.querySelector('.catalog-results');
    if (results) results.replaceWith(template.content.querySelector('.catalog-results'));
    const wishes=document.getElementById('wish-list');
    if(wishes) wishes.replaceWith(template.content.querySelector('#wish-list')); }
  if (event.target.matches("[data-creator-field]")) state.creator[event.target.dataset.creatorField] = event.target.value;
});

document.addEventListener("change", event => {

});

document.addEventListener("change", event => {
  if (event.target.matches("[data-category-select]")) { state.category = event.target.value; renderMenuChange('[data-category-select]'); }
  if (event.target.matches("[data-sort-select]")) { state.sort = event.target.value; renderMenuChange('[data-sort-select]'); }
  if (event.target.matches("[data-creator-type-select]")) { state.creatorType = event.target.value; renderMenuChange('[data-creator-type-select]'); }
  if (event.target.matches("[data-verified-select]")) { state.verifiedOnly = event.target.checked; renderMenuChange('[data-verified-select]'); }
  if (event.target.matches("[data-price-select]")) { state.price = event.target.value; renderMenuChange('[data-price-select]'); }
});

menu?.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  menu.setAttribute("aria-expanded", String(open));
});

// Replace the built-in prototype catalog with the authoritative server catalog (published listings).
// A newly approved listing therefore appears here without any rebuild or redeploy.
function hydrateCatalog(list) {
  if (!Array.isArray(list)) return;
  projects.length = 0;
  list.forEach((p, index) => {
    projects.push({
      slug: p.slug, name: p.name, category: p.category, color: categoryDefinition(p.category).color || 'teal',
      summary: p.summary, purpose: p.purpose || '', audience: p.audience || '', stage: p.stage || 'New',
      price: p.price || 'Free', url: p.url, outcome: p.outcome || (p.presentation && p.presentation.headline) || '',
      video: p.video || '', note: p.note || '', preview: p.preview, benefits: p.benefits || [],
      creatorSlug: (p.creator && p.creator.slug) || 'creator-' + p.slug, accessNote: p.accessNote || '',
      reviewCount: p.reviewCount || 0, saveCount: projectSaveCount(p), recentOrder: p.recentOrder != null ? p.recentOrder : (list.length - index),
    });
    productBenefits[p.slug] = p.benefits || [];
    const pr = p.presentation || {};
    projectPresentation[p.slug] = [pr.eyebrow || p.category || '', '', pr.headline || p.summary || p.name, pr.help || '', pr.firstTry || ''];
    if (p.creator && (p.creator.slug || p.creator.name)) {
      const slug = p.creator.slug || 'creator-' + p.slug;
      const data = { slug, type: p.creator.type === 'company' ? 'company' : 'independent', avatar: p.creator.avatar || '', name: p.creator.name, initials: p.creator.initials || String(p.creator.name || 'C').slice(0, 2).toUpperCase(), label: p.creator.label || 'TryMyBuild creator', bio: p.creator.bio || '', verified: !!p.creator.verified };
      const existing = creators.find(c => c.slug === slug);
      if (existing) Object.assign(existing, data); else creators.push(data);
    }
  });
}

// On the server, drop the built-in listings before first paint so nothing stale/unpublished shows.
if (window.CW_SERVER) projects.length = 0;
render();
function loadCatalog() {
  catalogState = 'loading';
  if (['discover', 'community'].includes(state.route) && !document.querySelector('.detail-dialog')) render();
  fetch('/api/catalog').then(r => r.ok ? r.json() : Promise.reject(new Error('unavailable'))).then(data => {
    if (!data || data.connected === false || !Array.isArray(data.projects)) throw new Error('unavailable');
    hydrateCatalog(data.projects);
    catalogState = 'ready';
    if (['discover', 'community', 'profile'].includes(state.route) && !document.querySelector('.detail-dialog')) render();
    openLinkedProject();
  }).catch(() => {
    catalogState = 'error';
    if (['discover', 'community'].includes(state.route) && !document.querySelector('.detail-dialog')) render();
  });
}
document.addEventListener('click', event => { if (event.target.closest('[data-catalog-retry]')) loadCatalog(); });
if (window.CW_SERVER) {
  loadCatalog();
  fetch('/api/me').then(response => { if (!response.ok) throw new Error('Unavailable'); return response.json(); }).then(session => {
    state.session = session;
    if (session.authenticated && session.databaseReady) fetch('/api/saved').then(r => r.json()).then(data => { if (Array.isArray(data.saved)) { state.saved = new Set(data.saved); if (state.route === 'discover' && !document.querySelector('.detail-dialog')) render(); } }).catch(() => {});
    if (session.authenticated) void syncListingProject();
    render();openLinkedProject();void loadDailyComments();
  }).catch(() => {
    state.session = { authenticated: false, authReady: false };
    render();
  });
  fetch('/api/experiences').then(r => r.json()).then(data => {
    if (Array.isArray(data.posts)) { state.communityPosts = data.posts; if (['discover', 'community'].includes(state.route) && !document.querySelector('.detail-dialog')) render(); }
  }).catch(() => {});
  void loadDailyComments();
}

function selectDiscussionCategory(category) {
  state.category=category;state.dailyComments=[];state.discussionError='';state.discussionExpanded=false;
  const url=new URL(location.href);if(category==='All')url.searchParams.delete('category');else url.searchParams.set('category',category);
  url.hash='';history.replaceState({},'',url);render(true);void loadDailyComments();
}
document.addEventListener('click',event=>{
  if(event.target.closest('[data-more-conversations]')){state.discussionExpanded=!state.discussionExpanded;render(true);}
  if(event.target.closest('[data-retry-discussion]'))void loadDailyComments();
});
async function loadDailyComments(){
  const category=state.category,request=++discussionRequest;if(category==='All')return;
  const now=new Date(),day=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  try{
    const response=await fetch('/api/daily-comments?day='+day+'&category='+encodeURIComponent(category)),data=await response.json();
    if(request!==discussionRequest||category!==state.category)return;
    if(!response.ok||!Array.isArray(data.comments))throw Error('Unavailable');
    state.dailyComments=data.comments;state.discussionCategory=category;state.discussionError='';
  }catch{if(request!==discussionRequest||category!==state.category)return;state.discussionError='Conversations could not load. Your draft is still here.';}
  if(['discover','community'].includes(state.route)&&!document.querySelector('.detail-dialog')){
    // Refresh the section while preserving an active draft and its caret.
    const section=document.querySelector('.category-community');
    if(section){const field=section.querySelector('textarea'),focused=document.activeElement===field,start=field?.selectionStart,end=field?.selectionEnd;
      const template=document.createElement('template');template.innerHTML=communityRail();const replacement=template.content.firstElementChild;
      if(field)replacement.querySelector('textarea').value=field.value;
      section.replaceWith(replacement);
      if(focused){const input=replacement.querySelector('textarea');input.focus({preventScroll:true});input.setSelectionRange(start,end);}
    }
    else render();
  }
}


// Canonical recipient page; sharing always opens a preview first.
function productShareUrl(slug) { return new URL('/projects/'+encodeURIComponent(slug),location.origin).href; }
// Load an existing owned project into the builder (used by "Continue editing" from My projects),
// or refresh the current draft's server status. Never attaches to an account on its own.
function loadOwnedProjectIntoDraft(p) {
  listingDraft.pricing = p.pricing || CWPricing.kind(p.price || 'Free');
  listingDraft.serverId = p.id; listingDraft.serverSlug = p.slug; listingDraft.serverStatus = p.status; listingDraft.imported = 'yes';
  listingDraft.video = p.video || ''; listingDraft.sharingPreference = p.sharingPreference || 'not_sure'; listingDraft.accountOwner = state.session?.user?.id || '';
  listingDraft.title = p.title || ''; listingDraft.url = p.url || ''; listingDraft.category = p.category || 'Technology';
  listingDraft.stage = p.stage || 'Ready for a first try'; listingDraft.does = p.headline || ''; listingDraft.helps = p.help || ''; listingDraft.firstTry = p.firstTry || '';
  if (p.preview) { listingDraft.image = p.preview; listingDraft.imageData = ''; listingDraft.imageSourceUrl = listingUrl(p.url); listingDraft.imageUploadedFor = p.slug; }
  listingCategoryOtherOpen = !primaryCategoryNames.includes(normalizeCategory(listingDraft.category));
  saveListingDraft();
}
async function syncListingProject() {
  const params = new URLSearchParams(location.search);
  const wantSlug = params.get('listing') === 'settings' ? params.get('project') : '';
  if (listingDraft.accountOwner && listingDraft.accountOwner !== state.session?.user?.id) return;
  if (!listingDraft.serverId && !wantSlug) {
    if (state.route === 'share' && listingSettings && listingDraft.title.trim() && listingDraft.url.trim()) {
      try { await saveServerListing(); render(); }
      catch (error) { const el = document.querySelector('[data-listing-status]'); if (el) el.textContent = error.message; }
    }
    return;
  }
  try {
    const data = await (await fetch('/api/projects')).json();
    if (!Array.isArray(data.projects)) return;
    const proj = wantSlug ? data.projects.find(p => p.slug === wantSlug) : data.projects.find(p => p.id === listingDraft.serverId);
    if (!proj) { if (wantSlug || listingDraft.serverId) { resetListingDraft(); if (state.route === 'share') render(); } return; }
    if (wantSlug) loadOwnedProjectIntoDraft(proj);
    else { listingDraft.serverStatus = proj.status; listingDraft.serverSlug = proj.slug; saveListingDraft(); }
    if (state.route === 'share' && listingSettings) render();
  } catch {}
}

// Open a shared listing (?project=slug) as a detail drawer, but never over the listing builder.
function openLinkedProject() {
  const params = new URLSearchParams(location.search);
  if (params.get('listing') === 'settings' || document.querySelector('.detail-dialog')) return;
  const slug = params.get('project');
  if (!slug) return;
  const linkedProject = projects.find(item => item.slug === slug);
  if (linkedProject) openProductDetail(linkedProject);
}
openLinkedProject();

function videoField() {
  return `<label class="listing-field">Video link or embed code<textarea data-listing-field="video" placeholder="Paste a YouTube, Vimeo, or Loom URL or iframe embed code" maxlength="5000" aria-describedby="video-help">${esc(listingDraft.video)}</textarea></label><p class="share-name-hint" id="video-help">YouTube, Vimeo, and Loom links or iframe embed codes are supported.</p><div data-listing-video-preview>${videoPlayer(listingDraft.video)}</div>`;
}
function videoPlayer(value) {
  const url = CWMedia.videoUrl(value);
  return url ? `<section class="project-video"><button type="button" class="secondary-button" data-load-video="${esc(url)}">Play project video</button><p class="cw-meta">Playing connects to the video provider.</p></section>` : '';
}
function similarSection(product) {
  const suggestions = CWMedia.similarProjects(product, projects, state.saved, state.interests);
  return `<section class="similar-projects"><h3>Explore similar apps</h3>${suggestions.length ? `<div class="similar-grid">${suggestions.map(p => `<button type="button" class="similar-card" data-similar-project="${esc(p.slug)}"><img src="${esc(p.preview)}" alt="" loading="lazy"><strong>${esc(p.name)}</strong><span>${esc(p.category)}</span></button>`).join('')}</div>` : '<p>More related apps are on the way.</p>'}</section>`;
}
document.addEventListener('click', event => {
  const similar = event.target.closest('[data-similar-project]');
  if (similar) { const p = projects.find(p => p.slug === similar.dataset.similarProject); if (p) openProductDetail(p); }
  const play = event.target.closest('[data-load-video]');
  if (play) { const url = CWMedia.videoUrl(play.dataset.loadVideo); if (url) play.parentElement.innerHTML = `<iframe src="${esc(url)}" title="Project video" loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation" allow="fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`; }
  if (event.target.closest('[data-listing-reset]') && confirm('Start over with an empty draft? Projects already saved to your account will remain in My projects.')) {
    invalidateListingCapture(); resetListingDraft(); listingSettings = false; listingStep = 0; state.route = 'share';
    history.replaceState({}, '', '/?listing=settings'); render();
  }
});

document.addEventListener('input',event=>{
 const field=event.target.closest('[data-listing-field]');if(!field)return;
 if(field.dataset.listingField==='video'){
  const valid=!field.value.trim()||!!CWMedia.videoUrl(field.value),status=document.querySelector('[data-video-status]');
  field.setCustomValidity(valid?'':'Paste a valid YouTube, Vimeo, or Loom link or iframe embed code.');
  if(status)status.textContent=!field.value.trim()?'':valid?'Video recognized. The preview is ready.':'This video could not be recognized. Check the link or embed code.';
  return;
 }
 if(!['does','helps','firstTry'].includes(field.dataset.listingField))return;
 const counter=document.querySelector('[data-word-counter="'+field.dataset.listingField+'"]');const count=CWListingRules.count(field.value);
 if(counter){counter.textContent='Word count: '+count+(count>10?' · Remove '+(count-10)+' word'+(count-10===1?'':'s')+' to continue.':'');counter.classList.toggle('invalid',count<4||count>10);}
 field.setCustomValidity(count<4||count>10?'Use 4–10 words for this answer.':'');
});

function trackCategoryInterest(category){
 if(!category||category==='All'||state.personalization===false)return;
 storedCategoryClicks[category]=(Number(storedCategoryClicks[category])||0)+1;
 try{localStorage.setItem('trymybuild-category-clicks-v1',JSON.stringify(storedCategoryClicks));}catch{}
 state.interests=new Set([...(state.session?.preferences?.selected_interests||[]),...Object.entries(storedCategoryClicks).sort((a,b)=>b[1]-a[1]).map(([name])=>name)]);
 if(window.CW_SERVER&&state.session?.authenticated)fetch('/api/category-interest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category})}).catch(()=>{});
}

document.addEventListener('change',event=>{
 if(!event.target.matches('[data-guest-personalization]')||state.session?.authenticated)return;
 state.personalization=event.target.checked;
 try{localStorage.setItem('trymybuild-guest-personalization',state.personalization?'on':'off');}catch{}
 state.interests=new Set(state.personalization?Object.keys(storedCategoryClicks):[]);
});
document.addEventListener('click',event=>{
 if(!event.target.closest('[data-guest-reset]')||state.session?.authenticated)return;
 for(const key of Object.keys(storedCategoryClicks))delete storedCategoryClicks[key];
 try{localStorage.removeItem('trymybuild-category-clicks-v1');}catch{}
 state.interests.clear();
 document.querySelector('[data-guest-status]').textContent='Category history cleared from this browser.';
});
