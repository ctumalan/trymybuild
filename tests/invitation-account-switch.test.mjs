import test from 'node:test';
import assert from 'node:assert/strict';
import {moduleFixture} from '../scripts/workspace-fixtures.mjs';
import {feedbackDestination} from '../src/server/feedback-policy.mjs';
const path='/listing-invitation/87829b6d-f5bb-4a3d-afd1-c823a3d812f0.'+'a'.repeat(64);
function fixture(next,{origin='https://trymybuild.com',session=''}={}){
 const deleted=[],logouts=[];
 const POST=moduleFixture('src/pages/auth/sign-out.ts',['POST'],{Response,URL,SESSION_COOKIE:'session',feedbackDestination,sameOrigin:(request,expected)=>request.headers.get('origin')===expected,origin:()=> 'https://trymybuild.com',env:()=> 'test-password',workos:()=>({userManagement:{loadSealedSession:()=>({getLogoutUrl:async options=>{logouts.push(options);return 'https://auth.example/logout';}})}})}).POST;
 const context={request:new Request('https://trymybuild.com/auth/sign-out',{method:'POST',headers:{origin},body:new URLSearchParams({next})}),cookies:{get:()=>session?{value:session}:undefined,delete:name=>deleted.push(name)},redirect:(location,status)=>new Response(null,{status,headers:{location}})};
 return {run:()=>POST(context),deleted,logouts};
}
test('account switch returns to the signed invitation through local and hosted logout',async()=>{
 const local=fixture(path);assert.equal((await local.run()).headers.get('location'),path);assert.ok(local.deleted.includes('session'));
 const hosted=fixture(path,{session:'sealed'});assert.equal((await hosted.run()).headers.get('location'),'https://auth.example/logout');assert.equal(hosted.logouts[0].returnTo,'https://trymybuild.com'+path);
});
test('account switch rejects external destinations and cross-origin logout',async()=>{
 for(const next of ['https://evil.example/','//evil.example/','/listing-invitation/invalid',path+'?next=https://evil.example'])assert.equal((await fixture(next).run()).headers.get('location'),'/');
 const crossOrigin=fixture(path,{origin:'https://evil.example'});assert.equal((await crossOrigin.run()).status,403);assert.deepEqual(crossOrigin.deleted,[]);
});
