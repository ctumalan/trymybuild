import type {APIRoute} from 'astro';
export const GET:APIRoute=()=>new Response(`User-agent: *
Disallow: /api/
Disallow: /auth/
Disallow: /dashboard/
Disallow: /admin/
Sitemap: https://trymybuild.com/sitemap.xml
`,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'public, max-age=3600'}});
