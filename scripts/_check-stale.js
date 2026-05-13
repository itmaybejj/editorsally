const m = JSON.parse(require('fs').readFileSync('assets/lang/manifest.json','utf8'));
const pages = Object.keys(m.source);
const langs = Object.keys(m.translations);
const stale = [];
for (const lang of langs) {
  for (const page of pages) {
    const src = m.source[page] || {};
    const tr = (m.translations[lang] || {})[page] || {};
    if (Object.keys(src).length === 0) continue;
    if (Object.keys(tr).length === 0) { stale.push(lang+'/'+page+' (empty)'); continue; }
    const staleSegs = Object.keys(src).filter(id => tr[id] !== src[id]);
    if (staleSegs.length > 0) stale.push(lang+'/'+page+' ('+staleSegs.length+' stale)');
  }
}
console.log('Stale pairs ('+stale.length+'):');
stale.forEach(s => console.log(' ',s));
