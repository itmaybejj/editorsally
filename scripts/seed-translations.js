#!/usr/bin/env node
/**
 * seed-translations.js — One-shot manifest.translations seeder.
 *
 * For each (lang, page), if the translated fragment has all its translatable
 * nodes tagged with data-i18n-id (i.e. structural alignment succeeded during
 * migration), declare the translation current by copying source[page] hashes
 * to translations[lang][page]. Otherwise (structural mismatch) leave the
 * page's translations entry empty — the translation skill will need to do a
 * fresh alignment pass.
 *
 * This is intended to run once after the initial Phase 2 migration. The user
 * acknowledges that "current" here means "current as of the migration commit"
 * — any pre-migration drift between English and translations is implicitly
 * grandfathered. Pages with structural drift (about, license) are flagged
 * for a fresh translation pass instead.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadI18n, ROOT } = require('./lib/i18n-loader.js');
const { parseFragment, translatableNodes } = require('./lib/parse-fragment.js');

const i18n = loadI18n();
const MANIFEST_PATH = path.join(ROOT, 'assets', 'lang', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
manifest.translations = manifest.translations || {};

function fragmentPath(lang, page) {
  return path.join(ROOT, 'content', lang, `${page}.html`);
}

function allIdsPresent(mainNode) {
  const nodes = translatableNodes(mainNode);
  if (nodes.length === 0) return true;
  for (const n of nodes) {
    if (!n.getAttribute('data-i18n-id')) return false;
  }
  return true;
}

let seeded = 0, flagged = 0, missing = 0;
const flaggedDetail = [];

for (const lang of i18n.allLanguages) {
  if (lang === 'en') continue;
  manifest.translations[lang] = manifest.translations[lang] || {};
  for (const page of i18n.canonicalPaths) {
    const fragPath = fragmentPath(lang, page);
    if (!fs.existsSync(fragPath)) {
      missing++;
      continue;
    }
    const root = parseFragment(fs.readFileSync(fragPath, 'utf8'));
    const main = root.querySelector('main');
    if (!main) { missing++; continue; }
    if (allIdsPresent(main)) {
      // Declare current
      manifest.translations[lang][page] = { ...manifest.source[page] };
      seeded++;
    } else {
      // Leave empty — flag for fresh translation pass
      manifest.translations[lang][page] = {};
      flagged++;
      flaggedDetail.push(`${lang}/${page}`);
    }
  }
}

// Remove the legacy `languages` key now that we have the new schema.
if (manifest.languages) {
  delete manifest.languages;
}
manifest._doc = 'Source-of-truth segment hashes for English and per-language hash-last-translated-from. Maintained by normalize-segments.js (source) and the translations skill (translations). An empty translations[lang][page] object means every segment of that page needs a fresh translation pass.';
manifest.source_lang = 'en';

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

console.log(`Seeded ${seeded} (lang, page) pairs as current.`);
console.log(`Flagged ${flagged} pairs as needing fresh translation:`);
for (const f of flaggedDetail) console.log(`  - ${f}`);
if (missing) console.log(`(${missing} fragments not found.)`);
console.log(`Legacy "languages" key removed from manifest.`);
