import '../../project-view.js';
import '../../project-media.js';
import {e} from './feedback-ui';
export function projectDetailContent(p:any){
 const c=p.creator||{},note=c.founderException?'Founder exception—not earned through feedback. Not a product-quality guarantee.':c.verificationNote||'Qualifying contribution and app ownership confirmed';
 const creator = `${c.slug?`<a class="creator-byline" href="/people/${e(encodeURIComponent(c.slug))}">`:'<span class="creator-byline">'}by ${e(c.name||'You')}${c.verified?`<span class="creator-verified" title="${e(note)}">✓ Verified</span>`:''}${c.slug?'</a>':'</span>'}`;
 return (globalThis as any).CWProjectView.hero(p, {creator, titleId:'detail-title-'+p.slug});
}
export function projectConversation(p:any){return (globalThis as any).CWProjectView.conversation(p);}
export function projectTheme(p:any){return (globalThis as any).CWProjectView.theme(p);}
