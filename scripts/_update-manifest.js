const fs = require('fs');
const lang = process.argv[2];
const pages = process.argv.slice(3);
const m = JSON.parse(fs.readFileSync('assets/lang/manifest.json','utf8'));
const src = m.source;
if (!m.translations[lang]) m.translations[lang] = {};
for (const page of pages) {
  m.translations[lang][page] = {};
  for (const [id, hash] of Object.entries(src[page])) {
    m.translations[lang][page][id] = hash;
  }
}
fs.writeFileSync('assets/lang/manifest.json', JSON.stringify(m, null, 2));
console.log('Manifest updated for ' + lang + '/' + pages.join(', '));
