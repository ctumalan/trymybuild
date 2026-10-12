import { createHmac, timingSafeEqual } from 'node:crypto';
import { normalizeDraft } from './listing-policy.mjs';

const ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export function invitationToken(id, secret) {
  if (!ID.test(id || '') || typeof secret !== 'string' || secret.length < 32) throw Error('Invitation signing unavailable');
  return id + '.' + createHmac('sha256', secret).update('listing-invitation-v1:' + id).digest('hex');
}
export function invitationId(token, secret) {
  if (typeof token !== 'string' || !/^[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(token)) return null;
  try {
    const id = token.slice(0, 36), expected = invitationToken(id, secret);
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected)) ? id : null;
  } catch { return null; }
}
export function invitationOpen(row, now = Date.now()) {
  return !!row && !row.revoked_at && !row.claimed_by && Date.parse(row.expires_at) > now;
}
export function normalizeInvitation(body) {
  const email = typeof body.recipientEmail === 'string' ? body.recipientEmail.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return {error:'Enter the intended creator’s email. They will use it to claim this preview.'};
  const normalized = normalizeDraft(body);
  if (normalized.error) return normalized;
  if (!normalized.value.title || !normalized.value.external_url) return {error:'Add the app name and its full website URL.'};
  return {value:{...normalized.value, recipient_email:email}};
}
// A preview link permits reading only. Taking ownership also requires the intended
// recipient's verified session; neither owner IDs nor recipient emails come from the form.
export async function claimInvitation(store, {id, memberId, user, version, input}) {
  if (!user?.emailVerified || !memberId) return {status:403,error:'Sign in with a verified email before saving this app.'};
  const row = await store.find(id);
  if (!row) return {status:404,error:'This invitation is unavailable.'};
  if (String(user.email || '').trim().toLowerCase() !== row.recipient_email) return {status:403,error:'Sign in with the email address that received this invitation.'};
  if (row.claimed_by) {
    if (row.claimed_by !== memberId) return {status:409,error:'This invitation has already been claimed.'};
    const project = await store.findProject(row.project_id, memberId);
    return project ? {project, idempotent:true} : {status:410,error:'This app draft was removed. Start a new listing from your dashboard.'};
  }
  if (!invitationOpen(row)) return {status:410,error:'This invitation has expired or was withdrawn.'};
  if (!Number.isSafeInteger(version) || version !== row.lock_version) return {status:409,error:'The preview changed. Reload it before saving.'};
  const normalized = normalizeDraft(input);
  if (normalized.error) return {status:400,error:normalized.error};
  if (!normalized.value.title || !normalized.value.external_url) return {status:400,error:'Add your app name and full website URL.'};
  try {
    // The transaction repeats the recipient, version, expiry and ownership guards
    // under a row lock. Retries cannot create a second project or overwrite edits.
    return {project:await store.claim(id, memberId, user.email.trim().toLowerCase(), version, normalized.value)};
  } catch { return {status:409,error:'Saving was not confirmed. Reload the preview to check before trying again.'}; }
}
