// Disposable PostgreSQL integration checks. No production credentials or connection.
import {readFile,readdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
export async function testListingInvitations(db){
 const query=(sql,args=[])=>db.query(sql,args),value=async(sql,args=[])=>Object.values((await query(sql,args)).rows[0])[0];
 await db.exec('create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create schema extensions;create extension pgcrypto with schema extensions;');
 for(const file of (await readdir(new URL('../database/',import.meta.url))).filter(f=>/^\d.*\.sql$/.test(f)&&Number(f.slice(0,3))<34).sort()){
  if(file.startsWith('004'))await query("insert into users(workos_user_id) values('user_01M1Q8HVXRTVJ7ZXSC9RDZT540')");
  await db.exec(await readFile(new URL('../database/'+file,import.meta.url),'utf8'));
 }
 const sql=await readFile(new URL('../database/034_listing_invitations.sql',import.meta.url),'utf8');
 await assert.rejects(db.exec(sql.replace(/commit;\s*$/,'select 1/0;commit;')));await db.exec('rollback;');
 assert.equal(await value("select to_regclass('public.listing_invitations')"),null);
 await db.exec(sql);await db.exec(sql); // Reruns do not delete data or republish projects.
 const member=async()=>{const id=randomUUID();await query('insert into users(id,workos_user_id) values($1,$2)',[id,'invitation-test-'+id]);return id;};
 const admin=await member(),maker=await member(),stranger=await member(),email='maker@example.com';
 const invite=async()=>{const id=randomUUID();await query("insert into listing_invitations(id,created_by,recipient_email,title,external_url,preview_path,help_text,first_try) values($1,$2,$3,'A sample app','https://example.com/',$4,'Initial benefit','Initial task')",[id,admin,email,'invitations/'+id+'/sample.jpg']);return id;};
 const content={title:'Creator’s title',external_url:'https://example.com/',category:'Technology',stage:'Ready for a first try',headline:'The creator’s introduction',summary:'The creator’s introduction',help_text:'The creator’s revised benefit',first_try:'The creator’s revised first task',price_label:'Free + paid options',is_free:false};
 const claim=(id,user=maker,recipient=email,version=0,details=content)=>value('select cw_claim_listing_invitation($1,$2,$3,$4,$5::jsonb)',[id,user,recipient,version,JSON.stringify(details)]);
 const first=await invite();
 assert.equal(await value('select count(*)::int from projects where client_token=$1',['invitation-'+first]),0);
 await assert.rejects(claim(first,maker,'wrong@example.com'));await assert.rejects(claim(first,maker,email,5));
 const project=await claim(first);assert.equal(project.owner_user_id,maker);assert.equal(project.title,content.title);assert.equal(project.help_text,content.help_text);assert.equal(project.first_try,content.first_try);
 assert.equal(project.visibility,'draft');assert.equal(project.listing_status,'draft');assert.equal(project.sharing_preference,'private');assert.equal(project.ownership_status,'unverified');assert.equal(project.published_at,null);assert.equal(project.is_studio,false);
 assert.equal(project.preview_path,'invitations/'+first+'/sample.jpg');assert.equal(project.preview_public_url,'/api/project-image/'+project.slug);
 await query("update projects set help_text='Later dashboard edit' where id=$1",[project.id]);
 assert.equal((await claim(first)).id,project.id);assert.equal((await claim(first)).help_text,'Later dashboard edit');
 assert.equal(await value('select count(*)::int from projects where client_token=$1',['invitation-'+first]),1);
 await assert.rejects(claim(first,stranger));
 for(const patch of ["revoked_at=now()","expires_at=now()-interval '1 day'"]){const id=await invite();await query('update listing_invitations set '+patch+' where id=$1',[id]);await assert.rejects(claim(id));}
 const suspended=await invite();await query("update users set account_status='suspended' where id=$1",[maker]);await assert.rejects(claim(suspended));await query("update users set account_status='active' where id=$1",[maker]);
 const invalid=await invite();await assert.rejects(claim(invalid,maker,email,0,{...content,external_url:'javascript:alert(1)'}));
 // Deleting a claimed draft preserves the claim history and cannot recreate it on retry.
 await query('delete from projects where id=$1',[project.id]);await assert.rejects(claim(first));
 for(const role of ['anon','authenticated']){
  await db.exec('set role '+role);await assert.rejects(query('select * from listing_invitations'));await assert.rejects(claim(invalid));await db.exec('reset role');
 }
 console.log('PASS: atomic/rerunnable migration, private draft creation, creator edits, recipient/active account/version/expiry/revocation guards, idempotency, removal and denied browser database access.');
 return {query,value,member,invite,claim,content,maker,email};
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const dependency=process.argv[2];if(dependency!=='/private/tmp/trymybuild-invitation-tests')throw Error('Use isolated temporary test dependencies.');
 const {PGlite}=await import(pathToFileURL(dependency+'/node_modules/@electric-sql/pglite/dist/index.js').href);
 const {pgcrypto}=await import(pathToFileURL(dependency+'/node_modules/@electric-sql/pglite/dist/contrib/pgcrypto.js').href);
 const db=new PGlite({extensions:{pgcrypto}});
 try{await testListingInvitations(db);}catch(error){console.error('FAIL:',error.message,error.where||'');process.exitCode=1;}finally{await db.close();}
}
