/*
  node:test over lib.mjs's pure logic. No filesystem, no sharp, no network -
  hand-built record fixtures, in the style of tools/tg-preview/lib.test.mjs.
*/
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  normalizeName,
  indexRecords,
  planInstall,
  planIngest,
  planThumbs,
  affectedStubUrls,
  staleDelta,
  shareCardSvg,
  CARD_TEXT,
  CARD_FONT,
  catalogRecords,
  parseImageDates,
  parseReviewQuery,
  buildDeck,
  readVerdicts,
  setVerdict,
  setComment,
  pruneVerdicts,
  pendingRegen,
  regenJson,
  REVIEW_KEYS,
  reviewKeyAction,
  reviewRoute,
  readLang,
  cardCss,
  ruleBody,
  cardHeadSource,
  transpileLibSource,
  REVIEW_CARD_CLASSES,
  REVIEW_ART_SIZES,
  openCommand
} from './lib.mjs';

const SITE = 'https://example.test/';

function rec(id, img, extra = {}) {
  return { id, img, en: id, ...extra };
}

describe('normalizeName', () => {
  it('folds typographic apostrophes to a plain one', () => {
    assert.equal(normalizeName('Ranger’s Bow'), normalizeName("Ranger's Bow"));
    assert.equal(normalizeName('Rangerʼs Bow'), normalizeName("Ranger's Bow"));
    assert.equal(normalizeName('Hook Line ‘N’ Sinker'), normalizeName("Hook Line 'N' Sinker"));
  });

  it('strips a trailing " v<N>" suffix', () => {
    assert.equal(normalizeName('Sword v2'), 'sword');
    assert.equal(normalizeName('Sword v10'), 'sword');
  });

  it('does not strip an internal "v2"', () => {
    assert.equal(normalizeName('Halberd v2 Blade'), 'halberd v2 blade');
  });

  it('normalizes to NFC so a combining spelling matches a precomposed one', () => {
    const precomposed = 'éclair'; // é
    const combining = 'éclair'; // e + combining acute
    assert.equal(normalizeName(precomposed), normalizeName(combining));
  });

  it('folds case and collapses whitespace', () => {
    assert.equal(normalizeName('  SWORD   Of Ages  '), 'sword of ages');
  });
});

describe('indexRecords', () => {
  it('groups a name shared by two records into a two-element array', () => {
    const records = [
      rec('a1', 'a1.webp', { en: 'Torch', ru: null }),
      rec('a2', 'a2.webp', { en: 'Torch', ru: null })
    ];
    const { byName } = indexRecords(records);
    assert.equal(byName['torch'].length, 2);
  });

  it('groups byImg for the four q24 sharers', () => {
    const records = ['q24', 'q70', 'q138', 'q205'].map((id) => rec(id, 'q24.webp'));
    const { byImg } = indexRecords(records);
    assert.equal(byImg['q24.webp'].length, 4);
  });
});

describe('planInstall', () => {
  it('resolves the destination from the record\'s img, not recordId + ".webp"', () => {
    const records = [rec('sword-of-ages', 'legacy-name.webp', { en: 'Sword of Ages' })];
    const sources = [{ name: 'Sword of Ages.png', sha256: 'h1', bytes: 10 }];
    const { pairs } = planInstall({ sources, records, map: null });
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0].webp, 'img/legacy-name.webp');
    assert.equal(pairs[0].thumb, 'img/thumb/legacy-name.webp');
    assert.equal(pairs[0].jpeg, 'og/legacy-name.jpg');
  });

  it('one source matching a record whose asset is shared by four records yields one pair', () => {
    const records = ['q24', 'q70', 'q138', 'q205'].map((id) =>
      rec(id, 'q24.webp', { en: id === 'q24' ? 'Anchor' : id })
    );
    const sources = [{ name: 'Anchor.png', sha256: 'h1', bytes: 10 }];
    const { pairs, counts } = planInstall({ sources, records, map: null });
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0].sharedWith.length, 3);
    assert.equal(pairs[0].jpeg, 'og/q24.jpg');
    assert.deepEqual(counts, { acceptedArtwork: 1, assetPairs: 1, recordLinks: 4 });
  });

  it('two sources resolving to one asset land in collisions', () => {
    const records = [
      rec('a', 'shared.webp', { en: 'A' }),
      rec('b', 'shared.webp', { en: 'B' })
    ];
    const sources = [
      { name: 'A.png', sha256: 'h1', bytes: 1 },
      { name: 'B.png', sha256: 'h2', bytes: 2 }
    ];
    const { pairs, collisions } = planInstall({ sources, records, map: null });
    assert.equal(pairs.length, 0);
    assert.equal(collisions.length, 1);
    assert.equal(collisions[0].asset, 'shared.webp');
    assert.deepEqual(collisions[0].sources.sort(), ['A.png', 'B.png']);
  });

  it('two source names with one sha256 land in duplicateSources', () => {
    const records = [rec('a', 'a.webp', { en: 'A' })];
    const sources = [
      { name: 'A.png', sha256: 'same', bytes: 1 },
      { name: 'A copy.png', sha256: 'same', bytes: 1 }
    ];
    const { duplicateSources, pairs, unmatched } = planInstall({ sources, records, map: null });
    assert.equal(duplicateSources.length, 1);
    assert.deepEqual(duplicateSources[0].sources.sort(), ['A copy.png', 'A.png']);
    // Reported once as a duplicate, not matched further either way.
    assert.equal(pairs.length, 0);
    assert.equal(unmatched.length, 0);
  });

  it('reports an unmatched name and an ambiguous name, never guesses', () => {
    const records = [
      rec('a', 'a.webp', { en: 'Alpha' }),
      rec('b', 'b.webp', { en: 'Shared Name' }),
      rec('c', 'c.webp', { en: 'Shared Name' })
    ];
    const sources = [
      { name: 'Nobody Wants This.png', sha256: 'h1', bytes: 1 },
      { name: 'Shared Name.png', sha256: 'h2', bytes: 1 }
    ];
    const { unmatched, ambiguous, pairs } = planInstall({ sources, records, map: null });
    assert.equal(unmatched.length, 1);
    assert.equal(unmatched[0].source, 'Nobody Wants This.png');
    assert.equal(ambiguous.length, 1);
    assert.equal(ambiguous[0].source, 'Shared Name.png');
    assert.deepEqual(ambiguous[0].recordIds.sort(), ['b', 'c']);
    assert.equal(pairs.length, 0);
  });

  it('map.assign overrides name matching; an unknown assign target is reported, not thrown', () => {
    const records = [rec('a', 'a.webp', { en: 'Alpha' }), rec('b', 'b.webp', { en: 'Beta' })];
    const sources = [
      { name: 'whatever.png', sha256: 'h1', bytes: 1 },
      { name: 'orphan.png', sha256: 'h2', bytes: 1 }
    ];
    const map = { assign: { 'whatever.png': 'b', 'orphan.png': 'does-not-exist' } };
    const { pairs, unmatched } = planInstall({ sources, records, map });
    assert.equal(pairs.length, 1);
    assert.equal(pairs[0].recordId, 'b');
    assert.equal(unmatched.length, 1);
    assert.match(unmatched[0].reason, /does-not-exist/);
  });
});

describe('planThumbs', () => {
  it('plans one thumbnail per picture, _none.webp included, in name order', () => {
    const { targets, orphans } = planThumbs({
      images: ['b.webp', '_none.webp', 'a.webp'],
      thumbs: []
    });
    assert.deepEqual(targets, [
      { source: 'img/_none.webp', thumb: 'img/thumb/_none.webp' },
      { source: 'img/a.webp', thumb: 'img/thumb/a.webp' },
      { source: 'img/b.webp', thumb: 'img/thumb/b.webp' }
    ]);
    assert.deepEqual(orphans, []);
  });

  it('reports a thumbnail with no picture as an orphan and plans no target for it', () => {
    const { targets, orphans } = planThumbs({
      images: ['a.webp'],
      thumbs: ['a.webp', 'gone.webp']
    });
    assert.deepEqual(orphans, ['img/thumb/gone.webp']);
    assert.deepEqual(
      targets.map((t) => t.thumb),
      ['img/thumb/a.webp']
    );
  });

  it('reports no orphans when no thumbnail exists yet', () => {
    assert.deepEqual(planThumbs({ images: ['a.webp'], thumbs: [] }).orphans, []);
  });
});

describe('affectedStubUrls', () => {
  it('includes both language stubs of every matched and sharedWith record, sorted and deduplicated', () => {
    const pairs = [
      { recordId: 'q24', sharedWith: ['q70', 'q138', 'q205'] },
      { recordId: 'a', sharedWith: [] }
    ];
    const urls = affectedStubUrls(pairs, SITE);
    assert.deepEqual(urls, [
      SITE + 'i/a.html',
      SITE + 'i/en/a.html',
      SITE + 'i/en/q138.html',
      SITE + 'i/en/q205.html',
      SITE + 'i/en/q24.html',
      SITE + 'i/en/q70.html',
      SITE + 'i/q138.html',
      SITE + 'i/q205.html',
      SITE + 'i/q24.html',
      SITE + 'i/q70.html'
    ]);
  });
});

describe('planIngest', () => {
  it('the og/ trap: a new record sharing an existing, already-installed asset lands in shares, not creates, and mints no og/<new-id>.jpg', () => {
    const records = [
      rec('anchor', 'shared.webp', { en: 'Anchor' }),
      rec('joiner', 'shared.webp', { en: 'Joiner' })
    ];
    const sources = [{ name: 'Joiner.png', sha256: 'h1', bytes: 1 }];
    const result = planIngest({ sources, records, missingAssets: [], map: null });
    assert.equal(result.creates.length, 0);
    assert.equal(result.shares.length, 1);
    assert.deepEqual(result.shares[0], {
      recordId: 'joiner',
      asset: 'shared.webp',
      alsoClaimedBy: ['anchor']
    });
    assert.equal(JSON.stringify(result).includes('og/joiner.jpg'), false);
  });

  it('two new records sharing one new asset with one source yields exactly one creates entry', () => {
    const records = [rec('a', 'new1.webp', { en: 'A' }), rec('b', 'new1.webp', { en: 'B' })];
    const sources = [{ name: 'A.png', sha256: 'h1', bytes: 1 }];
    const { creates } = planIngest({
      sources,
      records,
      missingAssets: ['new1.webp'],
      map: null
    });
    assert.equal(creates.length, 1);
    assert.equal(creates[0].asset, 'new1.webp');
    assert.deepEqual(creates[0].recordIds.sort(), ['a', 'b']);
    assert.equal(creates[0].jpeg, 'og/new1.jpg');
    assert.equal(creates[0].thumb, 'img/thumb/new1.webp');
  });

  it('a record with img: "" is unarted, not an error, and produces no creates entry', () => {
    const records = [rec('a', '', { en: 'A' })];
    const { unarted, creates } = planIngest({
      sources: [],
      records,
      missingAssets: [],
      map: null
    });
    assert.deepEqual(unarted, [{ recordId: 'a' }]);
    assert.equal(creates.length, 0);
  });

  it('a missing asset with no source is unsourced, naming the waiting record ids', () => {
    const records = [rec('a', 'missing1.webp', { en: 'A' })];
    const { unsourced } = planIngest({
      sources: [],
      records,
      missingAssets: ['missing1.webp'],
      map: null
    });
    assert.deepEqual(unsourced, [{ asset: 'missing1.webp', recordIds: ['a'] }]);
  });

  it('an unmatched source, an ambiguous source, and duplicate-bytes sources are reported the same as planInstall', () => {
    const records = [
      rec('a', 'a.webp', { en: 'Alpha' }),
      rec('b', 'b.webp', { en: 'Shared' }),
      rec('c', 'c.webp', { en: 'Shared' })
    ];
    const sources = [
      { name: 'Nobody Wants This.png', sha256: 'h1', bytes: 1 },
      { name: 'Shared.png', sha256: 'h2', bytes: 1 },
      { name: 'Dup1.png', sha256: 'dup', bytes: 1 },
      { name: 'Dup2.png', sha256: 'dup', bytes: 1 }
    ];
    const { unmatched, ambiguous, duplicateSources } = planIngest({
      sources,
      records,
      missingAssets: [],
      map: null
    });
    assert.equal(unmatched.length, 1);
    assert.equal(unmatched[0].source, 'Nobody Wants This.png');
    assert.equal(ambiguous.length, 1);
    assert.deepEqual(ambiguous[0].recordIds.sort(), ['b', 'c']);
    assert.equal(duplicateSources.length, 1);
  });

  it('map.assign steers an ingest source the same way it steers a replacement source', () => {
    const records = [rec('a', 'new1.webp', { en: 'Alpha' })];
    const sources = [{ name: 'whatever.png', sha256: 'h1', bytes: 1 }];
    const map = { assign: { 'whatever.png': 'a' } };
    const { creates } = planIngest({ sources, records, missingAssets: ['new1.webp'], map });
    assert.equal(creates.length, 1);
    assert.equal(creates[0].asset, 'new1.webp');
  });

  it('counts are exact on a mixed fixture: one new shared asset, one shared-with-existing record, one unarted record', () => {
    const records = [
      rec('a', 'new1.webp', { en: 'A' }),
      rec('b', 'new1.webp', { en: 'B' }),
      rec('anchor', 'shared.webp', { en: 'Anchor' }),
      rec('joiner', 'shared.webp', { en: 'Joiner' }),
      rec('e', '', { en: 'E' })
    ];
    const sources = [
      { name: 'A.png', sha256: 'h1', bytes: 1 },
      { name: 'Joiner.png', sha256: 'h2', bytes: 1 }
    ];
    const result = planIngest({ sources, records, missingAssets: ['new1.webp'], map: null });
    assert.deepEqual(result.counts, {
      acceptedArtwork: 1,
      newAssets: 1,
      recordLinks: 2,
      shared: 1,
      unarted: 1
    });
  });
});

describe('staleDelta', () => {
  const url = (id) => SITE + 'i/' + id + '.html';

  it('accepts both language stubs going stale for one art change', () => {
    const d = staleDelta({
      before: [],
      after: [SITE + 'i/q24.html', SITE + 'i/en/q24.html'],
      expected: affectedStubUrls([{ recordId: 'q24', sharedWith: [] }], SITE)
    });
    assert.equal(d.ok, true);
    assert.deepEqual(d.extra, []);
  });

  it('is ok when exactly the expected set went newly stale', () => {
    const expected = [url('a'), url('b')];
    const result = staleDelta({
      before: [url('z')],
      after: [url('z'), url('a'), url('b')],
      expected
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.missing, []);
    assert.deepEqual(result.extra, []);
  });

  it('reports missing when an expected URL never went stale', () => {
    const expected = [url('a'), url('b')];
    const result = staleDelta({ before: [], after: [url('a')], expected });
    assert.deepEqual(result.missing, [url('b')]);
    assert.equal(result.ok, false);
  });

  it('reports extra when something outside expected went stale', () => {
    const expected = [url('a')];
    const result = staleDelta({ before: [], after: [url('a'), url('surprise')], expected });
    assert.deepEqual(result.extra, [url('surprise')]);
    assert.equal(result.ok, false);
  });

  it('reports disappeared for a URL stale before, not after, and not expected', () => {
    const result = staleDelta({ before: [url('gone')], after: [], expected: [] });
    assert.deepEqual(result.disappeared, [url('gone')]);
    assert.equal(result.ok, true);
  });

  it('identical before/after with a non-empty expected yields missing equal to expected', () => {
    const same = [url('a'), url('b')];
    const expected = [url('a'), url('b')];
    const result = staleDelta({ before: same, after: same, expected });
    assert.deepEqual(result.missing.sort(), expected.slice().sort());
    assert.equal(result.ok, false);
  });
});

describe('shareCardSvg', () => {
  it('draws a 1200x630 card', () => {
    for (const lang of ['ru', 'en']) {
      const svg = shareCardSvg(lang);
      assert.match(svg, /viewBox="0 0 1200 630"/);
      assert.match(svg, /width="1200" height="630"/);
    }
  });

  it("carries each language's three strings", () => {
    assert.deepEqual(CARD_TEXT.ru, {
      title: 'Генератор лута',
      brand: 'DAGGERHEART',
      subtitle: 'Добыча, расходники, оружие и броня · RU / EN'
    });
    assert.deepEqual(CARD_TEXT.en, {
      title: 'Loot Generator',
      brand: 'DAGGERHEART',
      subtitle: 'Loot, consumables, weapons and armour · RU / EN'
    });
    for (const lang of ['ru', 'en']) {
      const svg = shareCardSvg(lang);
      for (const line of Object.values(CARD_TEXT[lang])) assert.ok(svg.includes(line), line);
    }
    assert.ok(!shareCardSvg('en').includes(CARD_TEXT.ru.title));
  });

  it('names Inter as the font of every text element', () => {
    assert.equal(CARD_FONT, 'Inter');
    const svg = shareCardSvg('ru');
    const texts = svg.match(/<text [^>]*>/g);
    assert.equal(texts.length, 3);
    for (const t of texts) assert.ok(t.includes('font-family="\'Inter\'"'), t);
  });

  it('throws for an unknown language', () => {
    assert.throws(() => shareCardSvg('de'), /No share card text for language "de"/);
  });
});

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const rootRequire = createRequire(join(ROOT, 'package.json'));

function loadLoot() {
  if (!globalThis.window) globalThis.window = {};
  if (!globalThis.window.LOOT) rootRequire(join(ROOT, 'data.js'));
  return globalThis.window.LOOT;
}

function readRepo(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

const sha = (n) => String(n).repeat(64).slice(0, 64);
const RULE = 'docs/artwork.md, "The card follows the site\'s card"';

// The pinned hash of RecordCard.svelte's card head (docs/artwork.md, "The card
// follows the site's card").
const CARD_HEAD_SHA256 = '0c26dbb04a5e83538e27c5c86ad47530ed737f1600b129994f84851cd884f66e';

const CARD_FILES = ['RecordCard', 'Badge', 'Seg'].map((n) => `app/src/components/${n}.svelte`);

function classesMissingFrom(css) {
  return REVIEW_CARD_CLASSES.filter(
    (c) => !new RegExp('\\.' + c + '(?![A-Za-z0-9_-])').test(css)
  );
}

function artSizeProblems(sources) {
  const problems = [];
  for (const size of REVIEW_ART_SIZES) {
    const body = ruleBody(cardCss([sources[size.file]]), size.selector);
    for (const d of size.declarations) {
      if (!body.includes(d)) problems.push(`${size.label}: "${d}" not in ${size.selector}`);
    }
  }
  return problems;
}

describe('image review', () => {
  const records = [
    { id: 'a1', img: 'a.webp' },
    { id: 'b1', img: 'b.webp' },
    { id: 'a2', img: 'a.webp' },
    { id: 'a3', img: 'a.webp' },
    { id: 'a4', img: 'a.webp' },
    { id: 'c1', img: 'c.webp' },
    { id: 'n1', img: '' }
  ];
  const shas = { 'a.webp': sha(1), 'b.webp': sha(2), 'c.webp': sha(3) };
  const noQuery = { all: false, ids: [] };
  const deck = (extra) =>
    buildDeck({ records, dates: {}, shas, verdicts: {}, query: noQuery, ...extra });

  it('catalogRecords keeps the order of tools/derived.js everything()', () => {
    const L = loadLoot();
    const { everything } = rootRequire(join(ROOT, 'tools', 'derived.js'));
    assert.deepEqual(
      catalogRecords(L).map((r) => r.id),
      everything(L).map((r) => r.id)
    );
  });

  describe('parseImageDates', () => {
    const log = [
      '@2026-10-06T10:00:00+02:00',
      'img/a.webp',
      'img/thumb/a.webp',
      '',
      '@2026-08-02T10:00:00+02:00',
      'img/a.webp',
      'img/b.webp',
      'img/thumb/b.webp'
    ].join('\n');

    it('keeps the newest date of a picture and ignores thumbnails', () => {
      assert.deepEqual(parseImageDates(log, ''), {
        'a.webp': '2026-10-06T10:00:00+02:00',
        'b.webp': '2026-08-02T10:00:00+02:00'
      });
    });

    it('marks a modified and an untracked picture uncommitted', () => {
      const status = ' M img/b.webp\n?? img/new.webp\n M img/thumb/b.webp';
      const out = parseImageDates(log, status);
      assert.equal(out['b.webp'], 'uncommitted');
      assert.equal(out['new.webp'], 'uncommitted');
      assert.equal(out['thumb/b.webp'], undefined);
      assert.equal(out['a.webp'], '2026-10-06T10:00:00+02:00');
    });

    it('takes the new path of a rename line', () => {
      assert.equal(
        parseImageDates('', 'R  img/old.webp -> img/new.webp')['new.webp'],
        'uncommitted'
      );
    });

    it('returns an empty object for empty inputs', () => {
      assert.deepEqual(parseImageDates('', ''), {});
    });
  });

  describe('parseReviewQuery', () => {
    it('reads the all flag and the ids', () => {
      assert.deepEqual(parseReviewQuery(''), { all: false, ids: [] });
      assert.deepEqual(parseReviewQuery('?all=1'), { all: true, ids: [] });
      assert.deepEqual(parseReviewQuery('?all=0'), { all: false, ids: [] });
      assert.deepEqual(parseReviewQuery('?ids=ci2,,q4,ci2'), {
        all: false,
        ids: ['ci2', 'q4']
      });
      assert.deepEqual(parseReviewQuery('?all=1&ids=x'), { all: true, ids: ['x'] });
    });
  });

  describe('buildDeck', () => {
    it('gives a shared picture one card with the anchor and the other claimants', () => {
      const d = deck();
      const a = d.cards.find((c) => c.asset === 'a.webp');
      assert.equal(a.id, 'a1');
      assert.deepEqual(
        a.others.map((r) => r.id),
        ['a2', 'a3', 'a4']
      );
      assert.equal(d.total, 3);
    });

    it('orders by date, then catalog order', () => {
      const dates = {
        'a.webp': '2026-08-03T00:00:00+02:00',
        'b.webp': '2026-08-02T00:00:00+02:00',
        'c.webp': '2026-08-02T00:00:00+02:00'
      };
      assert.deepEqual(
        deck({ dates }).cards.map((c) => c.asset),
        ['b.webp', 'c.webp', 'a.webp']
      );
    });

    it('compares dates as instants, not as strings', () => {
      const dates = {
        'a.webp': '2026-03-28T23:00:00+00:00',
        'b.webp': '2026-03-29T00:30:00+02:00',
        'c.webp': '2026-03-30T00:00:00+00:00'
      };
      assert.deepEqual(
        deck({ dates }).cards.map((c) => c.asset),
        ['b.webp', 'a.webp', 'c.webp']
      );
    });

    it('puts uncommitted after dated pictures and undated ones last', () => {
      const dates = { 'a.webp': 'uncommitted', 'c.webp': '2026-08-02T00:00:00+02:00' };
      assert.deepEqual(
        deck({ dates }).cards.map((c) => c.asset),
        ['c.webp', 'a.webp', 'b.webp']
      );
    });

    it('skips and counts a valid keep and a valid regen', () => {
      const verdicts = {
        'a.webp': { verdict: 'keep', sha256: sha(1), at: 'x' },
        'b.webp': { verdict: 'regen', sha256: sha(2), at: 'x' }
      };
      const d = deck({ verdicts });
      assert.deepEqual(
        d.cards.map((c) => c.asset),
        ['c.webp']
      );
      assert.equal(d.skippedKeep, 1);
      assert.equal(d.skippedRegen, 1);
      assert.equal(d.total, 3);
    });

    it('shows a picture again when its hash changed', () => {
      const verdicts = { 'a.webp': { verdict: 'keep', sha256: sha(9), at: 'x' } };
      const d = deck({ verdicts });
      assert.equal(d.cards.length, 3);
      assert.equal(d.skippedKeep, 0);
    });

    it('skips nothing in all mode and shows the stored verdict', () => {
      const verdicts = { 'a.webp': { verdict: 'keep', sha256: sha(1), at: 'x' } };
      const d = deck({ verdicts, query: { all: true, ids: [] } });
      assert.equal(d.cards.length, 3);
      assert.equal(d.cards.find((c) => c.asset === 'a.webp').verdict, 'keep');
      assert.equal(d.skippedKeep, 0);
    });

    it('filters by ids through any claimant and reports an unknown id', () => {
      const d = deck({ query: { all: false, ids: ['a3', 'zzz'] } });
      assert.deepEqual(
        d.cards.map((c) => c.asset),
        ['a.webp']
      );
      assert.deepEqual(d.unknownIds, ['zzz']);
      assert.equal(d.total, 1);
    });

    it('reports a picture with no file and makes no card of it', () => {
      const d = deck({ shas: { 'a.webp': sha(1), 'b.webp': sha(2) } });
      assert.deepEqual(d.missingFiles, ['c.webp']);
      assert.equal(d.cards.length, 2);
    });
  });

  describe('readVerdicts', () => {
    const entry = { verdict: 'regen', sha256: sha(1), at: '2026-10-07' };
    const store = (verdicts, v = 1) => JSON.stringify({ v, verdicts });

    it('reads an empty store', () => {
      assert.deepEqual(readVerdicts(null), { ok: true, verdicts: {} });
      assert.deepEqual(readVerdicts(''), { ok: true, verdicts: {} });
    });

    it('refuses bad JSON and another version', () => {
      assert.deepEqual(readVerdicts('{'), { ok: false, reason: 'unreadable' });
      assert.deepEqual(readVerdicts('[]'), { ok: false, reason: 'unreadable' });
      assert.deepEqual(readVerdicts(store({}, 2)), { ok: false, reason: 'version 2' });
    });

    it('drops an entry of the wrong shape and keeps the others', () => {
      const out = readVerdicts(
        store({
          ok: entry,
          badVerdict: { ...entry, verdict: 'maybe' },
          badSha: { ...entry, sha256: 'abc' },
          notObject: 5
        })
      );
      assert.deepEqual(Object.keys(out.verdicts), ['ok']);
    });

    it('drops a bad comment from its entry and keeps the entry', () => {
      const out = readVerdicts(
        store({
          empty: { ...entry, comment: '' },
          long: { ...entry, comment: 'x'.repeat(501) },
          number: { ...entry, comment: 4 },
          onKeep: { ...entry, verdict: 'keep', comment: 'no' },
          good: { ...entry, comment: 'ok' }
        })
      );
      assert.equal(out.verdicts.empty.comment, undefined);
      assert.equal(out.verdicts.long.comment, undefined);
      assert.equal(out.verdicts.number.comment, undefined);
      assert.equal(out.verdicts.onKeep.comment, undefined);
      assert.equal(out.verdicts.onKeep.verdict, 'keep');
      assert.equal(out.verdicts.good.comment, 'ok');
    });
  });

  describe('setVerdict', () => {
    const base = { asset: 'a.webp', sha256: sha(1), at: '2026-10-07' };

    it('stores keep and regen, with and without a comment', () => {
      assert.deepEqual(setVerdict({}, { ...base, verdict: 'keep' })['a.webp'], {
        verdict: 'keep',
        sha256: sha(1),
        at: '2026-10-07'
      });
      assert.equal(setVerdict({}, { ...base, verdict: 'regen' })['a.webp'].comment, undefined);
      assert.equal(
        setVerdict({}, { ...base, verdict: 'regen', comment: '  dark  ' })['a.webp'].comment,
        'dark'
      );
    });

    it('drops a whitespace comment and a comment on keep', () => {
      assert.equal(
        setVerdict({}, { ...base, verdict: 'regen', comment: '   ' })['a.webp'].comment,
        undefined
      );
      assert.equal(
        setVerdict({}, { ...base, verdict: 'keep', comment: 'x' })['a.webp'].comment,
        undefined
      );
    });

    it('cuts a comment to 500 characters', () => {
      const out = setVerdict({}, { ...base, verdict: 'regen', comment: 'x'.repeat(600) });
      assert.equal(out['a.webp'].comment.length, 500);
    });

    it('removes an entry for a null verdict and never mutates the input', () => {
      const input = { 'a.webp': { verdict: 'keep', sha256: sha(1), at: 'x' } };
      const copy = JSON.stringify(input);
      assert.deepEqual(setVerdict(input, { ...base, verdict: null }), {});
      setVerdict(input, { ...base, verdict: 'regen' });
      assert.equal(JSON.stringify(input), copy);
    });
  });

  it('setVerdict keeps an entry whose hash this tab does not know', () => {
    const other = { verdict: 'regen', sha256: sha(9), at: 'x', comment: 'newer tab' };
    const out = setVerdict(
      { 'x.webp': other },
      { asset: 'a.webp', verdict: 'keep', sha256: sha(1), at: 'y' }
    );
    assert.deepEqual(out['x.webp'], other);
    assert.deepEqual(setVerdict(out, { asset: 'a.webp', verdict: null })['x.webp'], other);
  });

  describe('setComment', () => {
    const regen = { verdict: 'regen', sha256: sha(1), at: 'x', comment: 'old' };
    const verdicts = {
      'a.webp': regen,
      'b.webp': { verdict: 'keep', sha256: sha(2), at: 'x' }
    };

    it('sets, changes and removes a comment and keeps the hash', () => {
      assert.equal(setComment(verdicts, 'a.webp', ' new ')['a.webp'].comment, 'new');
      assert.equal(setComment(verdicts, 'a.webp', '')['a.webp'].comment, undefined);
      assert.equal(setComment(verdicts, 'a.webp', 'new')['a.webp'].sha256, sha(1));
      assert.equal(verdicts['a.webp'].comment, 'old');
    });

    it('returns the input for a keep entry and a missing asset', () => {
      assert.equal(setComment(verdicts, 'b.webp', 'x'), verdicts);
      assert.equal(setComment(verdicts, 'zzz.webp', 'x'), verdicts);
    });
  });

  it('pruneVerdicts drops a missing picture and a changed hash', () => {
    const verdicts = {
      'a.webp': { verdict: 'keep', sha256: sha(1), at: 'x' },
      'b.webp': { verdict: 'keep', sha256: sha(9), at: 'x' },
      'gone.webp': { verdict: 'keep', sha256: sha(1), at: 'x' }
    };
    assert.deepEqual(Object.keys(pruneVerdicts(verdicts, shas)), ['a.webp']);
  });

  describe('pendingRegen and regenJson', () => {
    const verdicts = {
      'c.webp': { verdict: 'regen', sha256: sha(3), at: 'x', comment: 'say "hi"\nline' },
      'a.webp': { verdict: 'regen', sha256: sha(1), at: 'x' },
      'b.webp': { verdict: 'regen', sha256: sha(9), at: 'x' }
    };
    const list = pendingRegen({ records, verdicts, shas });

    it('lists valid regen verdicts under the anchor id in catalog order', () => {
      assert.deepEqual(
        list.map((e) => e.id),
        ['a1', 'c1']
      );
      assert.equal(list[0].comment, null);
    });

    it('keeps a comment with quotes and a newline through JSON.parse', () => {
      assert.equal(JSON.parse(regenJson(list)).c1, 'say "hi"\nline');
    });

    it('writes the documented format', () => {
      assert.equal(
        regenJson([
          { id: 'ci2', comment: 'lettering on the whistle' },
          { id: 'ci8', comment: null }
        ]),
        '{\n  "ci2": "lettering on the whistle",\n  "ci8": null\n}'
      );
      assert.equal(regenJson([]), '{}');
    });
  });

  describe('reviewKeyAction', () => {
    const offered = {
      start: ['start', 'forget', 'lang'],
      card: ['keep', 'regen', 'regenComment', 'undo', 'finish', 'lang'],
      comment: ['save', 'cancel'],
      end: ['copy', 'prev', 'next', 'edit', 'back', 'lang']
    };

    it('gives every action of every screen a key and no other', () => {
      for (const [mode, actions] of Object.entries(offered)) {
        const reachable = new Set(
          Object.keys(REVIEW_KEYS[mode]).map((k) => reviewKeyAction(mode, k))
        );
        assert.deepEqual([...reachable].sort(), [...actions].sort(), mode);
      }
    });

    it('lets a field take l, c, e and the arrows', () => {
      for (const key of [
        'l',
        'L',
        'c',
        'e',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown'
      ]) {
        assert.equal(reviewKeyAction('comment', key), null, key);
      }
    });

    it('returns null for an unknown mode or key', () => {
      assert.equal(reviewKeyAction('nope', 'Enter'), null);
      assert.equal(reviewKeyAction('card', 'x'), null);
      assert.equal(reviewKeyAction('card', 'toString'), null);
    });
  });

  describe('reviewRoute', () => {
    it('allows each documented path', () => {
      assert.deepEqual(reviewRoute('/'), { redirect: '/tools/artwork/review/index.html' });
      assert.deepEqual(reviewRoute('/review-state.json'), { state: true });
      assert.deepEqual(reviewRoute('/card.css'), { css: true });
      assert.equal(reviewRoute('/data.js').file, 'data.js');
      assert.equal(reviewRoute('/app/src/styles/tokens.css').type, 'text/css; charset=utf-8');
      assert.equal(reviewRoute('/tools/artwork/lib.mjs').file, 'tools/artwork/lib.mjs');
      assert.equal(
        reviewRoute('/tools/artwork/review/index.html').type,
        'text/html; charset=utf-8'
      );
      assert.equal(
        reviewRoute('/tools/artwork/review/review.mjs').file,
        'tools/artwork/review/review.mjs'
      );
      assert.deepEqual(reviewRoute('/img/ci2.webp'), {
        file: 'img/ci2.webp',
        type: 'image/webp'
      });
      assert.deepEqual(reviewRoute('/img/thumb/ci2.webp'), {
        file: 'img/thumb/ci2.webp',
        type: 'image/webp'
      });
      assert.deepEqual(reviewRoute('/app/src/lib/label.js'), {
        ts: 'app/src/lib/label.ts',
        type: 'text/javascript; charset=utf-8'
      });
    });

    it('refuses every path outside the allowlist', () => {
      for (const p of [
        '/img/thumb/a/b.webp',
        '/img/../data.js',
        '/img/%2e%2e/x.webp',
        '/package.json',
        '/tools/artwork/run.mjs',
        '/.git/config',
        '/app/src/lib/label.test.js',
        '/app/src/lib/../ports/storage.js',
        '/app/src/ports/storage.js',
        '/img/a.png',
        '/toString'
      ]) {
        assert.equal(reviewRoute(p), null, p);
      }
    });
  });

  it('readLang returns en only for exactly en', () => {
    assert.equal(readLang(null), 'ru');
    assert.equal(readLang(''), 'ru');
    assert.equal(readLang('en'), 'en');
    assert.equal(readLang('EN'), 'ru');
    assert.equal(readLang('de'), 'ru');
  });

  describe('cardCss and ruleBody', () => {
    it('unwraps :global with balanced parentheses', () => {
      const out = cardCss([
        '<script></script><style>a :global(.b .c:has(.d)) { x: 1 } e :global(p) { y: 2 }</style>',
        '<style lang="css">f { z: 3 }</style>'
      ]);
      assert.ok(out.includes('a .b .c:has(.d) { x: 1 }'));
      assert.ok(out.includes('e p { y: 2 }'));
      assert.ok(out.includes('f { z: 3 }'));
      assert.ok(!out.includes(':global'));
    });

    it('throws for a source with no style block', () => {
      assert.throws(
        () => cardCss(['<style></style>', '<p></p>']),
        /^Error: 1: no <style> block/
      );
    });

    it('reads the real components', () => {
      const css = cardCss(CARD_FILES.map(readRepo));
      assert.ok(!css.includes(':global('));
      assert.ok(css.includes('.card-meta {'));
    });

    it('finds every rule of a selector, inside @media too', () => {
      const css = '.a { x: 1 }\n@media (max-width: 1px) {\n  .a { y: 2 }\n}\n.b .a { z: 3 }';
      const body = ruleBody(css, '.a');
      assert.ok(body.includes('x: 1') && body.includes('y: 2'));
      assert.ok(!body.includes('z: 3'));
    });
  });

  describe('the card follows the site card', () => {
    it('uses only classes that the real components style', () => {
      const missing = classesMissingFrom(cardCss(CARD_FILES.map(readRepo)));
      assert.deepEqual(missing, [], `class not styled by the components. See ${RULE}`);
    });

    it('fails the class guard for a renamed class', () => {
      const texts = CARD_FILES.map(readRepo).map((t) =>
        t.replaceAll('.card-meta {', '.card-metax {')
      );
      assert.deepEqual(classesMissingFrom(cardCss(texts)), ['card-meta']);
    });

    it('pins the card head of RecordCard.svelte', () => {
      const hash = createHash('sha256')
        .update(cardHeadSource(readRepo('app/src/components/RecordCard.svelte')))
        .digest('hex');
      assert.equal(
        hash,
        CARD_HEAD_SHA256,
        `RecordCard.svelte's card head changed. Check renderCard in tools/artwork/review/review.mjs (${RULE}), then set CARD_HEAD_SHA256 to ${hash}.`
      );
    });

    it('changes the card head hash for an added line', () => {
      const text = readRepo('app/src/components/RecordCard.svelte');
      const marker = 'const parts = $derived(descParts(it, lang));';
      assert.ok(text.includes(marker));
      assert.notEqual(
        cardHeadSource(text),
        cardHeadSource(text.replace(marker, marker + '\n  const extra = 1;'))
      );
      assert.throws(() => cardHeadSource('<p></p>'), /no dict derivation/);
    });

    it('finds each art size in its source rule', () => {
      const sources = {};
      for (const s of REVIEW_ART_SIZES) sources[s.file] = readRepo(s.file);
      assert.deepEqual(artSizeProblems(sources), [], `an art size moved. See ${RULE}`);
    });

    it('fails the art size guard for a changed width', () => {
      const sources = {};
      for (const s of REVIEW_ART_SIZES) sources[s.file] = readRepo(s.file);
      const file = 'app/src/components/RowMain.svelte';
      sources[file] = sources[file].replace('width: 60px', 'width: 64px');
      assert.equal(artSizeProblems(sources).length, 1);
    });

    describe('the transpiled label code', () => {
      const dir = mkdtempSync(join(tmpdir(), 'review-lib-'));
      after(() => rmSync(dir, { recursive: true, force: true }));

      it('loads and gives the values of the site', async () => {
        const ts = rootRequire('typescript');
        writeFileSync(join(dir, 'package.json'), '{"type":"module"}');
        const done = new Set();
        const queue = ['label', 'i18n', 'desc', 'dict'];
        while (queue.length) {
          const name = queue.pop();
          if (done.has(name)) continue;
          done.add(name);
          const source = readRepo(`app/src/lib/${name}.ts`);
          const js = transpileLibSource(ts, source);
          for (const m of js.matchAll(/(?:from|import)\s+['"]\.\/([A-Za-z0-9]+)\.js['"]/g)) {
            readRepo(`app/src/lib/${m[1]}.ts`);
            queue.push(m[1]);
          }
          mkdirSync(dir, { recursive: true });
          writeFileSync(join(dir, name + '.js'), js);
        }
        const load = (n) => import(pathToFileURL(join(dir, n + '.js')).href);
        const { cardBadges, srcLabel } = await load('label');
        const { dict } = await load('dict');
        const q4 = catalogRecords(loadLoot()).find((r) => r.id === 'q4');
        assert.deepEqual(cardBadges(q4, 'en', dict('en')), [
          { cls: 'eq-weapon', text: 'Primary weapon' }
        ]);
        assert.equal(srcLabel(q4, 'ru'), 'Core');
      });
    });
  });

  it('openCommand picks the opener of each platform', () => {
    assert.deepEqual(openCommand('win32', 'http://x/'), [
      'cmd',
      ['/c', 'start', '', 'http://x/']
    ]);
    assert.deepEqual(openCommand('darwin', 'http://x/'), ['open', ['http://x/']]);
    assert.deepEqual(openCommand('linux', 'http://x/'), ['xdg-open', ['http://x/']]);
  });
});
