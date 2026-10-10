// Snima sobu iza vrata (scripts/render-room) u Chromiumu i sprema PNG u scripts/render-room/out/.
// Upotreba: npx vite --port 5175 (u korijenu projekta), pa:
//   node scripts/render-room/render.mjs desktop   → 2400 × 1500
//   node scripts/render-room/render.mjs mobile    → 1200 × 2000
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const VARIANTS = {
  desktop: { w: 2400, h: 1500, fov: 46, z: 4.8, y: 1.5, shift: 0.05 },
  mobile: { w: 1200, h: 2000, fov: 60, z: 4.5, y: 1.45, shift: 0.04 },
};
const name = process.argv[2] || 'desktop';
const frames = Number(process.argv[3] || 24);
const v = VARIANTS[name];
const executablePath = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';
const browser = await chromium.launch({ executablePath, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on('console', (m) => m.type() === 'error' && console.error(m.text()));
page.on('pageerror', (e) => console.error(e.message));
const qs = new URLSearchParams(Object.entries(v).map(([k, x]) => [k, String(x)]));
await page.goto(`http://localhost:5175/scripts/render-room/index.html?${qs}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.renderReady, null, { timeout: 120000 });
await page.evaluate(() => window.renderReady);
const t0 = Date.now();
const url = await page.evaluate((n) => window.renderAccum(n), frames);
await mkdir('scripts/render-room/out', { recursive: true });
await writeFile(`scripts/render-room/out/room-${name}.png`, Buffer.from(url.split(',')[1], 'base64'));
console.log(name, `${frames} kadrova`, `${((Date.now() - t0) / 1000).toFixed(1)} s`);
await browser.close();
