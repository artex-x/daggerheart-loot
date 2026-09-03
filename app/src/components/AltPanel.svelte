<script lang="ts">
  /* The alternate tables: the one mode that rolls two dice at once.

     Hope and Fear are columns rather than a sum - Hope holds what aids and
     protects, Fear what harms and deceives - so a roll offers a row from each,
     in both the item and the consumable table, and the player takes one. Equal
     faces are a critical success, and then the whole rarity is on offer rather
     than a row: that is what the box above the cards is for. */
  import Button from './Button.svelte';
  import Chip from './Chip.svelte';
  import ChipRow from './ChipRow.svelte';
  import Die from './Die.svelte';
  import Field from './Field.svelte';
  import Icon from './Icon.svelte';
  import NumberField from './NumberField.svelte';
  import OrGrid from './OrGrid.svelte';
  import PageHead from './PageHead.svelte';
  import RecordActions from './RecordActions.svelte';
  import RecordCard from './RecordCard.svelte';
  import RecordModal from './RecordModal.svelte';
  import { RARITIES, RARITY_TIERS, altPicks, altTables, bumpUp } from '../lib/alt.js';
  import type { AltPick } from '../lib/alt.js';
  import { helpFor } from '../lib/help.js';
  import { tablesHash } from '../lib/hash.js';
  import { isCrit, rollDuality } from '../lib/roll.js';
  import { rarityKey } from '../lib/label.js';
  import { shareRoll } from '../lib/share.js';
  import { LOOT_KINDS, isLastOn } from '../lib/std.js';
  import type { Chosen, LootKind } from '../lib/std.js';
  import type { AppState } from '../state/app.svelte.js';
  import type { Index } from '../lib/data.js';
  import type { Dict } from '../lib/dict.js';
  import type { Rarity } from '../lib/money.js';
  import type { Record_ } from '../lib/types.js';

  interface Props {
    app: AppState;
  }

  const { app }: Props = $props();

  const t = $derived(app.t);
  const index = $derived(app.index);

  /* The pair the live app opens on: not a crit, so the box below is something
     a person arrives at rather than something they start inside. */
  let rarity = $state<Rarity>('common');
  let roll = $state({ hope: 1, fear: 2 });
  let kinds = $state<Chosen<LootKind>>({ item: true, consumable: true });

  let open = $state<Record_ | null>(null);
  let said = $state('');

  const say = (msg: string): void => {
    said = msg;
  };

  const picks = $derived(index ? altPicks(index, rarity, roll, kinds) : []);
  const crit = $derived(isCrit(roll));
  /* A critical success on the top rarity has nowhere to go, so the offer is
     the tables alone. */
  const bump = $derived(bumpUp(rarity));

  const KIND_LABEL: Record<LootKind, keyof Dict> = { item: 'fItems', consumable: 'fCons' };

  /* The names each field and its two steppers answer to, built once per die.
     In the live app both fields are called "Roll result" and all four steppers
     "One lower" / "One higher", so a screen reader hears the same two controls
     twice over and nothing says which die is being changed - on the one screen
     where that is the whole point. The deviation is recorded in ACCEPTED in
     tests/parity/specs.js. */
  const names = (die: string): { label: string; down: string; up: string } => ({
    label: `${die}: ${t.rollResult}`,
    down: `${die}: ${t.stepDown}`,
    up: `${die}: ${t.stepUp}`
  });

  const hopeNames = $derived(names(t.hopeDie));
  const fearNames = $derived(names(t.fearDie));

  /** The tiers a rarity is a recommendation for, as the chip caption reads. */
  const tierCaption = (r: Rarity): string => `${t.tier} ${RARITY_TIERS[r]}`;

  const help = $derived(helpFor('alt', app.lang));

  /* The roll and the index together, and only where there is a choice to hand
     over: one card is a result rather than a set of options. */
  const choice = $derived(
    index && picks.length > 1 ? { index, pool: picks.map((p) => p.it) } : null
  );

  async function copyRoll(one: { index: Index; pool: Record_[] }): Promise<void> {
    const { text, html } = shareRoll(one.pool, one.index, app.lang, t.or);
    const ok = await app.env.clipboard.writeRich({ html, plain: text });
    said = ok ? t.textCopied : t.copyFailed;
  }

  function toggleKind(kind: LootKind): void {
    if (isLastOn(kinds, LOOT_KINDS, kind)) {
      said = t.keepOneKind;
      return;
    }
    kinds = { ...kinds, [kind]: !kinds[kind] };
  }
</script>

<PageHead {app} title={t.pageAlt} sub={t.subAlt} {help} {say} />

<div class="panel">
  <Field label={t.rarity}>
    <ChipRow>
      {#each RARITIES as r (r)}
        <Chip
          label={t[rarityKey(r)]}
          sub={tierCaption(r)}
          on={r === rarity}
          onclick={() => {
            rarity = r;
          }}
        />
      {/each}
    </ChipRow>
  </Field>

  <Field label={t.rollResult}>
    <div class="numrow">
      <!-- Each die is labelled, because which one found a card is half of what
           the card says. The label is above the field rather than beside it:
           two named fields side by side need the names to line up. -->
      <div class="dieblock">
        <span class="dielbl h">{t.hopeDie}</span>
        <NumberField
          value={roll.hope}
          min={1}
          max={12}
          label={hopeNames.label}
          stepDownLabel={hopeNames.down}
          stepUpLabel={hopeNames.up}
          tone="hope"
          onchange={(n: number) => {
            roll = { ...roll, hope: n };
          }}
        />
      </div>
      <div class="dieblock">
        <span class="dielbl f">{t.fearDie}</span>
        <NumberField
          value={roll.fear}
          min={1}
          max={12}
          label={fearNames.label}
          stepDownLabel={fearNames.down}
          stepUpLabel={fearNames.up}
          tone="fear"
          onchange={(n: number) => {
            roll = { ...roll, fear: n };
          }}
        />
      </div>
      <!-- Bottom-aligned: the labels above the fields make this column taller
           than the button, and the button belongs on the fields' line. -->
      <div class="rollcell">
        <Button
          variant="primary"
          onclick={() => {
            roll = rollDuality(app.env.random);
          }}
        >
          <Die faces={12} />{t.rollDuality}
        </Button>
      </div>
    </div>
  </Field>

  <Field label={t.filter}>
    <ChipRow>
      {#each LOOT_KINDS as kind (kind)}
        <Chip
          label={t[KIND_LABEL[kind]]}
          on={kinds[kind]}
          title={isLastOn(kinds, LOOT_KINDS, kind) ? t.keepOneKind : undefined}
          onclick={() => {
            toggleKind(kind);
          }}
        />
      {/each}
    </ChipRow>
  </Field>
</div>

{#if choice}
  <div class="resbar">
    <Button size="sm" label={t.copyRoll} onclick={() => void copyRoll(choice)}>
      <Icon name="copy" />{t.copyRoll}
    </Button>
  </div>
{/if}

{#if index && picks.length}
  <div class="results">
    {#if crit}
      <!-- Both tables, because the player may take any entry of this rarity
           from either one. A single link into the items table used to be the
           whole offer, and half the choice was off the screen. -->
      <div class="crit">
        <div class="crit-txt">
          <b>{t.crit}</b>
          <span>{t.critSub}</span>
        </div>
        <div class="crit-acts">
          {#each altTables(kinds) as table (table.table)}
            <Button size="sm" href={app.linkTo(tablesHash(table.table, { anchor: rarity }))}>
              {t[table.label]}<Icon name="external" />
            </Button>
          {/each}
          {#if bump}
            {@const up = bump}
            <Button
              size="sm"
              onclick={() => {
                rarity = up.to;
              }}
            >
              {t[up.label]}
            </Button>
          {/if}
        </div>
      </div>
    {/if}
    <OrGrid or={t.or} items={picks} card={cardOf} />
  </div>
{/if}

{#snippet cardOf(pick: AltPick)}
  {#if index}
    <RecordCard
      variant="compact"
      it={pick.it}
      {index}
      lang={app.lang}
      col={pick.col}
      rollLabel={pick.n}
      artBroken={app.artBroken(pick.it.id)}
      onartfail={(bad: string) => {
        app.markArtBroken(bad);
      }}
      onopen={(r: Record_) => {
        open = r;
      }}
    >
      {#snippet nameActions()}
        <RecordActions {app} {index} it={pick.it} row="name" {say} />
      {/snippet}
      {#snippet actions()}
        <RecordActions {app} {index} it={pick.it} row="card" {say} />
      {/snippet}
    </RecordCard>
  {/if}
{/snippet}

<p class="sr-only" role="status" aria-live="polite">{said}</p>

{#if open && index}
  <RecordModal
    {app}
    {index}
    it={open}
    onclose={() => {
      open = null;
    }}
    onopen={(r: Record_) => {
      open = r;
    }}
  />
{/if}

<style>
  /* off `.panel`, `.numrow`, `.dieblock`, `.dielbl`, `.crit` and `.results` in
     style.css */
  .panel {
    background: linear-gradient(180deg, var(--surface2), var(--surface));
    border: 1px solid var(--line);
    border-radius: var(--r);
    padding: 18px;
    box-shadow: var(--shadow);
  }

  .numrow {
    display: flex;
    gap: 10px;
    align-items: stretch;
    flex-wrap: wrap;
  }

  .dieblock {
    flex: 0 0 auto;
  }

  .dielbl {
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 6px;
    display: block;
  }

  .dielbl.h {
    color: var(--hope);
  }

  .dielbl.f {
    color: var(--fear);
  }

  /* The live app writes this one inline; it is the same two declarations. */
  .rollcell {
    display: flex;
    align-items: flex-end;
  }

  .results {
    margin-top: 26px;
  }

  /* off `.resbar` in style.css */
  .resbar {
    display: flex;
    justify-content: flex-end;
    margin: 22px 0 0;
  }

  .resbar + .results {
    margin-top: 10px;
  }

  .crit {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    flex-wrap: wrap;
    padding: 14px 16px;
    border-radius: var(--r);
    margin-bottom: 18px;
    background: linear-gradient(100deg, rgb(233 185 73 / 16%), rgb(138 114 214 / 16%));
    border: 1px solid rgb(233 185 73 / 42%);
  }

  .crit-txt {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: min(100%, 260px);
    flex: 1;
  }

  .crit b {
    color: var(--gold-soft);
    font-size: 14.5px;
  }

  .crit span {
    color: var(--muted);
    font-size: 13px;
  }

  .crit-acts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    flex: 0 1 auto;
    min-width: 0;
  }

  .crit-acts :global(.btn) {
    max-width: 100%;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  /* On a phone the actions take their own row and share it evenly, rather than
     crowding the text they belong to. Off the mobile block in style.css. */
  @media (max-width: 600px) {
    .crit-acts {
      flex-basis: 100%;
    }

    .crit-acts :global(.btn) {
      flex: 1 1 auto;
      justify-content: center;
    }
  }
</style>
