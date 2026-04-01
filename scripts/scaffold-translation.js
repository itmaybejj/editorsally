#!/usr/bin/env node
/**
 * scaffold-translation.js — Prepares English HTML pages for translation.
 *
 * Copies the English source to <langCode>/<page>/index.html, applying all
 * mechanical substitutions (lang attribute, internal links, nav chrome,
 * footer labels, CTA button text, title tag). The <main> prose content
 * is left in English for a human or AI translator to handle.
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
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

// ── Load i18n config ────────────────────────────────────────────────────────
// i18n.js declares `const defined_i18n = (...)()` — const doesn't leak into
// the vm sandbox object, so we wrap it to capture the return value.
const i18nSource = fs.readFileSync(path.join(ROOT, 'lang', 'i18n.js'), 'utf8');
const wrapped = i18nSource.replace(
  /^const defined_i18n\s*=/m,
  '__result ='
);
const context = { __result: null };
vm.runInNewContext(wrapped, context);
const i18n = context.__result;

// ── Parse arguments ─────────────────────────────────────────────────────────
const langCode = process.argv[2];
const pageArg = process.argv[3];

if (!langCode) {
  console.error('Usage: scaffold-translation.js <langCode> [page]');
  process.exit(1);
}

const enNav = i18n.nav.en;
const trNav = i18n.nav[langCode];

if (!trNav) {
  console.error(
    `No nav strings found for "${langCode}" in lang/i18n.js.\n` +
    `Add a nav entry for "${langCode}" before scaffolding.`
  );
  process.exit(1);
}

const pages = pageArg ? [pageArg] : i18n.canonicalPaths;

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Escape special regex characters in a string. */
function escapeRe(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Convert & to &amp; for use in HTML attribute/text matching. */
function htmlEnc(str) {
  return str.replace(/&/g, '&amp;');
}

// ── Process each page ───────────────────────────────────────────────────────
let created = 0;
let skipped = 0;

for (const page of pages) {
  const srcPath = path.join(ROOT, 'en', page, 'index.html');
  const destDir = path.join(ROOT, langCode, page);
  const destPath = path.join(destDir, 'index.html');

  if (!fs.existsSync(srcPath)) {
    console.error(`  ✗ Source not found: en/${page}/index.html`);
    skipped++;
    continue;
  }

  if (fs.existsSync(destPath)) {
    console.error(`  ✗ Already exists: ${langCode}/${page}/index.html (skipping)`);
    skipped++;
    continue;
  }

  let html = fs.readFileSync(srcPath, 'utf8');

  // 1. Set lang attribute
  html = html.replace(/(<html\s[^>]*?)lang="en"/, `$1lang="${langCode}"`);

  // 2. Rewrite internal relative links: ../slug and ../slug/
  //    Also handles ../slug/#anchor and ../slug#anchor
  for (const slug of i18n.canonicalPaths) {
    const trSlug = i18n.getPath(langCode, slug);
    // ../slug/ or ../slug/# patterns
    html = html.replaceAll(`"../${slug}/"`, `"/${langCode}/${trSlug}/"`);
    html = html.replaceAll(`"../${slug}"`, `"/${langCode}/${trSlug}"`);
    // Handle ../slug/#fragment (after the first pass won't catch these if / was already replaced)
    const fragPattern = new RegExp(`"\\.\\./${escapeRe(slug)}/(#[^"]*)"`, 'g');
    html = html.replace(fragPattern, `"/${langCode}/${trSlug}/$1"`);
  }

  // 3. Translate <title> — pattern: "EnLabel — Editoria11y" or just "Editoria11y"
  const enLabel = enNav.label[page];
  const trLabel = trNav.label[page];
  if (enLabel && trLabel) {
    const enTitle = `<title>${htmlEnc(enLabel)} — Editoria11y</title>`;
    const trTitle = `<title>${htmlEnc(trLabel)} — Editoria11y</title>`;
    html = html.replace(enTitle, trTitle);
    // Some pages use &mdash; or em-dash
    html = html.replace(
      `<title>${htmlEnc(enLabel)} &#8212; Editoria11y</title>`,
      `<title>${htmlEnc(trLabel)} — Editoria11y</title>`
    );
  }

  // 4. Nav aria-labels
  html = html.replace(
    `aria-label="Toggle navigation"`,
    `aria-label="${trNav.toggleNav}"`
  );
  html = html.replace(
    `aria-label="Close"`,
    `aria-label="${trNav.close}"`
  );

  // 5. Footer link labels
  const enFooter = enNav.footer;
  const trFooter = trNav.footer;
  if (enFooter && trFooter) {
    for (const key of Object.keys(enFooter)) {
      const pattern = new RegExp(
        `<strong>${escapeRe(enFooter[key])}</strong>`,
        'g'
      );
      html = html.replace(pattern, `<strong>${trFooter[key]}</strong>`);
    }
  }

  // 6. CTA button labels — match btn links pointing to known translated slugs
  for (const slug of i18n.canonicalPaths) {
    const enBtnLabel = htmlEnc(enNav.label[slug]);
    const trBtnLabel = htmlEnc(trNav.label[slug]);
    if (enBtnLabel === trBtnLabel) continue;

    const trSlug = i18n.getPath(langCode, slug);
    // Match: href="/<lang>/<slug>..." followed by >EnLabel</a>
    // Use \s* and dotAll to handle labels that wrap across lines.
    const flexLabel = escapeRe(enBtnLabel).replace(/\s+/g, '\\s+');
    const btnPattern = new RegExp(
      `(href="/${escapeRe(langCode)}/${escapeRe(trSlug)}/?(?:#[^"]*)?"[^>]*>)` +
      `\\s*${flexLabel}\\s*(</a>)`,
      'gs'
    );
    html = html.replace(btnPattern, `$1${trBtnLabel}$2`);
  }

  // ── Write output ──────────────────────────────────────────────────────────
  fs.mkdirSync(destDir, { recursive: true });
  fs.writeFileSync(destPath, html);
  console.log(`  ✓ ${langCode}/${page}/index.html`);
  created++;
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\nDone: ${created} scaffolded, ${skipped} skipped.`);
if (created > 0) {
  console.log(`\nNext step: translate the <main> content in each file.`);
  console.log(`The header, nav, footer, links, and CTA buttons are already localized.`);
}
