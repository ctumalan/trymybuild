// Essential draft recovery, independent of analytics consent. Session storage is
// a fallback for browsers that restrict local storage; both stay on this origin.
(() => {
 const key='creatorworks-listing-draft-v1';
 const stores=()=>['localStorage','sessionStorage'].flatMap(name=>{try{return [window[name]];}catch{return [];}});
 let lastSavedAt=0;
 const read=()=>{
   const saved=stores().flatMap(store=>{try{
     const value=JSON.parse(store.getItem(key)||'null');
     if(!value||typeof value!=='object'||Array.isArray(value))return [];
     return [{draft:value.draft&&typeof value.draft==='object'?value.draft:value,at:Number(value.savedAt)||0}];
   }catch{return [];}}).sort((a,b)=>b.at-a.at);
   lastSavedAt=Math.max(lastSavedAt,saved[0]?.at||0);
   return saved[0]?.draft||{};
 };
 const save=draft=>{
   read();
   lastSavedAt=Math.max(Date.now(),lastSavedAt+1);
   const payload=JSON.stringify({draft,savedAt:lastSavedAt});let saved=false;
   for(const store of stores())try{store.setItem(key,payload);if(store.getItem(key)===payload)saved=true;}catch{}
   return saved;
 };
 const clear=()=>{for(const store of stores())try{store.removeItem(key);}catch{}};
 window.CWListingStorage={read,save,clear};
})();
