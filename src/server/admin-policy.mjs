// Authority follows the configured WorkOS identity. A verified configured email is
// also accepted so the founder can move between isolated WorkOS environments.
export function isFounder(userId, configuredId, email, configuredEmail, emailVerified = false) {
  const exactId = typeof userId === 'string' && typeof configuredId === 'string'
    && /^user_[A-Za-z0-9]+$/.test(configuredId) && userId === configuredId;
  if (exactId) return true;
  return emailVerified === true && typeof email === 'string' && typeof configuredEmail === 'string'
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail)
    && email.trim().toLowerCase() === configuredEmail.trim().toLowerCase();
}
export function moderationInput(body) {
  if (!/^[0-9a-f-]{36}$/i.test(body.id || '') || !['published', 'hidden', 'pending'].includes(body.status)
    || typeof body.reason !== 'string' || body.reason.trim().length < 3 || body.reason.length > 300
    || typeof body.expected !== 'string'
    || !['published', 'hidden', 'pending'].includes(body.previous)) return null;
  return { id: body.id, status: body.status, reason: body.reason.trim(), expected: body.expected, previous: body.previous };
}
