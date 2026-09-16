import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
const source=await readFile(new URL('../src/server/verification.ts',import.meta.url),'utf8');
const {verificationProgress,verificationCard}=await import('data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const db=(data,error=null,type='independent')=>({from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{creator_type:type}})})})}),rpc:async(name,args)=>{assert.equal(name,'cw_badge_progress');assert.equal(args.p_user,'member');return {data,error};}});
test('review and creator thresholds require a published app, with failure closed',async()=>{
 for(const [reviews,creators,published,eligible] of [[4,3,true,false],[5,2,true,false],[5,3,false,false],[5,3,true,true],[6,4,true,true]]){
  const s=await verificationProgress(db([{reviews:String(reviews),creators,has_published:published,ownership_confirmed:false,verified:false,case_id:null}]),'member');
  assert.equal(s.eligible,eligible);assert.equal(s.earned,reviews);assert.equal(s.creators,creators);
 }
 await assert.rejects(verificationProgress(db(null,new Error('unavailable')),'member'));
});
test('verification shows progress and distinguishes contribution from app quality',()=>{
 const base={earned:2,creators:1,hasPublished:true,ownershipConfirmed:false,verified:false,caseId:null,eligible:false};
 assert.match(verificationCard(base),/2 \/ 5 qualifying reviews/);assert.match(verificationCard(base),/1 \/ 3 other creators/);assert.match(verificationCard(base),/Find an app to review/);
 assert.match(verificationCard({...base,earned:5,creators:3,eligible:true}),/Confirm app ownership/);
 assert.match(verificationCard({...base,caseId:'case-id'}),/View your review request/);
 assert.match(verificationCard({...base,verified:true}),/You’re a Verified Creator/);assert.match(verificationCard(base),/does not guarantee app quality/);
});

test('companies remain welcome without an independent badge target',async()=>{const s=await verificationProgress(db([{reviews:5,creators:3,has_published:true,ownership_confirmed:true,verified:false}],null,'company'),'member');assert.equal(s.eligible,false);assert.match(verificationCard(s),/Companies are welcome/);assert.doesNotMatch(verificationCard(s),/Confirm app ownership/);});
