<script lang="ts">
  /* A toggle on a meta line («Заметки ▾» on the list pages): underlined text with a chevron
     that turns while open, so it reads as a control (docs/specs/FEATURES.md, "Lists"). */
  import Icon from './Icon.svelte';

  interface Props {
    label: string;
    expanded: boolean;
    onclick: () => void;
  }

  let { label, expanded, onclick }: Props = $props();
</script>

<button type="button" class="metat" aria-expanded={expanded} {onclick}
  >{label}<Icon name="chevron" /></button
>

<style>
  /* A 24 px target; up to 600 px the thumb target by its padded box, the line's height kept. */
  .metat {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-height: 24px;
    padding: 0;
    border: 0;
    background: none;
    color: var(--txt);
    font: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    cursor: pointer;
  }

  .metat :global(svg) {
    width: 16px;
    height: 16px;
  }

  .metat[aria-expanded='true'] :global(svg) {
    transform: rotate(180deg);
  }

  @media screen and (max-width: 600px) {
    .metat {
      min-height: var(--thumb);
      margin-block: min(0px, calc((24px - var(--thumb)) / 2));
    }
  }
</style>
