/* «Импорт предметов» on `#/homebrew` over the fake cloud: the panel, the preview with its
   counts, held keys and repeated names, the «Куда» rows with their defaults and notes, skip
   or update, the custom source, the fold past 20 rows, every refusal of a file or a zip, and
   the press - every row or none, the same rows on a retry (docs/specs/FEATURES.md,
   "Homebrew"). The files are docs/fixtures/homebrew-file/. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import type { Loot } from '../lib/data.js';
import { zipStored } from '../lib/zip.js';
import { fakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { fakeData, fakeDialog, fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const ROOT = join(import.meta.dirname, '..', '..', '..');
const LOOT = JSON.parse(readFileSync(join(ROOT, 'data.json'), 'utf8')) as Loot;
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(join(ROOT, 'docs', 'fixtures', 'homebrew-file', name)));
const utf8 = (s: string): Uint8Array => new TextEncoder().encode(s);
const doc = (o: Record<string, unknown>): Uint8Array =>
  utf8(JSON.stringify({ format: 'daggerheart-loot/homebrew', version: 1, ...o }));
const BASE32 = 'abcdefghijklmnopqrstuvwxyz234567';
/* A key from a number: `hb_` and 16 base32 characters. */
const keyN = (n: number): string => {
  let tail = '';
  let v = n;
  do {
    tail = BASE32.charAt(v % 32) + tail;
    v = Math.floor(v / 32);
  } while (v > 0);
  return 'hb_' + tail.padStart(16, 'a');
};
const ALDER = uuid(501);
const ALDER_KEY = 'hb_alderworkshopaaa';

async function opened(as: 'gm1' | 'gm2' = 'gm1', opts: FakeCloudOptions = {}, answer = true) {
  const cloud = fakeCloud(SEED, as, opts);
  const dialog = fakeDialog(answer);
  const view = render(App, {
    env: fakeEnv({
      router: memoryRouter('#/homebrew'),
      data: fakeData(LOOT),
      dialog,
      storage: memoryStorage(),
      cloud
    })
  });
  await userEvent.click(await screen.findByRole('button', { name: 'Импорт предметов' }));
  /* The first open compiles the lazy chunk: slow on a loaded host. */
  await screen.findByText('Импорт предметов из файла JSON', {}, { timeout: 10_000 });
  return { ...view, cloud, dialog };
}

/* The input is `hidden`; its files are set as the browser's picker would. */
function choose(container: HTMLElement, bytes: Uint8Array, name = 'items.json'): void {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('no file input');
  const file = new File([new Uint8Array(bytes)], name);
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  void fireEvent.change(input);
}

const alertText = async (): Promise<string> =>
  (await screen.findByRole('alert', {}, { timeout: 3000 })).textContent
    .replace(/\s+/g, ' ')
    .trim();
const importButton = (n: number): Promise<HTMLElement> =>
  screen.findByRole('button', { name: `Импортировать (${String(n)})` });
const previews = (c: HTMLElement): string[] =>
  [...c.querySelectorAll('.preview')].map((p) => p.textContent.replace(/\s+/g, ' ').trim());
const rowsOf = (c: HTMLElement): HTMLElement[] => [
  ...c.querySelectorAll<HTMLElement>('.srcrow')
];
const selected = (row: HTMLElement): string => {
  const select = row.querySelector('select');
  return select?.selectedOptions[0]?.textContent ?? '';
};
const lineTexts = (el: Element): string[] =>
  [...el.querySelectorAll('li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim());

describe('the import panel', () => {
  it('opens after «Новый предмет» with the pick button, the hint and its two links', async () => {
    const { container } = await opened();
    const toggle = screen.getByRole('button', { name: 'Импорт предметов' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Выбрать файл...' })).toBeInTheDocument();
    const schema = screen.getByRole('link', { name: 'схеме homebrew-v1' });
    expect(schema).toHaveAttribute('href', 'schema/homebrew-v1.json');
    expect(screen.getByRole('link', { name: 'описание для ИИ-помощников' })).toHaveAttribute(
      'href',
      'llms.txt'
    );
    expect(container.querySelector('.hint')?.textContent.replace(/\s+/g, ' ').trim()).toBe(
      'Файл, сохранённый кнопкой «Скачать JSON» или собранный по схеме homebrew-v1 (описание для ИИ-помощников), или архив ZIP из «Скачать мои данные». Предметы, которые уже есть, можно пропустить или обновить.'
    );
    await expectNoA11yViolations(container);
  });

  it('previews a first import: the counts, a new source with its sections and the default source', async () => {
    const { container } = await opened('gm2');
    choose(container, fixture('example.json'), 'example.json');
    await importButton(5);
    expect(previews(container)).toEqual(['Источников: 1, разделов: 2, карт: 2, предметов: 3.']);
    const [alder, none] = rowsOf(container);
    expect(within(alder!).getByText('Мастерская Ольхи').tagName).toBe('B');
    expect(alder?.querySelector('small')?.textContent).toBe('2 предмета');
    expect(selected(alder!)).toBe('Новый источник «Мастерская Ольхи»');
    expect([...alder!.querySelectorAll('option')].map((o) => o.textContent)).toEqual([
      'В «Хоумбрю»',
      'Новый источник «Мастерская Ольхи»',
      '+ Новый источник...'
    ]);
    expect(alder?.querySelector('.fhint')?.textContent).toBe(
      'Источник создастся вместе с разделами: 2.'
    );
    expect(selected(none!)).toBe('В «Хоумбрю»');
    expect([...none!.querySelectorAll('option')].map((o) => o.textContent)).toEqual([
      'В «Хоумбрю»',
      'В «Мастерская Ольхи» (новый)',
      '+ Новый источник...'
    ]);
    /* Each row's name is its select's label. */
    expect(screen.getByLabelText(/Без источника/)).toBe(none!.querySelector('select'));
    expect(
      screen.queryByRole('group', { name: 'Предметы, карты и источники, которые уже есть' })
    ).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('imports, toasts the counts, folds the panel and draws the new source', async () => {
    const { container, cloud } = await opened('gm2');
    const imp = vi.spyOn(cloud.homebrew, 'import');
    choose(container, fixture('example.json'));
    await userEvent.click(await importButton(5));
    expect(
      await screen.findByText('Импортировано предметов: 3, новых источников: 1, новых карт: 2')
    ).toBeInTheDocument();
    expect(imp).toHaveBeenCalledOnce();
    expect(screen.queryByText('Импорт предметов из файла JSON')).toBeNull();
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Мастерская Ольхи · Пистоли 2' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Хоумбрю 1' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('skips a file imported again by default, and updates on «Обновить» after the confirm', async () => {
    const { container, cloud, dialog } = await opened('gm2');
    choose(container, fixture('example.json'));
    await userEvent.click(await importButton(5));
    await screen.findByText(/^Импортировано предметов: 3/);
    await userEvent.click(screen.getByRole('button', { name: 'Импорт предметов' }));
    choose(container, fixture('example.json'));
    await importButton(5);
    expect(previews(container)).toContain('Предметов и карт, которые уже есть в аккаунте: 5.');
    expect(rowsOf(container)[0]?.querySelector('.fhint')?.textContent).toBe(
      'Ключ источника совпал с вашим: предметы попадут в него.'
    );
    expect(selected(rowsOf(container)[0]!)).toBe('В «Мастерская Ольхи»');
    expect(container.querySelector('.held .fhint')?.textContent.trim()).toBe(
      'Существующие предметы и карты (5) останутся как есть; новые добавятся.'
    );
    await userEvent.click(await importButton(5));
    expect(
      await screen.findByText('Импортировано предметов: 0, пропущено: 5')
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Импорт предметов' }));
    choose(container, fixture('example-edited.json'));
    await importButton(7);
    await userEvent.click(screen.getByRole('button', { name: 'Обновить' }));
    expect(container.querySelector('.held .fhint')?.textContent.trim()).toBe(
      'Текст и характеристики существующих предметов и карт (5) заменятся данными из файла, названия источников тоже. Ссылки в списках останутся живыми, замороженные копии не изменятся.'
    );
    await expectNoA11yViolations(container);
    const imp = vi.spyOn(cloud.homebrew, 'import');
    const confirm = vi.spyOn(dialog, 'confirm').mockReturnValueOnce(false);
    await userEvent.click(await importButton(7));
    expect(confirm).toHaveBeenCalledWith(
      'Обновить существующие предметы и карты (5)? Их текст и характеристики заменятся данными из файла. Отменить нельзя.'
    );
    expect(imp).not.toHaveBeenCalled();
    await userEvent.click(await importButton(7));
    expect(
      await screen.findByText('Импортировано предметов: 2, обновлено: 5')
    ).toBeInTheDocument();
    expect(imp.mock.calls[0]?.[0].update).toBe(true);
  });

  it('previews the held source of gm1 by its key with the skip or update choice', async () => {
    const { container } = await opened('gm1');
    choose(container, fixture('example-edited.json'));
    await importButton(7);
    expect(selected(rowsOf(container)[0]!)).toBe('В «Мастерская Ольхи»');
    expect(
      screen.getByRole('group', { name: 'Предметы, карты и источники, которые уже есть' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Пропустить' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expectNoA11yViolations(container);
  });

  it("draws only the row with no source, and names a new source of the GM's choosing", async () => {
    const { container, cloud } = await opened('gm2');
    choose(container, fixture('no-book.json'));
    await importButton(4);
    const [row, more] = rowsOf(container);
    expect(more).toBeUndefined();
    expect(within(row!).getByText('Без источника')).toBeInTheDocument();
    await userEvent.selectOptions(row!.querySelector('select')!, '+ Новый источник...');
    const name = screen.getByLabelText('Название нового источника');
    expect(name).toHaveAttribute('maxlength', '80');
    await userEvent.click(await importButton(4));
    expect(screen.getByText('Введите название источника.')).toBeInTheDocument();
    expect(name).toHaveAttribute('aria-invalid', 'true');
    await expectNoA11yViolations(container);
    await userEvent.type(name, 'Хоумбрю');
    await userEvent.click(await importButton(4));
    expect(screen.getByText('Источник «Хоумбрю» уже есть.')).toBeInTheDocument();
    await userEvent.clear(name);
    await userEvent.type(name, 'Находки');
    await userEvent.click(await importButton(4));
    expect(await screen.findByText(/^Импортировано предметов: 3/)).toBeInTheDocument();
    const read = await cloud.homebrew.load();
    const made = read.ok ? read.books.find((b) => b.content.ru === 'Находки') : undefined;
    expect(made).toBeDefined();
    expect(read.ok && read.items.filter((i) => i.book_id === made?.id)).toHaveLength(3);
    expect(read.ok && read.cards.filter((c) => c.book_id === made?.id)).toHaveLength(1);
  });

  it('counts the new keys whose name the account holds, and holds none of them', async () => {
    const { container } = await opened('gm2');
    choose(container, fixture('example.json'));
    await userEvent.click(await importButton(5));
    await screen.findByText(/^Импортировано предметов: 3/);
    await userEvent.click(screen.getByRole('button', { name: 'Импорт предметов' }));
    choose(container, fixture('same-names.json'));
    await importButton(3);
    expect(previews(container)).toContain(
      'Предметов с таким же названием уже есть: 2 - они добавятся ещё раз'
    );
    expect(previews(container).some((p) => p.startsWith('Предметов и карт, которые'))).toBe(
      false
    );
    await userEvent.click(await importButton(3));
    expect(await screen.findByText('Импортировано предметов: 3')).toBeInTheDocument();
  });

  it("reads a zip's homebrew.json and names its lists.json with its page, not as a file it does not read", async () => {
    const { container } = await opened('gm2');
    const at = new Date('2026-10-01T12:00:00Z');
    choose(
      container,
      zipStored(
        [
          { name: 'lists.json', bytes: utf8('{}') },
          { name: 'homebrew.json', bytes: fixture('example.json') }
        ],
        at
      ),
      'data.zip'
    );
    await importButton(5);
    expect(previews(container)).toEqual([
      'Источников: 1, разделов: 2, карт: 2, предметов: 3.',
      'Файл lists.json из архива импортируется на странице «Мои списки».'
    ]);
  });

  it('draws 20 rows of 60 sources, then «и ещё 40 источников» and «свернуть»', async () => {
    const { container } = await opened('gm2');
    const books = Array.from({ length: 60 }, (_, i) => ({
      key: keyN(i),
      ru: 'Источник ' + String(i)
    }));
    const items = books.map((b, i) => ({
      key: keyN(1000 + i),
      book: b.key,
      kind: 'item',
      ru: 'П' + String(i)
    }));
    choose(container, doc({ books, items }));
    await importButton(60);
    expect(rowsOf(container)).toHaveLength(20);
    const more = screen.getByRole('button', { name: 'и ещё 40 источников' });
    await userEvent.click(more);
    expect(rowsOf(container)).toHaveLength(60);
    expect(screen.getByRole('button', { name: 'свернуть' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    await expectNoA11yViolations(container);
  });

  it('refuses a merge past 30 sections in its row and sends nothing', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    const read = await cloud.homebrew.load();
    const alder = read.ok ? read.books.find((b) => b.id === ALDER) : undefined;
    const sections = [
      ...(alder?.content.sections ?? []),
      ...Array.from({ length: 28 }, (_, i) => ({
        key: keyN(2000 + i),
        ru: 'Раздел ' + String(i)
      }))
    ];
    await cloud.homebrew.updateBook(ALDER, { ...alder!.content, sections }, alder!.revision);
    const dialog = fakeDialog(true);
    const { container } = render(App, {
      env: fakeEnv({
        router: memoryRouter('#/homebrew'),
        data: fakeData(LOOT),
        dialog,
        storage: memoryStorage(),
        cloud
      })
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Импорт предметов' }));
    await screen.findByText('Импорт предметов из файла JSON');
    const imp = vi.spyOn(cloud.homebrew, 'import');
    choose(
      container,
      doc({
        books: [
          {
            key: ALDER_KEY,
            ru: 'Мастерская Ольхи',
            sections: [{ key: keyN(3000), ru: 'Новый раздел' }]
          }
        ],
        items: [
          { key: keyN(3001), book: ALDER_KEY, section: keyN(3000), kind: 'item', ru: 'Предмет' }
        ]
      })
    );
    await importButton(1);
    expect(rowsOf(container)[0]?.querySelector('.err')?.textContent).toBe(
      'В «Мастерская Ольхи» будет больше 30 разделов - выберите другой источник.'
    );
    await userEvent.click(await importButton(1));
    expect(imp).not.toHaveBeenCalled();
  });

  it('names only the sources on skip and update when the file holds only held source keys', async () => {
    const { container } = await opened('gm1');
    choose(
      container,
      doc({
        books: [{ key: ALDER_KEY, ru: 'Мастерская Ольхи' }],
        items: [{ key: keyN(4001), book: ALDER_KEY, kind: 'item', ru: 'Предмет' }]
      })
    );
    await importButton(1);
    const note = (): string =>
      container.querySelector('.held .fhint')?.textContent.replace(/\s+/g, ' ').trim() ?? '';
    expect(note()).toBe(
      'Названия существующих источников останутся как есть; новые разделы добавятся.'
    );
    await userEvent.click(screen.getByRole('button', { name: 'Обновить' }));
    expect(note()).toBe(
      'Названия существующих источников заменятся данными из файла; новые разделы добавятся.'
    );
    await expectNoA11yViolations(container);
  });

  it('draws the default target again for a row whose held source another tab deleted', async () => {
    const { container, cloud } = await opened('gm1');
    choose(container, fixture('example.json'));
    await importButton(5);
    expect(selected(rowsOf(container)[0]!)).toBe('В «Мастерская Ольхи»');
    await cloud.homebrew.removeBook(ALDER);
    /* The refusal reads the account again, which no longer holds the source. */
    vi.spyOn(cloud.homebrew, 'import').mockResolvedValueOnce({ ok: false, error: 'refused' });
    await userEvent.click(await importButton(5));
    await waitFor(() => {
      expect(selected(rowsOf(container)[0]!)).toBe('Новый источник «Мастерская Ольхи»');
    });
  });

  it('notes a relation that names nothing and a held card of another kind', async () => {
    const { container } = await opened('gm1');
    choose(
      container,
      doc({
        cards: [{ key: 'hb_aldersetaaaaaaaa', kind: 'ref', ru: 'Карта' }],
        items: [{ key: keyN(1), kind: 'item', ru: 'Мушкет', craft: [keyN(99)] }]
      })
    );
    await importButton(2);
    expect(lineTexts(container.querySelector('.rep')!)).toEqual([
      'Карта 1, «Карта»: в аккаунте под этим ключом карта другого вида - она пропущена',
      `Предмет 1, «Мушкет»: craft «${keyN(99)}» - нет ни в файле, ни в аккаунте, ни в каталоге; связь сохранится, но не покажется`
    ]);
  });
});

describe('the refusals', () => {
  it('refuses a file with errors, each line with its object, its text and its path', async () => {
    const { container } = await opened();
    choose(container, fixture('errors.json'));
    expect(await alertText()).toMatch(/^В файле ошибки - ничего не импортировано\./);
    expect(lineTexts(container.querySelector('.errs')!)).toEqual([
      'Предмет 3, «Мушкет»: eq.dmg «2d8» - урон записывается как d8 или d10+2 items[2].eq.dmg',
      'Предмет 7: нет названия - нужен en или ru items[6]',
      'Предмет 12, «Безделушка 12»: refs - больше 3 элементов items[11].refs'
    ]);
    expect(screen.queryByRole('button', { name: /Импортировать/ })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it.each([
    [
      'line-mixed.json',
      'Предмет 2, «Кираса-револьвер»: eq.line - в этой линии снаряжение другого типа items[1].eq.line'
    ],
    ['nbsp-name.json', 'Предмет 1: нет названия - нужен en или ru items[0]'],
    [
      'bad-section.json',
      /^Предмет 1, «.+»: раздела «hb_[a-z2-7]{16}» нет в источнике предмета items\[0\]\.section$/
    ]
  ])('names the error of %s', async (name, line) => {
    const { container } = await opened();
    choose(container, fixture(name));
    await alertText();
    const [first] = lineTexts(container.querySelector('.errs')!);
    if (typeof line === 'string') expect(first).toBe(line);
    else expect(first).toMatch(line);
  });

  it('names a key, a repeated key, a source the file lacks and the other rules in words', async () => {
    const { container } = await opened();
    choose(
      container,
      doc({
        books: [{ key: 'hb_bad', ru: 'И' }],
        cards: [
          { key: keyN(1), kind: 'ref', ru: 'К', url: 'http://x', book: keyN(9) },
          { key: keyN(1), kind: 'set', ru: 'К2', rud: 'a'.repeat(1501) }
        ],
        items: [
          { key: keyN(2), kind: 'thing', ru: 'А' },
          { key: keyN(3), kind: 'item', ru: 'Б', craft: [keyN(3)], extra: 1 },
          { key: keyN(4), kind: 'item', ru: 'В', tier: 9 },
          {
            key: keyN(5),
            kind: 'equip',
            ru: 'Г',
            eq: { t: 'armor', tier: 1, as: 13, th: [9, 3] }
          },
          { key: keyN(6), kind: 'item', ru: 'Д', craft: [keyN(7), keyN(7)], refs: 'x' }
        ]
      })
    );
    await alertText();
    expect(lineTexts(container.querySelector('.errs')!)).toEqual([
      'Источник 1, «И»: ключ «hb_bad» - hb_ и 16 знаков a-z, 2-7 books[0].key',
      'Карта 1, «К»: url «http://x»: неверный формат - сверьте с описанием в llms.txt cards[0].url',
      `Карта 1, «К»: источника «${keyN(9)}» нет в файле cards[0].book`,
      `Карта 2, «К2»: ключ «${keyN(1)}» уже есть в файле cards[1].key`,
      'Карта 2, «К2»: rud: длиннее 1500 символов cards[1].rud',
      'Предмет 1, «А»: kind «thing»: недопустимое значение - сверьте с описанием в llms.txt items[0].kind',
      'Предмет 2, «Б»: craft[0] - предмет ссылается сам на себя items[1].craft[0]',
      'Предмет 2, «Б»: неизвестное поле extra items[1].extra',
      'Предмет 3, «В»: tier «9»: недопустимое значение - сверьте с описанием в llms.txt items[2].tier',
      'Предмет 4, «Г»: eq.as 13 - значение вне диапазона items[3].eq.as',
      'Предмет 4, «Г»: eq.th - второй порог больше первого items[3].eq.th',
      'Предмет 5, «Д»: craft[1] - значение повторяется items[4].craft[1]',
      'Предмет 5, «Д»: refs: неверный тип значения items[4].refs'
    ]);
  });

  it('counts the errors past 50', async () => {
    const { container } = await opened();
    const items = Array.from({ length: 60 }, (_, i) => ({ key: keyN(i), kind: 'item' }));
    choose(container, doc({ items }));
    await alertText();
    expect(lineTexts(container.querySelector('.errs')!)).toHaveLength(50);
    expect(container.querySelector('.errs .more')?.textContent).toBe('...и ещё 10 ошибок');
  });

  it('refuses more than 100 sources and more than 1000 items', async () => {
    const { container } = await opened();
    const books = Array.from({ length: 101 }, (_, i) => ({
      key: keyN(i),
      ru: 'И' + String(i)
    }));
    choose(container, doc({ books }));
    await alertText();
    expect(lineTexts(container.querySelector('.errs')!)).toContain(
      'Источников больше 100 books'
    );
    const items = Array.from({ length: 1001 }, (_, i) => ({
      key: keyN(i),
      kind: 'item',
      ru: 'П'
    }));
    choose(container, doc({ items }));
    await waitFor(() => {
      expect(lineTexts(container.querySelector('.errs')!)).toContain(
        'Предметов больше 1000 items'
      );
    });
  });

  it.each([
    [
      'another version',
      fixture('wrong-version.json'),
      'Файл предметов версии 2: сайт читает версию 1.'
    ],
    [
      'no version',
      utf8(JSON.stringify({ format: 'daggerheart-loot/homebrew', items: [] })),
      'В файле нет поля version. Сайт читает версию 1.'
    ],
    [
      'a lists file',
      utf8(JSON.stringify({ format: 'daggerheart-loot/lists', version: 1, lists: [] })),
      'Это не файл предметов: нет поля format со значением daggerheart-loot/homebrew.'
    ],
    [
      'an empty file',
      doc({ books: [], items: [] }),
      'В файле нет ни источников, ни карт, ни предметов.'
    ],
    ['text that is not JSON', utf8('not json'), 'Это не файл JSON.'],
    [
      'a zip with no homebrew.json',
      zipStored([{ name: 'lists.json', bytes: utf8('{}') }], new Date(0)),
      'В архиве нет файла homebrew.json.'
    ],
    [
      'a zip with two homebrew.json at one depth',
      zipStored(
        [
          { name: 'a/homebrew.json', bytes: utf8('{}') },
          { name: 'b/homebrew.json', bytes: utf8('{}') }
        ],
        new Date(0)
      ),
      'В архиве несколько файлов homebrew.json: распакуйте его и выберите нужный.'
    ]
  ])('refuses %s in one line', async (_what, bytes, line) => {
    const { container } = await opened();
    choose(container, bytes);
    expect(await alertText()).toBe(line);
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('refuses a homebrew.json another program compressed', async () => {
    const { container } = await opened();
    const packed = zipStored(
      [{ name: 'homebrew.json', bytes: fixture('example.json') }],
      new Date(0)
    );
    const v = new DataView(packed.buffer);
    v.setUint16(8, 8, true);
    v.setUint16(packed.length - 22 - 46 - 'homebrew.json'.length + 10, 8, true);
    choose(container, packed);
    expect(await alertText()).toBe(
      'Архив сжат другой программой: распакуйте его и выберите homebrew.json.'
    );
  });
});

describe('the press', () => {
  it('says the item limit and keeps the preview, the account unchanged', async () => {
    const { container, cloud } = await opened('gm2');
    choose(container, fixture('over-limit.json'));
    await userEvent.click(await importButton(101));
    expect(await alertText()).toBe(
      'Достигнут предел своих предметов: 100. Нужно больше - напишите на daggerheart.loot@gmail.com.'
    );
    expect(await importButton(101)).toBeEnabled();
    const read = await cloud.homebrew.load();
    expect(read.ok ? read.items : null).toHaveLength(0);
  });

  it('keeps the preview after a lost answer and sends the same rows again', async () => {
    const { container, cloud } = await opened('gm2');
    const imp = vi.spyOn(cloud.homebrew, 'import');
    choose(container, fixture('example.json'));
    const button = await importButton(5);
    cloud.setOffline(true);
    await userEvent.click(button);
    expect(await alertText()).toBe(
      'Не получилось импортировать. Проверьте соединение и попробуйте ещё раз.'
    );
    cloud.setOffline(false);
    await userEvent.click(await importButton(5));
    expect(await screen.findByText(/^Импортировано предметов: 3/)).toBeInTheDocument();
    expect(imp).toHaveBeenCalledTimes(2);
    expect(imp.mock.calls[1]?.[0]).toEqual(imp.mock.calls[0]?.[0]);
  });

  it('says a refused file and a file too large for one call', async () => {
    const { container, cloud } = await opened('gm2');
    vi.spyOn(cloud.homebrew, 'import')
      .mockResolvedValueOnce({ ok: false, error: 'refused' })
      .mockResolvedValueOnce({ ok: false, error: 'refused', reason: 'tooSlow' });
    choose(container, fixture('example.json'));
    await userEvent.click(await importButton(5));
    expect(await alertText()).toBe(
      'Сервер не принял файл. Обновите страницу и выберите файл снова.'
    );
    await userEvent.click(await importButton(5));
    await waitFor(() => {
      expect(
        screen.getByText('Файл слишком большой для одного импорта: разделите его на несколько.')
      ).toBeInTheDocument();
    });
  });

  it('disables both buttons and the toggle while the call runs', async () => {
    const { container, cloud } = await opened('gm2');
    let open: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      open = r;
    });
    const real = cloud.homebrew.import.bind(cloud.homebrew);
    vi.spyOn(cloud.homebrew, 'import').mockImplementationOnce(async (rows) => {
      await gate;
      return real(rows);
    });
    choose(container, fixture('example.json'));
    await userEvent.click(await importButton(5));
    expect(await importButton(5)).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Импорт предметов' })).toBeDisabled();
    open();
    expect(await screen.findByText(/^Импортировано предметов: 3/)).toBeInTheDocument();
  });

  it('folds on «Отмена», forgets the file and focuses «Импорт предметов»', async () => {
    const { container } = await opened('gm2');
    choose(container, fixture('example.json'), 'example.json');
    await importButton(5);
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByText('Импорт предметов из файла JSON')).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Импорт предметов' });
    await waitFor(() => {
      expect(toggle).toHaveFocus();
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.queryByText('example.json')).toBeNull();
  });
});
