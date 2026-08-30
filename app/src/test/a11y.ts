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

/** Rules jsdom cannot answer honestly. Anything else, we want to hear about. */
const OFF = {
  'color-contrast': { enabled: false }
} satisfies axe.RuleObject;

/**
 * Runs axe over a rendered container and throws with the offending markup if
 * anything fails. The message names the rule and prints the node, because a
 * violation id on its own sends the reader to a search engine.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
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
