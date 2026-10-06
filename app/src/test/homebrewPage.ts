/* The set-up that homebrewPage.test.ts and homebrewPage.timed.test.ts share:
   «Мои предметы» over the fake cloud at a tab's address, and a press on a tab of
   its tab row. */
import { render, screen, waitFor, type RenderResult } from '@testing-library/svelte';
import App from '../App.svelte';
import { dict } from '../lib/dict.js';
import { fakeCloud, type FakeCloudOptions } from '../ports/fake-cloud.js';
import { SEED } from '../ports/fake-cloud-seed.js';
import {
  fakeDialog,
  fakeEnv,
  fakePage,
  memoryRouter,
  memoryStorage,
  type CloudPort,
  type RouterPort
} from '../ports/index.js';

export const t = dict('ru');

let router: RouterPort | null = null;

/** What `page` returns: the render of the app, its cloud, router, dialog and page port. */
type Paged = RenderResult<typeof App> & {
  cloud: CloudPort | null;
  router: ReturnType<typeof memoryRouter>;
  dialog: ReturnType<typeof fakeDialog>;
  pagePort: ReturnType<typeof fakePage>;
};

/** Renders the app at `route` (`#/homebrew` by default) as `as`, signed out with null. */
export function page(
  as: 'gm1' | 'gm2' | 'gm3' | null = 'gm1',
  opts: {
    cloud?: CloudPort | null;
    answer?: boolean;
    fake?: FakeCloudOptions;
    route?: string;
    /** More of the environment: a clock, an image port. */
    env?: Partial<Parameters<typeof fakeEnv>[0]>;
  } = {}
): Paged {
  const cloud =
    opts.cloud === undefined
      ? as === null
        ? fakeCloud(SEED, undefined, opts.fake)
        : fakeCloud(SEED, as, opts.fake)
      : opts.cloud;
  const memory = memoryRouter(opts.route ?? '#/homebrew');
  router = memory;
  const dialog = fakeDialog(opts.answer ?? true);
  const pagePort = fakePage();
  const view = render(App, {
    env: fakeEnv({
      cloud,
      router: memory,
      dialog,
      page: pagePort,
      storage: memoryStorage(),
      ...opts.env
    })
  });
  return { ...view, cloud, router: memory, dialog, pagePort };
}

/** Presses the tab link named `label` (a navigation to its address, as a click on it is)
 *  and returns the tab's content; the Items tab has no root of its own and returns the
 *  page's main element. */
export async function tab(label: string): Promise<HTMLElement> {
  const link = await screen.findByRole('link', { name: label });
  const href = link.getAttribute('href') ?? '';
  router?.navigate(href);
  return waitFor(() => {
    const on = screen.getByRole('link', { name: label });
    const root =
      href === '#/homebrew'
        ? document.querySelector<HTMLElement>('main')
        : document.querySelector<HTMLElement>('.hbtab');
    if (on.getAttribute('aria-current') !== 'page' || !root) {
      throw new Error('The tab ' + label + ' did not draw.');
    }
    return root;
  });
}
