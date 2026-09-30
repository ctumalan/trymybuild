import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('credit migration keeps accounting atomic and publishing enforced in the database',async()=>{
 const sql=await readFile(new URL('../database/011_community_credits.sql',import.meta.url),'utf8');
 assert.match(sql,/begin;[\s\S]*commit;/);
 assert.match(sql,/pg_advisory_xact_lock/);
 assert.match(sql,/unique\(user_id,project_slug\)/);
 assert.match(sql,/event_key text not null unique/);
 assert.match(sql,/one_open_feedback_request/);
 assert.match(sql,/fulfilled_feedback_id uuid unique/);
 assert.match(sql,/create trigger community_project_slot/);
 assert.match(sql,/if used>=slots then raise exception/);
 assert.match(sql,/insert into project_slot_assignments\(project_id,user_id\)/);
 assert.match(sql,/Credit eligible feedback created before this release/);
 assert.match(sql,/alter table public.%I enable row level security/);
 assert.match(sql,/revoke all on function %s from public,anon,authenticated/);
});
test('credit reversal refunds invalidated requests without removing earned slot history',async()=>{
 const sql=await readFile(new URL('../database/011_community_credits.sql',import.meta.url),'utf8');
 assert.match(sql,/update feedback_requests set status='invalidated'/);
 assert.match(sql,/Removed feedback: credit returned/);
 assert.doesNotMatch(sql,/delete from project_slot_grants/);
});
test('daily discussion is profile-bound, moderated, and cannot earn project credit',async()=>{
 const sql=await readFile(new URL('../database/011_community_credits.sql',import.meta.url),'utf8');
 assert.match(sql,/create table public.daily_discussion_comments/);
 assert.match(sql,/unique\(user_id,day_key\)/);
 const api=await readFile(new URL('../src/pages/api/daily-comments.ts',import.meta.url),'utf8');
 assert.match(api,/eq\('moderation_status','published'\)/);
 assert.doesNotMatch(api,/credit_ledger|feedback_qualifications/);
});
test('community writing surfaces retain guidelines and word counters, with compact guided feedback',async()=>{
 const sources=await Promise.all(['../app.js','../src/pages/tell/[slug].ts','../src/server/dashboard-cards.ts'].map(path=>readFile(new URL(path,import.meta.url),'utf8')));
 for(const source of sources){assert.match(source,/Be thoughtful\. Be respectful\.|Feedback guidelines/);assert.match(source,/7–150 words|Minimum: 7 words|data-compact-counter/);assert.match(source,/community-guidelines/);}
});
