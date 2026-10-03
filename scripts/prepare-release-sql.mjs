import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const files = ['002_admin_review.sql','003_creator_feedback.sql','004_launch_creator_ownership.sql','005_listing_content.sql','006_project_publication.sql','007_account_security.sql'];
const body = files.map(name => `-- SOURCE: ${name}\n` + readFileSync(new URL(`../database/${name}`,import.meta.url),'utf8').replace(/^begin;\s*$/gmi,'').replace(/^commit;\s*$/gmi,'')).join('\n');
const sql = `begin;\nset local lock_timeout = '5s';\nset local statement_timeout = '60s';\n${body}\ncommit;\nselect 'CreatorWorks migrations 002-007 committed' as release_result;\n`;
const target='/private/tmp/creatorworks-release-002-007.txt';
writeFileSync(target,sql,{mode:0o600});
console.log(JSON.stringify({target,sha256:createHash('sha256').update(sql).digest('hex'),bytes:Buffer.byteLength(sql)}));
