/* «Импорт из файла» on the lists index, over the fake cloud as gm1: the
 * preview of a clean file, the skips and the names the account holds grouped
 * by list, the error report, the one-line refusals of a file or a zip, and
 * the press - every list or none, the same rows on a retry
 * (docs/specs/FEATURES.md, "Lists"). The files are docs/fixtures/import/. */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { FILE_MAX_BYTES, ZIP_MAX_BYTES } from '../lib/bundle.js';
import { zipStored } from '../lib/zip.js';
import { fakeCloud } from '../ports/fake-cloud.js';
import { SEED, uuid } from '../ports/fake-cloud-seed.js';
import { fakeData, fakeDialog, fakeEnv, memoryRouter } from '../ports/index.js';
import { expectNoA11yViolations } from '../test/a11y.js';
import {
  LOOT,
  ROOT,
  alertText,
  cardNames,
  choose,
  doc,
  fixture,
  importButton,
  lineTexts,
  opened,
  utf8
} from '../test/importPanel.js';

afterEach(cleanup);

describe('the import field', () => {
  it('opens under the name row with the pick button, the hint and its two links', async () => {
    const { container } = await opened();
    expect(screen.getByText('Импорт из файла JSON')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Выбрать файл...' })).toBeInTheDocument();
    const schema = screen.getByRole('link', { name: 'схеме import-v1' });
    expect(schema).toHaveAttribute('href', 'schema/import-v1.json');
    expect(schema).toHaveAttribute('target', '_blank');
    expect(schema).toHaveAttribute('rel', 'noopener');
    const llms = screen.getByRole('link', { name: 'описание для ИИ-помощников' });
    expect(llms).toHaveAttribute('href', 'llms.txt');
    expect(llms).toHaveAttribute('target', '_blank');
    expect(container.querySelector('.hint')?.textContent.replace(/\s+/g, ' ').trim()).toBe(
      'Файл JSON, сохранённый кнопкой «Скачать JSON» или собранный по схеме import-v1 (описание для ИИ-помощников), или архив ZIP из «Скачать мои данные». Списки добавятся как новые; существующие не изменятся.'
    );
    const input = container.querySelector('input[type="file"]');
    expect(input).toHaveAttribute('accept', '.json,.zip,application/json,application/zip');
    await expectNoA11yViolations(container);
  });

  it('opens the picker from «Выбрать файл...»', async () => {
    const { container } = await opened();
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    const click = vi.spyOn(input!, 'click').mockImplementation(() => undefined);
    await userEvent.click(screen.getByRole('button', { name: 'Выбрать файл...' }));
    expect(click).toHaveBeenCalledOnce();
    await expectNoA11yViolations(container);
  });

  it('previews a clean file with no report', async () => {
    const { container } = await opened();
    /* example.json under a name gm1 does not hold. */
    const text = new TextDecoder().decode(fixture('example.json'));
    choose(container, utf8(text.replace('Лавка кузнеца', 'Новая лавка')), 'shop.json');
    await importButton(1);
    expect(container.querySelector('.preview')?.textContent.trim()).toBe(
      'Списков: 1, позиций: 3.'
    );
    expect(container.querySelector('.preview b')).toHaveTextContent('1');
    expect(screen.getByText('shop.json')).toHaveClass('fname');
    expect(container.querySelector('.rep')).toBeNull();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('notes a name the account holds in a file that is otherwise clean', async () => {
    const { container } = await opened();
    choose(container, fixture('example.json'), 'example.json');
    await importButton(1);
    const [block] = [...container.querySelectorAll('.rep-list')];
    expect(block?.querySelector('b')?.textContent).toBe('1. Лавка кузнеца');
    expect(lineTexts(block!)).toEqual([
      'Список с таким названием уже есть в аккаунте - появится второй'
    ]);
    await expectNoA11yViolations(container);
  });

  it('groups the skips and the names the account holds by list', async () => {
    const { container } = await opened();
    choose(container, fixture('unknown-id.json'));
    await importButton(2);
    expect(container.querySelector('.preview')?.textContent.replace(/\s+/g, ' ').trim()).toBe(
      'Списков: 2, позиций: 3. Пропущено позиций: 2.'
    );
    const blocks = [...container.querySelectorAll('.rep-list')];
    expect(blocks.map((b) => b.querySelector('b')?.textContent)).toEqual([
      '1. Лавка кузнеца',
      '2. Пустой список'
    ]);
    expect(blocks.map((b) => b.querySelector('small')?.textContent)).toEqual([
      '3 позиции будут импортированы',
      'без позиций'
    ]);
    expect(lineTexts(blocks[0]!)).toEqual([
      'Позиция 4, zzz1: пропущена - такой записи нет в данных',
      'Позиция 5, Первоклассный Спальный Мешок (ci1): пропущена - уже есть в позиции 1',
      'Список с таким названием уже есть в аккаунте - появится второй'
    ]);
    expect(lineTexts(blocks[1]!)).toEqual([
      'Список с таким названием уже есть в аккаунте - появится второй'
    ]);
    expect(blocks[0]?.querySelector('code')?.textContent).toBe('zzz1');
    await expectNoA11yViolations(container);
  });

  it('refuses a file with errors, grouped by list, each line with its record and path', async () => {
    const { container } = await opened();
    choose(container, fixture('errors.json'));
    expect(await alertText()).toBe(
      'В файле ошибки - ничего не импортировано. Исправьте их и выберите файл снова.'
    );
    const block = container.querySelector('.rep-list.bad');
    expect(block?.querySelector('b')?.textContent).toMatch(/^1\. .{40}\.\.\.$/u);
    expect(lineTexts(block!)).toEqual([
      'Название: длиннее 200 символов lists[0].name',
      'money_mode «gold»: допустимые значения - bag, coin lists[0].money_mode',
      'Позиция 2, Палаш (q1): quantity 0 - значение вне диапазона 1..99 lists[0].entries[1].quantity',
      'Позиция 3, Стеганый Доспех (q313): неизвестное поле qty lists[0].entries[2].qty'
    ]);
    expect(block?.querySelectorAll('code')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: /Импортировать/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('previews a version 2 file and imports its homebrew entries as frozen copies', async () => {
    const { container, cloud } = await opened();
    choose(container, fixture('example-v2.json'), 'example-v2.json');
    await userEvent.click(await importButton(1));
    expect(container.querySelector('.preview')).toBeNull();
    const read = await cloud.lists.list();
    const made = read.ok ? read.lists.find((l) => l.name === 'Лавка Ольхи') : undefined;
    expect(made?.list_entries.map((e) => [e.item_key, e.source, e.snapshot !== null])).toEqual([
      ['ci1', 'official', false],
      ['hb_flintlockpistola', 'homebrew', true],
      ['hb_wanderlampaaaaaa', 'homebrew', true]
    ]);
    await expectNoA11yViolations(container);
  });

  it('refuses a version 2 file with a bad snapshot and an id that is not a key, in words', async () => {
    const { container } = await opened();
    choose(container, fixture('errors-v2.json'));
    await alertText();
    const lines = lineTexts(container.querySelector('.rep-list.bad')!);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain(
      'snapshot: не копия предмета - сверьте поля с описанием в llms.txt lists[0].entries[1].snapshot'
    );
    expect(lines[1]).toContain(
      'id «lamp-1»: не ключ своего предмета - hb_ и 16 знаков a-z, 2-7 lists[0].entries[2].id'
    );
    await expectNoA11yViolations(container);
  });

  it("puts the file's own errors in the box, before any list", async () => {
    const { container } = await opened();
    choose(container, utf8(doc([{ name: 'L', entries: [] }], { extra: 1 })));
    await alertText();
    expect(lineTexts(container.querySelector('.errs')!)).toEqual([
      'неизвестное поле extra extra'
    ]);
    expect(container.querySelector('.rep')).toBeNull();
  });

  it.each([
    [
      'another version',
      fixture('v3.json'),
      'Неизвестная версия формата: 3. Приложение читает версии 1 и 2.'
    ],
    [
      'no version',
      utf8(JSON.stringify({ format: 'daggerheart-loot/lists', lists: [] })),
      'В файле нет поля version. Приложение читает версии 1 и 2.'
    ],
    [
      'an empty object',
      utf8('{}'),
      'Это не файл списков: нет поля format со значением daggerheart-loot/lists.'
    ],
    [
      'an array',
      utf8('[]'),
      'Это не файл списков: нет поля format со значением daggerheart-loot/lists.'
    ],
    ['text that is not JSON', utf8('not json'), 'Это не файл JSON.'],
    ['bytes that are not text', new Uint8Array([0x7b, 0xff]), 'Это не файл JSON.'],
    ['no lists', utf8(doc([])), 'В файле нет списков.'],
    [
      'garbage after the zip signature',
      new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]),
      'Это не архив данных.'
    ]
  ])('refuses %s in one line', async (_what, bytes, line) => {
    const { container } = await opened();
    choose(container, bytes);
    expect(await alertText()).toBe(line);
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('refuses a file over 5 MiB before reading it', async () => {
    const { container } = await opened();
    const big = new File([new Uint8Array(FILE_MAX_BYTES + 1)], 'big.json');
    const read = vi.spyOn(big, 'arrayBuffer');
    choose(container, big);
    expect(await alertText()).toBe('Файл больше 5 МБ.');
    expect(read).not.toHaveBeenCalled();
    await expectNoA11yViolations(container);
  });

  it('refuses a zip over 10 MiB before reading it', async () => {
    const { container } = await opened();
    const zip = new File(
      [new Uint8Array([0x50, 0x4b, 0x03, 0x04]), new Uint8Array(ZIP_MAX_BYTES)],
      'big.zip'
    );
    choose(container, zip);
    expect(await alertText()).toBe('Архив больше 10 МБ.');
  });

  it("previews the account's data zip", async () => {
    const { container } = await opened();
    choose(container, fixture('data.zip'), 'data.zip');
    await importButton(3);
    expect(container.querySelector('.preview')?.textContent.trim()).toMatch(/^Списков: 3,/);
    await expectNoA11yViolations(container);
  });

  it("names a zip's homebrew.json with its page, and the files it does not read", async () => {
    const { container } = await opened();
    const at = new Date('2026-10-01T12:00:00Z');
    choose(
      container,
      zipStored(
        [
          { name: 'lists.json', bytes: fixture('example.json') },
          { name: 'homebrew.json', bytes: utf8('{}') },
          { name: 'notes.txt', bytes: utf8('') }
        ],
        at
      )
    );
    await importButton(1);
    expect(
      [...container.querySelectorAll('.preview')].map((p) => p.textContent.trim())
    ).toEqual([
      'Списков: 1, позиций: 3.',
      'Файл homebrew.json из архива импортируется на странице «Мои предметы».',
      'В архиве есть файлы, которые эта версия не читает: notes.txt.'
    ]);
  });

  it('refuses a zip with two lists.json at one depth, and one another program compressed', async () => {
    const at = new Date('2026-10-01T12:00:00Z');
    const two = zipStored(
      [
        { name: 'a/lists.json', bytes: fixture('example.json') },
        { name: 'b/lists.json', bytes: fixture('example.json') }
      ],
      at
    );
    const first = await opened();
    choose(first.container, two);
    expect(await alertText()).toBe(
      'В архиве несколько файлов lists.json: распакуйте его и выберите нужный.'
    );
    cleanup();

    /* Method 8 in both headers: the reader leaves the bytes alone. */
    const packed = zipStored([{ name: 'lists.json', bytes: fixture('example.json') }], at);
    const v = new DataView(packed.buffer);
    v.setUint16(8, 8, true);
    const central = packed.length - 22 - 46 - 'lists.json'.length;
    v.setUint16(central + 10, 8, true);
    const second = await opened();
    choose(second.container, packed);
    expect(await alertText()).toBe(
      'Архив сжат другой программой: распакуйте его и выберите lists.json.'
    );
    cleanup();

    const none = zipStored([{ name: 'homebrew.json', bytes: utf8('{}') }], at);
    const third = await opened();
    choose(third.container, none);
    expect(await alertText()).toBe('В архиве нет файла lists.json.');
  });

  it('names a bad id and an empty name in words', async () => {
    const { container } = await opened();
    choose(container, utf8(doc([{ name: '', entries: [{ id: 'ci 1' }] }])));
    await alertText();
    expect(lineTexts(container.querySelector('.rep-list')!)).toEqual([
      'Название: пустое или отсутствует lists[0].name',
      'Позиция 1: id «ci 1»: не id записи - только латинские буквы, цифры, _ и -, до 64 символов lists[0].entries[0].id'
    ]);
    expect(container.querySelector('.rep-list b')?.textContent).toBe('1. (без названия)');
  });

  it('draws ten lines of a list, then counts the rest of it and of the file', async () => {
    const { container } = await opened();
    const entries = (n: number) => Array.from({ length: n }, () => ({ id: 'ci1', qty: 2 }));
    choose(
      container,
      utf8(
        doc([
          { name: 'А', entries: entries(11) },
          { name: 'Б', entries: entries(40) }
        ])
      )
    );
    await alertText();
    const [a, b] = [...container.querySelectorAll('.rep-list')];
    expect(lineTexts(a!)).toHaveLength(11);
    expect(lineTexts(a!).at(-1)).toBe('...и ещё 1 в этом списке');
    expect(lineTexts(b!).at(-1)).toBe('...и ещё 29 в этом списке');
    expect(container.querySelector('.rep-more')?.textContent).toBe('...и ещё 1 ошибка');
  });
});

describe('own items in a lists file', () => {
  const hbFixture = (name: string): Uint8Array =>
    new Uint8Array(readFileSync(join(ROOT, 'docs', 'fixtures', 'homebrew-file', name)));

  it('says how many own items the account lacks: they import as frozen copies', async () => {
    const { container } = await opened();
    choose(container, fixture('example-v2.json'));
    await importButton(1);
    expect(
      [...container.querySelectorAll('.preview')].map((p) => p.textContent.trim())
    ).toEqual([
      'Списков: 1, позиций: 3.',
      'Своих предметов, которых нет в аккаунте: 2 - они сохранятся копиями. Чтобы они остались живыми, сначала импортируйте предметы на странице «Мои предметы».'
    ]);
    await expectNoA11yViolations(container);
  });

  it('waits for the account items before the preview of a file with own items', async () => {
    const cloud = fakeCloud(SEED, 'gm1');
    let open: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      open = r;
    });
    const load = cloud.homebrew.load.bind(cloud.homebrew);
    vi.spyOn(cloud.homebrew, 'load').mockImplementationOnce(async () => {
      await gate;
      return load();
    });
    const { container } = render(App, {
      env: fakeEnv({
        router: memoryRouter('#/lists'),
        data: fakeData(LOOT),
        dialog: fakeDialog(),
        cloud
      })
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Импорт из файла' }));
    choose(container, fixture('example-v2.json'));
    expect(
      await screen.findByText('Ваши предметы ещё загружаются - повторите через секунду.')
    ).toHaveAttribute('role', 'status');
    expect(screen.queryByRole('button', { name: /Импортировать/ })).toBeNull();
    await expectNoA11yViolations(container);
    open();
    expect(await importButton(1)).toBeInTheDocument();
  });

  it('refuses a snapshot without a text the schema requires', async () => {
    const { container } = await opened();
    const v2 = JSON.parse(new TextDecoder().decode(fixture('example-v2.json'))) as {
      lists: { entries: { snapshot?: Record<string, unknown> }[] }[];
    };
    const snap = v2.lists[0]?.entries[1]?.snapshot;
    if (snap) delete snap['rud'];
    choose(container, utf8(JSON.stringify(v2)));
    await alertText();
    expect(lineTexts(container.querySelector('.rep-list.bad')!)).toEqual([
      expect.stringContaining(
        'snapshot: не копия предмета - сверьте поля с описанием в llms.txt lists[0].entries[1].snapshot'
      )
    ]);
  });

  /* The axe's snapshot as gm1's lists export writes it. */
  const axeSnapshot = (): unknown => {
    const exported = JSON.parse(new TextDecoder().decode(fixture('export-v2.json'))) as {
      lists: { entries: { id: string; snapshot?: unknown }[] }[];
    };
    return exported.lists.flatMap((l) => l.entries).find((e) => e.id === 'hb_emberaxeaaaaaaaa')
      ?.snapshot;
  };

  it('says a reference the server refused, keeps the preview and freezes it on the next press', async () => {
    const { container, cloud } = await opened();
    /* The axe gm1 holds, as a reference, deleted on another device after the preview. */
    const text = JSON.stringify({
      format: 'daggerheart-loot/lists',
      version: 2,
      lists: [
        {
          name: 'Топоры',
          entries: [
            {
              id: 'hb_emberaxeaaaaaaaa',
              source: 'homebrew',
              snapshot: axeSnapshot()
            }
          ]
        }
      ]
    });
    choose(container, utf8(text));
    const button = await importButton(1);
    expect(container.querySelectorAll('.preview')).toHaveLength(1);
    const read = await cloud.homebrew.load();
    const axe = read.ok ? read.items.find((i) => i.key === 'hb_emberaxeaaaaaaaa') : undefined;
    const imp = vi.spyOn(cloud.lists, 'import');
    const remove = cloud.homebrew.removeItem.bind(cloud.homebrew);
    /* The database's 23503: the reference names an item gone since the preview. */
    imp.mockImplementationOnce(async () => {
      await remove(axe!.id);
      return { ok: false, error: 'refused' };
    });
    await userEvent.click(button);
    expect(await alertText()).toBe(
      'Сервер не принял файл: данные в аккаунте изменились. Нажмите «Импортировать» ещё раз.'
    );
    expect(await importButton(1)).toBeEnabled();
    await waitFor(() => {
      expect(
        screen.getByText(/Своих предметов, которых нет в аккаунте: 1/)
      ).toBeInTheDocument();
    });
    await userEvent.click(await importButton(1));
    expect(await screen.findByText('Импортировано списков: 1')).toBeInTheDocument();
    const sent = imp.mock.calls[1]?.[0];
    expect(sent?.[0]?.entries[0]?.snapshot).not.toBeNull();
    expect(sent?.[0]?.list.id).toBe(imp.mock.calls[0]?.[0][0]?.list.id);
  });

  it('imports bedroll-shop.json as live references after bedrolls.json, else as frozen copies', async () => {
    const { container, cloud } = await opened();
    const file = JSON.parse(new TextDecoder().decode(hbFixture('bedrolls.json'))) as {
      books: { key: string; en?: string; ru?: string; sections?: unknown[] }[];
      cards: { key: string; kind: 'set' | 'ref'; book?: string }[];
      items: { key: string; book?: string }[];
    };
    choose(container, fixture('bedroll-shop.json'));
    await importButton(1);
    expect(screen.getByText(/Своих предметов, которых нет в аккаунте: 6/)).toBeInTheDocument();
    cleanup();
    await cloud.homebrew.import({
      books: file.books.map(({ key, ...content }, i) => ({
        id: uuid(8000 + i),
        key,
        content: content as never,
        names: true
      })),
      cards: file.cards.map(({ key, kind, book, ...content }, i) => ({
        id: uuid(8100 + i),
        key,
        kind,
        book: book ?? null,
        content
      })),
      items: file.items.map(({ key, book, ...content }, i) => ({
        id: uuid(8200 + i),
        key,
        book: book ?? null,
        content: content as never
      })),
      update: false
    });
    const view = render(App, {
      env: fakeEnv({
        router: memoryRouter('#/lists'),
        data: fakeData(LOOT),
        dialog: fakeDialog(),
        cloud
      })
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Импорт из файла' }));
    choose(view.container, fixture('bedroll-shop.json'));
    await userEvent.click(await importButton(1));
    expect(await screen.findByText('Импортировано списков: 1')).toBeInTheDocument();
    const lists = await cloud.lists.list();
    const shop = lists.ok ? lists.lists.find((l) => l.name === 'Лавка спальников') : undefined;
    expect(shop?.list_entries.map((e) => [e.source, e.snapshot === null])).toEqual([
      ['official', true],
      ...file.items.map(() => ['homebrew', true])
    ]);
  });
});

describe('the press', () => {
  it('imports every list, toasts, folds the field and draws the new card first', async () => {
    const { container, cloud } = await opened();
    const imp = vi.spyOn(cloud.lists, 'import');
    choose(container, fixture('example.json'));
    await userEvent.click(await importButton(1));
    expect(await screen.findByText('Импортировано списков: 1')).toBeInTheDocument();
    expect(imp).toHaveBeenCalledOnce();
    expect(imp.mock.calls[0]?.[0]).toHaveLength(1);
    expect(screen.queryByText('Импорт из файла JSON')).toBeNull();
    await waitFor(() => {
      expect(cardNames(container)).toEqual([
        'Лавка кузнеца',
        'Пустой список',
        'Лавка кузнеца',
        'Трофеи'
      ]);
    });
    await expectNoA11yViolations(container);
  });

  it('keeps the preview after a lost answer and sends the same rows again', async () => {
    const { container, cloud } = await opened();
    const imp = vi.spyOn(cloud.lists, 'import');
    choose(container, fixture('example.json'));
    const button = await importButton(1);
    cloud.setOffline(true);
    await userEvent.click(button);
    expect(await alertText()).toBe('Не получилось. Проверьте соединение и попробуйте ещё раз.');
    expect(await importButton(1)).toBeEnabled();
    cloud.setOffline(false);
    await userEvent.click(await importButton(1));
    expect(await screen.findByText('Импортировано списков: 1')).toBeInTheDocument();
    expect(imp).toHaveBeenCalledTimes(2);
    expect(imp.mock.calls[1]?.[0]).toEqual(imp.mock.calls[0]?.[0]);
  });

  it('disables both buttons while the call runs', async () => {
    const { container, cloud } = await opened();
    let open: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      open = r;
    });
    const real = cloud.lists.import.bind(cloud.lists);
    vi.spyOn(cloud.lists, 'import').mockImplementationOnce(async (rows) => {
      await gate;
      return real(rows);
    });
    choose(container, fixture('example.json'));
    await userEvent.click(await importButton(1));
    expect(await importButton(1)).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Импорт из файла' })).toBeDisabled();
    await expectNoA11yViolations(container);
    open();
    expect(await screen.findByText('Импортировано списков: 1')).toBeInTheDocument();
  });

  it('says the list limit and keeps the preview, the account unchanged', async () => {
    const { container, cloud } = await opened({ limits: { lists: 3 } });
    choose(container, fixture('example.json'));
    await userEvent.click(await importButton(1));
    expect(await alertText()).toBe(
      'Достигнут предел списков в аккаунте: 3. Нужно больше - напишите на daggerheart.loot@gmail.com.'
    );
    expect(await importButton(1)).toBeEnabled();
    const read = await cloud.lists.list();
    expect(read.ok ? read.lists : null).toHaveLength(3);
  });

  /* One list of 150 distinct catalog ids: past the default entry limit, inside the file's. */
  const longList = (): Uint8Array =>
    utf8(
      doc([
        {
          name: 'Склад',
          entries: [...Object.values(LOOT.items).flat(), ...(LOOT.eq ?? [])]
            .map((r) => ({ id: r.id }))
            .slice(0, 150)
        }
      ])
    );

  it("imports a list past the default entry limit when the account's limit allows it", async () => {
    const { container, cloud } = await opened({ limits: { entries: 200 } });
    choose(container, longList());
    await userEvent.click(await importButton(1));
    expect(await screen.findByText('Импортировано списков: 1')).toBeInTheDocument();
    const read = await cloud.lists.list();
    const made = read.ok ? read.lists.find((l) => l.name === 'Склад') : undefined;
    expect(made?.list_entries).toHaveLength(150);
  });

  it("says the account's entry limit for a list past it, the account unchanged", async () => {
    const { container, cloud } = await opened();
    choose(container, longList());
    await userEvent.click(await importButton(1));
    expect(await alertText()).toBe(
      'Достигнут предел позиций в списке: 100. Нужно больше - напишите на daggerheart.loot@gmail.com.'
    );
    const read = await cloud.lists.list();
    expect(read.ok ? read.lists : null).toHaveLength(3);
  });

  it('says a file too large for one import', async () => {
    const { container, cloud } = await opened();
    vi.spyOn(cloud.lists, 'import').mockResolvedValueOnce({
      ok: false,
      error: 'refused',
      reason: 'tooSlow'
    });
    choose(container, fixture('example.json'));
    await userEvent.click(await importButton(1));
    expect(await alertText()).toBe(
      'Файл слишком большой для одного импорта: разделите его на несколько.'
    );
  });

  it('folds on «Отмена», forgets the file and focuses «Импорт из файла»', async () => {
    const { container } = await opened();
    choose(container, fixture('example.json'));
    await importButton(1);
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(screen.queryByText('Импорт из файла JSON')).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Импорт из файла' });
    await waitFor(() => {
      expect(toggle).toHaveFocus();
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.queryByText('example.json')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Импорт из файла' }));
    expect(screen.queryByText('Импорт из файла JSON')).toBeNull();
    await expectNoA11yViolations(container);
  });
});
