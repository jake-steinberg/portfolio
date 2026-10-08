// render.mjs: save tools/og-card/og-card.html as img/og-card.jpg (1200 × 630).
// A JPEG, since link previews load it on every share and some services cap the size.
//
// Needs Google Chrome, Node 22 or newer, and the local server running:
//     python3 tools/serve.py 5503
//     node tools/og-card/render.mjs
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGE = 'http://localhost:5503/tools/og-card/og-card.html';
const OUT = new URL('../../img/og-card.jpg', import.meta.url);
const PORT = 9335;

// a throwaway Chrome profile, so this never touches your own
const profile = mkdtempSync(join(tmpdir(), 'og-card-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--window-size=1200,630', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

let targets;
for (let i = 0; i < 40 && !targets; i++) {
  await sleep(400);
  try { targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); } catch { /* not up yet */ }
}
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const waiting = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const n = ++id; waiting.set(n, r); ws.send(JSON.stringify({ id: n, method, params })); });

await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url: PAGE });
await sleep(1500);
await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });   // wait for the fonts
const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'));
console.log('Saved', OUT.pathname);

ws.close();
await new Promise(r => { chrome.once('exit', r); chrome.kill(); });   // let Chrome finish before tidying up
rmSync(profile, { recursive: true, force: true, maxRetries: 5 });
