import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import { readdirSync } from 'node:fs';

export default defineConfig({
  output: 'server',
  adapter: vercel({ includeFiles: ['assets/fonts/dm-sans-invitation.ttf', ...readdirSync(new URL('./node_modules/@sparticuz/chromium/bin/', import.meta.url)).map(file => `node_modules/@sparticuz/chromium/bin/${file}`)], maxDuration: 30 }),
  vite: { ssr: { external: ['@sparticuz/chromium','puppeteer-core','ipaddr.js','sharp'] } },
  publicDir: './.cw-public',
  server: { port: 4321 },
});
