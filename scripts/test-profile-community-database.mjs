// Disposable SQL integration checks. No production credentials or network.
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
const {PGlite}=await import(pathToFileURL(process.argv[2]).href),db=new PGlite();
const run=(sql,args=[])=>db.query(sql,args),one=async(sql,args=[])=>Object.values((await run(sql,args)).rows[0])[0];
try{
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);');
 for(const f of (await readdir(new URL('../database/',import.meta.url))).filter(f=>/^\d.*\.sql$/.test(f)).sort()){if(f.startsWith('004'))await run("insert into users(workos_user_id) values('user_01M1Q8HVXRTVJ7ZXSC9RDZT540')");await db.exec(await readFile(new URL('../database/'+f,import.meta.url),'utf8'));}
 const member=async(name,visible=true)=>{const id=randomUUID();await run('insert into users(id,workos_user_id) values($1,$2)',[id,name]);await run('insert into profiles(user_id,slug,display_name,is_public) values($1,$2,$2,$3)',[id,name,visible]);return id;};
 const a=await member('alice'),b=await member('bob'),c=await member('outsider'),hidden=await member('private-person',false),admin=await member('admin-reviewer');
 await run("update users set system_role='admin' where id=$1",[admin]);
 await run("insert into projects(slug,title,owner_user_id,listing_status) values('test-public','Public project',$1,'published'),('test-draft','Private draft',$1,'draft')",[b]);
 const hash='a'.repeat(64),id=randomUUID(),comment='I tried this tool and liked the clear layout.';
 await assert.rejects(run('select cw_submit_guest_comment($1,$2,$3,$4)',[id,'test-draft',hash,comment]));
 assert.equal(await one('select cw_submit_guest_comment($1,$2,$3,$4)',[id,'test-public',hash,comment]),id);
 assert.equal(await one('select cw_submit_guest_comment($1,$2,$3,$4)',[id,'test-public',hash,comment]),id);
 assert.equal(Number(await one('select count(*) from project_experiences where id=$1',[id])),1);
 await assert.rejects(run('select cw_submit_guest_comment($1,$2,$3,$4)',[id,'test-public',hash,'I changed my mind after trying the tool again.']));
 assert.equal(Number(await one('select cw_claim_guest_comments($1,$2)',[a,'b'.repeat(64)])),0);
 assert.equal(Number(await one('select cw_claim_guest_comments($1,$2)',[a,hash])),1);
 assert.equal(Number(await one('select cw_claim_guest_comments($1,$2)',[c,hash])),0);
 await run("update project_experiences set moderation_status='published' where id=$1",[id]);
 assert.equal(await one('select user_id from notifications where id=$1',[id]),a);
 await run("update project_experiences set moderation_status='published' where id=$1",[id]);
 assert.equal(Number(await one('select count(*) from notifications where id=$1',[id])),1);
 const expired=randomUUID();await run('select cw_submit_guest_comment($1,$2,$3,$4)',[expired,'test-public','c'.repeat(64),comment]);await run("update project_experiences set guest_expires_at=now()-interval '1 day' where id=$1",[expired]);assert.equal(Number(await one('select cw_claim_guest_comments($1,$2)',[c,'c'.repeat(64)])),0);
 await run("insert into creator_feedback(project_slug,author_user_id,helpful,price,message,visibility,moderation_status,attempt,focus) values('test-public',$1,'not_tried','free','I wonder whether this could work without internet access.','private','pending','not_tried','ease')",[a]);
 await run("insert into creator_feedback(project_slug,author_user_id,helpful,price,message,visibility,moderation_status,attempt,focus) values('test-public',$1,'somewhat','free','I tried the planner and found the save action hard to notice.','private','pending','completed','ease')",[c]);
 await run("insert into creator_feedback(project_slug,author_user_id,helpful,price,message,visibility,moderation_status,attempt,focus) values('test-public',$1,'yes','free','I tried the planner and the first task worked well for me.','public','published','completed','ease')",[admin]);
 const stats=(await run("select * from cw_public_activity() where slug='test-public'")).rows[0];assert.equal(Number(stats.comments),2);assert.equal(Number(stats.recent_comments),2);assert.equal(Number(stats.community_reviews),1);assert.equal(Number(await one("select count(*) from cw_public_activity() where slug='test-draft'")),0);
 console.log('PASS: guest retry, moderation, one-time verified claim, expiry, publication notification, public-only aggregates');
 const alreadyPublic=randomUUID();await run('select cw_submit_guest_comment($1,$2,$3,$4)',[alreadyPublic,'test-public','d'.repeat(64),comment]);await run("update project_experiences set moderation_status='published' where id=$1",[alreadyPublic]);
 assert.equal(Number(await one('select count(*) from notifications where id=$1',[alreadyPublic])),0);
 assert.equal(Number(await one('select cw_claim_guest_comments($1,$2)',[c,'d'.repeat(64)])),1);
 assert.equal(await one('select user_id from notifications where id=$1',[alreadyPublic]),c);
 const request=randomUUID();await assert.rejects(run('select cw_send_direct_message($1,$2,$3,$4)',[a,a,request,'Hello']));await assert.rejects(run('select cw_send_direct_message($1,$2,$3,$4)',[a,hidden,request,'Hello']));
 const thread=await one('select cw_send_direct_message($1,$2,$3,$4)',[a,b,request,'Hello Bob']);
 assert.equal(await one('select cw_send_direct_message($1,$2,$3,$4)',[a,b,request,'Hello Bob']),thread);
 assert.equal(Number(await one('select count(*) from direct_messages where id=$1',[request])),1);
 assert.equal(Number(await one("select count(*) from cw_combined_inbox($1,'',false,0,'newest','direct')",[c])),0);
 const inbox=(await run("select * from cw_combined_inbox($1,'Alice',true,0,'newest','direct')",[b])).rows;assert.equal(inbox.length,1);assert.equal(inbox[0].kind,'direct');assert.equal(inbox[0].unread,true);
 await assert.rejects(run('select cw_mark_direct_read($1,$2,now())',[c,thread]));
 await run('select cw_mark_direct_read($1,$2,now())',[b,thread]);assert.equal(Number(await one("select count(*) from cw_combined_inbox($1,'',true,0,'newest','direct')",[b])),0);
 await run("select cw_mark_direct_read($1,$2,now()-interval '1 day')",[b,thread]);assert.equal(Number(await one("select count(*) from cw_combined_inbox($1,'',true,0,'newest','direct')",[b])),0);
 await run('select cw_direct_block($1,$2,true)',[b,a]);await assert.rejects(run('select cw_send_direct_message($1,$2,$3,$4)',[a,b,randomUUID(),'Blocked send']));await assert.rejects(run('select cw_send_direct_message($1,$2,$3,$4)',[b,a,randomUUID(),'Blocked reply']));await run('select cw_direct_block($1,$2,false)',[b,a]);
 await run('select cw_send_direct_message($1,$2,$3,$4)',[b,a,randomUUID(),'Thanks Alice']);
 assert.equal(Number(await one("select count(*) from cw_combined_inbox($1,'',true,0,'newest','direct')",[a])),1);
 for(const role of ['anon','authenticated']){await db.exec('set role '+role);for(const sql of ['select * from direct_messages','select * from direct_threads','select * from direct_blocks','select cw_public_activity()','select cw_combined_inbox(null)','select cw_claim_guest_comments(null,null)'])await assert.rejects(run(sql));await db.exec('reset role');}
 for(let n=0;n<14;n++){
  const peer=await member('pagination-'+n),conversation=randomUUID();
  await run('insert into direct_threads(id,member_a,member_b) values($1,least($2::uuid,$3::uuid),greatest($2::uuid,$3::uuid))',[conversation,peer,b]);
  await run("insert into direct_messages(id,thread_id,sender_id,message,created_at) values($1,$2,$3,'Pagination fixture',now()+$4*interval '1 minute')",[randomUUID(),conversation,peer,n]);
  await run("insert into creator_feedback(project_slug,author_user_id,helpful,price,message,visibility,moderation_status,attempt,focus,created_at) values('test-public',$1,'not_tried','free','I wonder whether this could work without internet access.','private','pending','not_tried','ease',now()+$2*interval '1 minute')",[peer,n]);
 }
 const page0=(await run("select * from cw_combined_inbox($1,'',false,0,'newest','all')",[b])).rows,page1=(await run("select * from cw_combined_inbox($1,'',false,1,'newest','all')",[b])).rows;
 assert.equal(page0.length,25);assert.equal(page1.length,5);assert.equal(Number(page0[0].total_count),30);assert.equal(new Set([...page0,...page1].map(r=>r.id)).size,30);
 assert.equal(Number(await one("select count(*) from cw_combined_inbox($1,'',false,0,'newest','project')",[b])),15);
 assert.equal(Number(await one("select count(*) from cw_combined_inbox($1,'',false,0,'newest','direct')",[b])),15);
 console.log('PASS: claim after publication and mixed inbox pagination across 30 conversations');
 await run("update users set account_status='deleted' where id=$1",[a]);assert.equal(await one('select message from direct_messages where id=$1',[request]),'[Removed by account deletion]');assert.equal(await one('select response from project_experiences where id=$1',[id]),'[Removed by account deletion]');assert.equal(Number(await one("select count(*) from cw_combined_inbox($1)",[a])),0);await assert.rejects(run('select cw_send_direct_message($1,$2,$3,$4)',[a,b,randomUUID(),'After deletion']));
 console.log('PASS: private-message ownership, idempotency, filtering, read monotonicity, blocking, browser-role denial and account erasure');
}catch(error){console.error('FAIL:',error.message,error.where||'');process.exitCode=1;}finally{await db.close();}
