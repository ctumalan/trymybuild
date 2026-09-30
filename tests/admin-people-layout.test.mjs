import test from 'node:test';
import assert from 'node:assert/strict';
import {adminPeopleFixture,read} from '../scripts/workspace-fixtures.mjs';

test('member directory uses compact rows and collapsed action disclosures',async()=>{
 const {GET}=adminPeopleFixture();
 const response=await GET({url:new URL('https://example.invalid/admin/workspace?tab=people')});
 assert.equal(response.status,200);
 const html=await response.text();
 const rows=html.match(/<section class="cw-member-row">[\s\S]*?<\/section>/g);
 assert.equal(rows.length,15);
 for(const row of rows){
  assert.match(row,/<details class="cw-member-menu" name="member-actions">/);
  assert.match(row,/<summary aria-label="Manage /);
  assert.ok(row.indexOf('<details')<row.indexOf('Member ID:'));
 }
 for(const i of [0,4]){
  assert.match(rows[i],/Protected account/);
  assert.doesNotMatch(rows[i],/<form/);
 }
 assert.match(rows[1],/Restore account access/);
 for(const field of ['expected','reason','confirm','confirmation'])assert.ok(rows[2].includes(`name="${field}"`));
 assert.match(rows[2],/pattern="DELETE"/);
 assert.match(rows[2],/Apply decision/);
 assert.match(rows[2],/Approve Verified Creator badge/);
 assert.match(read('workspace-ui.js'),/\.cw-member-menu\[open\]/);
});
