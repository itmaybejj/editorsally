#!/usr/bin/env node
/**
 * find-stale-dirs.js — Identify built directories that don't match the
 * current i18n.paths translated slug for each (lang, page).
 *
 * Usage:
 *   node scripts/find-stale-dirs.js              # report
 *   node scripts/find-stale-dirs.js --delete     # delete the dirs
 *   node scripts/find-stale-dirs.js --redirects  # overwrite index.html with a
 *                                                  meta-refresh + JS redirect
 *                                                  to the current translated
 *                                                  slug. (Static-site soft 301.)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { loadI18n, ROOT } = require('./lib/i18n-loader.js');

const i18n = loadI18n();
const action = process.argv.includes('--delete') ? 'delete'
  : process.argv.includes('--redirects') ? 'redirects'
  : 'report';

function findStale() {
  const stale = [];
  for (const lang of i18n.allLanguages) {
    if (lang === 'en') continue;
    const langDir = path.join(ROOT, lang);
    if (!fs.existsSync(langDir)) continue;
    const expected = new Set();
    for (const slug of i18n.canonicalPaths) {
      if (slug === 'about') continue;
      expected.add(i18n.getPath(lang, slug));
    }
    for (const entry of fs.readdirSync(langDir)) {
      const p = path.join(langDir, entry);
      if (!fs.statSync(p).isDirectory()) continue;
      if (expected.has(entry)) continue;
      if (!i18n.canonicalPaths.includes(entry)) continue;
      // entry is an English canonical slug that's not the current translated slug
      const canonicalSlug = entry; // entry equals the English slug
      const translatedSlug = i18n.getPath(lang, canonicalSlug);
      stale.push({ lang, canonicalSlug, translatedSlug, dir: p });
    }
  }
  return stale;
}

function redirectHtml(lang, translatedSlug, canonicalSlug) {
  const target = `/${lang}/${translatedSlug}/`;
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${target}">
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${target}">
  <title>Redirecting…</title>
</head>
<body>
  <p>Redirecting to <a href="${target}">${target}</a>…</p>
  <script>window.location.replace(${JSON.stringify(target)});</script>
</body>
</html>
`;
}

const stale = findStale();
if (stale.length === 0) {
  console.log('No stale dirs.');
  process.exit(0);
}

console.log(`${stale.length} stale dirs:`);
for (const s of stale) console.log(`  ${s.lang}/${s.canonicalSlug} → ${s.lang}/${s.translatedSlug}`);

if (action === 'delete') {
  for (const s of stale) fs.rmSync(s.dir, { recursive: true, force: true });
  console.log(`\nDeleted ${stale.length} directories.`);
} else if (action === 'redirects') {
  for (const s of stale) {
    const idxPath = path.join(s.dir, 'index.html');
    const html = redirectHtml(s.lang, s.translatedSlug, s.canonicalSlug);
    // Drop any other files in the stale dir to avoid serving stale assets,
    // then write the redirect stub. (Built dirs only contain index.html.)
    for (const f of fs.readdirSync(s.dir)) {
      if (f === 'index.html') continue;
      fs.rmSync(path.join(s.dir, f), { recursive: true, force: true });
    }
    fs.writeFileSync(idxPath, html);
  }
  console.log(`\nWrote ${stale.length} redirect stubs (meta-refresh + JS).`);
}
