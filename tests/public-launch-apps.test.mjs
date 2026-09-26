import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';

test('all eleven in-house catalog destinations are separate Vercel apps', async () => {
  const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  const projects = vm.runInNewContext(source.match(/^const projects = (\[[\s\S]*?\n\]);/)[1]);
  const migration = JSON.parse(await readFile(new URL('../scripts/public-app-link-migration.json', import.meta.url), 'utf8'));
  assert.equal(migration.length, 11);
  for (const item of migration) {
    const project = projects.find(p => p.slug === item.slug);
    assert.equal(project.url, item.url);
    assert.equal(project.accessNote, 'No sign-in needed to try it');
    const url = new URL(project.url);
    assert.equal(url.protocol, 'https:');
    assert.match(url.hostname, /\.vercel\.app$/);
    assert.notEqual(url.hostname, 'trymybuild.com');
    const localPath = item.oldUrl.replace('https://trymybuild.com/', '../');
    const html = await readFile(new URL(localPath, import.meta.url), 'utf8');
    assert.match(html, /<title>/);
    assert.doesNotMatch(html, /https:\/\/[^\s"']*chatgpt\.site/);
    for (const asset of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)) {
      assert.ok((await stat(new URL(`${localPath.replace('index.html', '')}${asset[1]}`, import.meta.url))).isFile());
    }
  }
});

test('database migration requires an explicit production release flag and concurrency guards', async () => {
  const script = await readFile(new URL('../scripts/migrate-public-app-links.mjs', import.meta.url), 'utf8');
  assert.match(script, /VERCEL_ENV !== 'production'/);
  assert.match(script, /TRYMYBUILD_MIGRATE_PUBLIC_APPS !== '1'/);
  for (const guard of ['lock_version', 'external_url', 'is_studio', 'listing_status']) {
    assert.ok(script.includes(`target.searchParams.set('${guard}'`));
  }
});
