import type { APIContext } from 'astro';
import { currentUser, env } from './auth';
import { isFounder } from './admin-policy.mjs';

export async function adminUser(context: APIContext) {
  const user = await currentUser(context);
  return user && isFounder(user.id, env('FOUNDER_WORKOS_USER_ID'), user.email, env('FOUNDER_EMAIL'), user.emailVerified) ? user : null;
}
export const htmlEscape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
