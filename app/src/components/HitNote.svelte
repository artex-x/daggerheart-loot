<script lang="ts">
  /* One "for players" / "GM only" note, off `ListPage.svelte`'s own `hitnote`
     snippet (`notePairHTML` in `git show 23c00a6^:app.js`, drawn one label at a time).
     Extracted on its second real use - the list page's rolled entry
     and the shared page, which draws two above the rows and two more
     inside every entry's row. Renders nothing when `text` is empty. The note is formatted
     text (docs/specs/FEATURES.md, "Lists"), drawn by Markup. */
  import FoldButton from './FoldButton.svelte';
  import Icon from './Icon.svelte';
  import Markup from './Markup.svelte';
  import type { Dict } from '../lib/dict.js';
  import type { IconName } from '../lib/icons.js';
  import { parseMarkup } from '../lib/markup.js';

  interface Props {
    icon: IconName;
    label: string;
    text: string | undefined;
    t: Dict;
    /** The «Только для мастера» note: on the darker ground, the style of the owner's GM
     *  note field. */
    gm?: boolean;
    /** Up to 760 px (the caller's band): a note longer than four lines shows four and a
     *  button that opens it whole (docs/specs/FEATURES.md, "Lists"). */
    fold?: boolean;
  }

  const { icon, label, text, t, gm = false, fold = false }: Props = $props();

  let open = $state(false);
  let over = $state(false);
  let body = $state<HTMLElement>();

  /* Measures the clamped body while it is folded; an open note keeps its button until
     pressed. Without a ResizeObserver (jsdom) it measures once on mount. */
  $effect(() => {
    const el = body;
    void text;
    if (!el || !fold || open) return;
    const measure = (): void => {
      over = el.scrollHeight > el.clientHeight + 1;
    };
    measure();
    if (typeof ResizeObserver !== 'function') return;
    const watch = new ResizeObserver(measure);
    watch.observe(el);
    return () => {
      watch.disconnect();
    };
  });
</script>

{#if text}
  <div class="hitnote" class:gm>
    <Icon name={icon} />
    <div class="htext mdtext">
      <b>{label}</b>
      <div class="nbody" class:clamp={fold && !open} bind:this={body}>
        <Markup blocks={parseMarkup(text)} />
      </div>
      {#if fold && (open || over)}
        <FoldButton
          {open}
          more={t.noteMore}
          {t}
          ontoggle={() => {
            open = !open;
          }}
        />
      {/if}
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
    /* As wide as its text (DESIGN.md, "The Measure Rule"). */
    width: fit-content;
    max-width: 100%;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    font-size: var(--t-data);
    line-height: 1.5;
    color: var(--txt);
  }

  .hitnote.gm {
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
    max-width: var(--note-measure, var(--measure-text));
    overflow-wrap: break-word;
  }

  /* Four lines of the note's 1.5 line height. A line clamp does not cut a table, and
     WebKit clamps nested blocks badly (docs/decisions/, 2026-11-18, "A compact row shows
     each fact once and a long note folds up to 760 px"). */
  .nbody.clamp {
    max-height: 6em;
    overflow: hidden;
  }

  /* A scoped `.hitnote + .hitnote` cannot be matched inside one instance's own
     template - Svelte prunes a rule no element of *this* component's markup
     can satisfy, and `npm run check` fails on the pruned CSS. `:global` keeps
     it, and placed after the base rule the two are equal in specificity, so
     source order is what makes the 8px win. */
  :global(.hitnote + .hitnote) {
    margin-top: 8px;
  }

  /* From 761 px the notes of one place (a list's lead line, an entry's row) stand in a
     wrapping group. A pair is two equal columns, each text at most the text measure: the
     boxes stand side by side while the group holds two of 5/7 of it, so every row at one
     width looks the same, and stretch to one height. A note with no sibling takes the line
     measure (DESIGN.md, "The Measure Rule"). The gap replaces the stacked margins; up to
     760 px the notes stack and fold as before. */
  @media (min-width: 761px) {
    :global(.hitnotes) {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    :global(.hitnotes > .hitnote) {
      margin-top: 0;
    }

    :global(.hitnotes > .hitnote:is(.hitnote ~ .hitnote, :has(~ .hitnote))) {
      flex: 1 1 calc(var(--measure-text) * 5 / 7);
      min-width: 0;
      max-width: max-content;
    }

    :global(.hitnotes > .hitnote:is(.hitnote ~ .hitnote, :has(~ .hitnote))) .htext {
      width: var(--measure-text);
    }

    :global(.hitnotes > .hitnote:not(.hitnote ~ .hitnote):not(:has(~ .hitnote))) {
      --note-measure: var(--measure-line);
    }
  }
</style>
