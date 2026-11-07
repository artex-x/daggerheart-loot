<script lang="ts">
  /* The page help beside an H1 (`PageHead.svelte`), off `.helpbtn` in style.css: a round
   * «?» up to 760 px, its name visible from 761 px. It has no `title`: Chrome would expose
   * it as a description equal to the name, and the hint is the open box, not a hover
   * (FEATURES.md, rule 15 (c)). */
  interface Props {
    open: boolean;
    onclick: () => void;
    /** The name: the help's own button name. */
    label: string;
  }

  const { open, onclick, label }: Props = $props();
</script>

<button type="button" class="helpbtn" class:on={open} aria-expanded={open} {onclick}
  ><span class="q" aria-hidden="true">?</span><span class="txt">{label}</span></button
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
    font: 700 var(--t-control)/1 var(--ui);
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

  @media (max-width: 600px) {
    .helpbtn {
      width: 34px;
      height: 34px;
      font-size: var(--t-body);
    }
  }

  /* The `.vh` rule of `styles/tokens.css` up to 760 px, where the label stays the name. */
  .txt {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (min-width: 761px) {
    .helpbtn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: auto;
      height: 32px;
      padding: 0 12px 0 10px;
      border-radius: var(--r-sm);
      font: 600 var(--t-data) / 1 var(--ui);
    }

    .q {
      font: 700 var(--t-control) / 1 var(--ui);
    }

    .txt {
      position: static;
      width: auto;
      height: auto;
      overflow: visible;
      clip-path: none;
    }
  }
</style>
