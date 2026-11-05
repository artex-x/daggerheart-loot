<script lang="ts">
  /* One "for players" / "GM only" note, off `ListPage.svelte`'s own `hitnote`
     snippet (`notePairHTML` in `git show 23c00a6^:app.js`, drawn one label at a time).
     Extracted on its second real use - the list page's rolled entry
     and the shared page, which draws two above the rows and two more
     inside every entry's row. Renders nothing when `text` is empty. The note is formatted
     text (docs/specs/FEATURES.md, "Lists"), drawn by Markup. */
  import Icon from './Icon.svelte';
  import Markup from './Markup.svelte';
  import type { IconName } from '../lib/icons.js';
  import { parseMarkup } from '../lib/markup.js';

  interface Props {
    icon: IconName;
    label: string;
    text: string | undefined;
    /** The «Только для мастера» note: a dashed box on the darker ground, the style of the
     *  owner's GM note field. */
    gm?: boolean;
  }

  const { icon, label, text, gm = false }: Props = $props();
</script>

{#if text}
  <div class="hitnote" class:gm>
    <Icon name={icon} />
    <div class="htext mdtext">
      <b>{label}</b>
      <Markup blocks={parseMarkup(text)} />
    </div>
  </div>
{/if}

<style>
  /* A full box with no accent and no gold: a note is nobody's pick (DESIGN.md, "The Seal
     Rule"). */
  .hitnote {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 12px;
    padding: 10px 12px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    font-size: var(--t-data);
    line-height: 1.5;
    color: var(--txt);
  }

  .hitnote.gm {
    border-style: dashed;
    background: var(--bg2);
  }

  .hitnote :global(svg) {
    fill: var(--muted2);
    margin-top: 3px;
    flex: none;
  }

  .hitnote b {
    display: block;
    font-size: var(--t-badge);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    font-weight: 650;
    margin-bottom: 2px;
  }

  .htext {
    min-width: 0;
    overflow-wrap: break-word;
  }

  /* A scoped `.hitnote + .hitnote` cannot be matched inside one instance's own
     template - Svelte prunes a rule no element of *this* component's markup
     can satisfy, and `npm run check` fails on the pruned CSS. `:global` keeps
     it, and placed after the base rule the two are equal in specificity, so
     source order is what makes the 8px win. */
  :global(.hitnote + .hitnote) {
    margin-top: 8px;
  }
</style>
