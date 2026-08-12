/* Runs every suite in one go and prints a summary.
   node tools/../run-all.js   (needs NODE_PATH and LD_LIBRARY_PATH for puppeteer) */
const { execFileSync } = require('child_process');
const path = require('path');
const HERE = __dirname;

const ONLY=(process.argv[2]||'').split(',').filter(Boolean);
const SUITES = [
  ['dataint',  'инварианты data.js'],
  ['derived',  'производные файлы и каталог'],
  ['i18n',     'паритет переводов'],
  ['typo',     'шрифты и шкала размеров'],
  ['hues',     'цвета ярлыков различимы'],
  ['craft',    'цепочки улучшений'],
  ['flows',    'модалка, адрес списка, буфер'],
  ['select',   'выделение и пакетные действия'],
  ['notes',    'заметки мастера'],
  ['noart',    'записи без картинки'],
  ['eqtest',   'снаряжение и фильтры'],
  ['lists2',   'страница списка'],
  ['behave',   'броски, поиск, язык, навигация'],
  ['qa',       'регрессии по отчёту QA'],
  ['craftmob', 'вёрстка на узких экранах'],
  ['audit2',   'обход всех страниц'],
  ['states',   'обход состояний'],
];

let bad = 0;
const t0 = Date.now();
for (const [name, what] of SUITES.filter(x=>!ONLY.length||ONLY.indexOf(x[0])>=0)) {
  const started = Date.now();
  let out = '', okRun = true;
  try {
    out = execFileSync('node', [path.join(HERE, name + '.js')], { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    okRun = false; bad++;
    out = (e.stdout || '') + (e.stderr || '');
  }
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log((okRun ? '  ok  ' : 'FAIL  ') + name.padEnd(9) + what.padEnd(34) + secs + 's');
  if (!okRun) out.split('\n').filter(l => /FAIL|Error/.test(l)).slice(0, 12)
                 .forEach(l => console.log('        ' + l.trim()));
}
console.log('\n' + (bad ? bad + ' наборов упало' : 'все наборы прошли') +
            ' за ' + ((Date.now() - t0) / 1000).toFixed(0) + 'с');
process.exit(bad ? 1 : 0);
