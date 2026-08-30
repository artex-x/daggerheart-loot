/* The same format and the same fixtures as tests/contracts.js, replayed here by
   the module that has already been ported. While the old app and the new one
   live side by side, both have to agree with the files in docs/fixtures. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  decodeList,
  encodeList,
  encodeListRaw,
  stamp,
  toBase64Url,
  type ListShape
} from './listLink.js';

interface Fixture {
  id: string;
  why: string;
  list: ListShape & { id: string };
  player: { raw: string; payload: string };
  gm: { raw: string; payload: string };
}

const DIR = join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'lists');
const FIXTURES: Fixture[] = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')) as Fixture);

/* The decoder asks whether an id exists. The fixtures use real ones, so knowing
   just the ids the fixtures mention is enough here. */
const KNOWN = new Set(FIXTURES.flatMap((f) => f.list.ids));
const knows = (id: string): boolean => KNOWN.has(id);

describe('golden fixtures', () => {
  it('there are at least six', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(6);
  });

  for (const fx of FIXTURES) {
    describe(fx.id, () => {
      it('the player link matches the fixture', () => {
        expect(encodeListRaw(fx.list, true)).toBe(fx.player.raw);
        expect(encodeList(fx.list, true)).toBe(fx.player.payload);
      });

      it('the GM link matches the fixture', () => {
        expect(encodeListRaw(fx.list, false)).toBe(fx.gm.raw);
        expect(encodeList(fx.list, false)).toBe(fx.gm.payload);
      });

      it('reads back', () => {
        const back = decodeList(fx.gm.payload, knows);
        expect(back).not.toBeNull();
        expect(back!.name).toBe(fx.list.name);
        expect(back!.ids).toEqual(fx.list.ids);
        expect(back!.note).toBe(fx.list.note);
        expect(back!.hnote).toBe(fx.list.hnote);
      });

      it('the player link carries no GM notes', () => {
        const back = decodeList(fx.player.payload, knows);
        expect(back).not.toBeNull();
        expect(back!.hnote).toBeUndefined();
        for (const id of back!.ids) expect(back!.meta?.[id]?.hnote).toBeUndefined();
      });
    });
  }
});

describe('the checksum on the items line', () => {
  it('catches a truncated link', () => {
    const fx = FIXTURES.find((f) => f.list.ids.length > 1)!;
    const cut = fx.gm.raw.slice(0, fx.gm.raw.lastIndexOf(','));
    expect(decodeList(toBase64Url(cut), knows)).toBeNull();
  });

  it('catches a swapped entry', () => {
    const fx = FIXTURES.find((f) => f.list.ids.includes('ci1'))!;
    expect(decodeList(toBase64Url(fx.gm.raw.replace('ci1', 'cc1')), knows)).toBeNull();
  });

  it('is computed over the items, and order matters', () => {
    expect(stamp(['ci1'])).toBe(stamp(['ci1']));
    expect(stamp(['ci1', 'cc1'])).not.toBe(stamp(['cc1', 'ci1']));
  });
});

describe('links written earlier', () => {
  it('without a checksum are read as they are', () => {
    const back = decodeList(toBase64Url('Old\nci1,cc1'), knows);
    expect(back?.ids).toEqual(['ci1', 'cc1']);
  });

  it('an unmarked note counts as the GM note', () => {
    const back = decodeList(toBase64Url('Old\nci1\nunmarked'), knows);
    expect(back?.hnote).toBe('unmarked');
    expect(back?.note).toBeUndefined();
  });
});

describe('unknown ids', () => {
  it('are dropped rather than breaking the list', () => {
    /* The checksum covers what the link says, so it has to be rebuilt - or the
       truncation guard fires instead of the branch under test. */
    const parts = ['ci1', 'zzz999'];
    const raw = `Mixed\n${stamp(parts)}${parts.join(',')}`;
    expect(decodeList(toBase64Url(raw), knows)?.ids).toEqual(['ci1']);
  });

  it('a list of only unknown ids does not open', () => {
    const parts = ['zzz999'];
    const raw = `Empty\n${stamp(parts)}${parts.join(',')}`;
    expect(decodeList(toBase64Url(raw), knows)).toBeNull();
  });
});

describe('garbage', () => {
  it('does not crash the decoder', () => {
    for (const bad of ['', '!!!', 'a', '0J', '~~~~']) {
      expect(() => decodeList(bad, knows)).not.toThrow();
    }
  });
});
