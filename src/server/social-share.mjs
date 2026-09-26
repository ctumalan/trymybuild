import sharp from 'sharp';
import {create} from 'fontkit';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
const sans=create(readFileSync(path.join(process.cwd(),'assets/fonts/dm-sans-invitation.ttf')));
const serif=create(readFileSync(path.join(process.cwd(),'assets/fonts/newsreader-latin.woff2')));
const mark=readFileSync(path.join(process.cwd(),'assets/brand/trymybuild-mark.svg'));
export const socialFormats={facebook:{width:1200,height:630},instagram:{width:1080,height:1350},story:{width:1080,height:1920}};
const clean=(value,max)=>Array.from(String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim()).slice(0,max).join('');
const hooks={
 afterschooltogether:'Two kids. Three activities. Can you make every pickup?',
 stackscout:'Too many tools. Which ones fit your build?',
 gamegrid:'Game time changed. Is everyone on the same page?',
 pocketbalance:'Where is your money going this month?',
 dayframe:'A full to-do list. A day with limits.',
 mealmap:'Another week. What’s for dinner?',
 homerhythm:'Small home jobs. Easy to forget.',
 packlight:'Ready for the trip. Without the extra baggage.',
 briefbuilder:'An idea in your head. A brief others can use.',
 cartcompare:'Which purchase is actually worth it?',
 lessonlab:'A whole lesson. A limited amount of time.'
};
export function socialCopy(project,overrides={}) {
 return {headline:clean(overrides.headline,110)||hooks[project.slug]||clean(project.presentation?.help||project.summary||project.name,110),
 description:clean(overrides.description,160)||clean(project.summary||project.presentation?.headline||project.category,160)};
}
export function socialImageUrl(project,base,format='facebook',overrides={}) {
 const copy=socialCopy(project,overrides),url=new URL(`/api/social-image/${encodeURIComponent(project.slug)}.png`,base);
 const v=createHash('sha256').update(JSON.stringify(['social-v1',project.name,project.preview,project.category,copy,format])).digest('hex').slice(0,12);
 url.search=new URLSearchParams({format,...copy,v}).toString();return url.href;
}
export function socialPageUrl(project,base,overrides={}) {
 const url=new URL(`/projects/${encodeURIComponent(project.slug)}`,base);
 url.search=new URLSearchParams({social:'1',...socialCopy(project,overrides)}).toString();return url.href;
}
const bold=sans.getVariation({wght:700});
function measure(value,font,size){return font.layout(value).positions.reduce((n,p)=>n+p.xAdvance,0)*size/font.unitsPerEm;}
function lines(value,font,size,width,maxLines){
 const words=String(value).split(' '),out=[];let line='';
 for(const word of words){const next=line?line+' '+word:word;if(line&&measure(next,font,size)>width){out.push(line);line=word;}else line=next;}
 if(line)out.push(line);
 if(out.length>maxLines){out.length=maxLines;out[maxLines-1]+='…';}
 return out.map(line=>{while(measure(line,font,size)>width&&line.length>1)line=line.slice(0,-2)+'…';return line;});
}
function text(value,x,y,size,color,font=sans){
 let cursor=x;const scale=size/font.unitsPerEm,run=font.layout(String(value));
 return run.glyphs.map((glyph,i)=>{const p=run.positions[i],d=glyph.path.toSVG(),svg=`<path d="${d}" transform="translate(${cursor+p.xOffset*scale} ${y-p.yOffset*scale}) scale(${scale} ${-scale})" fill="${color}"/>`;cursor+=p.xAdvance*scale;return svg;}).join('');
}
export async function renderSocialImage(project,screenshot,format='facebook',overrides={}) {
 if(!Object.hasOwn(socialFormats,format))throw Error('Unknown social format');
 const {width:w,height:h}=socialFormats[format],copy=socialCopy(project,overrides),landscape=format==='facebook',story=format==='story';
 const margin=landscape?56:72,brandY=story?195:landscape?60:78;
 const tx=margin,top=story?368:landscape?202:241,ts=landscape?55:story?79:76,tw=landscape?532:936;
 const headline=lines(copy.headline,serif,ts,tw,landscape?4:4);
 const descY=top+(headline.length-1)*ts*1.03+(landscape?58:70);
 const desc=lines(copy.description,sans,landscape?23:30,tw,landscape?2:3);
 const footerY=story?1595:landscape?590:1240;
 const appY=landscape?540:Math.max(story?888:591,descY+(desc.length-1)*41+70);
 const sx=landscape?650:margin,sy=landscape?174:Math.max(story?970:665,appY+94),sw=landscape?494:936,sh=landscape?316:Math.min(story?510:405,footerY-120-Math.max(story?970:665,appY+94));
 let screen;
 if(screenshot)try{screen=await sharp(screenshot,{limitInputPixels:25_000_000}).rotate().resize(sw,sh,{fit:'cover',position:'north'}).png().toBuffer();}catch{}
 const logo=await sharp(mark).resize(52,52).png().toBuffer();
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
 <rect width="${w}" height="${h}" fill="#faf7f1"/>
 <circle cx="${w}" cy="${h*.5}" r="${landscape?320:540}" fill="#eee5f8"/>
 <circle cx="${w-78}" cy="${story?310:130}" r="${landscape?44:66}" fill="#ffbd83"/>
 <path d="M${w-300} ${h*.22} Q ${w+150} ${h*.45} ${w-130} ${h*.8}" fill="none" stroke="#d1b8ec" stroke-width="2"/>
 ${text('TryMyBuild',margin+65,brandY+28,landscape?29:33,'#6035aa',bold)}
 ${text(clean(project.category||'Independent apps',45).toUpperCase(),tx,top-ts-24,landscape?14:19,'#78599b',bold)}
 ${headline.map((line,i)=>text(line,tx,top+i*ts*1.03,ts,'#30223f',serif)).join('')}
 ${desc.map((line,i)=>text(line,tx,descY+i*(landscape?31:41),landscape?23:30,'#65566e')).join('')}
 <rect x="${sx-14}" y="${sy-14}" width="${sw+28}" height="${sh+28}" rx="24" fill="#dac9ea"/>
 <rect x="${sx-10}" y="${sy-18}" width="${sw+20}" height="${sh+20}" rx="20" fill="#fff"/>
 ${!screen?text('A new idea. Ready to try.',sx+30,sy+sh/2,landscape?28:42,'#7545ad',serif):''}
 ${lines(clean(project.name,80),bold,landscape?26:40,landscape?1088:936,landscape?1:2).map((line,i)=>text(line,tx,appY+i*44,landscape?26:40,'#6035aa',bold)).join('')}
 <path d="M${margin} ${footerY-30} H${w-margin}" stroke="#d7c9e4"/>
 ${text('Try it. Tell the maker what you think.',margin,footerY,landscape?21:28,'#30223f',bold)}
 ${text('trymybuild.com',margin,footerY+(landscape?0:48),landscape?0:26,'#6035aa',bold)}
 ${landscape?text('trymybuild.com',w-246,footerY,22,'#6035aa',bold):''}
 </svg>`;
 return sharp(Buffer.from(svg)).composite([{input:logo,left:margin,top:brandY-12},...(screen?[{input:screen,left:sx,top:sy}]:[])]).png().toBuffer();
}
