import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SLUGS = ['afterschooltogether','stackscout','gamegrid','lessonlab','cartcompare','pocketbalance','dayframe','mealmap','homerhythm','packlight','briefbuilder'];

test('005 is additive/idempotent and fills all eleven in-house listings without deleting rows', () => {
  const sql = readFileSync(new URL('../database/005_listing_content.sql', import.meta.url), 'utf8');
  // Additive column adds must be guarded so re-running is safe.
  for (const col of ['category','summary','headline','help_text','first_try','preview_path','benefits','listing_status'])
    assert.match(sql, new RegExp(`add column if not exists ${col}\\b`), `column ${col} added idempotently`);
  assert.match(sql, /listing_status in \('draft','in_review','published','unpublished'\)/, 'lifecycle constraint present');
  // Eleven UPDATEs (never INSERT/DELETE of catalog rows) — one per approved slug, all published & verified studio.
  assert.equal((sql.match(/^update public\.projects set/gm) || []).length, 11);
  assert.doesNotMatch(sql, /delete from public\.projects/i, 'no catalog rows are deleted');
  for (const slug of SLUGS) assert.match(sql, new RegExp(`where slug='${slug}'`), `seeds ${slug}`);
  assert.match(sql, /is_studio=true/);
  assert.match(sql, /ownership_status='verified'/);
});

test('005 rerun cannot overwrite later edits or republish unpublished rows, and enables idempotent create', () => {
  const sql = readFileSync(new URL('../database/005_listing_content.sql', import.meta.url), 'utf8');
  // Every seed UPDATE is guarded so a rerun only fills a still-empty row (never overwrites edits,
  // never flips an intentionally unpublished project back to published).
  const updates = sql.match(/^update public\.projects set[\s\S]*?where slug='[a-z]+'[^;]*;/gm) || [];
  assert.equal(updates.length, 11);
  for (const u of updates) assert.match(u, /coalesce\(headline,''\)=''/, 'seed UPDATE is rerun-guarded');
  // Columns + partial unique index that back idempotent creation and optimistic concurrency.
  assert.match(sql, /add column if not exists client_token text/);
  assert.match(sql, /add column if not exists lock_version integer not null default 0/);
  assert.match(sql, /create unique index if not exists projects_owner_token_idx on public\.projects\(owner_user_id, client_token\)/);
});

test('006 review function is bound to the reviewed revision (status AND lock_version) and bumps it', () => {
  const sql = readFileSync(new URL('../database/006_project_publication.sql', import.meta.url), 'utf8');
  assert.match(sql, /cw_review_project\(p_actor uuid, p_id uuid, p_previous text, p_expected_version integer/, 'accepts expected revision');
  assert.match(sql, /item\.lock_version is distinct from p_expected_version/, 'rejects a changed revision');
  assert.match(sql, /where id = p_id and listing_status = p_previous and lock_version = p_expected_version/, 'guarded write');
  assert.match(sql, /lock_version = item\.lock_version \+ 1/, 'bumps the revision');
  assert.match(sql, /grant execute on function public\.cw_review_project\(uuid,uuid,text,integer,text,text\) to service_role/);
});

test('006 creates a PRIVATE preview bucket and an atomic project-review function with audit trail', () => {
  const sql = readFileSync(new URL('../database/006_project_publication.sql', import.meta.url), 'utf8');
  assert.match(sql, /storage\.buckets/, 'declares a storage bucket');
  assert.match(sql, /'project-previews'/, 'the project-previews bucket');
  assert.match(sql, /public,\s*file_size_limit[\s\S]*?false/, 'bucket is not public');
  assert.match(sql, /create or replace function public\.cw_review_project/, 'review function present');
  assert.match(sql, /is distinct from p_previous or item\.lock_version is distinct from p_expected_version/, 'optimistic concurrency guards double-publish and stale approval');
  assert.match(sql, /project_review_history/, 'decisions are recorded');
  assert.match(sql, /grant execute on function public\.cw_review_project.*to service_role/s);
});

test('030 records preview consent provenance and limits rollback history to three versions',()=>{
  const sql=readFileSync(new URL('../database/030_owner_controlled_previews.sql',import.meta.url),'utf8');
  for(const column of ['preview_source','preview_source_url','preview_captured_at','preview_history'])assert.match(sql,new RegExp(`add column if not exists ${column}\\b`));
  assert.match(sql,/preview_source in \('uploaded','captured','studio'\)/);
  assert.match(sql,/jsonb_array_length\(preview_history\) <= 3/);
  assert.match(sql,/where is_studio=true/);
});
