import type { APIRoute } from 'astro';
import { env, origin, SESSION_COOKIE, workos } from '../../server/auth';
import { feedbackDestination } from '../../server/feedback-policy.mjs';
import { sameOrigin } from '../../server/security.mjs';

export const POST: APIRoute = async context => {
  if (!sameOrigin(context.request, origin(context))) return new Response('Forbidden', { status: 403 });
  const form = await context.request.formData().catch(()=>null);
  const requested = form?.get('next');
  const destination = typeof requested==='string' && /^\/listing-invitation\/[a-f0-9-]{36}\.[a-f0-9]{64}$/.test(requested) ? feedbackDestination(requested) : '/';
  const returnTo = new URL(destination,origin(context)).href;
  const data = context.cookies.get(SESSION_COOKIE)?.value;
  context.cookies.delete(SESSION_COOKIE, { path: '/' });
  context.cookies.delete('cw_security_fresh', {path:'/'});
  context.cookies.delete('cw_security_challenge', {path:'/'});
  if (data) {
    try {
      const session = workos().userManagement.loadSealedSession({ sessionData: data, cookiePassword: env('WORKOS_COOKIE_PASSWORD') });
      const logoutUrl = await session.getLogoutUrl({ returnTo });
      return context.redirect(logoutUrl, 303);
    } catch { /* The local cookie is removed even when remote logout is unavailable. */ }
  }
  return context.redirect(destination, 303);
};
