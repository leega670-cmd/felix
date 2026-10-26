// Install playwright and axe-core in WHA_QA_MODULE_ROOT before running.
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(`${process.env.WHA_QA_MODULE_ROOT || '/tmp/wha-browser-qa/node_modules'}/package.json`);
const {chromium,webkit,devices}=require('playwright');
const axePath=require.resolve('axe-core/axe.min.js');
const base=(process.env.WHA_QA_URL||'http://127.0.0.1:4173').replace(/\/$/,'');
const out=process.env.WHA_QA_OUTPUT||'/tmp/wha-qa-report';
await mkdir(out,{recursive:true});
const reports=[];
const widths=process.env.WHA_QA_PAGES_ONLY ? [] : [320,375,390,412,768,1440];
const errors=[];
async function noOverflow(page,label){
 const dimensions=await page.evaluate(()=>({viewport:innerWidth,width:document.documentElement.scrollWidth}));
 assert.ok(dimensions.width<=dimensions.viewport+1,`${label}: page overflow ${JSON.stringify(dimensions)}`);
}
async function access(page,label){
 await page.addScriptTag({path:axePath});
 const violations=await page.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));});
 assert.deepEqual(violations,[],`${label}: accessibility ${JSON.stringify(violations)}`);
}
async function birth(page,y,m,d){await page.selectOption('#year',String(y));await page.selectOption('#month',String(m));await page.selectOption('#day',String(d));}
for(const [name,engine,device] of [['chromium',chromium,devices['Pixel 7']],['webkit',webkit,devices['iPhone 13']]]){
 const browser=await engine.launch({headless:true});
 try{
 for(const width of widths)for(const theme of ['light','dark']){
  const label=`${name}-${width}-${theme}`;
  const context=await browser.newContext({...device,viewport:{width,height:844},locale:'ko-KR',timezoneId:'Asia/Seoul',colorScheme:theme,reducedMotion:'reduce'});
  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
  try{
   await page.clock.setFixedTime(new Date('2026-10-26T03:00:00Z'));
   const response=await page.goto(base+'/',{waitUntil:'domcontentloaded',timeout:45000});assert.equal(response.status(),200);
   await page.locator('#countryPicker option').last().waitFor({state:'attached'});
   assert.equal(await page.locator('#countryPicker option').count(),29);
   await noOverflow(page,label+' initial');
   if(width===390)await page.screenshot({path:`${out}/${label}-initial.png`});
   await page.locator('.search-button').click();assert.match(await page.locator('#birthError').innerText(),/모두 선택/);
   assert.equal(await page.locator('#year').evaluate(el=>document.activeElement===el),true);
   await birth(page,2026,10,27);await page.locator('.search-button').click();assert.match(await page.locator('#birthError').innerText(),/미래/);
   await birth(page,1998,10,26);await page.locator('.search-button').click();
   await page.locator('.results-heading').waitFor();
   assert.match(await page.locator('#allCountriesResult').innerText(),/만 26~30세/);
   assert.equal(await page.locator('[data-country-code="finland"]').count(),0);
   assert.equal(await page.locator('[data-country-code="japan"]').count(),0);
   await noOverflow(page,label+' results');
   const canada=page.locator('[data-country-code="canada"]');
   const details=canada.locator('details');
   await details.locator('summary').click();assert.equal(await details.evaluate(el=>el.open),true);
   await noOverflow(page,label+' disclosure');
   await access(page,label+' results');
   await canada.locator('.country-result-select').click();
   assert.equal(await page.locator('#countryPicker').inputValue(),'canada');
   await page.selectOption('#countryPicker','japan');assert.match(await page.locator('#result').innerText(),/예외 확인 필요/);
   await page.selectOption('#countryPicker','finland');assert.match(await page.locator('#result').innerText(),/발효 예정/);
   await page.selectOption('#countryPicker','canada');
   await birth(page,1990,10,27);await page.locator('.search-button').click();assert.match(await page.locator('#result').innerText(),/D-0/);
   await birth(page,1980,1,1);await page.locator('.search-button').click();assert.match(await page.locator('.results-heading').innerText(),/0개/);
   await noOverflow(page,label+' no results');
   await birth(page,2000,2,29);assert.equal(await page.locator('#day option').count(),30);
   await page.selectOption('#year','2001');assert.equal(await page.locator('#day').inputValue(),'');assert.equal(await page.locator('#day option').count(),29);
   await page.selectOption('#countryPicker','australia');
   assert.equal(await page.locator('#australiaCard').getAttribute('aria-pressed'),'true');
   const map=page.locator('.map-scroll');await map.evaluate(el=>{el.scrollLeft=el.scrollWidth;});
   if(width<768)assert.ok(await map.evaluate(el=>el.scrollLeft)>0);
   const oldTheme=await page.locator('html').getAttribute('data-theme');
   await page.locator('#themeToggle').click();await page.reload({waitUntil:'domcontentloaded'});
   assert.notEqual(await page.locator('html').getAttribute('data-theme'),oldTheme);
   assert.equal(pageErrors.length,0,`${label} runtime: ${pageErrors}`);
   reports.push({label,status:'pass'});console.log(`PASS ${label}`);
  }catch(e){errors.push({label,error:e.message});await page.screenshot({path:`${out}/${label}-failure.png`,fullPage:true}).catch(()=>{});console.log(`FAIL ${label}: ${e.message.slice(0,300)}`);}
  finally{await context.close();}
 }
 // Content pages, server status, and keyboard navigation in an actual mobile browser.
 const context=await browser.newContext({...device,viewport:{width:375,height:844},locale:'ko-KR'});
 const page=await context.newPage();
 try{
  for(const path of ['/about/','/privacy/','/contact/','/wha-qa-nonexistent']){
   const response=await page.goto(base+path,{waitUntil:'domcontentloaded'});assert.equal(response.status(),path.includes('nonexistent')?404:200);
   await noOverflow(page,`${name} ${path}`);await access(page,`${name} ${path}`);
  }
  const ja=await context.request.get(base+'/ja/',{maxRedirects:0});assert.equal(ja.status(),301);assert.equal(new URL(ja.headers().location,base).pathname,'/');
  const robots=await context.request.get(base+'/robots.txt');assert.match(await robots.text(),/^User-agent:/);
  const sitemap=await context.request.get(base+'/sitemap.xml');assert.match(await sitemap.text(),/<urlset/);assert.doesNotMatch(await sitemap.text(),/\/ja\//);
  const adstxt=await context.request.get(base+'/ads.txt');assert.match(await adstxt.text(),/pub-1671879642075474/);
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});await birth(page,1998,10,26);await page.locator('.search-button').click();
  const disclosure=page.locator('[data-country-code="canada"] summary');await disclosure.focus();await page.keyboard.press('Enter');
  assert.equal(await disclosure.evaluate(el=>el.parentElement.open),true);
  const button=page.locator('[data-country-code="japan"] .country-result-select');assert.equal(await button.count(),0);
  await page.locator('[data-country-code="canada"] .country-result-select').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#countryPicker').inputValue(),'canada');
  reports.push({label:`${name}-pages-http-keyboard`,status:'pass'});console.log(`PASS ${name}-pages-http-keyboard`);
 }catch(e){errors.push({label:`${name}-pages-http-keyboard`,error:e.message});console.log(`FAIL ${name}-pages-http-keyboard: ${e.message.slice(0,300)}`);}
 finally{await context.close();}
 }finally{await browser.close();}
}
await writeFile(`${out}/results.json`,JSON.stringify({base,checkedAt:new Date().toISOString(),reports,errors},null,2));
console.log(`Browser QA: ${reports.length} passed, ${errors.length} failed. Report: ${out}/results.json`);
if(errors.length)process.exitCode=1;
