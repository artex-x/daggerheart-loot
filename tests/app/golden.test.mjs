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
import golden from './golden.js';

const { collapse, normUrl, clean, elisionOf, capName, headerOf, sectionsOf, compareGolden } = golden;

describe('collapse', () => {
  it('folds runs of whitespace to one space and treats undefined as empty', () => {
    assert.equal(collapse('a   b\nc'), 'a b c');
    assert.equal(collapse(undefined), '');
  });
});

describe('normUrl', () => {
  it('cuts a file:// dist url down to its hash', () => {
    assert.equal(normUrl('file:///C:/repo/dist/index.html#/tables/eq_weapon'), '#/tables/eq_weapon');
  });

  it('leaves a real outbound link whole - no dist/index.html marker to cut at', () => {
    assert.equal(normUrl('https://daggerheart.com/'), 'https://daggerheart.com/');
  });
});

describe('clean - joined vs split text nodes (CLAUDE.md, "port the live app\'s text-node structure")', () => {
  it('drops a single StaticText child whose name equals its parent\'s (a joined text node)', () => {
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

  it('keeps a lone StaticText child whose name differs from its parent\'s', () => {
    const node = { role: 'cell', name: 'Row', children: [{ role: 'StaticText', name: 'other', children: [] }] };
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

describe('headerOf / sectionsOf - round trip through render()\'s own format', () => {
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
    assert.deepEqual(headerOf(text), ['# some_state', '# route: #/tables/eq_weapon', '# why: coverage']);
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
  const base = ['# id', '# route: #/x', '# why: y', '', '## ru :: tree', 'a', 'b', 'c', ''].join('\n');

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
    assert.match(failures[0], /header: расходится/);
  });

  it('reports the section and 1-based line number of the first difference', () => {
    const changed = base.replace('\nb\n', '\nB\n');
    const failures = [];
    compareGolden('id', base, changed, (ok, msg) => {
      if (!ok) failures.push(msg);
    });
    assert.equal(failures.length, 1);
    assert.match(failures[0], /ru :: tree: расходится со строки 2/);
  });
});
