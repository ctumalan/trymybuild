import test from 'node:test';
import assert from 'node:assert/strict';
import {profileCompletion,projectCompletion,nextSetupStep} from '../src/server/setup-completion.mjs';

test('app and creator completion remain separate and point to the next useful action',()=>{
 const project=projectCompletion({title:'Pocket Plan',external_url:'https://example.com',preview_path:'previews/one.webp'});
 const profile=profileCompletion({display_name:'Ava Maker'});
 assert.equal(project.percent,50);assert.equal(profile.percent,25);
 assert.equal(nextSetupStep({display_name:'Ava Maker'},{title:'Pocket Plan',external_url:'https://example.com',preview_path:'previews/one.webp'}),'Explain what the app is for');
});

test('blank values never count as completed setup',()=>{
 assert.equal(projectCompletion({title:'   '}).percent,0);
 assert.equal(profileCompletion({display_name:'\n'}).percent,0);
});
