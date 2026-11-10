/* The tables sectioned by a property each record carries, and what each value is called.
 *
 * Many Worlds Tavern is sectioned by `realm` and Pistolheart by `vol`. One descriptor per
 * table names the property, its values in book order and their names; the table page's
 * sections, the facet row, the record path's last leaf and the realm picker all read it.
 * The property name is also the filter group, a frozen address word
 * (docs/specs/ROUTES.md, "Filter grammar").
 *
 * Pure module: no DOM, no data beyond what is handed in. */

import { REALM_ORDER, realmName } from './realms.js';
import type { Realm } from './realms.js';
import type { Dict } from './dict.js';
import type { Lang, Record_, TableId } from './types.js';

/** The Pistolheart volumes, in release order. */
export const VOLUME_ORDER = [1, 2, 3] as const;
export type Volume = (typeof VOLUME_ORDER)[number];

const VOLUME_WORD: Record<Lang, string> = { ru: 'Том', en: 'Volume' };

/** A volume's name: «Том 2», "Volume 2". */
export function volumeName(v: Volume | string, lang: Lang): string {
  return `${VOLUME_WORD[lang]} ${String(v)}`;
}

export interface SectionProp {
  /** The record field, which is also the filter group. */
  group: 'realm' | 'vol';
  /** The facet row's caption. */
  label: keyof Dict;
  /** The values, in book order, as the address writes them. */
  order: readonly string[];
  name: (id: string, lang: Lang) => string;
  /** A filter chip's caption where it is shorter than the name: a volume chip reads «2»
   *  under the row «Том», and the picked chip «Том 2» (`chosenLabels`). */
  chip?: (id: string) => string;
  /** The value a record carries, as the address writes it; `''` for none. */
  valueOf: (it: Record_) => string;
}

export const SECTION_PROP: Partial<Record<TableId, SectionProp>> = {
  mwt: {
    group: 'realm',
    label: 'realmF',
    order: REALM_ORDER,
    name: (id, lang) => realmName(id as Realm, lang),
    valueOf: (it) => it.realm ?? ''
  },
  ph: {
    group: 'vol',
    label: 'volF',
    order: VOLUME_ORDER.map(String),
    name: volumeName,
    chip: (id) => id,
    valueOf: (it) => (it.vol == null ? '' : String(it.vol))
  }
};

/** Returns the name of the section a record sits in, or `''` where its table has none.
 *  A sectioned table's id is its records' `src`. */
export function sectionLeaf(it: Record_, lang: Lang): string {
  const prop = SECTION_PROP[it.src as TableId];
  const value = prop?.valueOf(it) ?? '';
  return prop && value ? prop.name(value, lang) : '';
}
