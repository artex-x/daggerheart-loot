/* Translation parity, checked against the source rather than the screen: every
   t().key the code asks for has to exist in both languages, and neither
   language may carry a key the other lacks. */
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'app.js'), 'utf8');
let fail = 0;
const ok = (c, m) => { if (!c) { fail++; console.log('  FAIL ' + m); } };

function objectAt(text, start){
  let d = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{') d++;
    else if (text[i] === '}') { d--; if (!d) return text.slice(start, i + 1); }
  }
  throw new Error('unbalanced');
}
const T = new Function('return ' + objectAt(src, src.indexOf('{', src.indexOf('const T = '))))();

const walk = (o, p = []) => Object.keys(o).reduce((a, k) =>
  a.concat(o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])
    ? walk(o[k], p.concat(k)) : [p.concat(k).join('.')]), []);

const ru = new Set(walk(T.ru)), en = new Set(walk(T.en));
console.log('ключей: ru ' + ru.size + ', en ' + en.size);
[...ru].filter(k => !en.has(k)).forEach(k => ok(false, 'нет английского перевода: ' + k));
[...en].filter(k => !ru.has(k)).forEach(k => ok(false, 'нет русского перевода: ' + k));

/* every key the code reaches for */
const used = new Set();
src.replace(/\bt\(\)\.(\w+)/g, (_, k) => used.add(k));
src.replace(/\bt\(\)\[([^\]]+)\]/g, (_, k) => { if (/^'\w+'$/.test(k)) used.add(k.slice(1, -1)); });
[...used].forEach(k => {
  ok(T.ru[k] !== undefined, 'код просит t().' + k + ', в русском такого нет');
  ok(T.en[k] !== undefined, 'код просит t().' + k + ', в английском такого нет');
});

/* keys nobody asks for any more */
const dynamic = new Set(['tabs', 'help', 'pages']);
const indirect = new Set();
src.replace(/RAR_KEY = \{([^}]*)\}/, (_, b) => b.replace(/:\s*'(\w+)'/g, (_, v) => indirect.add(v)));
src.replace(/KINDS = \[([^\]]*\])\]/, (_, b) => b.replace(/'(\w+)'\]/g, (_, v) => indirect.add(v)));
src.replace(/\['(\w+)',\s*'(\w+)'\]/g, (_, a, b) => indirect.add(b));
const dead = [...ru].filter(k => k.indexOf('.') < 0 && !used.has(k) && !dynamic.has(k) && !indirect.has(k));
if (dead.length) console.log('  строки без обращений: ' + dead.join(', '));

console.log(fail ? '\n' + fail + ' FAILED' : '\nпереводы: паритет соблюдён');
process.exit(fail ? 1 : 0);
