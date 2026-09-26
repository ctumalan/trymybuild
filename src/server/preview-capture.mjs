import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import { fetchPreviewAsset,previewUrl } from './preview-network.mjs';
import path from 'node:path';
let busy=false;
export async function capturePreview(value) {
 if(busy)throw Error('Another preview is being captured. Please retry in a moment.');
 busy=true;let browser;let timer;
 const budget={requests:0,bytes:0,deadline:Date.now()+18000};
 try{
  const url=previewUrl(value).href;
  const main=await fetchPreviewAsset(url,budget);
  if(!main.contentType.includes('text/html'))throw Error('Please use a webpage link, or upload an image below.');
  if(process.platform!=='linux')throw Error('Automatic capture runs on the live site. You can upload a screenshot here.');
  browser=await puppeteer.launch({args:[...chromium.args,'--disable-background-networking','--host-resolver-rules=MAP * ~NOTFOUND'],executablePath:await chromium.executablePath(path.join(process.cwd(),'node_modules/@sparticuz/chromium/bin')),headless:true,timeout:10000});
  timer=setTimeout(()=>void browser?.close(),Math.max(1,budget.deadline-Date.now()));
  const page=await browser.newPage();
  await page.setViewport({width:1280,height:800,deviceScaleFactor:1});
  await page.setJavaScriptEnabled(false);
  await page.setBypassServiceWorker(true);
  await page.setCacheEnabled(false);
  await page.setRequestInterception(true);
  page.on('request',request=>{
   void(async()=>{
    if(!['document','stylesheet','image','font'].includes(request.resourceType())||request.method()!=='GET'||(request.resourceType()==='document'&&request.frame()!==page.mainFrame())){await request.abort();return;}
    const asset=request.url()===main.url&&request.resourceType()==='document'?main:await fetchPreviewAsset(request.url(),budget);
    if(request.isInterceptResolutionHandled())return;
    await request.respond({status:asset.status,contentType:asset.contentType,body:asset.body,headers:{'Content-Security-Policy':"script-src 'none'; connect-src 'none'; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'none'",'X-Content-Type-Options':'nosniff'}});
   })().catch(()=>{if(!request.isInterceptResolutionHandled())void request.abort().catch(()=>{});});
  });
  // Waiting for global network idleness is slow on modern sites and unnecessary here:
  // scripts, trackers, frames and background requests are already blocked above.
  await page.goto(main.url,{waitUntil:'domcontentloaded',timeout:8000});
  // Give visible images a short, bounded chance to finish without holding the whole
  // listing flow open for a site's analytics or other non-visual traffic.
  await page.waitForFunction(()=>[...document.images].every(image=>image.complete),{timeout:2500}).catch(()=>{});
  const appearance=await page.evaluate(()=>{
   const body=document.body,style=getComputedStyle(body),heading=document.querySelector('h1,h2'),action=document.querySelector('button,a[class*="button"],input[type="submit"]');
   return {text:body?.innerText?.trim().length||0,images:document.images.length,background:style.backgroundColor,color:style.color,accent:action?getComputedStyle(action).backgroundColor:style.color,font:heading?getComputedStyle(heading).fontFamily:style.fontFamily};
  });
  if(appearance.text<30&&appearance.images===0)throw Error('This site needs an interactive browser. Upload a screenshot below.');
  const image=await page.screenshot({type:'jpeg',quality:78,fullPage:false});
  return {image:`data:image/jpeg;base64,${Buffer.from(image).toString('base64')}`,appearance,capturedAt:new Date().toISOString(),sourceUrl:url};
 }finally{clearTimeout(timer);if(browser)await browser.close().catch(()=>{});busy=false;}
}
