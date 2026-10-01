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
 const version = createHash('sha256').update(JSON.stringify(['glyph-v3', project.name, project.presentation?.headline, project.summary, project.category, project.preview, project.creator.name])).digest('hex').slice(0, 12);
 return new URL(`/api/invitation-image/${encodeURIComponent(project.slug)}.png?v=${version}`, base).href;
}

// Raster output works in Messages; a failed screenshot still yields a branded invitation.
export async function renderInvitationImage(project, screenshot) {
 let artwork;
 if (screenshot) {
  try { artwork = await sharp(screenshot, {limitInputPixels: 25_000_000}).rotate().resize(632, 482, {fit:'contain', background:'#eee8f4'}).png().toBuffer(); } catch {}
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
 const names=wrap(project.name||'Your next discovery',bold,46,410,2);
 const description=wrap(project.presentation?.headline||project.summary||project.category,regular,23,410,3);
 const nameY=202,descriptionY=nameY+(names.length-1)*55+62,buttonY=descriptionY+(description.length-1)*30+42;
 const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
 <rect width="1200" height="630" fill="#f7f3fc"/><circle cx="1150" cy="-30" r="270" fill="#e6dcf7"/>
 <rect x="48" y="42" width="40" height="40" rx="12" fill="#6035aa"/><path d="m59 62 7 7 13-16" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>
 ${text('TryMyBuild',102,72,28,'#362449',bold)}
 ${text('YOU’RE INVITED TO TRY',48,132,17,'#6035aa')}
 ${names.map((line,i)=>text(line,48,nameY+i*55,46,'#292032',bold)).join('')}
 ${description.map((line,i)=>text(line,48,descriptionY+i*30,23,'#675975')).join('')}
 <rect x="48" y="${buttonY}" width="238" height="56" rx="28" fill="#6035aa"/>${text('Explore app →',76,buttonY+36,21,'#ffffff',bold)}
 <rect x="520" y="74" width="632" height="482" rx="22" fill="#eee8f4"/>
 ${!artwork ? `<circle cx="836" cy="288" r="96" fill="#8056bd"/><path d="m786 290 34 34 69-79" fill="none" stroke="#ffb07e" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>${text('Discover something new',690,452,25,'#6035aa')}` : ''}
 ${text(shorten('Built by '+project.creator.name,52),48,584,19,'#675975')}${text('trymybuild.com',1002,584,19,'#6035aa')}</svg>`;
 return sharp(Buffer.from(svg)).composite(artwork ? [{input:artwork,left:520,top:74}] : []).png().toBuffer();
}

export async function loadInvitationScreenshot(project, base) {
 try {
  const asset = await fetchPreviewAsset(new URL(project.preview, base).href, {requests:0, bytes:0, deadline:Date.now()+4500});
  if (!/^image\/(png|jpeg|webp|avif)(?:;|$)/i.test(asset.contentType)) return undefined;
  return asset.body;
 } catch { return undefined; }
}
