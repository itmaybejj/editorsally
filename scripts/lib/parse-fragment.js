'use strict';

const crypto = require('crypto');
const { parse } = require('node-html-parser');

const BLOCK_SEL = 'p, li, h1, h2, h3, h4, h5, h6, button, figcaption, summary, dt, dd, th, td, blockquote, [data-translate]';
const IMG_SEL = 'img';
const SKIP_ANCESTORS = new Set(['script', 'style', 'pre', 'code']);
const OWN_TRANSLATABLE_ATTRS = ['aria-label', 'title', 'placeholder'];
const IMG_TRANSLATABLE_ATTRS = ['alt', 'aria-label', 'title', 'longdesc'];

function parseFragment(html) {
  return parse(html, { lowerCaseTagName: false, comment: true, voidTag: { closingSlash: true } });
}

function isSkipped(node) {
  if (node.getAttribute && node.getAttribute('data-i18n-skip') !== undefined && node.getAttribute('data-i18n-skip') !== null) return true;
  let p = node.parentNode;
  while (p && p.rawTagName) {
    if (SKIP_ANCESTORS.has(p.rawTagName.toLowerCase())) return true;
    p = p.parentNode;
  }
  return false;
}

function isLeafBlock(node) {
  return !node.querySelector(BLOCK_SEL);
}

function translatableNodes(root) {
  const blocks = root.querySelectorAll(BLOCK_SEL)
    .filter(n => !isSkipped(n) && isLeafBlock(n));
  const imgs = root.querySelectorAll(IMG_SEL).filter(n => !isSkipped(n));
  const all = blocks.concat(imgs);
  return sortInDocumentOrder(root, all);
}

function sortInDocumentOrder(root, nodes) {
  const order = new Map();
  let i = 0;
  walk(root, n => { order.set(n, i++); });
  return nodes.slice().sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
}

function walk(node, fn) {
  fn(node);
  if (node.childNodes) for (const c of node.childNodes) walk(c, fn);
}

function normalizeWhitespace(str) {
  return str.replace(/\s+/g, ' ').trim();
}

function isImg(node) {
  return node.rawTagName && node.rawTagName.toLowerCase() === 'img';
}

function ownAttrSignature(node, attrNames) {
  return attrNames
    .map(a => `${a}=${node.getAttribute(a) ?? ''}`)
    .join('|');
}

function stripImgAltsForHash(innerHTML) {
  // Strip alt in any form (quoted, single-quoted, unquoted, or bare) from <img> tags.
  return innerHTML.replace(/<img\b[^>]*>/gi, (match) =>
    match.replace(/\s+alt(?:\s*=\s*("[^"]*"|'[^']*'|[^\s/>]+))?(?=[\s/>])/gi, '')
  );
}

function hashSegment(node) {
  let input;
  if (isImg(node)) {
    input = ownAttrSignature(node, IMG_TRANSLATABLE_ATTRS);
  } else {
    const inner = normalizeWhitespace(stripImgAltsForHash(node.innerHTML));
    const ownAttrs = ownAttrSignature(node, OWN_TRANSLATABLE_ATTRS);
    input = `${inner}|${ownAttrs}`;
  }
  return crypto.createHash('sha1').update(input).digest('hex').slice(0, 12);
}

function generateId() {
  return 's-' + crypto.randomBytes(2).toString('hex');
}

function assignNewId(existingIds) {
  let id;
  do { id = generateId(); } while (existingIds.has(id));
  existingIds.add(id);
  return id;
}

function collectExistingIds(root) {
  const ids = new Set();
  for (const n of root.querySelectorAll('[data-i18n-id]')) {
    ids.add(n.getAttribute('data-i18n-id'));
  }
  return ids;
}

// Void elements — never carry a closing tag, so they're skipped by the
// structural check below.
const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

// Tags whose contents may hold `<`/`>` that aren't markup.
const RAW_TEXT_TAGS = new Set(['script', 'style']);

/**
 * Verify a fragment's tags are balanced and properly nested.
 *
 * node-html-parser silently recovers from mismatched tags by discarding or
 * re-parenting elements, which corrupts the built page instead of failing the
 * build. Checking first turns a silent layout bug into a build error.
 *
 * Returns an array of human-readable problems (empty when the fragment is well
 * formed). Line numbers are 1-indexed.
 */
function findStructuralErrors(html) {
  const errors = [];
  const stack = [];
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>])*)>/g;
  const lineAt = (index) => html.slice(0, index).split('\n').length;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const isClose = m[1] === '/';
    const tag = m[2].toLowerCase();
    const attrs = m[3];
    const line = lineAt(m.index);

    if (!isClose && RAW_TEXT_TAGS.has(tag)) {
      // Skip to the matching close tag; the body isn't markup.
      const close = new RegExp(`</${tag}\\s*>`, 'i');
      close.lastIndex = tagRe.lastIndex;
      const rest = html.slice(tagRe.lastIndex);
      const found = rest.match(close);
      if (found) tagRe.lastIndex += found.index + found[0].length;
      continue;
    }
    if (VOID_TAGS.has(tag) || (!isClose && attrs.trimEnd().endsWith('/'))) continue;

    if (!isClose) {
      stack.push({ tag, line });
      continue;
    }
    const top = stack[stack.length - 1];
    if (!top) {
      errors.push(`line ${line}: stray </${tag}> with no matching open tag`);
      continue;
    }
    if (top.tag === tag) {
      stack.pop();
      continue;
    }
    const openIdx = stack.map((f) => f.tag).lastIndexOf(tag);
    if (openIdx === -1) {
      errors.push(`line ${line}: stray </${tag}> (innermost open tag is <${top.tag}> from line ${top.line})`);
      continue;
    }
    for (let i = stack.length - 1; i > openIdx; i--) {
      errors.push(`line ${stack[i].line}: <${stack[i].tag}> is never closed (</${tag}> at line ${line} closes it implicitly)`);
    }
    stack.length = openIdx;
  }
  for (const frame of stack) {
    errors.push(`line ${frame.line}: <${frame.tag}> is never closed`);
  }
  return errors;
}

// Throw when `html` is not well formed. `label` identifies the source in the
// message (e.g. "en/features").
function assertWellFormed(html, label) {
  const errors = findStructuralErrors(html);
  if (errors.length) {
    throw new Error(
      `Malformed HTML in ${label}:\n    ${errors.join('\n    ')}`
    );
  }
}

function stripI18nIds(root) {
  for (const n of root.querySelectorAll('[data-i18n-id]')) {
    n.removeAttribute('data-i18n-id');
  }
}

module.exports = {
  BLOCK_SEL,
  IMG_SEL,
  parseFragment,
  translatableNodes,
  normalizeWhitespace,
  stripImgAltsForHash,
  hashSegment,
  assignNewId,
  collectExistingIds,
  stripI18nIds,
  findStructuralErrors,
  assertWellFormed,
  isImg,
  isSkipped,
  isLeafBlock,
};
