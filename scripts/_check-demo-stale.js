const fs = require('fs');
const m = JSON.parse(fs.readFileSync('assets/lang/manifest.json','utf8'));
const src = m.source['demo'];
const tr = m.translations['da']['demo'];
const stale = Object.keys(src).filter(id => tr[id] !== src[id]);
console.log('Stale demo ids for da:', stale);
const html = fs.readFileSync('content/en/demo.html','utf8');
stale.forEach(id => {
  const rx = new RegExp('data-i18n-id="'+id+'"[^>]*>([^<]{0,100})');
  const match = html.match(rx);
  console.log(id+':', match ? match[1].trim() : '(complex element — check manually)');
});
