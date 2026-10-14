/* The picture field's browser work: decoding a chosen file, drawing a square of it into a
 * canvas, encoding that, and the object addresses of the previews. jsdom has no
 * `createImageBitmap`, no canvas and no `toBlob`, hence a port; `tests/app/states.js`
 * drives `browserMedia` in Chrome (docs/specs/COVERAGE.md, "Known thin spots"). */

import type { ArtRect, ArtType, PictureSource } from '../lib/art.js';
import type { MediaPort } from './types.js';

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error('the canvas produced nothing'));
      },
      type,
      quality
    );
  });
}

export function browserMedia(): MediaPort {
  let webp: Promise<boolean> | null = null;
  return {
    async decode(file) {
      try {
        const image = await createImageBitmap(file, { imageOrientation: 'from-image' });
        return { ok: true, image };
      } catch {
        return { ok: false, error: 'bad' };
      }
    },
    async render(image: PictureSource, rect: ArtRect, side: number, type: ArtType, quality) {
      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      /* JPEG has no transparency: a transparent pixel would turn black. */
      if (type === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, side, side);
      }
      ctx.drawImage(image, rect.x, rect.y, rect.side, rect.side, 0, 0, side, side);
      const blob = await canvasBlob(canvas, type, quality);
      /* Safari answers a PNG when asked for WebP (MDN, `toBlob()`). */
      if (blob.type !== type) throw new Error('the browser encoded ' + blob.type);
      return blob;
    },
    webp() {
      webp ??= (async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        try {
          return (await canvasBlob(canvas, 'image/webp', 0.8)).type === 'image/webp';
        } catch {
          return false;
        }
      })();
      return webp;
    },
    preview: (blob) => URL.createObjectURL(blob),
    release(url) {
      URL.revokeObjectURL(url);
    }
  };
}

/** A test's picture file: a blob whose text names the sides the fake decodes. */
export function fakePicture(width: number, height: number, type = 'image/png'): Blob {
  return new Blob([JSON.stringify({ width, height })], { type });
}

export interface FakeMediaOptions {
  /** Whether the browser encodes WebP (default true). */
  webp?: boolean;
  /** The byte size of a render: of the 640 px file per quality, and of the 160 px file. */
  size?: (side: number, quality: number) => number;
  /** A render rejects, as a canvas that produced nothing. */
  failRender?: boolean;
  /** `decode` waits for this before it answers. */
  hold?: Promise<void>;
}

export type FakeMedia = MediaPort & {
  readonly renders: { rect: ArtRect; side: number; type: ArtType; quality: number }[];
  readonly released: string[];
  /** How many decoded pictures were closed. */
  closed(): number;
};

/** Decodes a `fakePicture` (any other blob is `bad`) and renders blobs of the asked type. */
export function fakeMedia(opts: FakeMediaOptions = {}): FakeMedia {
  const renders: FakeMedia['renders'] = [];
  const released: string[] = [];
  let closed = 0;
  let made = 0;
  return {
    renders,
    released,
    closed: () => closed,
    async decode(file) {
      if (opts.hold) await opts.hold;
      try {
        const v = JSON.parse(await file.text()) as { width?: unknown; height?: unknown };
        if (typeof v.width !== 'number' || typeof v.height !== 'number') throw new Error();
        return {
          ok: true,
          image: {
            width: v.width,
            height: v.height,
            close() {
              closed++;
            }
          }
        };
      } catch {
        return { ok: false, error: 'bad' };
      }
    },
    render(_image, rect, side, type, quality) {
      renders.push({ rect: { ...rect }, side, type, quality });
      if (opts.failRender) return Promise.reject(new Error('the canvas produced nothing'));
      const n = opts.size?.(side, quality) ?? 1000;
      return Promise.resolve(new Blob([new Uint8Array(n)], { type }));
    },
    webp: () => Promise.resolve(opts.webp ?? true),
    preview: () => `blob:fake-${String(++made)}`,
    release(url) {
      released.push(url);
    }
  };
}
