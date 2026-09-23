/*
  node:test over lib.mjs's pure logic. No filesystem, no sharp, no network -
  hand-built record fixtures, in the style of tools/tg-preview/lib.test.mjs.
*/
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeName,
  indexRecords,
  planInstall,
  planIngest,
  planThumbs,
  affectedStubUrls,
  staleDelta
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
  it("includes every sharedWith record's stub, sorted and deduplicated", () => {
    const pairs = [
      { recordId: 'q24', sharedWith: ['q70', 'q138', 'q205'] },
      { recordId: 'a', sharedWith: [] }
    ];
    const urls = affectedStubUrls(pairs, SITE);
    assert.deepEqual(urls, [
      SITE + 'i/a.html',
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
