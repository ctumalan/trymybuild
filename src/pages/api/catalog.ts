import type { APIRoute } from 'astro';
import { json } from '../../server/auth';
import { databaseReady } from '../../server/database';
import { listPublished } from '../../server/catalog-db';

// Public, authoritative catalog feed. no-store so a newly approved listing is discoverable immediately,
// without a rebuild or redeploy. Only published listings are ever returned here.
export const GET: APIRoute = async () => {
  // Local visual review can use the public feed without private database credentials.
  // This branch is excluded from production behavior and never supplies account access.
  if (import.meta.env.DEV && !databaseReady()) {
    try {
      const response = await fetch('https://trymybuild.com/api/catalog', { signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error('Public catalog unavailable');
      const catalog = await response.json();
      return json({ ...catalog, previewSource: 'public-production-catalog' });
    } catch {
      return json({ connected: false, projects: [], error: 'The public catalog could not be loaded for this local preview.' }, 503);
    }
  }
  if (!databaseReady()) return json({ connected: false, projects: [] });
  try {
    return json({ connected: true, projects: await listPublished() });
  } catch {
    return json({ connected: false, projects: [], error: 'The catalog is temporarily unavailable.' }, 503);
  }
};
