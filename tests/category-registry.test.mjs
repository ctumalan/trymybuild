import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const registrySource = source.slice(source.indexOf('const categoryCatalog ='), source.indexOf('const state ='));

function registry(projects = []) {
  const context = vm.createContext({ projects });
  vm.runInContext(registrySource, context);
  return {
    normalize: value => vm.runInContext(`normalizeCategory(${JSON.stringify(value)})`, context),
    published: () => JSON.parse(vm.runInContext('JSON.stringify(publishedCategories())', context)),
    catalog: JSON.parse(vm.runInContext('JSON.stringify(categoryCatalog)', context)),
  };
}

test('category catalog covers current market groups and normalizes aliases', () => {
  const categories = registry();
  assert.ok(categories.catalog.length >= 30);
  assert.equal(categories.normalize(' finance '), 'Money');
  assert.equal(categories.normalize('AI'), 'AI & automation');
  assert.equal(categories.normalize('music'), 'Music & audio');
  assert.equal(categories.normalize('ADMIN'), '');
  assert.equal(categories.normalize('  climate   technology  '), 'Climate Technology');
});

test('homepage categories come only from published catalog projects and deduplicate counts', () => {
  const categories = registry([
    { category: 'Technology' },
    { category: 'technology' },
    { category: 'music' },
    { category: 'Climate technology' },
  ]).published();
  assert.deepEqual(categories.map(category => [category.name, category.count]), [
    ['Technology', 2],
    ['Music & audio', 1],
    ['Climate Technology', 1],
  ]);
});

test('listing UI exposes Other search without adding drafts to homepage filters', () => {
  assert.match(source, />Other…<\/option>/);
  assert.match(source, /data-listing-category-custom/);
  assert.match(source, /creatorworks-category-catalog/);
  assert.match(source, /Drafts never create public filters/);
  assert.match(source, /const categories=publishedCategories\(\)/);
});
