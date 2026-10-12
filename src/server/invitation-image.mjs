import {createHash} from 'node:crypto';
import {fetchPreviewAsset} from './preview-network.mjs';
import {renderStudioInvitation, studioInvitationVersion} from './studio-invitation.mjs';

export function invitationImageUrl(project, base) {
 const version=createHash('sha256').update(JSON.stringify([studioInvitationVersion,project.name,project.presentation,project.summary,project.category,project.preview,project.url,project.creator?.name])).digest('hex').slice(0,12);
 return new URL(`/api/invitation-image/${encodeURIComponent(project.slug)}.png?v=${version}`,base).href;
}

// A complete raster card can be attached to email, text, or the native share sheet.
export function renderInvitationImage(project,screenshot,options={}) {
 return renderStudioInvitation(project,screenshot,options);
}

export async function loadInvitationScreenshot(project, base) {
 try {
  const asset = await fetchPreviewAsset(new URL(project.preview, base).href, {requests:0, bytes:0, deadline:Date.now()+4500});
  if (!/^image\/(png|jpeg|webp|avif)(?:;|$)/i.test(asset.contentType)) return undefined;
  return asset.body;
 } catch { return undefined; }
}
