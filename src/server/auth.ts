import { WorkOS } from '@workos-inc/node';
import type { APIContext } from 'astro';

export const env = (key: string): string => process.env[key] || import.meta.env[key] || '';
export const SESSION_COOKIE = 'cw_session';
export function authReady() {
  return !!(env('WORKOS_API_KEY') && env('WORKOS_CLIENT_ID') && env('WORKOS_REDIRECT_URI') && env('WORKOS_COOKIE_PASSWORD').length >= 32);
}
export function workos() {
  return new WorkOS(env('WORKOS_API_KEY'), { clientId: env('WORKOS_CLIENT_ID') });
}
export function origin(context: APIContext) {
  return new URL(env('PUBLIC_APP_URL') || context.url.origin).origin;
}
export function cookieOptions(context: APIContext) {
  return { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: context.url.protocol === 'https:', maxAge: 60 * 60 * 24 * 7 };
}
export async function currentUser(context: APIContext) {
  if (!authReady()) return null;
  const data = context.cookies.get(SESSION_COOKIE)?.value;
  if (!data) return null;
  try {
    const session = workos().userManagement.loadSealedSession({ sessionData: data, cookiePassword: env('WORKOS_COOKIE_PASSWORD') });
    const result = await session.authenticate();
    if (result.authenticated) return result.impersonator ? null : await permittedUser(result.user);
    const refreshed = await session.refresh();
    if (refreshed.authenticated && refreshed.sealedSession && !refreshed.impersonator) {
      context.cookies.set(SESSION_COOKIE, refreshed.sealedSession, cookieOptions(context));
      return await permittedUser(refreshed.user);
    }
    return null;
  } catch { return null; }
}
export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
export function authMessage(message: string, status = 503) {
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>TryMyBuild sign-in</title><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/future-design.css"><main class="account-hero"><p class="eyebrow">TryMyBuild</p><h1>Welcome.</h1><p>${message}</p><a class="primary-button" href="/">Browse the projects</a></main></html>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function permittedUser(user: any) {
 const {database,databaseReady}=await import('./database');
 if(!databaseReady())return null;
 const r=await database().from('users').select('account_status').eq('workos_user_id',user.id).maybeSingle();
 if(r.error|| (r.data && r.data.account_status!=='active'))return null;
 return user;
}
