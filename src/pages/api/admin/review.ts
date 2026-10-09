import type { APIRoute } from 'astro';
import { adminUser } from '../../../server/admin';
import { json, origin } from '../../../server/auth';
import { database, ensureMember } from '../../../server/database';
import { sameOrigin } from '../../../server/security.mjs';
import { moderationInput } from '../../../server/admin-policy.mjs';

export const POST: APIRoute = async context => {
  if (!sameOrigin(context.request, origin(context))) return json({ error: 'Request not allowed.' }, 403);
  const user = await adminUser(context);
  if (!user) return json({ error: 'Administrator access required.' }, 403);
  try {
    const raw = await context.request.text();
    if (raw.length > 262144) return json({ error: 'Request too large.' }, 413);
    const data = Object.fromEntries(new URLSearchParams(raw));
    const input = moderationInput(data);
    if (!input || data.confirm !== 'yes') return json({ error: 'Confirm the decision and provide a reason.' }, 400);
    const actor = await ensureMember(user);
    const result = await database().rpc('cw_review_comment', { p_actor: actor.id, p_id: input.id, p_status: input.status, p_previous: input.previous, p_expected: input.expected, p_reason: input.reason });
    if (result.error) return context.redirect('/admin?section=comments&notice=retry', 303);
    return context.redirect('/admin?section=comments&notice=saved', 303);
  } catch { return context.redirect('/admin?section=comments&notice=retry', 303); }
};
