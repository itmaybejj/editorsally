#!/usr/bin/env node
/**
 * extract-translation-queue.js — Emit a per-language JSON queue of
 * segments needing translation, with the source English HTML inline.
 *
 * For each page in the language's manifest:
 *   - New segments (in source, not in translations[lang]) → queue
 *   - Changed segments (hashes differ) → queue
 *   - Orphan segments (in translations[lang], not in source) → noted for removal
 *
 * Output: scripts/scratch/queue-<lang>.json
 *
 * Usage: node scripts/extract-translation-queue.js <lang> [page]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadI18n, ROOT } = require('./lib/i18n-loader.js');
const { parseFragment, translatableNodes, isImg } = require('./lib/parse-fragment.js');

const i18n = loadI18n();
const lang = process.argv[2];
const pageArg = process.argv[3];

if (!lang) {
  console.error('Usage: extract-translation-queue.js <lang> [page]');
  process.exit(1);
}
if (!i18n.allLanguages.includes(lang) || lang === 'en') {
  console.error(`Invalid language: ${lang}`);
  process.exit(1);
}

const MANIFEST = path.join(ROOT, 'assets', 'lang', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const sourceHashes = manifest.source;
const langHashes = manifest.translations[lang] || {};
const pages = pageArg ? [pageArg] : i18n.canonicalPaths;

const IMG_TR_ATTRS = ['alt', 'aria-label', 'title', 'longdesc'];
const BLOCK_OWN_ATTRS = ['aria-label', 'title', 'placeholder'];

function nodesById(main) {
  const map = new Map();
  for (const n of translatableNodes(main)) {
    const id = n.getAttribute('data-i18n-id');
    if (id) map.set(id, n);
  }
  return map;
}

function collectAttrs(node, names) {
  const out = {};
  for (const a of names) {
    const v = node.getAttribute(a);
    if (v !== null && v !== undefined && v !== '') out[a] = v;
  }
  return out;
}

const queue = { lang, pages: {} };
let totalSegments = 0;

for (const page of pages) {
  const enPath = path.join(ROOT, 'content', 'en', `${page}.html`);
  if (!fs.existsSync(enPath)) continue;
  const html = fs.readFileSync(enPath, 'utf8');
  const root = parseFragment(html);
  const main = root.querySelector('main');
  if (!main) continue;
  const byId = nodesById(main);

  const src = sourceHashes[page] || {};
  const tr = langHashes[page] || {};
  const segs = {};
  const orphans = [];

  // New + changed
  for (const [id, srcHash] of Object.entries(src)) {
    if (tr[id] === srcHash) continue; // current
    const node = byId.get(id);
    if (!node) continue;
    if (isImg(node)) {
      const attrs = collectAttrs(node, IMG_TR_ATTRS);
      // Skip decorative (empty alt and nothing else translatable)
      if (Object.keys(attrs).length === 0) continue;
      if (attrs.alt === '') {
        // Decorative — record but don't put in queue
        continue;
      }
      segs[id] = { kind: 'img', attrs };
    } else {
      const inner = node.innerHTML;
      const ownAttrs = collectAttrs(node, BLOCK_OWN_ATTRS);
      segs[id] = { kind: 'block', inner_html: inner };
      if (Object.keys(ownAttrs).length > 0) segs[id].own_attrs = ownAttrs;
    }
  }

  // Orphans
  for (const id of Object.keys(tr)) {
    if (!(id in src)) orphans.push(id);
  }

  if (Object.keys(segs).length > 0 || orphans.length > 0) {
    queue.pages[page] = { segments: segs };
    if (orphans.length > 0) queue.pages[page].orphans = orphans;
    totalSegments += Object.keys(segs).length;
  }
}

const outDir = path.join(ROOT, 'scripts', 'scratch');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, `queue-${lang}.json`);
fs.writeFileSync(outPath, JSON.stringify(queue, null, 2) + '\n');

console.log(`${lang}: ${totalSegments} segments across ${Object.keys(queue.pages).length} pages → ${path.relative(ROOT, outPath)}`);
for (const [page, info] of Object.entries(queue.pages)) {
  console.log(`  ${page}: ${Object.keys(info.segments).length} segments` +
    (info.orphans ? `, ${info.orphans.length} orphans` : ''));
}
