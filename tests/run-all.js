/* Runs the suites and prints a summary.

     node tests/run-all.js                 all suites, in parallel
     node tests/run-all.js eqtest,behave   just those two
     node tests/run-all.js --jobs 1        one at a time, for debugging

   Needs NODE_PATH and LD_LIBRARY_PATH for puppeteer.

   Sequential, the set takes about six minutes, and almost all of that is one
   Chromium waiting on another Chromium: the suites are independent, so the
   only thing the queue bought was tidy output. Now they run in a pool the
   width of the machine and the output is buffered per suite, so a line still
   belongs to the suite that printed it. The order of the summary is fixed by
   the list below rather than by who finished first, so two runs of the same
   set read the same.

   Slowest first: with the long ones started early, the tail of the run is
   short jobs filling the gaps instead of one straggler holding the pool. */
const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const HERE = __dirname;

/* Секунды - прошлые замеры, только для порядка запуска: точность тут не важна,
   важно, чтобы длинные наборы стартовали раньше коротких.

   Обход страниц разбит по ширинам: он в одиночку занимал столько же, сколько
   все остальные наборы вместе, и держал пул до конца прогона. Ширины друг от
   друга не зависят, так что это четыре задачи, а не одна длинная. Имя набора
   для отбора остаётся прежним: `run-all.js audit2` запустит все четыре. */
const SUITES = [
  ['audit2',   'обход страниц: 1180',              45, ['1180']],
  ['audit2',   'обход страниц: 768',               45, ['768']],
  ['states',   'обход состояний',                  65],
  ['audit2',   'обход страниц: 390',               40, ['390']],
  ['audit2',   'обход страниц: 360',               40, ['360']],
  ['behave',   'броски, поиск, язык, навигация',   40],
  ['lists2',   'страница списка',                  40],
  ['eqtest',   'снаряжение и фильтры',             30],
  ['qa',       'регрессии по отчёту QA',           26],
  ['typo',     'шрифты и шкала размеров',          23],
  ['notes',    'заметки мастера',                  22],
  ['dataint',  'инварианты data.js',               14],
  ['flows',    'модалка, адрес списка, буфер',     10],
  ['select',   'выделение и пакетные действия',    10],
  ['craftmob', 'вёрстка на узких экранах',          9],
  ['derived',  'производные файлы и каталог',       8],
  ['craft',    'цепочки улучшений',                 7],
  ['noart',    'записи без картинки',               7],
  ['hues',     'цвета ярлыков различимы',           4],
  ['i18n',     'паритет переводов',                 1]
];

const args = process.argv.slice(2);
const jobsArg = args.indexOf('--jobs');
const JOBS = jobsArg >= 0 ? Math.max(1, +args[jobsArg + 1] || 1)
                          : Math.max(1, Math.min(os.cpus().length, 8));
const only = args.filter((a, i) => a[0] !== '-' && !(jobsArg >= 0 && i === jobsArg + 1))
                 .join(',').split(',').filter(Boolean);
const queue = SUITES.filter(s => !only.length || only.indexOf(s[0]) >= 0);
/* Ключ для отчёта: у обхода страниц наборов четыре под одним именем */
const keyOf = s => s[0] + (s[3] ? ':' + s[3].join('-') : '');
if (!queue.length) {
  console.log('таких наборов нет: ' + only.join(', '));
  process.exit(1);
}

const done = {};           // name -> { ok, secs, out }
let next = 0, running = 0, bad = 0;
const t0 = Date.now();

/* Печатается строго в порядке списка: набор, который обогнал соседа, ждёт его,
   иначе два одинаковых прогона дают разный отчёт и его нельзя сравнить. */
let printed = 0;
function flush(){
  while (printed < queue.length && done[keyOf(queue[printed])]) {
    const [name, what] = queue[printed];
    const r = done[keyOf(queue[printed])];
    console.log((r.ok ? '  ok  ' : 'FAIL  ') + name.padEnd(9) + what.padEnd(34) + r.secs + 's');
    if (!r.ok) r.out.split('\n').filter(l => /FAIL|Error/.test(l)).slice(0, 12)
                    .forEach(l => console.log('        ' + l.trim()));
    printed++;
  }
}

function start(){
  while (running < JOBS && next < queue.length) {
    const suite = queue[next++], name = suite[0], key = keyOf(suite);
    running++;
    const started = Date.now();
    let out = '';
    const p = spawn(process.execPath, [path.join(HERE, name + '.js')].concat(suite[3] || []),
                    { stdio: ['ignore', 'pipe', 'pipe'] });
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { out += d; });
    p.on('close', function (code) {
      if (code) bad++;
      done[key] = { ok: !code, secs: ((Date.now() - started) / 1000).toFixed(1), out: out };
      running--;
      flush();
      start();
      if (!running && next >= queue.length) finish();
    });
  }
}

function finish(){
  console.log('\n' + (bad ? bad + ' наборов упало' : 'все наборы прошли') +
              ' за ' + ((Date.now() - t0) / 1000).toFixed(0) + 'с' +
              (JOBS > 1 ? ' (в ' + JOBS + ' потока)' : ''));
  process.exit(bad ? 1 : 0);
}

start();
