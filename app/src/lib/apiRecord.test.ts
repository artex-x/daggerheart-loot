/* The neutral record of the read API: the shape of each kind of record, the pairs, the
   rights values and the damage parser. The answers pinned byte for byte are the fixtures
   under docs/fixtures/api/v1/ (preview/api/api.test.mjs). */

import { describe, expect, it } from 'vitest';
import { readLoot } from '../test/loot.js';
import { apiRecord, licenseOf, parseDamage, RIGHTS } from './apiRecord.js';
import type { ApiRecord, ApiSite, RightsAudit } from './apiRecord.js';
import { buildIndex } from './data.js';
import type { Index } from './data.js';
import { appUrl, cardVersion, itemHash, recordUrl } from './hash.js';
import { withRecords } from './homebrew.js';
import type { HomebrewRecord } from './homebrew.js';
import type { Record_ } from './types.js';

const SITE: ApiSite = {
  base: 'https://daggerheart-loot.pages.dev/',
  art: 'https://project.supabase.co/storage/v1/object/public/homebrew-art/'
};
const loot = readLoot();
const index = buildIndex(loot);
const all = [...(loot.eq ?? []), ...Object.values(loot.items).flat()];
const byId = (id: string): Record_ => {
  const it = index.byId.get(id);
  if (!it) throw new Error(`The test record ${id} is not in data.js.`);
  return it;
};
const rec = (id: string, license: 'dpcgl' | 'owner' = 'owner', ix: Index = index): ApiRecord =>
  apiRecord(ix, byId(id), SITE, license);

const HB_KEY = 'hb_abcdefghijklmnop';
const HID = '11111111-2222-4333-8444-555555555555';
const hb = (over: Partial<HomebrewRecord> = {}): HomebrewRecord => ({
  id: HB_KEY,
  src: 'homebrew',
  hid: HID,
  kind: 'item',
  en: 'Lantern',
  ru: 'Фонарь',
  ende: 'It **glows**.',
  rud: 'Он **светится**.',
  ...over
});

const isPair = (v: unknown): boolean =>
  typeof v === 'object' &&
  v !== null &&
  Object.keys(v).join() === 'ru,en' &&
  Object.values(v).every((s) => typeof s === 'string');

describe('apiRecord of a catalog record', () => {
  it('shapes an item with both languages in every text field', () => {
    const r = rec('ci1', 'dpcgl');
    expect(r).toMatchObject({
      format: 'daggerheart-loot/record',
      version: 1,
      id: 'ci1',
      key: 'ci1',
      origin: 'catalog',
      kind: 'item',
      table: 'core_item',
      roll: 1,
      tier: null,
      stats: null,
      craft: { into: [], from: [] },
      set: null
    });
    for (const f of [r.name, r.text, r.plain, r.path, r.link, r.source.name]) {
      expect(isPair(f)).toBe(true);
    }
    expect(r.link.ru).toBe(recordUrl(SITE, 'ci1', 'ru'));
    expect(r.link.en).toBe(recordUrl(SITE, 'ci1', 'en'));
    expect(r.link.ru).toBe('https://daggerheart-loot.pages.dev/i/ci1');
    expect(r.image).toEqual({
      full: 'https://daggerheart-loot.pages.dev/img/ci1.webp',
      thumb: 'https://daggerheart-loot.pages.dev/img/thumb/ci1.webp',
      card: 'https://daggerheart-loot.pages.dev/og/ci1.jpg'
    });
  });

  it('links a catalog record with the build card version when it has one', () => {
    const r = apiRecord(index, byId('ci1'), SITE, 'owner', 'abc123');
    expect(r.link.ru).toBe(recordUrl(SITE, 'ci1', 'ru', 'abc123'));
    expect(r.link.en).toBe(recordUrl(SITE, 'ci1', 'en', 'abc123'));
    expect(r.link.ru).toBe('https://daggerheart-loot.pages.dev/i/ci1?v=abc123');
    expect(r.link.en).toBe('https://daggerheart-loot.pages.dev/i/en/ci1?v=abc123');
  });

  it('carries the notice of its rights value', () => {
    expect(rec('ci1', 'dpcgl').rights).toEqual({ license: 'dpcgl', notice: RIGHTS.dpcgl });
    expect(rec('ci1', 'owner').rights).toEqual({ license: 'owner', notice: RIGHTS.owner });
    expect(RIGHTS.dpcgl).toContain('Daggerheart System Reference Document 2.0');
  });

  it('shapes a consumable', () => {
    expect(rec('cc1').kind).toBe('consumable');
  });

  it('gives a rarity to a record of the alternate tables', () => {
    const rarity = [...index.byId.keys()].map((id) => index.rarityOf(id)).find(Boolean);
    expect(rarity).toBeTruthy();
    const id = [...index.byId.keys()].find((k) => index.rarityOf(k)) ?? '';
    expect(rec(id).rarity).toBe(index.rarityOf(id));
  });

  it('shapes a weapon with an alternate stat set', () => {
    const s = rec('q23').stats;
    expect(s).toMatchObject({
      type: 'weapon',
      tier: 1,
      class: 'mag',
      trait: 'presence',
      range: 'far',
      damage: { dice: 'd6', bonus: 0, type: 'mag' },
      burden: 2,
      armor_score: null,
      thresholds: null,
      line: 'q23',
      alt: { trait: 'presence', range: 'melee', damage: { dice: 'd8', bonus: 0, type: 'mag' } }
    });
    expect(s && isPair(s.statline)).toBe(true);
    expect(rec('q23').kind).toBe('weapon');
  });

  it('splits a damage bonus from the dice', () => {
    const withBonus = all.find((it) => it.eq?.dmg?.includes('+'));
    expect(withBonus).toBeDefined();
    const d = rec(withBonus?.id ?? '').stats?.damage;
    expect(d?.bonus).toBeGreaterThan(0);
    expect(d?.dice).toMatch(/^d\d+$/);
  });

  it('shapes an armor with its thresholds and score', () => {
    expect(rec('q313').stats).toMatchObject({
      type: 'armor',
      armor_score: 3,
      thresholds: { major: 5, severe: 11 },
      damage: null,
      trait: null
    });
    expect(rec('q313').kind).toBe('armor');
  });

  it('takes the tier of a Vault of Ages artifact', () => {
    expect(rec('voa2_a1').tier).toBe('A');
  });

  it('gives a record with both tiers the equipment tier, equal to the section tier', () => {
    const both = all.filter((it) => it.eq && it.tier != null);
    expect(both).toHaveLength(45);
    for (const it of both) {
      expect(String(it.tier)).toBe(String(it.eq?.tier));
      expect(rec(it.id).tier).toBe(it.eq?.tier);
    }
  });

  it('names the members and the bonus of a set', () => {
    const s = rec('dve19').set;
    expect(s?.key).toBe('ember-spark');
    expect(s?.members).toContain('dve19');
    expect(s?.members).toContain('dve20');
    expect(isPair(s?.name) && isPair(s?.bonus)).toBe(true);
    expect(s?.bonus.en).not.toBe('');
  });

  it('names the rule cards of a record', () => {
    const refs = rec('w1').refs;
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      expect(
        isPair(ref.name) && isPair(ref.subtitle) && isPair(ref.text) && isPair(ref.url)
      ).toBe(true);
    }
    expect(refs[0]?.url.en).toBe(refs[0]?.url.ru.replace('//ru.', '//en.'));
  });

  it('lists the craft in both directions', () => {
    const from = byId('ci18').craft?.[0] ?? '';
    expect(rec('ci18').craft.into).toContain(from);
    expect(rec(from).craft.from).toContain('ci18');
  });

  it('gives a record with no picture a null image', () => {
    const bare = { ...byId('ci1') };
    delete bare.img;
    expect(apiRecord(index, bare, SITE, 'owner').image).toBeNull();
  });

  it('gives an empty Russian name the English one on both sides', () => {
    const r = apiRecord(index, { ...byId('ci1'), ru: '', rud: '' }, SITE, 'owner');
    expect(r.name.ru).toBe(r.name.en);
    expect(r.text.ru).toBe(r.text.en);
  });

  it('keeps an empty English description empty', () => {
    const r = apiRecord(index, { ...byId('ci1'), ende: '' }, SITE, 'owner');
    expect(r.text.en).toBe('');
  });
});

describe('apiRecord of a homebrew item', () => {
  it('uses the row uuid as the id and the hb key as the key', () => {
    const item = hb();
    const ix = withRecords(index, [item], []);
    const r = apiRecord(ix, item, SITE, 'owner');
    expect(r).toMatchObject({ id: HID, key: HB_KEY, origin: 'homebrew' });
    expect(r.rights).toEqual({ license: 'owner', notice: RIGHTS.homebrew });
    expect(r.image).toBeNull();
  });

  it('links an item with an id as the app does, with its card version', () => {
    const item = hb();
    const r = apiRecord(withRecords(index, [item], []), item, SITE, 'owner', 'ignored');
    const v = cardVersion(item);
    expect(r.link.ru).toBe(appUrl(SITE, itemHash(HID), 'ru', v));
    expect(r.link.en).toBe(appUrl(SITE, itemHash(HID), 'en', v));
    expect(r.link.ru).toBe(`https://daggerheart-loot.pages.dev/h/${HID}?v=${v}`);
    expect(r.link.en).toBe(`https://daggerheart-loot.pages.dev/en/h/${HID}?v=${v}`);
  });

  it('links an entry without an id by its key, with no version, and keeps the key as id', () => {
    const item = hb();
    delete (item as { hid?: string }).hid;
    const r = apiRecord(withRecords(index, [item], []), item, SITE, 'owner', 'ignored');
    expect(r.id).toBe(HB_KEY);
    expect(r.link.ru).toBe(recordUrl(SITE, HB_KEY, 'ru'));
    expect(r.link.en).toBe(recordUrl(SITE, HB_KEY, 'en'));
    expect(r.link.ru).toBe(`https://daggerheart-loot.pages.dev/i/${HB_KEY}`);
  });

  it('builds an own picture from the bucket base', () => {
    const img = 'p/' + 'a'.repeat(32) + '.webp';
    const item = hb({ img });
    const r = apiRecord(withRecords(index, [item], []), item, SITE, 'owner');
    expect(r.image?.full).toBe(SITE.art + img);
    expect(r.image?.thumb).toBe(SITE.art + 't/' + 'a'.repeat(32) + '.webp');
    expect(r.image?.card).toBeNull();
    expect(r.image?.full.startsWith(SITE.art)).toBe(true);
  });

  it('resolves a catalog rule card and a catalog set the item names', () => {
    const item = hb({ refs: ['vicious-entangle'], set: 'ember-spark' });
    const ix = withRecords(index, [item], []);
    const r = apiRecord(ix, item, SITE, 'owner');
    expect(r.refs.map((x) => x.key)).toEqual(['vicious-entangle']);
    expect(r.set?.members).toEqual(expect.arrayContaining(['dve19', 'dve20', HB_KEY]));
    expect(r.set?.bonus.en).toBe(index.sets['ember-spark']?.ende);
  });

  it('holds keys in the craft and the set members', () => {
    const into = hb({ id: 'hb_bbbbbbbbbbbbbbbb', hid: '99999999-2222-4333-8444-555555555555' });
    const item = hb({ craft: [into.id, 'ci1'], set: 'my-set' });
    const ix = withRecords(index, [item, into], []);
    const r = apiRecord(ix, item, SITE, 'owner');
    expect(r.craft.into).toEqual([into.id, 'ci1']);
    expect(apiRecord(ix, into, SITE, 'owner').craft.from).toEqual([HB_KEY]);
  });

  it('gives a shared-list snapshot its own embedded set card', () => {
    const snap = hb({
      set: 'my-set',
      cards: { sets: { 'my-set': { en: 'Mine', ru: 'Моё', ende: 'Bonus.', rud: 'Бонус.' } } }
    });
    const ix = withRecords(index, [], [snap]);
    const r = apiRecord(ix, snap, SITE, 'owner');
    expect(r.set?.bonus).toEqual({ ru: 'Бонус.', en: 'Bonus.' });
    expect(r.set?.name).toEqual({ ru: 'Моё', en: 'Mine' });
    expect(r.set?.members).toEqual([]);
  });
});

describe('licenseOf', () => {
  const audit = (over: Partial<RightsAudit> = {}): RightsAudit => ({
    reviewed: '2026-11-12',
    sources: { core: 'owner', frame: 'owner' },
    records: { ci1: { license: 'dpcgl' }, ci2: { license: 'owner' } },
    ...over
  });

  it('lets an entry win over the source row', () => {
    expect(licenseOf(audit(), byId('ci1'))).toBe('dpcgl');
    expect(licenseOf(audit({ sources: { core: 'dpcgl' } }), byId('ci2'))).toBe('owner');
  });

  it('takes the source row of a record with no entry', () => {
    expect(licenseOf(audit({ sources: { core: 'dpcgl' } }), byId('ci3'))).toBe('dpcgl');
  });

  it('gives owner to an unknown source', () => {
    expect(licenseOf(audit({ sources: {}, records: {} }), byId('ci1'))).toBe('owner');
  });

  it('gives owner to every record while the table is not reviewed', () => {
    expect(licenseOf(audit({ reviewed: null }), byId('ci1'))).toBe('owner');
  });
});

describe('parseDamage', () => {
  it('reads every damage value of data.js', () => {
    const values = new Set(all.flatMap((it) => [it.eq?.dmg, it.eq?.alt?.dmg]).filter(Boolean));
    expect(values.size).toBeGreaterThan(30);
    for (const v of values) {
      const d = parseDamage(v);
      expect(d, String(v)).not.toBeNull();
      expect(`${d?.dice ?? ''}${d?.bonus ? '+' + String(d.bonus) : ''}`).toBe(v);
    }
  });

  it('refuses a value outside the homebrew pattern', () => {
    for (const v of [
      'd7',
      '2d6',
      'd8+0',
      'd8+100',
      'd8+-1',
      'D8',
      '',
      'd8 ',
      null,
      undefined
    ]) {
      expect(parseDamage(v as string)).toBeNull();
    }
  });

  it('gives a record with an unreadable damage no damage object', () => {
    const odd = { ...byId('q1'), eq: { ...byId('q1').eq, dmg: 'd7' } } as Record_;
    expect(apiRecord(index, odd, SITE, 'owner').stats?.damage).toBeNull();
  });
});
