<script lang="ts">
  /* «Обновлено N назад» under a page heading, as the index card's «изменён N назад»: the
     share page's list and the item page's item (docs/specs/FEATURES.md, "Records" and
     "Account and browser lists"). `app.now` moves it on each poll tick. */
  import { agoText } from '../lib/ago.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    /** An ISO time that `Date.parse` reads. */
    at: string;
  }

  const { app, at }: Props = $props();
</script>

<p class="updated">{agoText(Date.parse(at), app.now, app.lang, app.t, 'updated')}</p>

<style>
  .updated {
    margin: -14px 0 18px;
    font-size: 12.5px;
    color: var(--muted2);
  }
</style>
