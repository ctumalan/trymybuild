// Native disposable PostgreSQL, synthetic data only, private Unix socket, no TCP.
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {testListingInvitations} from './test-listing-invitations-database.mjs';
const deps=resolve(process.argv[2]||'');if(deps!=='/private/tmp/trymybuild-invitation-tests')throw Error('Use isolated temporary test dependencies.');
const bins=await import(pathToFileURL(join(deps,'node_modules/@embedded-postgres/darwin-arm64/dist/index.js')).href);
const {default:pg}=await import(pathToFileURL(join(deps,'node_modules/pg/lib/index.js')).href);
const exec=promisify(execFile),scratch=await mkdtemp('/private/tmp/tmb-invitation-pg-'),data=join(scratch,'data'),socket=join(scratch,'socket');
await mkdir(socket,{mode:0o700});const clients=[];let server,logs='',success=false;
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const connect=async()=>{const c=new pg.Client({host:socket,port:55448,database:'postgres',user:'invitation_fixture',connectionTimeoutMillis:1500,statement_timeout:10000});await c.connect();clients.push(c);return c;};
try{
 await exec(bins.initdb,['-D',data,'-U','invitation_fixture','--auth-local=trust','--auth-host=reject','--encoding=UTF8','--locale=en_US.UTF-8'],{timeout:20000});
 server=spawn(bins.postgres,['-D',data,'-k',socket,'-h','','-p','55448'],{stdio:['ignore','pipe','pipe']});
 server.on('error',e=>logs+=e.message);for(const s of [server.stdout,server.stderr])s.on('data',b=>logs=(logs+b.toString()).slice(-6000));
 let admin;for(let i=0;i<100;i++){try{admin=await connect();break;}catch{if(server.exitCode!==null)throw Error(logs);await pause(50);}}
 if(!admin)throw Error('Disposable PostgreSQL did not start: '+logs);
 const f=await testListingInvitations({query:(sql,args)=>admin.query(sql,args),exec:sql=>admin.query(sql)});
 const a=await connect(),b=await connect();for(const c of [a,b])await c.query('set role service_role');
 const claim=(c,id)=>c.query('select cw_claim_listing_invitation($1,$2,$3,0,$4::jsonb)',[id,f.maker,f.email,JSON.stringify(f.content)]);
 async function blocked(client){for(let i=0;i<100;i++){const row=(await admin.query('select wait_event_type from pg_stat_activity where pid=$1',[client.processID])).rows[0];if(row?.wait_event_type==='Lock')return true;await pause(20);}return false;}
 const id=await f.invite();await a.query('begin');const first=await claim(a,id);const pending=claim(b,id);assert.equal(await blocked(b),true);await a.query('commit');const second=await pending;
 assert.equal(first.rows[0].cw_claim_listing_invitation.id,second.rows[0].cw_claim_listing_invitation.id);
 assert.equal(await f.value('select count(*)::int from projects where client_token=$1',['invitation-'+id]),1);
 // Admin edits and withdrawal serialize against the same invite lock and invalidate stale claims.
 for(const change of ['lock_version=lock_version+1',"revoked_at=now()"]){
  const next=await f.invite();await a.query('begin');await a.query('update listing_invitations set '+change+' where id=$1',[next]);const raced=claim(b,next).then(()=>({ok:true}),error=>({error}));assert.equal(await blocked(b),true);await a.query('commit');assert.ok((await raced).error);assert.equal(await f.value('select count(*)::int from projects where client_token=$1',['invitation-'+next]),0);
 }
 console.log('PASS: concurrent claim retries create exactly one draft; stale claims cannot race past administrator edits or withdrawal.');success=true;
}catch(error){console.error('FAIL:',error.message);if(logs)console.error(logs);process.exitCode=1;}
finally{
 await Promise.all(clients.map(c=>c.end().catch(()=>{})));
 if(server&&server.exitCode===null){try{await exec(bins.pg_ctl,['-D',data,'-m','fast','-w','stop'],{timeout:10000});}catch{server.kill('SIGTERM');success=false;}}
 if(success)await rm(scratch,{recursive:true,force:false});else console.error('Synthetic diagnostics retained:',scratch);
}
