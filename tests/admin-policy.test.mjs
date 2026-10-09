import test from 'node:test';
import assert from 'node:assert/strict';
import { isFounder, moderationInput } from '../src/server/admin-policy.mjs';
test('admin authority requires an exact explicitly configured identity', () => {
  assert.equal(isFounder('user_founder', 'user_founder'), true);
  for (const [user, configured] of [[null,'user_founder'],['user_member','user_founder'],['Christian Tumalán','Christian Tumalán'],['user_founder',''],['user_founder','user_founder,user_member'],['user_founder',' user_founder']]) assert.equal(isFounder(user,configured), false);
  assert.equal(isFounder('user_production','user_staging','Founder@Example.com','founder@example.com',true),true);
  assert.equal(isFounder('user_production','user_staging','founder@example.com','founder@example.com',false),false);
  assert.equal(isFounder('user_production','user_staging','other@example.com','founder@example.com',true),false);
});
test('moderation accepts only bounded reviewed decisions', () => {
  const valid = { id:'12345678-1234-1234-1234-123456789012',status:'published',previous:'pending',expected:'A helpful question',reason:'Relevant question' };
  assert.ok(moderationInput(valid));
  for (const invalid of [{status:'admin'}, {reason:''}, {reason:'x'.repeat(301)}, {id:'not-an-id'}, {previous:'unknown'}]) assert.equal(moderationInput({...valid,...invalid}),null);
});
