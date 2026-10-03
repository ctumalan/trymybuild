import type {APIRoute} from 'astro';
import {timingSafeEqual} from 'node:crypto';
import {env,json,workos} from '../../../server/auth';
import {database,databaseReady} from '../../../server/database';
import {deliverActivityEmails} from '../../../server/activity-email.mjs';
export const maxDuration=180;
export const GET:APIRoute=async context=>{
 const secret=env('CRON_SECRET'),actual=Buffer.from(context.request.headers.get('authorization')||''),expected=Buffer.from('Bearer '+secret);
 if(!secret||actual.length!==expected.length||!timingSafeEqual(actual,expected))return json({error:'Unauthorized'},401);
 if(!databaseReady()||!env('RESEND_API_KEY')||!env('WORKOS_API_KEY'))return json({error:'Email delivery is not configured'},503);
 try{return json(await deliverActivityEmails(database(),{apiKey:env('RESEND_API_KEY'),from:env('PROJECT_REVIEW_FROM'),fetch,getUser:(id:string)=>workos().userManagement.getUser(id)}));}
 catch{return json({error:'Email queue unavailable'},503);}
};
