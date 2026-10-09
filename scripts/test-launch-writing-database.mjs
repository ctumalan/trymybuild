// Disposable PostgreSQL integration checks. No production connection or data.
import { readFile,readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const dependency=process.argv[2];
const {PGlite}=await import(pathToFileURL(dependency).href);
const {pgcrypto}=await import(pathToFileURL(dirname(dependency)+'/contrib/pgcrypto.js').href);
const db=new PGlite({extensions:{pgcrypto}}),run=(sql,args=[])=>db.query(sql,args);
const value=async(sql,args=[])=>Object.values((await run(sql,args)).rows[0])[0];
try {
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create schema extensions;create extension pgcrypto with schema extensions;');
 for(const file of (await readdir(new URL('../database/',import.meta.url))).filter(f=>/^\d.*\.sql$/.test(f)).sort()){
  if(file.startsWith('004'))await run("insert into users(workos_user_id) values('user_01M1Q8HVXRTVJ7ZXSC9RDZT540')");
  await db.exec(await readFile(new URL('../database/'+file,import.meta.url),'utf8'));
 }
 const owner=randomUUID(),author=randomUUID(),stranger=randomUUID();
 for(const id of [owner,author,stranger])await run('insert into users(id,workos_user_id) values($1,$2)',[id,'writing-test-'+id]);
 const samples=['👍','So cool! No issues found',Array.from({length:500},(_,i)=>'word'+i).join(' ')];
 for(const [i,message] of samples.entries()){
  const slug='writing-test-'+i;await run("insert into projects(slug,title,owner_user_id,listing_status) values($1,$2,$3,'published')",[slug,'Writing test',owner]);
  const commentId=randomUUID();assert.equal(await value('select cw_submit_guest_comment($1,$2,$3,$4)',[commentId,slug,String(i+1).repeat(64),message]),commentId);
  assert.equal(await value('select cw_submit_guest_comment($1,$2,$3,$4)',[commentId,slug,String(i+1).repeat(64),message]),commentId);
  assert.equal(await value('select response from project_experiences where id=$1',[commentId]),message);
  const feedback=await value("insert into creator_feedback(project_slug,author_user_id,helpful,price,message,visibility,attempt,focus) values($1,$2,'yes','free',$3,'private','completed','ease') returning id",[slug,author,message]);
  const replyId=randomUUID();await run('select cw_feedback_reply($1,$2,$3,$4)',[owner,feedback,message,replyId]);
  assert.equal(await value('select message from feedback_replies where request_id=$1',[replyId]),message);
  await assert.rejects(run('select cw_feedback_reply($1,$2,$3,$4)',[stranger,feedback,message,randomUUID()]));
  await run("insert into daily_discussion_comments(id,user_id,day_key,tip_index,category,message) values($1,$2,current_date,0,$3,$4)",[randomUUID(),author,slug,message]);
  const wish=await value('select cw_submit_wish($1,$2,$3)',[author,'Technology',message]);assert.equal(wish.outcome,'submitted');
  assert.equal((await value('select cw_submit_wish($1,$2,$3)',[author,'Technology',message])).outcome,'duplicate');
 }
 await assert.rejects(run('select cw_submit_guest_comment($1,$2,$3,$4)',[randomUUID(),'writing-test-0','d'.repeat(64),'   ']));
 await assert.rejects(run('select cw_submit_wish($1,$2,$3)',[author,'Technology','   ']));
 assert.equal(await value("select has_function_privilege('anon','cw_submit_guest_comment(uuid,text,text,text)','execute')"),false);
 assert.equal(await value("select has_function_privilege('anon','cw_submit_wish(uuid,text,text)','execute')"),false);
 console.log('PASS: emoji, short and 500-word comments, feedback, replies, discussions and wishes; blank rejection, retry identity and access controls preserved.');
} catch(error) { console.error('FAIL: '+error.message);console.error(error.stack?.split('\n').filter(line=>line.includes('test-launch-writing-database')).join('\n'));process.exitCode=1; } finally { await db.close(); }
