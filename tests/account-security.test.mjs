import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {signProof,validProof,signInDescription,revokeAllSessions} from '../src/server/account-security.mjs';
const secret='test-only-secret-which-is-at-least-32-characters';
test('security confirmation is signed, user/purpose bound, expires, and rejects tampering',()=>{
 const proof=signProof('u1','fresh',secret,1000);
 assert.equal(validProof(proof,'u1','fresh',secret,2000),true);
 for(const args of [['u2','fresh',secret,2000],['u1','challenge',secret,2000],['u1','fresh',secret,301000],['u1','fresh',secret,0],['u1','fresh','',2000]])assert.equal(validProof(proof,...args),false);
 assert.equal(validProof(proof+'x','u1','fresh',secret,2000),false);
 assert.equal(validProof(undefined,'u1','fresh',secret,2000),false);
});
test('provider labels distinguish Google from password and fail safely for unknown methods',()=>{
 assert.equal(signInDescription('GoogleOAuth'),'Google');
 assert.equal(signInDescription('Password'),'Email and password');
 assert.equal(signInDescription('made-up'),'Managed sign-in');
});
test('revoke-all paginates and revokes only the authenticated user active sessions',async()=>{
 const calls=[];
 const api={listSessions:async id=>{assert.equal(id,'u1');return {autoPagination:async()=>[{id:'s1',userId:'u1',status:'active'},{id:'s2',userId:'u1',status:'revoked'}]};},revokeSession:async args=>calls.push(args)};
 await revokeAllSessions(api,'u1');assert.deepEqual(calls,[{sessionId:'s1'}]);
});
test('revoke-all fails visibly for partial failure and never revokes a foreign session',async()=>{
 let called=false;
 const api={listSessions:async()=>({autoPagination:async()=>[{id:'s',userId:'other',status:'active'}]}),revokeSession:async()=>{called=true;}};
 await assert.rejects(revokeAllSessions(api,'u1'));assert.equal(called,false);
 api.listSessions=async()=>({autoPagination:async()=>[{id:'s',userId:'u1',status:'active'}]});
 api.revokeSession=async()=>{throw new Error('provider down');};
 await assert.rejects(revokeAllSessions(api,'u1'),/Some sessions/);
});
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
test('account actions enforce origin, session identity, method, explicit deletion confirmation and founder protection',()=>{
 const src=read('../src/pages/api/account-security.ts');
 assert.match(src,/sameOrigin/);assert.match(src,/accountSession\(context\)/);
 assert.match(src,/authenticationMethod !== 'Password'/);
 assert.match(src,/createPasswordReset\(\{email:session.user.email\}\)/);
 assert.match(src,/isFounder\(session.user.id/);assert.match(src,/validProof/);
 assert.match(src,/form.get\('confirmation'\)!=='DELETE'/);
 assert.doesNotMatch(src,/deleteUser|from\([^)]*\)\.delete\(/);
 assert.match(src,/eq\('user_id',member.id\)/);
});
test('deletion request schema is private and does not cascade erase shared data',()=>{
 const sql=read('../database/007_account_security.sql');
 assert.match(sql,/enable row level security/);assert.match(sql,/revoke all.*anon, authenticated/);
 assert.match(sql,/user_id uuid not null unique references public.users/);
 assert.doesNotMatch(sql,/on delete cascade|delete from|drop table/i);
 const admin=read('../src/pages/admin/account-requests.ts');assert.match(admin,/adminUser\(context\)/);
});
test('security remains in dashboard and old account navigation is preserved',()=>{
 const ui=read('../src/server/feedback-ui.ts');assert.match(ui,/\/dashboard\/security/);
 assert.match(ui,/active===key/);
 const page=read('../src/pages/dashboard/security.ts');assert.match(page,/'security',200,admin/);
 assert.match(page,/Submitting a request does not delete anything immediately/);
 assert.match(read('../src/pages/auth/callback.ts'),/validProof\(securityChallenge,result.user.id/);
});
