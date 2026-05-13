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
  isImg,
  isSkipped,
  isLeafBlock,
};
