// Inspects files saved by the real application; never generates an export or a PDF.
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {join} from 'node:path';
const input=JSON.parse(readFileSync(process.argv[2],'utf8'));
const require=createRequire(input.playwrightPath+'/package.json');
const browser=await require(input.playwrightPath)[input.browser].launch({headless:true});
const html=join(input.outputDir,`export-${input.browser}-old-book.html`);
const pdf=join(input.outputDir,`export-${input.browser}-old-book.pdf`);
const fixture=JSON.parse(readFileSync(input.fixturePath,'utf8'));
const chapter=fixture.tables.book_files.find(file=>file.path==='content/legacy.md');
assert.equal(chapter?.content,'# Legacy chapter\n\nA preserved manuscript with $x^2$.');
const result={html,pdf,fixtureChapter:chapter.content,bodyImages:0};
try {
 const page=await browser.newPage();
 await page.goto(new URL('file://'+html).href);
 result.htmlState=await page.evaluate(async()=>{await document.fonts.ready;return {text:document.body.innerText,images:[...document.images].map(i=>({complete:i.complete,width:i.naturalWidth,height:i.naturalHeight})),math:document.querySelectorAll('.katex').length,fonts:[...document.fonts].map(f=>({family:f.family,status:f.status})),scripts:document.scripts.length}});
 assert.ok(result.htmlState.text.includes('A preserved manuscript'));
 assert.ok(result.htmlState.math>0);
 assert.ok(result.htmlState.images.length>0&&result.htmlState.images.every(i=>i.complete&&i.width>0));
 assert.equal(result.htmlState.scripts,0);
 result.pdfInfo=execFileSync('pdfinfo',[pdf],{encoding:'utf8'});
 result.pdfText=execFileSync('pdftotext',['-layout',pdf,'-'],{encoding:'utf8'});
 result.pdfImages=execFileSync('pdfimages',['-list',pdf],{encoding:'utf8'});
 result.pdfFonts=execFileSync('pdffonts',[pdf],{encoding:'utf8'});
 const pageMatch=result.pdfInfo.match(/^Pages:\s+(\d+)/m);assert.ok(pageMatch);
 result.pdfPages=Number(pageMatch[1]);assert.ok(result.pdfPages>0);
 assert.ok(result.pdfText.includes('A preserved manuscript'));
 assert.ok(result.pdfText.includes('Legacy chapter'));
 // This captured chapter contains text and math; reader avatars are outside the printed body.
 result.pdfImageCount=result.pdfImages.split('\n').filter(line=>/^\s*\d+\s+\d+\s+image\s/.test(line)).length;
 assert.equal(result.pdfImageCount,result.bodyImages);
 assert.ok(result.pdfFonts.includes('KaTeX'));
 result.pass=true;
}catch(e){result.failure={message:e.message,stack:e.stack};process.exitCode=1;}
finally {writeFileSync(join(input.outputDir,`export-${input.browser}-content-result.json`),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();}
