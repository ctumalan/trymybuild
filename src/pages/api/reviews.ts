import type { APIRoute } from 'astro';
import { json } from '../../server/auth';
import { databaseReady } from '../../server/database';
import { validSlug } from '../../server/feedback-policy.mjs';
import { reviewEvidence } from '../../server/review-evidence';

export const GET: APIRoute = async context => {
  const slug = context.url.searchParams.get('project');
  if (!validSlug(slug)) return json({ error: 'Project not found.' }, 404);
  if (!databaseReady()) return json({ connected: false, total: 0, publicCount: 0, reviews: [] }, 503);
  try {
    return json({ connected: true, ...(await reviewEvidence(slug!)) });
  } catch {
    return json({ error: 'Review evidence is temporarily unavailable.' }, 503);
  }
};
