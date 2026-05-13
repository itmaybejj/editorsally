#!/usr/bin/env node
/**
 * verify-build.js — Semantic diff between built output and the pre-migration
 * version of each <lang>/<page>/index.html (fetched from git HEAD).
 *
 * Compares:
 *   1. Translatable content: ordered list of {tag, normalizedInnerHTML or img attrs}.
 *   2. Translatable attributes on non-img blocks: {aria-label, title, placeholder}.
 *   3. Chrome equivalence: <html lang>, set of footer link hrefs (normalized to
 *      canonical /<lang>/<en-slug>/ form), set of nav-brand href.
 *   4. Title: built title should be `<h1-text> — Editoria11y` (allowing override).
 *
 * Differences in attribute order, whitespace, and intentionally-normalized
 * markup (footer wrappers, btn-dark active state) are not flagged.
 *
 * Usage:
 *   node scripts/verify-build.js          # all languages, all pages
 *   node scripts/verify-build.js en       # one language
 *   node scripts/verify-build.js en features
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadI18n, ROOT } = require('./lib/i18n-loader.js');
const {
  parseFragment, translatableNodes, normalizeWhitespace,
  stripImgAltsForHash, isImg,
} = require('./lib/parse-fragment.js');

const i18n = loadI18n();
const langArg = process.argv[2];
const pageArg = process.argv[3];

const languages = langArg ? [langArg] : i18n.allLanguages;

function outputRelPath(lang, page) {
  return page === 'about'
    ? `${lang}/index.html`
    : `${lang}/${page}/index.html`;
}

function readGitHead(relPath) {
  try {
    return execFileSync('git', ['show', `HEAD:${relPath}`], { cwd: ROOT, encoding: 'utf8' });
  } catch {
    return null;
  }
}

function normalizeHrefInString(html, lang) {
  return html.replace(/href="([^"]*)"/gi, (_, href) => `href="${canonicalizeLink(href, lang)}"`);
}

function normalizeAttrWhitespaceInString(html) {
  // Collapse runs of whitespace inside opening tags (between attributes).
  return html.replace(/<([a-z][a-z0-9-]*)([^>]*)>/gi, (match, tag, attrs) => {
    if (!attrs.trim()) return `<${tag}>`;
    // Don't touch text inside quoted attribute values; we only collapse the
    // unquoted whitespace between attribute pairs.
    let out = '';
    let i = 0;
    let inQuote = null;
    while (i < attrs.length) {
      const c = attrs[i];
      if (inQuote) {
        out += c;
        if (c === inQuote) inQuote = null;
      } else if (c === '"' || c === "'") {
        out += c;
        inQuote = c;
      } else if (/\s/.test(c)) {
        out += ' ';
        while (i + 1 < attrs.length && /\s/.test(attrs[i + 1]) && !inQuote) i++;
      } else {
        out += c;
      }
      i++;
    }
    return `<${tag}${out.trimEnd()}>`;
  });
}

function normalizeEmptyAttrsInString(html) {
  // attr="" / attr='' → bare `attr` (the parser already emits bare for some
  // round-trips; this gives both sides a single canonical form).
  return html.replace(/(\s+[a-z][a-z0-9-]*)=(?:""|'')/gi, '$1');
}

function normalizeInnerForCompare(html, lang) {
  let s = normalizeEmptyAttrsInString(html);
  s = stripImgAltsForHash(s);
  s = normalizeAttrWhitespaceInString(s);
  s = normalizeHrefInString(s, lang);
  s = normalizeWhitespace(s);
  return s;
}

function captureBlocks(mainNode, lang) {
  const out = [];
  for (const node of translatableNodes(mainNode)) {
    if (isImg(node)) {
      let alt = node.getAttribute('alt');
      if (alt === null || alt === undefined) alt = '';
      out.push({
        tag: 'img',
        alt,
        ariaLabel: node.getAttribute('aria-label') || '',
        title: node.getAttribute('title') || '',
        longdesc: node.getAttribute('longdesc') || '',
      });
    } else {
      out.push({
        tag: (node.rawTagName || '').toLowerCase(),
        inner: normalizeInnerForCompare(node.innerHTML, lang),
        ariaLabel: node.getAttribute('aria-label') || '',
        title: node.getAttribute('title') || '',
        placeholder: node.getAttribute('placeholder') || '',
      });
    }
  }
  return out;
}

function captureLinkSet(root) {
  // All footer + header link hrefs, normalized for comparison.
  const set = new Set();
  for (const a of root.querySelectorAll('header a[href], footer a[href]')) {
    set.add(a.getAttribute('href'));
  }
  return set;
}

function canonicalizeLink(href, lang) {
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  // Relative ./ or ../ from the old format → canonical /<lang>/...
  if (href === './' || href === '../') return `/${lang}/`;
  let m = href.match(/^\.\.?\/(#.*)?$/);
  if (m) return `/${lang}/` + (m[1] || '');
  m = href.match(/^\.\.?\/([a-z0-9-]+)\/?(#.*)?$/i);
  if (m) {
    const slug = m[1];
    const frag = m[2] || '';
    const canonicalSlug = i18n.getCanonicalSlug(lang, slug);
    return `/${lang}/${canonicalSlug}/${frag}`;
  }
  // Already-absolute /<lang>/<slug>/ — canonicalize the slug to English form
  m = href.match(new RegExp(`^/${lang}/([^/?#]+)/?(#.*)?$`));
  if (m) {
    const canonicalSlug = i18n.getCanonicalSlug(lang, m[1]);
    // The about page lives at /<lang>/, not /<lang>/about/.
    if (canonicalSlug === 'about') return `/${lang}/${m[2] || ''}`;
    return `/${lang}/${canonicalSlug}/${m[2] || ''}`;
  }
  // /<lang>/  (home)
  m = href.match(new RegExp(`^/${lang}/?(#.*)?$`));
  if (m) return `/${lang}/` + (m[1] || '');
  return href;
}

function canonicalLinkSet(root, lang) {
  const out = new Set();
  for (const h of captureLinkSet(root)) out.add(canonicalizeLink(h, lang));
  return out;
}

function compareBlocks(oldBlocks, newBlocks) {
  const issues = [];
  const max = Math.max(oldBlocks.length, newBlocks.length);
  for (let i = 0; i < max; i++) {
    const o = oldBlocks[i];
    const n = newBlocks[i];
    if (!o) { issues.push({ pos: i, kind: 'extra-in-new', new: n }); continue; }
    if (!n) { issues.push({ pos: i, kind: 'missing-in-new', old: o }); continue; }
    if (o.tag !== n.tag) { issues.push({ pos: i, kind: 'tag-mismatch', old: o, new: n }); continue; }
    if (o.tag === 'img') {
      const fields = ['alt', 'ariaLabel', 'title', 'longdesc'];
      for (const f of fields) {
        if ((o[f] || '') !== (n[f] || '')) {
          issues.push({ pos: i, kind: `img-${f}`, old: o[f], new: n[f] });
        }
      }
    } else {
      if (o.inner !== n.inner) {
        issues.push({ pos: i, kind: 'inner', old: o.inner.slice(0, 80), new: n.inner.slice(0, 80) });
      }
      for (const f of ['ariaLabel', 'title', 'placeholder']) {
        if ((o[f] || '') !== (n[f] || '')) {
          issues.push({ pos: i, kind: f, old: o[f], new: n[f] });
        }
      }
    }
  }
  return issues;
}

function deriveExpectedTitle(mainNode) {
  const override = mainNode.outerHTML.match(/<!--\s*title-override:\s*(.+?)\s*-->/);
  if (override) return override[1].trim();
  const h1 = mainNode.querySelector('h1');
  if (!h1) return null;
  const inner = h1.innerHTML.replace(/<br\s*\/?>/gi, ' ');
  const tmp = parseFragment('<span>' + inner + '</span>');
  return tmp.querySelector('span').text.replace(/\s+/g, ' ').trim();
}

let totalFiles = 0;
let totalIssues = 0;
let totalWarnings = 0;
const pages = pageArg ? [pageArg] : i18n.canonicalPaths;

for (const lang of languages) {
  for (const page of pages) {
    const rel = outputRelPath(lang, page);
    const newPath = path.join(ROOT, rel);
    if (!fs.existsSync(newPath)) continue;

    const oldHtml = readGitHead(rel);
    if (oldHtml === null) {
      console.log(`  - ${rel}: no git HEAD version (skipping)`);
      continue;
    }
    totalFiles++;

    const oldRoot = parseFragment(oldHtml);
    const newRoot = parseFragment(fs.readFileSync(newPath, 'utf8'));
    const oldMain = oldRoot.querySelector('main');
    const newMain = newRoot.querySelector('main');

    const issues = [];
    const warnings = [];

    // 1. Block content + attributes
    if (oldMain && newMain) {
      const blockIssues = compareBlocks(captureBlocks(oldMain, lang), captureBlocks(newMain, lang));
      // Whitelist known stealth fixes
      const filtered = blockIssues.filter(item => {
        // Demo H1 promotion: pos 0, h2→h1, text "Demo"
        if (page === 'demo' && item.pos === 0 && item.kind === 'tag-mismatch'
            && item.old?.tag === 'h2' && item.new?.tag === 'h1') {
          return false;
        }
        return true;
      });
      issues.push(...filtered);
    } else if (!newMain) {
      issues.push({ pos: -1, kind: 'no-main-in-new' });
    } else if (!oldMain) {
      warnings.push({ pos: -1, kind: 'no-main-in-old' });
    }

    // 2. lang attribute
    const oldLang = oldRoot.querySelector('html')?.getAttribute('lang');
    const newLang = newRoot.querySelector('html')?.getAttribute('lang');
    if (oldLang !== newLang) issues.push({ pos: -1, kind: 'html-lang', old: oldLang, new: newLang });

    // 3. Link set equivalence (header + footer)
    // Only flag MISSING links (content loss). New links are expected — the
    // canonical footer adds the 4-button footer-nav and full social/subfooter
    // rows on every page, including legal pages.
    const oldLinks = canonicalLinkSet(oldRoot, lang);
    const newLinks = canonicalLinkSet(newRoot, lang);
    const missingInNew = [...oldLinks].filter(l => !newLinks.has(l));
    for (const l of missingInNew) issues.push({ pos: -1, kind: 'link-missing', link: l });

    // 4. Title expectation
    const newTitle = newRoot.querySelector('title')?.text || '';
    if (newMain) {
      const expectedBody = deriveExpectedTitle(newMain);
      if (expectedBody) {
        const expected = `${expectedBody} — Editoria11y`;
        if (newTitle !== expected) {
          warnings.push({ pos: -1, kind: 'title-unexpected', expected, got: newTitle });
        }
      }
    }

    // Report
    if (issues.length === 0 && warnings.length === 0) {
      console.log(`  ✓ ${rel}`);
    } else {
      console.log(`  ${issues.length ? '✗' : '!'} ${rel} — ${issues.length} issue(s), ${warnings.length} warning(s)`);
      for (const i of issues) reportLine('    issue', i);
      for (const w of warnings) reportLine('    warn ', w);
    }
    totalIssues += issues.length;
    totalWarnings += warnings.length;
  }
}

function reportLine(prefix, item) {
  if (item.kind === 'inner') {
    console.log(`${prefix} pos ${item.pos} inner differs:`);
    console.log(`         old: ${item.old}`);
    console.log(`         new: ${item.new}`);
  } else if (item.kind === 'tag-mismatch') {
    console.log(`${prefix} pos ${item.pos} tag mismatch: <${item.old.tag}> → <${item.new.tag}>`);
  } else if (item.kind === 'missing-in-new') {
    const preview = item.old.tag === 'img' ? `img alt="${item.old.alt}"` : `<${item.old.tag}> ${item.old.inner?.slice(0, 60) || ''}`;
    console.log(`${prefix} pos ${item.pos} missing in new: ${preview}`);
  } else if (item.kind === 'extra-in-new') {
    const preview = item.new.tag === 'img' ? `img alt="${item.new.alt}"` : `<${item.new.tag}> ${item.new.inner?.slice(0, 60) || ''}`;
    console.log(`${prefix} pos ${item.pos} extra in new: ${preview}`);
  } else if (item.kind === 'link-missing') {
    console.log(`${prefix} link in old not in new: ${item.link}`);
  } else if (item.kind === 'link-added') {
    console.log(`${prefix} new link not in old: ${item.link}`);
  } else if (item.kind === 'html-lang') {
    console.log(`${prefix} <html lang>: ${item.old} → ${item.new}`);
  } else if (item.kind === 'title-unexpected') {
    console.log(`${prefix} title: expected "${item.expected}", got "${item.got}"`);
  } else {
    console.log(`${prefix} pos ${item.pos} ${item.kind}: old="${item.old}" new="${item.new}"`);
  }
}

console.log(`\n${totalFiles} files checked, ${totalIssues} issue(s), ${totalWarnings} warning(s).`);
process.exit(totalIssues > 0 ? 1 : 0);
