<script lang="ts" module>
  import type { Dict } from './lib/dict.js';
  import type { Section } from './lib/types.js';

  const KEYS: Record<Section, keyof Dict> = {
    'roll/std': 'std',
    'roll/alt': 'alt',
    'roll/wondrous': 'wondrous',
    'roll/dread': 'dread',
    'roll/voa': 'voa',
    'roll/community': 'community',
    tables: 'tables',
    lists: 'lists',
    search: 'search'
  };

  function sectionKey(s: Section): keyof Dict {
    return KEYS[s];
  }
</script>

<script lang="ts">
  /* The application. Routes are matched here and nowhere else; every branch
     below will become its own component as the phases go on. */
  import { untrack } from 'svelte';
  import Shell from './components/Shell.svelte';
  import { AppState } from './state/app.svelte.js';
  import type { Env } from './ports/index.js';

  interface Props {
    env: Env;
  }

  const { env }: Props = $props();
  /* Read once, on purpose: the outside world does not change under a running
     app, and rebuilding the state if it did would throw away everything the
     person had done. `untrack` says that rather than leaving a warning. */
  const app = new AppState(untrack(() => env));

  $effect(() => app.start());
</script>

<Shell {app}>
  {#if app.route.kind === 'section'}
    <h1>{app.t[sectionKey(app.route.section)]}</h1>
    <p class="todo">{app.hash}</p>
  {:else if app.route.kind === 'tables'}
    <h1>{app.t.tables}</h1>
    <p class="todo">{app.hash}</p>
  {:else}
    <p class="todo">{app.hash}</p>
  {/if}
</Shell>

<style>
  h1 {
    margin: 0 0 var(--gap);
    font: 800 var(--step-2) / 1.2 var(--ui);
  }

  /* Every route the rewrite has not reached yet says so, rather than rendering
     an empty page that looks broken. */
  .todo {
    color: var(--muted2);
    font-family: var(--mono);
    font-size: var(--step--1);
  }
</style>
