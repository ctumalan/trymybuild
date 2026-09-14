import puppeteer from 'puppeteer-core';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await puppeteer.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{
 const page=await browser.newPage();await page.setContent('<button data-invite-project="sample">Share</button>');
 await page.evaluate(()=>{
  window.shared=[];window.requests=[];window.copied=[];
  window.fetch=async(url,options)=>{
   window.requests.push({url,options});
   if(url.includes('invitation-image'))return new Response('sample PNG',{headers:{'Content-Type':'image/png'}});
   return new Response(JSON.stringify({name:'Sample <project>',description:'A & B',category:'Utilities',builder:'Builder',image:'https://trymybuild.com/api/invitation-image/sample.png',url:'https://trymybuild.com/projects/sample'}));
  };
  Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});
  Object.defineProperty(navigator,'share',{configurable:true,value:async data=>window.shared.push({files:data.files.map(f=>({name:f.name,type:f.type})),text:data.text})});
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{write:async items=>{const values={};for(const [type,blob] of Object.entries(items[0].data))values[type]=await blob.text();window.copied.push(values);}}});
  window.ClipboardItem=class {constructor(data){this.data=data;}};
 });
 await page.addScriptTag({content:await readFile('share-invitation.js','utf8')});
 await page.click('[data-invite-project]');await page.waitForSelector('#invite-message');
 assert.equal(await page.$('[data-invite-action="pdf"]'),null);
 assert.match(await page.$eval('[data-invite-action="email"]',e=>e.textContent),/Email with image/);
 await page.click('.invitation-send-menu summary');await page.click('[data-invite-action="email"]');
 await page.waitForSelector('[data-image-download]:not([hidden])');
 assert.equal(await page.$eval('[data-image-download]',e=>e.download),'sample-invitation.png');
 assert.equal(await page.$eval('[data-invite-action="image-share"]',e=>e.hidden),true);
 await page.$eval('#invite-message',e=>{e.value='A revised <invitation>';e.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.click('[data-invite-action="email-copy"]');
 await page.waitForFunction(()=>window.copied.length===1);
 const copied=await page.evaluate(()=>window.copied[0]);
 assert.match(copied['text/html'],/A revised &lt;invitation&gt;/);assert.match(copied['text/html'],/<img src="https:/);assert.match(copied['text/plain'],/https:\/\/trymybuild.com\/projects\/sample/);
 await page.evaluate(()=>Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true}));
 await page.click('.invitation-send-menu summary');await page.click('[data-invite-action="email"]');await page.click('[data-invite-action="image-share"]');
 assert.deepEqual(await page.evaluate(()=>window.shared[0].files),[{name:'sample-invitation.png',type:'image/png'}]);
 assert.match(await page.evaluate(()=>window.shared[0].text),/A revised <invitation>[\s\S]*https:/);
 await page.click('.invitation-extra-documents summary');
 const setFile=async(name,contents)=>page.$eval('#invite-document',(el,{name,contents})=>{const data=new DataTransfer();data.items.add(new File([contents],name,{type:'application/pdf'}));el.files=data.files;el.dispatchEvent(new Event('change',{bubbles:true}));},{name,contents});
 await setFile('instructions.pdf','%PDF-1.4 instructions');await page.waitForFunction(()=>document.querySelector('[data-document-status]').textContent.includes('ready'));
 await page.click('[data-invite-action="image-share"]');
 assert.equal(await page.evaluate(()=>window.shared.at(-1).files[1].name),'instructions.pdf');
 await page.click('[data-invite-action="email-copy"]');await page.waitForFunction(()=>document.querySelector('[data-invite-status]').textContent.includes('Attach instructions.pdf'));assert.match(await page.$eval('[data-invite-status]',e=>e.textContent),/Attach instructions.pdf separately/);
 await page.click('[data-invite-action="remove-document"]');await page.click('[data-invite-action="image-share"]');assert.equal(await page.evaluate(()=>window.shared.at(-1).files.length),1);
 await setFile('fake.pdf','not a PDF');await page.waitForFunction(()=>document.querySelector('[data-document-status]').textContent.includes('does not appear'));
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('Cancelled','AbortError');}}));await page.click('[data-invite-action="image-share"]');assert.equal(await page.$eval('[data-email-controls]',e=>e.hidden),false);
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new Error('Unsupported');}}));await page.click('[data-invite-action="image-share"]');assert.match(await page.$eval('[data-invite-status]',e=>e.textContent),/Download the PNG/);
 assert.equal(await page.evaluate(()=>window.requests.some(r=>r.url.includes('invitation-pdf')||r.options?.method==='POST')),false);
 await page.click('.invite-close');assert.equal(await page.$('.invitation-dialog'),null);
 console.log('Browser checks passed: PNG default/download/share, formatted email and plain-text fallback, current message and link, optional PDF add/remove/validation, no PDF upload/generation, cancellation and sharing failure.');
}finally{await browser.close();}
