#!/usr/bin/env node
/**
 * migrate-to-fragments.js — One-shot extraction of <main> content from current
 * full HTML files into fragment source files at content/<lang>/<page>.html.
 *
 * English mode (lang=en or default):
 *   - Extract <main>, rewrite relative internal links to absolute /en/<slug>/ form,
 *     apply stealth fix on demo (promote H2 to H1), write fragment.
 *
 * Non-English mode (any other lang):
 *   - Extract <main>, rewrite internal links from /<lang>/<translated-slug>/ back
 *     to canonical /en/<en-slug>/ form, position-match blocks against the English
 *     fragment to copy data-i18n-id attributes, write fragment.
 *   - Requires English to have been migrated AND normalized first.
 *
 * Usage:
 *   node scripts/migrate-to-fragments.js              # English, all pages
 *   node scripts/migrate-to-fragments.js en           # explicit English
 *   node scripts/migrate-to-fragments.js es           # Spanish, all pages
 *   node scripts/migrate-to-fragments.js es features  # Spanish, one page
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadI18n, ROOT } = require('./lib/i18n-loader.js');
const {
  parseFragment, translatableNodes, isImg,
} = require('./lib/parse-fragment.js');

const i18n = loadI18n();

const langArg = process.argv[2] || 'en';
const pageArg = process.argv[3];

if (!i18n.allLanguages.includes(langArg)) {
  console.error(`Unknown language: ${langArg}`);
  process.exit(1);
}

const pages = pageArg ? [pageArg] : i18n.canonicalPaths;

function sourcePath(lang, page) {
  return page === 'about'
    ? path.join(ROOT, lang, 'index.html')
    : path.join(ROOT, lang, page, 'index.html');
}

function fragmentPath(lang, page) {
  return path.join(ROOT, 'content', lang, `${page}.html`);
}

// Build slug-translation maps for this language.
// For non-English, we want to convert /<lang>/<translated>/ → /en/<canonical>/.
function translatedToCanonical(lang) {
  // map: translated-slug -> canonical-english-slug
  const map = new Map();
  for (const s of i18n.canonicalPaths) {
    map.set(i18n.getPath(lang, s), s);
  }
  return map;
}

function rewriteLink(href, lang) {
  // Skip external URLs, fragments only, mailto, etc.
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;

  if (lang === 'en') {
    // English: relative → /en/...
    // ./    or ../   (home)
    if (href === './' || href === '../') return '/en/';
    // ./#frag or ../#frag (home with fragment)
    let m = href.match(/^\.\.?\/(#.*)?$/);
    if (m) return '/en/' + (m[1] || '');
    // ./<slug>/  or ../<slug>/  or ./<slug>  or ../<slug>  (with optional trailing /, optional #frag)
    m = href.match(/^\.\.?\/([a-z0-9-]+)\/?(#.*)?$/i);
    if (m) {
      const slug = m[1];
      const frag = m[2] || '';
      // Validate it's a known slug; otherwise leave it alone.
      if (i18n.canonicalPaths.includes(slug)) {
        return `/en/${slug}/${frag}`;
      }
    }
    // Already absolute or unrecognized
    return href;
  }

  // Non-English: /<lang>/<translated>/ → /en/<canonical>/
  const t2c = translatedToCanonical(lang);
  // /<lang>/  (home, with optional fragment)
  let m = href.match(new RegExp(`^/${lang}/?(#.*)?$`));
  if (m) return '/en/' + (m[1] || '');
  // /<lang>/<slug>/ (with optional fragment)
  m = href.match(new RegExp(`^/${lang}/([^/?#]+)/?(#.*)?$`));
  if (m) {
    const translatedSlug = m[1];
    const frag = m[2] || '';
    const canonical = t2c.get(translatedSlug) || translatedSlug;
    return `/en/${canonical}/${frag}`;
  }
  return href;
}

function rewriteLinksInMain(mainNode, lang) {
  for (const a of mainNode.querySelectorAll('a[href]')) {
    const orig = a.getAttribute('href');
    const rewritten = rewriteLink(orig, lang);
    if (rewritten !== orig) a.setAttribute('href', rewritten);
  }
}

function applyDemoH1Fix(mainNode, page) {
  if (page !== 'demo') return false;
  // Look for an H2 with id="demo" or text "Demo" and promote to H1 if no H1 exists.
  const existingH1 = mainNode.querySelector('h1');
  if (existingH1) return false;
  const h2 = mainNode.querySelectorAll('h2').find(n =>
    n.getAttribute('id') === 'demo' || n.text.trim() === 'Demo'
  );
  if (!h2) return false;
  // node-html-parser doesn't expose tag renaming directly; replace the outerHTML.
  const newHTML = h2.outerHTML.replace(/^<h2\b/i, '<h1').replace(/<\/h2>$/i, '</h1>');
  h2.replaceWith(newHTML);
  return true;
}

function copyIdsByPosition(targetMain, sourceMain, page, lang) {
  const sourceNodes = translatableNodes(sourceMain);
  const targetNodes = translatableNodes(targetMain);
  if (sourceNodes.length !== targetNodes.length) {
    // Structural mismatch — produce a diagnostic but don't abort.
    // The fragment will be written without IDs; the translation skill will need
    // a manual alignment pass before it can do incremental updates.
    const diag = [];
    const max = Math.min(sourceNodes.length, targetNodes.length);
    let firstMismatch = -1;
    for (let i = 0; i < max; i++) {
      const sTag = sourceNodes[i].rawTagName || '?';
      const tTag = targetNodes[i].rawTagName || '?';
      if (sTag !== tTag) {
        diag.push(`pos ${i}: source=<${sTag}> target=<${tTag}>`);
        firstMismatch = i;
        break;
      }
    }
    if (firstMismatch === -1) {
      diag.push(`tail mismatch: source has ${sourceNodes.length}, target has ${targetNodes.length}`);
    }
    return { copied: 0, mismatch: `source ${sourceNodes.length}, target ${targetNodes.length}; ${diag.join('; ')}` };
  }
  let copied = 0;
  for (let i = 0; i < sourceNodes.length; i++) {
    const sId = sourceNodes[i].getAttribute('data-i18n-id');
    if (!sId) continue;
    targetNodes[i].setAttribute('data-i18n-id', sId);
    copied++;
  }
  return { copied, mismatch: null };
}

function processPage(lang, page) {
  const src = sourcePath(lang, page);
  if (!fs.existsSync(src)) {
    console.log(`  - skip ${lang}/${page}: source not found`);
    return { skipped: true };
  }
  const html = fs.readFileSync(src, 'utf8');
  const root = parseFragment(html);
  const main = root.querySelector('main');
  if (!main) {
    console.log(`  - skip ${lang}/${page}: no <main> element`);
    return { skipped: true };
  }

  // Stealth fix: promote H2 to H1 for the demo page (English source).
  let demoFixed = false;
  if (lang === 'en') {
    demoFixed = applyDemoH1Fix(main, page);
  }

  // Rewrite internal links to canonical /en/<slug>/ form.
  rewriteLinksInMain(main, lang);

  // For non-English: copy data-i18n-ids from the English fragment by position.
  let idsCopied = 0;
  let mismatch = null;
  if (lang !== 'en') {
    const enFragPath = fragmentPath('en', page);
    if (!fs.existsSync(enFragPath)) {
      throw new Error(
        `Cannot migrate ${lang}/${page}: English fragment ${enFragPath} not found. ` +
        `Run "node scripts/migrate-to-fragments.js en" first, then normalize-segments.`
      );
    }
    const enRoot = parseFragment(fs.readFileSync(enFragPath, 'utf8'));
    const enMain = enRoot.querySelector('main');
    if (!enMain) throw new Error(`English fragment ${enFragPath} has no <main>`);
    const r = copyIdsByPosition(main, enMain, page, lang);
    idsCopied = r.copied;
    mismatch = r.mismatch;
  }

  // Write fragment.
  const out = fragmentPath(lang, page);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, main.outerHTML + '\n');

  const notes = [];
  if (demoFixed) notes.push('promoted H2→H1');
  if (idsCopied) notes.push(`copied ${idsCopied} IDs`);
  if (mismatch) notes.push(`STRUCTURAL MISMATCH: ${mismatch}`);
  const sigil = mismatch ? '!' : '+';
  console.log(`  ${sigil} content/${lang}/${page}.html${notes.length ? ' (' + notes.join(', ') + ')' : ''}`);
  return { ok: true, mismatch: !!mismatch };
}

console.log(`Migrating ${langArg} (${pages.length} page${pages.length === 1 ? '' : 's'})…`);
let ok = 0, skipped = 0, errors = 0, mismatched = 0;
for (const page of pages) {
  try {
    const r = processPage(langArg, page);
    if (r.ok) ok++;
    if (r.mismatch) mismatched++;
    if (r.skipped) skipped++;
  } catch (e) {
    console.error(`  ✗ ${langArg}/${page}: ${e.message}`);
    errors++;
  }
}
console.log(`\nDone: ${ok} migrated, ${skipped} skipped, ${errors} errors, ${mismatched} with structural mismatches.`);
process.exit(errors > 0 ? 1 : 0);
