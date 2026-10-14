/* The square crop of an own picture and its encoder ladder. Only `CropDialog.svelte`
 * imports this module, so it loads in the dialog's lazy chunk (docs/specs/FEATURES.md,
 * "Homebrew"). Pure: the encoder arrives as a parameter. */

import {
  ART_BYTES_MAX,
  ART_FULL,
  ART_QUALITIES,
  ART_THUMB,
  ART_THUMB_QUALITY,
  type ArtEncoder,
  type ArtRect,
  type PictureSource
} from './art.js';

/** The largest zoom: the square's side is the short side over this. */
export const ZOOM_MAX = 4;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Returns the square a `w` x `h` picture shows at `zoom` around the centre `(cx, cy)`:
 *  its side is the short side over the zoom, and the square stays inside the picture. */
export function cropRect(w: number, h: number, zoom: number, cx: number, cy: number): ArtRect {
  const side = Math.min(w, h) / clamp(zoom, 1, ZOOM_MAX);
  return {
    x: clamp(cx - side / 2, 0, w - side),
    y: clamp(cy - side / 2, 0, h - side),
    side
  };
}

export type Fitted = { ok: true; full: Blob; thumb: Blob; ext: 'webp' | 'jpg' } | { ok: false };

/** Returns the 640 px file at the first quality that fits the bucket's limit, and the
 *  160 px file of the same square: WebP where the browser encodes it, else JPEG. No
 *  quality that fits, or any refused render, is `{ ok: false }`. */
export async function fitArt(
  media: ArtEncoder,
  image: PictureSource,
  rect: ArtRect
): Promise<Fitted> {
  try {
    const webp = await media.webp();
    const type = webp ? 'image/webp' : 'image/jpeg';
    for (const q of ART_QUALITIES) {
      const full = await media.render(image, rect, ART_FULL, type, q);
      if (full.size > ART_BYTES_MAX) continue;
      const thumb = await media.render(image, rect, ART_THUMB, type, ART_THUMB_QUALITY);
      return { ok: true, full, thumb, ext: webp ? 'webp' : 'jpg' };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
