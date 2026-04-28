#!/usr/bin/env node
/**
 * update-footer.js — Rewrites the footer structure on existing translated pages.
 *
 * The English source moved the CTA buttons from the end of <main> into the
 * footer (as .footer-nav), collapsed the github/forum/issues/contacts row/col
 * markup, and added a .subfooter row with Privacy/Cookie/Terms/Legal links.
 *
 * This script applies that same structural change to already-translated pages,
 * preserving their translated button/footer labels and adding subfooter links
 * with labels pulled from assets/lang/i18n.js.
 *
 * Usage:
 *   node scripts/update-footer.js <langCode> [page]
 *
 * If page is omitted, processes all existing pages for the language.
 * Skips pages already migrated (detected via .footer-nav class).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

const i18nSource = fs.readFileSync(path.join(ROOT, 'lang', 'i18n.js'), 'utf8');
const wrapped = i18nSource.replace(/^const defined_i18n\s*=/m, '__result =');
const context = { __result: null };
vm.runInNewContext(wrapped, context);
const i18n = context.__result;

const langCode = process.argv[2];
const pageArg = process.argv[3];

if (!langCode) {
  console.error('Usage: update-footer.js <langCode> [page]');
  process.exit(1);
}

const trNav = i18n.nav[langCode];
if (!trNav) {
  console.error(`No nav strings for "${langCode}" in assets/lang/i18n.js.`);
  process.exit(1);
}

const CONTENT_PAGES = ['about', 'features', 'demo', 'contacts', 'install', 'drupal', 'license'];
const pages = pageArg ? [pageArg] : CONTENT_PAGES;

function ctaPath(page, slug) {
  // Absolute paths (matches how scaffolded pages store links).
  return i18n.buildPath(langCode, slug);
}

/**
 * Pull the footer-nav inner HTML from the English source for `page`, then
 * rewrite its hrefs + btn labels into the target language. Used as a fallback
 * for pages (contacts/install/drupal) whose prior version had no CTA row.
 */
function ctaFromEnglish(page) {
  const enPath = page === 'about'
    ? path.join(ROOT, 'en', 'index.html')
    : path.join(ROOT, 'en', page, 'index.html');
  const enHtml = fs.readFileSync(enPath, 'utf8');
  const m = enHtml.match(/<div class="footer-nav mt-5 pt-5 text-center">([\s\S]*?)<\/div>/);
  if (!m) return null;
  let inner = m[1].trim();

  const enNav = i18n.nav.en;
  // Rewrite each ../slug or ./slug href to absolute translated path, and the
  // enclosed English label to the translated label.
  for (const slug of i18n.canonicalPaths) {
    const dest = i18n.buildPath(langCode, slug);
    inner = inner.replaceAll(`"../${slug}/"`, `"${dest}"`);
    inner = inner.replaceAll(`"../${slug}"`, `"${dest}"`);
    inner = inner.replaceAll(`"./${slug}/"`, `"${dest}"`);
    inner = inner.replaceAll(`"./${slug}"`, `"${dest}"`);
    inner = inner.replaceAll(`"../"`, `"${i18n.buildPath(langCode, 'about')}"`);
    inner = inner.replaceAll(`"./"`, `"${i18n.buildPath(langCode, 'about')}"`);
  }
  // Now label rewrites, same logic as scaffold's CTA pattern.
  for (const slug of i18n.canonicalPaths) {
    const enLabel = (enNav.label[slug] || '').replace(/&/g, '&amp;');
    const trLabel = (trNav.label[slug] || '').replace(/&/g, '&amp;');
    if (!enLabel || !trLabel || enLabel === trLabel) continue;
    const dest = i18n.buildPath(langCode, slug);
    const flex = enLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const re = new RegExp(
      `(href="${dest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:#[^"]*)?"[^>]*>)\\s*${flex}\\s*(</a>)`,
      'gs'
    );
    inner = inner.replace(re, `$1${trLabel}$2`);
  }
  return inner;
}

function buildSubfooter() {
  const base = `/${langCode}`;
  const lbl = trNav.label;
  return `      <div class="col col-12 subfooter">
        <a href="${base}/privacy-policy">${lbl['privacy-policy']}</a>
        <a href="${base}/cookie-policy">${lbl['cookie-policy']}</a>
        <a href="${base}/terms-of-use">${lbl['terms-of-use']}</a>
        <a href="${base}/legal-notice">${lbl['legal-notice']}</a>
        &copy; 2026 Editoria11y LLC
      </div>`;
}

/**
 * Extract the CTA btn block. Matches:
 *   <div class="mt-5 pt-5 text-center"><a class="btn ...">...</a>...</div>
 * Returns {fullMatch, inner} or null.
 */
function extractCta(html) {
  const re = /<div class="mt-5 pt-5 text-center">(\s*<a class="btn btn-(?:primary|dark) btn-lg"[\s\S]*?)<\/div>/;
  const m = html.match(re);
  if (!m) return null;
  return { fullMatch: m[0], inner: m[1].trim() };
}

/**
 * Extract the 4 link blocks from the old footer's col col-3 col-md-2 wrappers.
 * Returns array of inner <a>...</a> strings (with translated <strong> labels).
 */
function extractFooterLinks(html) {
  const re = /<div class="col col-3 col-md-2">\s*([\s\S]*?)\s*<\/div>/g;
  const links = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    links.push(m[1].trim());
    if (links.length === 4) break;
  }
  return links;
}

/**
 * Replace the entire old <footer>...</footer> with the new structure.
 */
function buildNewFooter(ctaInner, footerLinks) {
  const linksJoined = footerLinks.map(l => '        ' + l).join('\n');
  return `<footer class="container col-lg-12 mx-auto pt-3 text-body-secondary text-center text-md-start">
    <div class="container">
      <div class="footer-nav mt-5 pt-5 text-center">${ctaInner}</div>
      <div class="footer">
${linksJoined}
      </div>
${buildSubfooter()}
    </div>
  </footer>`;
}

const OLD_FOOTER_RE = /<footer class="container col-lg-12 mx-auto pt-3 (?:mt-5|my-5) text-body-secondary border-top text-center text-md-start">[\s\S]*?<\/footer>/;

let updated = 0;
let skipped = 0;

for (const page of pages) {
  const destDir = page === 'about'
    ? path.join(ROOT, langCode)
    : path.join(ROOT, langCode, page);
  const destPath = path.join(destDir, 'index.html');
  const label = page === 'about' ? `${langCode}/index.html` : `${langCode}/${page}/index.html`;

  if (!fs.existsSync(destPath)) {
    console.log(`  - ${label} (not found, skipping)`);
    skipped++;
    continue;
  }

  let html = fs.readFileSync(destPath, 'utf8');

  if (html.includes('class="footer-nav') || html.includes('footer-nav mt-5')) {
    console.log(`  = ${label} (already migrated)`);
    skipped++;
    continue;
  }

  let cta = extractCta(html);
  let ctaInner;
  if (cta) {
    ctaInner = cta.inner;
    // Remove the old CTA div from main below.
  } else {
    // No pre-existing CTA (e.g. contacts/install/drupal). Generate from English.
    ctaInner = ctaFromEnglish(page);
    if (!ctaInner) {
      console.error(`  ✗ ${label}: could not find CTA in English source`);
      skipped++;
      continue;
    }
  }

  const oldFooterMatch = html.match(OLD_FOOTER_RE);
  if (!oldFooterMatch) {
    console.error(`  ✗ ${label}: could not find old footer`);
    skipped++;
    continue;
  }

  const oldFooter = oldFooterMatch[0];
  const footerLinks = extractFooterLinks(oldFooter);
  if (footerLinks.length !== 4) {
    console.error(`  ✗ ${label}: expected 4 footer links, found ${footerLinks.length}`);
    skipped++;
    continue;
  }

  const newFooter = buildNewFooter(ctaInner, footerLinks);

  // Remove the CTA div from main (only if one existed originally).
  if (cta) html = html.replace(cta.fullMatch, '');
  // Replace old footer with new.
  html = html.replace(oldFooter, newFooter);

  fs.writeFileSync(destPath, html);
  console.log(`  ✓ ${label}`);
  updated++;
}

console.log(`\nDone: ${updated} updated, ${skipped} skipped.`);
