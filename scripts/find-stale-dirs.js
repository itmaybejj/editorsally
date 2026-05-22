#!/usr/bin/env node
/**
 * find-stale-dirs.js — Identify built directories that don't match the
 * current i18n.paths translated slug for each (lang, page).
 *
 * `build-pages.js` now owns the English-slug alias redirects under each
 * language directory (e.g. /de/features/ → /de/funktionen/), so this
 * script reports only directories that no longer correspond to either
 * the current translated slug *or* its English-slug alias — typically
 * old translated slugs left behind after a rename.
 *
 * Usage:
 *   node scripts/find-stale-dirs.js              # report
 *   node scripts/find-stale-dirs.js --delete     # delete the dirs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { loadI18n, ROOT } = require('./lib/i18n-loader.js');

const i18n = loadI18n();
const action = process.argv.includes('--delete') ? 'delete' : 'report';

function findStale() {
  const stale = [];
  for (const lang of i18n.allLanguages) {
    if (lang === 'en') continue;
    const langDir = path.join(ROOT, lang);
    if (!fs.existsSync(langDir)) continue;
    // Both the current translated slug and the English-slug alias are
    // legitimate output locations; anything else is potentially stale.
    const expected = new Set();
    for (const slug of i18n.canonicalPaths) {
      if (slug === 'about') continue;
      expected.add(i18n.getPath(lang, slug));
      expected.add(slug); // English-slug alias (maintained by build)
    }
    for (const entry of fs.readdirSync(langDir)) {
      const p = path.join(langDir, entry);
      if (!fs.statSync(p).isDirectory()) continue;
      if (expected.has(entry)) continue;
      stale.push({ lang, name: entry, dir: p });
    }
  }
  return stale;
}

const stale = findStale();
if (stale.length === 0) {
  console.log('No stale dirs.');
  process.exit(0);
}

console.log(`${stale.length} stale dirs:`);
for (const s of stale) console.log(`  ${s.lang}/${s.name} (no current translation maps here)`);

if (action === 'delete') {
  for (const s of stale) fs.rmSync(s.dir, { recursive: true, force: true });
  console.log(`\nDeleted ${stale.length} directories.`);
}
