/* Whether this host reaches the test project with its headers untouched -
 * from Node and from a page of the served app (docs/DECISIONS.md, "The
 * hosted E2E reads its credentials from the environment; no proxy
 * credential"). Run directly, it checks the Node half alone, with no build:
 * `node --env-file-if-exists=.env.test.local tests/e2e/probe.mjs`. */

import { pathToFileURL } from 'node:url';
import { assertTestProject, missingVars, probeVerdict } from './lib.mjs';

/* Runs in Node and, as a page function, inside the page: self-contained. */
async function ask(url, key, bearer) {
  try {
    const headers = { apikey: key };
    if (bearer) headers.Authorization = 'Bearer ' + bearer;
    const res = await fetch(url + '/auth/v1/user', { headers });
    let body = {};
    try {
      body = await res.json();
    } catch {
      /* not JSON */
    }
    return {
      status: res.status,
      errorCode: body.error_code,
      msg: body.msg ?? body.message
    };
  } catch {
    return null;
  }
}

function refusal(half, reason) {
  return new Error('e2e: refused on this host - ' + half + ': ' + reason);
}

/** The Node half; throws the refusal, or returns. */
export async function probeNode(env) {
  const url = env.E2E_SUPABASE_URL;
  const key = env.E2E_SUPABASE_PUBLISHABLE_KEY;
  const reason = probeVerdict({
    bare: await ask(url, key, null),
    forged: await ask(url, key, 'a.b.c')
  });
  if (reason) throw refusal('node', reason);
  /* Reachability only: this endpoint reads `apikey` and nothing else. */
  let rest;
  try {
    rest = (await fetch(url + '/rest/v1/', { headers: { apikey: key } })).status;
  } catch {
    throw refusal('node', 'no answer from /rest/v1/ (network)');
  }
  if (rest === 200) throw refusal('node', '/rest/v1/ answered the publishable key alone');
}

/** The page half: the same two requests by `fetch` inside `page`. */
export async function probePage(page, env) {
  const run = (bearer) =>
    page.evaluate(ask, env.E2E_SUPABASE_URL, env.E2E_SUPABASE_PUBLISHABLE_KEY, bearer);
  const reason = probeVerdict({ bare: await run(null), forged: await run('a.b.c') });
  if (reason) throw refusal('page', reason);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const missing = missingVars(process.env);
  try {
    if (missing.length) throw new Error('e2e: not set: ' + missing.join(', '));
    assertTestProject(process.env.E2E_SUPABASE_URL);
    await probeNode(process.env);
    console.log('e2e probe: ok (node)');
  } catch (e) {
    console.log(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
