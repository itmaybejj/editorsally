const fs = require('fs');
const m = JSON.parse(fs.readFileSync('assets/lang/manifest.json','utf8'));
const ids = ['s-88ba', 's-5df8'];
let count = 0;
for (const lang of Object.keys(m.translations)) {
  const demo = m.translations[lang]['demo'];
  if (!demo) continue;
  for (const id of ids) {
    if (m.source['demo'][id] && demo[id] !== m.source['demo'][id]) {
      demo[id] = m.source['demo'][id];
      count++;
    }
  }
}
fs.writeFileSync('assets/lang/manifest.json', JSON.stringify(m, null, 2));
console.log('Synced ' + count + ' demo hash entries across all languages');
