export const wishCategories = ["Family life","Technology","Sports & teams","Teaching & learning","Shopping","Money","Personal planning","Food & home","Travel","Creative work","AI & automation","Business & operations","Developer tools","Design","Communication","Data & analytics","Customer support","Health & wellness","Marketing & sales","Music & audio","Productivity","Social & community","Security & privacy","HR & recruiting","Legal","Real estate","Events","Gaming","Media & entertainment","Science & research","Sustainability","Accessibility","Utilities"];
import {normalizeCategory} from './listing-policy.mjs';

// Reuse listing aliases, but give custom wish names stable casing for deduplication.
// "All" and "Other" are interface choices, never stored category names.
export function normalizeWishCategory(value) {
 if(typeof value!=='string')return '';
 const clean=value.normalize('NFKC').replace(/\s+/g,' ').trim();
 if(clean.length>48||/^(all(?: categories)?|other(?:\.{3}|…)?|__other__)$/i.test(clean)||/:\/\//.test(clean))return '';
 const normalized=normalizeCategory(clean.toLocaleLowerCase());
 return wishCategories.find(name=>name.toLocaleLowerCase()===normalized.toLocaleLowerCase())||normalized;
}
export function validWish(category, description) {
 return Boolean(normalizeWishCategory(category)) && typeof description==='string' && description.trim().length>0;
}
