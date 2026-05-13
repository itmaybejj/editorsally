#!/usr/bin/env node
/**
 * apply-translation-queue.js — Splice a filled queue JSON into a target
 * language's fragments and update the manifest hashes.
 *
 * Input: scripts/scratch/queue-<lang>.json with each segment carrying a
 *        `translation` field (block: translated inner HTML; img:
 *        translated attrs as an object).
 *
 * For each segment:
 *   - Block: find element by data-i18n-id in content/<lang>/<page>.html,
 *            replace its innerHTML. Optionally update own_attrs.
 *   - Img:   replace alt/aria-label/title/longdesc per t_attrs.
 * For each orphan: delete the element from the fragment.
 *
 * Then for each successfully-applied segment, set
 * manifest.translations[<lang>][<page>][<id>] = manifest.source[<page>][<id>].
 * Orphans: delete the entry. Missing translations: leave as-is, report.
 *
 * Usage: node scripts/apply-translation-queue.js <lang> [--dry-run]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadI18n, ROOT } = require('./lib/i18n-loader.js');
const { parseFragment, isImg } = require('./lib/parse-fragment.js');

const i18n = loadI18n();
const lang = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

if (!lang) {
  console.error('Usage: apply-translation-queue.js <lang> [--dry-run]');
  process.exit(1);
}

const MANIFEST = path.join(ROOT, 'assets', 'lang', 'manifest.json');
const QUEUE = path.join(ROOT, 'scripts', 'scratch', `queue-${lang}.json`);
if (!fs.existsSync(QUEUE)) {
  console.error(`Queue not found: ${QUEUE}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
manifest.translations[lang] = manifest.translations[lang] || {};

let applied = 0, missing = 0, notFound = 0, orphansApplied = 0;
const issues = [];

function decodeOverEscape(s) {
  // Heal over-escaped HTML the agent may emit: &lt; → <, &gt; → >, &amp; → & (only if it looks like a tag)
  // Only apply if string contains HTML-looking entities likely from over-escape.
  if (typeof s !== 'string') return s;
  if (!/&(lt|gt|amp|quot);/.test(s)) return s;
  // Only heal if there are no real <tags> already present; otherwise leave alone.
  if (/<[a-z\/!]/i.test(s)) return s;
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

for (const [page, info] of Object.entries(queue.pages || {})) {
  const fragPath = path.join(ROOT, 'content', lang, `${page}.html`);
  if (!fs.existsSync(fragPath)) {
    issues.push(`fragment missing: ${fragPath}`);
    continue;
  }
  const html = fs.readFileSync(fragPath, 'utf8');
  const root = parseFragment(html);
  const main = root.querySelector('main');
  if (!main) {
    issues.push(`no <main> in ${fragPath}`);
    continue;
  }

  manifest.translations[lang][page] = manifest.translations[lang][page] || {};

  // Orphans first (remove the element entirely).
  for (const id of info.orphans || []) {
    const node = main.querySelector(`[data-i18n-id="${id}"]`);
    if (node) {
      node.remove();
      orphansApplied++;
    }
    delete manifest.translations[lang][page][id];
  }

  // Apply translations.
  for (const [id, seg] of Object.entries(info.segments || {})) {
    if (seg.translation === undefined || seg.translation === null) {
      missing++;
      issues.push(`${page}#${id}: no translation`);
      continue;
    }
    // Empty string translation is valid only when the source is also empty.
    if (seg.translation === '' && seg.kind === 'block' && seg.inner_html !== '') {
      missing++;
      issues.push(`${page}#${id}: empty translation for non-empty source`);
      continue;
    }
    const node = main.querySelector(`[data-i18n-id="${id}"]`);
    if (!node) {
      notFound++;
      issues.push(`${page}#${id}: element not found in fragment`);
      continue;
    }
    if (seg.kind === 'img') {
      const t = seg.translation;
      if (typeof t !== 'object') {
        issues.push(`${page}#${id}: img translation must be an object of attrs`);
        missing++;
        continue;
      }
      for (const [attr, val] of Object.entries(t)) {
        node.setAttribute(attr, val);
      }
    } else {
      // block
      let inner = seg.translation;
      if (typeof inner !== 'string') {
        issues.push(`${page}#${id}: block translation must be a string`);
        missing++;
        continue;
      }
      inner = decodeOverEscape(inner);
      node.set_content
        ? node.set_content(inner)
        : (node.innerHTML = inner);
      // Own attrs
      if (seg.own_attrs && seg.translation_attrs) {
        for (const [attr, val] of Object.entries(seg.translation_attrs)) {
          node.setAttribute(attr, val);
        }
      }
    }
    const srcHash = manifest.source[page]?.[id];
    if (srcHash) manifest.translations[lang][page][id] = srcHash;
    applied++;
  }

  if (!dryRun) {
    fs.writeFileSync(fragPath, root.outerHTML);
  }
}

if (!dryRun) {
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

console.log(`${lang}: applied=${applied}, missing=${missing}, notFound=${notFound}, orphans=${orphansApplied}${dryRun ? ' (dry-run)' : ''}`);
if (issues.length > 0) {
  console.log('\nIssues:');
  for (const i of issues.slice(0, 50)) console.log('  - ' + i);
  if (issues.length > 50) console.log(`  … and ${issues.length - 50} more`);
}
process.exit(missing > 0 || notFound > 0 ? 1 : 0);
