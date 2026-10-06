// Replace only a disposable new book's manuscript through its ordinary Go agent conversation.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {login} from './localBooks.ts';
const root='/tmp/family-upstream-go-books';
const route=JSON.parse(readFileSync(root+'/opus-ui-route.json','utf8'));
const newBook=JSON.parse(readFileSync(root+'/opus-book-toc.json','utf8'));
assert.ok(newBook.initialReader.includes('はじめに'));
const {chromium}=createRequire('/Users/kazuph/node_modules/playwright-core/package.json')('playwright-core');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();
const result={url:newBook.url,logs:[],errors:[]};
page.on('console',m=>result.logs.push({type:m.type(),text:m.text()}));
page.on('pageerror',e=>result.errors.push(e.message));
try{
 await login(page,{base:route.url,username:route.username,password:'LegacyBookUi-20261005'});
 await page.goto(newBook.url);
 await page.getByRole('combobox',{name:'Start a new conversation…',exact:true}).waitFor();
 await page.getByRole('button',{name:'Select model',exact:true}).click();
 await page.getByRole('menuitem',{name:'DeepSeek V4 Flash (OpenCode Go)',exact:true}).click();
 if(!process.argv.includes('--observe')){
 const files=[{path:'content/toc.json',content:JSON.stringify({title:'Replacement TOC proof',parts:[{title:'Replacement part',chapters:[{id:'replacement',title:'Replacement chapter',file:'replacement.md'}]}]})},{path:'content/replacement.md',content:'# Replacement chapter\n\nA replacement manuscript.'}];
 const prompt='Replace only this book manuscript through the existing book gadget. Read its README if needed. Use executeCode and env.GADGET.putBookFiles('+JSON.stringify(files)+'). Then read env.GADGET.getBookFiles() and report the paths. Do not change gadget executable code, bindings, or any other gadget.';
 await page.getByRole('combobox').fill(prompt);
 await page.getByRole('button',{name:'Send message',exact:true,disabled:false}).click();
 await page.getByRole('button',{name:'Stop agent',exact:true}).waitFor();
 await page.getByRole('button',{name:'Stop agent',exact:true}).waitFor({state:'hidden',timeout:180000});
 result.conversation=await page.locator('body').innerText();
 }
 result.observeOnly=process.argv.includes('--observe');
 await page.reload();
 const reader=page.frameLocator('iframe').first();
 await reader.getByRole('button',{name:'本文',exact:true}).click();
 await reader.getByText('A replacement manuscript.',{exact:true}).waitFor();
 result.replacementReader=await reader.locator('body').innerText();
 assert.ok(result.replacementReader.includes('Replacement chapter'));
 assert.ok(!result.replacementReader.includes('はじめに'));
 await reader.getByRole('button',{name:'目次',exact:true}).click();
 result.toc=await reader.locator('body').innerText();
 assert.ok(result.toc.includes('Replacement chapter'));
 assert.ok(!result.toc.includes('はじめに'));
 await page.reload();
 await reader.getByRole('button',{name:'本文',exact:true}).click();
 await reader.getByText('A replacement manuscript.',{exact:true}).waitFor();
 result.reload=true;
 await page.screenshot({path:root+'/opus-book-replacement.png',fullPage:true});
}catch(e){result.failure={message:e.message,stack:e.stack};result.aria=await page.locator('body').ariaSnapshot();process.exitCode=1;}
finally{writeFileSync(root+'/opus-book-replacement.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();}
