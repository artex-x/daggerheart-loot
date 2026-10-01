<script lang="ts">
  /* A panel that folds under its caption (m02 in the homebrew mocks): `#/homebrew`'s
     «Источники» and «Карты». Closed on each visit; nothing about it is stored
     (docs/specs/FEATURES.md, "Homebrew"). The summary takes Field.svelte's caption look. */
  import type { Snippet } from 'svelte';
  import Panel from './Panel.svelte';

  interface Props {
    label: string;
    /** Drawn after the label as « · <count>». */
    count?: string | undefined;
    children: Snippet;
  }

  const { label, count, children }: Props = $props();
</script>

<Panel>
  <details class="fold">
    <summary class="lbl"
      >{label}{#if count}<span class="n">{' · ' + count}</span>{/if}</summary
    >
    <div class="body">{@render children()}</div>
  </details>
</Panel>

<style>
  /* off `.lbl` in Field.svelte */
  .lbl {
    font-size: 11.5px;
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted2);
    cursor: pointer;
    width: fit-content;
    /* A 24 px target (WCAG 2.5.8) from 16 px of text; the negative margin keeps
       everything under it in place. */
    padding-block: 4px;
    margin-block: -4px;
  }

  .n {
    font-weight: 500;
    letter-spacing: normal;
    text-transform: none;
  }

  .body {
    margin-top: 14px;
  }
</style>
