export type VerificationProgress={earned:number;hasPublished:boolean;verified:boolean;caseId:string|null;eligible:boolean};
export async function verificationProgress(db:any,userId:string):Promise<VerificationProgress>{
 const r=await db.rpc('cw_verification_progress',{p_user:userId});
 if(r.error||!r.data?.[0])throw Error('Verification progress unavailable');
 const s=r.data[0],earned=Number(s.earned);
 return {earned,hasPublished:s.has_published,verified:s.verified,caseId:s.case_id,eligible:s.has_published};
}
export function verificationCard(s:VerificationProgress){
 const title=s.verified?'You’re a Verified Creator':s.caseId?'Your identity review is pending':'Creator identity review';
 return `<section class="cw-panel"><h2>${title}</h2><p>${s.verified?'Your creator identity and connection to your work have been reviewed and approved.':'An approved published project makes you eligible to request a manual identity and ownership review. No credit target or participation score is required.'}</p>${s.verified?'':s.caseId?'<a class="secondary-button" href="/dashboard/help?case='+encodeURIComponent(s.caseId)+'">View your review request</a>':s.hasPublished?'<a class="secondary-button" href="/dashboard/verification">Request verification review</a>':'<a class="secondary-button" href="/dashboard?view=creator">Publish a project</a>'}<p class="cw-meta">The badge follows approval. It confirms identity and connection to your work, not product quality or safety.</p></section>`;
}
