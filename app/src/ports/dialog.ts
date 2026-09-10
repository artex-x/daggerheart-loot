/* A confirmation dialog, off `window.confirm` - a browser API and so a port,
 * not a call a component makes directly. The only caller today is deleting a
 * list; the shape is a plain confirm rather than anything richer because
 * that is all the live app asks for. */

import type { DialogPort } from './types.js';

export function browserDialog(win: Window = window): DialogPort {
  return {
    confirm(message: string): boolean {
      return win.confirm(message);
    }
  };
}

/**
 * Answers every question the same way and remembers what it was asked, so a
 * test can both drive the yes/no branch and assert the live app's own
 * wording reached the dialog.
 */
export function fakeDialog(answer = true): DialogPort & { asked: string[] } {
  const asked: string[] = [];
  return {
    asked,
    confirm(message: string): boolean {
      asked.push(message);
      return answer;
    }
  };
}
