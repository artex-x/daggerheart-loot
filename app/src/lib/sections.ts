/* The two sections that roll inside a chosen part of their book.
 *
 * Vault of Ages has no roll table of its own, so the book's own six divisions
 * are the choice: four tiers, then artifacts and cursed objects, which are
 * categories rather than tiers and exist nowhere else. Community items are
 * grouped by the community they belong to, and the roll is a d10 inside one.
 *
 * The list of communities is derived from the records rather than written down
 * again. app.js keeps a hardcoded pair list, and a second copy of nine proper
 * names in two languages is a second thing to get wrong; the records already
 * carry both, in the book's order.
 */

import type { Index } from './data.js';
import type { Dict } from './dict.js';
import type { Lang, Record_, VoaTier } from './types.js';

/** The book's divisions, in its order. Artifacts and cursed objects last. */
export const VOA_SECTIONS: readonly VoaTier[] = [1, 2, 3, 4, 'A', 'C'];

/**
 * What a Vault of Ages section is called.
 *
 * Plural here, because it names a shelf of the book. The singular forms are a
 * different string - a badge on one card reads "Артефакт", not "Артефакты".
 */
export function voaSectionName(k: VoaTier, t: Dict): string {
  if (k === 'A') return t.voaArtifact;
  if (k === 'C') return t.voaCursed;
  return `${t.tier} ${String(k)}`;
}

/** The records of one section, in the order the book prints them. */
export function voaGroup(index: Index, k: VoaTier): readonly Record_[] {
  return (index.rows.get('voa') ?? []).filter((x) => String(x.tier) === String(k));
}

export interface Community {
  /** The English name, which is also the value stored on a record. */
  id: string;
  ru: string;
}

/**
 * Every community that has records, in the order the records are in.
 *
 * First appearance wins, so the order is the book's without anybody restating
 * it. A community with no records would not appear - which is right: an empty
 * chip that rolls nothing is worse than no chip.
 */
export function communities(index: Index): Community[] {
  const seen = new Map<string, Community>();
  for (const it of index.rows.get('community') ?? []) {
    const id = it.community;
    if (!id || seen.has(id)) continue;
    seen.set(id, { id, ru: it.community_ru ?? id });
  }
  return [...seen.values()];
}

export function communityName(c: Community, lang: Lang): string {
  return lang === 'ru' ? c.ru : c.id;
}

/** The ten records of one community, which is what the d10 rolls over. */
export function communityGroup(index: Index, id: string): readonly Record_[] {
  return (index.rows.get('community') ?? []).filter((x) => x.community === id);
}
