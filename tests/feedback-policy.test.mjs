import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { feedbackInput,feedbackDestination,threadAccess,thoughtfulComment,validId,wordCount } from '../src/server/feedback-policy.mjs';
const valid={slug:'mealmap',helpful:'yes',price:'free',visibility:'private',message:'  Search worked well and the filters felt clear.  '};
test('feedback preserves explicit privacy and separates price from usefulness',()=>{
 assert.deepEqual(feedbackInput(valid),{project_slug:'mealmap',helpful:'yes',price:'free',visibility:'private',message:'Search worked well and the filters felt clear.'});
 assert.equal(feedbackInput({...valid,price:'too_expensive'}).helpful,'yes');
 assert.equal(wordCount(valid.message),8);
});
test('rejects unknown choices, unsafe slugs, missing consent and oversized text',()=>{
 for(const changes of [{helpful:'toString'},{price:'__proto__'},{visibility:undefined},{visibility:'published'},{slug:'../admin'},{message:'Only five words are written'},{message:'word '.repeat(151)},{message:'a'.repeat(801)},{message:null}])assert.equal(feedbackInput({...valid,...changes}),null);
 assert.equal(thoughtfulComment('Seven clear words describe this useful project experience.'),true);
});
test('thread access is exact ownership or authorship, never a display label',()=>{
 assert.equal(threadAccess('author','author','creator'),true);
 assert.equal(threadAccess('creator','author','creator'),true);
 for(const id of [null,'','stranger','admin','CreatorWorks Studio'])assert.equal(threadAccess(id,'author','creator'),false);
 assert.equal(threadAccess('stranger','author',null),false);
});
test('sign-in destinations are allowlisted same-origin routes',()=>{
 for(const path of ['/tell/mealmap','/?project=mealmap','/dashboard','/dashboard?view=creator'])assert.equal(feedbackDestination(path),path);
 assert.equal(feedbackDestination('listing'),'/?listing=settings');
 assert.equal(feedbackDestination('/?listing=settings'),'/?listing=settings');
 assert.equal(feedbackDestination('listing-dashboard'),'/?listing=settings&after=dashboard');
 for(const path of ['//evil.com','https://evil.com','/admin','/tell/../admin','/tell/%2f%2fevil.com','/?project=../admin','/?project=mealmap&next=https://evil.com','/dashboard?view=creator&next=https://evil.com',null])assert.equal(feedbackDestination(path),'/?account=1');
});
test('canonical thread IDs only',()=>{
 assert.equal(validId('12345678-1234-1234-1234-123456789abc'),true);
 for(const id of ['-'.repeat(36),'../admin','',null])assert.equal(validId(id),false);
});
test('database review prevents private publication and records decisions atomically',async()=>{
 const sql=await readFile(new URL('../database/003_creator_feedback.sql',import.meta.url),'utf8');
 assert.match(sql,/item.visibility <> 'public'/);
 assert.match(sql,/for update/);
 assert.match(sql,/insert into public.feedback_review_history/);
 assert.match(sql,/alter table public.creator_feedback enable row level security/);
 assert.match(sql,/revoke all on public.creator_feedback,public.feedback_replies,public.feedback_review_history from anon,authenticated/);
 assert.match(sql,/p_actor is distinct from item.author_user_id and p_actor is distinct from owner_id/);
 assert.match(sql,/request_id uuid not null unique/);
});
test('public page selects only public and moderated feedback',async()=>{
 const source=await readFile(new URL('../src/pages/tell/[slug].ts',import.meta.url),'utf8');
 assert.match(source,/eq\('visibility','public'\).eq\('moderation_status','published'\)/);
});
