import '../../project-media.js';
import '../../listing-rules.js';
import '../../pricing.js';
export const pricingKind = globalThis.CWPricing.kind;
// Pure listing rules — no I/O, unit-testable. Ownership and authority are enforced by the caller
// using the authenticated server session; nothing here trusts a client-supplied owner id.

const PRIMARY_CATEGORIES = [
  'Family life','Technology','Sports & teams','Teaching & learning','Shopping','Money',
  'Personal planning','Food & home','Travel','Creative work',
];
const CATEGORY_ALIASES = new Map([
  ['artificial intelligence','AI & automation'],['ai','AI & automation'],['automation','AI & automation'],
  ['business','Business & operations'],['operations','Business & operations'],
  ['developer','Developer tools'],['development','Developer tools'],['software development','Developer tools'],
  ['education','Teaching & learning'],['learning','Teaching & learning'],
  ['finance','Money'],['financial','Money'],['personal finance','Money'],
  ['food','Food & home'],['home','Food & home'],['health','Health & wellness'],
  ['marketing','Marketing & sales'],['sales','Marketing & sales'],
  ['music','Music & audio'],['audio','Music & audio'],['community','Social & community'],
  ['sports','Sports & teams'],['creative','Creative work'],['planning','Personal planning'],
]);
const BLOCKED_CATEGORY = /(?:^|\s)(?:admin|administrator|all tools|everything|uncategorized|none|null)(?:\s|$)/i;

export function normalizeCategory(value) {
  const clean = String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim().slice(0, 48);
  if (clean.length < 2 || BLOCKED_CATEGORY.test(clean) || !/^[\p{L}\p{N}][\p{L}\p{N} &'’+/.:-]*$/u.test(clean)) return '';
  const alias = CATEGORY_ALIASES.get(clean.toLocaleLowerCase());
  if (alias) return alias;
  return clean.replace(/\b\p{L}/gu, letter => letter.toLocaleUpperCase());
}

// Human labels for the publication lifecycle, shown in the creator dashboard.
export const PROJECT_STATUS_LABELS = {
  draft: 'Draft — only you can see it',
  in_review: 'Ready to publish — open publishing options',
  published: 'Published — publicly discoverable',
  unpublished: 'Unpublished — hidden from the catalog',
};

const STAGES = ['Still taking shape','Ready for a first try','Being tested by early users','Finished and launched','New'];
export function normalizeStage(value) {
  const v = String(value || '').trim();
  return STAGES.includes(v) ? v : 'Ready for a first try';
}

// Public http/https only; no credentials embedded; bounded length. (Deeper SSRF checks live in
// preview-network.mjs for capture; this is listing-link validation.)
export function normalizeExternalUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) return '';
  let url;
  try { url = new URL(value.trim()); } catch { return ''; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
  return url.href;
}

const text = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
const paragraph = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Accepts the builder draft shape (title, url, does→headline, helps→help_text, firstTry, category, stage).
// Returns normalized content for storage, or { error } describing the first problem.
export function normalizeDraft(body) {
  if (!body || typeof body !== 'object') return { error: 'Nothing to save.' };
  const value = {
    title: text(body.title, 80),
    video_url: globalThis.CWMedia.videoUrl(body.video ?? body.video_url ?? ''),
    external_url: normalizeExternalUrl(body.url ?? body.external_url),
    category: normalizeCategory(body.category),
    stage: normalizeStage(body.stage),
    headline: text(body.does ?? body.headline, 140),
    help_text: paragraph(body.helps ?? body.help_text, 500),
    first_try: paragraph(body.firstTry ?? body.first_try, 500),
    summary: text(body.summary ?? body.does ?? body.headline, 160),
  };
  if(body.pricing !== undefined){
    if(!Object.hasOwn(globalThis.CWPricing.labels,body.pricing))return {error:'Choose Free, Paid, or Free + paid options.'};
    value.price_label=globalThis.CWPricing.labels[body.pricing];value.is_free=body.pricing==='free';
  }
  if(body.sharingPreference !== undefined){
    if(!['private','public','not_sure'].includes(body.sharingPreference))return {error:'Choose how you would like to share your app.'};
    value.sharing_preference=body.sharingPreference;
  }
  if ((body.video || body.video_url) && !value.video_url) return { error: 'Use a YouTube, Vimeo, or Loom video URL or iframe embed.' };
  if (body.url != null && String(body.url).trim() && !value.external_url) return { error: 'Enter a complete http or https project link.' };
  if (value.category === '' && (body.category ?? '') !== '') return { error: 'Choose a clearer category, or pick a common one.' };
  for(const [key,label] of [['headline','What your project does'],['help_text','How it helps'],['first_try','What to try first']]) {
    const raw=key==='headline'?(body.does??body.headline):key==='help_text'?(body.helps??body.help_text):(body.firstTry??body.first_try);
    if(String(raw||'').trim() && !globalThis.CWListingRules.valid(raw,key)) return {error:label+' needs a short answer (up to '+globalThis.CWListingRules.limit(key)+' characters).'};
  }
  return { value };
}

// Fields required before a draft can be submitted for publication.
export function publishReadiness(project) {
  const missing = [];
  if (!project?.title?.trim()) missing.push('project name');
  if (!normalizeExternalUrl(project?.external_url)) missing.push('a working http/https project link');
  if (!project?.category?.trim()) missing.push('a category');
  if (!project?.headline?.trim()) missing.push('what it does (the heading)');
  if (!project?.help_text?.trim()) missing.push('how it helps');
  if (!project?.first_try?.trim()) missing.push('what to try first');
  for(const [key,label] of [['headline','what it does'],['help_text','how it helps'],['first_try','what to try first']]) if(project?.[key]?.trim()&&!globalThis.CWListingRules.valid(project[key],key))missing.push(label+' (up to '+globalThis.CWListingRules.limit(key)+' characters)');
  if (!project?.preview_path?.trim()) missing.push('a preview screenshot');
  return { ready: missing.length === 0, missing };
}

// Who may see a project record. Published → anyone. Otherwise only the owner or an administrator.
export function canViewProject(project, memberId, isAdmin = false) {
  if (!project) return false;
  if (project.listing_status === 'published') return true;
  return isAdmin || (!!memberId && project.owner_user_id === memberId);
}

export const isPublished = project => project?.listing_status === 'published';

// Base slug from a title; caller appends a short unique suffix and checks uniqueness in the DB.
export function slugify(title) {
  const base = String(title || '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  return base || 'project';
}

// Server-side image gate for uploads. `bytes` is a Buffer/Uint8Array of the decoded image.
// Confirms a real PNG/JPEG/WebP by magic bytes and enforces a hard size cap. Client re-encodes via
// canvas (which drops metadata); this is the defense-in-depth server check before storage.
export const IMAGE_MAX_BYTES = 3_000_000;
export function detectImageType(bytes) {
  if (!bytes || bytes.length < 12) return '';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  return '';
}
export function validateImageUpload(bytes) {
  const type = detectImageType(bytes);
  if (!type) return { error: 'Upload a PNG, JPG, or WebP image.' };
  if (bytes.length === 0) return { error: 'That image is empty.' };
  if (bytes.length > IMAGE_MAX_BYTES) return { error: 'Choose an image under 3 MB.' };
  return { type };
}

// Parse a data: URL (image/jpeg|png|webp;base64,...) into { type, bytes } or null.
export function parseImageDataUrl(value) {
  if (typeof value !== 'string') return null;
  const m = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/);
  if (!m) return null;
  let bytes;
  try { bytes = Buffer.from(m[2], 'base64'); } catch { return null; }
  const check = validateImageUpload(bytes);
  if (check.error) return null;
  return { type: check.type, bytes };
}
