import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('discovery language, navigation and destinations use the requested public wording',()=>{
 const app=read('app.js');
 assert.match(app,/Search apps, or paste your app’s URL to share it/);
 assert.match(app,/>App details<\/button>/);
 assert.match(app,/>Give feedback<\/a>/);
 assert.match(app,/class="discovery-categories"/);
 assert.match(app,/return parsed\.href/);
});

test('feedback prompts keep session-only suppression and close after successful submissions',()=>{
 assert.match(read('return-preferences.js'),/Do not ask again for this session/);
 assert.match(read('app.js'),/setTimeout\(dismiss, 350\)/);
 for(const file of ['community-input.js','public-comments.js','project-actions.js'])assert.match(read(file),/cw-feedback-complete|setTimeout\(close,350\)/);
});

test('visual fixes cover navigation contrast, compact actions, badges and failed captures',()=>{
 const app=read('app.js'),css=read('future-design.css');
 assert.match(css,/aria-current=page[^}]*color:#fff/);
 assert.match(css,/\.project-card-actions \.compact-action/);
 assert.match(css,/\.profile-hero div>p:last-child \{ color:#51675d/);
 assert.match(css,/\.journey-progress>span \{ background:#7545ad/);
 assert.match(app,/class="listing-capture-fallback"/);
 assert.match(app,/Preview unavailable/);
});

test('creator profile messaging is expanded and verification uses the compact label',()=>{
 const profile=read('src/server/profile-view.ts');
 assert.match(profile,/<section class="cw-panel direct-message-entry"><h2>Message this creator<\/h2>/);
 assert.doesNotMatch(profile,/<details class="cw-panel direct-message-entry">/);
 for(const file of ['app.js','src/server/profile-view.ts','src/server/project-ui.ts','src/server/project-detail-ui.ts','src/server/workspace.ts'])assert.match(read(file),/✓ Verified/);
});

test('verified progress notifications are stable milestone messages for eligible creators',()=>{
 const notifications=read('src/server/notifications.ts');
 assert.match(notifications,/verified-progress:'\+milestone/);
 assert.match(notifications,/Work toward your Verified badge/);
 assert.match(notifications,/milestone=reviews>=3\?3:reviews>=1\?1:0/);
});
