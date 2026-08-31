/* Turning a picture into something the clipboard will take.
 *
 * The art ships as WebP, and no browser will put WebP on the clipboard, so it
 * has to be redrawn as a PNG. That means an <img>, a <canvas> and `toBlob` -
 * three browser capabilities with no equivalent in jsdom, which is exactly what
 * a port is for: the component asks for a PNG and does not care how, and a test
 * hands it one without a canvas existing.
 *
 * The conversion below is therefore the one piece here that a unit test cannot
 * reach. It is covered by the browser suites, which run in a real Chrome - see
 * docs/specs/COVERAGE.md, "Known thin spots". */

import type { ImagePort } from './types.js';

export function browserImage(): ImagePort {
  return {
    pngOf: (src) =>
      new Promise<Blob>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('no 2d context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error('canvas produced nothing'));
          }, 'image/png');
        };
        img.onerror = () => {
          reject(new Error('the picture did not load'));
        };
        img.src = src;
      })
  };
}

/** Records what was asked for, and hands back something Blob-shaped. */
export function fakeImage(): ImagePort & { readonly asked: string[] } {
  const asked: string[] = [];
  return {
    asked,
    pngOf: (src) => {
      asked.push(src);
      return Promise.resolve(new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])]));
    }
  };
}

/** A browser that refuses, so the caller's own failure path can be checked. */
export function brokenImage(): ImagePort {
  return {
    pngOf: () => Promise.reject(new Error('the picture did not load'))
  };
}
