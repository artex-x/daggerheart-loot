/* The neutral record of the read API, `daggerheart-loot/record` v1
 * (docs/specs/CONTRACTS.md section 6): one shape for a catalog record, at build time, and
 * for a homebrew item, at request time, built only from the functions the app draws with.
 *
 * Pure module: no port, no storage, no component. */

import { isOwnArt, thumbOf } from './art.js';
import { madeFrom, refsOf, setBonusOf, setKeyOf, setOf, upgradesTo } from './data.js';
import type { Index } from './data.js';
import { dict } from './dict.js';
import { appUrl, itemHash, recordUrl } from './hash.js';
import type { Site } from './hash.js';
import { isHomebrewRecord } from './homebrew.js';
import { descOf, eqLine, nameOf } from './i18n.js';
import { srcLabel, srcName, tableOf, whereFrom } from './label.js';
import { markupText } from './markup.js';
import type { Lang, Record_ } from './types.js';

/** The site the links and picture addresses are built on: `base` is the origin with a
 *  trailing `/`, `art` the public address of the homebrew picture bucket (empty for none). */
export type ApiSite = Site & { art: string };

export type License = 'dpcgl' | 'owner';

export interface Pair {
  ru: string;
  en: string;
}

export interface ApiDamage {
  dice: string;
  bonus: number;
  type: string | null;
}

export interface ApiStats {
  type: string;
  tier: number | string;
  class: string | null;
  trait: string | null;
  range: string | null;
  damage: ApiDamage | null;
  burden: 1 | 2 | 'any' | null;
  armor_score: number | null;
  thresholds: { major: number; severe: number } | null;
  line: string | null;
  alt: { trait: string | null; range: string | null; damage: ApiDamage | null } | null;
  statline: Pair;
}

export interface ApiRef {
  key: string;
  name: Pair;
  subtitle: Pair;
  text: Pair;
  url: Pair;
}

export interface ApiRecord {
  format: 'daggerheart-loot/record';
  version: 1;
  id: string;
  key: string;
  origin: 'catalog' | 'homebrew';
  kind: 'item' | 'consumable' | 'weapon' | 'secondary' | 'armor';
  name: Pair;
  text: Pair;
  plain: Pair;
  source: { id: string; name: Pair };
  rights: { license: License; notice: string };
  path: Pair;
  table: string | null;
  roll: number | null;
  tier: number | string | null;
  rarity: string | null;
  stats: ApiStats | null;
  craft: { into: string[]; from: string[] };
  set: { key: string; name: Pair; bonus: Pair; members: string[] } | null;
  refs: ApiRef[];
  image: { full: string; thumb: string; card: string | null } | null;
  link: Pair;
}

/** The rights table `docs/rights/records.json` as the build reads it. */
export interface RightsAudit {
  reviewed: string | null;
  sources: Readonly<Record<string, string>>;
  records: Readonly<Record<string, { license: string }>>;
}

/** The notice of each rights value. English only: legal text, not record text. */
export const RIGHTS: Record<'dpcgl' | 'owner' | 'homebrew', string> = {
  dpcgl:
    'This product includes materials from the Daggerheart System Reference Document 2.0, © Critical Role, LLC. under the terms of the Darrington Press Community Gaming (DPCGL) License. More information can be found at https://www.daggerheart.com. There are no previous modifications by others.',
  owner: 'Text (c) its rights holders; not covered by the DPCGL; served as a play aid.',
  homebrew: 'Written by a daggerheart-loot user, who holds the rights.'
};

/** Returns the rights value of a catalog record: `owner` for every record while the table
 *  is not reviewed, else the record's entry, else its source's row, else `owner`. */
export function licenseOf(audit: RightsAudit, it: Record_): License {
  if (audit.reviewed === null) return 'owner';
  const entry = Object.hasOwn(audit.records, it.id) ? audit.records[it.id] : undefined;
  const own =
    entry?.license ?? (Object.hasOwn(audit.sources, it.src) ? audit.sources[it.src] : '');
  return own === 'dpcgl' ? 'dpcgl' : 'owner';
}

const DAMAGE = /^(d(?:4|6|8|10|12|20))(?:\+([1-9][0-9]?))?$/;

/** Returns the dice and the bonus of a damage value `dN` or `dN+K` (K 1-99), or null for
 *  any other value; the bonus is 0 when there is none. */
export function parseDamage(
  dmg: string | null | undefined
): { dice: string; bonus: number } | null {
  const m = typeof dmg === 'string' ? DAMAGE.exec(dmg) : null;
  return m ? { dice: m[1] as string, bonus: m[2] ? Number(m[2]) : 0 } : null;
}

function pair(of: (lang: Lang) => string): Pair {
  return { ru: of('ru'), en: of('en') };
}

function damageOf(
  dmg: string | null | undefined,
  type: string | null | undefined
): ApiDamage | null {
  const d = parseDamage(dmg);
  return d ? { ...d, type: type ?? null } : null;
}

function statsOf(it: Record_): ApiStats | null {
  const e = it.eq;
  if (!e) return null;
  const labelsOf = (lang: Lang) => {
    const t = dict(lang);
    return {
      tier: t.tier,
      thresholds: t.eqTh,
      armorScore: t.eqScore,
      artifact: t.voaArtifact1
    };
  };
  return {
    type: e.t,
    tier: e.tier,
    class: e.cls ?? null,
    trait: e.tr ?? null,
    range: e.rg ?? null,
    damage: damageOf(e.dmg, e.dt),
    burden: e.bu ?? null,
    armor_score: e.as ?? null,
    thresholds: e.th ? { major: e.th[0], severe: e.th[1] } : null,
    line: e.line ? e.line : null,
    alt: e.alt
      ? {
          trait: e.alt.tr ?? null,
          range: e.alt.rg ?? null,
          damage: damageOf(e.alt.dmg, e.alt.dt)
        }
      : null,
    statline: pair((lang) => eqLine(it, lang, labelsOf(lang)))
  };
}

function imageOf(it: Record_, site: ApiSite): ApiRecord['image'] {
  const img = it.img;
  if (!img) return null;
  if (isOwnArt(img)) {
    return site.art
      ? { full: site.art + img, thumb: site.art + thumbOf(img), card: null }
      : null;
  }
  return {
    full: `${site.base}img/${img}`,
    thumb: `${site.base}img/thumb/${img}`,
    card: `${site.base}og/${img.replace(/\.webp$/, '.jpg')}`
  };
}

function refsOfRecord(index: Index, it: Record_): ApiRef[] {
  const out: ApiRef[] = [];
  for (const key of refsOf(index, it)) {
    const c = index.refs[key];
    if (!c) continue;
    out.push({
      key,
      name: { ru: c.ru || c.en, en: c.en },
      subtitle: { ru: c.rusub || c.ensub, en: c.ensub },
      text: { ru: c.rud || c.ende, en: c.ende },
      url: {
        ru: c.url,
        en: c.url.startsWith('https://ru.daggerheart.su/')
          ? c.url.replace('//ru.', '//en.')
          : c.url
      }
    });
  }
  return out;
}

function setOfRecord(index: Index, it: Record_): ApiRecord['set'] {
  const key = setKeyOf(index, it);
  if (!key) return null;
  const members = setOf(index, it).map((r) => r.id);
  const card = setBonusOf(index, it);
  if (!card && !members.length) return null;
  return {
    key,
    name: { ru: card?.ru || card?.en || key, en: card?.en ?? key },
    bonus: { ru: card?.rud || card?.ende || '', en: card?.ende ?? '' },
    members
  };
}

/**
 * Returns the neutral record of `it` read through `index`.
 *
 * @param index The index the record is read through: the catalog's, or, for a homebrew item,
 *   the one `withRecords` makes (docs/specs/CONTRACTS.md section 6).
 * @param it The record.
 * @param site The site's links and the picture bucket.
 * @param license The rights value the caller resolved (`licenseOf`; `owner` for homebrew).
 */
export function apiRecord(
  index: Index,
  it: Record_,
  site: ApiSite,
  license: License
): ApiRecord {
  const homebrew = isHomebrewRecord(it);
  const hid = homebrew && typeof it.hid === 'string' ? it.hid : it.id;
  const text = pair((lang) => descOf(it, lang));
  const craftFrom = madeFrom(index, it).map((r) => r.id);
  const craftInto = upgradesTo(index, it).map((r) => r.id);
  const e = it.eq;
  return {
    format: 'daggerheart-loot/record',
    version: 1,
    id: hid,
    key: it.id,
    origin: homebrew ? 'homebrew' : 'catalog',
    kind: e ? e.t : it.kind === 'consumable' ? 'consumable' : 'item',
    name: pair((lang) => nameOf(it, lang)),
    text,
    plain: { ru: markupText(text.ru), en: markupText(text.en) },
    source: {
      id: it.src,
      name: pair((lang) =>
        it.src === 'frame' || homebrew ? srcLabel(it, lang) : srcName(it.src, lang)
      )
    },
    rights: { license, notice: RIGHTS[homebrew ? 'homebrew' : license] },
    path: pair((lang) => whereFrom(it, lang)),
    table: tableOf(it),
    roll: it.roll ?? null,
    tier: e ? e.tier : (it.tier ?? null),
    rarity: index.rarityOf(it.id) ?? null,
    stats: statsOf(it),
    craft: {
      into: [...new Set([...(it.craft ?? []), ...craftInto])],
      from: craftFrom
    },
    set: setOfRecord(index, it),
    refs: refsOfRecord(index, it),
    image: imageOf(it, site),
    link: homebrew
      ? pair((lang) => appUrl(site, itemHash(hid), lang))
      : pair((lang) => recordUrl(site, it.id, lang))
  };
}
