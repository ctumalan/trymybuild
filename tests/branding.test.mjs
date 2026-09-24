import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('discovery introduces both project discovery and creator participation', () => {
  assert.match(read('index.html'), /class="brand-promise">Share what you are building.<br>Find apps that make life easier.<\/span>/);
  assert.match(read('index.html'), /<title>TryMyBuild — Share your app. Discover apps to try.<\/title>/);
  const app = read('app.js');
  assert.match(app, /Share your app/);
  assert.match(app, /Explore apps/);
  assert.doesNotMatch(app, /Discover useful projects\.|Find your next useful discovery/);
  assert.doesNotMatch(app, /Made by independent creators to solve real-life problems/);
  assert.doesNotMatch(app, /Find solutions others have already made\./);
});

test('public wordmarks, accessible names, and page titles use TryMyBuild', () => {
  const html = read('index.html');
  assert.match(html, /<title>TryMyBuild/);
  assert.match(html, /aria-label="TryMyBuild catalog"/);
  assert.equal((html.match(/TryMy<span class="brand-name-works">Build<\/span>/g) || []).length, 2);
  for (const path of ['app.js', 'src/server/auth.ts', 'src/server/feedback-ui.ts',
    'src/pages/people/[slug].ts', 'src/pages/dashboard/security.ts',
    'src/pages/admin/index.ts', 'src/pages/auth/callback.ts',
    'src/pages/tell/[slug].ts', 'src/pages/api/experiences.ts',
    'projects/afterschool-together/index.html']) {
    assert.doesNotMatch(read(path), /CreatorWorks|Creator Works|Creator<span/, path);
  }
});

test('rebranding preserves studio identity and saved browser data keys', () => {
  const app = read('app.js');
  assert.match(app, /slug: "creatorworks-studio", name: "TryMyBuild Studio", initials: "TMB"/);
  for (const key of ['creatorworks-saved', 'creatorworks-interests', 'creatorworks-community-posts']) {
    assert.ok(app.includes(key), key);
  }
  assert.match(read('src/server/catalog-db.ts'), /slug: 'creatorworks-studio'/);
});

test('stored platform notes display the new brand without changing URLs or independent creator copy', () => {
  const source = read('src/server/catalog-db.ts');
  const fn = source.slice(source.indexOf('export function toClientProject'), source.indexOf('// Every published listing'));
  const js = stripTypeScriptTypes(fn.replace('export function', 'function'));
  const context = vm.createContext({});
  vm.runInContext(js, context);
  const row = { slug: 'test', is_studio: true, note: 'Made by CreatorWorks.',
    link_note: 'Opens on Creator Works', access_note: 'Creator-Works',
    external_url: 'https://creatorworks.vercel.app/projects/test' };
  const result = context.toClientProject(row, () => ({}));
  assert.equal(result.note, 'Made by TryMyBuild.');
  assert.equal(result.linkNote, 'Opens on TryMyBuild');
  assert.equal(result.accessNote, 'TryMyBuild');
  assert.equal(result.url, row.external_url);
  assert.equal(row.note, 'Made by CreatorWorks.');
  assert.equal(context.toClientProject({ ...row, is_studio: false }, () => ({})).note, row.note);
});
