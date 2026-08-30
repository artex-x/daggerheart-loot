/* Facet filtering: parsing and building the `f_` segment, and the predicate.
 *
 * The grammar is frozen: docs/specs/ROUTES.md, "Filter grammar", and
 * docs/specs/CONTRACTS.md item 1. The group names are part of that contract, and
 * not as a formality: a group a table does not offer is skipped silently, the
 * table stays whole, and a typo in the documentation looks like a working link.
 * That is exactly how `rg` and `bu` survived in llms.txt until Phase 0.
 *
 * Pure module: no DOM, no data. Which values a facet can take is the caller's
 * business - only the group names and their order live here. */

import type { EquipKind, TableId } from './types.js';

/** What is picked: group -> values. An empty group means "any". */
export type FilterState = Record<string, string[]>;

/* Order matters: groups are written to the address in it, and the panel is
   drawn in it. */
const EQ_COMMON = ['tier', 'src'] as const;
const EQ_LINE = ['line'] as const;

export const EQ_GROUPS: Record<EquipKind, readonly string[]> = {
  weapon: [...EQ_COMMON, 'cls', 'trait', 'range', 'burden', ...EQ_LINE],
  /* Every secondary weapon in both books is one-handed - nothing to sort by */
  secondary: [...EQ_COMMON, 'cls', 'trait', 'range', ...EQ_LINE],
  /* Armour has no class, trait, range or burden */
  armor: [...EQ_COMMON, ...EQ_LINE]
};

export const EQ_TABLE: Record<string, EquipKind> = {
  eq_weapon: 'weapon',
  eq_secondary: 'secondary',
  eq_armor: 'armor'
};

/* Plain tables have fewer groups. `kind` exists only where there really is more
   than one kind: on core_item the kind *is* the table. */
const PLAIN_GROUPS: Partial<Record<TableId, readonly string[]>> = {
  wondrous: ['kind'],
  dread: ['kind'],
  voa: ['kind', 'tier'],
  frames: ['kind', 'frame'],
  community: ['comm']
};

/** The groups a table offers, in the order they are written to the address. */
export function groupsFor(table: TableId): readonly string[] {
  const kind = EQ_TABLE[table];
  if (kind) return EQ_GROUPS[kind];
  return PLAIN_GROUPS[table] ?? [];
}

/* ---------- the address ---------- */

/**
 * Parses `f_tier-1-2.cls-mag`.
 *
 * The older group separator - an underscore - is read only where it can still
 * be the right reading: when there is no dot and every piece looks like a group.
 * `frame-beast_feast` fails that test, and rightly so: the underscore there
 * belongs to the value. Values like it are why the separator became a dot.
 */
export function decodeFilter(segment: string): FilterState {
  const out: FilterState = {};
  if (!segment.startsWith('f_')) return out;
  const body = segment.slice(2);
  if (!body) return out;

  const legacy = !body.includes('.') && body.split('_').every((g) => g.indexOf('-') > 0);
  for (const group of legacy ? body.split('_') : body.split('.')) {
    const parts = group.split('-');
    const name = parts.shift();
    if (!name || !parts.length) continue;
    /* A repeat in the link means nothing: a value is either picked or not */
    out[name] = [...new Set(parts)];
  }
  return out;
}

/**
 * Builds the segment back. Only groups this table offers are written, and only
 * non-empty ones: an untouched filter leaves the link short.
 */
export function encodeFilter(state: FilterState, groups: readonly string[]): string {
  const parts = groups
    .map((g) => {
      const on = state[g];
      return on?.length ? g + '-' + on.join('-') : '';
    })
    .filter(Boolean);
  return parts.length ? 'f_' + parts.join('.') : '';
}

/* ---------- selection ---------- */

/** An empty group means "any", so an untouched filter narrows nothing. */
export function groupIsAny(state: FilterState, group: string): boolean {
  return !state[group]?.length;
}

/** Values inside one group are OR'd. */
export function groupHits(state: FilterState, group: string, value: string): boolean {
  return groupIsAny(state, group) || (state[group]?.includes(value) ?? false);
}

/**
 * Groups narrow each other.
 *
 * Only the groups the table offers are checked: a value carried in by a link for
 * a facet this table does not have must not empty the page.
 */
export function passes(
  state: FilterState,
  groups: readonly string[],
  valueOf: (group: string) => string
): boolean {
  return groups.every((g) => groupHits(state, g, valueOf(g)));
}

/** How many values are actually picked - for the button label and for "reset". */
export function chosenCount(state: FilterState, groups: readonly string[]): number {
  return groups.reduce((n, g) => n + (state[g]?.length ?? 0), 0);
}
