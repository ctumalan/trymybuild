import sharp from 'sharp';
import {create} from 'fontkit';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const invitationFont=create(readFileSync(path.join(process.cwd(),'assets/fonts/dm-sans-invitation.ttf')));
import { createHash } from 'node:crypto';
import { fetchPreviewAsset } from './preview-network.mjs';

const xml = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])).replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
const shorten = (value, max) => Array.from(String(value || '')).length > max ? Array.from(String(value)).slice(0, max - 1).join('') + '…' : String(value || '');
export function invitationImageUrl(project, base) {
 const version = createHash('sha256').update(JSON.stringify(['glyph-v2', project.name, project.presentation?.headline, project.summary, project.category, project.preview, project.creator.name])).digest('hex').slice(0, 12);
 return new URL(`/api/invitation-image/${encodeURIComponent(project.slug)}.png?v=${version}`, base).href;
}

// Raster output works in Messages; a failed screenshot still yields a branded invitation.
export async function renderInvitationImage(project, screenshot) {
 let artwork;
 if (screenshot) {
  try { artwork = await sharp(screenshot, {limitInputPixels: 25_000_000}).rotate().resize(576, 438, {fit:'contain', background:'#eee8f4'}).png().toBuffer(); } catch {}
 }
 const regular = invitationFont;
 const bold = invitationFont.getVariation({wght:700});
 const wrap = (value,font,size,width,maxLines) => {
  const words=String(value||'').replace(/\s+/g,' ').trim().split(' '),lines=[];let line='';
  const measure=t=>font.layout(t).positions.reduce((n,p)=>n+p.xAdvance,0)*size/font.unitsPerEm;
  for(const word of words){const candidate=line?line+' '+word:word;if(line&&measure(candidate)>width){lines.push(line);line=word;}else line=candidate;}
  if(line)lines.push(line);
  if(lines.length>maxLines){lines.length=maxLines;lines[maxLines-1]+='…';}
  return lines.map(line=>{while(measure(line)>width&&line.length>1)line=line.slice(0,-2)+'…';return line;});
 };
 // Glyph paths avoid dependency on fonts installed in the deployment container.
 const text=(value,x,y,size,color,font=regular)=>{
  let cursor=x;const scale=size/font.unitsPerEm,run=font.layout(String(value));
  return run.glyphs.map((glyph,i)=>{const p=run.positions[i],path=`<path d="${glyph.path.toSVG()}" transform="translate(${cursor+p.xOffset*scale} ${y-p.yOffset*scale}) scale(${scale} ${-scale})" fill="${color}"/>`;cursor+=p.xAdvance*scale;return path;}).join('');
 };
 const names=wrap(project.name||'Your next discovery',bold,46,475,3);
 const description=wrap(project.presentation?.headline||project.summary||project.category,regular,24,475,3);
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <rect width="1200" height="630" fill="#f7f3fc"/><circle cx="1130" cy="20" r="320" fill="#e6dcf7"/>
 <rect x="48" y="45" width="40" height="40" rx="12" fill="#6035aa"/><path d="m59 65 7 7 13-16" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>
 ${text('TryMyBuild',102,75,28,'#362449',bold)}
 ${text('YOU’RE INVITED TO TRY',48,142,18,'#6035aa')}
 ${names.map((line,i)=>text(line,48,205+i*57,46,'#292032',bold)).join('')}
 ${description.map((line,i)=>text(line,48,369+i*31,24,'#675975')).join('')}
 <rect x="48" y="477" width="264" height="58" rx="29" fill="#6035aa"/>${text('Take a look →',77,514,22,'#ffffff',bold)}
 <rect x="576" y="106" width="576" height="438" rx="22" fill="#eee8f4"/>
 ${!artwork ? `<circle cx="864" cy="298" r="100" fill="#8056bd"/><path d="m812 300 35 35 72-82" fill="none" stroke="#ffb07e" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>${text('Discover something new',715,464,25,'#6035aa')}` : ''}
 ${text(shorten('Built by '+project.creator.name,56),48,592,20,'#675975')}${text('trymybuild.com',990,592,20,'#6035aa')}</svg>`;
 return sharp(Buffer.from(svg)).composite(artwork ? [{input:artwork,left:576,top:106}] : []).png().toBuffer();
}

export async function loadInvitationScreenshot(project, base) {
 try {
  const asset = await fetchPreviewAsset(new URL(project.preview, base).href, {requests:0, bytes:0, deadline:Date.now()+4500});
  if (!/^image\/(png|jpeg|webp|avif)(?:;|$)/i.test(asset.contentType)) return undefined;
  return asset.body;
 } catch { return undefined; }
}
