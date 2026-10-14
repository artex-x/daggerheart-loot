/* The weekly picture copy (backup-art.mjs) over a stubbed listing and fetch:
   the names it copies, a file deleted after the list, a failing answer, the
   download limit, and the per-run figures of the 1x and storage-limit buckets
   (.claude/README.md, "Backups and restore"). */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ART_CONCURRENCY, artNames, copyArt, publicUrl } from './backup-art.mjs';

const hex = (n) => n.toString(16).padStart(32, '0');
/* A bucket of `pictures` pictures: a 640 px file and its 160 px file each. */
const bucket = (pictures) =>
  Array.from({ length: pictures }, (_, i) => [`p/${hex(i)}.webp`, `t/${hex(i)}.webp`]).flat();
const FULL = new ArrayBuffer(204800);
const THUMB = new ArrayBuffer(8192);
/* A Response stub after a tick; the bodies share two buffers, so 10 000 files hold no
   memory. */
const answer = (status, body) =>
  new Promise((resolve) =>
    setTimeout(() => resolve({ status, arrayBuffer: () => Promise.resolve(body) }), 1)
  );
const sized = (name) => answer(200, name.startsWith('p/') ? FULL : THUMB);

describe('artNames', () => {
  it('copies only the files of own pictures, sorted', () => {
    const rows = [
      { name: `t/${hex(2)}.jpg` },
      { name: '.emptyFolderPlaceholder' },
      { name: `p/${hex(2)}.jpg` },
      { name: 'p/x.webp' },
      { name: `p/${hex(1)}.webp` }
    ];
    assert.deepEqual(artNames(rows), [
      `p/${hex(1)}.webp`,
      `p/${hex(2)}.jpg`,
      `t/${hex(2)}.jpg`
    ]);
  });

  it("reads the public address of the project's file", () => {
    assert.equal(
      publicUrl('zzmrftmzefcqehhyztjq', `p/${hex(1)}.webp`),
      `https://zzmrftmzefcqehhyztjq.supabase.co/storage/v1/object/public/homebrew-art/p/${hex(1)}.webp`
    );
  });
});

describe('copyArt', () => {
  it('writes each file, skips one deleted after the list and keeps 8 downloads in flight', async () => {
    const written = [];
    const names = bucket(20);
    const out = await copyArt(names, {
      fetchFile: (name) => (name === names[3] ? answer(404, null) : sized(name)),
      write: (name) => written.push(name)
    });
    assert.equal(out.gone, 1);
    assert.equal(out.files, 39);
    assert.equal(out.requests, 40);
    assert.equal(out.peak, ART_CONCURRENCY);
    assert.deepEqual(written.sort(), names.filter((n) => n !== names[3]).sort());
  });

  it('fails on an answer other than 200, 400 or 404', async () => {
    await assert.rejects(
      copyArt(bucket(3), {
        fetchFile: (name) => (name.startsWith('t/') ? answer(500, null) : sized(name)),
        write: () => undefined
      }),
      /answered 500/
    );
  });

  it('copies an empty bucket with no request', async () => {
    const out = await copyArt([], { fetchFile: sized, write: () => undefined });
    assert.deepEqual(out, { files: 0, bytes: 0, gone: 0, requests: 0, peak: 0 });
  });

  it('prints the per-run figures of one account at the defaults (210 files) and of the 1 GB limit', async () => {
    for (const [pictures, bytes] of [
      [105, 105 * (204800 + 8192)],
      [5000, 5000 * (204800 + 8192)]
    ]) {
      const out = await copyArt(bucket(pictures), { fetchFile: sized, write: () => undefined });
      assert.equal(out.requests, pictures * 2);
      assert.equal(out.bytes, bytes);
      assert.ok(out.peak <= ART_CONCURRENCY);
    }
  });
});
