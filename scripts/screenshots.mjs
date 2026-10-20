// Captures du shell (clair/sombre) aux largeurs des références Angular (/workspace/review/examples/*-after.png).
// Usage : npm run build && npx vite preview --port 4173 & BASE_URL=http://localhost:4173 npm run screenshots
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE_URL ?? 'http://localhost:4173';
const out = process.env.OUT_DIR ?? '/workspace/review/react/step1';
const widths = [375, 768, 1024, 1440];
const pages = [
  { name: 'ui-showcase', path: '/ui-showcase' },
  { name: 'app_dashboard', path: '/examples/app/dashboard' },
];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
for (const mode of ['light', 'dark']) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    await ctx.addInitScript((m) => localStorage.setItem('ui-kit-theme', m), mode);
    const page = await ctx.newPage();
    for (const p of pages) {
      await page.goto(base + p.path);
      await page.waitForSelector('h1');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${out}/${p.name}-${w}-${mode}.png` });
    }
    await ctx.close();
  }
}
await browser.close();
console.log('captures écrites dans', out);
