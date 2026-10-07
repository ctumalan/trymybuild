import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { saveDraft, submit, unpublish, replaceImage, restoreImage, isMaterialChange } from '../src/server/listing-service.mjs';

// In-memory store mirroring the Supabase adapter's contract: unique (owner, client_token), unique slug,
// and optimistic updates guarded on BOTH listing_status and lock_version.
function makeStore(opts = {}) {
  const rows = new Map();
  const storage = new Map();
  let idc = 1;
  const find = pred => [...rows.values()].find(pred);
  const clone = r => ({ ...r });
  return {
    rows, storage,
    async findOwnedById(owner, id) { const r = find(r => r.id === id && r.owner_user_id === owner); return r ? clone(r) : null; },
    async findOwnedByToken(owner, token) { const r = find(r => r.owner_user_id === owner && r.client_token === token); return r ? clone(r) : null; },
    async findOwnedBySlug(owner, slug) { const r = find(r => r.owner_user_id === owner && r.slug === slug); return r ? clone(r) : null; },
    async insertProject(fields) {
      if (fields.client_token && find(r => r.owner_user_id === fields.owner_user_id && r.client_token === fields.client_token)) throw { code: 'DUP_TOKEN' };
      if (find(r => r.slug === fields.slug)) throw { code: 'DUP_SLUG' };
      const id = 'p' + (idc++); const row = { id, lock_version: 0, ...fields }; rows.set(id, row); return clone(row);
    },
    async updateOwnedGuarded(id, owner, expected, patch) {
      if (opts.throwUpdate) throw new Error('db error');   // definite/uncertain failure (adapter throws)
      if (opts.failUpdate) return null;                    // clean no-op (guard did not match)
      const r = find(r => r.id === id && r.owner_user_id === owner);
      if (!r) return null;
      if (r.listing_status !== expected.status || r.lock_version !== expected.lockVersion) return null;
      Object.assign(r, patch, { lock_version: r.lock_version + 1 });
      return clone(r);
    },
    async putImage(key, bytes) { if (opts.failPut) throw new Error('put failed'); storage.set(key, bytes); },
    async deleteImage(key) { storage.delete(key); },
  };
}
const draft = (title, over = {}) => ({ title, external_url: 'https://x.app/', category: 'Technology', stage: 'Ready for a first try', headline: 'Does a genuinely useful thing', help_text: 'Helps you organize your day', first_try: 'Try this useful feature first', summary: 'sum', ...over });
const deps = (() => { let n = 0; return { slugify: s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'project', randomSuffix: () => 's' + (n++) }; })();
const reencode = async () => ({ bytes: Buffer.from('reencoded'), contentType: 'image/jpeg' });

test('launch publishing is immediate, idempotent and does not grant verified ownership',async()=>{
 const store=makeStore();
 const created=await saveDraft(store,{ownerId:'A',clientToken:'launch',input:draft('Launch',{sharing_preference:'public'})},deps);
 store.rows.get(created.project.id).preview_path='previews/A/launch.jpg';
 const result=await submit(store,{ownerId:'A',id:created.project.id});
 assert.equal(result.status,200);
 assert.equal(result.project.listing_status,'published');
 assert.equal(result.project.visibility,'public');
 assert.ok(result.project.published_at);
 assert.equal(result.project.ownership_status,'unverified');
 const again=await submit(store,{ownerId:'A',id:created.project.id});
 assert.equal(again.idempotent,true);
 assert.equal(again.project.lock_version,result.project.lock_version);
});
test('private drafts and incomplete projects cannot publish; queued owners can publish',async()=>{
 const store=makeStore();
 const created=await saveDraft(store,{ownerId:'A',clientToken:'private',input:draft('Private',{sharing_preference:'private'})},deps);
 assert.equal((await submit(store,{ownerId:'A',id:created.project.id})).status,400);
 const row=store.rows.get(created.project.id);row.sharing_preference='public';row.headline='';
 assert.equal((await submit(store,{ownerId:'A',id:row.id})).status,400);
 Object.assign(row,draft('Ready'),{listing_status:'in_review',preview_path:'previews/A/ready.jpg'});
 assert.equal((await submit(store,{ownerId:'A',id:row.id})).project.listing_status,'published');
});

test('two independent drafts under one account do not overwrite each other', async () => {
  const store = makeStore();
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const b = await saveDraft(store, { ownerId: 'A', clientToken: 't2', input: draft('Two') }, deps);
  assert.equal(a.created, true); assert.equal(b.created, true);
  assert.notEqual(a.project.id, b.project.id);
  assert.notEqual(a.project.slug, b.project.slug);
  assert.equal(store.rows.size, 2);
});

test('duplicate creation retries are idempotent (no duplicate row)', async () => {
  const store = makeStore();
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const b = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  assert.equal(b.idempotent, true);
  assert.equal(a.project.id, b.project.id);
  assert.equal(store.rows.size, 1);
});

test('creating without an id or clientToken is refused (no "reuse latest draft")', async () => {
  const store = makeStore();
  await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const res = await saveDraft(store, { ownerId: 'A', input: draft('Two') }, deps);
  assert.equal(res.status, 400);
  assert.equal(store.rows.size, 1, 'no second project was created and the first was untouched');
});

test('cross-account access is denied for edit, submit, unpublish, and image replace', async () => {
  const store = makeStore();
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  assert.equal((await saveDraft(store, { ownerId: 'B', id: a.project.id, input: draft('Hacked') }, deps)).status, 404);
  assert.equal((await submit(store, { ownerId: 'B', id: a.project.id })).status, 404);
  assert.equal((await unpublish(store, { ownerId: 'B', id: a.project.id })).status, 404);
  assert.equal((await replaceImage(store, { ownerId: 'B', slug: a.project.slug, bytes: Buffer.from('x') }, { reencode })).status, 404);
  // The row is unchanged and still owned by A.
  assert.equal(store.rows.get(a.project.id).owner_user_id, 'A');
  assert.equal(store.rows.get(a.project.id).title, 'One');
});

test('editing an approved listing (text) sends it back to a nonpublic draft for review', async () => {
  const store = makeStore();
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const row = store.rows.get(a.project.id);
  Object.assign(row, { listing_status: 'published', visibility: 'public', lock_version: 4 });
  // Non-material change (same fields) keeps it published.
  const same = await saveDraft(store, { ownerId: 'A', id: row.id, input: draft('One') }, deps);
  assert.equal(same.reviewReset, false);
  assert.equal(store.rows.get(row.id).listing_status, 'published');
  // Material change resets to draft.
  const edited = await saveDraft(store, { ownerId: 'A', id: row.id, input: draft('One', { headline: 'A new heading' }) }, deps);
  assert.equal(edited.reviewReset, true);
  assert.equal(edited.project.listing_status, 'draft');
  assert.equal(edited.project.visibility, 'draft');
});

test('a summary-only edit to a published listing resets it for review', async () => {
  const store = makeStore();
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const row = store.rows.get(a.project.id);
  Object.assign(row, { listing_status: 'published', visibility: 'public', lock_version: 3 });
  const res = await saveDraft(store, { ownerId: 'A', id: row.id, input: draft('One', { summary: 'A different summary' }) }, deps);
  assert.equal(res.reviewReset, true);
  assert.equal(res.project.listing_status, 'draft');
});

test('a stage-only edit to a published listing resets it for review', async () => {
  const store = makeStore();
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const row = store.rows.get(a.project.id);
  Object.assign(row, { listing_status: 'published', visibility: 'public', lock_version: 3 });
  const res = await saveDraft(store, { ownerId: 'A', id: row.id, input: draft('One', { stage: 'Finished and launched' }) }, deps);
  assert.equal(res.reviewReset, true);
  assert.equal(res.project.listing_status, 'draft');
});

test('admin approval is bound to the reviewed revision: a stale approval after withdraw→edit→resubmit is rejected', async () => {
  // Models cw_review_project's guard (status AND lock_version) via the same status+version guarded update.
  const store = makeStore();
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const row = store.rows.get(a.project.id);
  Object.assign(row, { preview_path: 'previews/A/p.jpg' }); // make it publishable
  await submit(store, { ownerId: 'A', id: row.id });        // → in_review (rev shown to admin)
  const reviewedStatus = store.rows.get(row.id).listing_status;
  const reviewedVersion = store.rows.get(row.id).lock_version;
  // Creator withdraws, edits materially, resubmits — advancing the revision past what the admin saw.
  await unpublish(store, { ownerId: 'A', id: row.id });     // in_review → draft
  await saveDraft(store, { ownerId: 'A', id: row.id, input: draft('One', { headline: 'A newly changed project heading' }) }, deps);
  await submit(store, { ownerId: 'A', id: row.id });        // → in_review again, higher lock_version
  // Approval from the STALE review screen (old status+version) must be rejected.
  const stale = await store.updateOwnedGuarded(row.id, 'A', { status: reviewedStatus, lockVersion: reviewedVersion }, { listing_status: 'published', visibility: 'public' });
  assert.equal(stale, null, 'stale approval rejected');
  assert.equal(store.rows.get(row.id).listing_status, 'published', 'owner republished without waiting for review');
  // A fresh approval bound to the current revision succeeds.
  const cur = store.rows.get(row.id);
  const fresh = await store.updateOwnedGuarded(row.id, 'A', { status: cur.listing_status, lockVersion: cur.lock_version }, { listing_status: 'published', visibility: 'public' });
  assert.ok(fresh && fresh.listing_status === 'published');
});

test('replacing the image of an approved listing re-encodes, records provenance, keeps rollback history, and resets review', async () => {
  const store = makeStore();
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const row = store.rows.get(a.project.id);
  const oldKey = `previews/A/${row.id}/old.jpg`;
  store.storage.set(oldKey, Buffer.from('old'));
  Object.assign(row, { listing_status: 'published', visibility: 'public', preview_path: oldKey, lock_version: 2 });
  Object.assign(row, { preview_source: 'uploaded', preview_history: [] });
  const res = await replaceImage(store, { ownerId: 'A', slug: row.slug, bytes: Buffer.from('rawupload'), source: 'captured', sourceUrl: 'https://new.example/', capturedAt: '2026-10-06T12:00:00.000Z' },
    { reencode, keyFactory: (o, p) => `previews/${o}/${p}/new.jpg` });
  assert.equal(res.status, 200);
  assert.equal(res.reviewReset, true);
  assert.equal(res.project.listing_status, 'draft');
  assert.ok(store.storage.has(`previews/A/${row.id}/new.jpg`), 'new versioned object stored');
  assert.ok(store.storage.has(oldKey), 'old object retained for rollback');
  assert.equal(res.project.preview_source, 'captured');
  assert.equal(res.project.preview_source_url, 'https://new.example/');
  assert.equal(res.project.preview_history[0].path, oldKey);
  assert.equal(store.storage.get(`previews/A/${row.id}/new.jpg`).toString(), 'reencoded', 'stored bytes are the re-encoded ones');
});

test('preview history keeps three versions, removes only the evicted object, and restores an owned version', async () => {
  const store = makeStore();
  const created = await saveDraft(store, { ownerId: 'A', clientToken: 'history', input: draft('History') }, deps);
  const row = store.rows.get(created.project.id);
  const keys = ['one','two','three','four'].map(name=>`previews/A/${row.id}/${name}.jpg`);
  Object.assign(row,{preview_path:keys[0],preview_source:'uploaded',preview_history:[]});store.storage.set(keys[0],Buffer.from('one'));
  for(let i=1;i<keys.length;i++){
    const result=await replaceImage(store,{ownerId:'A',slug:row.slug,bytes:Buffer.from(keys[i]),source:'captured',sourceUrl:`https://${i}.example/`},{reencode,keyFactory:()=>keys[i]});
    assert.equal(result.status,200);
  }
  const current=store.rows.get(row.id);
  assert.equal(current.preview_history.length,3);
  assert.ok(store.storage.has(keys[0]),'oldest remains while it is still one of three rollback versions');
  const fifth='previews/A/'+row.id+'/five.jpg';
  await replaceImage(store,{ownerId:'A',slug:row.slug,bytes:Buffer.from('five'),source:'uploaded'},{reencode,keyFactory:()=>fifth});
  assert.ok(!store.storage.has(keys[0]),'only the version evicted from history is removed');
  const beforeRestore=store.rows.get(row.id),restorePath=beforeRestore.preview_history[1].path;
  const restored=await restoreImage(store,{ownerId:'A',slug:row.slug,historyId:restorePath});
  assert.equal(restored.status,200);assert.equal(restored.project.preview_path,restorePath);
  assert.ok(restored.project.preview_history.some(item=>item.path===fifth),'the replaced current image becomes rollback history');
});

test('concurrent review/edit: a stale guarded update is rejected instead of clobbering', async () => {
  const store = makeStore();
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const row = store.rows.get(a.project.id); // draft, lock 0
  // A concurrent op advances the row (e.g. founder approval / submit): draft/0 → in_review/1.
  const advanced = await store.updateOwnedGuarded(row.id, 'A', { status: 'draft', lockVersion: 0 }, { listing_status: 'in_review' });
  assert.ok(advanced && advanced.listing_status === 'in_review');
  // A stale write that still expects {draft, lock 0} must fail rather than clobber the newer state.
  const stale = await store.updateOwnedGuarded(row.id, 'A', { status: 'draft', lockVersion: 0 }, { title: 'stale' });
  assert.equal(stale, null);
  assert.equal(store.rows.get(row.id).listing_status, 'in_review');
  assert.notEqual(store.rows.get(row.id).title, 'stale');
});

test('failed image storage preserves the previous image and does not change the DB', async () => {
  const store = makeStore({ failPut: true });
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const row = store.rows.get(a.project.id);
  Object.assign(row, { listing_status: 'published', preview_path: 'previews/A/keep.jpg' });
  store.storage.set('previews/A/keep.jpg', Buffer.from('keep'));
  const res = await replaceImage(store, { ownerId: 'A', slug: row.slug, bytes: Buffer.from('x') }, { reencode });
  assert.equal(res.status, 502);
  assert.equal(store.rows.get(row.id).preview_path, 'previews/A/keep.jpg', 'DB reference unchanged');
  assert.ok(store.storage.has('previews/A/keep.jpg'), 'previous image preserved');
});

test('failed DB update after upload rolls back the new object and keeps the current image', async () => {
  const store = makeStore({ failUpdate: true });
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const row = store.rows.get(a.project.id);
  const oldKey = 'previews/A/keep.jpg';
  Object.assign(row, { listing_status: 'published', preview_path: oldKey });
  store.storage.set(oldKey, Buffer.from('keep'));
  const res = await replaceImage(store, { ownerId: 'A', slug: row.slug, bytes: Buffer.from('x') },
    { reencode, keyFactory: () => 'previews/A/new.jpg' });
  assert.equal(res.status, 409);
  assert.ok(!store.storage.has('previews/A/new.jpg'), 'new object rolled back after failed DB update');
  assert.ok(store.storage.has(oldKey), 'current image preserved');
});

test('an uncertain DB failure after upload does NOT delete the new object (may be the committed ref)', async () => {
  const store = makeStore({ throwUpdate: true });
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const row = store.rows.get(a.project.id);
  const oldKey = 'previews/A/keep.jpg';
  Object.assign(row, { listing_status: 'published', preview_path: oldKey });
  store.storage.set(oldKey, Buffer.from('keep'));
  const res = await replaceImage(store, { ownerId: 'A', slug: row.slug, bytes: Buffer.from('x') },
    { reencode, keyFactory: () => 'previews/A/new.jpg' });
  assert.equal(res.status, 503, 'uncertain outcome reported, not treated as a clean conflict');
  assert.ok(store.storage.has('previews/A/new.jpg'), 'new object preserved — it may be the committed reference');
  assert.ok(store.storage.has(oldKey), 'previous object also preserved');
});

test('unpublish removes a project from the published set (no fallback reappearance)', async () => {
  const store = makeStore();
  const a = await saveDraft(store, { ownerId: 'A', clientToken: 't1', input: draft('One') }, deps);
  const row = store.rows.get(a.project.id);
  Object.assign(row, { listing_status: 'published', visibility: 'public' });
  const res = await unpublish(store, { ownerId: 'A', id: row.id });
  assert.equal(res.project.listing_status, 'unpublished');
  const publishedOnly = [...store.rows.values()].filter(r => r.listing_status === 'published');
  assert.equal(publishedOnly.length, 0, 'unpublished project is not in the published set');
});

test('material-change detection covers text fields only', () => {
  const base = { title: 'T', external_url: 'https://x', category: 'C', headline: 'H', help_text: 'h', first_try: 'f' };
  assert.equal(isMaterialChange(base, { ...base }), false);
  assert.equal(isMaterialChange(base, { ...base, headline: 'H2' }), true);
  assert.equal(isMaterialChange(base, { ...base, external_url: 'https://y' }), true);
});

// Client (app.js) must NOT fall back to the built-in catalog on the server; it shows a retryable state.
test('app.js drops the built-in catalog on the server and shows a retryable unavailable state', () => {
  const src = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(src, /if \(window\.CW_SERVER\) projects\.length = 0;/, 'built-in list cleared on server');
  assert.match(src, /window\.CW_SERVER && catalogState !== 'ready'/, 'discover gates on catalog readiness');
  assert.doesNotMatch(src, /data\.projects\.length\) \{\s*hydrateCatalog/, 'no length-based fallback keeping built-ins');
  // The unavailable panel offers retry and does not render the built-in projects.
  const start = src.indexOf('function catalogStatusPanel()');
  const body = src.slice(start, src.indexOf('function discover('));
  const ctx = vm.createContext({ catalogState: 'error', window: { CW_SERVER: true } });
  vm.runInContext(body + '\n globalThis.__panel = catalogStatusPanel();', ctx);
  assert.match(ctx.__panel, /temporarily unavailable/i);
  assert.match(ctx.__panel, /data-catalog-retry/);
});
