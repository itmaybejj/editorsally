#!/usr/bin/env node
/**
 * build-pages.js — Assemble fragments × template → <lang>/<page>/index.html.
 *
 * For each content/<lang>/<page>.html:
 *   - Derive page title from the H1 (or from <!-- title-override: ... --> if present).
 *   - Strip data-i18n-id attributes from the fragment clone before injection.
 *   - Apply template substitutions (@@LANG@@, @@TITLE@@, chrome strings).
 *   - Rewrite English-canonical hrefs (/en/<slug>/) in the fragment to the
 *     target language: /<lang>/<translated-slug>/ — accounting for i18n.paths
 *     overrides per language. The about page is special-cased to /<lang>/.
 *   - Write to <lang>/<page>/index.html (or <lang>/index.html for about).
 *
 * Usage:
 *   node scripts/build-pages.js              # all languages, all pages
 *   node scripts/build-pages.js en           # all English pages
 *   node scripts/build-pages.js en features  # one page
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadI18n, ROOT } = require('./lib/i18n-loader.js');
const { parseFragment, stripI18nIds } = require('./lib/parse-fragment.js');

const i18n = loadI18n();
const langArg = process.argv[2];
const pageArg = process.argv[3];

const languages = langArg ? [langArg] : i18n.allLanguages;
for (const l of languages) {
  if (!i18n.allLanguages.includes(l)) {
    console.error(`Unknown language: ${l}`);
    process.exit(1);
  }
}

const TEMPLATE_PATH = path.join(ROOT, 'template.html');
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

function fragmentPath(lang, page) {
  return path.join(ROOT, 'content', lang, `${page}.html`);
}

function outputPath(lang, page) {
  if (page === 'about') return path.join(ROOT, lang, 'index.html');
  const slug = i18n.getPath(lang, page);
  return path.join(ROOT, lang, slug, 'index.html');
}

function deriveTitle(mainNode) {
  // Title-override comment takes precedence.
  const override = mainNode.outerHTML.match(/<!--\s*title-override:\s*(.+?)\s*-->/);
  if (override) return override[1].trim();
  const h1 = mainNode.querySelector('h1');
  if (!h1) return 'Editoria11y';
  const inner = h1.innerHTML.replace(/<br\s*\/?>/gi, ' ');
  const tmp = parseFragment('<span>' + inner + '</span>');
  const text = tmp.querySelector('span').text.replace(/\s+/g, ' ').trim();
  return text ? `${text} — Editoria11y` : 'Editoria11y';
}

function htmlAttr(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function htmlText(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function rewriteSlugsInMain(mainNode, lang) {
  // Convert canonical /en/<slug>/ paths to /<lang>/<translated-slug>/ form.
  for (const a of mainNode.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (!href.startsWith('/en/')) continue;
    const m = href.match(/^\/en\/([^/?#]*)(\/?)(.*)$/);
    if (!m) continue;
    const slug = m[1];
    const trailing = m[2];
    const rest = m[3];
    if (slug === '') {
      a.setAttribute('href', `/${lang}/${trailing}${rest}`);
      continue;
    }
    if (i18n.canonicalPaths.includes(slug)) {
      const translated = i18n.getPath(lang, slug);
      a.setAttribute('href', `/${lang}/${translated}${trailing}${rest}`);
    }
    // Unknown slug under /en/ — leave as is (shouldn't happen in clean source).
  }
}

function buildPage(lang, page) {
  const fragPath = fragmentPath(lang, page);
  if (!fs.existsSync(fragPath)) {
    return { skipped: true, reason: 'no fragment' };
  }
  const fragHtml = fs.readFileSync(fragPath, 'utf8');
  const fragRoot = parseFragment(fragHtml);
  const main = fragRoot.querySelector('main');
  if (!main) return { skipped: true, reason: 'no <main>' };

  // Derive title first (from source HTML that still has data-i18n-id; doesn't affect text).
  const title = deriveTitle(main);

  // Strip IDs (mutates the clone we'll inject).
  stripI18nIds(main);

  // Rewrite slugs for the target language.
  rewriteSlugsInMain(main, lang);

  // Compose output by template substitution.
  const nav = i18n.getNav(lang);
  let out = template;
  out = out.replaceAll('@@LANG@@', lang);
  out = out.replaceAll('@@TITLE@@', htmlText(title));
  out = out.replaceAll('@@TOGGLE_NAV@@', htmlAttr(nav.toggleNav));
  out = out.replaceAll('@@CLOSE@@', htmlAttr(nav.close));

  // Footer labels (nav.label)
  for (const slug of Object.keys(nav.label)) {
    out = out.replaceAll(`@@LABEL_${slug}@@`, htmlText(nav.label[slug]));
  }
  // Footer social labels (nav.footer)
  for (const key of Object.keys(nav.footer)) {
    out = out.replaceAll(`@@FOOTER_${key}@@`, htmlText(nav.footer[key]));
  }

  // Per-language slug rewrites on absolute paths in the template footer.
  // Template uses /@@LANG@@/<en-slug>/; after @@LANG@@ substitution it's
  // /<lang>/<en-slug>/. Now rewrite to translated slugs where applicable.
  for (const slug of i18n.canonicalPaths) {
    const translated = i18n.getPath(lang, slug);
    if (translated === slug) continue;
    out = out.replaceAll(`/${lang}/${slug}/`, `/${lang}/${translated}/`);
  }

  // Inject main at the marker.
  out = out.replace('<!-- @main -->', main.outerHTML);

  // Sanity check: no unresolved markers.
  const unresolved = out.match(/@@[A-Z_][A-Z0-9_-]*@@/g);
  if (unresolved) {
    throw new Error(`Unresolved markers in ${lang}/${page}: ${[...new Set(unresolved)].join(', ')}`);
  }

  // Write.
  const outPath = outputPath(lang, page);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  return { ok: true, outPath };
}

let ok = 0, skipped = 0, errors = 0;
const pages = pageArg ? [pageArg] : i18n.canonicalPaths;

for (const lang of languages) {
  console.log(`${lang}:`);
  for (const page of pages) {
    try {
      const r = buildPage(lang, page);
      if (r.ok) {
        console.log(`  ✓ ${path.relative(ROOT, r.outPath)}`);
        ok++;
      } else {
        console.log(`  - skip ${lang}/${page}: ${r.reason}`);
        skipped++;
      }
    } catch (e) {
      console.error(`  ✗ ${lang}/${page}: ${e.message}`);
      errors++;
    }
  }
}
console.log(`\nDone: ${ok} built, ${skipped} skipped, ${errors} errors.`);
process.exit(errors > 0 ? 1 : 0);
