import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('editorial cards leave the catalog and the article remains available in the footer',()=>{
 const app=read('app.js'),html=read('index.html');
 assert.doesNotMatch(app,/makerArticleCard|makerTipCard|Maker’s notebook|AI prompt tip of the day/);
 assert.match(html,/<a href="\/article">Articles<\/a>/);
});

test('homepage pairs its title with a compact founder trust note',()=>{
 const app=read('app.js'),css=read('future-design.css');
 assert.match(app,/>yourURL\.com<\/div>/);
 assert.match(app,/class="discovery-title-row"[\s\S]*?class="discovery-title-copy"[\s\S]*?founderConversation\(\)/);
 assert.match(app,/class="founder-identity"[\s\S]*?<strong>Christian Tumalan<\/strong>[\s\S]*?data-founder-about>Founder/);
 assert.match(app,/class="founder-quote">“I built my apps with AI—but AI can’t tell me what confuses a <em>real person\.<\/em> I read every message\.”<\/p>/);
 assert.doesNotMatch(app,/founder-quote-(?:collapsed|expanded|ellipsis|more|less)/);
 assert.match(css,/\.discovery-title-row[\s\S]*?grid-template-columns:minmax\(0,1\.2fr\) minmax\(390px,\.8fr\)/);
 assert.match(css,/\.discovery-title-row:not\(:has\(\.founder-banner:not\(\[hidden\]\)\)\)[\s\S]*?grid-template-columns:minmax\(0,1fr\); text-align:center/);
 assert.match(css,/\.discovery-title-row:not\(:has\(\.founder-banner:not\(\[hidden\]\)\)\) \.discovery-instrument-copy \{ margin-inline:auto/);
 assert.match(css,/\.discovery-hero-action>\.sample-conversation[\s\S]*?width:min\(640px,100%\)[\s\S]*?margin:28px auto 0/);
 assert.match(css,/\.discovery-hero-action>\.sample-conversation[\s\S]*?background:transparent/);
 assert.match(css,/\.discovery-title-row \.founder-quote \{ margin:0; font-size:\.86rem/);
});

test('welcome illustrations are enlarged for desktop and mobile',()=>{
 const svg=read('assets/illustrations/feedback-loop.svg'),css=read('future-design.css');
 assert.match(svg,/step-one" transform="translate\(-24 -9\) scale\(1\.2\)"/);
 assert.match(svg,/step-two" transform="translate\(-59 -9\) scale\(1\.2\)"/);
 assert.match(svg,/translate\(474 19\) scale\(\.206\)/);
 assert.match(css,/\.welcome-animation-dialog img \{ width:112%/);
 assert.match(css,/\.welcome-animation-dialog img \{ width:120%/);
});

test('human feedback underline traces its existing vector and respects reduced motion',()=>{
 const app=read('app.js'),css=read('future-design.css');
 assert.match(app,/class="feedback-hand-underline"[\s\S]*?<path d="M3 10C42 5 72 9 111 7/);
 assert.match(app,/underline\.dataset\.traceReady = 'true'[\s\S]*?underline\.classList\.add\('is-tracing'\)/);
 assert.match(css,/\.feedback-hand-underline \{[^}]*fill:#ffbca8/);
 assert.match(css,/@keyframes feedback-underline-trace[\s\S]*?clip-path:inset\(0 100% 0 0\)[\s\S]*?clip-path:inset\(0 0 0 0\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.feedback-hand-underline\[data-trace-ready\][\s\S]*?animation:none/);
});

test('feedback conversation opens on demand after a two-second loading state',()=>{
 const app=read('app.js'),css=read('future-design.css');
 assert.match(app,/id="feedback-sample" class="sample-conversation"[^>]*hidden/);
 assert.match(app,/trigger\.textContent = 'See sample'/);
 assert.match(app,/Loading sample conversation[\s\S]*?await pause\(2000\)/);
 assert.doesNotMatch(app,/await pause\(6000\)/);
 assert.match(app,/close\.onclick = \(\) =>[\s\S]*?trigger\.hidden = false/);
 assert.match(css,/\.conversation-sample-trigger \{[^}]*font-size:\.78rem/);
});
