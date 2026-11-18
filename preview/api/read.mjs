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
  const got = await readBytes(res, max);
  return got.fail ? got : { value: decode(got.value) };
}

/** Returns `{ value }`, the bytes of a response whose body is at most `max` bytes, or
 *  `{ fail: 'big' }`. The body is streamed and cancelled past the cap. With `whole` (the
 *  catalog chunks), a body that names its length within the cap and has no content encoding
 *  is read in one call. */
export async function readBytes(res, max, whole = false) {
  const named = res.headers.get('Content-Length');
  const length = named === null ? NaN : Number(named);
  if (Number.isFinite(length) && length > max) {
    drop(res.body);
    return { fail: 'big' };
  }
  /* One read call in place of a reader loop with an await per piece. Node shows no gain
     (2026-11-18 on this host); workerd reads the body natively, and the production reading
     of a batch read decides (.claude/README.md, "Quotas, recovery and failure"). An encoded
     body names its encoded length, so its decoded bytes are streamed under the cap. */
  const encoding = (res.headers.get('Content-Encoding') ?? 'identity').trim().toLowerCase();
  if (whole && Number.isFinite(length) && encoding === 'identity') {
    const value = new Uint8Array(await res.arrayBuffer());
    return value.byteLength > max ? { fail: 'big' } : { value };
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
  return { value: bytes };
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
