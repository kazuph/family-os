// Uses the already-installed Playwright CLI and its task-owned browser. No browser installation.
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {login, readerProgress, openExport, loginFailureRecovery, acceptLegacyDraft, discardLegacyDraft, cancelProConsultation, recoverProConsultation, noGoPicker} from './localBooks.ts';
const checks = {login, readerProgress, openExport, loginFailureRecovery, acceptLegacyDraft, discardLegacyDraft, cancelProConsultation, recoverProConsultation, noGoPicker};
const [name, inputFile] = process.argv.slice(2);
if (typeof checks[name] !== 'function' || !inputFile) throw new Error('Usage: runLocalUi.mjs CHECK INPUT_JSON');
const input = JSON.parse(readFileSync(inputFile, 'utf8'));
const code = `async page => await (${checks[name].toString()})(page, ${JSON.stringify(input)})`;
const child = spawn('playwright-cli', ['-s=family-upstream-go-books','run-code',code], {stdio:'inherit'});
child.on('exit', exitCode => process.exit(exitCode ?? 1));
