import test from 'node:test';
import assert from 'node:assert/strict';
import {adminPeopleFixture,read} from '../scripts/workspace-fixtures.mjs';

test('member directory pairs people with app uploads and contextual controls',async()=>{
 const {GET}=adminPeopleFixture();
 const response=await GET({url:new URL('https://example.invalid/admin/workspace?tab=people&member=member-2')});
 assert.equal(response.status,200);
 const html=await response.text();
 assert.match(html,/class="admin-people-workspace"/);assert.equal((html.match(/class="admin-person-row"/g)||[]).length,15);assert.match(html,/class="admin-person-profile"/);
 assert.match(html,/Uploaded apps/);assert.match(html,/Member app/);assert.match(html,/Preview uploaded for Member app/);assert.match(html,/href="\/admin\/project\?slug=member-app"/);assert.match(html,/Open website/);
 assert.match(html,/1<\/strong>Uploaded apps/);assert.match(html,/1<\/strong>Qualified feedback/);assert.match(html,/Account &amp; verification controls/);
 for(const field of ['expected','reason','confirm','confirmation'])assert.ok(html.includes(`name="${field}"`));
 assert.match(html,/pattern="DELETE"/);assert.match(html,/Apply decision/);assert.match(html,/Approve Verified Creator badge/);
 assert.doesNotMatch(html,/class="cw-member-menu"/);for(const selector of ['.admin-people-workspace','.admin-person-profile','.admin-member-app','.admin-member-controls'])assert.ok(read('ui-refinements.css').includes(selector));
});
