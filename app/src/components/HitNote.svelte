<script lang="ts">
  /* One "for players" / "GM only" note, off `ListPage.svelte`'s own `hitnote`
     snippet (app.js's `notePairHTML`, 3109-3128, drawn one label at a time).
     Extracted on its second real use - the list page's rolled entry (B5.4a)
     and the shared page (B5.6), which draws two above the rows and two more
     after every entry. Renders nothing when `text` is empty. */
  import Icon from './Icon.svelte';
  import type { IconName } from '../lib/icons.js';

  interface Props {
    icon: IconName;
    label: string;
    text: string | undefined;
  }

  const { icon, label, text }: Props = $props();
</script>

{#if text}
  <div class="hitnote">
    <Icon name={icon} />
    <span
      ><b>{label}</b>{#each text.split('\n') as line, i (i)}{#if i > 0}<br
          />{/if}{line}{/each}</span
    >
  </div>
{/if}

<style>
  /* off `.hitnote` and its four (style.css:626-633) */
  .hitnote {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 12px;
    padding: 10px 12px;
    border: 1px solid var(--line2);
    border-left: 2px solid var(--gold);
    border-radius: 9px;
    background: rgb(216 171 94 / 6%);
    font-size: 13px;
    line-height: 1.5;
    color: var(--txt);
  }

  .hitnote :global(svg) {
    fill: var(--gold);
    margin-top: 3px;
    flex: none;
  }

  .hitnote b {
    display: block;
    font-size: 10.5px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted2);
    font-weight: 650;
    margin-bottom: 2px;
  }

  .hitnote span {
    min-width: 0;
    overflow-wrap: break-word;
  }

  /* A scoped `.hitnote + .hitnote` cannot be matched inside one instance's own
     template - Svelte prunes a rule no element of *this* component's markup
     can satisfy, and `npm run check` fails on the pruned CSS. `:global` keeps
     it, and placed after the base rule the two are equal in specificity, so
     source order is what makes the 8px win - exactly what decides it in the
     live cascade, which reaches both instances through one specificity-based
     rule. */
  :global(.hitnote + .hitnote) {
    margin-top: 8px;
  }
</style>
