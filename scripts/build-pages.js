#!/usr/bin/env node
/**
 * build-pages.js — Assemble fragments × template → built pages.
 *
 * URL scheme: English is canonical at the site root (`/`, `/<slug>/`).
 * Other languages live under `/<lang>/.../`  with translated slugs.
 *
 * For each content/<lang>/<page>.html:
 *   - Derive page title from the H1 (or from <!-- title-override: ... --> if present).
 *   - Strip data-i18n-id attributes from the fragment clone before injection.
 *   - Apply template substitutions (@@LANG@@, @@LANG_PREFIX@@, @@TITLE@@, chrome strings).
 *   - Rewrite canonical /en/<slug>/ hrefs in the fragment to the target language's
 *     URL — for English, /en/<slug>/ becomes /<slug>/ (and /en/ becomes /).
 *     For other languages: /en/<slug>/ becomes /<lang>/<translated-slug>/.
 *   - Write the page to its canonical output path.
 *   - Also emit a meta-refresh redirect stub at any alias path (the /en/ tree
 *     for English; /<lang>/<en-slug>/ for non-English where the slug is
 *     translated). Stubs are crawlable (no `noindex`) so search engines pick
 *     up the redirect and update their index.
 *
 * Usage:
 *   node scripts/build-pages.js              # all languages, all pages
 *   node scripts/build-pages.js en           # all English pages
 *   node scripts/build-pages.js en features  # one page
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { loadI18n, ROOT } = require('./lib/i18n-loader.js');
const { parseFragment, stripI18nIds } = require('./lib/parse-fragment.js');

const i18n = loadI18n();
const langArg = process.argv[2];
const pageArg = process.argv[3];

const DOMAIN = 'https://editoria11y.com';

// Chrome assets referenced from template.html. Cache-busted per-file by
// content hash so a returning visitor only re-fetches assets that actually
// changed. Hashes are stable across builds when content is unchanged, so
// the built HTML is byte-identical on a no-op rebuild.
const CACHE_BUSTED_ASSETS = [
  '/assets/bootstrap/css/bootstrap.min.css',
  '/assets/theme.css',
  '/assets/prism/prism.css',
  '/assets/bootstrap/js/bootstrap.bundle.min.js',
  '/assets/lang/i18n.js',
  '/assets/theme.js',
  '/assets/prism/prism.js',
];

function buildAssetHashes() {
  const out = {};
  for (const url of CACHE_BUSTED_ASSETS) {
    const fp = path.join(ROOT, url);
    if (!fs.existsSync(fp)) continue;
    out[url] = crypto.createHash('sha1').update(fs.readFileSync(fp)).digest('hex').slice(0, 8);
  }
  return out;
}

const ASSET_HASHES = buildAssetHashes();

// Append ?v=<hash> to each cache-busted asset URL in `html`. Idempotent
// against already-stamped URLs because we only match the exact bare form.
function stampCacheBust(html) {
  for (const [url, hash] of Object.entries(ASSET_HASHES)) {
    html = html.replaceAll(`"${url}"`, `"${url}?v=${hash}"`);
  }
  return html;
}

// hreflang region subtags should be uppercase per BCP 47 (`pt-BR`, not `pt-br`).
const HREFLANG_MAP = {
  'pt-br': 'pt-BR',
  'pt-pt': 'pt-PT',
};

function hreflangFor(lang) {
  return HREFLANG_MAP[lang] || lang;
}

function urlForPage(lang, page) {
  return `${DOMAIN}${i18n.buildPath(lang, page)}`;
}

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

function buildHreflangAlternates(page) {
  const langsWithPage = i18n.allLanguages.filter(
    (l) => fs.existsSync(fragmentPath(l, page))
  );
  const lines = [];
  for (const altLang of langsWithPage) {
    lines.push(`  <link rel="alternate" hreflang="${hreflangFor(altLang)}" href="${urlForPage(altLang, page)}" />`);
  }
  if (langsWithPage.includes('en')) {
    lines.push(`  <link rel="alternate" hreflang="x-default" href="${urlForPage('en', page)}" />`);
  }
  return lines.join('\n');
}

// Filesystem path for a (lang, page) — mirrors i18n.buildPath but rooted in ROOT.
function outputPath(lang, page) {
  if (lang === 'en') {
    if (page === 'about') return path.join(ROOT, 'index.html');
    return path.join(ROOT, page, 'index.html');
  }
  if (page === 'about') return path.join(ROOT, lang, 'index.html');
  const slug = i18n.getPath(lang, page);
  return path.join(ROOT, lang, slug, 'index.html');
}

// Filesystem path for the legacy /en/... alias of an English page.
function enAliasPath(page) {
  if (page === 'about') return path.join(ROOT, 'en', 'index.html');
  return path.join(ROOT, 'en', page, 'index.html');
}

// Filesystem path for a non-English language's English-slug alias
// (only when the translated slug differs from the English slug).
function translatedSlugAliasPath(lang, page) {
  if (page === 'about') return null; // about always lives at /<lang>/
  const slug = i18n.getPath(lang, page);
  if (slug === page) return null; // no rename, no alias
  return path.join(ROOT, lang, page, 'index.html');
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
  // Convert canonical /en/<slug>/ authoring paths to the actual deployed
  // URL for `lang`. For English: /en/<slug>/ → /<slug>/ (and /en/ → /).
  // For others: /en/<slug>/ → /<lang>/<translated-slug>/ (and /en/ → /<lang>/).
  for (const a of mainNode.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href');
    if (!href.startsWith('/en/')) continue;
    const m = href.match(/^\/en\/([^/?#]*)(\/?)(.*)$/);
    if (!m) continue;
    const slug = m[1];
    const trailing = m[2];
    const rest = m[3];
    if (slug === '') {
      // /en/ → about page for `lang`.
      a.setAttribute('href', `${i18n.langPrefix(lang)}/${rest}`);
      continue;
    }
    if (slug === 'about' || i18n.canonicalPaths.includes(slug)) {
      const translatedSlug = slug === 'about' ? '' : i18n.getPath(lang, slug);
      if (slug === 'about') {
        a.setAttribute('href', `${i18n.langPrefix(lang)}/${rest}`);
      } else {
        a.setAttribute('href', `${i18n.langPrefix(lang)}/${translatedSlug}${trailing}${rest}`);
      }
    }
    // Unknown slug under /en/ — leave as is (shouldn't happen in clean source).
  }
}

// Empty redirect stub — meta-refresh + JS fallback, no chrome, no `noindex`.
// Crawlers follow meta-refresh (0s) as a soft redirect and update their index.
function redirectStub(targetPath, lang) {
  const t = JSON.stringify(targetPath);
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <title>Redirecting…</title>
  <link rel="canonical" href="${targetPath}">
  <meta http-equiv="refresh" content="0;url=${targetPath}">
</head>
<body>
  <p>Redirecting to <a href="${targetPath}">${targetPath}</a>…</p>
  <script>window.location.replace(${t});</script>
</body>
</html>
`;
}

function writeRedirectStub(stubPath, targetPath, lang) {
  fs.mkdirSync(path.dirname(stubPath), { recursive: true });
  fs.writeFileSync(stubPath, redirectStub(targetPath, lang));
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
  out = out.replaceAll('@@LANG_PREFIX@@', i18n.langPrefix(lang));
  out = out.replaceAll('@@TITLE@@', htmlText(title));
  out = out.replaceAll('@@TOGGLE_NAV@@', htmlAttr(nav.toggleNav));
  out = out.replaceAll('@@CLOSE@@', htmlAttr(nav.close));
  out = out.replaceAll('@@CANONICAL_URL@@', urlForPage(lang, page));
  out = out.replace('@@HREFLANG_ALTERNATES@@', buildHreflangAlternates(page));

  // Footer labels (nav.label)
  for (const slug of Object.keys(nav.label)) {
    out = out.replaceAll(`@@LABEL_${slug}@@`, htmlText(nav.label[slug]));
  }
  // Footer social labels (nav.footer)
  for (const key of Object.keys(nav.footer)) {
    out = out.replaceAll(`@@FOOTER_${key}@@`, htmlText(nav.footer[key]));
  }

  // Per-language slug rewrites on absolute paths in the template footer.
  // Template uses @@LANG_PREFIX@@/<en-slug>/; after substitution it's
  // /<lang>/<en-slug>/ (non-English) or /<en-slug>/ (English). Translate
  // slugs for non-English where the translation differs.
  if (lang !== 'en') {
    for (const slug of i18n.canonicalPaths) {
      const translated = i18n.getPath(lang, slug);
      if (translated === slug) continue;
      out = out.replaceAll(`/${lang}/${slug}/`, `/${lang}/${translated}/`);
    }
  }

  // Inject main at the marker.
  out = out.replace('<!-- @main -->', main.outerHTML);

  // Sanity check: no unresolved markers.
  const unresolved = out.match(/@@[A-Z_][A-Z0-9_-]*@@/g);
  if (unresolved) {
    throw new Error(`Unresolved markers in ${lang}/${page}: ${[...new Set(unresolved)].join(', ')}`);
  }

  // Cache-bust chrome asset URLs.
  out = stampCacheBust(out);

  // Write the canonical page.
  const outPath = outputPath(lang, page);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);

  // Emit redirect stubs at any alias path so legacy URLs keep working.
  const canonicalPath = i18n.buildPath(lang, page);
  const aliases = [];
  if (lang === 'en') {
    aliases.push(enAliasPath(page));
  } else {
    const slugAlias = translatedSlugAliasPath(lang, page);
    if (slugAlias) aliases.push(slugAlias);
  }
  for (const aliasPath of aliases) {
    writeRedirectStub(aliasPath, canonicalPath, lang);
  }

  return { ok: true, outPath, aliases };
}

// Hand-written entry points outside the fragment pipeline that still load
// cache-busted assets directly. Stamped at the end of the build so a stale
// cached copy can't break them.
const EXTRA_STAMPED_FILES = [
  path.join(ROOT, 'codes', 'index.htm'),
];

let ok = 0, skipped = 0, errors = 0, redirects = 0;
const pages = pageArg ? [pageArg] : i18n.canonicalPaths;

for (const lang of languages) {
  console.log(`${lang}:`);
  for (const page of pages) {
    try {
      const r = buildPage(lang, page);
      if (r.ok) {
        console.log(`  ✓ ${path.relative(ROOT, r.outPath)}`);
        ok++;
        for (const a of r.aliases) {
          console.log(`    ↪ redirect: ${path.relative(ROOT, a)}`);
          redirects++;
        }
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
// Re-stamp hand-written entry points (outside the fragment pipeline).
// Idempotent: re-running with unchanged assets leaves bytes untouched.
for (const file of EXTRA_STAMPED_FILES) {
  if (!fs.existsSync(file)) continue;
  const original = fs.readFileSync(file, 'utf8');
  // Strip any existing ?v=… first so re-runs replace rather than stack.
  const cleaned = original.replace(
    new RegExp(`("(?:${CACHE_BUSTED_ASSETS.map(u => u.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))(?:\\?v=[a-f0-9]+)?(")`, 'g'),
    '$1$2'
  );
  const stamped = stampCacheBust(cleaned);
  if (stamped !== original) {
    fs.writeFileSync(file, stamped);
    console.log(`  ↻ stamped ${path.relative(ROOT, file)}`);
  }
}

console.log(`\nDone: ${ok} built, ${redirects} redirect stub(s), ${skipped} skipped, ${errors} errors.`);
process.exit(errors > 0 ? 1 : 0);
