// Builds the static menu site into out/.
//
// source/ holds OTAS's menu files exactly as delivered. This script copies them and marks
// every price, date and contact detail with a data-m attribute, so src/menu.js can replace
// them in the browser with the latest values from the dashboard's public API. The values
// already in the HTML stay as the fallback when the API can't be reached.
//
// Usage: MENU_API_URL=https://dashboard.example.com node scripts/build.mjs
// No dependencies. Every replacement must match an exact number of times, or the build fails.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'source');
const outDir = path.join(root, 'out');

function rep(html, file, find, replacement, expectedCount = 1) {
  const count = html.split(find).length - 1;
  if (count !== expectedCount) {
    throw new Error(`[${file}] expected ${expectedCount} of ${JSON.stringify(find)}, found ${count}`);
  }
  return html.split(find).join(replacement);
}

// Marks shared by every page: contacts and the price-list date.
function markCommon(html, file, key) {
  html = rep(html, file, '<html lang="my">', `<html lang="my" data-menu-page="${key}">`);
  html = rep(html, file, '<span class="sel">09-790673433</span>', '<span class="sel" data-m="phone">09-790673433</span>');
  html = rep(html, file, '<span class="sel">info@otastechsolutions.com</span>', '<span class="sel" data-m="email">info@otastechsolutions.com</span>');
  html = rep(
    html,
    file,
    '<a href="https://www.otastechsolutions.com" target="_blank" rel="noopener">www.otastechsolutions.com</a>',
    '<a href="https://www.otastechsolutions.com" target="_blank" rel="noopener" data-m-href="websiteUrl" data-m="websiteLabel">www.otastechsolutions.com</a>'
  );
  html = rep(html, file, '၂၀၂၆ အောက်တိုဘာ', '<span data-m="priceDate">၂၀၂၆ အောက်တိုဘာ</span>', key === 'hardware' ? 2 : 1);
  return html;
}

// Per-page marks. Keys match the dashboard's menu placeholders (src/lib/menu/render.ts there).
const PAGE_MARKS = {
  index: [
    ['<p class="price-row"><b>၈၀,၀၀၀</b>', '<p class="price-row"><b data-m="commercialPrice">၈၀,၀၀၀</b>'],
    ['<p class="price-row"><b>၁၄၀,၀၀၀</b>', '<p class="price-row"><b data-m="enterprisePrice">၁၄၀,၀၀၀</b>'],
    ['<p class="price-row"><b>၁၅ သိန်းမှ</b>', '<p class="price-row"><b><span data-m="customLakh">၁၅</span> သိန်းမှ</b>'],
    // the AI rows and hardware cards are replaced as whole blocks
    ['<div class="ai-list">', '<div class="ai-list" data-m-rows="aiRows">'],
    ['<div class="hw">', '<div class="hw" data-m="hwCards">'],
  ],
  commercial: [['<b>၈၀,၀၀၀</b>', '<b data-m="price">၈၀,၀၀၀</b>']],
  enterprise: [['<b>၁၄၀,၀၀၀</b>', '<b data-m="price">၁၄၀,၀၀၀</b>']],
  custom: [
    ['<b>၁၅ သိန်းမှ</b>', '<b><span data-m="customLakh">၁၅</span> သိန်းမှ</b>'],
    ['အခြေခံမှာ ပါပြီးသား · ၁၅ သိန်း', 'အခြေခံမှာ ပါပြီးသား · <span data-m="customLakh">၁၅</span> သိန်း'],
    ['တည်ဆောက်ချိန် ၄ ပတ်ခန့်မှ', 'တည်ဆောက်ချိန် <span data-m="customWeeks">၄</span> ပတ်ခန့်မှ'],
    ['ငွေပေးချေ ၆၀% + ၄၀%', 'ငွေပေးချေ <span data-m="payFirstPct">၆၀</span>% + <span data-m="payLastPct">၄၀</span>%'],
    // the calculator starts from menu.js once the latest data has arrived (or the API failed)
    ['<script src="custom.js"></script>\n', ''],
  ],
  hardware: [['<section class="sec" aria-label="စက်ပစ္စည်း စာရင်း">', '<section class="sec" aria-label="စက်ပစ္စည်း စာရင်း" data-m-groups="hwGroups">']],
  'ai-facebook': aiMarks('၁၀', '၁–၂ ပတ်', '၉၅,၀၀၀ မှ'),
  'ai-telegram': aiMarks('၁၀', '၁–၂ ပတ်', '၉၅,၀၀၀ မှ'),
  'ai-viber': [
    ...aiMarks('၂၅', '၄–၆ ပတ်', '၇ သိန်းမှ'),
    ['AI မပါဘဲ Inbox ပဲဆို ၁၈ သိန်း', 'AI မပါဘဲ Inbox ပဲဆို <span data-m="inboxLakh">၁၈</span> သိန်း'],
  ],
};

function aiMarks(setupLakh, wait, monthly) {
  return [
    [`<b>${setupLakh} သိန်း</b>`, `<b><span data-m="setupLakh">${setupLakh}</span> သိန်း</b>`],
    [`<b>${wait}</b>`, `<b data-m="wait">${wait}</b>`],
    [`စတင်ပုံ · ${wait}`, `စတင်ပုံ · <span data-m="wait">${wait}</span>`],
    [`<b>${monthly}</b>`, `<b data-m="monthly">${monthly}</b>`],
  ];
}

// ---------- API address ----------
const apiUrl = (process.env.MENU_API_URL || '').trim().replace(/\/+$/, '');
if (apiUrl && !/^https?:\/\/[^\s"'<>]+$/.test(apiUrl)) {
  throw new Error(`MENU_API_URL must be an http(s) address, got: ${apiUrl}`);
}
if (!apiUrl) {
  console.warn('MENU_API_URL is not set: the site will show the prices built into the HTML only.');
}

// ---------- build ----------
fs.rmSync(outDir, { recursive: true, force: true });
fs.cpSync(sourceDir, outDir, { recursive: true });

for (const [key, marks] of Object.entries(PAGE_MARKS)) {
  const file = `${key}.html`;
  let html = fs.readFileSync(path.join(sourceDir, file), 'utf8').replace(/\r\n/g, '\n');
  html = markCommon(html, file, key);
  for (const [find, replacement] of marks) html = rep(html, file, find, replacement);
  html = rep(html, file, '</body>', '<script src="menu-config.js"></script>\n<script src="menu.js"></script>\n</body>');
  fs.writeFileSync(path.join(outDir, file), html);
}

fs.copyFileSync(path.join(root, 'src', 'menu.js'), path.join(outDir, 'menu.js'));
fs.writeFileSync(path.join(outDir, 'menu-config.js'), `window.MENU_API_URL = ${JSON.stringify(apiUrl)};\n`);
// the config changes with each deploy, so browsers must not keep an old copy
fs.writeFileSync(path.join(outDir, '_headers'), '/menu-config.js\n  Cache-Control: no-cache\n/menu.js\n  Cache-Control: no-cache\n');

console.log(`Built ${Object.keys(PAGE_MARKS).length} pages into out/` + (apiUrl ? ` (prices from ${apiUrl})` : ''));
