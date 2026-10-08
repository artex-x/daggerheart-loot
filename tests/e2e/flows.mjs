/* The account flows in a real browser over the configured `dist/`, on the
 * test project: F0 the page probe, F1 signed out, F2 the member's page, F3
 * sign-out, F4 sign-out everywhere, F5 delete account, F6 a preference read
 * back on a fresh session, F7 an account list made, filled, renamed, read
 * back from the server and deleted, F8 its share links made, read, deleted,
 * made again and copied, F9 a browser list moved into the account at
 * sign-in, once, and not for another account, F10 two edits kept by a page
 * closed inside the write buffer's quiet window, F11 an edit drawn live on an
 * open share page and on the owner's second page, F12 a purchase request sent
 * signed out, drawn on the owner's page and applied, F13 a lists file imported
 * through «Импорт из файла» and two lists deleted together, F14 a homebrew source
 * with a section, an item in them edited and deleted, F15 an own item in a list as a
 * link, its rename read through a players' link, and «Свой предмет», F16 an own
 * item's relations picked by name with a rule card made inline, F17 a homebrew file imported
 * through «Импорт из файла» of «Мои предметы», imported again with «Обновить», two items moved together, the
 * data zip's homebrew.json read back, and a version 2 lists file imported with a held item
 * and a copied one, F18 an item's `#/h/` address opened signed out, F19 an entry marked GM only
 * on the owner's page leaving an open players' page live, and coming back. Each flow gets its own
 * browser context, the
 * browser suites' `prepare()` and driver, and - when it has one - a minted
 * session written where supabase-js keeps it. Nothing here prints,
 * screenshots or throws a value of an `E2E_*` variable or the member's
 * address: comparisons run in the page with the value as an argument.
 * docs/specs/COVERAGE.md, "Test layers". */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readDataZip } from '../../app/src/lib/zip.ts';
import {
  createThrowaway,
  deleteHomebrewOf,
  deleteListsOf,
  homebrewOf,
  listsOf,
  mint,
  prefsOf,
  refreshRefused,
  sharesOf,
  userGone
} from './admin.mjs';
import { portOf } from './contract.mjs';
import { storageKey } from './lib.mjs';
import { probePage } from './probe.mjs';

const { makeDriver, prepare } = createRequire(import.meta.url)('../app/driver.js');

const WAIT = { timeout: 20_000, polling: 100 };

/* A control's name the way the driver reads it: label, then text. */
const NAMED = (sel, name) =>
  [...document.querySelectorAll(sel)].some(
    (e) =>
      (e.getAttribute('aria-label') || e.textContent || '').replace(/\s+/g, ' ').trim() === name
  );

async function waitFor(page, what, fn, ...args) {
  try {
    await page.waitForFunction(fn, WAIT, ...args);
  } catch {
    throw new Error(what);
  }
}

const waitControl = (page, flow, name) =>
  waitFor(page, 'e2e ' + flow + ': no control «' + name + '»', NAMED, 'button, a[href]', name);

const waitText = (page, flow, text) =>
  waitFor(
    page,
    'e2e ' + flow + ': the page never said «' + text + '»',
    (t) => document.body.textContent.includes(t),
    text
  );

/* Polls `fn` in Node, 250 ms apart, 10 s at most. */
async function until(what, fn) {
  for (let waited = 0; ; waited += 250) {
    if (await fn()) return;
    if (waited >= 10_000) throw new Error('e2e ' + what);
    await new Promise((r) => setTimeout(r, 250));
  }
}

/* A live redraw: 10 s at most, far below the 45 s poll. */
async function within10(page, what, fn, ...args) {
  try {
    await page.waitForFunction(fn, { timeout: 10_000, polling: 100 }, ...args);
  } catch {
    throw new Error('e2e ' + what);
  }
}

async function expectInPage(page, flow, what, fn, ...args) {
  if (!(await page.evaluate(fn, ...args))) throw new Error('e2e ' + flow + ': ' + what);
}

async function withPage({ browser, base, env }, session, run, seed = null) {
  const ctx = await browser.createBrowserContext();
  try {
    const page = await ctx.newPage();
    await prepare(page);
    /* After prepare()'s own clear, on every document: browser lists. */
    if (seed) {
      await page.evaluateOnNewDocument((kv) => {
        try {
          for (const k of Object.keys(kv)) localStorage.setItem(k, kv[k]);
        } catch {
          /* about:blank has no storage */
        }
      }, seed);
    }
    if (session) {
      await page.evaluateOnNewDocument(
        (k, v) => {
          try {
            localStorage.setItem(k, v);
          } catch {
            /* about:blank has no storage */
          }
        },
        storageKey(env.E2E_SUPABASE_URL),
        JSON.stringify(session)
      );
    }
    await page.setViewport({ width: 1180, height: 900 });
    await run(page, makeDriver(page, 'e2e', base + 'index.html'));
  } finally {
    await ctx.close();
  }
}

async function chooser(page, flow) {
  await waitControl(page, flow, 'Войти через Google');
  await waitControl(page, flow, 'Войти через Discord');
}

export async function runFlows({ env, admin, member, browser, base }) {
  const ctx = { browser, base, env };
  const key = storageKey(env.E2E_SUPABASE_URL);

  /* F0 and F1: the page probe, then the signed-out page. */
  await withPage(ctx, null, async (page, d) => {
    await d.open('#/account');
    await probePage(page, env);
    console.log('e2e: F0 ok');
    await chooser(page, 'F1');
    await waitFor(
      page,
      'e2e F1: the header link to #/account does not read «Войти»',
      () =>
        document.querySelector('header a[href="#/account"]')?.textContent?.trim() === 'Войти'
    );
    console.log('e2e: F1 ok');
  });

  /* F2: the member's header and page, identities read by the real client. */
  await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
    await d.open('#/roll/std');
    await waitFor(
      page,
      "e2e F2: the header does not name the member's email",
      (email) =>
        document
          .querySelector('header button[aria-haspopup="menu"]')
          ?.getAttribute('aria-label') ===
        'Аккаунт: ' + email,
      member.email
    );
    await d.open('#/account');
    await waitText(page, 'F2', 'Вы вошли как');
    await waitControl(page, 'F2', 'Подключить Google');
    await waitControl(page, 'F2', 'Подключить Discord');
    await expectInPage(
      page,
      'F2',
      "the page does not show the member's email, alone",
      (email) =>
        [...document.querySelectorAll('main b')].some((b) => b.textContent === email) &&
        !document.querySelector('main .via'),
      member.email
    );
    await expectInPage(
      page,
      'F2',
      'the providers section is not two rows reading «не подключён»',
      () => {
        const rows = [...document.querySelectorAll('main li')];
        return (
          document.body.textContent.includes('Способы входа') &&
          rows.length === 2 &&
          rows.every((r) => r.textContent.includes('не подключён'))
        );
      }
    );
    await expectInPage(
      page,
      'F2',
      'there is a Disconnect, the only-method hint or an alert',
      () =>
        ![...document.querySelectorAll('button')].some((b) =>
          (b.getAttribute('aria-label') || b.textContent).includes('Отключить')
        ) &&
        !document.body.textContent.includes('единственный способ входа') &&
        !document.querySelector('[role="alert"]')
    );
    console.log('e2e: F2 ok');
  });

  /* F3: sign out here; that session ends on the server. */
  const s1 = await mint(env, admin, member.email);
  await withPage(ctx, s1, async (page, d) => {
    await d.open('#/account');
    await waitControl(page, 'F3', 'Выйти');
    await d.press('Выйти');
    await waitText(page, 'F3', 'Вы вышли из аккаунта.');
    await chooser(page, 'F3');
    await expectInPage(
      page,
      'F3',
      'the session is still in localStorage',
      (k) => localStorage.getItem(k) === null,
      key
    );
  });
  if (!(await refreshRefused(env, s1.refresh_token))) {
    throw new Error('e2e F3: the signed-out session still refreshes');
  }
  console.log('e2e: F3 ok');

  /* F4: sign out everywhere; a session never opened here ends too. */
  const s2 = await mint(env, admin, member.email);
  const s3 = await mint(env, admin, member.email);
  await withPage(ctx, s2, async (page, d) => {
    await d.open('#/account');
    await waitControl(page, 'F4', 'Выйти на всех устройствах');
    await d.press('Выйти на всех устройствах');
    await waitText(page, 'F4', 'Вы вышли из аккаунта.');
    await chooser(page, 'F4');
  });
  if (!(await refreshRefused(env, s3.refresh_token))) {
    throw new Error("e2e F4: another device's session still refreshes");
  }
  console.log('e2e: F4 ok');

  /* F5: delete a throwaway account; the user is gone on the server. */
  const doomed = await createThrowaway(admin, member.email);
  await withPage(ctx, await mint(env, admin, doomed.email), async (page, d) => {
    await d.open('#/account');
    await waitControl(page, 'F5', 'Удалить аккаунт...');
    await d.press('Удалить аккаунт...');
    await d.type('', 'удалить');
    await waitFor(page, 'e2e F5: «Удалить навсегда» stays disabled', () =>
      [...document.querySelectorAll('button')].some(
        (b) => b.textContent.trim() === 'Удалить навсегда' && !b.disabled
      )
    );
    await d.press('Удалить навсегда');
    await waitText(page, 'F5', 'Аккаунт удалён.');
    await chooser(page, 'F5');
  });
  if (!(await userGone(admin, doomed.id))) {
    throw new Error('e2e F5: the deleted user still exists');
  }
  console.log('e2e: F5 ok');

  /* F6: a first sign-in seeds the account's row from this browser, «EN»
     writes it, and a fresh session with cleared storage reads it back. */
  const reader = await createThrowaway(admin, member.email);
  const langOf = async () => (await prefsOf(admin, reader.id))?.lang;
  const english = () => document.documentElement.lang === 'en';
  await withPage(ctx, await mint(env, admin, reader.email), async (page, d) => {
    await d.open('#/roll/std');
    await until('F6: the first sign-in did not seed the row with ru', async () => {
      return (await langOf()) === 'ru';
    });
    await d.press('EN');
    await waitFor(page, 'e2e F6: «EN» did not turn the page English', english);
    await until('F6: «EN» did not write en to the row', async () => (await langOf()) === 'en');
  });
  await withPage(ctx, await mint(env, admin, reader.email), async (page, d) => {
    await d.open('#/roll/std');
    await waitFor(page, 'e2e F6: a fresh session did not read English back', english);
    await expectInPage(
      page,
      'F6',
      'dhloot.lang.v1 does not read en',
      () => localStorage.getItem('dhloot.lang.v1') === 'en'
    );
  });
  console.log('e2e: F6 ok');

  /* F7: an account list, from the index and the add-to-list menu, through
     the real repository; the rows are read back by the service role. */
  await deleteListsOf(admin, member.id);
  try {
    const mine = () => listsOf(admin, member.id);
    await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
      await d.open('#/lists');
      await waitText(page, 'F7', 'Ваш аккаунт');
      await waitText(page, 'F7', 'В аккаунте пока нет списков');
      await d.type('Например: клад дракона', 'E2E список');
      await d.press('Создать');
      await until('F7: the new list did not reach the account', async () => {
        const rows = await mine();
        return rows.length === 1 && rows[0].name === 'E2E список';
      });
      const [made] = await mine();

      await d.open('#/i/ci1');
      await waitControl(page, 'F7', 'Добавить в список');
      await d.press('Добавить в список');
      await waitControl(page, 'F7', 'E2E список');
      await d.press('E2E список');
      await until('F7: ci1 did not reach the list', async () => {
        const [row] = await mine();
        return row?.list_entries.some((e) => e.item_key === 'ci1') ?? false;
      });

      await d.open('#/lists/' + made.id);
      await waitText(page, 'F7', 'Сохранено');
      await d.type('Название списка', 'E2E список 2');
      await until('F7: the new name did not reach the account', async () => {
        const [row] = await mine();
        return row?.name === 'E2E список 2';
      });
      await d.open('#/lists/' + made.id);
      await waitFor(
        page,
        'e2e F7: a reload did not read the new name and the row back',
        () =>
          document.querySelector('input.titleinput')?.value === 'E2E список 2' &&
          document.querySelectorAll('.lrow').length === 1
      );
      await expectInPage(
        page,
        'F7',
        'the address left #/lists/<id>',
        (id) => location.hash === '#/lists/' + id,
        made.id
      );

      await d.press('Удалить');
      await waitText(page, 'F7', 'Список «E2E список 2» удалён');
      await until(
        'F7: the list is still in the account',
        async () => (await mine()).length === 0
      );
    });
  } finally {
    await deleteListsOf(admin, member.id);
  }
  console.log('e2e: F7 ok');

  /* F8: an account list's share links through the real repository: made on
     the panel's open, read signed out and by the owner, deleted and made
     again, and copied by another user. The rows are read by the service
     role. */
  await deleteListsOf(admin, member.id);
  try {
    const mine = () => listsOf(admin, member.id);
    let listId = '';
    const active = async (audience) =>
      (await sharesOf(admin, listId)).find(
        (s) => s.audience === audience && s.revoked_at === null
      );
    const tokens = {};
    await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
      await d.open('#/lists');
      await waitText(page, 'F8', 'Ваш аккаунт');
      await d.type('Например: клад дракона', 'E2E ссылки');
      await d.press('Создать');
      await until('F8: the new list did not reach the account', async () => {
        const rows = await mine();
        return rows.length === 1 && rows[0].name === 'E2E ссылки';
      });
      listId = (await mine())[0].id;

      await d.open('#/i/ci1');
      await waitControl(page, 'F8', 'Добавить в список');
      await d.press('Добавить в список');
      await waitControl(page, 'F8', 'E2E ссылки');
      await d.press('E2E ссылки');
      await until('F8: ci1 did not reach the list', async () => {
        const [row] = await mine();
        return row?.list_entries.some((e) => e.item_key === 'ci1') ?? false;
      });

      await d.open('#/lists/' + listId);
      await waitText(page, 'F8', 'Сохранено');
      await d.press('Заметки');
      await d.type('Например: лавка закрыта до утра', 'Игрокам E2E');
      await d.type('Например: позиции 9-10 лежат под прилавком', 'Мастеру E2E');
      await until('F8: the GM note did not reach the account', async () => {
        const [row] = await mine();
        return row?.gm_note === 'Мастеру E2E';
      });
      await waitText(page, 'F8', 'Сохранено');

      await d.press('Поделиться');
      await waitFor(
        page,
        'e2e F8: the panel did not show two links',
        () => document.querySelectorAll('.sharelink').length === 2
      );
      await until('F8: the account does not hold two active links', async () => {
        return !!(await active('player')) && !!(await active('gm'));
      });
      tokens.player = (await active('player')).token;
      tokens.gm = (await active('gm')).token;
    });

    await withPage(ctx, null, async (page, d) => {
      await d.open('#/s/' + tokens.player);
      await waitText(page, 'F8', 'E2E ссылки');
      await waitText(page, 'F8', 'Игрокам E2E');
      await waitText(page, 'F8', 'Обновлено');
      await expectInPage(
        page,
        'F8',
        'the players link shows the GM note',
        () => !document.body.textContent.includes('Мастеру E2E')
      );
      await d.open('#/s/' + tokens.gm);
      await waitText(page, 'F8', 'Мастеру E2E');
    });

    await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
      await d.open('#/s/' + tokens.player);
      await waitText(page, 'F8', 'Это ваш список.');
      await d.open('#/lists/' + listId);
      await waitControl(page, 'F8', 'Поделиться');
      await d.press('Поделиться');
      await waitFor(
        page,
        'e2e F8: the panel did not show two links',
        () => document.querySelectorAll('.sharelink').length === 2
      );
      await d.press('Удалить ссылку');
      await waitText(page, 'F8', 'Ссылка удалена');
      await until(
        'F8: the players link is still active',
        async () => !(await active('player'))
      );
      await d.press('Создать ссылку');
      await until('F8: no new players link', async () => !!(await active('player')));
      tokens.newPlayer = (await active('player')).token;
      await d.press('Удалить ссылку', 1);
      await until('F8: the GM link is still active', async () => !(await active('gm')));
    });

    await withPage(ctx, null, async (page, d) => {
      await d.open('#/s/' + tokens.player);
      await waitText(page, 'F8', 'Список больше не доступен');
      await d.open('#/s/' + tokens.gm);
      await waitText(page, 'F8', 'Список больше не доступен');
      await d.open('#/s/' + tokens.newPlayer);
      await waitText(page, 'F8', 'E2E ссылки');
    });

    const copier = await createThrowaway(admin, member.email);
    await withPage(ctx, await mint(env, admin, copier.email), async (page, d) => {
      await d.open('#/s/' + tokens.newPlayer);
      await waitText(page, 'F8', 'E2E ссылки');
      await waitFor(
        page,
        'e2e F8: the copier is not signed in',
        () =>
          document
            .querySelector('header button[aria-haspopup="menu"]')
            ?.getAttribute('aria-label')
            ?.startsWith('Аккаунт: ') ?? false
      );
      await d.press('Сохранить себе');
      await waitFor(
        page,
        'e2e F8: «Сохранить себе» did not open the copy',
        () =>
          location.hash.startsWith('#/lists/') &&
          document.querySelector('input.titleinput')?.value === 'E2E ссылки'
      );
      await until('F8: the copy in the account holds a GM note', async () => {
        const rows = await listsOf(admin, copier.id);
        return (
          rows.length === 1 &&
          rows[0].gm_note === '' &&
          rows[0].list_entries.every((e) => e.gm_note === '')
        );
      });
    });
  } finally {
    await deleteListsOf(admin, member.id);
  }
  console.log('e2e: F8 ok');

  /* F9: a browser list moves into the account at sign-in through the real
     `move_legacy_list`: once, found again by its fingerprint from a second
     browser, and never for an account that is not the browser's first. */
  await deleteListsOf(admin, member.id);
  try {
    const seed = {
      'dhloot.lists.v2': JSON.stringify([
        {
          id: 'e2e1',
          name: 'E2E перенос',
          ids: ['ci1'],
          meta: { ci1: { qty: 2, gold: 150, note: 'e2e f9' } },
          created: 1
        }
      ])
    };
    const mine = () => listsOf(admin, member.id);
    const settled = (page, flow) =>
      waitFor(page, 'e2e ' + flow + ': the move did not settle', () =>
        ['done', 'failed'].includes(document.querySelector('main')?.dataset.move ?? '')
      );
    const storedOf = (page) =>
      page.evaluate(() => ({
        lists: localStorage.getItem('dhloot.lists.v2'),
        migrated: JSON.parse(localStorage.getItem('dhloot.migrated.v1') ?? 'null')
      }));
    let moved = '';
    await withPage(
      ctx,
      await mint(env, admin, member.email),
      async (page, d) => {
        await d.open('#/lists');
        await waitText(page, 'F9', 'Ваш аккаунт');
        await settled(page, 'F9');
        await waitText(page, 'F9', 'перенесены в ваш аккаунт: «E2E перенос».');
        const rows = await mine();
        const row = rows[0];
        if (
          rows.length !== 1 ||
          !/^[0-9a-f]{64}$/.test(row.legacy_fingerprint ?? '') ||
          row.list_entries.length !== 1 ||
          row.list_entries[0].item_key !== 'ci1' ||
          row.list_entries[0].quantity !== 2 ||
          row.list_entries[0].price_coins !== 150
        ) {
          throw new Error('e2e F9: the account does not hold the moved list once');
        }
        moved = row.id;
        const stored = await storedOf(page);
        if (
          stored.lists !== '[]' ||
          stored.migrated?.owner !== member.id ||
          stored.migrated?.lists?.e2e1 !== moved
        ) {
          throw new Error('e2e F9: the browser does not hold the tombstone of the move');
        }
        await waitFor(page, 'e2e F9: the moved list is not in «Ваш аккаунт»', () =>
          [...document.querySelectorAll('.listcard b')].some(
            (b) => b.textContent === 'E2E перенос'
          )
        );
      },
      seed
    );
    /* A second browser with the same list: the same row, no second one. */
    await withPage(
      ctx,
      await mint(env, admin, member.email),
      async (page, d) => {
        await d.open('#/lists');
        await settled(page, 'F9');
        const rows = await mine();
        if (rows.length !== 1 || rows[0].id !== moved) {
          throw new Error('e2e F9: a second browser made a second row');
        }
        if ((await storedOf(page)).lists !== '[]') {
          throw new Error('e2e F9: the second browser kept its copy');
        }
      },
      seed
    );
    /* A browser whose lists are the member's: another account moves nothing. */
    const other = await createThrowaway(admin, member.email);
    await withPage(
      ctx,
      await mint(env, admin, other.email),
      async (page, d) => {
        await d.open('#/lists');
        await settled(page, 'F9');
        await waitText(page, 'F9', 'E2E перенос');
        if ((await listsOf(admin, other.id)).length !== 0) {
          throw new Error("e2e F9: another account's sign-in moved the member's list");
        }
      },
      { ...seed, 'dhloot.migrated.v1': JSON.stringify({ owner: member.id, lists: {} }) }
    );
  } finally {
    await deleteListsOf(admin, member.id);
  }
  console.log('e2e: F9 ok');

  /* F10: two edits, then the page is closed less than 500 ms after the last
     key - inside the buffer's 2 s window - and both reach the account (the
     `pagehide` flush). It does not prove the `keepalive` flag: a plain fetch
     passes here too (measured 2026-09-26 on this host); the flag is proven by
     `supabase.test.ts` (docs/specs/COVERAGE.md, "Test layers"). */
  await deleteListsOf(admin, member.id);
  try {
    const mine = () => listsOf(admin, member.id);
    await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
      await d.open('#/lists');
      await waitText(page, 'F10', 'Ваш аккаунт');
      await d.type('Например: клад дракона', 'E2E закрытие');
      await d.press('Создать');
      await until('F10: the new list did not reach the account', async () => {
        const rows = await mine();
        return rows.length === 1 && rows[0].name === 'E2E закрытие';
      });
      const [made] = await mine();
      await d.open('#/lists/' + made.id);
      await waitText(page, 'F10', 'Сохранено');
      await d.press('Заметки');
      await d.type('Например: лавка закрыта до утра', 'e2e f10');
      await d.type('Название списка', 'F10');
      await page.close();
      /* The context outlives the page, as a profile outlives a closed tab: the flush
         starts after page.close() resolves, and disposing the context cancels it
         (measured 2026-09-27 on this host). */
      await until(
        'F10: the edits made before the close did not reach the account',
        async () => {
          const [row] = await mine();
          return row?.name === 'F10' && row.player_note === 'e2e f10';
        }
      );
    });
  } finally {
    await deleteListsOf(admin, member.id);
  }
  console.log('e2e: F10 ok');

  /* F11: Realtime on the hosted project. (a) A signed-out share page, once
     its topic joined, draws a rename made in Node within 10 s - the poll is
     45 s, so only the live path passes - and a delete. (b) Two pages of the
     member draw each other's rename; every write in them carries the tab
     header through the gateway, so a CORS refusal of it fails here. */
  await deleteListsOf(admin, member.id);
  try {
    const port = portOf(env, await mint(env, admin, member.email));
    const listId = port.lists.newId();
    const made = await port.lists.apply([
      {
        op: 'create',
        list: { id: listId, name: 'E2E live', money_mode: 'bag', player_note: '', gm_note: '' },
        entries: [
          {
            id: port.lists.newId(),
            item_key: 'ci1',
            source: 'official',
            hb_item: null,
            position: 0,
            quantity: 1,
            price_coins: null,
            player_note: '',
            gm_note: ''
          }
        ]
      }
    ]);
    if (!made.ok || made.results[0]?.ok !== true) throw new Error('e2e F11: no list made');
    const share = await port.shares.create(listId, 'player');
    if (!share.ok) throw new Error('e2e F11: no players link made');

    await withPage(ctx, null, async (page, d) => {
      await d.open('#/s/' + share.token);
      await waitText(page, 'F11', 'E2E live');
      await waitFor(
        page,
        'e2e F11: the share page never joined its topic',
        () => !!document.querySelector('[data-live="live"]')
      );
      const renamed = await port.lists.apply([
        { op: 'update', id: listId, patch: { name: 'E2E live 2' } }
      ]);
      if (!renamed.ok || renamed.results[0]?.ok !== true) {
        throw new Error('e2e F11: the rename was refused');
      }
      await within10(
        page,
        'F11: the share page did not draw the rename in 10 s',
        () =>
          document.querySelector('h1')?.textContent === 'E2E live 2' &&
          document.querySelector('.said')?.textContent === 'Список обновлён'
      );
      if (!(await port.shares.revoke(share.id)).ok) throw new Error('e2e F11: no delete');
      await within10(page, 'F11: the share page did not draw the delete in 10 s', () =>
        document.body.textContent.includes('Список больше не доступен')
      );
    });

    const live = (page) =>
      waitFor(
        page,
        "e2e F11: the list page never joined the owner's topic",
        () => !!document.querySelector('.lsaid[data-live="live"]')
      );
    await withPage(ctx, await mint(env, admin, member.email), async (pageA, a) => {
      await a.open('#/lists/' + listId);
      await waitText(pageA, 'F11', 'Сохранено');
      await live(pageA);
      await withPage(ctx, await mint(env, admin, member.email), async (pageB, b) => {
        await b.open('#/lists/' + listId);
        await waitText(pageB, 'F11', 'Сохранено');
        await live(pageB);
        await a.type('Название списка', 'E2E live 3');
        await a.writesSettled();
        await within10(
          pageB,
          "F11: the second page did not draw the first page's rename in 10 s",
          () => document.querySelector('input.titleinput')?.value === 'E2E live 3'
        );
      });
    });
  } finally {
    await deleteListsOf(admin, member.id);
  }
  console.log('e2e: F11 ok');

  /* F12: a purchase request on the hosted project. A signed-out share page sends one
     through create_purchase_request, the first function anon writes through; the
     owner's open page draws it within 10 s, applies it, and the share page draws the
     lowered stock within 10 s. */
  await deleteListsOf(admin, member.id);
  try {
    const port = portOf(env, await mint(env, admin, member.email));
    const listId = port.lists.newId();
    const made = await port.lists.apply([
      {
        op: 'create',
        list: {
          id: listId,
          name: 'E2E requests',
          money_mode: 'bag',
          player_note: '',
          gm_note: ''
        },
        entries: [
          {
            id: port.lists.newId(),
            item_key: 'ci1',
            source: 'official',
            hb_item: null,
            position: 0,
            quantity: 3,
            price_coins: null,
            player_note: '',
            gm_note: ''
          }
        ]
      }
    ]);
    if (!made.ok || made.results[0]?.ok !== true) throw new Error('e2e F12: no list made');
    const share = await port.shares.create(listId, 'player');
    if (!share.ok) throw new Error('e2e F12: no players link made');

    await withPage(ctx, await mint(env, admin, member.email), async (pageA, a) => {
      await a.open('#/lists/' + listId);
      await waitText(pageA, 'F12', 'Сохранено');
      await waitFor(
        pageA,
        "e2e F12: the list page never joined the owner's topic",
        () => !!document.querySelector('.lsaid[data-live="live"]')
      );
      await withPage(ctx, null, async (pageB, b) => {
        await b.open('#/s/' + share.token);
        await waitText(pageB, 'F12', 'E2E requests');
        await waitFor(
          pageB,
          'e2e F12: the share page never joined its topic',
          () => !!document.querySelector('[data-live="live"]')
        );
        await b.tick('Первоклассный Спальный Мешок');
        /* One of the three: the apply lowers the entry and does not remove it. */
        const take = await pageB.$('input[aria-label="Взять: Первоклассный Спальный Мешок"]');
        if (!take) throw new Error('e2e F12: no taken-count field');
        await take.click({ count: 3 });
        await take.type('1');
        await waitFor(
          pageB,
          'e2e F12: the taken count is not 1',
          () =>
            document.querySelector('input[aria-label="Взять: Первоклассный Спальный Мешок"]')
              ?.value === '1'
        );
        await b.press('Сообщить владельцу');
        await waitText(pageB, 'F12', 'Запрос отправлен владельцу списка.');
        await within10(pageA, 'F12: the owner page did not draw the request in 10 s', () =>
          document.body.textContent.includes('Новое в списке (1)')
        );
        await a.press('Принять');
        await waitText(pageA, 'F12', 'Запрос принят');
        await until('F12: the apply did not lower ci1 to 2', async () => {
          const lists = await listsOf(admin, member.id);
          const entry = lists
            .find((l) => l.id === listId)
            ?.list_entries.find((e) => e.item_key === 'ci1');
          return entry?.quantity === 2;
        });
        await within10(pageB, 'F12: the share page did not draw «×2» in 10 s', () =>
          (document.querySelector('[data-row="ci1"]')?.textContent ?? '').includes('×2')
        );
      });
    });
  } finally {
    await deleteListsOf(admin, member.id);
  }
  console.log('e2e: F12 ok');

  /* F13: import_lists on the hosted project through the page. example.json lands as
     one list with its entries in file order; then that list and one made by hand
     go together through «Удалить (2)» and one confirm. */
  await deleteListsOf(admin, member.id);
  try {
    const mine = () => listsOf(admin, member.id);
    const example = fileURLToPath(
      new URL('../../docs/fixtures/import/example.json', import.meta.url)
    );
    await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
      await d.open('#/lists');
      await waitText(page, 'F13', 'Ваш аккаунт');
      await waitControl(page, 'F13', 'Импорт из файла');
      await d.press('Импорт из файла');
      await d.upload(example);
      await waitControl(page, 'F13', 'Импортировать (1)');
      await d.press('Импортировать (1)');
      await waitText(page, 'F13', 'Импортировано списков: 1');
      await until('F13: the imported list did not reach the account', async () => {
        const rows = await mine();
        const entries = [...(rows[0]?.list_entries ?? [])].sort(
          (a, b) => a.position - b.position
        );
        return (
          rows.length === 1 &&
          rows[0].name === 'Лавка кузнеца' &&
          entries.map((e) => e.item_key).join(',') === 'ci1,q1,q313' &&
          entries[0].quantity === 2 &&
          entries[0].price_coins === 150
        );
      });
      await d.type('Например: клад дракона', 'F13');
      await d.press('Создать');
      await until('F13: the second list did not reach the account', async () => {
        return (await mine()).length === 2;
      });
      await d.tick('Выбрать: Лавка кузнеца');
      await d.tick('Выбрать: F13');
      await d.press('Удалить (2)');
      await until('F13: the two lists were not deleted', async () => {
        return (await mine()).length === 0;
      });
    });
  } finally {
    await deleteListsOf(admin, member.id);
  }
  console.log('e2e: F13 ok');

  /* F14: the homebrew rows on the hosted project through the pages: a source with a
     section on #/homebrew/sources, a weapon in them on #/homebrew/new, its rename read back at
     the next revision, and its delete. */
  await deleteHomebrewOf(admin, member.id);
  try {
    const mine = () => homebrewOf(admin, member.id);
    await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
      await d.open('#/homebrew/sources');
      await waitText(page, 'F14', '0 источников');
      await d.press('Новый источник');
      await page.type('#hb-new-source', 'F14');
      await d.press('Создать');
      await until('F14: the source did not reach the account', async () => {
        return (await mine()).books.length === 1;
      });
      await d.press('Разделы');
      await d.press('Новый раздел');
      const { books } = await mine();
      const book = books[0];
      await page.type('#hb-section-' + book.id, 'Клинки');
      await d.press('Создать');
      await until('F14: the section did not reach the account', async () => {
        return ((await mine()).books[0]?.content.sections ?? []).length === 1;
      });
      const section = (await mine()).books[0].content.sections[0].key;

      await d.open('#/homebrew/new');
      await waitControl(page, 'F14', 'Сохранить');
      const pick = async (group, text) => {
        await page.evaluate(
          (g, t) => {
            const b = [...document.querySelectorAll('#' + g + ' button')].find(
              (x) => x.textContent.trim() === t
            );
            if (!b) throw new Error('e2e F14: no «' + t + '» in ' + g);
            b.click();
          },
          group,
          text
        );
        await d.settle();
      };
      await pick('hb-kind', 'Снаряжение');
      await d.choose('#hb-book', book.id);
      await d.choose('#hb-section', section);
      await page.type('#hb-name', 'Клинок F14');
      await pick('hb-eqtier', '1');
      await pick('hb-cls', 'Физическое');
      await pick('hb-tr', 'Сила');
      await pick('hb-rg', 'Вплотную');
      await d.choose('#hb-dmg', 'd8');
      await page.type('#hb-dmg-bonus', '25');
      await pick('hb-dt', 'физ');
      await pick('hb-bu', 'Одноручное');
      await d.press('Сохранить');
      await until('F14: the item did not reach the account', async () => {
        const { items } = await mine();
        return (
          items.length === 1 &&
          items[0].book_id === book.id &&
          items[0].content.section === section &&
          items[0].content.eq?.dmg === 'd8+25' &&
          items[0].revision === 1
        );
      });

      await page.evaluate(() => {
        const name = document.getElementById('hb-name');
        name.value = '';
        name.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.type('#hb-name', 'Клинок F14 II');
      await d.press('Сохранить');
      await until('F14: the rename did not reach the account at revision 2', async () => {
        const { items } = await mine();
        return items[0]?.content.ru === 'Клинок F14 II' && items[0].revision === 2;
      });

      await d.press('Удалить');
      await until('F14: the item was not deleted', async () => {
        return (await mine()).items.length === 0;
      });
    });
  } finally {
    await deleteHomebrewOf(admin, member.id);
  }
  console.log('e2e: F14 ok');

  /* F15: homebrew in lists on the hosted project. An own item added from its page to a
     new list is a reference; its rename reaches an anon read of a players' link through
     the projection; «Свой предмет» on the list page makes one more item and its
     reference. */
  await deleteListsOf(admin, member.id);
  await deleteHomebrewOf(admin, member.id);
  try {
    const entriesOf = async () => (await listsOf(admin, member.id))[0]?.list_entries ?? [];
    const itemsOf = async () => (await homebrewOf(admin, member.id)).items;
    await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
      await d.open('#/homebrew/new');
      await waitControl(page, 'F15', 'Сохранить');
      await page.type('#hb-name', 'Фляга F15');
      await d.press('Сохранить');
      await until('F15: the item did not reach the account', async () => {
        return (await itemsOf()).length === 1;
      });
      const [item] = await itemsOf();
      const key = item.key;

      await d.open('#/i/' + key);
      await waitControl(page, 'F15', 'Добавить в список');
      await d.press('Добавить в список');
      await d.press('+ Новый список');
      await d.type('Например: клад дракона', 'F15');
      await d.press('Создать');
      await until('F15: the entry does not link the own item', async () => {
        const [e] = await entriesOf();
        return e?.item_key === key && e.source === 'homebrew' && e.hb_item === item.id;
      });
      const listId = (await listsOf(admin, member.id))[0].id;

      await d.open('#/homebrew/' + key);
      await waitControl(page, 'F15', 'Сохранить');
      await page.evaluate(() => {
        const name = document.getElementById('hb-name');
        name.value = '';
        name.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.type('#hb-name', 'Фляга F15 II');
      await d.press('Сохранить');
      await until('F15: the rename did not reach the account', async () => {
        return (await itemsOf())[0]?.content.ru === 'Фляга F15 II';
      });

      const port = portOf(env, await mint(env, admin, member.email));
      const share = await port.shares.create(listId, 'player');
      if (!share.ok) throw new Error('e2e F15: no players link made');
      const anon = portOf(env, null);
      await until('F15: an anon read of the link does not carry the new name', async () => {
        const read = await anon.shares.read(share.token);
        const e =
          read.ok && read.shared ? read.shared.entries.find((x) => x.item_key === key) : null;
        return e?.snapshot?.ru === 'Фляга F15 II';
      });

      await d.open('#/lists/' + listId);
      await waitText(page, 'F15', 'Сохранено');
      await d.press('Свой предмет');
      await d.type('Название*', 'Свеча F15');
      await d.press('Добавить в список');
      await until(
        'F15: the own item made on the list page, or its link, is missing',
        async () => {
          const made = (await itemsOf()).find((i) => i.content.ru === 'Свеча F15');
          if (!made) return false;
          return (await entriesOf()).some(
            (e) => e.item_key === made.key && e.source === 'homebrew' && e.hb_item === made.id
          );
        }
      );
    });
  } finally {
    await deleteListsOf(admin, member.id);
    await deleteHomebrewOf(admin, member.id);
  }
  console.log('e2e: F15 ok');

  /* F16: an own item's relations on the hosted project: a loot item that upgrades into
     ci1 and is made from ci2, both picked by name in «Связи», with a rule card made by
     «Новая карта правил»; the card row and the item's relation keys read back. */
  await deleteHomebrewOf(admin, member.id);
  try {
    const mine = () => homebrewOf(admin, member.id);
    await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
      await d.open('#/homebrew/new');
      await waitControl(page, 'F16', 'Сохранить');
      await d.type('Название*', 'Плащ F16');
      await d.press('Связи');
      await d.type('Улучшается до', 'Первоклассный Спальный');
      await d.click('Первоклассный Спальный Мешок');
      await d.type('Получается из', 'Пронзительная Свирель');
      await d.click('Пронзительная Свирель');
      await d.press('Новая карта правил');
      await d.type('Название карты*', 'Клеймо F16');
      await d.type('Текст карты*', 'Раз за отдых: перебросьте одну кость урона.');
      await d.press('Создать карту');
      await until('F16: the rule card did not reach the account', async () => {
        const { cards } = await mine();
        return (
          cards.length === 1 && cards[0].kind === 'ref' && cards[0].content.ru === 'Клеймо F16'
        );
      });
      const card = (await mine()).cards[0].key;
      await d.press('Сохранить');
      await until('F16: the item relations did not reach the account', async () => {
        const { items } = await mine();
        const c = items[0]?.content;
        return (
          items.length === 1 &&
          JSON.stringify(c?.craft) === JSON.stringify(['ci1']) &&
          JSON.stringify(c?.craft_from) === JSON.stringify(['ci2']) &&
          JSON.stringify(c?.refs) === JSON.stringify([card])
        );
      });
    });
  } finally {
    await deleteHomebrewOf(admin, member.id);
  }
  console.log('e2e: F16 ok');

  /* F17: homebrew files on the hosted project. example.json imported through the page,
     imported again with «Обновить» from example-edited.json, the two pistols moved to
     «Холодное оружие» in one call, the data zip's homebrew.json holding every row, and
     example-v2.json imported into lists: the held pistol linked, the lamp copied into the
     account's homebrew and linked. */
  await deleteListsOf(admin, member.id);
  await deleteHomebrewOf(admin, member.id);
  const fixture = (dir, name) =>
    fileURLToPath(new URL('../../docs/fixtures/' + dir + '/' + name, import.meta.url));
  try {
    const mine = () => homebrewOf(admin, member.id);
    await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
      /* The toggle is disabled while a call runs, the panel folds on an ok answer and stays
         open on any other: a press before the fold is lost, and a press on a panel kept
         open by a refusal closes it, so the next file field never appears. Each import
         waits for its answer's toast and names the toast it got instead. */
      const answered = async (text) => {
        try {
          await page.waitForFunction((t) => document.body.textContent.includes(t), WAIT, text);
        } catch {
          const said = await page.evaluate(
            () =>
              document.querySelector('.toast')?.textContent.replace(/\s+/g, ' ').trim() ?? ''
          );
          throw new Error(
            'e2e F17: the import never said «' + text + '»; the toast: «' + said + '»'
          );
        }
      };
      const openImport = async () => {
        await waitFor(
          page,
          'e2e F17: the import panel did not fold after the answer',
          () => !document.querySelector('input[type="file"]')
        );
        await waitControl(page, 'F17', 'Импорт из файла');
        await d.press('Импорт из файла');
        await waitText(page, 'F17', 'Импорт предметов из файла JSON');
      };
      await d.open('#/homebrew');
      await openImport();
      await d.upload(fixture('homebrew-file', 'example.json'));
      await waitControl(page, 'F17', 'Импортировать (5)');
      await d.press('Импортировать (5)');
      await answered('Импортировано предметов: 3');
      await until('F17: the file did not reach the account', async () => {
        const r = await mine();
        return r.books.length === 1 && r.items.length === 3 && r.cards.length === 2;
      });

      await openImport();
      await d.upload(fixture('homebrew-file', 'example-edited.json'));
      await waitControl(page, 'F17', 'Импортировать (7)');
      await d.press('Обновить');
      /* The driver accepts the update's confirm. */
      await d.press('Импортировать (7)');
      await answered('Импортировано предметов: 2');
      await until('F17: the update did not reach the account', async () => {
        const r = await mine();
        const pistol = r.items.find((i) => i.key === 'hb_flintlockpistola');
        return r.items.length === 5 && pistol?.content.ru === 'Старый кремнёвый пистоль';
      });

      const { books } = await mine();
      const alder = books.find((b) => b.key === 'hb_alderworkshopaaa');
      if (!alder) throw new Error('e2e F17: the source is missing');
      await d.open('#/homebrew');
      await waitControl(page, 'F17', 'Импорт из файла');
      await d.tick('Старый кремнёвый пистоль');
      await d.tick('Двуствольный пистоль мастера');
      await d.press('Переместить (2)');
      await page.select('#hb-move', alder.id);
      await page.waitForSelector('#hb-move-section', WAIT);
      await page.select('#hb-move-section', 'hb_sectbladesaaaaaa');
      await d.press('Переместить');
      await until('F17: the move did not reach the account', async () => {
        const { items } = await mine();
        return ['hb_flintlockpistola', 'hb_doublepistolaaaa'].every(
          (k) => items.find((i) => i.key === k)?.content.section === 'hb_sectbladesaaaaaa'
        );
      });

      /* prepare() keeps a download in the page instead of saving it. */
      await d.open('#/account');
      await waitControl(page, 'F17', 'Скачать мои данные (ZIP)');
      await d.press('Скачать мои данные (ZIP)');
      let zip = null;
      await until('F17: the data zip did not download', async () => {
        zip = await d.download();
        return zip?.filename.endsWith('.zip') ?? false;
      });
      const read = readDataZip(
        new Uint8Array(Buffer.from(zip.base64, 'base64')),
        'homebrew.json'
      );
      if (!read.ok) throw new Error('e2e F17: the zip holds no homebrew.json');
      const file = JSON.parse(read.text);
      const rows = await mine();
      const keys = (list) => list.map((x) => x.key).sort();
      if (
        JSON.stringify(keys(file.books)) !== JSON.stringify(keys(rows.books)) ||
        JSON.stringify(keys(file.items)) !== JSON.stringify(keys(rows.items)) ||
        JSON.stringify(keys(file.cards)) !== JSON.stringify(keys(rows.cards))
      ) {
        throw new Error('e2e F17: the zip homebrew.json does not hold the account rows');
      }

      await d.open('#/lists');
      await waitControl(page, 'F17', 'Импорт из файла');
      await d.press('Импорт из файла');
      await d.upload(fixture('import', 'example-v2.json'));
      await waitControl(page, 'F17', 'Импортировать (1)');
      await d.press('Импортировать (1)');
      await until('F17: the lists file did not reach the account', async () => {
        const list = (await listsOf(admin, member.id)).find((l) => l.name === 'Лавка Ольхи');
        const by = (k) => list?.list_entries.find((e) => e.item_key === k);
        const { items } = await mine();
        const idOf = (k) => items.find((i) => i.key === k)?.id;
        return (
          idOf('hb_wanderlampaaaaaa') !== undefined &&
          by('hb_flintlockpistola')?.hb_item === idOf('hb_flintlockpistola') &&
          by('hb_wanderlampaaaaaa')?.hb_item === idOf('hb_wanderlampaaaaaa')
        );
      });
    });
  } finally {
    await deleteListsOf(admin, member.id);
    await deleteHomebrewOf(admin, member.id);
  }
  console.log('e2e: F17 ok');

  /* F18: an item's address on the hosted project. The member makes an item through the
     page; a fresh signed-out context opens its `#/h/<id>` and draws the name, «Предмет
     другого игрока» and «Сохранить себе», and no «Изменить». */
  await deleteHomebrewOf(admin, member.id);
  try {
    const itemsOf = async () => (await homebrewOf(admin, member.id)).items;
    await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
      await d.open('#/homebrew/new');
      await waitControl(page, 'F18', 'Сохранить');
      await page.type('#hb-name', 'Фонарь F18');
      await d.press('Сохранить');
      await until('F18: the item did not reach the account', async () => {
        return (await itemsOf()).length === 1;
      });
    });
    const [item] = await itemsOf();
    await withPage(ctx, null, async (page, d) => {
      await d.open('#/h/' + item.id);
      await waitText(page, 'F18', 'Фонарь F18');
      await waitText(page, 'F18', 'Предмет другого игрока');
      await waitControl(page, 'F18', 'Сохранить себе');
      await expectInPage(
        page,
        'F18',
        'the reader is offered «Изменить»',
        () =>
          ![...document.querySelectorAll('a, button')].some(
            (e) => e.textContent.trim() === 'Изменить'
          )
      );
    });
  } finally {
    await deleteHomebrewOf(admin, member.id);
  }
  console.log('e2e: F18 ok');

  /* F19: a GM-only entry on the hosted project. A signed-out players' page, once its topic
     joined, loses the entry the member's page marks GM only within 10 s, and draws it again
     after the second press; the mark is stored on the entry. */
  await deleteListsOf(admin, member.id);
  try {
    const port = portOf(env, await mint(env, admin, member.email));
    const listId = port.lists.newId();
    const entry = (key, position) => ({
      id: port.lists.newId(),
      item_key: key,
      source: 'official',
      hb_item: null,
      position,
      quantity: 1,
      price_coins: null,
      player_note: '',
      gm_note: ''
    });
    const made = await port.lists.apply([
      {
        op: 'create',
        list: {
          id: listId,
          name: 'E2E GM only',
          money_mode: 'bag',
          player_note: '',
          gm_note: ''
        },
        entries: [entry('ci1', 0), entry('q1', 1)]
      }
    ]);
    if (!made.ok || made.results[0]?.ok !== true) throw new Error('e2e F19: no list made');
    const share = await port.shares.create(listId, 'player');
    if (!share.ok) throw new Error('e2e F19: no players link made');
    const markOf = async () => {
      const read = await port.lists.list();
      const list = read.ok ? read.lists.find((l) => l.id === listId) : undefined;
      return list?.list_entries.find((e) => e.item_key === 'q1')?.gm_only;
    };

    await withPage(ctx, null, async (shared, sd) => {
      await sd.open('#/s/' + share.token);
      await waitText(shared, 'F19', 'E2E GM only');
      await waitFor(
        shared,
        'e2e F19: the share page never joined its topic',
        () => !!document.querySelector('[data-live="live"]')
      );
      await withPage(ctx, await mint(env, admin, member.email), async (page, d) => {
        await d.open('#/lists/' + listId);
        await waitText(page, 'F19', 'Сохранено');
        await waitFor(
          page,
          "e2e F19: the list page never joined the owner's topic",
          () => !!document.querySelector('.lsaid[data-live="live"]')
        );
        await d.press('Только для мастера: Палаш');
        await d.writesSettled();
        await within10(
          shared,
          'F19: the share page still drew the GM-only entry after 10 s',
          () =>
            !document.querySelector('[data-row="q1"]') &&
            document.body.textContent.includes('1 позиция')
        );
        await until(
          'F19: the mark did not reach the entry',
          async () => (await markOf()) === true
        );
        await d.press('Только для мастера: Палаш');
        await d.writesSettled();
        await within10(
          shared,
          'F19: the share page did not draw the entry again in 10 s',
          () => !!document.querySelector('[data-row="q1"]')
        );
        await until('F19: the cleared mark did not reach the entry', async () => {
          return (await markOf()) === false;
        });
      });
    });
  } finally {
    await deleteListsOf(admin, member.id);
  }
  console.log('e2e: F19 ok');
}
