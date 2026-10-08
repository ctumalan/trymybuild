import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

test('Most saved sorts by aggregate saves and keeps newest-first ties', () => {
  const source = app.slice(app.indexOf('function projectSaveCount'), app.indexOf('function discover'));
  const context = vm.createContext({ state: { sort: 'saved' }, experienceCount: () => 0, Number });
  vm.runInContext(source, context);
  const projects = [
    { slug: 'newer', saveCount: 2, recentOrder: 3 },
    { slug: 'popular', saveCount: 9, recentOrder: 1 },
    { slug: 'older-tie', saveCount: 2, recentOrder: 2 },
  ];
  projects.sort((a, b) => context.compareCatalogProjects(a, b));
  assert.deepEqual(projects.map(project => project.slug), ['popular', 'newer', 'older-tie']);
  assert.equal(context.catalogSortLabel(), 'Most saved first.');
  assert.doesNotMatch(app, /<option value="saved"[^>]*>Most saved<\/option>/);
});

test('public catalog returns aggregate save counts without exposing savers', () => {
  const source = readFileSync(new URL('../src/server/catalog-db.ts', import.meta.url), 'utf8');
  assert.match(source, /saved_projects\(count\)/);
  assert.match(source, /reviewEvidenceCounts/);
  assert.match(source, /communityReviews:reviews\.get\(row\.slug\)\?\.total/);
  const fn = source.slice(source.indexOf('export function toClientProject'), source.indexOf('// Every published listing'));
  const context = vm.createContext({});
  vm.runInContext(stripTypeScriptTypes(fn.replace('export function', 'function')), context);
  const project = context.toClientProject({ slug: 'popular', saved_projects: [{ count: 12 }], communityReviews: 3 }, () => ({}));
  assert.equal(project.saveCount, 12);
  assert.equal(project.communityReviewCount, 3);
  assert.equal('savedProjects' in project, false);
  assert.match(app,/communityReviewCount: p\.communityReviewCount \|\| 0/);
});
