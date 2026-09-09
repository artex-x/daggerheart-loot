/* The lock a timed-out neighbour leaves behind.
 *
 * axe.run() sets a global `_running` flag when it starts and clears it only
 * when it finishes. A vitest timeout does not cancel that call - it just stops
 * waiting on it - so a test that times out can leave the flag set, and the
 * next axe.run() in the same file throws "Axe is already running" before it
 * looks at anything. This reproduces exactly that stuck state, without waiting
 * out a real timeout to produce it, and checks expectNoA11yViolations recovers
 * rather than propagating the lock. See vite.config.mts for the testTimeout
 * half of the same fix (issue 47, B3.6).
 */
import axe from 'axe-core';
import { afterEach, expect, it } from 'vitest';
import { expectNoA11yViolations } from './a11y.js';

afterEach(() => {
  document.body.innerHTML = '';
});

it('recovers from a lock a previous run left set', async () => {
  const div = document.createElement('div');
  div.innerHTML = '<button>ok</button>';
  document.body.appendChild(div);

  (axe as unknown as { _running: boolean })._running = true;

  await expect(expectNoA11yViolations(div)).resolves.toBeUndefined();
});
