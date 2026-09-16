import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import '../listing-rules.js';
import {normalizeDraft,publishReadiness} from '../src/server/listing-policy.mjs';
test('word rule treats punctuation and repeated whitespace consistently at boundaries',()=>{
 const r=globalThis.CWListingRules;
 assert.equal(r.count('One  two\nthree — four!'),4);assert.equal(r.valid('One two three'),false);assert.equal(r.valid('One two three four'),true);
 assert.equal(r.valid('one two three four five six seven eight nine ten'),true);assert.equal(r.valid('one two three four five six seven eight nine ten eleven'),false);
 assert.equal(r.count('   … — !  '),0);
});
test('server rejects bypasses of word limits and incomplete publication',()=>{
 assert.match(normalizeDraft({does:'one two three'}).error,/4–10/);
 assert.match(normalizeDraft({does:Array(12).fill('abcdefghijklmno').join(' ')}).error,/4–10/);
 assert.equal(publishReadiness({headline:'one two three'}).ready,false);
});
test('opening an invitation does not send, copy, or open external sharing apps',async()=>{
 let handler,shared=0,copied=0,shown=false;
 const controls=new Map();const control=key=>{if(!controls.has(key))controls.set(key,{value:'Hello there',textContent:'',addEventListener(){},select(){}});return controls.get(key);};
 const dialog={isConnected:true,setAttribute(){},showModal(){shown=true;},addEventListener(){},querySelector:control,innerHTML:''};
 const ctx=vm.createContext({AbortController,navigator:{share:async()=>shared++,clipboard:{writeText:async()=>copied++}},fetch:async()=>({ok:true,json:async()=>({name:'MealMap',description:'Plan meals for your family',category:'Food',builder:'Builder',url:'https://example.com/projects/mealmap',image:'/image.png'})}),document:{addEventListener:(_,h)=>handler=h,querySelector:()=>null,createElement:()=>dialog,body:{append(){}}}});
 vm.runInContext(readFileSync(new URL('../share-invitation.js',import.meta.url),'utf8'),ctx);
 await handler({target:{closest:()=>({dataset:{shareProduct:'mealmap'}})},preventDefault(){}});
 assert.equal(shown,true);assert.equal(shared,0);assert.equal(copied,0);assert.match(dialog.innerHTML,/Review and send in your chosen app/);assert.match(dialog.innerHTML,/Gmail in browser/);assert.match(dialog.innerHTML,/data-send-invitation/);
});
