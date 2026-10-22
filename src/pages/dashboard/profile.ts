import type { APIRoute } from 'astro';
import { currentUser, env } from '../../server/auth';
import { database, ensureMember } from '../../server/database';
import { isFounder } from '../../server/admin-policy.mjs';
import { surface, signIn, e } from '../../server/feedback-ui';

export const GET: APIRoute = async context => {
 const user = await currentUser(context);
 if (!user) return signIn('/dashboard/profile');
 const admin = isFounder(user.id, env('FOUNDER_WORKOS_USER_ID'), user.email, env('FOUNDER_EMAIL'), user.emailVerified);
 try {
  const member = await ensureMember(user);
  const {data:p,error} = await database().from('profiles').select('display_name,identity_label,bio,is_public,avatar_path,website,slug,creator_type,location,location_public').eq('user_id',member.id).single();
  if(error) throw error;
  const initial=(p.display_name||'M').trim().slice(0,1)||'M';
  const initialSvg='data:image/svg+xml,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="#dcebdd"/><text x="48" y="60" text-anchor="middle" font-size="36" fill="#17332a">${e(initial)}</text></svg>`);
  const avatarSrc=e(p.avatar_path||initialSvg);
  const avatars=['leaf','sun','wave','spark'].map(a=>`<button type="button" data-avatar="/assets/avatars/${a}.svg" aria-pressed="${p.avatar_path==='/assets/avatars/'+a+'.svg'}" aria-label="Choose ${a} avatar"><img src="/assets/avatars/${a}.svg" alt=""></button>`).join('');
  const profileHref=p.slug?`/people/${encodeURIComponent(p.slug)}`:'/dashboard/profile';
  const body=`<div class="profile-editor-page">
   <header class="profile-page-heading"><div><h1>Public profile</h1><p>Help other makers know who’s behind your apps.</p></div><a class="secondary-button" href="${profileHref}">View profile →</a></header>
   <form id="profile-form" class="profile-editor-layout">
    <section class="profile-edit-card" aria-labelledby="profile-basics-title">
     <h2 id="profile-basics-title">Edit your profile</h2>
     <fieldset class="profile-image-fieldset"><legend>Profile image</legend><div class="profile-image-control"><img id="avatar-preview" class="person-avatar large" src="${avatarSrc}" alt="Your profile image"><div><input class="visually-hidden" id="photo" type="file" accept="image/jpeg,image/png,image/webp"><label class="secondary-button photo-upload-button" for="photo">Change image</label><p>JPG, PNG, or WebP. We’ll crop it to a square.</p></div></div><details class="profile-avatar-picker"><summary>Choose an avatar instead</summary><div class="avatar-choices">${avatars}<button type="button" data-avatar="" aria-pressed="${!p.avatar_path}">Use my initial</button></div></details></fieldset>
     <div class="profile-field"><label for="displayName">Public name</label><input type="text" id="displayName" name="displayName" value="${e(p.display_name)}" maxlength="60" required></div>
     <div class="profile-field"><label for="label">What do you do?</label><input type="text" id="label" name="label" value="${e(p.identity_label||'')}" maxlength="60" placeholder="Designer, developer, musician…"></div>
     <div class="profile-field"><label for="bio">Introduce yourself</label><textarea id="bio" name="bio" maxlength="500" placeholder="Share what you make and what you care about.">${e(p.bio||'')}</textarea><p class="profile-field-help">A sentence or two is plenty.</p></div>
     <details class="profile-more"><summary><span>More profile details</span><small>Creator type, location, and website</small></summary><div class="profile-more-fields"><div class="profile-field"><label for="creatorType">Creator type</label><select id="creatorType" name="creatorType"><option value="independent" ${p.creator_type==='independent'?'selected':''}>Independent</option><option value="company" ${p.creator_type==='company'?'selected':''}>Company</option></select></div><div class="profile-field"><label for="location">City and country <span>Optional</span></label><input id="location" name="location" maxlength="100" value="${e(p.location||'')}" placeholder="San Francisco, USA"><label class="profile-inline-choice"><input type="checkbox" name="locationPublic" ${p.location_public?'checked':''}> Show this on my profile</label></div><div class="profile-field"><label for="website">Website <span>Optional</span></label><input id="website" name="website" type="url" maxlength="1000" value="${e(p.website||'')}" placeholder="https://your-site.com"></div></div></details>
    </section>
    <aside class="profile-preview-column" aria-label="Profile preview and visibility">
     <article class="profile-preview-card"><div class="profile-preview-top"><span>Profile preview</span><strong data-profile-visibility-chip class="${p.is_public?'is-public':'is-private'}">${p.is_public?'Public':'Private'}</strong></div><img data-profile-preview-avatar src="${avatarSrc}" alt=""><h2 data-profile-preview-name>${e(p.display_name||'Your name')}</h2><p class="profile-preview-role" data-profile-preview-label>${e(p.identity_label||'What you do')}</p><p class="profile-preview-location" data-profile-preview-location${p.location_public&&p.location?'':' hidden'}>⌖ ${e(p.location||'')}</p><p class="profile-preview-bio" data-profile-preview-bio>${e(p.bio||'Tell people a little about yourself.')}</p><a href="${profileHref}">View full profile →</a></article>
     <section class="profile-visibility-card"><div><h2>Profile visibility</h2><p data-profile-visibility-copy>${p.is_public?'Anyone can view your creator profile.':'Only you can view your creator profile.'}</p></div><label class="profile-visibility-switch"><input type="checkbox" name="isPublic" ${p.is_public?'checked':''}><span>${p.is_public?'Public':'Private'}</span></label></section>
    </aside>
    <footer class="profile-save-bar"><p id="profile-status" role="status" aria-live="polite">Changes only appear after you save.</p><button class="primary-button" type="submit">Save changes</button></footer>
   </form>
  </div><script src="/profile-editor.js" defer></script>`;
  return surface('Public profile',body,'profile',200,admin);
 } catch { return surface('Public profile','<h1>Public profile</h1><p role="alert">Your profile could not be loaded. Please try again.</p><a href="/dashboard/profile">Try again</a>','profile',503,admin); }
};
