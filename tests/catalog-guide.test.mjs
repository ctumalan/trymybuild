import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const appSource = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const guideSource = appSource.slice(appSource.indexOf('let catalogGuideShown ='), appSource.indexOf('function render(preserveScroll'));

function fixture() {
  const classes = new Set(), listeners = new Set(), timers = new Map();
  let timerId = 0, blocked = false;
  const window = {
    scrollY:0, innerHeight:900,
    addEventListener:(type, callback) => listeners.add(callback),
    removeEventListener:(type, callback) => listeners.delete(callback),
    setTimeout:(callback, delay) => { timers.set(++timerId, {callback, delay}); return timerId; },
    clearTimeout:id => timers.delete(id)
  };
  const categories = {getBoundingClientRect:() => ({top:800-window.scrollY})};
  const quote = {getBoundingClientRect:() => ({bottom:760-window.scrollY})};
  const sticker = {closest:() => categories, classList:{add:name => classes.add(name), remove:name => classes.delete(name)}};
  const app = {querySelector:selector => selector === '.catalog-first-apps-sticker' ? sticker : quote};
  const mount = vm.runInNewContext(`${guideSource}\nmountCatalogGuide;`, {app, window, document:{querySelector:() => blocked}});
  return {
    mount, classes, listeners, timers,
    block:value => { blocked = value; },
    scroll:y => { window.scrollY = y; for (const callback of [...listeners]) callback(); }
  };
}

test('catalog sticker stays hidden on load and until scrolling past the quote', () => {
  const guide = fixture();
  guide.mount();
  assert.equal(guide.classes.has('is-revealed'), false);
  guide.scroll(0);
  guide.scroll(30);
  assert.equal(guide.classes.has('is-revealed'), false);
  assert.equal(guide.timers.size, 0);
  guide.scroll(120);
  assert.equal(guide.classes.has('is-revealed'), true);
});

test('catalog sticker fades after two seconds and does not replay on filtering', () => {
  const guide = fixture();
  guide.mount();
  guide.scroll(120);
  const timer = [...guide.timers.values()][0];
  assert.equal(timer.delay, 2000);
  timer.callback();
  assert.equal(guide.classes.has('is-revealed'), false);
  guide.mount();
  guide.scroll(150);
  assert.equal(guide.classes.has('is-revealed'), false);
  assert.equal(guide.listeners.size, 0);
  assert.equal(guide.timers.size, 0);
});

test('catalog guide waits while a dialog is open and cleans up between renders', () => {
  const guide = fixture();
  guide.mount();
  guide.mount();
  assert.equal(guide.listeners.size, 1);
  guide.block(true);
  guide.scroll(120);
  assert.equal(guide.classes.has('is-revealed'), false);
  guide.block(false);
  guide.scroll(100);
  assert.equal(guide.classes.has('is-revealed'), false);
  guide.scroll(130);
  assert.equal(guide.classes.has('is-revealed'), true);
  guide.mount();
  assert.equal(guide.timers.size, 0);
});
