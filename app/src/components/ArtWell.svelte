<script lang="ts">
  /* The art well (DESIGN.md, "Cards"): the dark square every screen picture sits
     on, with the glyph of the record's kind under the picture. A record with no
     picture, or with a broken one, shows the glyph alone; a picture that is still
     loading covers it once it decodes. The caller sizes the well. */
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import type { IconName } from '../lib/icons.js';

  interface Props {
    glyph: IconName;
    /** The picture, when the record has a working one. */
    children?: Snippet;
  }

  const { glyph, children }: Props = $props();
</script>

<span class="well"
  ><span class="glyph"><Icon name={glyph} /></span>{#if children}{@render children()}{/if}</span
>

<style>
  /* The glyph and the picture share one grid cell rather than an absolute box: a
     positioned child would paint over the caller's inset focus ring. */
  .well {
    display: grid;
    grid-template: 100% / 100%;
    place-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--art-well);
    border-radius: inherit;
  }

  .glyph,
  .well > :global(img) {
    grid-area: 1 / 1;
  }

  .glyph {
    display: grid;
    place-items: center;
    width: 42%;
    height: 42%;
    color: var(--line2);
  }

  .glyph :global(svg) {
    width: 100%;
    height: 100%;
  }

  .well > :global(img) {
    place-self: stretch;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
</style>
