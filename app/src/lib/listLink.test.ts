/* Тот же формат, те же образцы, что и у tests/contracts.js - но здесь их
   проигрывает уже перенесённый модуль. Пока старое приложение и новое живут
   рядом, оба обязаны сходиться с файлами в docs/fixtures. */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  decodeList,
  encodeList,
  encodeListRaw,
  stamp,
  toBase64Url,
  type ListShape
} from './listLink.js';

interface Fixture {
  id: string;
  why: string;
  list: ListShape & { id: string };
  player: { raw: string; payload: string };
  gm: { raw: string; payload: string };
}

const DIR = join(import.meta.dirname, '..', '..', '..', 'docs', 'fixtures', 'lists');
const FIXTURES: Fixture[] = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(DIR, f), 'utf8')) as Fixture);

/* Декодер спрашивает, существует ли идентификатор. В образцах они настоящие,
   поэтому здесь достаточно знать те, что в самих образцах. */
const KNOWN = new Set(FIXTURES.flatMap((f) => f.list.ids));
const knows = (id: string): boolean => KNOWN.has(id);

describe('золотые образцы', () => {
  it('их не меньше шести', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(6);
  });

  for (const fx of FIXTURES) {
    describe(fx.id, () => {
      it('ссылка игрокам совпадает с образцом', () => {
        expect(encodeListRaw(fx.list, true)).toBe(fx.player.raw);
        expect(encodeList(fx.list, true)).toBe(fx.player.payload);
      });

      it('ссылка себе совпадает с образцом', () => {
        expect(encodeListRaw(fx.list, false)).toBe(fx.gm.raw);
        expect(encodeList(fx.list, false)).toBe(fx.gm.payload);
      });

      it('читается обратно', () => {
        const back = decodeList(fx.gm.payload, knows);
        expect(back).not.toBeNull();
        expect(back!.name).toBe(fx.list.name);
        expect(back!.ids).toEqual(fx.list.ids);
        expect(back!.note).toBe(fx.list.note);
        expect(back!.hnote).toBe(fx.list.hnote);
      });

      it('в ссылке игрокам нет мастерских заметок', () => {
        const back = decodeList(fx.player.payload, knows);
        expect(back).not.toBeNull();
        expect(back!.hnote).toBeUndefined();
        for (const id of back!.ids) expect(back!.meta?.[id]?.hnote).toBeUndefined();
      });
    });
  }
});

describe('метка на строке позиций', () => {
  it('ловит обрезанную ссылку', () => {
    const fx = FIXTURES.find((f) => f.list.ids.length > 1)!;
    const cut = fx.gm.raw.slice(0, fx.gm.raw.lastIndexOf(','));
    expect(decodeList(toBase64Url(cut), knows)).toBeNull();
  });

  it('ловит подменённую позицию', () => {
    const fx = FIXTURES.find((f) => f.list.ids.includes('ci1'))!;
    expect(decodeList(toBase64Url(fx.gm.raw.replace('ci1', 'cc1')), knows)).toBeNull();
  });

  it('считается по строке позиций, а не по всей ссылке', () => {
    expect(stamp(['ci1'])).toBe(stamp(['ci1']));
    expect(stamp(['ci1', 'cc1'])).not.toBe(stamp(['cc1', 'ci1']));
  });
});

describe('ссылки, написанные раньше', () => {
  it('без метки читаются как есть', () => {
    const back = decodeList(toBase64Url('Старый\nci1,cc1'), knows);
    expect(back?.ids).toEqual(['ci1', 'cc1']);
  });

  it('заметка без разметки считается мастерской', () => {
    const back = decodeList(toBase64Url('Старый\nci1\nбез разметки'), knows);
    expect(back?.hnote).toBe('без разметки');
    expect(back?.note).toBeUndefined();
  });
});

describe('чужие идентификаторы', () => {
  it('отбрасываются, а не ломают список', () => {
    /* Метка считается по тому, что написано в ссылке, поэтому её надо
       пересобрать - иначе сработает защита от обрезки, а не эта ветка. */
    const parts = ['ci1', 'zzz999'];
    const raw = `Смесь\n${stamp(parts)}${parts.join(',')}`;
    expect(decodeList(toBase64Url(raw), knows)?.ids).toEqual(['ci1']);
  });

  it('список только из чужих не открывается', () => {
    const parts = ['zzz999'];
    const raw = `Пусто\n${stamp(parts)}${parts.join(',')}`;
    expect(decodeList(toBase64Url(raw), knows)).toBeNull();
  });
});

describe('мусор', () => {
  it('не роняет декодер', () => {
    for (const bad of ['', '!!!', 'a', '0J', '~~~~']) {
      expect(() => decodeList(bad, knows)).not.toThrow();
    }
  });
});
