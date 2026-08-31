/* jest-dom's matchers, once, for every component test. */
import '@testing-library/jest-dom/vitest';

/* jsdom implements <dialog> as an element but not as a dialog: showModal, close
   and the backdrop are all missing (jsdom 30). The component uses the real API
   on purpose - the browser's focus trap, Escape handling and inertness are
   worth far more than three hand-written approximations - so the gap is filled
   here rather than avoided there.

   What this shim gives is presence and open/closed, which is what a component
   test can honestly assert. The behaviour it does not reproduce - focus moving
   into the dialog, the page behind going inert, Escape - belongs to the browser
   and is checked in a browser: tests/flows.js today, the e2e layer in Phase 5.
   See docs/specs/COVERAGE.md, "Known thin spots". */
const proto = globalThis.HTMLDialogElement.prototype;

if (typeof proto.showModal !== 'function') {
  proto.showModal = function showModal(this: HTMLDialogElement): void {
    this.open = true;
  };
  proto.close = function close(this: HTMLDialogElement, value?: string): void {
    if (!this.open) return;
    this.open = false;
    if (value !== undefined) this.returnValue = value;
    this.dispatchEvent(new Event('close'));
  };
}
