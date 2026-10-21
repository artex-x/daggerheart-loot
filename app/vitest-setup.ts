/* jest-dom's matchers, once, for every component test. */
import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/svelte';

/* The default 1 s find failed under the full coverage run on a loaded host
   (2026-10-14/15: requestsPanel.test.ts, importPanel.test.ts,
   homebrewEditor.test.ts). No component test expects a find or a waitFor to
   fail, so the longer wait costs a passing test nothing. */
configure({ asyncUtilTimeout: 5000 });

/* jsdom implements <dialog> as an element but not as a dialog: showModal, close
   and the backdrop are all missing (jsdom 30). The component uses the real API
   on purpose - the browser's focus trap, Escape handling and inertness are
   worth far more than three hand-written approximations - so the gap is filled
   here rather than avoided there.

   What this shim gives is presence and open/closed, which is what a component
   test can honestly assert. The behaviour it does not reproduce - focus moving
   into the dialog, the page behind going inert, Escape - belongs to the browser
   and is checked in a browser: `tests/app/states.js`'s case 6
   (`dialogSemantics`), against `dist/`. See docs/specs/COVERAGE.md, "Known
   thin spots". */
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

/* jsdom has no ResizeObserver (jsdom 30), and Svelte's `bind:clientWidth` observes with
   one (`PrintPreview.svelte`). The binding still reads the size once at mount, which is
   what a component test can assert; a resize belongs to the browser suites. */
if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  };
}
