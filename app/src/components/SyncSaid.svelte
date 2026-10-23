<script lang="ts">
  /* The status region of the account lists' save (docs/specs/FEATURES.md, rule 19): it says
     a failure, then the save that ends it; the next ordinary save empties it, so it never
     talks over the reader. The caller mounts it with the page, for an account only, so the
     region exists before its first words (`StatusRegion`). */
  import StatusRegion from './StatusRegion.svelte';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    live?: boolean | undefined;
  }

  const { app, live }: Props = $props();

  let said = $state('');
  let wasFailed = false;
  $effect(() => {
    const sync = app.cloudLists?.sync;
    const t = app.t;
    if (sync === 'failed') {
      said = t.notSaved;
      wasFailed = true;
    } else if (sync === 'saved' && wasFailed) {
      said = t.savedState;
      wasFailed = false;
    } else if (sync === 'saving' && !wasFailed) {
      said = '';
    }
  });
</script>

<StatusRegion text={said} {live} />
