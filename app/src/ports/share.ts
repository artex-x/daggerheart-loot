/* The system share sheet, where there is one.
 *
 * Three levels of support, and the app has to behave on all of them: a sheet
 * that takes files, a sheet that takes only text and a link, and no sheet at
 * all. A dismissal is reported separately from a failure, because the person
 * dismissing their own share must not be shown an error about it. */

import type { SharePort, ShareResult, Shareable } from './types.js';

interface ShareNav {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
}

const dismissed = (err: unknown): boolean => err instanceof Error && err.name === 'AbortError';

export function browserShare(nav: ShareNav = navigator): SharePort {
  const plain = async (what: Shareable): Promise<ShareResult> => {
    try {
      await nav.share?.({ title: what.title, text: what.text, url: what.url });
      return 'shared';
    } catch (err) {
      return dismissed(err) ? 'dismissed' : 'failed';
    }
  };

  return {
    available: () => typeof nav.share === 'function',

    async share(what) {
      if (!nav.share) return 'unsupported';
      /* Without canShare there is no way to ask whether files are allowed, and
         guessing wrong throws - so text and a link it is. */
      if (!nav.canShare || !what.file) return await plain(what);
      try {
        const file = await what.file();
        if (nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], text: what.text });
          return 'shared';
        }
        return await plain(what);
      } catch (err) {
        /* The picture failed, not the intent: send the text rather than
           nothing. A share the person themselves dismissed must not bounce
           back at them as an error. */
        if (dismissed(err)) return 'dismissed';
        return await plain(what);
      }
    }
  };
}

export function fakeShare(opts: { available?: boolean; result?: ShareResult } = {}): SharePort {
  const available = opts.available ?? true;
  return {
    available: () => available,
    share: () => Promise.resolve(available ? (opts.result ?? 'shared') : 'unsupported')
  };
}
