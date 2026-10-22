export function setupLanguage(url, request) {
 const selected=url?.searchParams?.get('lang');
 if(['en','es'].includes(selected))return selected;
 const preferred=(request?.headers?.get('accept-language')||'').split(',').map(value=>{
  const [tag,...options]=value.trim().split(';');
  const q=Number(options.find(v=>v.trim().startsWith('q='))?.trim().slice(2)??1);
  return {language:tag.toLowerCase().split('-')[0],q:Number.isFinite(q)?q:0};
 }).filter(value=>['en','es'].includes(value.language)&&value.q>0).sort((a,b)=>b.q-a.q);
 return preferred[0]?.language||'en';
}
export function invitationSetupPath(token,language='en',save=false) {
 const query=new URLSearchParams({lang:language==='es'?'es':'en'});
 if(save)query.set('step','save');
 return '/listing-invitation/'+token+'?'+query;
}
export function publishSetupPath(slug,language='en') {
 return '/dashboard/publish?'+new URLSearchParams({project:slug,lang:language==='es'?'es':'en'});
}
