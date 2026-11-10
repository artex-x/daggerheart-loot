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

/** Returns the text with the link as its last line, once. */
const withLink = (text: string, url: string | undefined): string =>
  url === undefined || text.endsWith(url) ? text : text + '\n' + url;

/**
 * Returns true on a desktop: a fine pointer and no coarse pointer, or a Windows
 * platform. A Windows share sheet hands a shared file to the chosen app and many
 * apps (Mail, Teams, Nearby sharing) show the file and drop the text, so a desktop
 * shares the text and the link without the picture (docs/specs/FEATURES.md,
 * "Records"). Read at each press, not at start-up.
 */
export function desktopNow(): boolean {
  try {
    const fine =
      matchMedia('(pointer: fine)').matches && !matchMedia('(any-pointer: coarse)').matches;
    const platform = (navigator as { userAgentData?: { platform?: string } }).userAgentData
      ?.platform;
    return fine || platform === 'Windows';
  } catch {
    return false;
  }
}

export function browserShare(
  nav: ShareNav = navigator,
  desktop: () => boolean = desktopNow
): SharePort {
  /* The link is the last line of `text` and `url` carries it too, for a target
     that reads only one of the two. */
  const plain = async (what: Shareable): Promise<ShareResult> => {
    try {
      await nav.share?.({
        title: what.title,
        text: withLink(what.text, what.url),
        ...(what.url === undefined ? {} : { url: what.url })
      });
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
      if (!nav.canShare || !what.file || desktop()) return await plain(what);
      try {
        const file = await what.file();
        if (nav.canShare({ files: [file] })) {
          /* With a file the link is in `text` only: a target that shows both would
             print it twice. */
          await nav.share({
            files: [file],
            title: what.title,
            text: withLink(what.text, what.url)
          });
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
  url?: string | undefined;
  hasFile: boolean;
  /** The file callback itself, for a test that wants to invoke it and read
   *  back what it produces - `hasFile` alone only proves one was offered. */
  file: (() => Promise<File>) | undefined;
  /** What the real port hands the browser for this call. */
  sent: ShareData | undefined;
}

interface FakeShare extends SharePort {
  /** What the last `share()` call was asked to send, for a test to read back -
   *  D22: whether a caller ever attaches a file is only visible here, since
   *  a real `SharePort` decides on its own whether to call `Shareable.file`. */
  readonly last: FakeShareLast;
}

/**
 * A share port for tests. `desktop` and `canShareFiles` pick the environment the
 * real port would see; `last.sent` is the data it would hand the browser, or
 * undefined when it hands none.
 */
export function fakeShare(
  opts: {
    available?: boolean;
    result?: ShareResult;
    desktop?: boolean;
    canShareFiles?: boolean;
  } = {}
): FakeShare {
  const available = opts.available ?? true;
  const last: FakeShareLast = { hasFile: false, file: undefined, sent: undefined };
  const nav: ShareNav = {
    share: (data) => {
      last.sent = data;
      return Promise.resolve();
    },
    canShare: () => opts.canShareFiles ?? true
  };
  const real = browserShare(nav, () => opts.desktop ?? false);
  return {
    available: () => available,
    last,
    share: async (what) => {
      last.title = what.title;
      last.text = what.text;
      last.url = what.url;
      last.hasFile = !!what.file;
      last.file = what.file;
      last.sent = undefined;
      if (available) await real.share(what);
      return available ? (opts.result ?? 'shared') : 'unsupported';
    }
  };
}
