import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { fetchPreviewAsset } from './preview-network.mjs';

const xml = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
const shorten = (value, max) => Array.from(String(value || '')).length > max ? Array.from(String(value)).slice(0, max - 1).join('') + '…' : String(value || '');
export function invitationImageUrl(project, base) {
 const version = createHash('sha256').update(JSON.stringify([project.name, project.category, project.preview, project.creator.name])).digest('hex').slice(0, 12);
 return new URL(`/api/invitation-image/${encodeURIComponent(project.slug)}.png?v=${version}`, base).href;
}

// Raster output works in Messages; a failed screenshot still yields a branded invitation.
export async function renderInvitationImage(project, screenshot) {
 let artwork;
 if (screenshot) {
  try { artwork = await sharp(screenshot, {limitInputPixels: 25_000_000}).rotate().resize(576, 438, {fit:'cover', position:'attention'}).png().toBuffer(); } catch {}
 }
 const name = Array.from(String(project.name || 'Your next discovery'));
 const lines = [];
 while (name.length && lines.length < 3) {
  let end = Math.min(19, name.length);
  if (end < name.length) { const space = name.slice(0, end).lastIndexOf(' '); if (space > 8) end = space; }
  lines.push(name.splice(0, end).join('').trim());
  while (name[0] === ' ') name.shift();
 }
 if (name.length) lines[2] = shorten(lines[2], 17) + '…';
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <rect width="1200" height="630" fill="#f7f3fc"/><circle cx="1130" cy="20" r="320" fill="#e6dcf7"/>
 <rect x="48" y="45" width="40" height="40" rx="12" fill="#6035aa"/><path d="m59 65 7 7 13-16" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>
 <g font-family="sans-serif"><text x="102" y="75" font-size="28" font-weight="700" fill="#362449">TryMyBuild</text>
 <text x="48" y="156" font-size="19" letter-spacing="2" fill="#6035aa">YOU’RE INVITED TO TRY</text>
 ${lines.map((line,i)=>`<text x="48" y="${223+i*62}" font-size="48" font-weight="700" fill="#292032">${xml(line)}</text>`).join('')}
 <text x="48" y="437" font-size="23" fill="#675975">${xml(shorten(project.category, 30))}</text>
 <rect x="48" y="477" width="264" height="58" rx="29" fill="#6035aa"/><text x="77" y="514" font-size="22" font-weight="700" fill="white">Take a look →</text>
 <rect x="576" y="106" width="576" height="438" rx="22" fill="#6035aa"/>
 ${!artwork ? '<circle cx="864" cy="298" r="100" fill="#8056bd"/><path d="m812 300 35 35 72-82" fill="none" stroke="#ffb07e" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><text x="864" y="464" text-anchor="middle" font-size="25" fill="white">Discover something new</text>' : ''}
 <text x="48" y="592" font-size="20" fill="#675975">${xml(shorten('Built by '+project.creator.name, 64))}</text><text x="1152" y="592" text-anchor="end" font-size="20" fill="#6035aa">trymybuild.com</text></g></svg>`;
 return sharp(Buffer.from(svg)).composite(artwork ? [{input:artwork,left:576,top:106}] : []).png().toBuffer();
}

export async function loadInvitationScreenshot(project, base) {
 try {
  const asset = await fetchPreviewAsset(new URL(project.preview, base).href, {requests:0, bytes:0, deadline:Date.now()+4500});
  if (!/^image\/(png|jpeg|webp|avif)(?:;|$)/i.test(asset.contentType)) return undefined;
  return asset.body;
 } catch { return undefined; }
}
