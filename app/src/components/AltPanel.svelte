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
  import NumRow from './NumRow.svelte';
  import OrGrid from './OrGrid.svelte';
  import RollPage from './RollPage.svelte';
  import RollResult from './RollResult.svelte';
  import RollSelect from './RollSelect.svelte';
  import { RARITIES, altPicks, altTables, bumpUp } from '../lib/alt.js';
  import type { AltPick } from '../lib/alt.js';
  import { helpFor } from '../lib/help.js';
  import { tablesHash } from '../lib/hash.js';
  import { isCrit, rollDuality } from '../lib/roll.js';
  import { rarityKey } from '../lib/label.js';
  import { shareRoll } from '../lib/share.js';
  import { LOOT_KINDS, isLastOn, narrowedLabel } from '../lib/std.js';
  import type { LootKind } from '../lib/std.js';
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

  const picks = $derived(index ? altPicks(index, rarity, roll, app.kinds) : []);
  const crit = $derived(isCrit(roll));
  /* A critical success on the top rarity has nowhere to go, so the offer is
     the tables alone. */
  const bump = $derived(bumpUp(rarity));

  const KIND_LABEL: Record<LootKind, keyof Dict> = { item: 'fItems', consumable: 'fCons' };

  /* The names each field and its two steppers answer to, built once per die.
     The live app named both fields "Roll result" and all four steppers
     "One lower" / "One higher", so a screen reader heard the same two controls
     twice over and nothing said which die was being changed - on the one
     screen where that is the whole point. A deliberate accessibility
     improvement, not a drift: docs/specs/FEATURES.md, the alternate-tables
     bullet naming each die. */
  const names = (die: string): { label: string; down: string; up: string } => ({
    label: `${die}: ${t.rollResult}`,
    down: `${die}: ${t.stepDown}`,
    up: `${die}: ${t.stepUp}`
  });

  const hopeNames = $derived(names(t.hopeDie));
  const fearNames = $derived(names(t.fearDie));

  const help = $derived(helpFor('alt', app.lang));

  /* Both kinds on is the neutral default; a kind narrowed is what lights gold. */
  const allKinds = $derived(LOOT_KINDS.every((kind) => app.kinds[kind]));
  const lit = $derived(
    narrowedLabel(
      [
        {
          left: LOOT_KINDS.filter((kind) => app.kinds[kind]).map((k) => t[KIND_LABEL[k]]),
          of: LOOT_KINDS.length
        }
      ],
      t.setUp
    )
  );
  const rolled = $derived(
    t.rollPair.replace('%a', String(roll.hope)).replace('%b', String(roll.fear))
  );
  const rarityOptions = $derived(RARITIES.map((r) => ({ id: r, label: t[rarityKey(r)] })));

  /* The roll and the index together, and only where there is a choice to hand
     over: one card is a result rather than a set of options. */
  const choice = $derived(
    index && picks.length > 1 ? { index, pool: picks.map((p) => p.it) } : null
  );

  async function copyRoll(one: { index: Index; pool: Record_[] }): Promise<void> {
    /* Its own toast, distinct from a plain text copy. */
    const { text, html } = shareRoll(one.pool, one.index, app.lang, t.or);
    await app.copied(
      () => app.env.clipboard.writeRich({ html, plain: text }),
      (t) => t.rollCopied
    );
  }
</script>

<RollPage
  {app}
  {index}
  title={t.pageAlt}
  sub={t.subAlt}
  {help}
  {rolled}
  {lit}
  copy={choice ? () => void copyRoll(choice) : undefined}
>
  {#snippet controls()}
    <div class="altctrl" class:row={app.band === 'narrow'}>
      {#if app.band === 'narrow'}
        <RollSelect
          label={t.rarity}
          value={rarity}
          options={rarityOptions}
          onchange={(id: string) => {
            rarity = id as Rarity;
          }}
        />
      {:else}
        <Field label={t.rarity}>
          <ChipRow>
            {#each RARITIES as r (r)}
              <Chip
                label={t[rarityKey(r)]}
                on={r === rarity}
                neutral
                onclick={() => {
                  rarity = r;
                }}
              />
            {/each}
          </ChipRow>
        </Field>
      {/if}
      <Button
        variant="primary"
        onclick={() => {
          roll = rollDuality(app.env.random);
        }}
      >
        <Die faces={12} />{t.rollDuality}
      </Button>
    </div>
  {/snippet}

  {#snippet settings()}
    <Field label={t.rollResult}>
      <NumRow>
        <!-- Each die is labeled, because which one found a card is half of what the card
             says. The letter and the word carry it, not the hue alone. -->
        <div class="dieblock">
          <span class="dielbl"
            ><span class="dv h" aria-hidden="true">{t.hopeLetter}</span>{t.hopeDie}</span
          >
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
          <span class="dielbl"
            ><span class="dv f" aria-hidden="true">{t.fearLetter}</span>{t.fearDie}</span
          >
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
      </NumRow>
    </Field>

    <Field label={t.filter}>
      <ChipRow>
        {#each LOOT_KINDS as kind (kind)}
          <Chip
            label={t[KIND_LABEL[kind]]}
            on={app.kinds[kind]}
            neutral={allKinds}
            title={isLastOn(app.kinds, LOOT_KINDS, kind) ? t.keepOneKind : undefined}
            onclick={() => {
              app.toggleKind(kind, LOOT_KINDS);
            }}
          />
        {/each}
      </ChipRow>
    </Field>
  {/snippet}

  {#snippet results(openRecord)}
    {#if index && picks.length}
      <div class="results" data-primary role="status" aria-live="polite">
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
              {#each altTables(app.kinds) as table (table.table)}
                <!-- A way into the tables in a new tab, not an address to hand over
                     (FEATURES.md, "Rolling"). -->
                <Button size="sm" href={app.href(tablesHash(table.table, { anchor: rarity }))}>
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
        <RollResult
          {app}
          {index}
          it={pick.it}
          col={pick.col}
          rollLabel={pick.n}
          onopen={openRecord}
        />
      {/if}
    {/snippet}
  {/snippet}
</RollPage>

<style>
  .altctrl {
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    min-width: 0;
  }

  .altctrl :global(.btn.primary) {
    justify-content: center;
  }

  .altctrl.row {
    flex-direction: row;
    gap: 8px;
  }

  .dieblock {
    flex: 1 1 0;
    min-width: 0;
  }

  .dielbl {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: var(--t-data);
    font-weight: 600;
    white-space: nowrap;
  }

  .dv {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 22px;
    height: 22px;
    border: 1px solid currentcolor;
    border-radius: 50%;
    font-size: var(--t-label);
    font-weight: 700;
  }

  .dv.h {
    color: var(--hope);
  }

  .dv.f {
    color: var(--fear);
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
    font-size: var(--t-control);
  }

  .crit span {
    color: var(--muted);
    font-size: var(--t-data);
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
