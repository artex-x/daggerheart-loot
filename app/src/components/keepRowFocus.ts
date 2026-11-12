/* Keeps the focus on a list's rows when the focused row leaves it (docs/specs/FEATURES.md,
 * "Account and browser lists", rule 20). The focus is noted while it sits on a row's tick; when
 * another device removes that row, the removal drops the focus to the page. The action then
 * moves it to the tick of the row now at the same place, else the last row's, else the
 * selection bar's clear control. */

export interface KeepRowFocus {
  /** The selector of one row, a direct child of the container. */
  row: string;
  /** The selector of the tick inside a row. */
  tick: string;
}

const CLEAR = '.selbarwrap .selclear button';

export function keepRowFocus(node: HTMLElement, o: KeepRowFocus): { destroy(): void } {
  let noted: { el: Element; at: number } | null = null;

  const rows = (): Element[] =>
    [...node.querySelectorAll(o.row)].filter((r) => r.parentElement === node);

  /* A focus on another control ends the note: a row the reader removes through the bar or
     a menu is not a remote removal. */
  const onFocusIn = (e: FocusEvent): void => {
    const to = e.target;
    const row =
      to instanceof Element && node.contains(to) && to.matches(o.tick)
        ? to.closest(o.row)
        : null;
    noted = row ? { el: row, at: rows().indexOf(row) } : null;
  };

  const onBody = (): boolean =>
    !document.activeElement || document.activeElement === document.body;

  const watch = new MutationObserver(() => {
    const was = noted;
    if (!was || was.el.isConnected) return;
    noted = null;
    if (!onBody()) return;
    const left = rows();
    const next = left[Math.min(Math.max(was.at, 0), left.length - 1)];
    const target =
      next?.querySelector<HTMLElement>(o.tick) ?? document.querySelector<HTMLElement>(CLEAR);
    target?.focus({ preventScroll: true });
  });

  document.addEventListener('focusin', onFocusIn);
  watch.observe(node, { childList: true });
  return {
    destroy() {
      document.removeEventListener('focusin', onFocusIn);
      watch.disconnect();
      /* The last row left and took the container with it: the bar's clear control keeps the
         focus. A page that is leaving has no bar by then, or has put the focus on `#main`. */
      const was = noted;
      if (!was) return;
      setTimeout(() => {
        if (!was.el.isConnected && onBody())
          document.querySelector<HTMLElement>(CLEAR)?.focus();
      }, 0);
    }
  };
}
