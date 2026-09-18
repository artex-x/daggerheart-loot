/*
  node:test over golden.js's pure half - the normalisation, rule A (same-shape
  sibling elision), rule B (name cap) and comparison logic that `npm run check`
  can exercise without dist/ or puppeteer (issues/phase-8, B4, T6).

  golden.js keeps `require('./lib.js')` (which checks dist/index.html exists
  and requires puppeteer) inside its `require.main === module` guard, so
  importing it here for its exports never trips either.
*/
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import golden from './golden.js';
import inventory from './inventory.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));

const {
  collapse,
  normUrl,
  clean,
  elisionOf,
  capName,
  serializeTree,
  headerOf,
  sectionsOf,
  compareGolden,
  slugOf
} = golden;
const { STATES } = inventory;

describe('collapse', () => {
  it('folds runs of whitespace to one space and treats undefined as empty', () => {
    assert.equal(collapse('a   b\nc'), 'a b c');
    assert.equal(collapse(undefined), '');
  });
});

describe('normUrl', () => {
  it('cuts a file:// dist url down to its hash', () => {
    assert.equal(
      normUrl('file:///C:/repo/dist/index.html#/tables/eq_weapon'),
      '#/tables/eq_weapon'
    );
  });

  it('leaves a real outbound link whole - no dist/index.html marker to cut at', () => {
    assert.equal(normUrl('https://daggerheart.com/'), 'https://daggerheart.com/');
  });
});

describe('clean - joined vs split text nodes (CLAUDE.md, "port the live app\'s text-node structure")', () => {
  it("drops a single StaticText child whose name equals its parent's (a joined text node)", () => {
    const node = {
      role: 'button',
      name: 'Печать',
      children: [{ role: 'StaticText', name: 'Печать', children: [] }]
    };
    const out = clean(node);
    assert.equal(out.children.length, 0);
  });

  it('keeps two StaticText children as-is (a split text node) - never collapsed', () => {
    const node = {
      role: 'button',
      name: 'Печать',
      children: [
        { role: 'StaticText', name: 'Печ', children: [] },
        { role: 'StaticText', name: 'ать', children: [] }
      ]
    };
    const out = clean(node);
    assert.equal(out.children.length, 2);
    assert.equal(out.children[0].name, 'Печ');
    assert.equal(out.children[1].name, 'ать');
  });

  it("keeps a lone StaticText child whose name differs from its parent's", () => {
    const node = {
      role: 'cell',
      name: 'Row',
      children: [{ role: 'StaticText', name: 'other', children: [] }]
    };
    const out = clean(node);
    assert.equal(out.children.length, 1);
  });
});

describe('elisionOf - rule A, the 5/6 sibling boundary', () => {
  const row = () => ({ role: 'row', name: '', attrs: [], children: [] });

  it('keeps five same-shape siblings whole - the cap is exceeded, not met, at 6', () => {
    const { keep, summaryAt } = elisionOf([row(), row(), row(), row(), row()]);
    assert.deepEqual(keep, [true, true, true, true, true]);
    assert.equal(summaryAt.size, 0);
  });

  it('elides the middle of six same-shape siblings, keeping the first two and last two', () => {
    const children = Array.from({ length: 6 }, row);
    const { keep, summaryAt } = elisionOf(children);
    assert.deepEqual(keep, [true, true, false, false, true, true]);
    assert.equal(summaryAt.size, 1);
    const [[at, info]] = [...summaryAt.entries()];
    assert.equal(at, 2);
    assert.equal(info.role, 'row');
    assert.equal(info.total, 6);
  });

  it('groups by signature across the whole list, not by consecutive run - a table row alternates checkbox/button and neither ever runs 6 deep on its own (issues/phase-8, B4-2)', () => {
    const cell = (role) => ({ role, name: '', attrs: [], children: [] });
    // 6 checkboxes and 6 buttons, strictly alternating: every consecutive
    // run has length 1, so a run-detection algorithm would elide nothing at
    // all here - the exact regression rule A's own comment warns against.
    const children = Array.from({ length: 12 }, (_, i) =>
      cell(i % 2 === 0 ? 'checkbox' : 'button')
    );
    const { keep, summaryAt } = elisionOf(children);
    assert.deepEqual(keep, [
      true,
      true,
      true,
      true,
      false,
      false,
      false,
      false,
      true,
      true,
      true,
      true
    ]);
    assert.equal(summaryAt.size, 2);
    assert.deepEqual(summaryAt.get(4), { role: 'checkbox', total: 6 });
    assert.deepEqual(summaryAt.get(5), { role: 'button', total: 6 });
  });
});

describe('serializeTree - rule A (elision) and rule B (name cap) applied together (issues/phase-8, B4-1)', () => {
  it('caps a long name inline and elides a run of same-shape siblings, in one pass', () => {
    const longName = 'a'.repeat(65);
    const row = (name) => ({ role: 'row', name, attrs: [], children: [] });
    const tree = {
      role: 'table',
      name: '',
      attrs: [],
      children: [row(longName), row(''), row(''), row(''), row(''), row('')]
    };
    const out = [];
    serializeTree(tree, 0, out);

    const cap = capName(longName);
    assert.deepEqual(out, [
      'table ""',
      `  row "${cap.text}" [namelen=${String(cap.namelen)} namehash=${cap.namehash}]`,
      '  row ""',
      '  ... row x2 of 6 same-shape siblings elided',
      '  row ""',
      '  row ""'
    ]);
  });
});

describe('slugOf - unique per state id (tests/app/golden.js:53, issues/phase-8, B6-N2)', () => {
  it('never lets two different state ids collapse onto the same golden filename', () => {
    const seenBy = new Map();
    for (const s of STATES) {
      const slug = slugOf(s.id);
      const prior = seenBy.get(slug);
      assert.ok(
        !prior || prior === s.id,
        `state ids "${prior}" and "${s.id}" both slug to "${slug}" - they would silently ` +
          'share one golden file and the stale-file sweep would not notice'
      );
      seenBy.set(slug, s.id);
    }
  });
});

describe('capName - rule B, the 64-code-point boundary', () => {
  it('does not cap a 63-code-point name', () => {
    const name = 'a'.repeat(63);
    const cap = capName(name);
    assert.equal(cap.capped, false);
    assert.equal(cap.text, name);
  });

  it('does not cap a 64-code-point name (the boundary itself is uncapped)', () => {
    const name = 'a'.repeat(64);
    const cap = capName(name);
    assert.equal(cap.capped, false);
    assert.equal(cap.text, name);
  });

  it('caps a 65-code-point name, hashing the whole original name', () => {
    const name = 'a'.repeat(65);
    const cap = capName(name);
    assert.equal(cap.capped, true);
    assert.equal(cap.text, 'a'.repeat(64) + '...');
    assert.equal(cap.namelen, 65);
    assert.equal(cap.namehash.length, 8);
    // Two names differing only past position 64 truncate to the same text
    // but must not hash the same - the hash is what makes the rule
    // fail-closed.
    const other = capName('a'.repeat(64) + 'b');
    assert.notEqual(cap.namehash, other.namehash);
  });
});

describe("headerOf / sectionsOf - round trip through render()'s own format", () => {
  const text = [
    '# some_state',
    '# route: #/tables/eq_weapon',
    '# why: coverage',
    '',
    '## ru :: tree',
    'button "Печать"',
    '',
    '## ru :: controls',
    'Печать',
    '',
    '## en :: tree',
    'button "Print"',
    '',
    '## en :: controls',
    'Print',
    ''
  ].join('\n');

  it('headerOf collects only the lines before the first "## " heading', () => {
    assert.deepEqual(headerOf(text), [
      '# some_state',
      '# route: #/tables/eq_weapon',
      '# why: coverage'
    ]);
  });

  it('sectionsOf splits the remainder by heading, trailing blanks trimmed', () => {
    const sections = sectionsOf(text);
    assert.deepEqual(sections['ru :: tree'], ['button "Печать"']);
    assert.deepEqual(sections['ru :: controls'], ['Печать']);
    assert.deepEqual(sections['en :: tree'], ['button "Print"']);
    assert.deepEqual(sections['en :: controls'], ['Print']);
  });
});

describe('compareGolden', () => {
  const base = [
    '# id',
    '# route: #/x',
    '# why: y',
    '',
    '## ru :: tree',
    'a',
    'b',
    'c',
    ''
  ].join('\n');

  it('reports nothing for identical text', () => {
    const failures = [];
    compareGolden('id', base, base, (ok, msg) => {
      if (!ok) failures.push(msg);
    });
    assert.deepEqual(failures, []);
  });

  it('reports the header when it moves', () => {
    const changed = base.replace('# why: y', '# why: z');
    const failures = [];
    compareGolden('id', base, changed, (ok, msg) => {
      if (!ok) failures.push(msg);
    });
    assert.equal(failures.length, 1);
    assert.match(failures[0], /header: diverges/);
  });

  it('reports the section and 1-based line number of the first difference', () => {
    const changed = base.replace('\nb\n', '\nB\n');
    const failures = [];
    compareGolden('id', base, changed, (ok, msg) => {
      if (!ok) failures.push(msg);
    });
    assert.equal(failures.length, 1);
    assert.match(failures[0], /ru :: tree: diverges starting at line 2/);
  });
});

describe('addressSettled() call sites - nothing guarded them before this (issues/phase-8, B8.1-N1)', () => {
  it('is awaited before every capture, in both the ordinary branch (twice) and the timed branch (once)', () => {
    /* Deleting any one of these three calls silently reintroduces B8.1's own
     * defect - no unit-level signal at all, only an intermittent red golden
     * shard on an owned-list route (issues/phase-8/context.md, "A
     * deterministic B8 regression"). This does not prove the calls are in
     * the *right place* - only that they are still there - but that is the
     * gap B8.1-N1 named: before this, nothing guarded the call sites at
     * all. */
    const src = readFileSync(path.join(HERE, 'golden.js'), 'utf8');
    const calls = src.match(/await d\.addressSettled\(\)/g) || [];
    assert.equal(
      calls.length,
      3,
      'expected three `await d.addressSettled()` call sites in golden.js (two in the ' +
        'ordinary branch, one in the timed branch) - one was removed'
    );
  });
});

describe("URL_DEBOUNCE_MS - coupled to ListPage.svelte's own debounce (issues/phase-8, B8.1)", () => {
  /* driver.js's addressSettled() waits `URL_DEBOUNCE_MS + 100ms` of address
   * quiet before a golden capture, so it stays a real wait rather than a
   * guess only while the two numbers agree. tests/derived.js parsing
   * ci.yml for the shard/divisor coupling (B3 review finding) is the
   * precedent for reading a file as text to assert two numbers that could
   * silently drift apart never do. */
  it('agrees with the 150ms trailing debounce scheduleUrlSync actually sets', () => {
    const listPage = readFileSync(
      path.join(HERE, '..', '..', 'app', 'src', 'components', 'ListPage.svelte'),
      'utf8'
    );
    /* Bounded to the function's own body (up to its closing brace at the
     * 2-space indent the function itself sits at) rather than an unbounded
     * [\s\S]*? that would walk past it: an unbounded match still matches
     * something after a Prettier reflow splits the call across lines (fails
     * loudly, fine), but if the `150` literal is ever replaced by a named
     * constant it walks on to the next `}, <digits>);` anywhere later in the
     * file - silently wrong - and a second setTimeout earlier in this same
     * function would take the first match - also silently wrong. The
     * setTimeout-count assertion below closes the second case; the bound
     * closes the first. */
    const bodyMatch = listPage.match(/function scheduleUrlSync[\s\S]*?\n {2}\}/);
    assert.ok(
      bodyMatch,
      "could not find scheduleUrlSync's own function body in ListPage.svelte"
    );
    const body = bodyMatch[0];
    assert.equal(
      body.split('setTimeout').length - 1,
      1,
      'scheduleUrlSync has more than one timer - which one is the debounce?'
    );
    const fnMatch = body.match(/\}, (\d+)\);/);
    assert.ok(fnMatch, "could not find scheduleUrlSync's own setTimeout call inside its body");
    const debounceMs = Number(fnMatch[1]);

    const driverSrc = readFileSync(path.join(HERE, 'driver.js'), 'utf8');
    const constMatch = driverSrc.match(/const URL_DEBOUNCE_MS = (\d+);/);
    assert.ok(constMatch, 'could not find URL_DEBOUNCE_MS in driver.js');
    const urlDebounceMs = Number(constMatch[1]);

    assert.equal(
      urlDebounceMs,
      debounceMs,
      'the debounce moved - update URL_DEBOUNCE_MS and re-run all four golden shards'
    );
  });
});
