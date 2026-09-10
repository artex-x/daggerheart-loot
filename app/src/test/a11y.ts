/* One accessibility assertion, so that every slice inherits it.
 *
 * The rule this file exists to enforce: a component test is not finished when
 * the behaviour passes. The old app collected eight accessibility defects from
 * an external report - live regions, labels, focus rings, headings - and every
 * one of them was found by a person reading the page, months after the code was
 * written. axe finds that class of defect while the component is still open in
 * the editor.
 *
 * Colour contrast is switched off here and stays covered by the browser suites:
 * jsdom does not lay anything out or resolve a cascade, so axe can only see
 * declared colours and would report whatever it happened to find. `qa` and
 * `typo` check contrast on a real page, where it is a real measurement. */

import axe from 'axe-core';

/** Rules jsdom cannot answer honestly, plus one the live app itself commits
 *  to. Anything else, we want to hear about. */
const OFF = {
  'color-contrast': { enabled: false },
  /* The lists index's storage notice (B5.3) puts a dismiss button inside its
     own `<summary>` - app.js's own `storageWarning()` markup, not the
     rewrite's invention. `<details>` hides every child but the first
     `<summary>` while closed, so a button that must stay visible while the
     notice is folded has nowhere else to live; moving it out would hide it
     exactly when dismissing it matters most. A real, live, unavoidable
     nested-interactive shape, ported rather than fixed. */
  'nested-interactive': { enabled: false }
} satisfies axe.RuleObject;

/**
 * Runs axe over a rendered container and throws with the offending markup if
 * anything fails. The message names the rule and prints the node, because a
 * violation id on its own sends the reader to a search engine.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  /* axe.run() sets a global `_running` flag when it starts and clears it only
   * when it finishes. A vitest timeout does not cancel that call - it just
   * stops waiting on it - so a test that times out can leave the flag set,
   * and the very next axe.run() in the same file throws "Axe is already
   * running" before it looks at anything. Without this, one slow test takes
   * every a11y assertion after it down with it, which is why the failure
   * count swung with machine load instead of staying put (issue 47, B3.6).
   *
   * Clearing it here is safe either way: on the common path the previous run
   * already cleared it and this is a no-op; on the timeout path, the run it
   * belonged to already failed its own test and nothing reads its result. */
  (axe as unknown as { _running: boolean })._running = false;
  const result = await axe.run(container, { rules: OFF });
  if (result.violations.length === 0) return;

  const report = result.violations
    .map((v) => {
      const nodes = v.nodes.map((n) => `      ${n.html}`).join('\n');
      return `  ${v.id} (${v.impact ?? 'unknown'}): ${v.help}\n${nodes}`;
    })
    .join('\n');
  throw new Error(`axe found ${String(result.violations.length)} violation(s):\n${report}`);
}
