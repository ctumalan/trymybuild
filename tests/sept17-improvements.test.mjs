import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {workspaceFixtures,moduleFixture,read} from '../scripts/workspace-fixtures.mjs';

test('the founder display exception does not award review progress or extend to other companies',async()=>{
 const f=workspaceFixtures();f.tables.profiles[0].creator_type='company';
 let progress=await f.scope.verificationProgress(f.db,f.owner,true);
 assert.equal(progress.verified,true);assert.equal(progress.earned,2);assert.equal(progress.creators,1);assert.equal(progress.ownershipConfirmed,false);assert.equal(progress.eligible,false);
 assert.match(f.scope.verificationCard(progress),/Founder exception—not earned through feedback/);
 progress=await f.scope.verificationProgress(f.db,f.owner);
 assert.equal(progress.verified,false);assert.doesNotMatch(f.scope.verificationCard(progress),/✓ Verified Creator/);
 f.tables.profiles[0].creator_type='independent';progress=await f.scope.verificationProgress(f.db,f.owner);
 assert.equal(progress.verified,false);assert.match(f.scope.verificationCard(progress),/Earn your Verified Creator badge/);
});
test('overview fills three distinct published cards and links to saved apps even in an owned-only catalog',async()=>{
 const f=workspaceFixtures();f.tables.projects.find(p=>p.slug==='sample-guest').owner_user_id=f.owner;
 const html=await(await f.routes['/dashboard/overview']({url:new URL('https://example.invalid/dashboard/overview'),params:{section:'overview'}})).text();
 assert.equal((html.match(/class="similar-card"/g)||[]).length,3);assert.match(html,/Reviews of your own apps do not count/);assert.match(html,/href="\/dashboard\?view=visitor">View saved apps/);
});
test('creator type filtering still excludes Studio from Independent while its disclosed badge passes Verified',()=>{
 const source=read('app.js'),context=vm.createContext({});vm.runInContext(source.slice(source.indexOf('function creatorMatchesFilters'),source.indexOf('function experienceCount')),context);
 const studio={type:'company',verified:true,founderException:true};
 assert.equal(context.creatorMatchesFilters(studio,'all',true),true);assert.equal(context.creatorMatchesFilters(studio,'company',true),true);assert.equal(context.creatorMatchesFilters(studio,'independent',true),false);
 assert.equal(context.creatorMatchesFilters({type:'company',verified:true},'all',true),false);
});
test('short-return opt-out persists across views while detailed feedback remains eligible',()=>{
 const storage=new Map(),listeners={},scope={window:{},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{addEventListener:(type,handler)=>listeners[type]=handler}};
 vm.runInNewContext(read('return-preferences.js'),scope);assert.equal(scope.window.CWReturnPrompts.suppressed('quick'),false);
 listeners.change({target:{matches:()=>true,checked:true}});
 for(const kind of ['quick','comment'])assert.equal(scope.window.CWReturnPrompts.suppressed(kind),true);
 assert.equal(scope.window.CWReturnPrompts.suppressed('detailed'),false);
 vm.runInNewContext(read('return-preferences.js'),scope);assert.equal(scope.window.CWReturnPrompts.suppressed('quick'),true);
 listeners.change({target:{matches:()=>true,checked:false}});assert.equal(scope.window.CWReturnPrompts.suppressed('comment'),false);
});
test('server project presentation places the image and centered action before guidance and escapes creator copy',()=>{
 const f=workspaceFixtures(),render=f.scope.projectDetailContent;
 const html=render({name:'<bad>',category:'Utilities',stage:'New',slug:'example',url:'https://example.invalid',preview:'/image.png',presentation:{headline:'<headline>',help:'Helpful',firstTry:'Try this'},creator:{name:'<creator>',verified:true,verificationNote:'Founder exception—not earned through feedback'}});
 assert.ok(html.indexOf('recipient-art')<html.indexOf('Try this app'));assert.ok(html.indexOf('detail-description-notes')<html.indexOf('recipient-art'));assert.match(html,/&lt;headline&gt;/);assert.match(html,/&lt;creator&gt;/);assert.doesNotMatch(html,/<bad>|<creator>/);assert.match(html,/title="Founder exception—not earned through feedback"/);
 const founder=render({name:'Studio app',category:'Utilities',stage:'New',slug:'studio',url:'https://example.invalid',presentation:{headline:'Studio app',help:'Helpful',firstTry:'Try this'},creator:{name:'Studio',verified:true,founderException:true}});
 assert.match(founder,/title="Founder exception—not earned through feedback\. Not a product-quality guarantee\."/);
});
