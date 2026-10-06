// Normal task-owned Chrome UI against the isolated review fixture; no RPC/auth injection.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire('/Users/kazuph/node_modules/playwright-core/package.json');
const {chromium}=require('playwright-core');
const root='/tmp/family-upstream-go-books';
const route=JSON.parse(readFileSync(root+'/opus-ui-route.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();
const result={console:[],errors:[]};
page.on('console',m=>result.console.push({type:m.type(),text:m.text()}));
page.on('pageerror',e=>result.errors.push(e.message));
try{
 await page.goto(route.url);
 await page.getByRole('textbox',{name:'Username',exact:true}).fill(route.username);
 await page.getByRole('textbox',{name:'Password',exact:true}).fill('LegacyBookUi-20261005');
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
 await page.goto(`${route.url}/workspace/${route.workspace}?w=${route.gadget}`);
 await page.getByRole('button',{name:'Code',exact:true}).waitFor();
 await page.getByText('Loading conversation…',{exact:true}).waitFor({state:'hidden'});
 await page.getByText('New Chat',{exact:true}).first().waitFor();
 result.histories=[];
 for(let index=0;index<4;index++){
  await page.getByText('New Chat',{exact:true}).nth(index).click();
  await page.getByRole('button',{name:'Back to conversations',exact:true}).waitFor();
  await page.getByText(/Preserve|Existing target conversation/).first().waitFor();
  await page.reload();
  await page.getByText(/Preserve|Existing target conversation/).first().waitFor();
  result.histories.push(await page.locator('body').innerText());
  await page.getByRole('button',{name:'Back to conversations',exact:true}).click();
  await page.getByText('New Chat',{exact:true}).first().waitFor();
 }
 for(const expected of ['Preserve accepted conversation','Preserve discarded conversation','Preserve my unaccepted code edit','Existing target conversation must remain'])assert.ok(result.histories.some(text=>text.includes(expected)),expected);
 const asset=readFileSync('packages/bundled-blueprints/blueprints/workspace-book/files/client.assets/%2Fcharacters%2Fmio.png/0000','utf8');
 const image=root+'/opus-existing-avatar.webp';
 writeFileSync(image,Buffer.from(asset.split(',')[1],'base64'));
 await page.getByRole('button',{name:'Select model',exact:true}).click();
 await page.getByRole('menuitem',{name:'DeepSeek V4 Flash (OpenCode Go)',exact:true}).click();
 await page.locator('input[type="file"]').setInputFiles(image);
 await page.getByText('The selected OpenCode Go model does not support this attachment type.',{exact:true}).waitFor();
 await page.getByText('Failed',{exact:true}).waitFor();
 result.flashImageRejected=true;
 await page.getByRole('button',{name:'Remove attachment',exact:true}).click();
 await page.getByRole('button',{name:'Select model',exact:true}).click();
 await page.getByRole('menuitem',{name:'GLM-5.3 Flash (OpenCode Go)',exact:true}).click();
 await page.locator('input[type="file"]').setInputFiles(image);
 await page.getByRole('button',{name:'Remove attachment',exact:true}).waitFor();
 await page.getByText('Uploading',{exact:true}).waitFor({state:'hidden'});
 await page.getByRole('combobox',{name:'Start a new conversation…',exact:true}).fill('Verify the attachment policy.');
 await page.getByRole('button',{name:'Send message',exact:true,disabled:false}).waitFor();
 assert.equal(await page.getByText('Failed',{exact:true}).count(),0);
 result.visionImageUploaded=true;
 await page.getByRole('button',{name:'Select model',exact:true}).click();
 await page.getByRole('menuitem',{name:'DeepSeek V4 Flash (OpenCode Go)',exact:true}).click();
 const rejected=page.waitForEvent('console',{predicate:m=>m.type()==='error'&&m.text().includes('does not support this attachment type')&&m.text().includes('Failed to create new chat')});
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 result.selectionReject=(await rejected).text();
 await page.reload();
 await page.getByText('New Chat',{exact:true}).first().waitFor();
 assert.equal(await page.getByText('New Chat',{exact:true}).count(),4);
 result.selectionChangeNoMessageSaved=true;
 result.snapshot=await page.locator('body').innerText();
 result.aria=await page.locator('body').ariaSnapshot();
 await page.screenshot({path:root+'/opus-ui-initial.png',fullPage:true});
}catch(e){result.failure={message:e.message,stack:e.stack};process.exitCode=1;}
finally{writeFileSync(root+'/opus-ui-initial.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();}
