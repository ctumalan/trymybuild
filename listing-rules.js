// Shared browser/server rule. Word count is guidance; character limits bound storage.
(()=>{
 const count=value=>String(value||'').trim().split(/\s+/u).filter(word=>/[\p{L}\p{N}]/u.test(word)).length;
 const limit=key=>['does','headline'].includes(key)?140:500;
 globalThis.CWListingRules={count,limit,valid:(value,key)=>count(value)>0&&String(value||'').trim().length<=limit(key)};
})();
