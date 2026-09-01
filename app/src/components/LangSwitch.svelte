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
  /* off `.seg` in style.css */
  .seg {
    display: flex;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 3px;
  }

  button {
    border: 0;
    background: transparent;
    color: var(--muted);
    padding: 5px 13px;
    border-radius: 999px;
    font-size: 12.5px;
    font-weight: 650;
    letter-spacing: 0.05em;
    transition: 0.16s;
    cursor: pointer;
  }

  button.on {
    background: var(--gold);
    color: #1a1206;
  }

  button:not(.on):hover {
    color: var(--txt);
  }
</style>
