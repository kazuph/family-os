// Verify a new bundled book and a replacement TOC through normal UI, never injected gadget calls.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {login} from './localBooks.ts';
const root='/tmp/family-upstream-go-books';
const route=JSON.parse(readFileSync(root+'/opus-ui-route.json','utf8'));
const {chromium}=createRequire('/Users/kazuph/node_modules/playwright-core/package.json')('playwright-core');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();
const result={logs:[],errors:[]};
page.on('console',m=>result.logs.push({type:m.type(),text:m.text()}));
page.on('pageerror',e=>result.errors.push(e.message));
try{
 await login(page,{base:route.url,username:route.username,password:'LegacyBookUi-20261005'});
 await page.goto(route.url+'/blueprint/format.book');
 await page.getByText('Workspace Book',{exact:true}).first().waitFor();
 await page.getByRole('button',{name:'Configure',exact:true}).click();
 await page.getByRole('combobox',{name:'Choose an AI model',exact:true,disabled:false}).click();
 await page.getByText('DeepSeek V4 Flash (OpenCode Go)',{exact:true}).click();
 await page.getByRole('button',{name:'Save connection',exact:true}).click();
 await page.getByRole('button',{name:'Create Gadget',exact:true}).click();
 await page.waitForURL('**/workspace/*');
 const reader=page.frameLocator('iframe').first();
 await reader.getByRole('button',{name:'本文',exact:true}).click();
 result.initialReader=await reader.locator('body').innerText();
 assert.ok(result.initialReader.includes('はじめに'));
 result.url=page.url();result.aria=await page.locator('body').ariaSnapshot();
 await page.screenshot({path:root+'/opus-book-toc.png',fullPage:true});
}catch(e){result.failure={message:e.message,stack:e.stack};result.aria=await page.locator('body').ariaSnapshot();process.exitCode=1;}
finally{writeFileSync(root+'/opus-book-toc.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();}
