<script lang="ts">
  /* Two buttons rather than a select: there are exactly two, and a select hides
     one of them behind a tap. */
  import type { Lang } from '../lib/types.js';

  interface Props {
    lang: Lang;
    label: string;
    onchange: (lang: Lang) => void;
  }

  const { lang, label, onchange }: Props = $props();
  const LANGS: Lang[] = ['ru', 'en'];
</script>

<div class="seg" role="group" aria-label={label}>
  {#each LANGS as code (code)}
    <button
      type="button"
      class:on={code === lang}
      aria-pressed={code === lang}
      onclick={() => {
        onchange(code);
      }}>{code.toUpperCase()}</button
    >
  {/each}
</div>

<style>
  .seg {
    display: inline-flex;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    overflow: hidden;
  }

  button {
    padding: 5px 10px;
    border: 0;
    background: none;
    color: var(--muted);
    font: 700 var(--step--2) / 1.2 var(--ui);
    cursor: pointer;
  }

  button.on {
    background: var(--surface2);
    color: var(--gold-soft);
  }
</style>
