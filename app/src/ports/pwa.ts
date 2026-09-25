/* The installable app: registering the service worker and knowing whether the
 * page already runs as the installed app.
 *
 * The worker keeps the site installable and caches the pictures and the
 * hashed build files; it holds no offline shell (docs/specs/META.md
 * section 9). */

import type { Persistence, PwaPort, Registration } from './types.js';

interface WorkerContainer {
  register(url: string): Promise<unknown>;
}

interface StorageManagerLike {
  persisted(): Promise<boolean>;
  persist(): Promise<boolean>;
}

/** The decision, with the browser handed in so jsdom can cover every branch. */
export function registerWith(sw: WorkerContainer | undefined): Promise<Registration> {
  if (!sw) return Promise.resolve('unsupported');
  return sw.register('./sw.js').then(
    (): Registration => 'registered',
    (): Registration => 'failed'
  );
}

/**
 * The storage request, with the browser handed in so jsdom can cover every
 * branch. Only the installed app asks: Firefox documents a prompt for
 * `persist()` in a tab. `persisted()` first, so a granted origin is never
 * asked again.
 */
export function persistWith(
  sm: StorageManagerLike | undefined,
  standalone: boolean
): Promise<Persistence> {
  if (!sm || !standalone) return Promise.resolve('skipped');
  return sm
    .persisted()
    .then((done) => done || sm.persist())
    .then(
      (granted): Persistence => (granted ? 'persisted' : 'denied'),
      (): Persistence => 'denied'
    );
}

export function browserPwa(): PwaPort {
  const standalone = () =>
    (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) ||
    Reflect.get(navigator, 'standalone') === true;
  return {
    register: () =>
      registerWith(
        /* Absent outside a secure context and in older browsers, whatever the
           DOM typings say. */
        'serviceWorker' in navigator ? navigator.serviceWorker : undefined
      ),
    standalone,
    persist: () =>
      persistWith(
        /* Absent outside a secure context and in older browsers, whatever the
           DOM typings say. */
        'storage' in navigator ? navigator.storage : undefined,
        standalone()
      )
  };
}

export function fakePwa(
  opts: { standalone?: boolean; result?: Registration; persistence?: Persistence } = {}
): PwaPort & { readonly registrations: number } {
  let registrations = 0;
  return {
    get registrations() {
      return registrations;
    },
    register() {
      registrations++;
      return Promise.resolve(opts.result ?? 'registered');
    },
    standalone: () => opts.standalone ?? false,
    persist: () => Promise.resolve(opts.persistence ?? 'skipped')
  };
}
