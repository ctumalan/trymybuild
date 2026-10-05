import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const migration=readFileSync(new URL('../database/027_email_notification_loop.sql',import.meta.url),'utf8');

test('member and admin email events enter one idempotent queue',()=>{
 for(const kind of ['feedback','comment','quick-feedback','message','publication','support','admin'])assert.ok(migration.includes(`'${kind}'`));
 assert.match(migration,/on conflict\(id\) do nothing/g);
 assert.match(migration,/admin_new_member_notification/);
 assert.match(migration,/admin_first_publish_notification/);
 assert.match(migration,/admin_support_case_notification/);
});

test('the queue stops permanent failures and comment moderation does not duplicate creator mail',()=>{
 assert.match(migration,/failed_at is null/);
 assert.match(migration,/attempts<8/);
 assert.match(migration,/project_comment_notification after insert on public\.project_experiences/);
 assert.doesNotMatch(migration,/project_comment_notification after insert or update/);
});
