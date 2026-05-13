const m = JSON.parse(require('fs').readFileSync('assets/lang/manifest.json','utf8'));
const src = m.source;
const bg = m.translations.bg;
let stale = 0, total = 0;
for (const page of Object.keys(bg)) {
  const s = src[page] || {};
  const t = bg[page] || {};
  const segs = Object.keys(s);
  total += segs.length;
  const st = segs.filter(id => t[id] !== s[id]);
  stale += st.length;
  if (st.length > 0) console.log('bg/'+page+': '+st.length+'/'+segs.length+' stale');
}
console.log('Total: '+stale+'/'+total+' stale');
