#!/usr/bin/env node
/**
 * normalize-segments.js — Assign opaque data-i18n-id to every translatable
 * block/img in English fragments, hash each segment, and write the result to
 * assets/lang/manifest.json under the `source` key.
 *
 * Idempotent: re-running with no source changes produces an identical manifest
 * and leaves fragment files untouched. Re-running after content edits assigns
 * fresh IDs to any new blocks and updates hashes for changed blocks (preserving
 * IDs on unchanged ones).
 *
 * Usage:
 *   node scripts/normalize-segments.js          # all English pages
 *   node scripts/normalize-segments.js features # one page
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadI18n, ROOT } = require('./lib/i18n-loader.js');
const {
  parseFragment, translatableNodes, hashSegment,
  assignNewId, collectExistingIds,
} = require('./lib/parse-fragment.js');

const i18n = loadI18n();
const pageArg = process.argv[2];
const pages = pageArg ? [pageArg] : i18n.canonicalPaths;

const MANIFEST_PATH = path.join(ROOT, 'assets', 'lang', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
manifest.source = manifest.source || {};
manifest.translations = manifest.translations || {};

function fragmentPath(lang, page) {
  return path.join(ROOT, 'content', lang, `${page}.html`);
}

function normalizePage(page) {
  const fragPath = fragmentPath('en', page);
  if (!fs.existsSync(fragPath)) {
    console.log(`  - skip ${page}: ${fragPath} not found`);
    return { skipped: true };
  }
  const html = fs.readFileSync(fragPath, 'utf8');
  const root = parseFragment(html);
  const main = root.querySelector('main');
  if (!main) {
    console.log(`  - skip ${page}: no <main> in fragment`);
    return { skipped: true };
  }

  const existing = collectExistingIds(root);
  const nodes = translatableNodes(main);
  const seenIds = new Set();

  let added = 0;
  let changed = 0;
  const pageHashes = {};

  for (const node of nodes) {
    let id = node.getAttribute('data-i18n-id');
    if (!id || seenIds.has(id)) {
      // Either no ID yet, or a duplicate (shouldn't happen but guard anyway)
      id = assignNewId(existing);
      node.setAttribute('data-i18n-id', id);
      added++;
    }
    seenIds.add(id);
    const hash = hashSegment(node);
    pageHashes[id] = hash;
    if (manifest.source[page]?.[id] && manifest.source[page][id] !== hash) {
      changed++;
    }
  }

  // Compute removed (in old manifest but not in current pass)
  const old = manifest.source[page] || {};
  const removed = Object.keys(old).filter(id => !(id in pageHashes));

  manifest.source[page] = pageHashes;

  if (added > 0) {
    // Write the fragment back with newly-assigned IDs
    fs.writeFileSync(fragPath, root.outerHTML);
  }

  console.log(
    `  ${page}: ${nodes.length} segments` +
    (added ? `, +${added} new` : '') +
    (changed ? `, ${changed} changed` : '') +
    (removed.length ? `, ${removed.length} removed` : '') +
    (added === 0 && changed === 0 && removed.length === 0 ? ' (no changes)' : '')
  );

  return { ok: true };
}

console.log(`Normalizing English fragments (${pages.length} page${pages.length === 1 ? '' : 's'})…`);
let ok = 0, skipped = 0;
for (const page of pages) {
  const r = normalizePage(page);
  if (r.ok) ok++;
  else if (r.skipped) skipped++;
}

fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
console.log(`\nDone: ${ok} normalized, ${skipped} skipped. Manifest updated.`);
