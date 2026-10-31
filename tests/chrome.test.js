#!/usr/bin/env node
/**
 * Regression tests for the site chrome (nav labels and script loading).
 * Run with: node --test tests/chrome.test.js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const i18nSource = fs.readFileSync(path.join(ROOT, 'assets/lang/i18n.js'), 'utf8');
const i18n = new Function(`${i18nSource}\nreturn defined_i18n;`)();
const themeSource = fs.readFileSync(path.join(ROOT, 'assets/theme.js'), 'utf8');
const template = fs.readFileSync(path.join(ROOT, 'template.html'), 'utf8');

test('every language has a label for every slug the navbar uses', () => {
  const navSlugs = [...themeSource.matchAll(/\$\{l\('([^']+)'\)\}/g)].map((m) => m[1]);
  assert.ok(navSlugs.includes('news'), 'expected to find nav slugs in theme.js');

  const missing = [];
  for (const lang of i18n.allLanguages) {
    for (const slug of navSlugs) {
      if (!i18n.getNav(lang).label[slug]) missing.push(`${lang}:${slug}`);
    }
  }
  assert.deepStrictEqual(missing, []);
});

test('i18n.js is guaranteed to run before theme.js', () => {
  const tags = [...template.matchAll(/<script\b[^>]*\bsrc="\/assets\/[^"]*"[^>]*>/g)].map((m) => m[0]);
  const i18nIndex = tags.findIndex((t) => t.includes('/assets/lang/i18n.js'));
  const themeIndex = tags.findIndex((t) => t.includes('/assets/theme.js'));

  assert.ok(i18nIndex !== -1 && i18nIndex < themeIndex, 'i18n.js must come before theme.js');
  for (const tag of [tags[i18nIndex], tags[themeIndex]]) {
    assert.doesNotMatch(tag, /\basync\b/, `async scripts run in download order: ${tag}`);
  }
});

test('news has a translated slug in every language that translates slugs', () => {
  const missing = Object.keys(i18n.paths).filter((lang) => !i18n.paths[lang].news);
  assert.deepStrictEqual(missing, []);
});

test('every language has a built news page, so footer links resolve', () => {
  const missing = i18n.allLanguages.filter((lang) => {
    const slug = i18n.getPath(lang, 'news');
    const built = lang === 'en' ? `${slug}/index.html` : `${lang}/${slug}/index.html`;
    return !fs.existsSync(path.join(ROOT, built));
  });
  assert.deepStrictEqual(missing, []);
});

test('on-this-page heading ids survive non-Latin heading text', () => {
  // \w is ASCII-only: a heading such as "新闻" slugged to "", producing href="#",
  // and document.querySelector('#') throws when the link is clicked.
  assert.doesNotMatch(themeSource, /replace\(\/\[\^\\w-\]\+\/g/);
  assert.doesNotMatch(themeSource, /querySelector\(href\)/);
});
