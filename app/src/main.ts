import { mount } from 'svelte';
import App from './App.svelte';
import { browserEnv } from './ports/index.js';
import type { Env } from './ports/index.js';
import { lazyCloud } from './ports/lazy-cloud.js';
import { takeRedirect } from './ports/redirect.js';
import './styles/tokens.css';

const target = document.getElementById('app');
if (!target) throw new Error('no #app element');
const root = target;

const env = browserEnv();
/* Registration and the storage request are boot concerns beside `mount`, not
   a component's. The registered worker keeps the site installable
   (docs/specs/META.md section 9). Both run before the cloud is chosen, so the
   test build links the manifest as early as `dist/` does: Chrome answered
   `manifest-location-changed` when the link arrived after `load`. */
void env.pwa.register();
void env.pwa.persist();

function boot(withCloud: Env): void {
  mount(App, { target: root, props: { env: withCloud } });
}

/* `VITE_CLOUD_FAKE` and the two `VITE_SUPABASE_*` values are build-time
   literals: in `dist/` the fake's branch and chunk are dropped
   (tools/no-fake-in-prod.mjs), and so is the Supabase client's in a build
   with no sign-in configured. A `.then`, not a top-level `await`, so the
   production boot stays synchronous. */
if (import.meta.env.VITE_CLOUD_FAKE) {
  void import('./ports/fake-cloud.js')
    .then((m) => {
      boot({ ...env, cloud: m.installFakeCloud() });
    })
    .catch((err: unknown) => {
      /* An unknown `?as=` user: said on the page, so the browser suites'
         driver fails at once and names it (tests/app/driver.js). */
      const p = document.createElement('p');
      p.id = 'boot-error';
      p.setAttribute('role', 'alert');
      p.textContent = err instanceof Error ? err.message : String(err);
      root.append(p);
    });
} else if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
  /* A provider redirect is settled before mount, so the router reads the
     page the reader left, not the callback (docs/specs/FEATURES.md,
     "Account"). The client itself loads after first paint. */
  const redirect = takeRedirect();
  boot({
    ...env,
    cloud: lazyCloud(() =>
      import('./ports/supabase.js').then((m) =>
        m.createCloud(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          redirect
        )
      )
    )
  });
} else {
  boot(env);
}
