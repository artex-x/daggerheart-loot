<script lang="ts">
  /* A combobox that picks records or cards into a short list (m06 in the homebrew mocks):
     the chosen rows with their remove buttons, then a text field whose list offers at most
     eight matches. ArrowDown and ArrowUp move, Enter or a click picks, Escape closes,
     Backspace in an empty field removes the last chosen one. The caller finds the options
     and keeps the chosen ones (docs/specs/FEATURES.md, "Homebrew", "Relations"). */
  import { tick } from 'svelte';
  import type { Dict } from '../lib/dict.js';
  import type { PickOption } from '../lib/homebrewForm.js';
  import { foldQuery } from '../lib/search.js';

  interface Props {
    /** The text field's id; the list and its options take it as a prefix. */
    id: string;
    /** The field's and the list's accessible name. */
    label: string;
    chosen: readonly PickOption[];
    max: number;
    /** The options for `q` (folded, not empty), the chosen ones already left out. */
    find: (q: string) => readonly PickOption[];
    placeholder: string;
    /** The placeholder once something is chosen. */
    placeholderMore?: string | undefined;
    /** The disabled field's text at `max`; absent, a full picker draws no field. */
    full?: string | undefined;
    invalid?: boolean;
    describedby?: string | undefined;
    t: Dict;
    onpick: (id: string) => void;
    onremove: (id: string) => void;
  }

  const {
    id,
    label,
    chosen,
    max,
    find,
    placeholder,
    placeholderMore,
    full,
    invalid = false,
    describedby,
    t,
    onpick,
    onremove
  }: Props = $props();

  const SHOWN = 8;

  let query = $state('');
  let focused = $state(false);
  /* Escape closed the list; the next input opens it again. */
  let closed = $state(false);
  let active = $state(0);
  let input = $state<HTMLInputElement | undefined>(undefined);
  let rows = $state<HTMLUListElement | undefined>(undefined);

  const q = $derived(foldQuery(query.trim()));
  const found = $derived(q ? find(q) : []);
  const options = $derived(found.slice(0, SHOWN));
  const open = $derived(focused && q !== '' && !closed);
  const drawn = $derived(open && options.length > 0);
  const message = $derived(
    !open
      ? ''
      : found.length > SHOWN
        ? t.hbPickMore.replace('%n', String(found.length - SHOWN))
        : found.length
          ? ''
          : t.hbPickNone
  );
  const isFull = $derived(chosen.length >= max);

  async function pick(option: PickOption): Promise<void> {
    onpick(option.id);
    query = '';
    active = 0;
    await tick();
    if (chosen.length >= max) {
      const xs = rows?.querySelectorAll<HTMLButtonElement>('button.x');
      xs?.[xs.length - 1]?.focus();
    } else {
      input?.focus();
    }
  }

  async function remove(option: PickOption): Promise<void> {
    onremove(option.id);
    await tick();
    input?.focus();
  }

  function move(step: number): void {
    active = Math.max(0, Math.min(options.length - 1, active + step));
    document
      .getElementById(id + '-opt-' + String(active))
      ?.scrollIntoView({ block: 'nearest' });
  }

  function onkeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!drawn) return;
      e.preventDefault();
      move(e.key === 'ArrowDown' ? 1 : -1);
    } else if (e.key === 'Enter') {
      const option = options[active];
      if (drawn && option) {
        e.preventDefault();
        void pick(option);
      } else if (q) {
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      if (!open) return;
      e.preventDefault();
      closed = true;
    } else if (e.key === 'Backspace' && query === '') {
      const last = chosen[chosen.length - 1];
      if (last) onremove(last.id);
    }
  }
</script>

<div class="picker">
  {#if chosen.length}
    <ul class="chosen" bind:this={rows}>
      {#each chosen as c (c.id)}
        <li>
          <span class="nm"
            >{c.name}{#if c.meta}<small>{c.meta}</small>{/if}</span
          >
          <button
            type="button"
            class="x"
            aria-label={t.hbRemove.replace('%s', c.name)}
            onclick={() => void remove(c)}><i aria-hidden="true">&times;</i></button
          >
        </li>
      {/each}
    </ul>
  {/if}
  {#if !isFull}
    <div class="wrap">
      <input
        type="text"
        role="combobox"
        aria-autocomplete="list"
        autocomplete="off"
        {id}
        bind:this={input}
        bind:value={query}
        placeholder={chosen.length && placeholderMore ? placeholderMore : placeholder}
        aria-label={label}
        aria-expanded={drawn}
        aria-controls={drawn ? id + '-list' : undefined}
        aria-activedescendant={drawn ? id + '-opt-' + String(active) : undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedby}
        onfocus={() => {
          focused = true;
        }}
        onblur={() => {
          focused = false;
        }}
        oninput={() => {
          closed = false;
          active = 0;
        }}
        {onkeydown}
      />
      {#if focused}
        <!-- The field keeps the focus and its keys drive the list: a press on an option or
             on the list's scrollbar would blur the field and close the list. -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="drop"
          class:on={drawn || message !== ''}
          onmousedown={(e) => {
            e.preventDefault();
          }}
        >
          {#if drawn}
            <ul id={id + '-list'} role="listbox" aria-label={label}>
              {#each options as o, i (o.id)}
                <!-- A click picks; the field's keys drive the list. -->
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <li
                  role="option"
                  id={id + '-opt-' + String(i)}
                  aria-selected={i === active}
                  class:active={i === active}
                  onclick={() => void pick(o)}
                >
                  <span class="nm"
                    >{o.name}{#if o.meta}<small>{o.meta}</small>{/if}</span
                  >
                </li>
              {/each}
            </ul>
          {/if}
          <p class="pickmsg" class:said={message !== ''} role="status">{message}</p>
        </div>
      {/if}
    </div>
  {:else if full}
    <input type="text" {id} disabled aria-label={label} placeholder={full} />
  {/if}
</div>

<style>
  .picker {
    display: grid;
    gap: var(--gap-sm);
    min-width: 0;
  }

  .chosen {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }

  .chosen li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 6px 6px 12px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line);
  }

  .nm {
    display: grid;
    min-width: 0;
    flex: 1;
    overflow-wrap: anywhere;
  }

  .nm small {
    font-size: 12px;
    color: var(--muted2);
  }

  .x {
    flex: none;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: var(--r-sm);
    background: none;
    color: var(--muted);
    font-size: 18px;
    cursor: pointer;
  }

  .x:hover {
    color: var(--txt);
  }

  .x i {
    font-style: normal;
  }

  .wrap {
    position: relative;
  }

  input {
    width: 100%;
    height: 38px;
    padding: 0 14px;
    border-radius: var(--r-sm);
    background: var(--bg2);
    border: 1px solid var(--line2);
    color: var(--txt);
    font: inherit;
  }

  input:focus {
    outline: none;
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgb(216 171 94 / 14%);
  }

  input:disabled {
    opacity: 0.6;
  }

  .drop {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 20;
    max-height: min(320px, 50vh);
    overflow-y: auto;
  }

  .drop.on {
    background: var(--surface2);
    border: 1px solid var(--line2);
    border-radius: var(--r-sm);
    box-shadow: var(--shadow);
  }

  .drop ul {
    list-style: none;
    margin: 0;
    padding: 4px;
  }

  .drop li {
    padding: 7px 10px;
    border-radius: var(--r-sm);
    cursor: pointer;
  }

  .drop li.active {
    background: var(--surface);
    color: var(--gold);
  }

  .pickmsg {
    margin: 0;
    font-size: 12.5px;
    color: var(--muted2);
  }

  .pickmsg.said {
    padding: 8px 14px;
  }

  @media (max-width: 600px) {
    input {
      height: 44px;
    }
  }
</style>
