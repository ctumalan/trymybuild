import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { previewUrl,publicAddress,resolvePublic,fetchPreviewAsset } from '../src/server/preview-network.mjs';
const utilities=vm.createContext({});vm.runInContext(readFileSync(new URL('../preview-utils.js',import.meta.url),'utf8'),utilities);const utils=utilities.CWPreviewUtils;
test('capture accepts only public HTTP(S) links without credentials or special ports',()=>{
 assert.equal(previewUrl('https://creatorworks.vercel.app/path#section').href,'https://creatorworks.vercel.app/path');
 for(const url of ['file:///etc/passwd','ftp://site.com','http://localhost','http://127.0.0.1','http://2130706433','http://0x7f000001','http://[::1]','http://[::ffff:127.0.0.1]','https://foo.internal','https://user:pass@site.com','https://site.com:8080','https://site.com./'])assert.throws(()=>previewUrl(url),url);
});
test('DNS blocks private, loopback, metadata, reserved and mapped addresses',async()=>{
 for(const address of ['127.0.0.1','10.1.2.3','172.16.0.1','192.168.1.1','169.254.169.254','100.64.0.1','0.0.0.0','192.0.2.1','::1','fe80::1','fc00::1','::ffff:127.0.0.1'])assert.equal(publicAddress(address),false,address);
 assert.equal(publicAddress('8.8.8.8'),true);
 await assert.rejects(resolvePublic('public.site',async()=>[{address:'8.8.8.8',family:4},{address:'10.0.0.1',family:4}]));
});
function fakeNetwork(replies){
 let calls=0,pinned;const request=(_url,options,callback)=>{
  options.lookup('public.site',{},(_error,address)=>pinned=address);
  const req=new EventEmitter();req.destroy=error=>{if(error)req.emit('error',error);req.emit('close');};
  req.end=()=>{const response=new PassThrough();const next=replies[calls++]||{};response.statusCode=next.status||200;response.headers=next.headers||{'content-type':'text/html'};callback(response);response.end(next.body||'<html>Public page</html>');queueMicrotask(()=>req.emit('close'));};return req;
 };return {lookup:async()=>[{address:'8.8.8.8',family:4}],request,calls:()=>calls,pinned:()=>pinned};
}
const budget=()=>({requests:0,bytes:0,deadline:Date.now()+10000});
test('fetch pins validated DNS, rejects unsafe redirects and bounds redirect loops',async()=>{
 const net=fakeNetwork([]);await fetchPreviewAsset('https://public.site',budget(),0,net);assert.equal(net.pinned(),'8.8.8.8');
 const redirect=fakeNetwork([{status:302,headers:{location:'http://169.254.169.254/latest'}}]);await assert.rejects(fetchPreviewAsset('https://public.site',budget(),0,redirect));assert.equal(redirect.calls(),1);
 const loop=fakeNetwork(Array.from({length:6},()=>({status:302,headers:{location:'/again'}})));await assert.rejects(fetchPreviewAsset('https://public.site',budget(),0,loop));assert.equal(loop.calls(),4);
});
test('capture refuses exhausted time, request and byte budgets',async()=>{
 await assert.rejects(fetchPreviewAsset('https://public.site',{...budget(),requests:45},0,fakeNetwork([])));
 await assert.rejects(fetchPreviewAsset('https://public.site',{...budget(),deadline:0},0,fakeNetwork([])));
 await assert.rejects(fetchPreviewAsset('https://public.site',budget(),0,fakeNetwork([{body:Buffer.alloc(3000001)}])));
});
test('browser capture waits for visible content without waiting for global network idleness',()=>{
 const source=readFileSync(new URL('../src/server/preview-capture.mjs',import.meta.url),'utf8');
 assert.match(source,/waitUntil:'domcontentloaded'/);
 assert.match(source,/document\.images.*image=>image\.complete/);
 assert.doesNotMatch(source,/waitUntil:'networkidle2'/);
});
test('theme never emits arbitrary CSS and enforces readable text and button contrast',()=>{
 for(const color of ['#ffffff','#111111','#eeeeee','#227755','rgb(255, 200, 0)','url(https://bad.site)','rgba(0,0,0,0)']){
  const theme=utils.theme({background:color,color,accent:color,font:'x; background:url(evil)'});
  assert.ok(utils.contrast(theme.background,theme.text)>=4.5);assert.ok(utils.contrast(theme.accent,theme.onAccent)>=4.5);
  for(const key of ['background','text','accent','onAccent'])assert.match(theme[key],/^#[\da-f]{6}$/i);
  assert.ok(['serif','sans-serif','monospace'].includes(theme.font));
 }
 assert.equal(utils.theme({font:'Georgia, serif'}).font,'serif');assert.equal(utils.theme({font:'Inter, sans-serif'}).font,'sans-serif');
});
test('upload validation rejects scripts, huge and empty files; stored images are bounded',()=>{
 assert.equal(utils.fileError({type:'image/png',size:1000}),'');
 for(const file of [{type:'image/svg+xml',size:100},{type:'image/png',size:6000000},{type:'image/jpeg',size:0}])assert.ok(utils.fileError(file));
 assert.equal(utils.imageData('data:image/jpeg;base64,AAAA'),'data:image/jpeg;base64,AAAA');
 assert.equal(utils.imageData('data:image/svg+xml;base64,AAAA'),'');assert.equal(utils.imageData('data:image/jpeg;base64,'+'A'.repeat(900000)),'');
});
test('existing draft answers and image survive reload without 2000-character truncation',()=>{
 const image='data:image/jpeg;base64,'+'A'.repeat(8000),saved={title:'My draft',url:'https://public.site',does:'Helps',imageData:image,imageMode:'upload',category:'Music & audio'};
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const context=vm.createContext({CWPreviewUtils:utils,localStorage:{getItem:()=>JSON.stringify(saved)}});
 vm.runInContext(source.slice(source.indexOf('function readListingDraft()'),source.indexOf('const listingDraft =')),context);
 const result=context.readListingDraft();assert.equal(result.imageData,image);assert.equal(result.title,'My draft');assert.equal(result.category,'Music & audio');
});
test('late automatic results cannot overwrite a changed URL or manually chosen image',async()=>{
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');let finish;
 const context=vm.createContext({window:{CW_SERVER:true},state:{session:{authenticated:true}},CWPreviewUtils:utils,listingDraft:{url:'https://public.site',image:'',imageSourceUrl:'',imageData:''},listingUrl:v=>v,document:{querySelector:()=>null},saveListingDraft:()=>true,fetch:()=>new Promise(resolve=>finish=resolve),AbortController,setTimeout,clearTimeout});
 vm.runInContext(source.slice(source.indexOf('let listingCapture ='),source.indexOf('async function useListingScreenshot')),context);
 const pending=context.ensureListingScreenshot();context.invalidateListingCapture();context.listingDraft.imageData='chosen-image';
 finish({ok:true,json:async()=>({image:'data:image/jpeg;base64,AAAA'})});await pending;assert.equal(context.listingDraft.imageData,'chosen-image');
});
test('URL changes preserve owner uploads and automatic capture failures preserve the last good preview',async()=>{
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 const listingDraft={url:'https://new.site',image:'/api/project-image/mine',imageSourceUrl:'https://old.site',imageData:'data:image/jpeg;base64,AAAA',imageMode:'upload',imageHistory:'[]'};
 const context=vm.createContext({window:{CW_SERVER:true},state:{session:{authenticated:true}},CWPreviewUtils:utils,listingDraft,listingUrl:v=>v,document:{querySelector:()=>null},saveListingDraft:()=>true,fetch:async()=>({ok:false,json:async()=>({error:'Capture failed'})}),AbortController,setTimeout,clearTimeout});
 vm.runInContext(source.slice(source.indexOf('let listingCapture ='),source.indexOf('async function useListingScreenshot')),context);
 context.invalidateListingCapture();assert.equal(listingDraft.imageMode,'upload');assert.equal(listingDraft.imageData,'data:image/jpeg;base64,AAAA');
 await context.ensureListingScreenshot();assert.equal(listingDraft.imageData,'data:image/jpeg;base64,AAAA','upload is not automatically replaced');
 listingDraft.imageMode='automatic';await context.ensureListingScreenshot(true);assert.equal(listingDraft.image,'/api/project-image/mine');assert.equal(listingDraft.imageData,'data:image/jpeg;base64,AAAA','failed capture keeps last good preview');
});
test('guest preview captures before sign-in without refresh loops or repeat captures',async()=>{
 const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');let refreshes=0,captures=0;
 const context=vm.createContext({window:{CW_SERVER:true},state:{session:{authenticated:false}},CWPreviewUtils:utils,listingDraft:{url:'https://public.site',image:'',imageSourceUrl:'',imageData:''},listingUrl:v=>v,document:{querySelector:()=>null},saveListingDraft:()=>true,fetch:async()=>{captures++;return {ok:true,json:async()=>({image:'data:image/jpeg;base64,AAAA'})};},AbortController,setTimeout,clearTimeout});
 vm.runInContext(source.slice(source.indexOf('let listingCapture ='),source.indexOf('async function useListingScreenshot')),context);
 context.refreshListingPreview=()=>{refreshes++;if(refreshes>5)throw Error('Recursive preview refresh');void context.ensureListingScreenshot();};
 await context.ensureListingScreenshot();assert.equal(refreshes,2);assert.equal(captures,1);
 await context.ensureListingScreenshot();
 context.state.session.authenticated=true;await context.ensureListingScreenshot();
 assert.equal(captures,1);assert.equal(context.listingDraft.imageData,'data:image/jpeg;base64,AAAA');
});
