import type { APIRoute } from 'astro';
import template from '../../index.html?raw';
import { isHardRefreshRequest } from '../server/hard-refresh.mjs';

export const GET: APIRoute = context => {
  if (context.url.searchParams.get('edit') === 'profile') return context.redirect('/dashboard/profile', 302);
  if (context.url.searchParams.has('account') && context.url.searchParams.get('edit') !== 'profile') return context.redirect('/dashboard', 302);
  const page = template
    .replace('<html lang="en">', `<html lang="en" data-hard-refresh="${isHardRefreshRequest(context.request.headers)}">`)
    .replace('<script src="app.js">', '<script src="/server-mode.js"></script><script src="/app.js">');
  return new Response(page, {
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': context.url.searchParams.has('listing') || context.url.searchParams.has('account') ? 'noindex' : 'index, follow' },
});
};
