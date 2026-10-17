import sharp from 'sharp';
import {create} from 'fontkit';
import {readFileSync} from 'node:fs';
import path from 'node:path';

const sans=create(readFileSync(path.join(process.cwd(),'assets/fonts/dm-sans-invitation.ttf')));
const bold=sans.getVariation({wght:700});
const mark=readFileSync(path.join(process.cwd(),'assets/brand/trymybuild-mark.svg'),'utf8').replaceAll('#6035AA','#B17BEA');
export const studioInvitationVersion='studio-invitation-v1';
const clean=value=>String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
const measure=(value,font,size)=>font.layout(value).positions.reduce((n,p)=>n+p.xAdvance,0)*size/font.unitsPerEm;

function lines(value,font,size,width,maxLines){
 const words=clean(value).slice(0,2000).split(' '),out=[];let line='';
 for(const word of words){const next=line?line+' '+word:word;if(line&&measure(next,font,size)>width){out.push(line);line=word;}else line=next;}
 if(line)out.push(line);
 if(out.length>maxLines){out.length=maxLines;out[maxLines-1]+='…';}
 return out.map(line=>{while(measure(line,font,size)>width&&line.length>1)line=line.slice(0,-2)+'…';return line;});
}

// Glyph paths keep exports identical in browsers, email and the deployment container.
function text(value,x,y,size,color,font=sans){
 let cursor=x;const scale=size/font.unitsPerEm,run=font.layout(String(value));
 return run.glyphs.map((glyph,i)=>{const p=run.positions[i],svg=`<path d="${glyph.path.toSVG()}" transform="translate(${cursor+p.xOffset*scale} ${y-p.yOffset*scale}) scale(${scale} ${-scale})" fill="${color}"/>`;cursor+=p.xAdvance*scale;return svg;}).join('');
}
const block=(value,x,y,size,width,maxLines,color,font=sans,leading=1.25)=>lines(value,font,size,width,maxLines).map((line,i)=>text(line,x,y+i*size*leading,size,color,font)).join('');

export async function renderStudioInvitation(project,screenshot,{width=1200,height=900,copy,listingPreview=false}={}){
 const portrait=height>width,compact=!portrait&&height<800,story=height>1600;
 const margin=portrait?64:44,contentWidth=width-margin*2;
 const nameSize=portrait?64:compact?44:64,nameY=portrait?(story?200:164):compact?102:164;
 const nameLines=lines(project.name||'Your next discovery',bold,nameSize,contentWidth,compact?1:2);
 const description=project.presentation?.headline||project.summary||project.category||'';
 const descriptionY=nameY+(nameLines.length-1)*nameSize*1.12+(compact?34:42);
 const descriptionSize=compact?20:portrait?27:25;
 const descriptionLines=lines(description,sans,descriptionSize,contentWidth,compact?1:2);
 const headerHeight=Math.max(compact?168:portrait?(story?340:282):248,descriptionY+(descriptionLines.length-1)*descriptionSize*1.3+30);
 const footerTop=height-(portrait?104:78),bodyTop=headerHeight+(portrait?42:compact?28:44);
 const previewWidth=portrait?contentWidth:compact?650:648,chromeHeight=compact?32:42;
 const screenY=bodyTop+24+chromeHeight;
 const screenHeight=portrait?(story?650:422):footerTop-screenY-52;
 const screenX=margin,chromeY=bodyTop+24,previewBottom=screenY+screenHeight;
 const messageX=portrait?margin:margin+previewWidth+64,messageWidth=portrait?contentWidth:width-margin-messageX;
 const messageY=portrait?previewBottom+(story?160:140):bodyTop+(compact?48:76);
 const heading=listingPreview?'Your app’s next chapter starts here.':copy?.headline||'Give it a try. Share what you think.';
 const message=listingPreview?'Review your unlisted preview and make it yours before publishing.':copy?.description||project.presentation?.help||project.summary||'Explore the app and let the maker know what you think.';
 let headingSize=portrait?(story?54:38):compact?28:36;
 const headingMax=portrait?(story?3:2):compact?4:3;
 const headingMin=portrait?(story?42:30):compact?22:28;
 while(headingSize>headingMin&&lines(heading,bold,headingSize,messageWidth,30).length>headingMax)headingSize-=2;
 const headingLines=lines(heading,bold,headingSize,messageWidth,headingMax);
 const messageSize=portrait?(story?32:26):compact?21:25;
 const messageTop=messageY+(headingLines.length-1)*headingSize*1.15+headingSize+(compact?6:16);
 const buttonHeight=portrait?(story?62:52):compact?42:52;
 const lastButtonY=portrait?footerTop-buttonHeight-30:footerTop-buttonHeight-58;
 const messageMax=Math.max(1,Math.min(compact?3:4,Math.floor((lastButtonY-messageTop-20)/(messageSize*1.35))+1));
 const messageLines=lines(message,sans,messageSize,messageWidth,messageMax);
 const buttonY=Math.min(lastButtonY,messageTop+(messageLines.length-1)*messageSize*1.35+(portrait?48:52));
 let host='App website';
 try{host=new URL(project.url||project.external_url).hostname.replace(/^www\./,'');}catch{}
 const hostLines=lines(host,sans,compact?15:19,previewWidth-180,1);
 const creator=clean(project.creator?.name)||'Independent creator';
 const initials=creator.split(' ').slice(0,2).map(part=>Array.from(part)[0]||'').join('').toUpperCase();
 const buttonLabel=listingPreview?'Review your page ↗':'Explore app ↗',buttonSize=portrait?26:compact?20:24;
 const buttonWidth=measure(buttonLabel,bold,buttonSize)+48;
 let artwork;
 if(screenshot)try{artwork=await sharp(screenshot,{limitInputPixels:25_000_000}).rotate().resize(previewWidth,Math.round(screenHeight),{fit:'contain',background:'#ffffff'}).png().toBuffer();}catch{}
 const logoSize=portrait?58:compact?36:52,brandY=portrait?(story?68:48):compact?24:36;
 const brandSize=portrait?32:compact?24:28;
 const kicker=listingPreview?'YOUR PROPOSED APP LISTING':'YOU’RE INVITED TO TRY';
 const kickerSize=portrait?17:compact?13:16;
 const kickerX=width-margin-measure(kicker,bold,kickerSize);
 const footerY=footerTop+(portrait?58:46),avatarSize=portrait?48:compact?32:42;
 const footerLabel=listingPreview?'Unlisted preview · Edit before publishing':'Built by '+creator;
 const footerSize=portrait?23:compact?17:20;
 const signoff='trymybuild.com',signoffSize=portrait?23:compact?17:20;
 const signoffWidth=measure(signoff,sans,signoffSize);
 const footerLabelX=listingPreview?margin:margin+avatarSize+14;
 const labelWidth=width-margin-signoffWidth-36-footerLabelX;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
 <defs><clipPath id="card"><rect width="${width}" height="${height}" rx="24"/></clipPath><clipPath id="browser"><rect x="${screenX}" y="${chromeY}" width="${previewWidth}" height="${chromeHeight+screenHeight}" rx="14"/></clipPath></defs>
 <g clip-path="url(#card)"><rect width="${width}" height="${height}" fill="#fcfbfa"/>
 <rect width="${width}" height="${headerHeight}" fill="#24172e"/>
 <rect y="${headerHeight-4}" width="${width}" height="4" fill="#b17bea"/>
 <image href="data:image/svg+xml;base64,${Buffer.from(mark).toString('base64')}" x="${margin}" y="${brandY-8}" width="${logoSize}" height="${logoSize}"/>
 ${text('TryMyBuild',margin+logoSize+12,brandY+brandSize,brandSize,'#f7efff',bold)}
 ${text(kicker,kickerX,brandY+brandSize-4,kickerSize,'#d3b9ec',bold)}
 ${nameLines.map((line,i)=>text(line,margin,nameY+i*nameSize*1.12,nameSize,'#ffffff',bold)).join('')}
 ${descriptionLines.map((line,i)=>text(line,margin,descriptionY+i*descriptionSize*1.3,descriptionSize,'#dac8e8')).join('')}
 ${text('PRODUCT PREVIEW',margin,bodyTop,compact?12:16,'#605768',bold)}
 <circle cx="${margin+previewWidth-61}" cy="${bodyTop-6}" r="${compact?6:8}" fill="#7944b4"/>
 ${text('LIVE',margin+previewWidth-45,bodyTop,compact?12:15,'#24172e',bold)}
 <g clip-path="url(#browser)"><rect x="${screenX}" y="${chromeY}" width="${previewWidth}" height="${chromeHeight+screenHeight}" fill="#ffffff"/>
 <rect x="${screenX}" y="${chromeY}" width="${previewWidth}" height="${chromeHeight}" fill="#f1f0ef"/>
 ${['#ef6461','#efb84c','#64bf76'].map((color,i)=>`<circle cx="${screenX+20+i*14}" cy="${chromeY+chromeHeight/2}" r="4.5" fill="${color}"/>`).join('')}
 <rect x="${screenX+82}" y="${chromeY+7}" width="${previewWidth-125}" height="${chromeHeight-14}" rx="12" fill="#e8e7e6"/>
 <g transform="translate(${screenX+98} ${chromeY+chromeHeight/2-7})" fill="none" stroke="#605768" stroke-width="1.5"><rect x="1" y="6" width="10" height="8" rx="1.5"/><path d="M3 6V4a3 3 0 0 1 6 0v2"/></g>
 ${text(hostLines.join(''),screenX+117,chromeY+chromeHeight/2+6,compact?15:19,'#605768')}
 ${[0,1,2].map(i=>`<circle cx="${screenX+previewWidth-21}" cy="${chromeY+chromeHeight/2-5+i*5}" r="1.5" fill="#605768"/>`).join('')}
 ${artwork?`<image href="data:image/png;base64,${artwork.toString('base64')}" x="${screenX}" y="${screenY}" width="${previewWidth}" height="${screenHeight}"/>`:`<rect x="${screenX}" y="${screenY}" width="${previewWidth}" height="${screenHeight}" fill="#f6f2f9"/><circle cx="${screenX+previewWidth/2}" cy="${screenY+screenHeight/2-22}" r="36" fill="#7944b4"/><path d="m${screenX+previewWidth/2-12} ${screenY+screenHeight/2-22} 9 9 18-21" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>${block('A new idea. Ready to try.',screenX+32,screenY+screenHeight/2+50,compact?23:28,previewWidth-64,1,'#605768',bold)}`}
 </g><rect x="${screenX+.5}" y="${chromeY+.5}" width="${previewWidth-1}" height="${chromeHeight+screenHeight-1}" rx="14" fill="none" stroke="#ded9e0" stroke-width="1.5"/>
 ${block(host,margin,previewBottom+31,compact?15:19,previewWidth,1,'#756d7c')}
 ${!portrait?`<path d="M${messageX-32} ${bodyTop-14}V${footerTop-24}" stroke="#ded9e0"/>`:''}
 ${text(listingPreview?'A PERSONAL INVITATION':'A LITTLE DISCOVERY FOR YOU',messageX,messageY-headingSize-24,portrait?16:compact?11:14,'#75637f',bold)}
 ${headingLines.map((line,i)=>text(line,messageX,messageY+i*headingSize*1.15,headingSize,'#24172e',bold)).join('')}
 ${block(message,messageX,messageTop,messageSize,messageWidth,messageMax,'#65596f',sans,1.35)}
 <rect x="${messageX}" y="${buttonY}" width="${buttonWidth}" height="${buttonHeight}" rx="12" fill="#7944b4"/>
 ${text(buttonLabel,messageX+24,buttonY+buttonHeight/2+buttonSize*.34,buttonSize,'#ffffff',bold)}
 <path d="M${margin} ${footerTop}H${width-margin}" stroke="#ded9e0"/>
 ${listingPreview?'':`<circle cx="${margin+avatarSize/2}" cy="${footerY-8}" r="${avatarSize/2}" fill="#dbe9dc"/>${text(initials,margin+(avatarSize-measure(initials,bold,avatarSize*.32))/2,footerY-8+avatarSize*.12,avatarSize*.32,'#17332a',bold)}`}
 ${block(footerLabel,footerLabelX,footerY,footerSize,labelWidth,1,'#605768')}
 ${text(signoff,width-margin-signoffWidth,footerY,signoffSize,'#7944b4')}
 </g><rect x=".75" y=".75" width="${width-1.5}" height="${height-1.5}" rx="24" fill="none" stroke="#ded9e0" stroke-width="1.5"/>
 </svg>`;
 return sharp(Buffer.from(svg)).png().toBuffer();
}
