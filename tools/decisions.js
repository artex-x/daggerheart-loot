/*
  The decisions registry: one file per decision under docs/decisions/, in the
  shape of .claude/templates/decision.template.md, and docs/DECISIONS.md, the
  index generated from those files. tests/derived.js compares the index with
  render(readAll()) and reports every validate() problem.

  Rebuild the index after adding or editing a file:   node tools/decisions.js
  Move inline "## <date> - <title>" entries into files (a branch cut before
  the registry, or a conflicted index):   node tools/decisions.js --split <path>
  .claude/README.md, "Decisions registry".
*/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = 'docs/decisions';
const INDEX = 'docs/DECISIONS.md';
const TEMPLATE = '.claude/templates/decision.template.md';
/* Files dated before this day predate the registry: the caps and the
   status-line order do not apply to them, and only they may carry the
   "none recorded" marker. */
const LEGACY_BEFORE = '2026-09-26';
const REQUIRED = ['Task', 'Decision', 'Rejected'];
const TITLE_MAX = 80;
const BODY_MAX = 15;
const POINTER =
  /^- (Superseded by|Superseded in part by|Amended by|Supersedes|Supersedes in part|Amends) "([^"]+)" \((\d{4}-\d{2}-\d{2})\)/;
const MIRROR = {
  'Superseded by': 'Supersedes',
  'Superseded in part by': 'Supersedes in part',
  'Amended by': 'Amends'
};
const REVERSE = Object.fromEntries(Object.entries(MIRROR).map(([k, v]) => [v, k]));
const STATUS = /^- (Superseded by|Superseded in part by|Superseded for|Amended by)\b/;
const HEADING = /^# (\d{4}-\d{2}-\d{2}) - (.+)$/;
const ENTRY = /^## (\d{4}-\d{2}-\d{2}) - (.+)$/;
const CONFLICT = /^(<{7}|={7}|>{7})/;
const FILE_NAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const MARKER = '- Rejected: none recorded.';

const HEADER = `# Decisions

The register of decisions that outlive the task that made them, each with
the alternatives rejected and the reason. Record a decision only when an
alternative was rejected. Behaviour decisions live in \`docs/specs/\`; hook,
tooling and host decisions in \`.claude/README.md\`; everything else is one
file under \`docs/decisions/\`, listed here newest first. This index is
generated: add or edit a file there (template:
\`.claude/templates/decision.template.md\`), then run \`node
tools/decisions.js\`. A citation names a decision by its path, or as
\`docs/DECISIONS.md, <date>, "<title>"\`; a title never changes. A decision
is superseded in place, both files pointing at each other; nothing is
deleted.

## Index
`;

const abs = (rel) => path.join(ROOT, rel);

/* Drops blank lines at both ends of a list of lines. */
function trimBlank(lines) {
  let a = 0;
  let b = lines.length;
  while (a < b && !lines[a].trim()) a++;
  while (b > a && !lines[b - 1].trim()) b--;
  return lines.slice(a, b);
}

/* Returns the body's bullets, each a "- " line joined by one space with the
   lines under it indented by two spaces: a pointer may wrap inside its title. */
function bulletsOf(body) {
  const out = [];
  for (const line of body.split('\n')) {
    if (line.startsWith('- ')) out.push(line);
    else if (line.startsWith('  ') && out.length && line.trim())
      out[out.length - 1] += ' ' + line.trim();
  }
  return out;
}

/* Returns { file, date, title, body, bullets } for one decision file. */
function parse(name, text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const m = HEADING.exec(lines[0]);
  if (!m) throw new Error(name + ': the first line is not "# <date> - <title>"');
  const body = trimBlank(lines.slice(1)).join('\n');
  return { file: name, date: m[1], title: m[2], body, bullets: bulletsOf(body) };
}

/* Returns 'superseded', 'superseded in part' or '' from the status lines. A
   legacy file may carry its status line after "- Task". */
function status(entry) {
  if (entry.bullets.some((b) => b.startsWith('- Superseded by '))) return 'superseded';
  if (
    entry.bullets.some(
      (b) => b.startsWith('- Superseded in part by ') || b.startsWith('- Superseded for ')
    )
  )
    return 'superseded in part';
  return '';
}

function readAll() {
  if (!fs.existsSync(abs(DIR))) return [];
  return fs
    .readdirSync(abs(DIR))
    .filter((f) => f.endsWith('.md'))
    .map((f) => parse(f, fs.readFileSync(path.join(abs(DIR), f), 'utf8')))
    .sort((a, b) =>
      a.date !== b.date ? (a.date < b.date ? 1 : -1) : a.file < b.file ? -1 : 1
    );
}

function render(entries) {
  const rows = entries.map((e) => {
    const s = status(e);
    return `- ${e.date} - [${e.title}](decisions/${e.file})` + (s ? ' - ' + s : '');
  });
  return [HEADER, ...rows].join('\n') + '\n';
}

/* Returns the text after a bullet's label ("- Decision (Q1 = B): x" gives "x"). */
function labelText(bullet, label) {
  const rest = bullet.slice(2 + label.length);
  const colon = rest.indexOf(':');
  return (colon >= 0 ? rest.slice(colon + 1) : rest).trim();
}

const hasLabel = (entry, label) =>
  entry.bullets.some((b) => new RegExp('^- ' + label + '\\b').test(b));

function pointers(entry) {
  return entry.bullets
    .map((b) => POINTER.exec(b))
    .filter(Boolean)
    .map((m) => ({ kind: m[1], title: m[2], date: m[3] }));
}

/* Returns [{ file, problem }] for every rule of the template the files break. */
function validate(entries) {
  const out = [];
  const add = (file, problem) => out.push({ file, problem });
  const byTitle = new Map();
  for (const e of entries) {
    if (byTitle.has(e.title))
      add(e.file, 'duplicate title, also in ' + byTitle.get(e.title).file);
    else byTitle.set(e.title, e);
  }
  for (const e of entries) {
    if (!FILE_NAME.test(e.file)) add(e.file, 'the file name is not <date>-<slug>.md');
    else if (e.file.slice(0, 10) !== e.date)
      add(e.file, 'the heading date ' + e.date + ' is not the file name date');
    const native = e.date >= LEGACY_BEFORE;
    if (status(e) !== 'superseded') {
      for (const label of REQUIRED) {
        const re = new RegExp('^- ' + label + '\\b');
        const b = e.bullets.find((x) => re.test(x));
        if (!b) add(e.file, 'no "- ' + label + ':" line');
        else if (!labelText(b, label)) add(e.file, 'the "- ' + label + ':" line is empty');
      }
    }
    if (native) {
      if (e.bullets.includes(MARKER))
        add(
          e.file,
          'the "none recorded" marker is only for files dated before ' + LEGACY_BEFORE
        );
      const task = e.bullets.findIndex((b) => /^- Task\b/.test(b));
      if (task >= 0 && e.bullets.slice(task + 1).some((b) => STATUS.test(b)))
        add(e.file, 'a status line comes after "- Task"');
      const lines = e.body.split('\n').filter((l) => l.trim()).length;
      if (lines > BODY_MAX) add(e.file, 'the body has ' + lines + ' lines, over ' + BODY_MAX);
      if (e.title.length > TITLE_MAX)
        add(e.file, 'the title has ' + e.title.length + ' characters, over ' + TITLE_MAX);
    }
    for (const p of pointers(e)) {
      const target = byTitle.get(p.title);
      if (!target) {
        add(e.file, p.kind + ' "' + p.title + '": no file has this title');
        continue;
      }
      if (target.date !== p.date)
        add(e.file, p.kind + ' "' + p.title + '": dated ' + target.date + ', not ' + p.date);
      const mirror = MIRROR[p.kind] || REVERSE[p.kind];
      if (!pointers(target).some((q) => q.kind === mirror && q.title === e.title))
        add(
          e.file,
          p.kind + ' "' + p.title + '": ' + target.file + ' has no ' + mirror + ' line'
        );
    }
  }
  return out;
}

function slugify(title) {
  const words = title
    .toLowerCase()
    .replace(/[`'"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 8);
  return words.length ? words.join('-') : 'decision';
}

const fileText = (date, title, body) => `# ${date} - ${title}\n\n${body}\n`;

/* Drops the lines reshape() appends, so a split does not report a file
   whose only difference is those lines. */
function withoutReshape(body) {
  const lines = body.split('\n');
  while (
    lines.length &&
    (lines[lines.length - 1] === MARKER ||
      /^- (Supersedes|Supersedes in part|Amends) "/.test(lines[lines.length - 1]))
  )
    lines.pop();
  return lines.join('\n');
}

/* Writes each inline "## <date> - <title>" entry of `file` to its own file,
   matched by title; never deletes. Then reshape(). */
function split(file) {
  const lines = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').split('\n');
  fs.mkdirSync(abs(DIR), { recursive: true });
  const existing = new Map(readAll().map((e) => [e.title, e]));
  for (let i = 0; i < lines.length; i++) {
    const m = ENTRY.exec(lines[i]);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && !ENTRY.test(lines[j]) && !CONFLICT.test(lines[j])) j++;
    const [, date, title] = m;
    const body = trimBlank(lines.slice(i + 1, j)).join('\n');
    const known = existing.get(title);
    if (known) {
      if (withoutReshape(known.body) !== body) {
        fs.writeFileSync(path.join(abs(DIR), known.file), fileText(date, title, body), 'utf8');
        console.log('rewrote ' + DIR + '/' + known.file);
      }
    } else {
      const slug = date + '-' + slugify(title);
      let name = slug + '.md';
      for (let n = 2; fs.existsSync(path.join(abs(DIR), name)); n++)
        name = slug + '-' + n + '.md';
      fs.writeFileSync(path.join(abs(DIR), name), fileText(date, title, body), 'utf8');
      existing.set(title, parse(name, fileText(date, title, body)));
      console.log('wrote ' + DIR + '/' + name);
    }
    i = j - 1;
  }
  reshape();
}

/* Appends the "none recorded" marker to a legacy live file with no
   Rejected line, and the mirror of every forward pointer its target lacks.
   Idempotent. */
function reshape() {
  const entries = readAll();
  const byTitle = new Map(entries.map((e) => [e.title, e]));
  const extra = new Map();
  const append = (e, line) => {
    if (!extra.has(e.file)) extra.set(e.file, []);
    extra.get(e.file).push(line);
  };
  for (const e of entries) {
    if (e.date < LEGACY_BEFORE && status(e) !== 'superseded' && !hasLabel(e, 'Rejected'))
      append(e, MARKER);
  }
  for (const e of entries) {
    for (const p of pointers(e)) {
      const mirror = MIRROR[p.kind];
      const target = byTitle.get(p.title);
      if (!mirror || !target) continue;
      const line = `- ${mirror} "${e.title}" (${e.date}).`;
      const has = pointers(target).some((q) => q.kind === mirror && q.title === e.title);
      if (!has && !(extra.get(target.file) || []).includes(line)) append(target, line);
    }
  }
  for (const e of entries) {
    if (!extra.has(e.file)) continue;
    const body = [e.body, ...extra.get(e.file)].join('\n');
    fs.writeFileSync(path.join(abs(DIR), e.file), fileText(e.date, e.title, body), 'utf8');
    console.log('reshaped ' + DIR + '/' + e.file);
  }
}

function writeIndex() {
  const entries = readAll();
  fs.writeFileSync(abs(INDEX), render(entries), 'utf8');
  console.log(INDEX + ' - ' + entries.length + ' decisions');
}

module.exports = {
  DIR,
  INDEX,
  TEMPLATE,
  LEGACY_BEFORE,
  REQUIRED,
  TITLE_MAX,
  BODY_MAX,
  POINTER,
  MIRROR,
  parse,
  status,
  readAll,
  render,
  validate,
  slugify,
  split
};

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args[0] === '--split') {
    if (!args[1]) throw new Error('--split needs a path. Pass the file that holds the entries');
    split(args[1]);
  }
  writeIndex();
}
