const escape=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const formats={facebook:{label:'Facebook',size:'1200 × 630',help:'Copy your post, then open Facebook and choose your group. Paste and review before posting. Facebook may crop or cache link previews.'},instagram:{label:'Instagram post',size:'1080 × 1350',help:'Download this portrait, upload it to Instagram, and paste your caption. Add your app link to your profile if you want to direct people there.'},story:{label:'Story',size:'1080 × 1920',help:'Download the vertical artwork and upload it to your Story. Copy the app link and add it with a link sticker in Instagram.'}};
export function suggestedSocialPost(p,copy){
 return `${copy.headline}\n\n${p.isOwner?'I’m building':'Found'} ${p.name}. ${copy.description}\n\n${p.firstTry?'Try this: '+p.firstTry+'\n':''}What would make this more useful to you?`;
}
export function mountSocialShare(panel,p,signal){
 let format='facebook',imageUrl,file,request,timer,revision=0,disposed=false,captionEdited=false;
 panel.innerHTML=`<p class="social-intro">Start with the need. Invite someone to try a solution.</p><div class="social-formats" role="group" aria-label="Social format">${Object.entries(formats).map(([key,f])=>`<button type="button" data-social-format="${key}" aria-pressed="${key===format}">${f.label}</button>`).join('')}</div><div class="social-layout"><div class="social-art-column"><figure class="social-art" data-art-format="facebook"><img data-social-image hidden alt=""><span data-art-status role="status">Preparing artwork…</span></figure><p class="social-spec"><span data-social-size>1200 × 630</span> · TryMyBuild original template</p><button type="button" class="text-button" data-social-retry hidden>Retry preview</button></div><div class="social-editor"><label for="social-headline">Lead with the need</label><input id="social-headline" maxlength="110" value="${escape(p.social.headline)}"><label for="social-description">How this app helps</label><textarea id="social-description" rows="2" maxlength="160">${escape(p.social.description)}</textarea><label for="social-caption">Suggested post <span>· edit to make it yours</span></label><textarea id="social-caption" rows="6" maxlength="1800"></textarea><p class="social-note">These edits apply to this share only. Your app listing stays unchanged.</p></div></div><div class="social-actions"><button type="button" class="primary-button" data-social-copy>Copy post + link</button><button type="button" class="secondary-button" data-social-download disabled>Download image</button><a class="secondary-button" data-social-open target="_blank" rel="noopener noreferrer">Open Facebook ↗</a><button type="button" class="text-button" data-social-link>Copy app link</button><button type="button" class="text-button" data-social-native ${navigator.share?'':'hidden'}>Share image…</button></div><p class="social-help" data-social-help></p><p class="social-note" data-social-edit-note>Edited headlines are included in your Facebook link preview. The downloaded image is ready to upload as a photo instead.</p><p data-social-status role="status" aria-live="polite"></p>`;
 const $=s=>panel.querySelector(s),headline=$('#social-headline'),description=$('#social-description'),caption=$('#social-caption'),status=$('[data-social-status]');
 const copy=()=>({headline:headline.value.trim()||p.social.headline,description:description.value.trim()||p.social.description});
 const url=()=>{const u=new URL(p.url);u.searchParams.set('social','1');for(const [k,v] of Object.entries(copy()))u.searchParams.set(k,v);return u.href;};
 const suggested=()=>suggestedSocialPost(p,copy());
 const updateLinks=()=>{$('[data-social-open]').href='https://www.facebook.com/sharer/sharer.php?'+new URLSearchParams({u:url()});};
 const revoke=()=>{if(imageUrl)URL.revokeObjectURL(imageUrl);imageUrl=undefined;file=undefined;};
 const invalidate=()=>{revision++;clearTimeout(timer);request?.abort();$('[data-social-download]').disabled=true;$('[data-social-native]').disabled=true;$('[data-social-image]').hidden=true;$('[data-art-status]').hidden=false;$('[data-art-status]').textContent='Preparing artwork…';$('[data-social-retry]').hidden=true;};
 async function preview(){
  const version=revision;request=new AbortController();
  try{
   const u=new URL(p.social.image);u.searchParams.set('format',format);for(const [k,v] of Object.entries(copy()))u.searchParams.set(k,v);
   const response=await fetch(u,{signal:request.signal});if(!response.ok||!response.headers.get('content-type')?.includes('image/png'))throw Error();
   const blob=await response.blob();if(disposed||version!==revision)return;
   revoke();file=new File([blob],`${p.name.replace(/[^a-z0-9]+/gi,'-')}-${format}.png`,{type:'image/png'});imageUrl=URL.createObjectURL(file);
   const img=$('[data-social-image]');img.src=imageUrl;img.alt=copy().headline+' — '+p.name+' on TryMyBuild';img.hidden=false;
   $('[data-art-status]').hidden=true;$('[data-social-download]').disabled=false;$('[data-social-native]').disabled=false;
  }catch(error){if(error.name==='AbortError'||disposed||version!==revision)return;$('[data-art-status]').textContent='The artwork couldn’t load. You can still copy the post and link.';$('[data-social-retry]').hidden=false;}
 }
 function refresh(){status.textContent='';invalidate();updateLinks();if(!captionEdited)caption.value=suggested();timer=setTimeout(preview,450);}
 function selectFormat(next){format=next;panel.querySelectorAll('[data-social-format]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.socialFormat===format)));$('[data-art-format]').dataset.artFormat=format;$('[data-social-size]').textContent=formats[format].size;$('[data-social-help]').textContent=formats[format].help;$('[data-social-open]').hidden=format!=='facebook';$('[data-social-copy]').textContent=format==='facebook'?'Copy post + link':'Copy caption';$('[data-social-edit-note]').hidden=format!=='facebook';refresh();}
 headline.addEventListener('input',refresh);description.addEventListener('input',refresh);caption.addEventListener('input',()=>{captionEdited=true;});
 async function clipboard(text,success){try{await navigator.clipboard.writeText(text);status.textContent=success;}catch{caption.focus();caption.select();status.textContent='Copying is unavailable in this browser. Select and copy your caption, or use the share image option.';}}
 panel.addEventListener('click',async event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.dataset.socialFormat){selectFormat(target.dataset.socialFormat);return;}
  if(target.matches('[data-social-retry]')){invalidate();void preview();return;}
  if(target.matches('[data-social-copy]')){await clipboard(caption.value.trim()+'\n\n'+(format==='facebook'?url():p.url),'Copied. Paste and review it in your chosen app.');return;}
  if(target.matches('[data-social-link]')){await clipboard(format==='facebook'?url():p.url,'App link copied.');return;}
  if(target.matches('[data-social-download]')&&file){const a=document.createElement('a');a.href=imageUrl;a.download=file.name;document.body.append(a);a.click();a.remove();status.textContent='Image download started. Upload it in your chosen app.';return;}
  if(target.matches('[data-social-native]')&&file){try{if(!navigator.canShare?.({files:[file]}))throw Error('Your browser cannot share image files directly. Download the image and copy the caption instead.');await navigator.share({files:[file],title:p.name,text:caption.value.trim()+'\n\n'+p.url});}catch(error){if(error.name!=='AbortError')status.textContent=error.message;}}
 });
 selectFormat(format);
 const dispose=()=>{disposed=true;revision++;clearTimeout(timer);request?.abort();revoke();signal.removeEventListener('abort',dispose);};
 signal.addEventListener('abort',dispose,{once:true});return dispose;
}
