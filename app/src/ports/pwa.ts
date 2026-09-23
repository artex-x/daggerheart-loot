/* The installable app: linking the manifest, registering the service worker,
 * and knowing whether the page already runs as the installed app.
 *
 * Neither the manifest nor a worker loads from a folder, so the protocol is
 * checked before either is touched: `file://` stays a no-op, with no failed
 * request (docs/specs/META.md sections 4 and 9). */

import { hostedProtocol } from './router.js';
import type { PwaPort, Registration } from './types.js';

interface WorkerContainer {
  register(url: string): Promise<unknown>;
}

/** The decision, with the browser handed in so jsdom can cover every branch. */
export function registerWith(
  sw: WorkerContainer | undefined,
  protocol: string
): Promise<Registration> {
  if (!sw || !hostedProtocol(protocol)) return Promise.resolve('unsupported');
  return sw.register('./sw.js').then(
    (): Registration => 'registered',
    (): Registration => 'failed'
  );
}

/**
 * Adds `<link rel="manifest">` once, only where a server serves the page.
 *
 * Not a static tag in `app/index.html`: Chrome fetches it from a folder too,
 * and refuses it there with a CORS error and a failed request.
 */
export function linkManifest(doc: Document, protocol: string): void {
  if (!hostedProtocol(protocol) || doc.head.querySelector('link[rel="manifest"]')) return;
  const link = doc.createElement('link');
  link.rel = 'manifest';
  link.href = './manifest.webmanifest';
  doc.head.append(link);
}

export function browserPwa(): PwaPort {
  return {
    register: () => {
      linkManifest(document, location.protocol);
      return registerWith(
        /* Absent outside a secure context and in older browsers, whatever the
           DOM typings say. */
        'serviceWorker' in navigator ? navigator.serviceWorker : undefined,
        location.protocol
      );
    },
    standalone: () =>
      (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) ||
      Reflect.get(navigator, 'standalone') === true
  };
}

export function fakePwa(
  opts: { standalone?: boolean; result?: Registration } = {}
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
    standalone: () => opts.standalone ?? false
  };
}
