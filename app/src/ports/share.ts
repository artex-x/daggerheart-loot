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

interface FakeShareLast {
  title?: string;
  text?: string;
  url?: string;
  hasFile: boolean;
  /** The file callback itself, for a test that wants to invoke it and read
   *  back what it produces - `hasFile` alone only proves one was offered. */
  file: (() => Promise<File>) | undefined;
}

interface FakeShare extends SharePort {
  /** What the last `share()` call was asked to send, for a test to read back -
   *  D22: whether a caller ever attaches a file is only visible here, since
   *  a real `SharePort` decides on its own whether to call `Shareable.file`. */
  readonly last: FakeShareLast;
}

export function fakeShare(opts: { available?: boolean; result?: ShareResult } = {}): FakeShare {
  const available = opts.available ?? true;
  const last: FakeShareLast = { hasFile: false, file: undefined };
  return {
    available: () => available,
    last,
    share: (what) => {
      last.title = what.title;
      last.text = what.text;
      last.url = what.url;
      last.hasFile = !!what.file;
      last.file = what.file;
      return Promise.resolve(available ? (opts.result ?? 'shared') : 'unsupported');
    }
  };
}
