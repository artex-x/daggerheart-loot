/* node:test over tests/e2e/lib.mjs: the variables, the test-project guard,
   the throwaway names and the probe's verdict over the shapes the test
   project answered (docs/DECISIONS.md, "The hosted E2E reads its
   credentials from the environment; no proxy credential"). */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS } from '../../tools/supabase/lib.mjs';
import {
  E2E_VARS,
  assertTestProject,
  buildEnv,
  isThrowaway,
  memoryStorage,
  missingVars,
  probeVerdict,
  projectRef,
  redactAddresses,
  storageKey,
  throwawayEmail,
  throwawayPrefix
} from './lib.mjs';

const TEST_URL = 'https://' + PROJECTS.test + '.supabase.co';
const EMAIL = 'owner@example.test';

describe('the variables', () => {
  it('names every missing one, in order', () => {
    assert.deepEqual(missingVars({}), [...E2E_VARS]);
    assert.deepEqual(
      missingVars({
        E2E_SUPABASE_URL: TEST_URL,
        E2E_SUPABASE_PUBLISHABLE_KEY: 'p',
        E2E_SUPABASE_SECRET_KEY: '',
        E2E_USER_EMAIL: EMAIL
      }),
      ['E2E_SUPABASE_SECRET_KEY']
    );
  });
});

describe('the project guard', () => {
  it('reads the ref of a Supabase URL and nothing else', () => {
    assert.equal(projectRef(TEST_URL), PROJECTS.test);
    assert.equal(projectRef(TEST_URL + '/'), PROJECTS.test);
    assert.equal(projectRef('http://' + PROJECTS.test + '.supabase.co'), null);
    assert.equal(projectRef('https://' + PROJECTS.test + '.example.test'), null);
    assert.equal(projectRef('not a url'), null);
  });

  it('passes the test project and refuses any other', () => {
    assert.doesNotThrow(() => {
      assertTestProject(TEST_URL);
    });
    for (const url of [
      'https://' + PROJECTS.prod + '.supabase.co',
      'https://aaaaaaaaaaaaaaaaaaaa.supabase.co',
      ''
    ]) {
      assert.throws(() => {
        assertTestProject(url);
      }, /E2E_SUPABASE_URL is not the test project/);
    }
  });

  it("names supabase-js's storage key", () => {
    assert.equal(storageKey(TEST_URL), 'sb-' + PROJECTS.test + '-auth-token');
  });
});

describe('throwaway users', () => {
  it('are named after the member and the run', () => {
    assert.equal(throwawayPrefix(EMAIL), 'owner+dhloot-e2e-');
    assert.equal(throwawayEmail(EMAIL, 'abc', 2), 'owner+dhloot-e2e-abc-2@example.test');
  });

  it('are recognised from any run, and nothing else is', () => {
    assert.equal(isThrowaway(throwawayEmail(EMAIL, 'old', 1), EMAIL), true);
    assert.equal(isThrowaway('Owner+DHLOOT-E2E-x-1@Example.test', EMAIL), true);
    assert.equal(isThrowaway(EMAIL, EMAIL), false);
    assert.equal(isThrowaway('owner+dhloot-e2e-x-1@elsewhere.test', EMAIL), false);
    assert.equal(isThrowaway('someone+dhloot-e2e-x-1@example.test', EMAIL), false);
    assert.equal(isThrowaway(undefined, EMAIL), false);
  });

  it('need an address to be named after', () => {
    assert.throws(() => throwawayPrefix('nobody'), /not an address/);
  });
});

describe('the probe verdict', () => {
  const bare = { status: 401, errorCode: 'no_authorization', msg: 'no token' };
  const forged = {
    status: 403,
    errorCode: 'bad_jwt',
    msg: 'invalid JWT: unable to parse or verify signature, token is malformed: could not base64 decode header: illegal base64 data at input byte 0'
  };

  it('passes when both headers reach the server as sent', () => {
    assert.equal(probeVerdict({ bare, forged }), null);
  });

  it('refuses a header injected on the way', () => {
    const injected = {
      status: 403,
      errorCode: 'bad_jwt',
      msg: 'invalid JWT: token contains an invalid number of segments'
    };
    assert.match(probeVerdict({ bare: injected, forged }), /without a token .*403 bad_jwt/);
    assert.match(
      probeVerdict({ bare: { status: 200, errorCode: undefined, msg: '' }, forged }),
      /without a token .*200/
    );
  });

  it('refuses a header replaced on the way', () => {
    const replaced = {
      status: 403,
      errorCode: 'bad_jwt',
      msg: 'invalid JWT: token contains an invalid number of segments'
    };
    assert.match(probeVerdict({ bare, forged: replaced }), /forged token .*replaced/);
    assert.match(
      probeVerdict({ bare, forged: { status: 200, errorCode: undefined, msg: '' } }),
      /forged token .*200/
    );
  });

  it('refuses a network failure in either request', () => {
    assert.match(probeVerdict({ bare: null, forged }), /without a token \(network\)/);
    assert.match(probeVerdict({ bare, forged: null }), /forged token \(network\)/);
  });
});

describe('memoryStorage', () => {
  it('behaves like Storage', () => {
    const s = memoryStorage();
    assert.equal(s.getItem('a'), null);
    s.setItem('a', 1);
    s.setItem('b', 'x');
    assert.equal(s.getItem('a'), '1');
    assert.equal(s.length, 2);
    assert.equal(s.key(1), 'b');
    assert.equal(s.key(5), null);
    s.removeItem('a');
    assert.equal(s.length, 1);
    s.clear();
    assert.equal(s.length, 0);
  });
});

describe('redactAddresses', () => {
  it('replaces every address and leaves other text alone', () => {
    assert.equal(
      redactAddresses('A user with the email owner@example.test and x+1@b.test exists'),
      'A user with the email <address> and <address> exists'
    );
    assert.equal(redactAddresses('Rate limit exceeded'), 'Rate limit exceeded');
    assert.equal(redactAddresses(undefined), 'undefined');
  });
});

describe('buildEnv', () => {
  it('drops every E2E_ name and sets the two public build values', () => {
    const out = buildEnv({
      PATH: '/bin',
      E2E_SUPABASE_URL: TEST_URL,
      E2E_SUPABASE_PUBLISHABLE_KEY: 'p',
      E2E_SUPABASE_SECRET_KEY: 's',
      E2E_USER_EMAIL: EMAIL,
      E2E_USER_PASSWORD: 'w'
    });
    assert.deepEqual(out, {
      PATH: '/bin',
      VITE_SUPABASE_URL: TEST_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: 'p'
    });
    assert.equal('E2E_SUPABASE_SECRET_KEY' in out, false);
    assert.equal('E2E_USER_PASSWORD' in out, false);
  });
});
