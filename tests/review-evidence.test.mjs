import test from 'node:test';
import assert from 'node:assert/strict';
import {moduleFixture,mockDatabase} from '../scripts/workspace-fixtures.mjs';

test('review evidence counts eligible member reviews and exposes only published public content',async()=>{
 const rows=[
  {author_user_id:'member-public',project_slug:'sample',attempt:'completed',focus:'ease',message:'The first task worked and the next action was clear.',visibility:'public',moderation_status:'published',created_at:'2026-10-08T10:00:00Z'},
  {author_user_id:'member-private',project_slug:'sample',attempt:'stuck',focus:'bugs',message:'This remains private with the creator.',visibility:'private',moderation_status:'pending',created_at:'2026-10-08T09:00:00Z'},
  {author_user_id:'admin',project_slug:'sample',attempt:'completed',focus:'results',message:'Administrator review.',visibility:'public',moderation_status:'published',created_at:'2026-10-08T08:00:00Z'},
  {author_user_id:'observer',project_slug:'sample',attempt:'not_tried',focus:'explanation',message:'I did not try the app.',visibility:'public',moderation_status:'published',created_at:'2026-10-08T07:00:00Z'},
 ];
 const db=mockDatabase({
  projects:[{slug:'sample',listing_status:'published'}],creator_feedback:rows,
  users:[{id:'member-public',system_role:'member',account_status:'active'},{id:'member-private',system_role:'member',account_status:'active'},{id:'admin',system_role:'admin',account_status:'active'},{id:'observer',system_role:'member',account_status:'active'}],
  profiles:[{user_id:'member-public',display_name:'Public Reviewer',avatar_path:'/avatar.png'}],
 });
 const {reviewEvidence}=moduleFixture('src/server/review-evidence.ts',['reviewEvidence'],{database:()=>db});
 const result=await reviewEvidence('sample');
 assert.equal(result.total,2);assert.equal(result.publicCount,1);assert.equal(result.reviews.length,1);
 assert.deepEqual({...result.reviews[0]},{author:'Public Reviewer',avatar:'/avatar.png',attempt:'completed',focus:'ease',message:rows[0].message,createdAt:rows[0].created_at});
 assert.doesNotMatch(JSON.stringify(result),/Administrator review|remains private|did not try/);
});

test('review evidence returns an empty result for unpublished projects',async()=>{
 const db=mockDatabase({projects:[{slug:'draft',listing_status:'draft'}],creator_feedback:[],users:[],profiles:[]});
 const {reviewEvidence}=moduleFixture('src/server/review-evidence.ts',['reviewEvidence'],{database:()=>db});
 assert.deepEqual(JSON.parse(JSON.stringify(await reviewEvidence('draft'))),{total:0,publicCount:0,reviews:[]});
});
