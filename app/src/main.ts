import { mount } from 'svelte';
import App from './App.svelte';
import { browserEnv } from './ports/index.js';
import type { Env } from './ports/index.js';
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

/* `VITE_CLOUD_FAKE` is a build-time literal: in `dist/` the branch and the
   fake's chunk are dropped (tools/no-fake-in-prod.mjs). A `.then`, not a
   top-level `await`, so the production boot stays synchronous. */
if (import.meta.env.VITE_CLOUD_FAKE) {
  void import('./ports/fake-cloud.js').then((m) => {
    boot({ ...env, cloud: m.installFakeCloud() });
  });
} else {
  boot(env);
}
