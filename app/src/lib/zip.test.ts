/* The account's data zip: the writer against the pinned `data.zip`, and every rule of the
   reader's contract (docs/specs/CONTRACTS.md section 4, "The account's data zip"). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { crc32, ZIP_ENTRIES_MAX, readDataZip, readZip, zipStored } from './zip.js';

const FIX = join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'import');
const DATA_ZIP = new Uint8Array(readFileSync(join(FIX, 'data.zip')));
const EXPORT = readFileSync(join(FIX, 'export.json'), 'utf8');
const AT = new Date('2026-09-25T12:00:00.000Z');
const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);
const zip = (files: Record<string, string | Uint8Array>): Uint8Array =>
  zipStored(
    Object.entries(files).map(([name, v]) => ({
      name,
      bytes: typeof v === 'string' ? utf8(v) : v
    })),
    AT
  );

/* The offsets of each header, found by their signatures: the test files hold plain text,
   so a signature cannot appear inside their data. */
function headers(z: Uint8Array): { locals: number[]; centrals: number[]; end: number } {
  const v = new DataView(z.buffer, z.byteOffset, z.byteLength);
  const locals: number[] = [];
  const centrals: number[] = [];
  let end = -1;
  for (let i = 0; i + 4 <= z.length; i++) {
    const s = v.getUint32(i, true);
    if (s === 0x04034b50) locals.push(i);
    if (s === 0x02014b50) centrals.push(i);
    if (s === 0x06054b50) end = i;
  }
  return { locals, centrals, end };
}

/** Returns a copy of `z` changed by `fn`, which gets a view and the header offsets. */
function patched(
  z: Uint8Array,
  fn: (v: DataView, h: ReturnType<typeof headers>, bytes: Uint8Array) => void
): Uint8Array {
  const copy = z.slice();
  fn(new DataView(copy.buffer), headers(copy), copy);
  return copy;
}

/* A small seeded generator, so a failure names a buffer that can be made again. */
function random(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s;
  };
}

describe('crc32', () => {
  it('answers the check value of the IEEE polynomial', () => {
    expect(crc32(utf8('123456789'))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });
});

describe('zipStored', () => {
  it('writes data.zip byte for byte from export.json and its date', () => {
    expect(zip({ 'lists.json': EXPORT })).toEqual(DATA_ZIP);
  });

  it('stores each file with a UTF-8 name, and reads back every file', () => {
    const files = { 'lists.json': EXPORT, 'Лавка.json': '{}', 'a/b.txt': '' };
    const entries = readZip(zip(files));
    expect(
      entries?.map((e) => [e.name, e.method, new TextDecoder().decode(e.bytes ?? undefined)])
    ).toEqual(Object.entries(files).map(([name, text]) => [name, 0, text]));
  });

  it('writes the DOS time of the date in UTC, and flag bit 11', () => {
    const v = new DataView(DATA_ZIP.buffer, DATA_ZIP.byteOffset);
    expect(v.getUint16(6, true)).toBe(0x0800);
    expect(v.getUint16(10, true)).toBe(12 << 11);
    expect(v.getUint16(12, true)).toBe(((2026 - 1980) << 9) | (9 << 5) | 25);
  });
});

describe('readZip: the reader contract', () => {
  it('never throws: 200 seeded random buffers and every truncation of data.zip', () => {
    const next = random(20260925);
    for (let i = 0; i < 200; i++) {
      const buf = new Uint8Array(next() % 4097);
      for (let j = 0; j < buf.length; j++) buf[j] = next() & 0xff;
      if (i % 4 === 0 && buf.length >= 4) buf.set([0x50, 0x4b, 0x03, 0x04]);
      if (i % 8 === 0 && buf.length >= 22) buf.set([0x50, 0x4b, 0x05, 0x06], buf.length - 22);
      expect(() => readZip(buf)).not.toThrow();
    }
    for (let n = 0; n < DATA_ZIP.length; n++) {
      expect(readZip(DATA_ZIP.subarray(0, n))).toBeNull();
    }
  });

  it('refuses a file with no end record, and one whose comment does not end the file', () => {
    expect(readZip(DATA_ZIP.subarray(0, DATA_ZIP.length - 22))).toBeNull();
    expect(readZip(utf8('PK not a zip'))).toBeNull();
    const commented = patched(DATA_ZIP, (v, h) => {
      v.setUint16(h.end + 20, 5, true);
    });
    expect(readZip(commented)).toBeNull();
  });

  it('reads an end record followed by its comment', () => {
    const withComment = new Uint8Array(DATA_ZIP.length + 3);
    withComment.set(DATA_ZIP);
    withComment.set(utf8('hi!'), DATA_ZIP.length);
    new DataView(withComment.buffer).setUint16(DATA_ZIP.length - 2, 3, true);
    expect(readZip(withComment)?.map((e) => e.name)).toEqual(['lists.json']);
  });

  it.each([
    [
      'a directory that does not end at the end record',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint32(h.end + 12, v.getUint32(h.end + 12, true) - 1, true);
      }
    ],
    [
      'a directory offset past the buffer',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint32(h.end + 16, 0x7fffffff, true);
      }
    ],
    [
      'a name longer than the directory',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint16((h.centrals[0] ?? 0) + 28, 500, true);
      }
    ],
    [
      'a local header offset past the buffer',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint32((h.centrals[0] ?? 0) + 42, 0x00ffffff, true);
      }
    ],
    [
      'a local header offset at no local header',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint32((h.centrals[0] ?? 0) + 42, 4, true);
      }
    ],
    [
      'data past the end of the buffer',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint32((h.centrals[0] ?? 0) + 20, 0x00ffffff, true);
        v.setUint32((h.centrals[0] ?? 0) + 24, 0x00ffffff, true);
      }
    ],
    [
      'a directory entry with no signature',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint32(h.centrals[0] ?? 0, 0, true);
      }
    ]
  ])('refuses %s (bounds)', (_what, fn) => {
    expect(readZip(patched(DATA_ZIP, fn))).toBeNull();
  });

  it('refuses a local name that is not the central one, and a stored entry whose sizes differ', () => {
    const renamed = patched(DATA_ZIP, (_v, h, b) => {
      b[(h.locals[0] ?? 0) + 30] = 0x4c;
    });
    expect(readZip(renamed)).toBeNull();
    const sizes = patched(zip({ 'a.txt': 'abc' }), (v, h) => {
      v.setUint32((h.centrals[0] ?? 0) + 24, 4, true);
    });
    expect(readZip(sizes)).toBeNull();
  });

  it('takes the sizes and the CRC from the directory, and accepts flag bit 3', () => {
    const described = patched(zip({ 'a.txt': 'abc' }), (v, h) => {
      const local = h.locals[0] ?? 0;
      v.setUint16(local + 6, 0x0808, true);
      v.setUint32(local + 14, 0, true);
      v.setUint32(local + 18, 0, true);
      v.setUint32(local + 22, 0, true);
      v.setUint16((h.centrals[0] ?? 0) + 8, 0x0808, true);
    });
    expect(readZip(described)?.map((e) => e.name)).toEqual(['a.txt']);
  });

  it('refuses an encrypted entry', () => {
    const encrypted = patched(DATA_ZIP, (v, h) => {
      v.setUint16((h.centrals[0] ?? 0) + 8, 0x0801, true);
    });
    expect(readZip(encrypted)).toBeNull();
  });

  it.each([
    [
      'a zip64 count',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint16(h.end + 8, 0xffff, true);
        v.setUint16(h.end + 10, 0xffff, true);
      }
    ],
    [
      'a zip64 directory size',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint32(h.end + 12, 0xffffffff, true);
      }
    ],
    [
      'a zip64 directory offset',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint32(h.end + 16, 0xffffffff, true);
      }
    ],
    [
      'a zip64 entry size',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint32((h.centrals[0] ?? 0) + 20, 0xffffffff, true);
      }
    ],
    [
      'a zip64 entry offset',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint32((h.centrals[0] ?? 0) + 42, 0xffffffff, true);
      }
    ],
    [
      'a second disk',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint16(h.end + 4, 1, true);
      }
    ],
    [
      'a directory on a second disk',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint16(h.end + 6, 1, true);
      }
    ],
    [
      'an entry starting on a second disk',
      (v: DataView, h: ReturnType<typeof headers>) => {
        v.setUint16((h.centrals[0] ?? 0) + 34, 1, true);
      }
    ]
  ])('refuses %s', (_what, fn) => {
    expect(readZip(patched(DATA_ZIP, fn))).toBeNull();
  });

  it('refuses a zip64 end locator before the end record', () => {
    const z = zip({ 'a.txt': 'x'.repeat(40) });
    const located = patched(z, (v, h) => {
      v.setUint32(h.end - 20, 0x07064b50, true);
    });
    expect(readZip(z)).not.toBeNull();
    expect(readZip(located)).toBeNull();
  });

  it(`takes ${String(ZIP_ENTRIES_MAX)} entries and refuses one more`, () => {
    const files = (n: number): Record<string, string> =>
      Object.fromEntries(Array.from({ length: n }, (_, i) => ['f' + String(i), '']));
    expect(readZip(zip(files(ZIP_ENTRIES_MAX)))).toHaveLength(ZIP_ENTRIES_MAX);
    expect(readZip(zip(files(ZIP_ENTRIES_MAX + 1)))).toBeNull();
  });

  it('refuses counts that do not agree with the directory', () => {
    const two = zip({ 'a.txt': 'a', 'b.txt': 'b' });
    const disk = patched(two, (v, h) => {
      v.setUint16(h.end + 8, 1, true);
    });
    expect(readZip(disk)).toBeNull();
    const more = patched(two, (v, h) => {
      v.setUint16(h.end + 8, 3, true);
      v.setUint16(h.end + 10, 3, true);
    });
    expect(readZip(more)).toBeNull();
    const fewer = patched(two, (v, h) => {
      v.setUint16(h.end + 8, 1, true);
      v.setUint16(h.end + 10, 1, true);
    });
    expect(readZip(fewer)).toBeNull();
  });

  it('refuses a stored entry whose CRC does not match', () => {
    const changed = patched(DATA_ZIP, (_v, h, b) => {
      const at = (h.locals[0] ?? 0) + 30 + 'lists.json'.length + 5;
      b[at] = (b[at] ?? 0) ^ 1;
    });
    expect(readZip(changed)).toBeNull();
  });

  it('decodes a name without flag bit 11 as ASCII, a replacement character beyond it', () => {
    const cp437 = patched(zip({ 'ab.txt': '' }), (v, h, b) => {
      for (const at of [(h.locals[0] ?? 0) + 30, (h.centrals[0] ?? 0) + 46]) b[at] = 0x8e;
      v.setUint16((h.locals[0] ?? 0) + 6, 0, true);
      v.setUint16((h.centrals[0] ?? 0) + 8, 0, true);
    });
    expect(readZip(cp437)?.map((e) => e.name)).toEqual(['�b.txt']);
  });

  it('answers null bytes for an entry that is not stored', () => {
    const deflated = patched(zip({ 'a.txt': 'abc' }), (v, h) => {
      v.setUint16((h.locals[0] ?? 0) + 8, 8, true);
      v.setUint16((h.centrals[0] ?? 0) + 10, 8, true);
      v.setUint32((h.centrals[0] ?? 0) + 16, 0, true);
    });
    expect(readZip(deflated)).toEqual([{ name: 'a.txt', method: 8, bytes: null }]);
  });
});

describe('readDataZip', () => {
  const deflate = (z: Uint8Array, entry: number): Uint8Array =>
    patched(z, (v, h) => {
      v.setUint16((h.locals[entry] ?? 0) + 8, 8, true);
      v.setUint16((h.centrals[entry] ?? 0) + 10, 8, true);
    });

  it('reads data.zip as its lists.json, with nothing else in it', () => {
    expect(readDataZip(DATA_ZIP)).toEqual({ ok: true, lists: EXPORT, other: [], more: 0 });
  });

  it('refuses a file that is not a zip', () => {
    expect(readDataZip(utf8(EXPORT))).toEqual({ ok: false, reason: 'notZip' });
  });

  it('refuses a zip with no lists.json', () => {
    expect(readDataZip(zip({ 'homebrew.json': '{}' }))).toEqual({
      ok: false,
      reason: 'noLists'
    });
  });

  it('takes lists.json at the root over one in a folder, and names the other', () => {
    expect(readDataZip(zip({ 'old/lists.json': '1', 'lists.json': '2' }))).toEqual({
      ok: true,
      lists: '2',
      other: ['lists.json'],
      more: 0
    });
  });

  it('takes the shallowest folder/lists.json of a re-zipped folder when it is stored', () => {
    expect(
      readDataZip(zip({ 'data/lists.json': EXPORT, 'data/x/lists.json': '' }))
    ).toMatchObject({
      ok: true,
      lists: EXPORT
    });
  });

  it('answers packed for a deflated lists.json, in a folder too', () => {
    expect(readDataZip(deflate(zip({ 'lists.json': EXPORT }), 0))).toEqual({
      ok: false,
      reason: 'packed'
    });
    expect(readDataZip(deflate(zip({ 'data/lists.json': EXPORT }), 0))).toEqual({
      ok: false,
      reason: 'packed'
    });
  });

  it('never guesses between two lists.json at one depth', () => {
    expect(readDataZip(zip({ 'a/lists.json': '1', 'b/lists.json': '2' }))).toEqual({
      ok: false,
      reason: 'manyLists'
    });
    expect(readDataZip(zip({ 'lists.json': '1', 'lists.json ': '2' }))).toMatchObject({
      ok: true,
      lists: '1'
    });
  });

  it('ignores the files an archiver adds, and folder entries', () => {
    const z = zip({
      '__MACOSX/lists.json': '0',
      '__MACOSX/._lists.json': '0',
      'data/': '',
      'data/._lists.json': '0',
      'data/.DS_Store': '',
      'Thumbs.db': '',
      'data/lists.json': '1',
      'data/homebrew.json': '{}'
    });
    expect(readDataZip(z)).toEqual({ ok: true, lists: '1', other: ['homebrew.json'], more: 0 });
  });

  it('names the first five other files and counts the rest', () => {
    const others = Object.fromEntries(
      Array.from({ length: 8 }, (_, i) => ['f' + String(i) + '.json', ''])
    );
    expect(readDataZip(zip({ 'lists.json': '[]', ...others }))).toEqual({
      ok: true,
      lists: '[]',
      other: ['f0.json', 'f1.json', 'f2.json', 'f3.json', 'f4.json'],
      more: 3
    });
  });

  it('drops a byte order mark, and refuses bytes that are not UTF-8', () => {
    const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...utf8('{"a":1}')]);
    expect(readDataZip(zip({ 'lists.json': bom }))).toMatchObject({
      ok: true,
      lists: '{"a":1}'
    });
    expect(readDataZip(zip({ 'lists.json': new Uint8Array([0x7b, 0xff]) }))).toEqual({
      ok: false,
      reason: 'notText'
    });
  });
});
