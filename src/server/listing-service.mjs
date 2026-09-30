// Listing lifecycle logic, decoupled from Supabase so it can be driven by an in-memory store in tests.
// The API routes are thin wrappers that build a Supabase-backed `store` (see listing-store.ts) and pass
// the authenticated owner id. Ownership is ALWAYS the caller-provided session id — never a client field.
import { publishReadiness, pricingKind } from './listing-policy.mjs';

// Fields whose change is "material" — a change to any editable public-facing field on a public/in-review
// listing returns it to a private draft until the owner explicitly publishes the changes. This must
// cover EVERY field normalizeDraft accepts and shows publicly (summary and stage included).
const MATERIAL_FIELDS = ['price_label', 'is_free', 'video_url', 'title', 'external_url', 'category', 'stage', 'summary', 'headline', 'help_text', 'first_try'];

export function isMaterialChange(row, input) {
  return MATERIAL_FIELDS.some(f => (['price_label','is_free'].includes(f) && input[f] === undefined) ? false : (input[f] ?? '') !== (row[f] ?? ''));
}
const nonpublicNext = status => (status === 'published' || status === 'in_review') ? 'draft' : status;
const visForStatus = status => status === 'published' ? 'public' : 'draft';

// Create a brand-new draft or update an existing one. Creation is idempotent per (owner, clientToken):
// a retried create returns the same row; a different token makes an independent second draft. There is
// no "reuse the latest draft" behavior — creating a second project can never overwrite the first.
export async function saveDraft(store, { ownerId, id, clientToken, input }, deps = {}) {
  const slugify = deps.slugify || (s => String(s || 'project'));
  const randomSuffix = deps.randomSuffix || (() => Math.random().toString(16).slice(2, 8));
  if (!id && !clientToken) return { status: 400, error: 'A draft identity is required.' };

  if (id) {
    const row = await store.findOwnedById(ownerId, id);
    if (!row) return { status: 404, error: 'That project was not found in your account.' };
    // Choosing the existing category must not erase a legacy price amount.
    if(input.price_label && row.price_label && pricingKind(input.price_label)===pricingKind(row.price_label))input={...input,price_label:row.price_label};
    const material = isMaterialChange(row, input);
    const next = material ? nonpublicNext(row.listing_status) : row.listing_status;
    const reviewReset = material && next !== row.listing_status;
    const patch = { ...input, listing_status: next, visibility: visForStatus(next) };
    if (reviewReset) patch.submitted_at = null;
    const updated = await store.updateOwnedGuarded(id, ownerId, { status: row.listing_status, lockVersion: row.lock_version }, patch);
    if (!updated) return { status: 409, error: 'This listing changed in another tab or during review. Reload and try again.' };
    return { status: 200, project: updated, reviewReset };
  }

  // Create path — idempotent on (owner, clientToken).
  const existing = await store.findOwnedByToken(ownerId, clientToken);
  if (existing) return { status: 200, project: existing, idempotent: true };
  const base = slugify(input.title || 'project');
  for (let attempt = 0; attempt < 6; attempt++) {
    const slug = `${base}-${randomSuffix()}`.slice(0, 60);
    try {
      const row = await store.insertProject({
        ...input, slug, owner_user_id: ownerId, client_token: clientToken,
        is_studio: false, visibility: 'draft', ownership_status: 'unverified', listing_status: 'draft', lock_version: 0,
      });
      return { status: 200, project: row, created: true };
    } catch (err) {
      if (err && err.code === 'DUP_TOKEN') {
        const raced = await store.findOwnedByToken(ownerId, clientToken);
        if (raced) return { status: 200, project: raced, idempotent: true };
      }
      if (err && err.code === 'DUP_SLUG') continue; // regenerate slug and retry
      return { status: 503, error: 'That change could not be saved. Your work is safe; please try again.' };
    }
  }
  return { status: 503, error: 'Could not create the listing. Please try again.' };
}

// Launch policy: an authenticated owner explicitly publishes a ready public listing.
// Existing review-queue entries can use the same action; no bulk publication is implied.
export async function submit(store, { ownerId, id }) {
  const row = await store.findOwnedById(ownerId, id);
  if (!row) return { status: 404, error: 'That project was not found in your account.' };
  if (row.listing_status === 'published') return { status: 200, project: row, idempotent: true };
  const readiness = publishReadiness(row);
  if(row.sharing_preference && row.sharing_preference!=='public')return {status:400,error:'Choose Publicly in sharing preferences before publishing.'};
  if (!readiness.ready) return { status: 400, error: `Add ${readiness.missing.join(', ')} before publishing.`, missing: readiness.missing };
  const now = new Date().toISOString();
  const updated = await store.updateOwnedGuarded(id, ownerId, { status: row.listing_status, lockVersion: row.lock_version }, { listing_status: 'published', visibility: 'public', submitted_at: now, published_at: row.published_at || now });
  if (!updated) return { status: 409, error: 'This listing changed. Reload and try again.' };
  return { status: 200, project: updated };
}

// Take a listing out of public view. published → unpublished; in_review → draft (withdraw).
export async function unpublish(store, { ownerId, id }) {
  const row = await store.findOwnedById(ownerId, id);
  if (!row) return { status: 404, error: 'That project was not found in your account.' };
  if (row.listing_status === 'draft' || row.listing_status === 'unpublished') return { status: 200, project: row, idempotent: true };
  const next = row.listing_status === 'in_review' ? 'draft' : 'unpublished';
  const updated = await store.updateOwnedGuarded(id, ownerId, { status: row.listing_status, lockVersion: row.lock_version }, { listing_status: next, visibility: 'draft' });
  if (!updated) return { status: 409, error: 'This listing changed. Reload and try again.' };
  return { status: 200, project: updated };
}

// Safely replace a preview image: re-encode server-side, upload a NEW versioned object, confirm the DB
// reference update, and only then delete the OLD object. On any failure the previous image is preserved,
// and concurrent replacements can never delete the current image (each only removes the key it replaced).
export async function replaceImage(store, { ownerId, slug, bytes }, deps = {}) {
  const reencode = deps.reencode;
  const keyFactory = deps.keyFactory || ((owner, pid) => `previews/${owner}/${pid}/${Date.now()}-${Math.random().toString(16).slice(2, 8)}.jpg`);
  const row = await store.findOwnedBySlug(ownerId, slug);
  if (!row) return { status: 404, error: 'That project was not found in your account.' };

  let processed;
  try { processed = await reencode(bytes); }
  catch { return { status: 400, error: 'Upload a valid PNG, JPG, or WebP image within the size limit.' }; }

  const newKey = keyFactory(ownerId, row.id);
  try { await store.putImage(newKey, processed.bytes, processed.contentType || 'image/jpeg'); }
  catch { return { status: 502, error: 'The image could not be stored. Your listing image is unchanged; please retry.' }; }

  const next = nonpublicNext(row.listing_status);
  const reviewReset = next !== row.listing_status;
  const patch = { preview_path: newKey, preview_public_url: `/api/project-image/${slug}`, listing_status: next, visibility: visForStatus(next) };
  if (reviewReset) patch.submitted_at = null;

  let updated;
  try {
    updated = await store.updateOwnedGuarded(row.id, ownerId, { status: row.listing_status, lockVersion: row.lock_version }, patch);
  } catch {
    // UNCERTAIN outcome: the guarded update errored and may or may not have committed. The new object
    // could now be the live reference, so we must NOT delete it. Leave it in place (a possible orphan is
    // cleaned up later); never risk deleting the committed image. The previous image also stays intact.
    return { status: 503, error: 'The image may not have finished saving. Reload to check — your listing was not corrupted.' };
  }
  if (!updated) {
    // DEFINITE no-op: the guard did not match, so no row was written and newKey is unreferenced — safe to remove.
    await store.deleteImage(newKey).catch(() => {});
    return { status: 409, error: 'This listing changed during the upload. Your previous image is unchanged; reload and try again.' };
  }
  // Success: remove only the specific object we replaced (never the new/current one).
  const oldKey = row.preview_path;
  if (oldKey && oldKey !== newKey && !oldKey.startsWith('/assets/')) await store.deleteImage(oldKey).catch(() => {});
  return { status: 200, project: updated, reviewReset };
}
