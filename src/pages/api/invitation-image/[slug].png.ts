import type { APIRoute } from 'astro';
import { getPublishedProject } from '../../../server/catalog-db';
import { origin } from '../../../server/auth';
import { loadInvitationScreenshot, renderInvitationImage } from '../../../server/invitation-image.mjs';

export const GET: APIRoute = async context => {
 try {
  const project = await getPublishedProject(context.params.slug || '');
  if (!project) return new Response('Project unavailable', {status:404, headers:{'Cache-Control':'no-store'}});
  const screenshot = await loadInvitationScreenshot(project, origin(context));
  const image = await renderInvitationImage(project, screenshot);
  return new Response(new Uint8Array(image), {headers:{'Content-Type':'image/png', 'Cache-Control':'no-store'}});
 } catch { return new Response('Preview unavailable', {status:503, headers:{'Cache-Control':'no-store'}}); }
};
