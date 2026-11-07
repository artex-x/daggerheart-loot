/**
 * Writes a bar's height to a custom property while the bar is mounted, so the page's
 * scroll padding and toast stop clear of it (`tokens.css`, `Toast.svelte`).
 *
 * @param el the bar
 * @param name the property, `--selbar-h`, `--ebar-h` or a dialog's `--dock-h`
 * @param root the element that holds the property: the document's root, or a dialog whose
 *   own toast copy reads it
 * @returns the cleanup for an `$effect`, which removes the property
 */
export function watchBarHeight(
  el: HTMLElement,
  name: string,
  root: HTMLElement = document.documentElement
): (() => void) | undefined {
  if (typeof ResizeObserver !== 'function') return undefined;
  const watch = new ResizeObserver(() => {
    root.style.setProperty(name, `${String(el.offsetHeight)}px`);
  });
  watch.observe(el);
  return () => {
    watch.disconnect();
    root.style.removeProperty(name);
  };
}
