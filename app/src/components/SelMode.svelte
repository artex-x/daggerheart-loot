<script lang="ts">
  /* «Выбрать»: opens a list page's selection mode (DESIGN.md, "Selection bar"). The catalog,
     search, the own items and both list pages draw it; `SelBar` and `HomebrewBulk` find it
     by `button.selmode` to give it the focus back. */
  interface Props {
    label: string;
    onclick: () => void;
  }

  const { label, onclick }: Props = $props();
</script>

<button type="button" class="selmode" {onclick}>{label}</button>

<style>
  .selmode {
    flex: none;
    height: 40px;
    padding: 0 11px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: var(--surface);
    color: var(--txt);
    font: 600 var(--t-data) / 1 var(--ui);
  }

  .selmode:hover {
    border-color: var(--muted2);
  }

  @media (max-width: 760px) {
    .selmode {
      padding: 0 9px;
    }
  }
</style>
