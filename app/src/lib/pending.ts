/* What a sign-in prompt remembers: the page to come back to and the action
 * to finish there. It crosses the provider redirect in `dhloot.auth.return`
 * (docs/specs/STATE.md), so it is read back as untrusted data.
 * Pure module. docs/specs/FEATURES.md, "Account". */

import { isHomebrewKey } from './homebrew.js';
import { printEntriesValid, type PrintSetEntry } from './printSet.js';

/** An action a signed-out reader started and a sign-in finishes: reopen the add-to-list
 *  menu of `key` with `ids` ticked (and their taken counts); save the open share link's list
 *  (`#/s/` only); save a copy of the homebrew item `hid` or of the catalog record `id`
 *  («Сохранить себе»); or make a print set of `entries` (`print`; `cut` counts the records
 *  past the 180-card cap). */
export type PendingAction =
  | {
      do: 'addToList';
      key: string;
      ids: string[];
      picked?: Record<string, number>;
    }
  | { do: 'saveList' }
  | { do: 'saveItem'; hid: string }
  | { do: 'saveItem'; id: string }
  | { do: 'print'; entries: PrintSetEntry[]; cut?: number };

/** Where a sign-in returns to, and what it finishes there. */
export interface SignInAfter {
  hash: string;
  action?: PendingAction;
}

const KEY = /^[\w-]{1,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ID = /^[A-Za-z0-9_-]{1,64}$/;
/** The most rows a page can tick: a table's whole body. */
const IDS_MAX = 180;
const QTY_MAX = 99;
/** The most records a print press cuts: past this the action is not one this app writes. */
const CUT_MAX = 9999;

/** Returns the print action a signed-out press leaves, with `cut` only when over 0. */
export function printAction({ entries, cut }: { entries: PrintSetEntry[]; cut: number }): {
  do: 'print';
  entries: PrintSetEntry[];
  cut?: number;
} {
  return cut > 0 ? { do: 'print', entries, cut } : { do: 'print', entries };
}

function readPrintAction(r: Record<string, unknown>): PendingAction | null {
  const { entries, cut } = r;
  if (!printEntriesValid(entries)) return null;
  if (cut !== undefined) {
    if (typeof cut !== 'number' || !Number.isInteger(cut) || cut < 1 || cut > CUT_MAX) {
      return null;
    }
  }
  return printAction({ entries: entries.map((e) => ({ ...e })), cut: cut ?? 0 });
}

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
  if (r['do'] === 'print') return readPrintAction(r);
  if (r['do'] === 'saveItem') {
    const { hid, id } = r;
    if (hid !== undefined && id !== undefined) return null;
    if (hid !== undefined) {
      return typeof hid === 'string' && UUID.test(hid) ? { do: 'saveItem', hid } : null;
    }
    return typeof id === 'string' && ID.test(id) && !isHomebrewKey(id)
      ? { do: 'saveItem', id }
      : null;
  }
  if (r['do'] !== 'addToList') return null;
  const { key, ids, picked } = r;
  if (typeof key !== 'string' || !KEY.test(key)) return null;
  if (!Array.isArray(ids) || ids.length < 1 || ids.length > IDS_MAX) return null;
  if (!ids.every((id): id is string => typeof id === 'string' && ID.test(id))) return null;
  if (new Set(ids).size !== ids.length) return null;
  const action: PendingAction = { do: 'addToList', key, ids: [...ids] };
  if (picked !== undefined) {
    const counts = readPicked(picked, ids);
    if (!counts) return null;
    if (Object.keys(counts).length) action.picked = counts;
  }
  return action;
}
