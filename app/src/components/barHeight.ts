/**
 * Writes a bar's height to a custom property on the root while the bar is mounted, so the
 * page's scroll padding and toast stop clear of it (`tokens.css`, `Toast.svelte`).
 *
 * @param el the bar
 * @param name the property, `--selbar-h` or `--ebar-h`
 * @returns the cleanup for an `$effect`, which removes the property
 */
export function watchBarHeight(el: HTMLElement, name: string): (() => void) | undefined {
  if (typeof ResizeObserver !== 'function') return undefined;
  const root = document.documentElement;
  const watch = new ResizeObserver(() => {
    root.style.setProperty(name, `${String(el.offsetHeight)}px`);
  });
  watch.observe(el);
  return () => {
    watch.disconnect();
    root.style.removeProperty(name);
  };
}
