// Temporary alignment check — delete after Phase 2 review.
const p = require('./lib/parse-fragment.js');
const fs = require('fs');
const path = require('path');

const lang = process.argv[2] || 'es';
const page = process.argv[3] || 'license';
const enRoot = p.parseFragment(fs.readFileSync(`content/en/${page}.html`, 'utf8'));
const tgtRoot = p.parseFragment(fs.readFileSync(`content/${lang}/${page}.html`, 'utf8'));
const enNodes = p.translatableNodes(enRoot.querySelector('main'));
const tgtNodes = p.translatableNodes(tgtRoot.querySelector('main'));
console.log(`EN: ${enNodes.length}   ${lang.toUpperCase()}: ${tgtNodes.length}`);

let mismatches = 0;
for (let i = 0; i < Math.max(enNodes.length, tgtNodes.length); i++) {
  const e = enNodes[i];
  const t = tgtNodes[i];
  const eId = e && e.getAttribute('data-i18n-id');
  const tId = t && t.getAttribute('data-i18n-id');
  const eTag = e && e.rawTagName;
  const tTag = t && t.rawTagName;
  if (eId !== tId || eTag !== tTag) {
    mismatches++;
    if (mismatches <= 5) console.log(`pos ${i}: EN <${eTag}> ${eId}  vs  ${lang.toUpperCase()} <${tTag}> ${tId}`);
  }
}
console.log(`Total ID/tag mismatches: ${mismatches}`);

const m = JSON.parse(fs.readFileSync('assets/lang/manifest.json', 'utf8'));
const tgtHashes = m.translations[lang]?.[page] || {};
const srcHashes = m.source[page] || {};
const drift = Object.keys(srcHashes).filter(id => srcHashes[id] !== tgtHashes[id]);
console.log(`Manifest hash drift: ${drift.length} of ${Object.keys(srcHashes).length} segments`);
