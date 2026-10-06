// Runs real export UI against an isolated local fixture with an already-installed browser.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
import {join} from 'node:path';
const input=JSON.parse(readFileSync(process.argv[2],'utf8'));
const require=createRequire(input.playwrightPath+'/package.json');
const playwright=require(input.playwrightPath);
const browser=await playwright[input.browser].launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const logs=[],errors=[];
page.on('console',m=>logs.push({type:m.type(),text:m.text()}));
page.on('pageerror',e=>errors.push({message:e.message,stack:e.stack}));
const result={browser:input.browser,version:browser.version(),exports:[],logs,errors};
try {
 await page.goto(input.base);
 await page.getByRole('textbox',{name:'Username',exact:true}).fill(input.username);
 await page.getByRole('textbox',{name:'Password',exact:true}).fill(input.password);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByRole('link',{name:'Home',exact:true}).or(page.getByRole('button',{name:'Next',exact:true})).waitFor({state:'visible'});
 if(await page.getByRole('button',{name:'Next',exact:true}).isVisible()){
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByRole('button',{name:/DeepSeek V4 Flash \(OpenCode Go\)/}).click();
  await page.getByRole('button',{name:'Next',exact:true}).click();
  await page.getByRole('button',{name:"Let's build",exact:true}).click();
 }
 await page.getByRole('link',{name:'Home',exact:true}).waitFor({state:'visible'});
 result.standardLogin=true;
 await page.goto(input.url);
 const reader=page.frameLocator('iframe').first();
 await reader.getByRole('button',{name:'本文',exact:true}).click();
 await reader.getByText('A preserved manuscript with',{exact:false}).waitFor({state:'visible'});
 result.reader=await reader.locator('body').evaluate(async e=>{await document.fonts.ready;return {text:e.innerText,images:[...document.images].map(i=>({complete:i.complete,width:i.naturalWidth,height:i.naturalHeight})),math:document.querySelectorAll('.katex').length,fonts:[...document.fonts].map(f=>({family:f.family,status:f.status}))}});
 assert.ok(result.reader.text.includes('A preserved manuscript'));
 assert.ok(result.reader.math>0);
 assert.ok(result.reader.images.length>0&&result.reader.images.every(i=>i.complete&&i.width>0));
 result.savePickerType=await page.evaluate(()=>typeof window.showSaveFilePicker);
 assert.equal(result.savePickerType,'undefined','This verifies the naturally available Blob branch, never changes the save API.');
 for(const format of ['HTML','PDF']){
  await page.getByRole('button',{name:'Export Gadget',exact:true}).click();
  const item=page.getByRole('menuitem',{name:format,exact:true});await item.waitFor({state:'visible'});
  const [download]=await Promise.all([page.waitForEvent('download',{timeout:180000}),item.click()]);
  const failure=await download.failure();assert.equal(failure,null);
  const path=join(input.outputDir,`export-${input.browser}-old-book.${format.toLowerCase()}`);
  assert.ok(!existsSync(path),'Do not replace existing evidence.');await download.saveAs(path);
  const data=readFileSync(path);
  if(format==='HTML')assert.ok(data.toString().includes('A preserved manuscript'));
  else assert.equal(data.subarray(0,5).toString(),'%PDF-');
  result.exports.push({format,path,suggestedFilename:download.suggestedFilename(),bytes:data.length,saved:true});
 }
}catch(e){result.failure={message:e.message,stack:e.stack};process.exitCode=1;}
finally {writeFileSync(join(input.outputDir,`export-${input.browser}-ui-result.json`),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await context.close();await browser.close();}
