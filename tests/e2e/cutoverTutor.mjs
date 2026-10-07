// Exercise the original book's retained AI capability through normal UI after code cutover.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const [fixturePath,evidenceDir]=process.argv.slice(2);
if(!fixturePath||!evidenceDir)throw new Error('Usage: cutoverTutor.mjs FIXTURE_JSON EVIDENCE_DIR');
const route=JSON.parse(readFileSync(fixturePath,'utf8'));
const {chromium}=createRequire('/Users/kazuph/node_modules/playwright-core/package.json')('playwright-core');
mkdirSync(evidenceDir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();
const result={errors:[],console:[]};
page.on('console',message=>result.console.push({type:message.type(),text:message.text()}));
page.on('pageerror',error=>result.errors.push(error.message));
try{
 await page.goto(route.url);
 await page.getByRole('textbox',{name:'Username',exact:true}).fill(route.username);
 await page.getByRole('textbox',{name:'Password',exact:true}).fill(route.password);
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await page.getByRole('link',{name:'Home',exact:true}).waitFor();
 await page.goto(new URL(`/workspace/${route.workspaceId}?w=${route.gadgetId}`,route.url).href);
 const reader=page.frameLocator('iframe').first();
 await reader.locator('article').getByText('A preserved manuscript', {exact:false}).waitFor();
 await reader.getByRole('button',{name:'澪に聞く',exact:true}).click();
 const previous=await reader.locator('.messages').innerText();
 const answers=await reader.locator('.messages .assistant').count();
 await reader.getByRole('textbox',{name:'澪への質問',exact:true}).fill('What does x squared mean? Answer in one short sentence.');
 assert.equal(await reader.getByRole('textbox',{name:'澪への質問',exact:true}).inputValue(),'What does x squared mean? Answer in one short sentence.');
 await reader.getByRole('button',{name:'送信',exact:true}).click();
 result.afterClick={input:await reader.getByRole('textbox',{name:'澪への質問',exact:true}).inputValue(),messages:await reader.locator('.messages').innerText()};
 console.log('Normal UI submitted the new tutor request through the retained old AI binding');
 // Same live-response allowance as the existing book E2E gates.
 await reader.locator('.messages .assistant:not(.pending)').nth(answers).waitFor({timeout:120000});
 result.answer=await reader.locator('.messages .assistant:not(.pending)').last().innerText();
 assert.ok(result.answer.length>0);
 assert.ok(!result.answer.startsWith('Error:'));
 const current=await reader.locator('.messages').innerText();
 assert.ok(current.includes(previous));
 await page.reload();
 await reader.getByRole('button',{name:'澪に聞く',exact:true}).click();
 await reader.getByText(result.answer,{exact:true}).waitFor();
 assert.equal(await reader.locator('.messages').innerText(),current);
 result.reload=true;result.oldConversationPreserved=true;result.pass=true;
 await page.screenshot({path:resolve(evidenceDir,'retained-ai-tutor-reload.png'),fullPage:true});
}catch(error){result.failure=error.message;result.page=await page.locator('body').ariaSnapshot();result.frames=await Promise.all(page.frames().map(async frame=>({url:frame.url(),body:await frame.locator('body').innerText().catch(()=>null)})));await page.screenshot({path:resolve(evidenceDir,'failure.png'),fullPage:true});process.exitCode=1;}
finally{writeFileSync(resolve(evidenceDir,'tutor.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));await browser.close();}
