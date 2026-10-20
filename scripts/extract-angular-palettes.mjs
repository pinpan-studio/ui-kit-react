// Relève, dans un build Angular servi localement, les 49 rôles M3 calculés pour chaque palette `theme-<id>`.
// Usage : ANGULAR_URL=http://localhost:4301 node scripts/extract-angular-palettes.mjs
import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'node:fs';

const url = process.env.ANGULAR_URL ?? 'http://localhost:4301';
const tokens = JSON.parse(readFileSync('/workspace/review/angular-design-tokens.json', 'utf8'));
const roles = Object.keys(tokens.color.light);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url + '/');
await page.waitForSelector('body.light, body.dark');
const ids = await page.evaluate(() =>
  [...document.styleSheets]
    .flatMap((s) => {
      try {
        return [...s.cssRules];
      } catch {
        return [];
      }
    })
    .map((r) => r.selectorText?.match(/^\.theme-([a-z]+)$/)?.[1])
    .filter(Boolean),
);
const out = {};
for (const id of [...new Set(ids)]) {
  out[id] = {};
  for (const mode of ['light', 'dark']) {
    out[id][mode] = await page.evaluate(
      ({ id, mode, roles }) => {
        const el = document.createElement('div');
        el.className = `${mode} theme-${id}`;
        document.body.appendChild(el);
        const probe = document.createElement('span');
        el.appendChild(probe);
        const res = {};
        for (const r of roles) {
          probe.style.color = `var(${r})`;
          const [rr, g, b] = getComputedStyle(probe).color.match(/\d+/g).map(Number);
          res[r.replace('--mat-sys-', '')] = '#' + [rr, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
        }
        el.remove();
        return res;
      },
      { id, mode, roles },
    );
  }
}
await browser.close();
writeFileSync('src/theme/palettes.generated.json', JSON.stringify(out, null, 1) + '\n');
console.log('palettes:', Object.keys(out).length, 'roles:', roles.length);
