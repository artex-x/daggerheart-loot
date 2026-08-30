/* Copying, and the several ways a browser can decline.
 *
 * The async clipboard needs a secure context and a live user gesture; rich copy
 * needs `ClipboardItem` on top of that; images need a format browsers will
 * actually accept. Each falls back one step rather than failing, and the caller
 * is told whether anything landed so it can say so. */

import type { ClipboardPort, RichText } from './types.js';

/* Only the two methods this port actually calls. Asking for the whole
   `Clipboard` would force every test double to implement `read`, `readText`
   and three event-target methods it will never use. */
interface ClipboardWin {
  isSecureContext?: boolean;
  ClipboardItem?: typeof ClipboardItem;
  navigator: { clipboard?: Partial<Pick<Clipboard, 'writeText' | 'write'>> };
  document: Document;
}

interface RichWriter {
  write: (items: ClipboardItem[]) => Promise<void>;
  Item: typeof ClipboardItem;
}

/* Rich and image copy need three things at once - a secure context, `write`,
   and `ClipboardItem`. The narrowed handle is returned rather than a boolean so
   the call sites do not have to check the same three things again. */
function richWriter(w: ClipboardWin): RichWriter | null {
  const cb = w.navigator.clipboard;
  const write = cb?.write;
  const Item = w.ClipboardItem;
  if (!w.isSecureContext || !cb || !write || !Item) return null;
  return { write: write.bind(cb), Item };
}

/**
 * The pre-async fallback: a hidden textarea and `execCommand`.
 *
 * Deprecated and still the only thing that works without a secure context,
 * which includes opening the page from a folder - a supported way to run this
 * (docs/specs/META.md, section 4).
 */
function legacyCopy(doc: Document, text: string): boolean {
  const ta = doc.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  doc.body.appendChild(ta);
  ta.select();
  let ok: boolean;
  try {
    /* Deprecated, and kept on purpose: it is the only copy that works outside a
       secure context, which includes opening the page from a folder. When that
       stops being supported this whole branch goes with it. */
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    ok = doc.execCommand('copy');
  } catch {
    ok = false;
  }
  doc.body.removeChild(ta);
  return ok;
}

export function browserClipboard(win: ClipboardWin = window): ClipboardPort {
  return {
    async writeText(text) {
      const writeText = win.navigator.clipboard?.writeText;
      if (win.isSecureContext && writeText) {
        try {
          await writeText.call(win.navigator.clipboard, text);
          return true;
        } catch {
          /* Refused, or the gesture expired. Fall through. */
        }
      }
      return legacyCopy(win.document, text);
    },

    async writeRich(text: RichText) {
      const rich = richWriter(win);
      if (!rich) return await this.writeText(text.plain);
      try {
        const { Item } = rich;
        await rich.write([
          new Item({
            'text/html': new Blob([text.html], { type: 'text/html' }),
            'text/plain': new Blob([text.plain], { type: 'text/plain' })
          })
        ]);
        return true;
      } catch {
        /* An application that cannot take HTML still deserves the text */
        return await this.writeText(text.plain);
      }
    },

    async writeImage(png) {
      const rich = richWriter(win);
      if (!rich) return false;
      try {
        /* The promise is handed to ClipboardItem rather than awaited first:
           Safari drops the user gesture if anything is awaited in between. */
        await rich.write([new rich.Item({ 'image/png': png() })]);
        return true;
      } catch {
        /* The caller offers a download instead - better than nothing at all */
        return false;
      }
    }
  };
}

export interface FakeClipboard extends ClipboardPort {
  /** What was last put on it, for a test to read back. */
  readonly last: { text?: string; rich?: RichText; image?: boolean };
}

export function fakeClipboard(opts: { fail?: boolean } = {}): FakeClipboard {
  const last: { text?: string; rich?: RichText; image?: boolean } = {};
  const ok = !opts.fail;
  return {
    last,
    writeText: (t) => {
      last.text = t;
      return Promise.resolve(ok);
    },
    writeRich: (t) => {
      last.rich = t;
      last.text = t.plain;
      return Promise.resolve(ok);
    },
    writeImage: () => {
      last.image = true;
      return Promise.resolve(ok);
    }
  };
}
