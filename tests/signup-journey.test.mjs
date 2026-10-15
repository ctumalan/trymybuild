import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const entry=readFileSync(new URL('../community-entry.js',import.meta.url),'utf8');
function fixture({visitor=false,draft={},authenticated=false,valid=true,storage=true,saveOk=true}={}){
 const events={},navigations=[],requests=[],status={textContent:''},button={disabled:false};
 const form={reportValidity:()=>valid,elements:{alerts:{checked:false}},querySelector:selector=>selector.includes('status')?status:button};
 const scope={URLSearchParams,location:{search:visitor?'?welcome=1&journey=visitor':'?welcome=1',assign:href=>navigations.push(href)},listingDraft:draft,listingUrl:value=>value?.startsWith('https://'),saveListingDraft:()=>storage,state:{session:{authenticated}},window:{CW_SERVER:true},esc:value=>String(value).replaceAll('<','&lt;'),document:{addEventListener(type,fn){(events[type]||=[]).push(fn);}},FormData:class{getAll(){return ['Technology'];}},fetch:async(url,options)=>{requests.push({url,body:JSON.parse(options.body)});return {ok:saveOk};},localStorage:{getItem(){return null;},removeItem(){}},categoryCatalog:[]};
 vm.createContext(scope);vm.runInContext(entry,scope);
 const submit=async selector=>{for(const fn of events.submit||[])await fn({preventDefault(){},target:{closest:key=>key===selector?form:null}});};
 return {scope,submit,navigations,requests,status,button};
}
test('a creator with a preview returns to the saved draft and never submits preferences',async()=>{
 const f=fixture({draft:{title:'My App',url:'https://example.com'}});
 assert.match(f.scope.welcomeAccountPage(),/Create your account to save My App/);
 await f.submit('[data-welcome-signup]');
 assert.deepEqual(f.navigations,['/auth/sign-in?signup=1&next=listing-dashboard']);
 assert.deepEqual(f.requests,[]);
});
test('general signup prioritizes creators while browsing signup returns to optional recommendations',async()=>{
 const creator=fixture();await creator.submit('[data-welcome-signup]');
 assert.equal(creator.navigations[0],'/auth/sign-in?signup=1&next=%2Fdashboard%3Fview%3Dcreator');
 const visitor=fixture({visitor:true,draft:{title:'Old draft',url:'https://example.com'}});await visitor.submit('[data-welcome-signup]');
 assert.equal(visitor.navigations[0],'/auth/sign-in?signup=1&next=%2F%3Fwelcome%3D1');
 assert.doesNotMatch(visitor.scope.welcomeAccountPage(),/Old draft/);
 assert.deepEqual(visitor.requests,[]);
});
test('signup retains terms validation and does not lose an unsaved preview',async()=>{
 const terms=fixture({valid:false});await terms.submit('[data-welcome-signup]');assert.deepEqual(terms.navigations,[]);
 const storage=fixture({storage:false,draft:{title:'My App',url:'https://example.com'}});await storage.submit('[data-welcome-signup]');
 assert.deepEqual(storage.navigations,[]);assert.match(storage.status.textContent,/could not be saved/);
});
test('only an explicit post-signup save writes interests, with notifications off by default',async()=>{
 const f=fixture({authenticated:true});
 assert.deepEqual(f.requests,[]);
 await f.submit('[data-recommendation-preferences]');
 assert.deepEqual(f.requests,[{url:'/api/onboarding',body:{interests:['Technology'],alerts:false}}]);
 assert.deepEqual(f.navigations,['/']);
 assert.match(f.scope.optionalRecommendationsPage(),/href="\/"[^>]*data-skip-recommendations/);
});
test('preference failures keep skip available and never block an existing account',async()=>{
 const f=fixture({authenticated:true,saveOk:false});await f.submit('[data-recommendation-preferences]');
 assert.deepEqual(f.navigations,[]);assert.match(f.status.textContent,/skip for now/);assert.equal(f.button.disabled,false);
 assert.match(f.scope.optionalRecommendationsPage(),/data-skip-recommendations/);
});
test('expired authentication cannot submit preferences',async()=>{
 const f=fixture();await f.submit('[data-recommendation-preferences]');
 assert.deepEqual(f.requests,[]);assert.match(f.status.textContent,/Sign in/);
});
