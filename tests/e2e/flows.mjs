/* The account flows in a real browser over the configured `dist/`, on the
 * test project: F0 the page probe, F1 signed out, F2 the member's page, F3
 * sign-out, F4 sign-out everywhere, F5 delete account, F6 a preference read
 * back on a fresh session, F7 an account list made, filled, renamed, read
 * back from the server and deleted, F8 its share links made, read, deleted,
 * made again and copied. Each flow gets its own browser context, the
 * browser suites' `prepare()` and driver, and - when it has one - a minted
 * session written where supabase-js keeps it. Nothing here prints,
 * screenshots or throws a value of an `E2E_*` variable or the member's
 * address: comparisons run in the page with the value as an argument.
 * docs/specs/COVERAGE.md, "Test layers". */

import { createRequire } from 'node:module';
import {
  createThrowaway,
  deleteListsOf,
  listsOf,
  mint,
  prefsOf,
  refreshRefused,
  sharesOf,
  userGone
} from './admin.mjs';
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

async function expectInPage(page, flow, what, fn, ...args) {
  if (!(await page.evaluate(fn, ...args))) throw new Error('e2e ' + flow + ': ' + what);
}

async function withPage({ browser, base, env }, session, run) {
  const ctx = await browser.createBrowserContext();
  try {
    const page = await ctx.newPage();
    await prepare(page);
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
        document.querySelector('header a[href="#/account"]')?.getAttribute('aria-label') ===
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
            .querySelector('header a[href="#/account"]')
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
}
