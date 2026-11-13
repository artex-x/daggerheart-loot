/* `#/connect/<id>` over the fake cloud: every state of the consent page, the answers and
   the way back after a sign-in. docs/specs/FEATURES.md, "Connect an app". */
import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App.svelte';
import { fakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { LONG_APP_NAME, SEED } from '../ports/fake-cloud-seed.js';
import { fakeEnv, memoryRouter, memoryStorage } from '../ports/index.js';
import type { AppAnswer, CloudPort } from '../ports/index.js';
import { fakePage } from '../ports/page.js';
import { expectNoA11yViolations } from '../test/a11y.js';

afterEach(cleanup);

const CLAUDE = 'a'.repeat(32);
const LONG = 'b'.repeat(32);
const CURSOR = 'c'.repeat(32);
const LOOPBACK = 'd'.repeat(32);
const DONE = 'e'.repeat(32);
const UNKNOWN = 'f'.repeat(32);

const as = (user?: string, options?: FakeCloudOptions): CloudPort =>
  fakeCloud(SEED, user, options);

function open(
  cloud: CloudPort | null,
  id: string,
  extra: { lang?: 'en'; framed?: boolean } = {}
) {
  const router = memoryRouter('#/connect/' + id);
  const result = render(App, {
    env: fakeEnv({
      ...(cloud ? { cloud } : {}),
      router,
      page: fakePage({ framed: extra.framed ?? false }),
      ...(extra.lang ? { storage: memoryStorage({ 'dhloot.lang.v1': extra.lang }) } : {})
    })
  });
  return { ...result, router };
}

const heading = () => screen.findByRole('heading', { level: 1 });

describe('the consent card', () => {
  it('names the app, where it goes back, the account and what it can and cannot do', async () => {
    const { container } = open(as('gm1'), CLAUDE);
    expect(await screen.findByText('Claude')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Подключение приложения'
    );
    expect(
      screen.getByText('Приложение просит доступ к вашему аккаунту на этом сайте.')
    ).toBeVisible();
    expect(screen.getByText('После ответа вы вернётесь на claude.ai')).toBeVisible();
    expect(screen.getByText('gm1@example.test')).toBeVisible();
    expect(screen.getByText('через Google')).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Аккаунт',
      'Приложение сможет',
      'Не сможет'
    ]);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      'читать, менять и удалять ваши списки, их позиции и ссылки на них, отвечать на запросы игроков;',
      'читать, менять и удалять ваши предметы, источники, комплекты и карты правил, загружать и убирать их картинки;',
      'сохранять себе чужие списки по ссылке и отправлять их владельцам запросы;',
      'импортировать и скачивать ваши файлы списков и предметов, создавать наборы для печати;',
      'видеть почту и имя вашего аккаунта.'
    ]);
    expect(screen.getByText(/^Удаление списка закрывает его ссылки/)).toBeVisible();
    expect(
      screen.getByText(
        'менять ваш пароль, почту и способы входа, подключать другие приложения, удалять аккаунт и менять настройки отображения.'
      )
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Разрешить' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Отказать' })).toBeEnabled();
    expect(screen.getByText(/^Отключить приложение можно в любой момент/)).toBeVisible();
    await expectNoA11yViolations(container);
  });

  it('says the same facts in English', async () => {
    const { container } = open(as('gm1', { lang: 'en' }), CLAUDE, { lang: 'en' });
    expect(await screen.findByText('After your answer you go back to claude.ai')).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Connect an app');
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText("see your account's email and name.")).toBeVisible();
    expect(screen.getByRole('button', { name: 'Allow' })).toBeVisible();
    await expectNoA11yViolations(container);
  });

  it('wraps a 200-character name', async () => {
    open(as('gm1'), LONG);
    const name = await screen.findByText(LONG_APP_NAME);
    expect(name).toHaveClass('appname');
    expect(LONG_APP_NAME).toHaveLength(200);
  });

  it.each([
    [CURSOR, 'После ответа вы вернётесь на cursor://anysphere.cursor-retrieval'],
    [LOOPBACK, 'После ответа вы вернётесь на http://127.0.0.1:53682']
  ])('shows a redirect that is not https as given (%s)', async (id, line) => {
    open(as('gm1'), id);
    expect(await screen.findByText(line)).toBeVisible();
  });
});

describe('the answers', () => {
  it('approves: both buttons disabled, «Разрешаем...», the answered address', async () => {
    const cloud = as('gm1');
    let answer: (a: AppAnswer) => void = () => undefined;
    const approve = vi.fn(
      () =>
        new Promise<AppAnswer>((r) => {
          answer = r;
        })
    );
    cloud.apps.approve = approve;
    const { container } = open(cloud, CLAUDE);
    await userEvent.click(await screen.findByRole('button', { name: 'Разрешить' }));
    expect(approve).toHaveBeenCalledWith(CLAUDE);
    expect(screen.getByRole('button', { name: 'Разрешаем...' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Отказать' })).toBeDisabled();
    await expectNoA11yViolations(container);
    answer({ ok: true, url: 'https://claude.ai/api/mcp/auth_callback?code=x' });
    await new Promise((r) => setTimeout(r, 10));
    /* The page is leaving: the buttons stay disabled. */
    expect(screen.getByRole('button', { name: 'Разрешаем...' })).toBeDisabled();
  });

  it('denies through the port', async () => {
    const cloud = as('gm1');
    const deny = vi.spyOn(cloud.apps, 'deny');
    open(cloud, CLAUDE);
    await userEvent.click(await screen.findByRole('button', { name: 'Отказать' }));
    expect(deny).toHaveBeenCalledWith(CLAUDE);
    await expect(deny.mock.results[0]?.value).resolves.toEqual({
      ok: true,
      url: 'https://claude.ai/api/mcp/auth_callback?error=access_denied'
    });
  });

  it.each(['Разрешить', 'Отказать'])(
    'keeps the card and toasts a failed «%s»',
    async (button) => {
      const { container } = open(as('gm1', { apps: 'refuse' }), CLAUDE);
      await userEvent.click(await screen.findByRole('button', { name: button }));
      expect(
        await screen.findByText('Не получилось. Проверьте соединение и попробуйте ещё раз.')
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Разрешить' })).toBeEnabled();
      expect(screen.getByText('Claude')).toBeVisible();
      await expectNoA11yViolations(container);
    }
  );

  it('draws no card for a request already answered: the port is leaving', async () => {
    const cloud = as('gm1');
    const details = vi.spyOn(cloud.apps, 'details');
    open(cloud, DONE);
    await waitFor(() => {
      expect(details).toHaveBeenCalledWith(DONE);
    });
    await expect(details.mock.results[0]?.value).resolves.toMatchObject({ ok: true });
    expect(screen.queryByRole('button', { name: 'Разрешить' })).toBeNull();
    expect((await heading()).textContent).toBe('Подключение приложения');
  });
});

describe('the other states', () => {
  it('draws the title and the loading line while the request is read', async () => {
    const cloud = as('gm1');
    cloud.apps.details = () => new Promise(() => undefined);
    const { container } = open(cloud, CLAUDE);
    expect((await heading()).textContent).toBe('Подключение приложения');
    expect(await screen.findByText('Загружаем...')).toBeVisible();
    await expectNoA11yViolations(container);
  });

  it('draws a failed read with a primary «Повторить», which reads again', async () => {
    const cloud = as('gm1');
    const real = cloud.apps.details.bind(cloud.apps);
    let calls = 0;
    cloud.apps.details = (id) => {
      calls++;
      return calls === 1 ? Promise.resolve({ ok: false }) : real(id);
    };
    const { container } = open(cloud, CLAUDE);
    expect(
      await screen.findByText('Не получилось загрузить запрос на подключение.')
    ).toHaveAttribute('role', 'alert');
    expect((await heading()).textContent).toBe('Подключение приложения');
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(await screen.findByRole('button', { name: 'Разрешить' })).toBeVisible();
  });

  it.each([
    ['an unknown id', as('gm1'), UNKNOWN],
    ['a malformed id', as('gm1'), 'short'],
    ['no id', as('gm1'), ''],
    ['the server off', as('gm1', { apps: 'off' }), CLAUDE]
  ])('draws the expired page for %s', async (_what, cloud, id) => {
    const { container } = open(cloud, id);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Запрос на подключение устарел' })
    ).toBeVisible();
    expect(screen.getByText('Начните подключение заново в приложении.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Разрешить' })).toBeNull();
    await expectNoA11yViolations(container);
  });

  it('draws the expired page, with no button to answer, in a frame', async () => {
    const cloud = as('gm1');
    const details = vi.spyOn(cloud.apps, 'details');
    const { container } = open(cloud, CLAUDE, { framed: true });
    expect((await heading()).textContent).toBe('Запрос на подключение устарел');
    expect(screen.queryByRole('button', { name: 'Разрешить' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Отказать' })).toBeNull();
    expect(details).not.toHaveBeenCalled();
    await expectNoA11yViolations(container);
  });

  it('draws the not-found page in a build with no sign-in', async () => {
    open(null, CLAUDE);
    expect((await heading()).textContent).not.toBe('Подключение приложения');
  });
});

describe('signed out', () => {
  it('asks for a sign-in that comes back to the same request', async () => {
    const cloud = as();
    const signIn = vi.spyOn(cloud.auth, 'signIn');
    const { container, router } = open(cloud, CLAUDE);
    expect(
      await screen.findByText('Войдите, чтобы ответить на запрос приложения.')
    ).toBeVisible();
    expect((await heading()).textContent).toBe('Подключение приложения');
    await expectNoA11yViolations(container);
    await userEvent.click(screen.getByRole('button', { name: 'Войти через Google' }));
    expect(signIn).toHaveBeenCalledWith('google', { hash: '#/connect/' + CLAUDE });
    expect(await screen.findByRole('button', { name: 'Разрешить' })).toBeVisible();
    expect(router.hash()).toBe('#/connect/' + CLAUDE);
  });

  it("keeps the id in an English reader's bar", async () => {
    const { router } = open(as('gm1', { lang: 'en' }), CLAUDE, { lang: 'en' });
    await screen.findByRole('button', { name: 'Allow' });
    expect(router.bar()).toBe('/en/connect/' + CLAUDE);
  });
});
