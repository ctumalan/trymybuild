import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('account and catalog cards offer Share while preserving detail and save actions',()=>{
 const ctx=vm.createContext({state:{saved:new Set(),communityPosts:[]},openedCatalogApps:new Set(),safeProjectUrl:String,projectCommentDraft:()=>'',projectCommentComposer:()=>'<form></form>',experienceCount:()=>0,creatorLink:()=>'',categoryIcon:()=>'',esc:String,projectFirstStep:()=> 'Try a feature.'});
 vm.runInContext(source.slice(source.indexOf('function productCard('),source.indexOf('function discover('))+source.slice(source.indexOf('function catalogRow('),source.indexOf('const projectPresentation =')),ctx);
 const products=vm.runInNewContext(source.match(/^const projects = (\[[\s\S]*?\n\]);/)[1]);
 for(const p of products){
  const compact=ctx.productCard(p,true),catalog=ctx.catalogRow(p);
  assert.ok(compact.includes(`data-share-product="${p.slug}"`));
  assert.ok(compact.includes(`aria-label="Share ${p.name}"`));
  assert.ok(catalog.includes(`data-share-product="${p.slug}"`));
  assert.ok(catalog.includes(`data-try-app="${p.slug}"`));
  assert.ok(catalog.includes(`data-product="${p.slug}"`));
  assert.ok(catalog.includes(`data-save="${p.slug}"`));
 }
 assert.match(source,/class="secondary-button detail-share" data-share-product=/);
});
test('shared project URLs lead to a dedicated recipient page',()=>{
 const ctx=vm.createContext({URL,location:{origin:'https://creatorworks.vercel.app'}});
 vm.runInContext(source.slice(source.indexOf('function productShareUrl('),source.indexOf('function loadOwnedProjectIntoDraft(')),ctx);
 assert.equal(ctx.productShareUrl('mealmap'),'https://creatorworks.vercel.app/projects/mealmap');
});
