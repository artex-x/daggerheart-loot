/* The reads the worker makes: a response body under a byte cap, and a Supabase RPC as the
   anon reader. Shared by the link cards (preview/worker.mjs) and the read API
   (preview/api/service.mjs); no state, no cookie, no cache. */

export const READ_MS = 3000;

/* Not awaited: a cancel resolves only once every reader of the stream lets go. */
export const drop = (body) => {
  if (body) body.cancel().catch(() => {});
};
/** Returns `{ value }`, the text of a response whose body is at most `max` bytes, or
 *  `{ fail: 'big' }`. The stream is cancelled past the cap, before any decode. */
export async function readText(res, max, decode = (b) => new TextDecoder().decode(b)) {
  const length = Number(res.headers.get('Content-Length'));
  if (Number.isFinite(length) && length > max) {
    drop(res.body);
    return { fail: 'big' };
  }
  const chunks = [];
  let size = 0;
  if (res.body) {
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) {
        reader.cancel().catch(() => {});
        return { fail: 'big' };
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) {
    bytes.set(c, at);
    at += c.byteLength;
  }
  return { value: decode(bytes) };
}

/** Returns the parsed JSON of a response whose body is at most `max` bytes, or
 *  `{ fail: 'big' | 'bad' }`. */
export async function readJson(res, max) {
  const text = await readText(res, max);
  if (text.fail) return text;
  try {
    return { value: JSON.parse(text.value) };
  } catch {
    return { fail: 'bad' };
  }
}

/** Returns `{ value }` for a 200 JSON answer of an RPC, else `{ fail }`. */
export async function rpc(env, name, args, max) {
  try {
    const res = await globalThis.fetch(
      String(env.SUPABASE_URL).replace(/\/+$/, '') + '/rest/v1/rpc/' + name,
      {
        method: 'POST',
        headers: { apikey: env.SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(args),
        signal: AbortSignal.timeout(READ_MS)
      }
    );
    if (res.status !== 200) {
      drop(res.body);
      return { fail: 'status' };
    }
    return await readJson(res, max);
  } catch {
    return { fail: 'network' };
  }
}
