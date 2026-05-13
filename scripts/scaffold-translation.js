#!/usr/bin/env node
/**
 * scaffold-translation.js — Create empty content/<langCode>/<page>.html
 * fragments for a new (or partial) language by copying the English fragments
 * verbatim. The English content serves as a placeholder for translation.
 *
 * Also seeds empty entries in manifest.json under translations[<langCode>],
 * which signals the /translations skill to do a fresh full-page pass.
 *
 * Requires: a `nav` entry for the language in assets/lang/i18n.js
 *           (otherwise build-pages.js can't render the chrome).
 *
 * Usage:
 *   node scripts/scaffold-translation.js <langCode> [page]
 *
 * Examples:
 *   node scripts/scaffold-translation.js fr           # all pages
 *   node scripts/scaffold-translation.js de about     # single page
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadI18n, ROOT } = require('./lib/i18n-loader.js');

const i18n = loadI18n();
const langArg = process.argv[2];
const pageArg = process.argv[3];

if (!langArg) {
  console.error('Usage: scaffold-translation.js <langCode> [page]');
  process.exit(1);
}
if (!i18n.allLanguages.includes(langArg)) {
  console.error(`"${langArg}" is not in i18n.allLanguages. Add it to assets/lang/i18n.js first.`);
  process.exit(1);
}
if (!i18n.nav[langArg]) {
  console.error(`No nav entry for "${langArg}" in assets/lang/i18n.js. Add one before scaffolding.`);
  process.exit(1);
}

const MANIFEST_PATH = path.join(ROOT, 'assets', 'lang', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
manifest.translations = manifest.translations || {};
manifest.translations[langArg] = manifest.translations[langArg] || {};

const pages = pageArg ? [pageArg] : i18n.canonicalPaths;

let created = 0, skipped = 0;
for (const page of pages) {
  const src = path.join(ROOT, 'content', 'en', `${page}.html`);
  const dest = path.join(ROOT, 'content', langArg, `${page}.html`);
  if (!fs.existsSync(src)) {
    console.error(`  - skip ${page}: ${src} not found`);
    skipped++;
    continue;
  }
  if (fs.existsSync(dest)) {
    console.log(`  - skip ${langArg}/${page}: fragment already exists`);
    skipped++;
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  // Empty manifest entry → /translations will treat every segment as new.
  manifest.translations[langArg][page] = {};
  console.log(`  + content/${langArg}/${page}.html`);
  created++;
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

console.log(`\nDone: ${created} scaffolded, ${skipped} skipped.`);
if (created > 0) {
  console.log(`\nNext: run /translations ${langArg} to populate, then`);
  console.log(`      node scripts/build-pages.js ${langArg}`);
}
