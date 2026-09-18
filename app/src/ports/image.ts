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
          /* D10: a file:// document's own picture taints the canvas it was
             just drawn onto - Chrome has no --allow-file-access-from-files,
             so even a sibling file in the same folder the document opened
             from reads as cross-origin. `toDataURL` throws synchronously for
             a tainted canvas, which makes it the cheap, definitive probe;
             `toBlob` does not throw at all in every Chromium build measured
             for this - it simply never calls its callback - so the watchdog
             below is what turns that into a real rejection instead of a
             promise that never settles. */
          try {
            canvas.toDataURL('image/png');
          } catch (err) {
            reject(err instanceof Error ? err : new Error('the canvas is tainted'));
            return;
          }
          /* Measured on this host, 2026-09-18 - the largest catalogue
             art file (640x640 `img/f95.webp`, 98 KB, the same decode/encode
             path this function runs) took 1032-1074ms across five PNG
             `toBlob` encodes (a browser tab, http:// so the canvas is not
             tainted, `performance.now()` around the call). 2000ms leaves
             roughly double that as margin, which is generous enough for a
             contended machine without making a genuinely stuck encode (the
             tainted-canvas case this watchdog exists for) wait so long the
             person wonders if the button did anything - kept at 2000ms with
             the number recorded, not raised. */
          const watchdog = setTimeout(() => {
            reject(
              new Error(
                'toBlob never returned - a tainted canvas in a build that does not throw for it'
              )
            );
          }, 2000);
          canvas.toBlob((b) => {
            clearTimeout(watchdog);
            if (b) resolve(b);
            else reject(new Error('canvas produced nothing'));
          }, 'image/png');
        };
        img.onerror = () => {
          reject(new Error('the picture did not load'));
        };
        img.src = src;
      }),

    /* D14: the download fallback for a clipboard that will not take the
       picture - the live `downloadImage` (app.js 1717-1726), a hidden
       `<a download>` clicked once and discarded. The object URL is revoked
       on a delay rather than immediately after `click()`: revoking it before
       the browser has read the blob for the download would leave the saved
       file empty on a slow disk. */
    download: (blob, filename) =>
      new Promise<void>((resolve, reject) => {
        try {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 4000);
          resolve();
        } catch (err) {
          reject(err instanceof Error ? err : new Error('the download did not start'));
        }
      })
  };
}

/** Records what was asked for and downloaded, and hands back something
 *  Blob-shaped. */
export function fakeImage(opts: { failDownload?: boolean } = {}): ImagePort & {
  readonly asked: string[];
  readonly downloaded: { blob: Blob; filename: string }[];
} {
  const asked: string[] = [];
  const downloaded: { blob: Blob; filename: string }[] = [];
  return {
    asked,
    downloaded,
    pngOf: (src) => {
      asked.push(src);
      return Promise.resolve(new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])]));
    },
    download: (blob, filename) => {
      if (opts.failDownload) return Promise.reject(new Error('download failed'));
      downloaded.push({ blob, filename });
      return Promise.resolve();
    }
  };
}
