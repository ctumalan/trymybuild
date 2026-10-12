import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {readFileSync} from 'node:fs';
import { invitationImageUrl, renderInvitationImage } from '../src/server/invitation-image.mjs';

const project = {slug:'sample', name:'A useful project', category:'Utilities', preview:'/assets/sample.png', creator:{name:'A creator'}};
test('share image URLs are absolute and change with public project content', () => {
 const url = invitationImageUrl(project, 'https://trymybuild.com');
 assert.match(url, /^https:\/\/trymybuild.com\/api\/invitation-image\/sample.png\?v=[a-f0-9]{12}$/);
 assert.equal(url, invitationImageUrl({...project}, 'https://trymybuild.com'));
 assert.notEqual(url, invitationImageUrl({...project, preview:'/new.png'}, 'https://trymybuild.com'));
 assert.notEqual(url, invitationImageUrl({...project, name:'Changed'}, 'https://trymybuild.com'));
 assert.notEqual(url, invitationImageUrl({...project, presentation:{help:'New guidance'}}, 'https://trymybuild.com'));
 assert.notEqual(url, invitationImageUrl({...project, creator:{name:'Another maker'}}, 'https://trymybuild.com'));
});
test('invitations retain the approved plum header, violet separator and warm white body',async()=>{
 const image=await renderInvitationImage(project);
 for(const [point,color] of [[{left:600,top:100},[36,23,46]],[{left:600,top:245},[177,123,234]],[{left:700,top:780},[252,251,250]]]){
  const pixel=await sharp(image).extract({...point,width:1,height:1}).removeAlpha().raw().toBuffer();
  assert.deepEqual([...pixel],color);
 }
});
test('missing or corrupt screenshots still produce a bounded PNG with untrusted text', async () => {
 const input = {...project, name:'<script>&" Very long project name '.repeat(20), creator:{name:'A & B <team>'}};
 for (const screenshot of [undefined, Buffer.from('broken image')]) {
  const image = await renderInvitationImage(input, screenshot);
  const metadata = await sharp(image).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, 1200);
  assert.equal(metadata.height, 900);
  assert.ok(image.length < 1_000_000);
 }
});
test('a project screenshot is included in the invitation graphic', async () => {
 const screenshot = await sharp({create:{width:32,height:32,channels:3,background:'#ff0000'}}).png().toBuffer();
 const image = await renderInvitationImage(project, screenshot);
 const pixel = await sharp(image).extract({left:300,top:500,width:1,height:1}).removeAlpha().raw().toBuffer();
 assert.deepEqual([...pixel], [255,0,0]);
});
test('illustrated invitation preview keeps a text equivalent without duplicating the artwork caption', () => {
 const source=readFileSync(new URL('../share-invitation.js',import.meta.url),'utf8');
 assert.match(source,/invitation-preview-graphic/);
 assert.match(source,/<figcaption class="visually-hidden"><strong>\$\{escape\(p\.name\)\}<\/strong><span>\$\{escape\(p\.category\)\} · Built by/);
});
