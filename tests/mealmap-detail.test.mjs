import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

test('All eleven projects use the approved presentation with their own action targets', () => {
  const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  const firstListener = Math.min(...["document.addEventListener('input'", "document.addEventListener('submit'"].map(marker=>source.indexOf(marker)).filter(index=>index>0));
  const functions = source.slice(source.indexOf('const projectPresentation ='), firstListener);
  const context = vm.createContext({ window:{addEventListener(){}},document:{addEventListener(){}},detailProjectHistory:[],videoPlayer: () => '', similarSection: () => '', projectDestination: url => /^https?:\/\//i.test(url) ? 'Opens external website' : 'Opens here on TryMyBuild', state: { saved: new Set(), communityPosts: [], session: null }, esc: value => String(value ?? ''), avatar: () => '<span class="person-avatar"></span>', creatorLink: () => 'TryMyBuild Studio', creatorFor: () => ({ slug: 'creatorworks-studio', name: 'TryMyBuild Studio' }) });
  context.URL=URL;
  context.location={origin:'https://trymybuild.com'};
  vm.runInContext(source.slice(source.indexOf('function safeProjectUrl'),source.indexOf('function ',source.indexOf('function safeProjectUrl')+9)),context);
  vm.runInContext(functions, context);
  const product = { slug: 'mealmap', url: 'https://meal-map-cw.tumalanct.chatgpt.site', preview: 'assets/previews/mealmap.png', note: 'New listing', benefits: [] };
  const markup = context.detailDrawer(product);
  assert.doesNotMatch(markup, /What does it do\?/);
  assert.match(markup, /How it helps/);
  assert.match(markup, /One thing to try first/);
  assert.doesNotMatch(markup, /Illustrative plan|mealmap-screenshot|mealmap-lead/);
  assert.match(markup, /data-project-comment="mealmap"/);
  assert.match(markup, /data-project-comment-field/);
  assert.match(markup, /href="\/tell\/mealmap" data-guided-open="mealmap">Give feedback/);
  assert.match(markup, /<summary>Leave a public comment<\/summary>/);
  assert.match(markup, /data-save="mealmap"/);
  assert.ok(markup.includes(product.url));
  const slugs = vm.runInContext('Object.keys(projectPresentation)', context);
  assert.equal(slugs.length, 11);
  for (const slug of slugs) {
    const explanation = vm.runInContext(`projectPresentation[${JSON.stringify(slug)}][2]`, context);
    const html = context.detailDrawer({ ...product, slug, name: slug, preview: `assets/previews/${slug}.png`, url: `https://example.com/${slug}` });
    assert.ok(html.includes(`data-project-comment="${slug}"`));
    assert.ok(html.includes(`>${explanation}</h2>`));
    assert.doesNotMatch(html, /What does it do\?/);
    assert.ok(html.includes(`data-save="${slug}"`));
    assert.ok(html.includes(`assets/previews/${slug}.png`));
    assert.ok(html.includes(`https://example.com/${slug}`));
    assert.ok(html.indexOf('recipient-art') < html.indexOf('Try this app ↗'));
    assert.ok(html.indexOf('detail-description-notes') < html.indexOf('recipient-art'));
  }
});
