<script lang="ts">
  /* One name typed and sent: a new source or section, or a rename (m18, m19 in the
     homebrew mocks). Enter sends, Escape cancels. The caller answers an error text or
     null; the text draws under the field and the typed name stays. A caller that
     creates takes one id pair when the field opens and sends it on every press until an
     `ok`, so a press after a lost answer never makes a second row
     (docs/specs/FEATURES.md, "Homebrew"). */
  import Button from './Button.svelte';
  import TextInput from './TextInput.svelte';

  interface Props {
    id: string;
    label: string;
    value?: string;
    /** The send button's text: «Создать» or «Сохранить». */
    submit: string;
    cancel: string;
    onsubmit: (name: string) => Promise<string | null>;
    oncancel: () => void;
  }

  const { id, label, value = '', submit, cancel, onsubmit, oncancel }: Props = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(value);
  let error = $state<string | null>(null);
  let busy = $state(false);
  let el = $state<HTMLInputElement | undefined>(undefined);

  $effect(() => {
    el?.focus();
  });

  async function send(): Promise<void> {
    if (busy) return;
    busy = true;
    try {
      error = await onsubmit(name);
    } finally {
      busy = false;
    }
    if (error !== null) el?.focus();
  }

  function onkeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.preventDefault();
      void send();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      oncancel();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="namefield" {onkeydown}>
  <label class="lbl" for={id}>{label}</label>
  <div class="row">
    <TextInput
      {id}
      bind:value={name}
      bind:el
      invalid={error !== null}
      describedby={error === null ? undefined : id + '-err'}
      autocomplete="off"
    />
    <Button variant="primary" size="sm" disabled={busy} onclick={() => void send()}
      >{submit}</Button
    >
    <Button variant="ghost" size="sm" onclick={oncancel}>{cancel}</Button>
  </div>
  {#if error !== null}
    <p class="err" id={id + '-err'} role="alert">{error}</p>
  {/if}
</div>

<style>
  .namefield {
    display: grid;
    gap: var(--gap-sm);
  }

  .lbl {
    font-size: 13px;
    color: var(--muted);
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--gap-sm);
  }

  .row :global(input) {
    flex: 1 1 200px;
    width: auto;
    height: 38px;
  }

  .err {
    margin: 0;
    font-size: 13px;
    color: var(--danger-text);
  }
</style>
