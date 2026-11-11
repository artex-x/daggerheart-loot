/**
 * Writes a sticky column's real top to `--real-top` while it is mounted, so its height cap
 * follows where it sits: below its anchor at the page top, at the anchor once stuck
 * (docs/specs/FEATURES.md, "Tables and search", the column cap).
 *
 * @param el the sticky element, which also holds the property
 * @returns the cleanup for an `$effect`, which removes the property
 */
export function watchStickyTop(el: HTMLElement): () => void {
  let frame = 0;
  const write = (): void => {
    frame = 0;
    el.style.setProperty(
      '--real-top',
      `${String(Math.max(0, el.getBoundingClientRect().top))}px`
    );
  };
  const schedule = (): void => {
    if (!frame) frame = requestAnimationFrame(write);
  };
  write();
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  return () => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    if (frame) cancelAnimationFrame(frame);
    el.style.removeProperty('--real-top');
  };
}
