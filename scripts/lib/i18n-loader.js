'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');

function loadI18n() {
  const src = fs.readFileSync(path.join(ROOT, 'assets', 'lang', 'i18n.js'), 'utf8');
  const wrapped = src.replace(/^const defined_i18n\s*=/m, '__result =');
  const context = { __result: null };
  vm.runInNewContext(wrapped, context);
  return context.__result;
}

module.exports = { loadI18n, ROOT };
