import { readFile } from 'node:fs/promises';

// Explicit one-time release operation. Never runs during ordinary builds or previews.
if (process.env.VERCEL_ENV !== 'production' || process.env.TRYMYBUILD_MIGRATE_PUBLIC_APPS !== '1') {
  console.log('Public app link migration: not requested.');
  process.exit(0);
}
const manifest = JSON.parse(await readFile(new URL('./public-app-link-migration.json', import.meta.url), 'utf8'));
const base = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key || base === '[SENSITIVE]' || key === '[SENSITIVE]') throw Error('Database configuration unavailable to migration');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const endpoint = new URL('/rest/v1/projects', base);
endpoint.searchParams.set('slug', `in.(${manifest.map(p => p.slug).join(',')})`);
endpoint.searchParams.set('select', 'id,slug,external_url,is_studio,listing_status,lock_version,link_note,access_note');
const response = await fetch(endpoint, { headers });
if (!response.ok) throw Error(`Catalog inspection failed (${response.status})`);
const rows = await response.json();
if (rows.length !== 11 || new Set(rows.map(r => r.slug)).size !== 11) throw Error('Expected exactly eleven launch projects');
// Validate every target before modifying any records. Public files must already be deployed.
for (const item of manifest) {
  const row = rows.find(r => r.slug === item.slug);
  if (!row?.is_studio || row.listing_status !== 'published' || !Number.isInteger(row.lock_version)) throw Error(`Unexpected listing state: ${item.slug}`);
  if (row.external_url !== item.oldUrl && row.external_url !== item.url) throw Error(`Listing destination changed: ${item.slug}`);
  const check = await fetch(item.url, { redirect: 'manual' });
  if (check.status !== 200 || !(check.headers.get('content-type') || '').includes('text/html')) throw Error(`Public app unavailable: ${item.slug}`);
}
for (const item of manifest) {
  const row = rows.find(r => r.slug === item.slug);
  if (row.external_url === item.url && row.access_note === 'No sign-in needed to try it' && row.link_note === "Opens the creator's website") {
    console.log(`${item.slug}: already migrated`);
    continue;
  }
  const target = new URL('/rest/v1/projects', base);
  target.searchParams.set('id', `eq.${row.id}`);
  target.searchParams.set('lock_version', `eq.${row.lock_version}`);
  target.searchParams.set('external_url', `eq.${row.external_url}`);
  target.searchParams.set('is_studio', 'eq.true');
  target.searchParams.set('listing_status', 'eq.published');
  const update = await fetch(target, {
    method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ external_url: item.url, link_note: "Opens the creator's website", access_note: 'No sign-in needed to try it', lock_version: row.lock_version + 1 }),
  });
  if (!update.ok) throw Error(`Catalog update failed: ${item.slug} (${update.status})`);
  const changed = await update.json();
  if (changed.length !== 1) throw Error(`Concurrent update prevented migration: ${item.slug}`);
  console.log(`${item.slug}: public destination updated`);
}
console.log('All eleven launch apps now open on separate Vercel sites.');
