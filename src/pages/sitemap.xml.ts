import type {APIRoute} from 'astro';
import {articles} from '../data/articles';
// Only public marketing content. Account and private-feedback routes are excluded.
export const GET:APIRoute=()=>new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://trymybuild.com/</loc></url>
<url><loc>https://trymybuild.com/article</loc></url>
${articles.map(article=>`<url><loc>https://trymybuild.com${article.href}</loc><lastmod>${article.date}</lastmod></url>`).join('\n')}
</urlset>`,{headers:{'Content-Type':'application/xml; charset=utf-8','Cache-Control':'public, max-age=3600'}});
