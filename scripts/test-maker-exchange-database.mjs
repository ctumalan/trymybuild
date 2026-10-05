// Synthetic disposable database only. No environment credentials or production access.
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';

export async function testMakerExchange(db){
 const run=(sql,args=[])=>db.query(sql,args);
 const one=async(sql,args=[])=>Object.values((await run(sql,args)).rows[0])[0];
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create schema extensions;create extension pgcrypto with schema extensions;');
 for(const file of (await readdir(new URL('../database/',import.meta.url))).filter(f=>/^\d.*\.sql$/.test(f)&&Number(f.slice(0,3))<28).sort()){
  if(file.startsWith('004'))await run("insert into users(workos_user_id) values('user_01M1Q8HVXRTVJ7ZXSC9RDZT540')");
  await db.exec(await readFile(new URL('../database/'+file,import.meta.url),'utf8'));
 }
 const sql=await readFile(new URL('../database/028_maker_exchange.sql',import.meta.url),'utf8');
 await assert.rejects(db.exec(sql.replace(/commit;\s*$/,'select 1/0;commit;')));await db.exec('rollback;');
 assert.equal(await one("select to_regclass('public.maker_exchange_entries')"),null);
 await db.exec(sql);
 const member=async label=>{const id=randomUUID();await run('insert into users(id,workos_user_id) values($1,$2)',[id,'exchange-'+label]);await run('insert into profiles(user_id,slug,display_name) values($1,$2,$2)',[id,'exchange-'+label]);return id;};
 const project=async(user,slug,status='published')=>run("insert into projects(slug,title,owner_user_id,listing_status,visibility,first_try) values($1,$1,$2,$3,'public','Try the first task.')",[slug,user,status]);
 const a=await member('a'),b=await member('b'),c=await member('c'),d=await member('d'),e=await member('e'),g=await member('g');
 for(const [user,slug] of [[a,'exchange-a'],[b,'exchange-b'],[c,'exchange-c'],[d,'exchange-d'],[e,'exchange-e'],[g,'exchange-g']])await project(user,slug);
 const question='Was it clear how to complete your first task?',ra=randomUUID(),rb=randomUUID();
 const join=(user,id,slug)=>run('select cw_join_maker_exchange($1,$2,$3,$4)',[user,id,slug,question]);
 const state=user=>one('select cw_maker_exchange_state($1)',[user]);
 const feedback=(user,slug,message,attempt='completed')=>one("insert into creator_feedback(project_slug,author_user_id,helpful,price,visibility,message,attempt,focus) values($1,$2,'not_yet','free','private',$3,$4,'ease') returning id",[slug,user,message,attempt]);
 await assert.rejects(join(a,randomUUID(),'exchange-b'));
 await join(a,ra,'exchange-a');assert.equal((await state(a)).state,'waiting');
 await join(a,ra,'exchange-a');assert.equal(Number(await one('select count(*) from maker_exchange_entries')),1);
 await assert.rejects(join(a,randomUUID(),'exchange-a'));
 await join(b,rb,'exchange-b');assert.equal((await state(a)).partner.slug,'exchange-b');assert.equal((await state(b)).partner.slug,'exchange-a');
 const notificationCount=Number(await one("select count(*) from notifications where title='Your maker feedback exchange is ready'"));assert.equal(notificationCount,2);
 await join(b,rb,'exchange-b');assert.equal(Number(await one("select count(*) from notifications where title='Your maker feedback exchange is ready'")),2);
 assert.equal((await state(c)),null);
 const unrelated=await feedback(a,'exchange-c','The drawing export preserved colors but cropped the bottom caption.');assert.equal((await state(a)).given,null);
 const fa=await feedback(a,'exchange-b','The save button was hidden below the keyboard after typing a title.');assert.equal((await state(a)).given,fa);assert.equal((await state(a)).complete,false);assert.equal((await state(b)).received,fa);
 const fb=await feedback(b,'exchange-a','Adding the second task reset the date field instead of preserving tomorrow.');assert.equal((await state(a)).complete,true);assert.equal((await state(b)).complete,true);
 await assert.rejects(feedback(a,'exchange-b','Repeating this review must not create another completion event.'));
 await run("select cw_credit_review(null,$1,'revoked','Synthetic moderation reversal',0)",[fb]);assert.equal((await state(a)).complete,false);assert.equal((await state(b)).given,null);
 await run("select cw_credit_review(null,$1,'qualified','Synthetic appeal approved',1)",[fb]);assert.equal((await state(a)).complete,true);
 await project(a,'exchange-a-second');await project(b,'exchange-b-second');
 const ra2=randomUUID(),rb2=randomUUID();await join(a,ra2,'exchange-a-second');assert.equal((await state(b)).state,'closed');await join(b,rb2,'exchange-b-second');
 const pending=await feedback(a,'exchange-b-second','Before trying this app I wonder how team invitations are handled.','not_tried');assert.equal((await state(a)).given,null);
 await run("select cw_credit_review(null,$1,'qualified','Synthetic qualification without firsthand attempt',0)",[pending]);assert.equal((await state(a)).given,null);
 await assert.rejects(run('select cw_leave_maker_exchange($1,$2)',[c,ra2]));
 await run('select cw_leave_maker_exchange($1,$2)',[a,ra2]);assert.equal((await state(a)).state,'cancelled');assert.equal((await state(b)).state,'cancelled');
 // Fulfilled requests retain their history; only still-open requests are cancelled.
 assert.equal(await one('select status from feedback_requests where id=$1',[ra2]),'cancelled');
 assert.equal(await one('select status from feedback_requests where id=$1',[rb2]),'fulfilled');
 assert.equal(await one('select count(*)::int from creator_feedback where id=$1',[fa]),1);
 await run('select cw_leave_maker_exchange($1,$2)',[a,ra2]);
 const rc=randomUUID(),rd=randomUUID();await join(c,rc,'exchange-c');await join(d,rd,'exchange-d');assert.equal((await state(c)).state,'matched');
 await run("update projects set listing_status='unpublished' where slug='exchange-d'");assert.equal((await state(c)).state,'cancelled');
 await assert.rejects(join(d,randomUUID(),'exchange-d'));
 const re=randomUUID(),rg=randomUUID();await join(e,re,'exchange-e');await join(g,rg,'exchange-g');
 await run('delete from feedback_requests where id=$1',[re]);assert.equal((await state(g)).state,'cancelled');
 const re2=randomUUID(),rg2=randomUUID();await join(e,re2,'exchange-e');await join(g,rg2,'exchange-g');
 await run("update users set account_status='suspended' where id=$1",[e]);assert.equal((await state(g)).state,'cancelled');await assert.rejects(state(e));
 for(const role of ['anon','authenticated']){
  await db.exec('set role '+role);
  await assert.rejects(run('select * from maker_exchange_entries'));
  await assert.rejects(run('select cw_maker_exchange_state($1)',[a]));
  await assert.rejects(join(a,randomUUID(),'exchange-a'));
  await db.exec('reset role');
 }
 console.log('PASS: atomic migration, explicit matching, duplicate retries, ownership, firsthand qualification, two-sided completion, moderation reversals, cancellation, unpublishing, erasure cleanup and private permissions.');
 return {member,project,question,run,one,join,state,feedback};
}

if(process.argv[1]===new URL(import.meta.url).pathname){
 const dependency=process.argv[2];if(!dependency?.startsWith('/private/tmp/'))throw Error('Use temporary test dependencies only.');
 const {PGlite}=await import(pathToFileURL(dependency+'/node_modules/@electric-sql/pglite/dist/index.js').href);
 const {pgcrypto}=await import(pathToFileURL(dependency+'/node_modules/@electric-sql/pglite/dist/contrib/pgcrypto.js').href);
 const db=new PGlite({extensions:{pgcrypto}});
 try{await testMakerExchange(db);}catch(error){console.error('FAIL:',error.message,error.where||'');process.exitCode=1;}finally{await db.close();}
}
