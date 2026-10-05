import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('editorial cards leave the catalog and the article remains available in the footer',()=>{
 const app=read('app.js'),html=read('index.html');
 assert.doesNotMatch(app,/makerArticleCard|makerTipCard|Maker’s notebook|AI prompt tip of the day/);
 assert.match(html,/<a href="\/article">Articles<\/a>/);
});

test('homepage conversation enters from opposite sides with readable founder copy',()=>{
 const app=read('app.js'),css=read('future-design.css');
 assert.match(app,/>yourURL\.com<\/div>/);
 assert.match(css,/\.discovery-hero-action>\.founder-banner[\s\S]*?margin:52px auto 0 0/);
 assert.match(css,/\.discovery-hero-action>\.sample-conversation[\s\S]*?margin:28px 0 0 auto/);
 assert.match(css,/\.founder-banner \.founder-speech>p[\s\S]*?font-size:\.92rem/);
});

test('welcome illustrations are enlarged for desktop and mobile',()=>{
 const svg=read('assets/illustrations/feedback-loop.svg'),css=read('future-design.css');
 assert.match(svg,/step-one" transform="translate\(-24 -9\) scale\(1\.2\)"/);
 assert.match(svg,/step-two" transform="translate\(-59 -9\) scale\(1\.2\)"/);
 assert.match(svg,/translate\(474 19\) scale\(\.206\)/);
 assert.match(css,/\.welcome-animation-dialog img \{ width:112%/);
 assert.match(css,/\.welcome-animation-dialog img \{ width:120%/);
});
