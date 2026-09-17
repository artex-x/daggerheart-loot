<script lang="ts">
  /* The "?" that folds a help box open - off `.helpbtn` in style.css and the
   * live app's several `data-act="...Help"` buttons, which all carry the
   * same title/aria-label (`whatIsThis`, the rewrite's `helpHint`).
   *
   * Extracted on its second use: the page-level button (`PageHead.svelte`)
   * and the money picker's own, smaller one (`ListPage.svelte`, B5.4) draw
   * the same button at two sizes. */
  import { dict } from '../lib/dict.js';
  import type { Lang } from '../lib/types.js';

  interface Props {
    lang: Lang;
    open: boolean;
    onclick: () => void;
    /** `.helpbtn.sm` (style.css:696) - 22x22 at every width, the class
     *  specificity keeping it there even inside the 600px override. */
    size?: 'sm';
  }

  const { lang, open, onclick, size }: Props = $props();

  const t = $derived(dict(lang));
</script>

<button
  type="button"
  class="helpbtn"
  class:sm={size === 'sm'}
  class:on={open}
  title={t.helpHint}
  aria-label={t.helpHint}
  aria-expanded={open}
  {onclick}>?</button
>

<style>
  /* off `.helpbtn` in style.css */
  .helpbtn {
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--line2);
    background: var(--surface);
    color: var(--muted);
    font: 700 14px/1 var(--mono);
    transition: 0.15s;
    position: relative;
    cursor: pointer;
  }

  .helpbtn:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  .helpbtn.on {
    background: var(--gold);
    border-color: var(--gold);
    color: var(--ink-on-gold);
  }

  .helpbtn::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 44px;
    height: 44px;
    transform: translate(-50%, -50%);
  }

  /* style.css:696 - a higher-specificity rule that keeps the small variant at
     22x22 even inside the 600px block below. */
  .helpbtn.sm {
    width: 22px;
    height: 22px;
    font-size: 12px;
  }

  @media (max-width: 600px) {
    .helpbtn {
      width: 34px;
      height: 34px;
      font-size: 16px;
    }
  }
</style>
