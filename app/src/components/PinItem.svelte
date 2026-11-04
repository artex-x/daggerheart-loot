<script lang="ts">
  /* The pin as an item of «Ещё»: the same words and the same write as `PageHead`'s pin. */
  import Icon from './Icon.svelte';
  import { canonicalHash } from '../lib/hash.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    /** The address this page pins, where it differs from the address bar. */
    home?: string | undefined;
    /** Called first, so the menu closes and the focus returns before the write. */
    onpicked: () => void;
  }

  const { app, home, onpicked }: Props = $props();

  const t = $derived(app.t);
  const on = $derived(app.home === canonicalHash(home ?? app.hash));
</script>

<button
  type="button"
  role="menuitem"
  tabindex="-1"
  onclick={() => {
    onpicked();
    app.pinHome(home);
  }}><Icon name={on ? 'check' : 'home'} />{on ? t.homeOn : t.homeHint}</button
>
