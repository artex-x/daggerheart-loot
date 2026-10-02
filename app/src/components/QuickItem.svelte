<script lang="ts">
  /* «Свой предмет» on an account list: a name and a description make a plain item in the
     default source, then one entry of this list refers to it. Two writes in order: the
     item, awaited, then the entry through the list's buffer, which the database refuses
     before its item exists. One id and key are kept until an `ok`, so a lost answer and a
     second press make one item (docs/specs/FEATURES.md, "Lists"). */
  import { onMount, tick } from 'svelte';
  import Actions from './Actions.svelte';
  import Button from './Button.svelte';
  import FormField from './FormField.svelte';
  import Panel from './Panel.svelte';
  import TextArea from './TextArea.svelte';
  import TextInput from './TextInput.svelte';
  import { limitText } from '../lib/cloudLists.js';
  import { homebrewItemHash } from '../lib/hash.js';
  import {
    counterFrom,
    DESC_MAX,
    NAME_MAX,
    type HomebrewContent,
    type Problem
  } from '../lib/homebrew.js';
  import {
    contentOf,
    draftOf,
    fieldOf,
    formProblems,
    problemText
  } from '../lib/homebrewForm.js';
  import type { NewIds } from '../state/homebrew.svelte.js';
  import type { AppState } from '../state/app.svelte.js';

  interface Props {
    app: AppState;
    listId: string;
    onclose: () => void;
  }

  const { app, listId, onclose }: Props = $props();

  const t = $derived(app.t);

  let name = $state('');
  let desc = $state('');
  let problems = $state<Problem[]>([]);
  let refused = $state<string | null>(null);
  let busy = $state(false);
  let ids: NewIds | null = null;
  let nameEl = $state<HTMLInputElement | undefined>(undefined);
  let descEl = $state<HTMLTextAreaElement | undefined>(undefined);
  let root = $state<HTMLElement | undefined>(undefined);

  const nameProblem = $derived(problems.find((p) => fieldOf(p) === 'hb-name'));
  const descProblem = $derived(problems.find((p) => fieldOf(p) === 'hb-desc'));
  /* Code points, as the validator counts. */
  const descLength = $derived(Array.from(desc).length);

  onMount(() => {
    ids = app.homebrew?.newIds() ?? null;
    nameEl?.focus();
  });

  async function add(): Promise<void> {
    const store = app.homebrew;
    const lists = app.cloudLists;
    if (busy || !store || !lists || !ids) return;
    refused = null;
    const draft = { ...draftOf(null, app.lang), name, desc };
    const found = formProblems(draft, app.lang, null, store.books);
    problems = found;
    if (found.length) {
      (found.some((p) => fieldOf(p) === 'hb-name') ? nameEl : descEl)?.focus();
      return;
    }
    if (store.status !== 'ready') {
      refused = store.status === 'error' ? t.hbLoadFailed : t.hbNotReady;
      return;
    }
    /* A full list would refuse the entry after the item is made, leaving the item out of
       the list: nothing is written. With no limit known the write goes as before. */
    const full = lists.entryLimit;
    if (full !== null && (lists.get(listId)?.ids.length ?? 0) >= full) {
      refused = limitText('entries_per_list', full, t);
      return;
    }
    busy = true;
    const pair = ids;
    try {
      const r = await store.createItem(
        pair,
        null,
        contentOf(draft, app.lang, null) as HomebrewContent
      );
      if (!r.ok) {
        refused = r.error === 'limit' ? limitText(r.key, r.value, t) : t.quickFailed;
        return;
      }
      ids = store.newIds();
      lists.add(listId, [pair.key], (id) => app.knows(id));
      const shown = name.trim();
      name = '';
      desc = '';
      app.say((t) => t.quickAdded.replace('%s', shown), {
        action: { label: (t) => t.edit, href: homebrewItemHash(pair.key) }
      });
    } finally {
      busy = false;
    }
    await tick();
    nameEl?.focus();
  }

  /* Enter in the name adds; Escape anywhere in the panel closes it. */
  function onkeydown(e: KeyboardEvent): void {
    const at = document.activeElement;
    if (e.key === 'Enter' && at !== null && at === nameEl) {
      e.preventDefault();
      void add();
    } else if (e.key === 'Escape' && at !== null && root?.contains(at)) {
      e.preventDefault();
      onclose();
    }
  }
</script>

<svelte:window {onkeydown} />

<Panel style="margin-bottom:16px">
  <section class="quick" bind:this={root} aria-labelledby="qi-head">
    <h2 id="qi-head">{t.quickHead}</h2>
    <FormField
      label={t.hbName}
      for="qi-name"
      required
      error={nameProblem && problemText(nameProblem, t)}
      errorId="qi-name-err"
    >
      <TextInput
        id="qi-name"
        bind:value={name}
        bind:el={nameEl}
        maxlength={NAME_MAX}
        required
        invalid={!!nameProblem}
        describedby={nameProblem ? 'qi-name-err' : undefined}
        autocomplete="off"
        oninput={() => {
          problems = problems.filter((p) => fieldOf(p) !== 'hb-name');
        }}
      />
    </FormField>
    <FormField
      label={t.hbDesc}
      for="qi-desc"
      error={descProblem && problemText(descProblem, t)}
      errorId="qi-desc-err"
    >
      <TextArea
        id="qi-desc"
        bind:value={desc}
        bind:el={descEl}
        maxlength={DESC_MAX}
        invalid={!!descProblem}
        describedby={descProblem ? 'qi-desc-err' : undefined}
        oninput={() => {
          problems = problems.filter((p) => fieldOf(p) !== 'hb-desc');
        }}
      />
      {#if descLength > counterFrom(DESC_MAX)}
        <span class="counter">{descLength} / {DESC_MAX}</span>
      {/if}
    </FormField>
    <Actions>
      <Button size="sm" variant="primary" disabled={busy} onclick={() => void add()}
        >{t.addToList}</Button
      >
      <Button size="sm" variant="ghost" onclick={onclose}>{t.cancel}</Button>
    </Actions>
    {#if refused}<p class="refused" role="alert">{refused}</p>{/if}
    <p class="note">{t.quickNote}</p>
  </section>
</Panel>

<style>
  .quick {
    display: grid;
    gap: 14px;
  }

  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 650;
  }

  .refused,
  .note {
    margin: 0;
    font-size: 13px;
    color: var(--muted);
  }

  .refused {
    color: var(--danger-text);
  }

  .counter {
    justify-self: end;
    font-size: 12.5px;
    color: var(--muted2);
  }
</style>
