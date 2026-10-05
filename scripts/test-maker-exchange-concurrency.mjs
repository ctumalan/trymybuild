// Native PostgreSQL; private Unix socket, no TCP, synthetic accounts only.
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import {testMakerExchange} from './test-maker-exchange-database.mjs';
const dependencies=resolve(process.argv[2]||'');
if(dependencies!=='/private/tmp/trymybuild-exchange-tests')throw Error('Use the isolated temporary test dependencies.');
const bins=await import(pathToFileURL(join(dependencies,'node_modules/@embedded-postgres/darwin-arm64/dist/index.js')).href);
const {default:pg}=await import(pathToFileURL(join(dependencies,'node_modules/pg/lib/index.js')).href);
const exec=promisify(execFile),scratch=await mkdtemp('/private/tmp/tmb-exchange-pg-'),data=join(scratch,'data'),socket=join(scratch,'socket');
await mkdir(socket,{mode:0o700});
const clients=[];let server,logs='',success=false;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const connect=async()=>{const client=new pg.Client({host:socket,port:55447,database:'postgres',user:'tmb_exchange_fixture',connectionTimeoutMillis:1500,statement_timeout:10000});await client.connect();clients.push(client);return client;};
try{
 await exec(bins.initdb,['-D',data,'-U','tmb_exchange_fixture','--auth-local=trust','--auth-host=reject','--encoding=UTF8','--locale=en_US.UTF-8'],{timeout:20000,maxBuffer:1024*1024});
 server=spawn(bins.postgres,['-D',data,'-k',socket,'-h','','-p','55447'],{stdio:['ignore','pipe','pipe']});
 server.on('error',error=>{logs+=error.message;});for(const stream of [server.stdout,server.stderr])stream.on('data',bytes=>{logs=(logs+bytes.toString()).slice(-6000);});
 let admin;for(let i=0;i<100;i++){try{admin=await connect();break;}catch{if(server.exitCode!==null)throw Error(logs);await pause(50);}}
 if(!admin)throw Error('Disposable database did not start: '+logs);
 const f=await testMakerExchange({query:(sql,args)=>admin.query(sql,args),exec:sql=>admin.query(sql)});
 const a=await connect(),b=await connect();for(const client of [a,b])await client.query('set role service_role');
 const members=await Promise.all(['h','i','j','k'].map(f.member));
 for(let i=0;i<members.length;i++)await f.project(members[i],'race-'+i);
 const ids=members.map(()=>randomUUID());
 const joinExchange=(client,i)=>client.query('select cw_join_maker_exchange($1,$2,$3,$4)',[members[i],ids[i],'race-'+i,f.question]);
 await joinExchange(admin,0);
 await a.query('begin');await joinExchange(a,1);
 const competing=joinExchange(b,2);
 let blocked=false;for(let i=0;i<100;i++){const row=(await admin.query('select wait_event_type from pg_stat_activity where pid=$1',[b.processID])).rows[0];if(row?.wait_event_type==='Lock'){blocked=true;break;}await pause(20);}
 assert.equal(blocked,true);await a.query('commit');await competing;
 assert.equal((await f.state(members[0])).partner.slug,'race-1');assert.equal((await f.state(members[1])).partner.slug,'race-0');assert.equal((await f.state(members[2])).state,'waiting');
 await a.query('begin');await joinExchange(a,3);
 const duplicate=joinExchange(b,3);await pause(30);await a.query('commit');await duplicate;
 assert.equal(Number(await f.one('select count(*) from maker_exchange_entries where user_id=$1',[members[3]])),1);
 assert.equal(Number(await f.one("select count(*) from notifications where user_id=$1 and title='Your maker feedback exchange is ready'",[members[3]])),1);
 console.log('PASS: independent concurrent joiners cannot claim the same maker; simultaneous retries create one entry and one notification.');
 success=true;
}catch(error){console.error('FAIL:',error.message);if(logs)console.error(logs);process.exitCode=1;}
finally{
 await Promise.all(clients.map(client=>client.end().catch(()=>{})));
 if(server&&server.exitCode===null){try{await exec(bins.pg_ctl,['-D',data,'-m','fast','-w','stop'],{timeout:10000});}catch{server.kill('SIGTERM');success=false;}}
 if(success)await rm(scratch,{recursive:true,force:false});else console.error('Synthetic diagnostics retained:',scratch);
}
