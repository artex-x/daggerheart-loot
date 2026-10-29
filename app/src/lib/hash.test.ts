/* The address grammar against the fixtures tests/app/contracts.js replays. A
   fixture records what the address unfolds into on screen: which section is
   highlighted, how many rows survive, which filter pills appear. What the parser
   can see - the table name and the picked values - is read out of it here, so one
   file holds both implementations to account. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_HASH,
  canonicalHash,
  cardVersion,
  HOMEBREW_HASH,
  homebrewItemHash,
  homebrewTabHash,
  itemHash,
  keepsTicks,
  legacySource,
  parseHash,
  printSetHash,
  recordHash,
  recordHref,
  sectionHash,
  shareHash,
  storedListHash,
  recordUrl,
  appUrl,
  stripHash,
  tablesHash,
  SECTION_SLUG,
  TABLE_SLUG,
  type Route
} from './hash.js';
import { decodeFilter, encodeFilter, groupsFor, passes } from './filters.js';
import { isTableId, SECTIONS, type TableId } from './types.js';

interface RouteFixture {
  hash: string;
  why: string;
  resolves: {
    hash: string;
    tab: string | null;
    rows: number;
    printCards: number;
    picked: string[];
    source?: string[];
  };
}

const FIXTURES: RouteFixture[] = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'urls', 'routes.json'),
    'utf8'
  )
) as RouteFixture[];

describe('golden route fixtures', () => {
  it('there are at least twenty', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(20);
  });

  for (const fx of FIXTURES) {
    it(fx.hash + ' - ' + fx.why, () => {
      const route = parseHash(fx.hash);

      /* The fixture records which tab lit up, which for a supplement is the supplements
         tab and not its own section (nav.ts `tabOf`); only the tables tab is read here. */
      if (fx.resolves.tab === '#/tables') {
        expect(route.kind).toBe('tables');
      }
      if (fx.resolves.hash === ACCOUNT_HASH) expect(route).toEqual({ kind: 'account' });
      if (fx.resolves.hash.startsWith(HOMEBREW_HASH)) expect(route.kind).toMatch(/^homebrew/);
      /* Every address under `#/print/` is retired; `#/p/` reads the leading run as its id. */
      if (fx.hash.startsWith('#/print/')) expect(route).toEqual({ kind: 'printRetired' });
      if (fx.hash.startsWith('#/p/')) {
        expect(route).toEqual({
          kind: 'printSet',
          id: /^[A-Za-z0-9_-]*/.exec(fx.hash.slice(4))?.[0] ?? ''
        });
      }

      /* The pills on screen are the selection narrowed to the groups the table
         offers. Parsing keeps a foreign group (the address is read as written),
         while the panel does not show it and the filter does not apply it -
         which is why the table stays whole. */
      if (route.kind === 'tables' && route.table) {
        /* On `homebrew` the `src` value is the source chip, never a pill. */
        const shown = groupsFor(route.table)
          .filter((g) => route.table !== 'homebrew' || g !== 'src')
          .flatMap((g) => (route.filter[g] ?? []).map((v) => g + ':' + v));
        expect(shown.sort()).toEqual([...fx.resolves.picked].sort());
      }

      /* A share link's pills are the parsed values its list holds, so each pill is in
         the parsed filter; a value the list lacks is parsed and draws none. */
      if (fx.hash.startsWith('#/s/')) {
        expect(route.kind).toBe('share');
        if (route.kind === 'share') {
          for (const pill of fx.resolves.picked) {
            const [group = '', value = ''] = pill.split(':');
            expect(route.filter[group]).toContain(value);
          }
        }
      }
    });
  }
});

describe('old section names', () => {
  /* The fixture holds the source switch state for all three */
  const legacy = FIXTURES.filter((f) => f.resolves.source && f.hash.startsWith('#/roll/'));

  it('four are in the fixtures: three old and the current one', () => {
    expect(legacy.length).toBeGreaterThanOrEqual(4);
  });

  for (const fx of legacy) {
    it(fx.hash + ' turns on the same sources as the screen', () => {
      const src = legacySource(fx.hash);
      if (!src) {
        /* The current name: the app turns both sources on itself */
        expect(fx.resolves.source).toEqual(['core:on', 'hnf:on']);
        return;
      }
      expect(['core:' + (src.core ? 'on' : 'off'), 'hnf:' + (src.hnf ? 'on' : 'off')]).toEqual(
        fx.resolves.source
      );
    });
  }

  it('lead to the same section without rewriting the address', () => {
    for (const h of ['#/roll/core', '#/roll/hnf', '#/roll/all']) {
      const r = parseHash(h);
      expect(r.kind).toBe('section');
      expect((r as Extract<Route, { kind: 'section' }>).section).toBe('roll/std');
    }
  });
});

describe('tables', () => {
  it('a name that does not exist falls to unknown, home-bound like any other unreadable address (R9/Q3)', () => {
    /* Was "not swapped for a default" - kept the table already on screen.
       Q3 settled one rule for every unreadable address instead. */
    expect(parseHash('#/tables/not_a_table').kind).toBe('unknown');
    expect(parseHash('#/tables/nope/f_tier-1_cls-phy').kind).toBe('unknown');
  });

  it('a bare #/tables carries no name and is unaffected', () => {
    /* The R9 rule is about a *named* table that does not resolve - a bare
       address has no name to fail against and keeps whichever table (or
       filter tail) is already open, exactly as before. */
    const r = parseHash('#/tables/f_kind-item');
    expect(r).toEqual({ kind: 'tables', table: null, anchor: '', filter: { kind: ['item'] } });
  });

  it('a tail without f_ is an anchor', () => {
    const r = parseHash('#/tables/alt_item/rare');
    expect(r).toEqual({ kind: 'tables', table: 'alt_item', anchor: 'rare', filter: {} });
  });

  it('anchor and filter never appear together', () => {
    const r = parseHash('#/tables/eq_weapon/f_tier-2');
    expect((r as Extract<Route, { kind: 'tables' }>).anchor).toBe('');
  });
});

describe('the filter segment', () => {
  it('a dot splits groups, a dash splits values', () => {
    expect(decodeFilter('f_tier-1-2.cls-mag', groupsFor('eq_weapon'))).toEqual({
      tier: ['1', '2'],
      cls: ['mag']
    });
  });

  it('an underscore inside a value does not split the group', () => {
    expect(decodeFilter('f_frame-beast_feast', groupsFor('other_frames'))).toEqual({
      frame: ['beast_feast']
    });
  });

  it('the older separator is still read', () => {
    expect(decodeFilter('f_tier-1_cls-phy', groupsFor('eq_weapon'))).toEqual({
      tier: ['1'],
      cls: ['phy']
    });
  });

  it('builds back into the same segment', () => {
    const groups = groupsFor('eq_weapon');
    for (const seg of ['f_tier-1-2.cls-mag', 'f_range-melee', 'f_burden-2.line-uniq']) {
      expect(encodeFilter(decodeFilter(seg, groups), groups)).toBe(seg);
    }
  });

  it('an untouched filter takes no room in the address', () => {
    expect(encodeFilter({}, groupsFor('eq_weapon'))).toBe('');
    expect(encodeFilter({ tier: [] }, groupsFor('eq_weapon'))).toBe('');
    expect(tablesHash('eq_weapon', { filter: {} })).toBe('#/tables/eq_weapon');
  });

  it('a group the table does not offer never reaches the address', () => {
    /* The other side of a foreign group being ignored silently on read */
    expect(encodeFilter({ burden: ['2'] }, groupsFor('eq_armor'))).toBe('');
  });

  it('reads a two-frame link without mistaking a value-head for a group', () => {
    /* A link through the legacy `frames` alias naming two frames must decode
       both, not fall into the legacy underscore
       reading because `frame-beast` and `feast-colossus` both "look like a
       group" - `feast` is nobody's group. */
    const hash = '#/tables/frames/f_frame-beast_feast-colossus';
    const route = parseHash(hash) as Extract<Route, { kind: 'tables' }>;
    expect(route.filter['frame']).toEqual(['beast_feast', 'colossus']);
    expect(encodeFilter(route.filter, groupsFor('other_frames'))).toBe(
      'f_frame-beast_feast-colossus'
    );
  });

  it('the group names are the ones written in the spec', () => {
    expect(groupsFor('eq_weapon')).toEqual([
      'tier',
      'src',
      'cls',
      'trait',
      'range',
      'burden',
      'line'
    ]);
    expect(groupsFor('eq_weapon')).not.toContain('rg');
    expect(groupsFor('eq_weapon')).not.toContain('bu');
  });
});

describe('selection', () => {
  const groups = groupsFor('eq_weapon');
  const katana = (g: string): string =>
    ({
      tier: '1',
      src: 'hnf',
      cls: 'phy',
      trait: 'agility',
      range: 'melee',
      burden: '2',
      line: 'line'
    })[g] ?? '';

  it('an empty filter lets everything through', () => {
    expect(passes({}, groups, katana)).toBe(true);
  });

  it('inside a group it is OR', () => {
    expect(passes({ tier: ['1', '4'] }, groups, katana)).toBe(true);
    expect(passes({ tier: ['2', '4'] }, groups, katana)).toBe(false);
  });

  it('groups narrow each other', () => {
    expect(passes({ tier: ['1'], cls: ['phy'] }, groups, katana)).toBe(true);
    expect(passes({ tier: ['1'], cls: ['mag'] }, groups, katana)).toBe(false);
  });

  it('a foreign group does not empty the table', () => {
    /* A value arrived by link for a facet this table does not have */
    expect(passes({ rg: ['melee'] }, groups, katana)).toBe(true);
  });
});

describe('print', () => {
  it('reads a print set by the leading run of its id, a stray character dropped', () => {
    expect(parseHash('#/p/AbCdEf-_1234')).toEqual({ kind: 'printSet', id: 'AbCdEf-_1234' });
    expect(parseHash('#/p/AbCdEf-_1234.')).toEqual({ kind: 'printSet', id: 'AbCdEf-_1234' });
    expect(parseHash('#/p/short')).toEqual({ kind: 'printSet', id: 'short' });
    expect(parseHash('#/p/')).toEqual({ kind: 'printSet', id: '' });
    expect(parseHash('#/p').kind).toBe('unknown');
  });

  it('retires every address under #/print/ and reads nothing from it', () => {
    for (const h of [
      '#/print/ci1',
      '#/print/ci1*3-q1',
      '#/print/',
      '#/print/s/x/y',
      '#/print/h/00000000-0000-4000-8000-000000000511'
    ]) {
      expect(parseHash(h), h).toEqual({ kind: 'printRetired' });
    }
    expect(parseHash('#/print').kind).toBe('unknown');
  });

  it('builds a print set address that reads back', () => {
    expect(printSetHash('AbCdEf-_1234')).toBe('#/p/AbCdEf-_1234');
    expect(parseHash(printSetHash('AbCdEf-_1234'))).toEqual({
      kind: 'printSet',
      id: 'AbCdEf-_1234'
    });
  });
});

describe('an unreadable address', () => {
  it('says plainly that it could not be read', () => {
    for (const h of ['#/nonsense', '#/roll/nope', '#/i/', '']) {
      expect(parseHash(h).kind).toBe('unknown');
    }
  });

  it('a named table that resolves to nothing is unreadable too (R9/Q3)', () => {
    expect(parseHash('#/tables/nosuch').kind).toBe('unknown');
  });
});

describe('the account page', () => {
  it('is exactly `#/account`', () => {
    expect(parseHash(ACCOUNT_HASH)).toEqual({ kind: 'account' });
    expect(parseHash('#account')).toEqual({ kind: 'account' });
  });

  it('reads nothing longer or shorter as the account page', () => {
    for (const h of ['#/account/x', '#/accounts', '#/acc']) {
      expect(parseHash(h).kind).toBe('unknown');
    }
  });
});

describe('the homebrew pages', () => {
  it('reads `#/homebrew`, `#/homebrew/new` and `#/homebrew/<key>`', () => {
    expect(parseHash(HOMEBREW_HASH)).toEqual({
      kind: 'homebrew',
      tab: 'items',
      key: null,
      filter: {}
    });
    expect(parseHash('#/homebrew/new')).toEqual({ kind: 'homebrewItem', key: null });
    expect(parseHash('#/homebrew/hb_emberaxeaaaaaaaa')).toEqual({
      kind: 'homebrewItem',
      key: 'hb_emberaxeaaaaaaaa'
    });
  });

  it('reads each tab, and a card key on the Sets and Rules tabs', () => {
    expect(parseHash('#/homebrew/sources')).toEqual({
      kind: 'homebrew',
      tab: 'sources',
      key: null,
      filter: {}
    });
    expect(parseHash('#/homebrew/sets')).toEqual({
      kind: 'homebrew',
      tab: 'sets',
      key: null,
      filter: {}
    });
    expect(parseHash('#/homebrew/rules')).toEqual({
      kind: 'homebrew',
      tab: 'rules',
      key: null,
      filter: {}
    });
    expect(parseHash('#/homebrew/sets/hb_aldersetaaaaaaaa')).toEqual({
      kind: 'homebrew',
      tab: 'sets',
      key: 'hb_aldersetaaaaaaaa',
      filter: {}
    });
    expect(parseHash('#/homebrew/rules/hb_alderrulecardaaa')).toEqual({
      kind: 'homebrew',
      tab: 'rules',
      key: 'hb_alderrulecardaaa',
      filter: {}
    });
  });

  it('builds each tab address and reads it back', () => {
    expect(homebrewTabHash('items')).toBe('#/homebrew');
    expect(homebrewTabHash('sources')).toBe('#/homebrew/sources');
    expect(homebrewTabHash('sets')).toBe('#/homebrew/sets');
    expect(homebrewTabHash('rules', 'hb_alderrulecardaaa')).toBe(
      '#/homebrew/rules/hb_alderrulecardaaa'
    );
    for (const [tab, key] of [
      ['items', null],
      ['sources', null],
      ['sets', null],
      ['sets', 'hb_aldersetaaaaaaaa'],
      ['rules', null],
      ['rules', 'hb_alderrulecardaaa']
    ] as const) {
      expect(parseHash(homebrewTabHash(tab, key))).toEqual({
        kind: 'homebrew',
        tab,
        key,
        filter: {}
      });
    }
  });

  it('reads the Items tab filter, any number of sources among its values', () => {
    expect(parseHash('#/homebrew/f_kind-item.src-hb-hb_alderworkshopaaa')).toEqual({
      kind: 'homebrew',
      tab: 'items',
      key: null,
      filter: { kind: ['item'], src: ['hb', 'hb_alderworkshopaaa'] }
    });
    expect(parseHash('#/homebrew/f_')).toEqual({
      kind: 'homebrew',
      tab: 'items',
      key: null,
      filter: {}
    });
  });

  it('builds the Items tab filter address and reads it back, with nothing for no value', () => {
    for (const filter of [
      { kind: ['consumable'] },
      { src: ['hb', 'hb_alderworkshopaaa'] },
      { kind: ['item', 'equip'], src: ['hb_alderworkshopaaa'], sect: ['hb_sectbladesaaaaaa'] }
    ]) {
      const hash = homebrewTabHash('items', null, filter);
      expect(hash).toMatch(/^#\/homebrew\/f_/);
      expect(parseHash(hash)).toEqual({ kind: 'homebrew', tab: 'items', key: null, filter });
    }
    expect(homebrewTabHash('items', null, {})).toBe('#/homebrew');
    expect(homebrewTabHash('items', null, { kind: [] })).toBe('#/homebrew');
    expect(homebrewTabHash('items', null, { tier: ['1'] })).toBe('#/homebrew');
    expect(homebrewTabHash('sets', null, { kind: ['item'] })).toBe('#/homebrew/sets');
  });

  it('reads any other homebrew address as unreadable', () => {
    for (const h of [
      '#/homebrew/f_kind-item/x',
      '#/homebrew/f_kind-item%',
      '#/homebrew/sources/f_kind-item',
      '#/homebrew/sets/f_kind-item',
      '#/homebrew/',
      '#/homebrew/items',
      '#/homebrew/sources/hb_aldersetaaaaaaaa',
      '#/homebrew/sets/x',
      '#/homebrew/sets/',
      '#/homebrew/rules/',
      '#/homebrew/rules/hb_x',
      '#/homebrew/pistols',
      '#/homebrew/hb_x',
      '#/homebrew/hb_emberaxeaaaaaaaa/x',
      '#/homebrew/HB_EMBERAXEAAAAAAAA',
      '#/homebrews'
    ]) {
      expect(parseHash(h).kind).toBe('unknown');
    }
  });

  it('builds the editor addresses', () => {
    expect(homebrewItemHash(null)).toBe('#/homebrew/new');
    expect(homebrewItemHash('hb_emberaxeaaaaaaaa')).toBe('#/homebrew/hb_emberaxeaaaaaaaa');
  });

  it('reads the homebrew table, its anchors and its filter', () => {
    expect(parseHash('#/tables/homebrew')).toEqual({
      kind: 'tables',
      table: 'homebrew',
      anchor: '',
      filter: {}
    });
    expect(parseHash('#/tables/homebrew/hb_emberaxeaaaaaaaa')).toEqual({
      kind: 'tables',
      table: 'homebrew',
      anchor: 'hb_emberaxeaaaaaaaa',
      filter: {}
    });
    expect(parseHash('#/tables/homebrew/f_kind-equip.sect-hb_sectbladesaaaaaa')).toEqual({
      kind: 'tables',
      table: 'homebrew',
      anchor: '',
      filter: { kind: ['equip'], sect: ['hb_sectbladesaaaaaa'] }
    });
  });

  it('writes a homebrew table filter that reads back as the same filter', () => {
    const filter = { src: ['hb', 'hb_alderworkshopaaa'], sect: ['hb_sectbladesaaaaaa'] };
    const h = tablesHash('homebrew', { filter });
    expect(h).toBe('#/tables/homebrew/f_src-hb-hb_alderworkshopaaa.sect-hb_sectbladesaaaaaa');
    const r = parseHash(h);
    expect(r.kind === 'tables' && r.filter).toEqual(filter);
  });
});

describe('an old list link', () => {
  it('reads every #/l/ address as retired, plain, packed, empty or with a stray character', () => {
    for (const h of ['#/l/x', '#/l/~x', '#/l/', '#/l/ABC.']) {
      expect(parseHash(h), h).toEqual({ kind: 'listRetired' });
    }
  });

  it('leaves an address that only starts like one unknown', () => {
    expect(parseHash('#/lx')).toEqual({ kind: 'unknown' });
    expect(parseHash('#/list')).toEqual({ kind: 'unknown' });
  });
});

describe('a share link', () => {
  /* The server reads only a 43-character base64url token; a shorter sample tests the malformed path. */
  const SAMPLE = 'Qm9vZ2xlLXBsYXllci10b2tlbi1leGFtcGxlLXgxMjM';

  it('uses a sample token of the real length', () => {
    expect(SAMPLE).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  const bare = (token: string): Route => ({ kind: 'share', token, filter: {} });

  it('reads the token after `#/s/`', () => {
    expect(parseHash('#/s/player-token-1')).toEqual(bare('player-token-1'));
  });

  it('drops a stray character after the token', () => {
    const long = 'A'.repeat(43);
    expect(parseHash('#/s/' + long + '.')).toEqual(bare(long));
    expect(parseHash('#/s/' + SAMPLE + '.')).toEqual(bare(SAMPLE));
  });

  it('reads a bare `#/s/` as the empty token, and `#/s` as unknown', () => {
    expect(parseHash('#/s/')).toEqual(bare(''));
    expect(parseHash('#/s').kind).toBe('unknown');
  });

  it('builds the address back', () => {
    expect(shareHash(SAMPLE)).toBe('#/s/' + SAMPLE);
    expect(parseHash(shareHash(SAMPLE))).toEqual(bare(SAMPLE));
  });

  it('reads a filter segment after the token, in the old separator too', () => {
    const want: Route = {
      kind: 'share',
      token: SAMPLE,
      filter: { kind: ['weapon'], tier: ['1', '2'] }
    };
    expect(parseHash('#/s/' + SAMPLE + '/f_kind-weapon.tier-1-2')).toEqual(want);
    expect(parseHash('#/s/' + SAMPLE + '/f_kind-weapon_tier-1-2')).toEqual(want);
  });

  it('drops a stray character after the segment, and anything after the token that is no segment', () => {
    expect(parseHash('#/s/' + SAMPLE + '/f_kind-weapon.')).toEqual({
      kind: 'share',
      token: SAMPLE,
      filter: { kind: ['weapon'] }
    });
    expect(parseHash('#/s/' + SAMPLE + '/x_kind-weapon')).toEqual(bare(SAMPLE));
    expect(parseHash('#/s/' + SAMPLE + '/f_')).toEqual(bare(SAMPLE));
  });

  it('writes the segment in LIST_GROUPS order, and no segment for an empty filter', () => {
    const filter = { line: ['uniq'], kind: ['armor', 'weapon'], src: [] };
    const h = shareHash(SAMPLE, { filter });
    expect(h).toBe('#/s/' + SAMPLE + '/f_kind-armor-weapon.line-uniq');
    expect(parseHash(h)).toEqual({
      kind: 'share',
      token: SAMPLE,
      filter: { kind: ['armor', 'weapon'], line: ['uniq'] }
    });
    expect(shareHash(SAMPLE, { filter: {} })).toBe('#/s/' + SAMPLE);
    expect(shareHash(SAMPLE, { filter: { kind: [] } })).toBe('#/s/' + SAMPLE);
  });

  it('writes no group a share link does not offer', () => {
    expect(shareHash(SAMPLE, { filter: { comm: ['x'], frame: ['colossus'] } })).toBe(
      '#/s/' + SAMPLE
    );
  });
});

describe('an item address', () => {
  const HID = '00000000-0000-4000-8000-000000000511';

  it('reads the id after `#/h/`, lowercased', () => {
    expect(parseHash('#/h/' + HID)).toEqual({ kind: 'item', id: HID });
    expect(parseHash('#/h/' + HID.toUpperCase())).toEqual({ kind: 'item', id: HID });
  });

  it('drops a stray character after the id and reads a malformed one as written', () => {
    expect(parseHash('#/h/' + HID + '.')).toEqual({ kind: 'item', id: HID });
    expect(parseHash('#/h/not-a-uuid')).toEqual({ kind: 'item', id: '' });
    expect(parseHash('#/h/')).toEqual({ kind: 'item', id: '' });
    expect(parseHash('#/h').kind).toBe('unknown');
  });

  it('links a homebrew record with an id to its address, and every other record to its page', () => {
    expect(itemHash(HID)).toBe('#/h/' + HID);
    expect(parseHash(itemHash(HID))).toEqual({ kind: 'item', id: HID });
    expect(recordHref({ id: 'hb_emberaxeaaaaaaaa', src: 'homebrew', hid: HID })).toBe(
      '#/h/' + HID
    );
    expect(recordHref({ id: 'hb_emberaxeaaaaaaaa', src: 'homebrew' })).toBe(
      '#/i/hb_emberaxeaaaaaaaa'
    );
    expect(recordHref({ id: 'q1', src: 'core', hid: HID })).toBe('#/i/q1');
  });
});

describe('building back', () => {
  it('a section rebuilds into the address it was parsed from', () => {
    for (const fx of FIXTURES) {
      const r = parseHash(fx.hash);
      if (r.kind !== 'section') continue;
      /* Except the old names: they lead to roll/std but must not be rewritten */
      if (legacySource(fx.hash)) continue;
      /* An old id builds back as its slug; the slug builds back as itself. */
      expect(sectionHash(r.section)).toBe(canonicalHash(fx.hash));
    }
  });

  it('a table with a filter builds back', () => {
    for (const fx of FIXTURES) {
      const r = parseHash(fx.hash);
      if (r.kind !== 'tables' || !r.table || !isTableId(r.table)) continue;
      const table: TableId = r.table;
      const back = tablesHash(table, { anchor: r.anchor, filter: r.filter });
      const again = parseHash(back);
      expect(again.kind).toBe('tables');
      /* What the table offers is preserved. A foreign group survives reading but
         not writing: the rebuilt address carries only what applies. */
      const kept = Object.fromEntries(
        groupsFor(table)
          .filter((g) => r.filter[g]?.length)
          .map((g) => [g, r.filter[g]])
      );
      expect(again).toEqual({ kind: 'tables', table, anchor: r.anchor, filter: kept });
    }
  });
});

describe('the URL ids of the source products', () => {
  const OLD_SECTIONS = Object.keys(SECTION_SLUG) as (keyof typeof SECTION_SLUG)[];
  const OLD_TABLES = Object.keys(TABLE_SLUG) as TableId[];

  it('reads a section slug and its old id as the same section', () => {
    for (const s of OLD_SECTIONS) {
      const slug = SECTION_SLUG[s] ?? '';
      expect(parseHash('#/' + slug), slug).toEqual({ kind: 'section', section: s });
      expect(parseHash('#/' + s), s).toEqual({ kind: 'section', section: s });
    }
  });

  it('reads a table slug and its old id as the same table, with an anchor and a filter', () => {
    for (const id of OLD_TABLES) {
      const slug = TABLE_SLUG[id] ?? '';
      for (const name of [slug, id]) {
        expect(parseHash('#/tables/' + name), name).toEqual({
          kind: 'tables',
          table: id,
          anchor: '',
          filter: {}
        });
        expect(parseHash('#/tables/' + name + '/t1'), name).toEqual({
          kind: 'tables',
          table: id,
          anchor: 't1',
          filter: {}
        });
        expect(parseHash('#/tables/' + name + '/f_kind-item'), name).toMatchObject({
          kind: 'tables',
          table: id,
          anchor: ''
        });
      }
    }
    expect(parseHash('#/tables/vault_of_ages/f_tier-2')).toEqual({
      kind: 'tables',
      table: 'voa',
      anchor: '',
      filter: { tier: ['2'] }
    });
  });

  it('writes the slug for every renamed id', () => {
    expect(sectionHash('roll/dread')).toBe('#/roll/dread_gm_toolbox');
    expect(sectionHash('roll/std')).toBe('#/roll/std');
    expect(tablesHash('dv', { anchor: 'dv3' })).toBe('#/tables/dragons_vault/dv3');
    expect(tablesHash('mwt', { filter: { realm: ['drome'] } })).toBe(
      '#/tables/many_worlds_tavern/f_realm-drome'
    );
    expect(tablesHash('hnf_item')).toBe('#/tables/hope_and_fear_item');
    expect(tablesHash('core_item')).toBe('#/tables/core_item');
  });

  it('keeps an unknown name unknown', () => {
    expect(parseHash('#/tables/dread_gm')).toEqual({ kind: 'unknown' });
    expect(parseHash('#/roll/dread_gm')).toEqual({ kind: 'unknown' });
  });

  it('swaps only a renamed name segment and keeps the rest as written', () => {
    expect(canonicalHash('#/tables/dread')).toBe('#/tables/dread_gm_toolbox');
    expect(canonicalHash('#/tables/dv/f_tier-2_x')).toBe('#/tables/dragons_vault/f_tier-2_x');
    expect(canonicalHash('#/roll/voa')).toBe('#/roll/vault_of_ages');
    expect(canonicalHash('#/tables/hnf_consumable')).toBe('#/tables/hope_and_fear_consumable');
    for (const kept of [
      '#/roll/hnf',
      '#/roll/core',
      '#/roll/all',
      '#/roll/std',
      '#/roll/dread_gm_toolbox',
      '#/tables/frames',
      '#/tables/eq_weapon/f_tier-1',
      '#/tables',
      '#/i/q1'
    ])
      expect(canonicalHash(kept), kept).toBe(kept);
  });
});

describe('writing an address', () => {
  /* The writers had no test of their own: the fixtures pin what an address
     means when it arrives, and these are what the app puts in a link. A link
     the app writes and cannot read afterwards is the failure they guard. */

  it('strips the hash and the slash, and leaves a bare path alone', () => {
    expect(stripHash('#/roll/std')).toBe('roll/std');
    expect(stripHash('#roll/std')).toBe('roll/std');
    expect(stripHash('roll/std')).toBe('roll/std');
    expect(stripHash('#')).toBe('');
    expect(stripHash('')).toBe('');
  });

  it('writes an address every section can be read back from', () => {
    /* The tab bar builds its links out of this, so a section the writer and the
       parser disagree about is a tab that highlights nothing when clicked. */
    /* Only `tables` gets a kind of its own: it carries a table, an anchor and a
       filter, and the parser has to hand those back. `lists` is a plain
       section - a single stored list is what becomes `storedList`. */
    const expected: Record<string, string> = { tables: 'tables' };
    for (const s of SECTIONS) {
      const h = sectionHash(s);
      expect(parseHash(h).kind, h).toBe(expected[s] ?? 'section');
    }
  });

  it('lands every section on itself, not on a neighbour', () => {
    for (const s of SECTIONS) {
      const r = parseHash(sectionHash(s));
      if (r.kind === 'section') expect(r.section, s).toBe(s);
    }
  });

  it('round-trips a record and a stored list', () => {
    expect(parseHash(recordHash('w12'))).toEqual({ kind: 'record', id: 'w12' });
    expect(parseHash(storedListHash('abc'))).toEqual({ kind: 'storedList', listId: 'abc' });
  });

  it('writes a table with a filter that reads back as the same filter', () => {
    const filter = { tier: ['1', '3'], cls: ['mag'] };
    const h = tablesHash('eq_weapon', { filter });
    const r = parseHash(h);
    expect(r.kind).toBe('tables');
    if (r.kind === 'tables') {
      expect(r.table).toBe('eq_weapon');
      expect(r.filter).toEqual(filter);
      expect(r.anchor).toBe('');
    }
  });

  it('writes a table with an anchor that reads back as the same anchor', () => {
    const r = parseHash(tablesHash('eq_armor', { anchor: 'gambeson' }));
    expect(r.kind).toBe('tables');
    if (r.kind === 'tables') {
      expect(r.anchor).toBe('gambeson');
      expect(r.filter).toEqual({});
    }
  });

  it('drops the anchor when a filter is picked, as the app does', () => {
    /* One slot, and the filter wins - otherwise the link would scroll to a row
       the filter has just removed. */
    expect(tablesHash('eq_weapon', { anchor: 'dagger', filter: { tier: ['1'] } })).toBe(
      '#/tables/eq_weapon/f_tier-1'
    );
  });

  it('writes a bare table when the filter is empty', () => {
    expect(tablesHash('eq_weapon', { filter: {} })).toBe('#/tables/eq_weapon');
    expect(tablesHash('eq_weapon')).toBe('#/tables/eq_weapon');
  });
});

describe('a link to hand somebody else', () => {
  const host = { base: 'https://e.test/' };

  it('writes the path form from the app root', () => {
    expect(appUrl(host, '#/lists', 'ru')).toBe('https://e.test/lists');
    expect(appUrl({ base: 'https://e.test' }, '#/lists', 'ru')).toBe('https://e.test/lists');
  });

  it('sends a record to its card path, extensionless', () => {
    /* The host answers it with the record's Open Graph tags, which is what makes a
       pasted link unfurl in Telegram or Discord with the picture and the name. */
    expect(recordUrl(host, 'w1', 'ru')).toBe('https://e.test/i/w1');
  });

  it('sends an English record to its English card path', () => {
    expect(recordUrl(host, 'w1', 'en')).toBe('https://e.test/i/en/w1');
  });

  it('puts /en/ before an English address and adds v when given', () => {
    expect(appUrl(host, '#/lists', 'en')).toBe('https://e.test/en/lists');
    expect(appUrl(host, '#/p/AbCdEf123456', 'ru', 'k3')).toBe(
      'https://e.test/p/AbCdEf123456?v=k3'
    );
  });

  it('lands on an address the app can read back', () => {
    const r = parseHash('#' + new URL(appUrl(host, recordHash('w1'), 'ru')).pathname);
    expect(r).toEqual({ kind: 'record', id: 'w1' });
  });
});

interface RecordFixture {
  site: string;
  build: { id: string; lang: 'ru' | 'en'; v?: string; url: string; why: string }[];
}

const RECORD = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'urls', 'record.json'),
    'utf8'
  )
) as RecordFixture;

describe('a record link, docs/fixtures/urls/record.json', () => {
  for (const c of RECORD.build) {
    it(`${c.id} (${c.lang}, ${c.v ? 'with' : 'without'} a version) - ${c.why}`, () => {
      expect(recordUrl({ base: RECORD.site }, c.id, c.lang, c.v)).toBe(c.url);
    });
  }
});

describe('cardVersion', () => {
  it('is the same for the same card and another for a changed one, in base 36', () => {
    const a = cardVersion(['Лавка', 'для игроков', 12]);
    expect(a).toMatch(/^[0-9a-z]{1,8}$/);
    expect(cardVersion(['Лавка', 'для игроков', 12])).toBe(a);
    expect(cardVersion(['Лавка', 'для игроков', 11])).not.toBe(a);
    expect(cardVersion({ b: 1, a: 2 })).toBe(cardVersion({ a: 2, b: 1 }));
  });
});

describe('keepsTicks', () => {
  const at = (h: string) => parseHash(h);

  it('keeps the ticks between two «Мои предметы» tabs', () => {
    expect(keepsTicks(at('#/homebrew'), at('#/homebrew/sources'))).toBe(true);
    expect(keepsTicks(at('#/homebrew'), at('#/homebrew/f_kind-item'))).toBe(true);
    expect(keepsTicks(at('#/homebrew/f_kind-item'), at('#/homebrew/sets'))).toBe(true);
  });

  it('keeps the ticks between two #/tables/homebrew addresses', () => {
    const bare = at('#/tables/homebrew');
    const chip = at('#/tables/homebrew/f_src-hb');
    const anchor = at('#/tables/homebrew/hb_sectbladesaaaaaa');
    expect(keepsTicks(bare, chip)).toBe(true);
    expect(keepsTicks(chip, anchor)).toBe(true);
    expect(keepsTicks(anchor, bare)).toBe(true);
  });

  it('clears the ticks from the homebrew table to another table and from a tab to the table', () => {
    expect(keepsTicks(at('#/tables/homebrew'), at('#/tables/core_item'))).toBe(false);
    expect(keepsTicks(at('#/tables/core_item'), at('#/tables/homebrew'))).toBe(false);
    expect(keepsTicks(at('#/homebrew'), at('#/tables/homebrew'))).toBe(false);
    expect(keepsTicks(at('#/tables/core_item'), at('#/tables/core_item/f_kind-item'))).toBe(
      false
    );
  });
});
