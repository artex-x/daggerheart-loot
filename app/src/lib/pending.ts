/* What a sign-in prompt remembers: the page to come back to and the action
 * to finish there. It crosses the provider redirect in `dhloot.auth.return`
 * (docs/specs/STATE.md), so it is read back as untrusted data.
 * Pure module. docs/specs/FEATURES.md, "Account". */

/** An action a signed-out reader started and a sign-in finishes: reopen the add-to-list
 *  menu of `key` with `ids` ticked (and their taken counts) and, when the reader had typed
 *  one, a new list's `name` in its create slot; or save the open shared list (`#/l/` or
 *  `#/s/`). */
export type PendingAction =
  | {
      do: 'addToList';
      key: string;
      ids: string[];
      picked?: Record<string, number>;
      name?: string;
    }
  | { do: 'saveList' };

/** Where a sign-in returns to, and what it finishes there. */
export interface SignInAfter {
  hash: string;
  action?: PendingAction;
}

const KEY = /^[\w-]{1,64}$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;
/** The most rows a page can tick: a table's whole body. */
const IDS_MAX = 180;
const QTY_MAX = 99;
/** A list name's bound (`lists.name`). */
const NAME_MAX = 200;

function readPicked(v: unknown, ids: readonly string[]): Record<string, number> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const out: Record<string, number> = {};
  for (const [id, n] of Object.entries(v)) {
    if (!ids.includes(id)) return null;
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > QTY_MAX) return null;
    out[id] = n;
  }
  return out;
}

/** Returns the action `v` describes, or null when any part of it is not one this app
 *  writes. */
export function readPending(v: unknown): PendingAction | null {
  if (!v || typeof v !== 'object') return null;
  const r = v as Record<string, unknown>;
  if (r['do'] === 'saveList') return { do: 'saveList' };
  if (r['do'] !== 'addToList') return null;
  const { key, ids, picked, name } = r;
  if (typeof key !== 'string' || !KEY.test(key)) return null;
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > IDS_MAX) return null;
  if (!ids.every((id): id is string => typeof id === 'string' && ID.test(id))) return null;
  if (new Set(ids).size !== ids.length) return null;
  if (name !== undefined && (typeof name !== 'string' || !name || name.length > NAME_MAX)) {
    return null;
  }
  const action: PendingAction = { do: 'addToList', key, ids: [...ids] };
  if (name !== undefined) action.name = name;
  if (picked !== undefined) {
    const counts = readPicked(picked, ids);
    if (!counts) return null;
    if (Object.keys(counts).length) action.picked = counts;
  }
  return action;
}
