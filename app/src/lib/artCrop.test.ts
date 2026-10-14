import { describe, expect, it } from 'vitest';
import type { ArtEncoder, ArtRect, ArtType, PictureSource } from './art.js';
import { cropRect, fitArt, ZOOM_MAX } from './artCrop.js';

describe('the crop square', () => {
  const cases: [string, number, number][] = [
    ['landscape', 1200, 800],
    ['portrait', 600, 900],
    ['square', 640, 640]
  ];

  for (const [name, w, h] of cases) {
    it(`keeps a ${name} square inside the picture at every zoom, centred and at each corner`, () => {
      const short = Math.min(w, h);
      for (const zoom of [1, 2, ZOOM_MAX]) {
        const side = short / zoom;
        expect(cropRect(w, h, zoom, w / 2, h / 2)).toEqual({
          x: (w - side) / 2,
          y: (h - side) / 2,
          side
        });
        expect(cropRect(w, h, zoom, 0, 0)).toEqual({ x: 0, y: 0, side });
        expect(cropRect(w, h, zoom, w, 0)).toEqual({ x: w - side, y: 0, side });
        expect(cropRect(w, h, zoom, 0, h)).toEqual({ x: 0, y: h - side, side });
        expect(cropRect(w, h, zoom, w, h)).toEqual({ x: w - side, y: h - side, side });
      }
    });
  }

  it('holds the zoom between 1 and the largest', () => {
    expect(cropRect(800, 400, 0.5, 400, 200).side).toBe(400);
    expect(cropRect(800, 400, 9, 400, 200).side).toBe(100);
  });
});

function encoder(opts: {
  webp?: boolean;
  size: (side: number, q: number) => number;
  fail?: boolean;
}) {
  const calls: { rect: ArtRect; side: number; type: ArtType; quality: number }[] = [];
  const media: ArtEncoder = {
    render(_image, rect, side, type, quality) {
      calls.push({ rect, side, type, quality });
      if (opts.fail) return Promise.reject(new Error('no blob'));
      return Promise.resolve(new Blob([new Uint8Array(opts.size(side, quality))], { type }));
    },
    webp: () => Promise.resolve(opts.webp ?? true)
  };
  return { media, calls };
}

const IMAGE: PictureSource = { width: 1000, height: 1000, close: () => undefined };
const RECT: ArtRect = { x: 10, y: 20, side: 500 };

describe('the encoder ladder', () => {
  it('takes the first quality that fits and renders the 160 px file from the same square', async () => {
    const { media, calls } = encoder({ size: () => 1000 });
    const r = await fitArt(media, IMAGE, RECT);
    expect(r.ok && r.ext).toBe('webp');
    expect(r.ok && r.full.type).toBe('image/webp');
    expect(calls.map((c) => [c.side, c.quality])).toEqual([
      [640, 0.85],
      [160, 0.8]
    ]);
    expect(calls.every((c) => c.rect === RECT)).toBe(true);
  });

  it('steps down to the last quality', async () => {
    const { media, calls } = encoder({
      size: (side, q) => (side === 640 && q > 0.6 ? 300000 : 200)
    });
    const r = await fitArt(media, IMAGE, RECT);
    expect(r.ok).toBe(true);
    expect(calls.map((c) => c.quality)).toEqual([0.85, 0.75, 0.65, 0.55, 0.8]);
  });

  it('takes a file of exactly the limit', async () => {
    const { media } = encoder({ size: () => 204800 });
    expect((await fitArt(media, IMAGE, RECT)).ok).toBe(true);
  });

  it('refuses when no quality fits', async () => {
    const { media, calls } = encoder({ size: () => 204801 });
    expect(await fitArt(media, IMAGE, RECT)).toEqual({ ok: false });
    expect(calls).toHaveLength(4);
  });

  it('encodes JPEG where the browser cannot encode WebP', async () => {
    const { media, calls } = encoder({ webp: false, size: () => 100 });
    const r = await fitArt(media, IMAGE, RECT);
    expect(r.ok && r.ext).toBe('jpg');
    expect(calls.every((c) => c.type === 'image/jpeg')).toBe(true);
  });

  it('refuses when a render is refused', async () => {
    const { media } = encoder({ size: () => 100, fail: true });
    expect(await fitArt(media, IMAGE, RECT)).toEqual({ ok: false });
  });
});
