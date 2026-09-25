/* Pure logic of the hosted E2E (layer 4): the variables it needs, the guard
 * that keeps it on the test project, the throwaway users' names and the
 * probe's verdict. No network and no process: lib.test.mjs covers it inside
 * `npm run check`. docs/specs/COVERAGE.md, "Test layers". */

import { PROJECTS } from '../../tools/supabase/lib.mjs';

export const E2E_VARS = Object.freeze([
  'E2E_SUPABASE_URL',
  'E2E_SUPABASE_PUBLISHABLE_KEY',
  'E2E_SUPABASE_SECRET_KEY',
  'E2E_USER_EMAIL'
]);

/** `text` with every address-shaped run (`<non-space>@<non-space>`) replaced,
 *  so a server's message cannot carry the member's address into a log. */
export function redactAddresses(text) {
  return String(text).replace(/\S+@\S+/g, '<address>');
}

/** The configured build's environment: `env` without any `E2E_*` name, with
 *  the two public values the build reads. The secret key never reaches it. */
export function buildEnv(env) {
  const out = {};
  for (const [name, value] of Object.entries(env)) {
    if (!name.startsWith('E2E_')) out[name] = value;
  }
  out.VITE_SUPABASE_URL = env.E2E_SUPABASE_URL;
  out.VITE_SUPABASE_PUBLISHABLE_KEY = env.E2E_SUPABASE_PUBLISHABLE_KEY;
  return out;
}

/** The names of the variables `env` lacks - names only, never a value. */
export function missingVars(env) {
  return E2E_VARS.filter((name) => !env[name]);
}

/** The project ref of an `https://<ref>.supabase.co` URL, else null. */
export function projectRef(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const m = /^([a-z0-9]+)\.supabase\.co$/.exec(u.hostname);
  return u.protocol === 'https:' && m ? m[1] : null;
}

/** Throws unless `url` is the test project; runs before any request. */
export function assertTestProject(url) {
  if (projectRef(url) !== PROJECTS.test) {
    throw new Error('e2e: E2E_SUPABASE_URL is not the test project');
  }
}

/** Where supabase-js keeps the session in the browser. */
export function storageKey(url) {
  return 'sb-' + projectRef(url) + '-auth-token';
}

function split(email) {
  const at = email.lastIndexOf('@');
  if (at < 1) throw new Error('e2e: E2E_USER_EMAIL is not an address');
  return { local: email.slice(0, at), domain: email.slice(at + 1) };
}

/** Every throwaway user's address starts with this. */
export function throwawayPrefix(email) {
  return split(email).local + '+dhloot-e2e-';
}

export function throwawayEmail(email, runId, n) {
  return throwawayPrefix(email) + runId + '-' + String(n) + '@' + split(email).domain;
}

/** Whether `candidate` is a throwaway of `email`, from this run or a killed one. */
export function isThrowaway(candidate, email) {
  if (typeof candidate !== 'string') return false;
  const c = candidate.toLowerCase();
  return (
    c.startsWith(throwawayPrefix(email).toLowerCase()) &&
    c.endsWith('@' + split(email).domain.toLowerCase())
  );
}

/**
 * The probe's verdict (docs/DECISIONS.md, "The hosted E2E reads its
 * credentials from the environment; no proxy credential"). `bare` is `GET
 * /auth/v1/user` with the publishable key and no `Authorization`, `forged`
 * the same with `Bearer a.b.c`; each `{ status, errorCode, msg }`, or null
 * when the request failed. Null passes; otherwise the reason. A header
 * injected on the way answers `bare` with something other than 401
 * `no_authorization`; a replaced one answers `forged` for a token that is
 * not `a.b.c`.
 */
export function probeVerdict({ bare, forged }) {
  if (!bare) return 'no answer without a token (network)';
  if (bare.status !== 401 || bare.errorCode !== 'no_authorization') {
    return (
      'without a token the server answered ' +
      String(bare.status) +
      ' ' +
      String(bare.errorCode) +
      ', not 401 no_authorization - a header is added on the way'
    );
  }
  if (!forged) return 'no answer with a forged token (network)';
  if (
    forged.status !== 403 ||
    forged.errorCode !== 'bad_jwt' ||
    !/illegal base64/.test(String(forged.msg))
  ) {
    return (
      'a forged token was answered ' +
      String(forged.status) +
      ' ' +
      String(forged.errorCode) +
      ', not 403 bad_jwt for that token - the header is replaced on the way'
    );
  }
  return null;
}

/** A `Storage`-shaped object over a `Map`, for supabase-js in Node. */
export function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    clear: () => {
      map.clear();
    },
    key: (i) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    }
  };
}
