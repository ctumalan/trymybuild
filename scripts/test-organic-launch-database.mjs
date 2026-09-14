// Disposable database only. Never reads environment credentials or connects to production.
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const {PGlite}=await import(pathToFileURL(process.argv[2]).href),db=new PGlite();
const run=(sql,args=[])=>db.query(sql,args),one=async(sql,args=[])=>Object.values((await run(sql,args)).rows[0])[0];
try{
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
 for(const f of (await readdir(new URL('../database/',import.meta.url))).filter(f=>/^\d.*\.sql$/.test(f)&&Number(f.slice(0,3))<23).sort()){
  if(f.startsWith('004'))await run("insert into users(workos_user_id) values('user_01M1Q8HVXRTVJ7ZXSC9RDZT540')");
  await db.exec(await readFile(new URL('../database/'+f,import.meta.url),'utf8'));
 }
 const member=async(name)=>{const id=randomUUID();await run('insert into users(id,workos_user_id) values($1,$2)',[id,name]);await run('insert into profiles(user_id,slug,display_name,is_public) values($1,$2,$2,true)',[id,name]);return id;};
 const owner=await member('launch-owner'),reviewer=await member('launch-reviewer'),legacy=await member('legacy-owner'),outsider=await member('outsider');
 const project=async(slug,user,status='published')=>{const id=randomUUID();await run('insert into projects(id,slug,title,owner_user_id,listing_status) values($1,$2,$2,$3,$4)',[id,slug,user,status]);return id;};
 await project('launch-project',owner);await project('legacy-project',legacy);
 await run("insert into credit_ledger(user_id,event_key,amount,reason) values($1,'fixture-balance',10,'Test fixture')",[legacy]);
 await run("insert into project_slot_grants(user_id,milestone,reason) select $1,x,'Existing access fixture' from generate_series(1,5) x",[legacy]);
 const legacyRequest=randomUUID();await run("select cw_credit_request($1,$2,'legacy-project','create')",[legacy,legacyRequest]);
 assert.equal(Number(await one('select sum(amount) from credit_ledger where user_id=$1',[legacy])),9);
 const before=await one('select count(*) from credit_ledger');
 await db.exec(await readFile(new URL('../database/release-backup-20260914-023.sql',import.meta.url),'utf8'));
 assert.equal(Number(await one('select count(*) from release_backup_20260914_023.functions')),6);
 for(const role of ['anon','authenticated','service_role'])assert.equal(await one("select has_schema_privilege($1,'release_backup_20260914_023','USAGE')",[role]),false);
 await db.exec(await readFile(new URL('../database/023_organic_launch.sql',import.meta.url),'utf8'));
 assert.equal(Number(await one('select sum(amount) from credit_ledger where user_id=$1',[legacy])),10);
 assert.equal(Number(await one('select count(*) from credit_ledger')),Number(before)+1);
 assert.equal(await one('select status from feedback_requests where id=$1',[legacyRequest]),'queued');
 assert.equal(Number(await one('select slots from cw_launch_project_access($1)',[legacy])),6);
 assert.equal(Number(await one('select slots from cw_launch_project_access($1)',[owner])),3);
 const question='Was it clear how to save your first plan?',request=randomUUID();
 await db.exec('set role service_role');
 await run("select cw_launch_feedback_request($1,$2,'launch-project','create',$3)",[owner,request,question]);
 await run("select cw_launch_feedback_request($1,$2,'launch-project','create',$3)",[owner,request,question]);
 await assert.rejects(run("select cw_launch_feedback_request($1,$2,'launch-project','create',$3)",[owner,request,'A changed question must not silently replace the original.']));
 await assert.rejects(run("select cw_launch_feedback_request($1,$2,'launch-project','cancel','')",[outsider,request]));
 await assert.rejects(run("select cw_launch_feedback_request($1,$2,'another-project','cancel','')",[owner,request]));
 await run("select cw_launch_feedback_request($1,$2,'launch-project','cancel','')",[owner,request]);
 await run("select cw_launch_feedback_request($1,$2,'launch-project','cancel','')",[owner,request]);
 assert.equal(Number(await one('select coalesce(sum(amount),0) from credit_ledger where user_id=$1',[owner])),0);
 await run("select cw_credit_request($1,$2,'launch-project','create')",[owner,randomUUID()]);
 const oldClientRequest=await one("select id from feedback_requests where user_id=$1 and status='queued'",[owner]);
 await run("select cw_credit_request($1,$2,'launch-project','cancel')",[owner,oldClientRequest]);
 await run("select cw_launch_feedback_request($1,$2,'legacy-project','cancel','')",[legacy,legacyRequest]);
 assert.equal(Number(await one('select sum(amount) from credit_ledger where user_id=$1',[legacy])),10);
 await db.exec('reset role');
 const second=await project('launch-second',owner),third=await project('launch-third',owner,'in_review');
 await assert.rejects(project('launch-over-limit',owner));
 await run("update projects set listing_status='draft' where id=$1",[third]);
 await project('launch-fourth',owner);
 await assert.rejects(run("update projects set listing_status='in_review' where id=$1",[third]));
 await run("update projects set summary='An edit does not require another place.' where id=$1",[second]);
 const free=randomUUID();await run("select cw_launch_feedback_request($1,$2,'launch-project','create',$3)",[owner,free,question]);
 await assert.rejects(run("select cw_launch_feedback_request($1,$2,'launch-second','create',$3)",[owner,randomUUID(),question]));
 await assert.rejects(run("select cw_launch_feedback_request($1,$2,'legacy-project','create',$3)",[outsider,randomUUID(),question]));
 const feedback=randomUUID();await run("insert into creator_feedback(id,project_slug,author_user_id,helpful,price,message,visibility,moderation_status,attempt,focus) values($1,'launch-project',$2,'somewhat','free','I tried creating a plan and found the save button difficult to locate.','private','pending','completed','ease')",[feedback,reviewer]);
 assert.equal(await one('select status from feedback_requests where id=$1',[free]),'fulfilled');
 await run("update creator_feedback set moderation_status='hidden' where id=$1",[feedback]);
 assert.equal(await one('select status from feedback_requests where id=$1',[free]),'invalidated');
 assert.equal(Number(await one('select coalesce(sum(amount),0) from credit_ledger where user_id=$1',[owner])),0);
 assert.equal(Number(await one('select count(*) from project_slot_grants where user_id=$1',[reviewer])),0);
 const verification=randomUUID();await run('select cw_request_verification($1,$2,$3,$4,null)',[owner,verification,'Identity review','My published project links back to my creator profile.']);
 assert.equal(await one('select verified from profiles where user_id=$1',[owner]),false);
 await assert.rejects(run('select cw_request_verification($1,$2,$3,$4,null)',[outsider,randomUUID(),'Identity review','No published project should mean no eligibility.']));
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);for(const sql of ['select cw_launch_project_access(null)',"select cw_launch_feedback_request(null,null,null,'create','test')","select cw_release_request_credit(null,null,'test')"]){await assert.rejects(run(sql));}await db.exec('reset role');}
 console.log('PASS: historical balances/access preserved; queued reservations returned once; free requests and cancellation cannot mint credits; ownership, retry conflicts and one-open limit enforced; three active projects; identity review without points; browser role denial.');
}catch(error){console.error('FAIL:',error.message,error.where||'');process.exitCode=1;}finally{await db.close();}
