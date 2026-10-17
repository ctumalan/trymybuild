import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {moduleFixture} from '../scripts/workspace-fixtures.mjs';

const client=readFileSync(new URL('../listing-invitations.js',import.meta.url),'utf8');

test('a signed recipient can withdraw an unclaimed preview, while a claimed preview stays intact',async()=>{
 let row={id:'invite-id',lock_version:2,claimed_by:null,revoked_at:null},updated,conditions=[],writes=0;
 const query={update(value){updated=value;writes++;return query;},eq(key,value){conditions.push([key,value]);return query;},is(key,value){conditions.push([key,value]);return query;},select(){return query;},maybeSingle:async()=>({data:{id:row.id},error:null})};
 const scope={Response,Date,sameOrigin:()=>true,origin:()=> 'https://example.com',json:(body,status=200)=>Response.json(body,{status}),loadInvitation:async token=>token==='signed-token'?row:null,allowRequest:async()=>true,database:()=>({from:table=>{assert.equal(table,'listing_invitations');return query;}})};
 const POST=moduleFixture('src/pages/api/listing-invitation/[token]/decline.ts',['POST'],scope).POST;
 const context={params:{token:'signed-token'},request:{}};
 const success=await POST(context);assert.equal(success.status,200);assert.equal((await success.json()).declined,true);
 assert.equal(writes,1);assert.equal(updated.lock_version,3);assert.ok(updated.revoked_at);assert.deepEqual(conditions,[['id',row.id],['lock_version',2],['claimed_by',null],['revoked_at',null]]);
 row={...row,claimed_by:'member-id'};const claimed=await POST(context);assert.equal(claimed.status,409);assert.equal(writes,1);
 row={...row,claimed_by:null,revoked_at:new Date().toISOString()};const repeated=await POST(context);assert.equal(repeated.status,200);assert.equal(writes,1);
});

test('decline explains its effect, requires confirmation and leaves the creator website unchanged',()=>{
 assert.match(client,/Remove this private preview from TryMyBuild\?/);
 assert.match(client,/Your own website will not be affected\./);
 assert.match(client,/\/api\/listing-invitation\/.*\/decline/);
 assert.match(client,/This preview has been removed\./);
 assert.match(client,/Your own website has not been changed\./);
});
