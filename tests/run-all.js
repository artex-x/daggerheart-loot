/* Runs the suites and prints a summary.

     node tests/run-all.js                 all suites, in parallel
     node tests/run-all.js derived,craft   just those two
     node tests/run-all.js --jobs 1        one at a time, for debugging
     node tests/run-all.js --exclude=app/golden   everything but that one suite

   Needs NODE_PATH and LD_LIBRARY_PATH for puppeteer.

   The suites are independent, so they run in a pool the width of the machine
   and the output is buffered per suite, so a line still belongs to the suite
   that printed it. The order of the summary is fixed by the list below rather
   than by who finished first, so two runs of the same set read the same.

   Slowest first: with the long ones started early, the tail of the run is
   short jobs filling the gaps instead of one straggler holding the pool.

   R0c (2026-09-17) deleted the fourteen suites that drove the live app
   (`index.html`/`app.js`/`style.css`) and the parity harness that compared it
   against `dist/`; `docs/specs/COVERAGE.md`'s per-suite table says where each
   one's assertions went. What is left runs against `dist/` alone, plus a
   handful of fs-only data/contract checks. */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const HERE = __dirname;

/* Секунды - прошлые замеры, только для порядка запуска: точность тут не важна,
   важно, чтобы длинные наборы стартовали раньше коротких.

   Обход страниц разбит по ширинам: он в одиночку занимал столько же, сколько
   все остальные наборы вместе, и держал пул до конца прогона. Ширины друг от
   друга не зависят, так что это четыре задачи, а не одна длинная. Имя набора
   для отбора остаётся прежним: `run-all.js app/sweep` запускает все его
   четыре ширины разом, и для структурных образцов: `run-all.js app/golden`
   запускает все четыре его шарда разом (issue 47, R0a - ~1000s unsharded is
   why it is four rows, not one; never call `node tests/app/golden.js` bare in
   one foreground call). */
const SUITES = [
  ['app/sweep', 'dist/: обход страниц 1180',        370, ['1180']],
  ['app/sweep', 'dist/: обход страниц 768',          320, ['768']],
  ['app/sweep', 'dist/: обход страниц 390',          320, ['390']],
  ['app/sweep', 'dist/: обход страниц 360',          320, ['360']],
  ['app/golden', 'dist/: структурные образцы 1/4',   265, ['--shard=1/4']],
  ['app/golden', 'dist/: структурные образцы 2/4',   260, ['--shard=2/4']],
  ['app/golden', 'dist/: структурные образцы 3/4',   250, ['--shard=3/4']],
  ['app/golden', 'dist/: структурные образцы 4/4',   250, ['--shard=4/4']],
  ['app/print', 'dist/: печать карточек',           176],
  ['app/contracts', 'dist/: контракты и фикстуры',   120],
  ['app/states', 'dist/: реальный ввод',              90],
  ['app/typo', 'dist/: шрифты и шкала',             40],
  ['contracts','контракты и золотые образцы',       30],
  ['dataint',  'инварианты data.js',               14],
  ['derived',  'производные файлы и каталог',       8],
  ['craft',    'цепочки улучшений',                 7],
  ['app/hues', 'dist/: цвета ярлыков',              12],
  ['stub',     'страницы-заглушки i/',               5]
];

const args = process.argv.slice(2);
const jobsArg = args.indexOf('--jobs');
const JOBS = jobsArg >= 0 ? Math.max(1, +args[jobsArg + 1] || 1)
                          : Math.max(1, Math.min(os.cpus().length, 8));
/* `--exclude=parity` pulls a suite out of this run without touching the
   include list - CI runs it as its own sharded job matrix instead (parity.js
   `--shard`), so the pooled run here would otherwise gate every push on the
   same 867s a second time, serialised behind everything else in the pool. */
const excludeArg = args.find(a => a.startsWith('--exclude='));
const exclude = excludeArg ? excludeArg.slice('--exclude='.length).split(',').filter(Boolean) : [];
const only = args.filter((a, i) => a[0] !== '-' && !(jobsArg >= 0 && i === jobsArg + 1))
                 .join(',').split(',').filter(Boolean);
const queue = SUITES.filter(s => (!only.length || only.indexOf(s[0]) >= 0) && exclude.indexOf(s[0]) < 0);
/* Ключ для отчёта: у обхода страниц наборов четыре под одним именем */
const keyOf = s => s[0] + (s[3] ? ':' + s[3].join('-') : '');
/* The key tells two runs of one suite apart with a colon, which is fine on
   screen and not fine in a file name: GitHub's artifact upload refuses a colon
   outright, because NTFS does, and one bad name fails the whole upload - which
   is exactly the log somebody needed to read. */
const fileOf = s => keyOf(s).replace(/[^\w.-]+/g, '-');
if (!queue.length) {
  console.log('таких наборов нет: ' + only.join(', '));
  process.exit(1);
}

/* Every suite's whole output goes to a file, not just the dozen lines the
   summary shows. On a machine you are sitting at the difference hardly matters;
   in CI it is everything, because the run is gone by the time anyone looks and
   twelve grepped lines rarely say why. The directory is what CI uploads. */
const OUT_DIR = path.join(HERE, '..', 'test-output');
fs.rmSync(OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

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
    console.log((r.ok ? '  ok  ' : 'FAIL  ') + name.padEnd(10) + what.padEnd(34) + r.secs + 's');
    if (!r.ok) {
      r.out.split('\n').filter(l => /FAIL|Error/.test(l)).slice(0, 12)
           .forEach(l => console.log('        ' + l.trim()));
      console.log('        full output: test-output/' + fileOf(queue[printed]) + '.log');
    }
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
      fs.writeFileSync(path.join(OUT_DIR, fileOf(suite) + '.log'), out);
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
