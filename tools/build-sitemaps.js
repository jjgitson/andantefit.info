#!/usr/bin/env node
/* Node port of tools/build-sitemaps.py — same rules, same output.
   Kept because the build machine may not have python3. Either script may be
   run; they are expected to produce byte-identical sitemaps. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const SITE = 'https://andantefit.info/';
const ROOT = path.dirname(__dirname);

const SKIP_DIRS = ['includes/', 'assets/', 'docs/', 'tools/', '.git/'];
const SKIP_NAMES = ['404.html'];
const SKIP_PATTERNS = ['print', 'preview-', 'naver'];

const LOCALES = [['ko/', 'sitemap-ko.xml'], ['jp/', 'sitemap-jp.xml'],
                 ['es/', 'sitemap-es.xml'], ['ru/', 'sitemap-ru.xml'],
                 ['', 'sitemap-en.xml']];
const INDEX = 'sitemap-main.xml';
const CORE = 'sitemap-core.xml';
const CORE_URLS = ['index.html', 'ko/index.html', 'jp/index.html', 'es/index.html',
                   'ru/index.html', 'product.html', 'validation.html', 'references.html'];

// Local date, to match Python's date.today() rather than UTC.
const today = () => {
  // Local date, to match Python's date.today() rather than UTC.
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
};
const rstrip = (s, c) => s.endsWith(c) ? s.slice(0, -c.length) : s;

function gitDate(rel) {
  const dirty = spawnSync('git', ['diff', '--quiet', '--', rel], { cwd: ROOT }).status !== 0;
  if (dirty || !fs.existsSync(path.join(ROOT, rel))) return today();
  const out = execFileSync('git', ['log', '-1', '--format=%ad', '--date=short', '--', rel],
                           { cwd: ROOT, encoding: 'utf8' }).trim();
  return out || today();
}

function isPage(rel) {
  if (!rel.endsWith('.html')) return false;
  if (SKIP_DIRS.some(d => rel.startsWith(d)) || SKIP_NAMES.includes(path.basename(rel))) return false;
  if (SKIP_PATTERNS.some(p => rel.includes(p))) return false;
  const fd = fs.openSync(path.join(ROOT, rel), 'r');
  const buf = Buffer.alloc(8192);
  const n = fs.readSync(fd, buf, 0, 8192, 0);
  fs.closeSync(fd);
  const src = buf.slice(0, n).toString('utf8');
  const m = src.match(/rel="canonical"\s+href="([^"]+)"/);
  if (!m) return true;                       // no canonical declared: its own page
  const self = [rstrip(SITE + rel, '/')];
  if (rel.endsWith('index.html')) self.push(rstrip(SITE + rel.slice(0, -'index.html'.length), '/'));
  return self.includes(rstrip(m[1], '/'));   // self-canonical only
}

const urlFor = rel => SITE + (rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel);

function collect(dir = ROOT, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (['.git', 'assets', 'includes', 'docs', 'tools'].includes(e.name)) continue;
      collect(path.join(dir, e.name), out);
    } else {
      const rel = path.relative(ROOT, path.join(dir, e.name)).split(path.sep).join('/');
      if (isPage(rel)) out.push(rel);
    }
  }
  return out;
}

const bucket = rel => (LOCALES.find(([p]) => rel.startsWith(p)) || [, 'sitemap-en.xml'])[1];

function writeUrlset(file, entries) {
  const body = entries.map(([loc, mod]) =>
    `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${mod}</lastmod>\n  </url>`).join('\n');
  fs.writeFileSync(path.join(ROOT, file),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${body}\n</urlset>\n`, 'utf8');
}

const pages = collect().sort();
const groups = Object.fromEntries(LOCALES.map(([, sm]) => [sm, []]));
for (const rel of pages) groups[bucket(rel)].push([urlFor(rel), gitDate(rel)]);
for (const [, sm] of LOCALES) {
  writeUrlset(sm, groups[sm]);
  console.log(sm.padEnd(18), String(groups[sm].length).padStart(3), 'URLs');
}
const core = CORE_URLS.filter(r => fs.existsSync(path.join(ROOT, r))).map(r => [urlFor(r), gitDate(r)]);
writeUrlset(CORE, core);
console.log(CORE.padEnd(18), String(core.length).padStart(3), 'URLs');

const stamp = today();
const children = [CORE, ...LOCALES.map(([, sm]) => sm)];
const rows = children.map(sm =>
  `  <sitemap>\n    <loc>${SITE}${sm}</loc>\n    <lastmod>${stamp}</lastmod>\n  </sitemap>`).join('\n');
fs.writeFileSync(path.join(ROOT, INDEX),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  `${rows}\n</sitemapindex>\n`, 'utf8');
console.log(INDEX.padEnd(18), String(children.length).padStart(3), 'child sitemaps');
console.log('\nTotal indexable pages:', pages.length);
