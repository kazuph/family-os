/** Normal UI checks for isolated local book data; never inject authenticated RPC capabilities. */
export async function login(page: any, input: {base: string; username: string; password: string}) {
  await page.bringToFront();
  await page.goto(input.base);
  await page.getByRole('textbox', {name:'Username',exact:true}).fill(input.username);
  await page.getByRole('textbox', {name:'Password',exact:true}).fill(input.password);
  await page.getByRole('button', {name:'Sign in',exact:true}).click();
  await page.getByRole('link', {name:'Home',exact:true}).waitFor({state:'visible'});
  return {url:page.url(),body:await page.locator('body').innerText()};
}

/** Read the actual reader's progress and asset state through its rendered iframe. */
export async function readerProgress(page: any, input: {url: string; screenshot: string}) {
  await page.bringToFront();
  await page.goto(input.url);
  const reader=page.frameLocator('iframe').first();
  await reader.getByRole('button',{name:'本文',exact:true}).click();
  await reader.getByRole('button',{name:/読了済み/}).click();
  await reader.getByRole('button',{name:/読了にする/}).waitFor({state:'visible'});
  await page.reload();
  await reader.getByRole('button',{name:'本文',exact:true}).click();
  await reader.getByRole('button',{name:/読了にする/}).waitFor({state:'visible'});
  await reader.getByRole('button',{name:/読了にする/}).click();
  await reader.getByRole('button',{name:/読了済み/}).waitFor({state:'visible'});
  await page.reload();
  await reader.getByRole('button',{name:'本文',exact:true}).click();
  await reader.getByRole('button',{name:/読了済み/}).waitFor({state:'visible'});
  const body=await reader.locator('body').innerText();
  if(!body.includes('A preserved manuscript'))throw new Error('Manuscript missing');
  await page.screenshot({path:input.screenshot,fullPage:true});
  return {url:page.url(),body,progressToggledBothWaysWithReload:true};
}

/** Open the normal export action; a native save dialog requires a separate saved-file proof. */
export async function openExport(page: any, input: {format: 'HTML' | 'PDF'}) {
  await page.bringToFront();
  await page.getByRole('menuitem',{name:input.format,exact:true}).click();
  return {format:input.format,actionSubmitted:true,savedFileVerified:false};
}

/** Verify logout, a rejected password, and recovery through the actual sign-in form. */
export async function loginFailureRecovery(page: any, input: {username: string; password: string; wrongPassword: string}) {
  await page.getByRole('button',{name:'Open profile menu',exact:true}).click();
  await page.getByRole('menuitem',{name:'Sign out',exact:true}).click();
  await page.getByRole('textbox',{name:'Username',exact:true}).fill(input.username);
  await page.getByRole('textbox',{name:'Password',exact:true}).fill(input.wrongPassword);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByText('Invalid username or password',{exact:true}).waitFor({state:'visible'});
  await page.getByRole('textbox',{name:'Password',exact:true}).fill(input.password);
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('link',{name:'Home',exact:true}).waitFor({state:'visible'});
  return {logout:true,invalidPasswordRejected:true,recoveryLogin:true};
}

/** Only call on a disposable copied book: accepting permanently changes its accepted code. */
export async function acceptLegacyDraft(page: any, input: {screenshot: string}) {
  await page.getByText('New Chat',{exact:true}).click();
  const inspect = async () => {
    await page.getByRole('button',{name:'Code',exact:true}).click();
    await page.getByRole('button',{name:'server.js',exact:true}).first().click();
    const editor=page.getByRole('textbox').last();
    await editor.click();
    await editor.press('ControlOrMeta+End');
    await page.getByText('// Preserved unaccepted legacy edit',{exact:true}).waitFor({state:'visible'});
  };
  await inspect();
  await page.getByRole('button',{name:'Accept changes',exact:true}).click();
  await page.getByRole('button',{name:'Accept changes',exact:true}).waitFor({state:'hidden'});
  await page.reload();
  await inspect();
  if(await page.getByRole('button',{name:'Accept changes',exact:true}).count())throw new Error('Accepted edit still pending');
  await page.screenshot({path:input.screenshot,fullPage:true});
  return {accepted:true,reload:true,markerPersisted:true};
}

/** Only call on a separate disposable copy: discard cannot restore the pending proposal. */
export async function discardLegacyDraft(page: any, input: {screenshot: string}) {
  await page.getByRole('button',{name:'Discard…',exact:true}).click();
  await page.getByRole('button',{name:'Discard changes',exact:true}).click();
  await page.getByRole('button',{name:'Accept changes',exact:true}).waitFor({state:'hidden'});
  await page.reload();
  await page.getByRole('button',{name:'Code',exact:true}).click();
  await page.getByRole('button',{name:'server.js',exact:true}).first().click();
  const editor=page.getByRole('textbox').last();
  await editor.click();
  await editor.press('ControlOrMeta+End');
  const rendered=await editor.innerText();
  if(rendered.includes('Preserved unaccepted legacy edit'))throw new Error('Discarded draft survived');
  if(!rendered.includes('askTutor'))throw new Error('Accepted book server missing');
  if(await page.getByRole('button',{name:'Accept changes',exact:true}).count())throw new Error('Discarded changes still pending');
  await page.screenshot({path:input.screenshot,fullPage:true});
  return {discarded:true,reload:true,acceptedServerPreserved:true};
}

/** Cancel the real Pro request with the normal Stop action; never synthesize a tool error. */
export async function cancelProConsultation(page: any, input: {screenshot: string}) {
 await page.getByRole('combobox').fill('Cancellation verification only: call consultPro with question="Explain a careful derivation of the relation between fractions, ratios, and proportions with examples" and context="This is a local verification of a cancellable consultation; no book or code edits are requested". Do not read or modify any files, code, connections, or book data.');
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await page.getByText('Consulting DeepSeek V4 Pro',{exact:true}).first().waitFor({state:'visible',timeout:120000});
 await page.getByRole('button',{name:'Stop agent',exact:true}).click();
 await page.getByRole('button',{name:'Stop agent',exact:true}).waitFor({state:'hidden'});
 await page.getByText('Error: User requested to stop agent.',{exact:true}).waitFor({state:'visible'});
 await page.screenshot({path:input.screenshot,fullPage:true});
 return {body:await page.locator('body').innerText(),url:page.url()};
}

/** Recover from a cancelled consultation with a new explicit question and persist its actual output. */
export async function recoverProConsultation(page: any, input: {screenshot: string}) {
 await page.getByRole('combobox').fill('Recovery verification: call consultPro with question="Which chapter should be read first?" and context="Chapter A introduces fractions. Chapter B assumes fractions and introduces ratios." Then report its advice. Do not read or modify files, code, connections, or book data.');
 await page.getByRole('button',{name:'Send message',exact:true}).click();
 await page.getByRole('button',{name:'Stop agent',exact:true}).waitFor({state:'visible'});
 await page.getByRole('button',{name:'Stop agent',exact:true}).waitFor({state:'hidden',timeout:180000});
 const details=page.getByRole('button',{name:/Consulted DeepSeek V4 Pro Which chapter should be read first/}).last();
 await details.click();
 await page.getByText('Output',{exact:true}).last().waitFor({state:'visible'});
 const before=await page.locator('body').innerText();
 if(!before.includes('Chapter A introduces fractions. Chapter B assumes fractions and introduces ratios.')||!before.includes('Chapter A'))throw new Error('Recovered Pro answer missing');
 await page.reload();
 await page.getByRole('button',{name:/Consulted DeepSeek V4 Pro Which chapter should be read first/}).last().click();
 await page.getByText('Output',{exact:true}).last().waitFor({state:'visible'});
 const after=await page.locator('body').innerText();
 if(!after.includes('Chapter A introduces fractions. Chapter B assumes fractions and introduces ratios.')||!after.includes('Chapter A'))throw new Error('Recovered Pro history missing');
 await page.screenshot({path:input.screenshot,fullPage:true});
 return {before,after,recovered:true,reload:true,url:page.url()};
}

/** Verify that a deployment without Go offers no Go model and persists No agent selection. */
export async function noGoPicker(page: any, input: {url: string; screenshot: string}) {
 await page.goto(input.url);
 await page.getByRole('button',{name:'Select model',exact:true}).click();
 await page.getByRole('menuitem',{name:'No agent',exact:true}).waitFor({state:'visible'});
 const items=await page.getByRole('menuitem').allTextContents();
 if(items.some(text=>text.includes('OpenCode Go')))throw new Error('Go offered without deployment credential');
 await page.getByRole('menuitem',{name:'No agent',exact:true}).click();
 await page.reload();
 await page.getByRole('button',{name:'Select model',exact:true}).waitFor({state:'visible'});
 const selected=await page.getByRole('button',{name:'Select model',exact:true}).innerText();
 if(selected!=='No agent')throw new Error('No-agent selection lost');
 await page.screenshot({path:input.screenshot,fullPage:true});
 return {items,selected,noGoOffered:true,reload:true,url:page.url()};
}
