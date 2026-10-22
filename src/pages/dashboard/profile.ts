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
  let websiteHref='';try{const parsed=new URL(p.website||'');if(['http:','https:'].includes(parsed.protocol))websiteHref=parsed.href;}catch{}
  const body=`<div class="profile-editor-page">
   <header class="profile-page-heading"><div><h1>Public profile</h1><p>This is how other makers see you.</p></div><a class="secondary-button" href="${profileHref}">View public profile ↗</a></header>
   <form id="profile-form" class="profile-studio-layout" data-photo-ready="${Boolean(p.avatar_path)}">
    <section class="profile-live-column" aria-label="Live public profile preview">
     <article class="profile-stage-card">
      <div class="profile-cover-art" aria-hidden="true"><span class="profile-cover-sun"></span><span class="profile-cover-orbit"></span><span class="profile-cover-hill profile-cover-hill-one"></span><span class="profile-cover-hill profile-cover-hill-two"></span><span class="profile-cover-spark">✦</span></div>
      <div class="profile-stage-body">
       <img data-profile-preview-avatar src="${avatarSrc}" alt="">
       <div class="profile-stage-identity"><div class="profile-stage-title"><h2 data-profile-preview-name>${e(p.display_name||'Your name')}</h2><button type="button" class="profile-inline-edit" data-profile-edit="displayName" aria-label="Edit public name">✎</button></div><div class="profile-stage-role"><p data-profile-preview-label>${e(p.identity_label||'What you do')}</p><button type="button" class="profile-inline-edit" data-profile-edit="label" aria-label="Edit headline">✎</button></div></div>
       <strong data-profile-visibility-chip class="profile-stage-visibility ${p.is_public?'is-public':'is-private'}">${p.is_public?'Public':'Private'}</strong>
       <div class="profile-stage-bio"><p data-profile-preview-bio>${e(p.bio||'Tell people what you make and what you care about.')}</p><button type="button" class="profile-inline-edit" data-profile-edit="bio" aria-label="Edit bio">✎</button></div>
       <div class="profile-stage-meta"><span data-profile-preview-location${p.location_public&&p.location?'':' hidden'}>⌖ ${e(p.location||'')}</span><a data-profile-preview-website href="${e(websiteHref||'#')}"${websiteHref?' target="_blank" rel="noopener noreferrer"':''}${websiteHref?'':' hidden'}>${e((websiteHref||'').replace(/^https?:\/\//,'').replace(/\/$/,''))}</a></div>
      </div>
     </article>
     <section class="profile-readiness" aria-labelledby="profile-readiness-title"><div class="profile-readiness-heading"><span class="profile-readiness-icon">✓</span><div><h2 id="profile-readiness-title" data-profile-readiness-title>Your profile is ready</h2><p data-profile-readiness-copy>People can quickly understand who you are and what you make.</p></div></div><div class="profile-readiness-steps"><span data-profile-ready="photo">Photo added</span><span data-profile-ready="bio">Bio added</span><span data-profile-ready="website">Website added</span></div></section>
     <aside class="profile-inspiration"><span aria-hidden="true">✦</span><div><strong>Make a memorable first impression</strong><p>A recognizable photo and a few honest lines help other makers feel comfortable starting a conversation.</p></div></aside>
    </section>
    <aside class="profile-editor-rail" aria-labelledby="profile-basics-title">
     <div class="profile-editor-rail-heading"><h2 id="profile-basics-title">Make it yours</h2><p>Your preview updates as you type.</p></div>
     <fieldset class="profile-image-fieldset"><legend>Photo</legend><div class="profile-image-control"><img id="avatar-preview" class="person-avatar large" src="${avatarSrc}" alt="Your profile image"><div><input class="visually-hidden" id="photo" type="file" accept="image/jpeg,image/png,image/webp"><label class="secondary-button photo-upload-button" for="photo">Change</label><details class="profile-avatar-picker"><summary>Use an avatar</summary><div class="avatar-choices">${avatars}<button type="button" data-avatar="" aria-pressed="${!p.avatar_path}">Use my initial</button></div></details></div></div></fieldset>
     <div class="profile-field"><label for="displayName">Name</label><input type="text" id="displayName" name="displayName" value="${e(p.display_name)}" maxlength="60" required></div>
     <div class="profile-field"><label for="label">Headline</label><input type="text" id="label" name="label" value="${e(p.identity_label||'')}" maxlength="60" placeholder="Designer, developer, musician…"></div>
     <div class="profile-field"><label for="bio">Bio</label><textarea id="bio" name="bio" maxlength="500" placeholder="What are you building, and what do you care about?">${e(p.bio||'')}</textarea><p class="profile-field-help">A sentence or two is plenty.</p></div>
     <div class="profile-field"><label for="website">Website <span>Optional</span></label><input id="website" name="website" type="url" maxlength="1000" value="${e(p.website||'')}" placeholder="https://your-site.com"></div>
     <details class="profile-more"><summary><span>More details</span><small>Creator type and location</small></summary><div class="profile-more-fields"><div class="profile-field"><label for="creatorType">Creator type</label><select id="creatorType" name="creatorType"><option value="independent" ${p.creator_type==='independent'?'selected':''}>Independent</option><option value="company" ${p.creator_type==='company'?'selected':''}>Company</option></select></div><div class="profile-field"><label for="location">City and country <span>Optional</span></label><input id="location" name="location" maxlength="100" value="${e(p.location||'')}" placeholder="San Francisco, USA"><label class="profile-inline-choice"><input type="checkbox" name="locationPublic" ${p.location_public?'checked':''}> Show on my profile</label></div></div></details>
     <div class="profile-rail-visibility"><div><strong>Profile visibility</strong><p data-profile-visibility-copy>${p.is_public?'Anyone can view your profile.':'Only you can view your profile.'}</p></div><label class="profile-visibility-switch"><input type="checkbox" name="isPublic" ${p.is_public?'checked':''}><span>${p.is_public?'Public':'Private'}</span></label></div>
     <footer class="profile-save-bar"><p id="profile-status" role="status" aria-live="polite">Changes only appear after you save.</p><button class="primary-button" type="submit">Save changes</button></footer>
    </aside>
   </form>
  </div><script src="/profile-editor.js" defer></script>`;
  return surface('Public profile',body,'profile',200,admin);
 } catch { return surface('Public profile','<h1>Public profile</h1><p role="alert">Your profile could not be loaded. Please try again.</p><a href="/dashboard/profile">Try again</a>','profile',503,admin); }
};
