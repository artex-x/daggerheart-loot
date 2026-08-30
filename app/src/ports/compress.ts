/* Short links.
 *
 * Notes are the longest part of a list, and in Russian every character costs
 * four times what it should once it is base64. Deflate roughly halves such a
 * link.
 *
 * The compressed payload is marked with "~" at the front. base64url has no
 * tilde and never can, so the two forms are told apart by one character and a
 * link written before this existed still reads (docs/specs/CONTRACTS.md,
 * section 3).
 *
 * Compression is asynchronous, which is why it lives on the share buttons only:
 * the address bar is rewritten on every edit and has nothing to wait for. */

import { PACK_MARK } from '../lib/hash.js';
import type { CompressPort } from './types.js';

interface CompressWin {
  CompressionStream?: typeof CompressionStream;
  DecompressionStream?: typeof DecompressionStream;
}

const b64url = (bytes: Uint8Array): string => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const unb64url = (s: string): Uint8Array => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

async function pipe(bytes: Uint8Array, stream: TransformStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

export function browserCompress(win: CompressWin = window): CompressPort {
  const available = (): boolean => typeof win.CompressionStream === 'function';

  return {
    available,

    async pack(raw) {
      const plain = b64url(new TextEncoder().encode(raw));
      if (!available()) return plain;
      try {
        const Stream = win.CompressionStream as typeof CompressionStream;
        const packed =
          PACK_MARK +
          b64url(await pipe(new TextEncoder().encode(raw), new Stream('deflate-raw')));
        /* Not always shorter: for three entries and no notes the compression
           header costs more than it saves. Whichever actually came out smaller. */
        return packed.length < plain.length ? packed : plain;
      } catch {
        return plain;
      }
    },

    async unpack(payload) {
      if (payload.charAt(0) !== PACK_MARK) return payload;
      const Stream = win.DecompressionStream as typeof DecompressionStream;
      const raw = await pipe(unb64url(payload.slice(1)), new Stream('deflate-raw'));
      return b64url(raw);
    }
  };
}

/** No compression here: the plain form, which every reader understands. */
export function plainCompress(): CompressPort {
  return {
    available: () => false,
    pack: (raw) => Promise.resolve(b64url(new TextEncoder().encode(raw))),
    unpack: (payload) => Promise.resolve(payload)
  };
}
