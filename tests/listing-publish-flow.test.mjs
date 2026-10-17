import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');

test('the final publish button saves, publishes, and opens the catalog listing',async()=>{
  const start=source.indexOf("document.addEventListener('submit', event => {\n  const form = event.target.closest('[data-listing-step], [data-listing-settings]')");
  const end=source.indexOf("document.addEventListener('click', async event =>",start);
  assert.ok(start>0&&end>start,'publish submit handler is present');

  const listeners={};
  const requests=[];
  const destinations=[];
  const status={textContent:''};
  const form={
    hasAttribute:name=>name==='data-listing-settings',
    querySelector:selector=>selector==='[data-listing-status]'?status:null,
  };
  const listingDraft={
    title:'BriefBuilder',url:'https://briefbuilder.example/',does:'Organize a creative idea.',
    helps:'Help someone understand it.',firstTry:'Describe one idea.',category:'Creative work',
    pricing:'Free',stage:'Idea',video:'',sharingPreference:'public',serverId:'project-1',
    serverSlug:'briefbuilder',serverStatus:'draft',accountOwner:'member-1',imageMode:'upload',
  };
  const context=vm.createContext({
    document:{addEventListener:(type,handler)=>{listeners[type]=handler;}},
    window:{CW_SERVER:true},state:{session:{authenticated:true,user:{id:'member-1'}}},
    listingDraft,listingStep:5,CWListingRules:{valid:()=>true},
    markListingFieldsForAttention:()=>null,listingUrl:value=>value,
    normalizeCategory:value=>value,saveListingDraft:()=>true,ensureListingScreenshot:async()=>{},
    self:{crypto:{randomUUID:()=> 'token-1'}},crypto:{randomUUID:()=> 'token-1'},
    fetch:async(_url,options)=>{
      const body=JSON.parse(options.body);requests.push(body.action);
      if(body.action==='save')return{ok:true,json:async()=>({project:{id:'project-1',slug:'briefbuilder',status:'draft'}})};
      if(body.action==='welcome')return{ok:true,json:async()=>({ok:true})};
      if(body.action==='submit')return{ok:true,json:async()=>({project:{id:'project-1',slug:'briefbuilder',status:'published'}})};
      throw new Error(`Unexpected action: ${body.action}`);
    },
    location:{assign:value=>destinations.push(value)},confirm:()=>true,render:()=>{},
    console,setTimeout,clearTimeout,
  });
  vm.runInContext(source.slice(start,end),context);

  listeners.submit({
    target:{closest:selector=>selector.includes('[data-listing-settings]')?form:null},
    submitter:{matches:selector=>selector==='[data-listing-save-publish]'},
    preventDefault(){},
  });
  await new Promise(resolve=>setImmediate(resolve));

  assert.deepEqual(requests,['save','welcome','submit']);
  assert.deepEqual(destinations,['/?catalog=briefbuilder']);
  assert.equal(listingDraft.serverStatus,'published');
});
