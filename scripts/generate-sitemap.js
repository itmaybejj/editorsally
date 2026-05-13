#!/usr/bin/env node
/**
 * generate-sitemap.js — Generates sitemap.xml with hreflang alternates.
 *
 * Walks the canonical pages declared in assets/lang/i18n.js and emits a
 * <url> entry for every (language, page) pair whose index.html exists
 * on disk. Each entry lists xhtml:link rel="alternate" pointers to
 * every other language version of the same page, per Google's
 * recommended sitemap localization format.
 *
 * Usage:
 *   node scripts/generate-sitemap.js
 *
 * Run after adding, moving, or deleting any canonical page or
 * language directory.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const DOMAIN = 'https://editoria11y.com';
const OUTPUT = path.join(ROOT, 'sitemap.xml');

// ── Load i18n config ────────────────────────────────────────────────────────
const i18nSource = fs.readFileSync(path.join(ROOT, 'assets', 'lang', 'i18n.js'), 'utf8');
const wrapped = i18nSource.replace(/^const defined_i18n\s*=/m, '__result =');
const context = { __result: null };
vm.runInNewContext(wrapped, context);
const i18n = context.__result;

// ── hreflang mapping ────────────────────────────────────────────────────────
// Path codes don't always equal valid hreflang codes:
//   - Region subtags should be uppercase per BCP 47 (`pt-BR`, not `pt-br`)
const HREFLANG_MAP = {
  'pt-br': 'pt-BR',
  'pt-pt': 'pt-PT',
};

function hreflangFor(lang) {
  return HREFLANG_MAP[lang] || lang;
}

// ── Path helpers ────────────────────────────────────────────────────────────
function fileFor(lang, page) {
  const slug = i18n.getPath(lang, page);
  return page === 'about'
    ? path.join(ROOT, lang, 'index.html')
    : path.join(ROOT, lang, slug, 'index.html');
}

function urlFor(lang, page) {
  const slug = i18n.getPath(lang, page);
  return page === 'about'
    ? `${DOMAIN}/${lang}/`
    : `${DOMAIN}/${lang}/${slug}/`;
}

// ── Build sitemap ───────────────────────────────────────────────────────────
const out = [];
out.push('<?xml version="1.0" encoding="UTF-8"?>');
out.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
out.push('  xmlns:xhtml="http://www.w3.org/1999/xhtml">');

let urlCount = 0;

for (const page of i18n.canonicalPaths) {
  const langsWithPage = i18n.allLanguages.filter(
    (lang) => fs.existsSync(fileFor(lang, page))
  );

  if (langsWithPage.length === 0) continue;

  for (const currentLang of langsWithPage) {
    out.push('  <url>');
    out.push(`    <loc>${urlFor(currentLang, page)}</loc>`);

    for (const altLang of langsWithPage) {
      out.push('    <xhtml:link');
      out.push('               rel="alternate"');
      out.push(`               hreflang="${hreflangFor(altLang)}"`);
      out.push(`               href="${urlFor(altLang, page)}"/>`);
    }

    // x-default points to the English version when one exists.
    if (langsWithPage.includes('en')) {
      out.push('    <xhtml:link');
      out.push('               rel="alternate"');
      out.push('               hreflang="x-default"');
      out.push(`               href="${urlFor('en', page)}"/>`);
    }

    out.push('  </url>');
    urlCount++;
  }
}

out.push('</urlset>');
out.push('');

fs.writeFileSync(OUTPUT, out.join('\n'));
console.log(`Wrote sitemap.xml (${urlCount} URLs).`);
