// Normal password login and reader checks against the task-owned, same-storage cutover fixture.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const [fixturePath,evidenceDir]=process.argv.slice(2);
if(!fixturePath||!evidenceDir)throw new Error('Usage: productionCutover.mjs FIXTURE_JSON EVIDENCE_DIR');
const route=JSON.parse(readFileSync(fixturePath,'utf8'));
const {chromium}=createRequire('/Users/kazuph/node_modules/playwright-core/package.json')('playwright-core');
mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();
const result={console:[],errors:[],readers:[]};
page.on('console',message=>{if(message.type()==='error')result.console.push(message.text());});
page.on('pageerror',error=>result.errors.push(error.message));
try{
 await page.goto(route.url);
 await page.getByRole('textbox',{name:'Username',exact:true}).fill(route.username);
 await page.getByRole('textbox',{name:'Password',exact:true}).fill(route.password);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 const next=page.getByRole('button',{name:'Next',exact:true});
 await next.or(page.getByRole('link',{name:'Home',exact:true})).waitFor();
 if(await next.isVisible()){
  await next.click();
  await page.getByRole('button',{name:/DeepSeek V4 Flash \(OpenCode Go\)/}).click();
  await next.click();await page.getByRole('button',{name:"Let's build",exact:true}).click();
 }
 await page.getByRole('link',{name:'Home',exact:true}).waitFor();
 result.standardLogin=true;
 for(const [name,workspaceId,gadgetId,chapter] of [
  ['adult',route.workspaceId,route.gadgetId,'Legacy chapter'],
  ['child',route.child.workspaceId,route.child.gadgetId,'Child chapter'],
 ]){
  await page.goto(new URL(`/workspace/${workspaceId}?w=${gadgetId}`,route.url).href);
  await page.getByRole('button',{name:'Code',exact:true}).waitFor();
  const reader=page.frameLocator('iframe').first();
  await reader.getByText(chapter,{exact:true}).first().waitFor();
  await reader.getByText('読了済み ✓',{exact:true}).waitFor();
  if(name==='adult'){
   const image=reader.locator('article img');
   await image.scrollIntoViewIfNeeded();
   await image.evaluate(element=>element.decode());
   const dimensions=await image.evaluate(element=>({width:element.naturalWidth,height:element.naturalHeight}));
   assert.ok(dimensions.width>0&&dimensions.height>0);
   result.illustration=dimensions;
   await reader.getByRole('button',{name:'澪に聞く',exact:true}).click();
   await reader.getByText('Explain the preserved chapter in one sentence.',{exact:true}).waitFor();
   result.tutorBefore=await reader.locator('.messages').innerText();
   assert.ok(result.tutorBefore.length>'Explain the preserved chapter in one sentence.'.length);
   await reader.getByRole('button',{name:'本文',exact:true}).click();
  }
  await page.screenshot({path:resolve(evidenceDir,`${name}-reader.png`),fullPage:true});
  result.readers.push({name,url:page.url(),body:await reader.locator('body').innerText()});
  await page.reload();
  await reader.getByText(chapter,{exact:true}).first().waitFor();
  result.readers.push({name,reload:true,body:await reader.locator('body').innerText()});
  await reader.getByText('読了済み ✓',{exact:true}).waitFor();
  if(name==='adult'){
   await reader.getByRole('button',{name:'澪に聞く',exact:true}).click();
   await reader.getByText('Explain the preserved chapter in one sentence.',{exact:true}).waitFor();
   assert.equal(await reader.locator('.messages').innerText(),result.tutorBefore);
   result.tutorReplay=true;
   await reader.getByRole('button',{name:'本文',exact:true}).click();
  }
  if(name==='child'){
   await reader.getByRole('button',{name:'読了済み ✓',exact:true}).click();
   await reader.getByRole('button',{name:'この章を読了にする',exact:true}).waitFor();
   await page.reload();
   await reader.getByRole('button',{name:'この章を読了にする',exact:true}).waitFor();
   await reader.getByRole('button',{name:'この章を読了にする',exact:true}).click();
   await reader.getByRole('button',{name:'読了済み ✓',exact:true}).waitFor();
   await page.reload();
   await reader.getByRole('button',{name:'読了済み ✓',exact:true}).waitFor();
   result.adminChildProgressWrite=true;
  }
  await page.screenshot({path:resolve(evidenceDir,`${name}-reload.png`),fullPage:true});
 }
 await page.goto(new URL(`/workspace/${route.workspaceId}?w=${route.gadgetId}`,route.url).href);
 await page.getByText('New Chat',{exact:true}).first().click();
 await page.getByText('Preserved workspace conversation',{exact:true}).waitFor();
 await page.reload();
 await page.getByText('Preserved workspace conversation',{exact:true}).waitFor();
 result.workspaceHistory=true;
 await page.screenshot({path:resolve(evidenceDir,'workspace-chat-reload.png'),fullPage:true});
 await page.goto(new URL(`/workspace/${route.ordinaryId}`,route.url).href);
 await page.getByRole('button',{name:'Code',exact:true}).waitFor();
 result.ordinaryWorkspace=true;
 await page.screenshot({path:resolve(evidenceDir,'ordinary-document.png'),fullPage:true});
 assert.equal(result.readers.length,4);
 result.pass=true;
}catch(error){result.failure={message:error.message,stack:error.stack};result.page=await page.locator('body').ariaSnapshot();result.frames=await Promise.all(page.frames().map(async frame=>({url:frame.url(),body:await frame.locator('body').innerText().catch(()=>null),article:await frame.locator('article').innerHTML().catch(()=>null),images:await frame.locator('img').evaluateAll(images=>images.map(image=>({alt:image.alt,src:image.src.slice(0,80),width:image.naturalWidth}))).catch(()=>[])})));await page.screenshot({path:resolve(evidenceDir,'failure.png'),fullPage:true});process.exitCode=1;}
finally{writeFileSync(resolve(evidenceDir,'normal-ui.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({pass:result.pass,failure:result.failure,standardLogin:result.standardLogin,readers:result.readers.length}));await browser.close();}
