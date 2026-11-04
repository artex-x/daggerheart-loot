<script lang="ts">
  /* The labeled close of a dialog: `Sheet` and the record dialog. The caller passes the
     word, so the component reads no state. */
  import Icon from './Icon.svelte';

  interface Props {
    label: string;
    onclick: () => void;
  }

  const { label, onclick }: Props = $props();
</script>

<button type="button" class="dlg-x" {onclick}><Icon name="close" /><span>{label}</span></button>

<style>
  .dlg-x {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 12px;
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    background: transparent;
    color: var(--txt);
    font: 600 var(--t-data) / 1 var(--ui);
  }

  .dlg-x:hover {
    border-color: var(--muted2);
  }
</style>
