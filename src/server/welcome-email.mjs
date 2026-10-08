import {nextSetupStep, profileCompletion, projectCompletion} from './setup-completion.mjs';

const clean=value=>String(value||'').trim();
const escape=value=>clean(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const origin=value=>{try{return new URL(value||'https://trymybuild.com').origin;}catch{return 'https://trymybuild.com';}};

export function welcomeEmail({user={},profile={},project={},siteUrl}={}) {
  const app=projectCompletion(project),person=profileCompletion(profile);
  const firstName=clean(user.firstName)||clean(profile.display_name).split(/\s+/)[0]||'there';
  const title=clean(project.title)||'your app';
  const next=nextSetupStep(profile,project);
  const siteOrigin=origin(siteUrl);
  const dashboardUrl=new URL('/dashboard/overview',siteOrigin);
  if(project.slug)dashboardUrl.searchParams.set('started',project.slug);
  const logoUrl=new URL('/assets/brand/trymybuild-app-192.png',siteOrigin).href;
  const founderUrl=new URL('/assets/avatars/chris-nava-founder.jpg',siteOrigin).href;
  const aboutUrl=new URL('/?page=about',siteOrigin).href;
  const visibility=project.sharing_preference==='public'
    ? 'You chose public when ready. Your app is still private until you finish the required details and publish it yourself.'
    : 'Your app is saved privately. Only you can see the draft while you finish it.';
  const subject=`${title} has a home on TryMyBuild`;
  const text=[
    `Hi ${firstName},`, '',
    `Welcome to TryMyBuild. ${title} is safely in your dashboard.`, '',
    `App page: ${app.percent}% complete`,
    `Creator profile: ${person.percent}% complete`,
    `A good next step: ${next}`, '', visibility, '',
    'You do not need a perfect launch. Give people enough context to try one real thing, then let their questions show you what to improve.', '',
    `Continue setting up your app: ${dashboardUrl.href}`, '',
    'I built TryMyBuild because AI can help us make apps, but a real person can show us what is clear, useful, or confusing. I am glad you are here.', '',
    'Christian Tumalan', 'Founder, TryMyBuild',
  ].join('\n');
  const meter=(label,percent)=>`<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;gap:16px;margin-bottom:6px"><strong>${escape(label)}</strong><span>${percent}%</span></div><div style="height:8px;background:#eee8f5;border-radius:999px;overflow:hidden"><div style="width:${percent}%;height:100%;background:#7545ad;border-radius:999px"></div></div></div>`;
  const html=`<div style="max-width:600px;margin:0 auto;padding:32px 22px;color:#19372f;font:16px/1.55 Arial,sans-serif"><a href="${escape(siteOrigin)}" style="display:inline-block;text-decoration:none"><img src="${escape(logoUrl)}" width="54" height="54" alt="TryMyBuild" style="display:block;width:54px;height:54px;border:0;border-radius:14px"></a><p>Hi ${escape(firstName)},</p><h1 style="margin:10px 0 14px;font-size:30px;line-height:1.12">Your app has a place to grow.</h1><p>Welcome to TryMyBuild. <strong>${escape(title)}</strong> is safely in your dashboard.</p><div style="margin:24px 0;padding:18px;border:1px solid #dfd2ec;border-radius:16px;background:#fbf9fd">${meter('App page',app.percent)}${meter('Creator profile',person.percent)}<p style="margin:16px 0 0"><strong>A good next step:</strong> ${escape(next)}</p></div><p>${escape(visibility)}</p><p>You do not need a perfect launch. Give people enough context to try one real thing, then let their questions show you what to improve.</p><p style="margin:28px 0"><a href="${escape(dashboardUrl.href)}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#7545ad;color:#fff;text-decoration:none;font-weight:700">Continue setting up your app</a></p><table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:28px;border-collapse:collapse"><tr><td style="padding-right:12px;vertical-align:top"><a href="${escape(aboutUrl)}"><img src="${escape(founderUrl)}" width="52" height="52" alt="Christian Tumalan" style="display:block;width:52px;height:52px;border:0;border-radius:50%;object-fit:cover"></a></td><td style="vertical-align:top"><p style="margin:0 0 10px">I built TryMyBuild because AI can help us make apps, but a real person can show us what is clear, useful, or confusing. I am glad you are here.</p><p style="margin:0"><strong>Christian Tumalan</strong><br><span style="color:#675d70">Founder, TryMyBuild</span></p></td></tr></table></div>`;
  return {subject,text,html,dashboardUrl:dashboardUrl.href,logoUrl,founderUrl,aboutUrl,appCompletion:app.percent,profileCompletion:person.percent};
}

export async function sendWelcomeEmail({user,profile,project},deps={}) {
  const env=deps.env||(key=>process.env[key]||'');
  const apiKey=clean(env('RESEND_API_KEY')),email=clean(user?.email);
  if(!apiKey||!email)return {skipped:true};
  const message=welcomeEmail({user,profile,project,siteUrl:env('PUBLIC_APP_URL')});
  const response=await (deps.fetch||fetch)('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json','Idempotency-Key':`welcome/${project.id}`.slice(0,256)},body:JSON.stringify({from:clean(env('WELCOME_EMAIL_FROM'))||'Christian at TryMyBuild <notifications@trymybuild.com>',to:[email],subject:message.subject,text:message.text,html:message.html}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error(`Welcome email failed (${response.status})`);
  const result=await response.json().catch(()=>({}));
  return {sent:true,id:result.id||''};
}

export async function sendFirstProjectWelcome({db,user,member,project},deps={}) {
  const env=deps.env||(key=>process.env[key]||'');
  if(!clean(env('RESEND_API_KEY'))||!clean(user?.email))return {skipped:true};
  const account=await db.from('users').select('created_at').eq('id',member.id).single();
  if(account.error)throw account.error;
  const created=Date.parse(account.data?.created_at||'');
  if(!Number.isFinite(created)||Date.now()-created>7*24*60*60*1000)return {skipped:true};
  const key=`welcome-email:${member.id}`;
  const claim=await db.from('site_settings').insert({key,value:{status:'sending',projectId:project.id},updated_at:new Date().toISOString()});
  if(claim.error){if(claim.error.code==='23505')return {skipped:true};throw claim.error;}
  try{
    const profile=await db.from('profiles').select('display_name,avatar_path,identity_label,bio').eq('user_id',member.id).single();
    if(profile.error)throw profile.error;
    const sent=await sendWelcomeEmail({user,profile:profile.data,project},deps);
    if(sent.sent)await db.from('site_settings').update({value:{status:'sent',projectId:project.id,sentAt:new Date().toISOString()},updated_at:new Date().toISOString()}).eq('key',key);
    else await db.from('site_settings').delete().eq('key',key);
    return sent;
  }catch(error){await db.from('site_settings').delete().eq('key',key);throw error;}
}
