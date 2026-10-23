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
    matches: (left, right) => vm.runInContext(`categoriesMatch(${JSON.stringify(left)}, ${JSON.stringify(right)})`, context),
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

test('every displayed category includes all of its apps despite casing and aliases', () => {
  const projects = [
    { category: 'Food & Home' },
    { category: 'Food & home' },
    { category: 'food' },
    { category: 'TECHNOLOGY' },
    { category: 'Artificial Intelligence' },
    { category: 'music' },
    { category: 'Sports & Teams' },
  ];
  const categories = registry(projects);
  for (const project of projects) {
    const displayed = categories.normalize(project.category);
    assert.equal(categories.matches(project.category, displayed), true, `${project.category} must remain visible under ${displayed}`);
  }
  assert.equal(categories.matches('Food & Home', 'Food & home'), true);
  assert.equal(categories.matches('Artificial Intelligence', 'AI & automation'), true);
  assert.equal(categories.matches('Technology', 'Shopping'), false);
});

test('listing UI exposes Other search while homepage navigation uses published categories', () => {
  assert.match(source, />Other…<\/option>/);
  assert.match(source, /data-listing-category-custom/);
  assert.match(source, /creatorworks-category-catalog/);
  assert.match(source, /const categories=publishedCategories\(\)/);
});
