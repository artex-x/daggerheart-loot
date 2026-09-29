# Plan - TASK persist-4b-requests-polish (release R4b)

## Status

- `B4b.1` built 2026-09-30 by the implementer (base `a6503c49`); batch
  review and the orchestrator's golden shards and sweeps pending
  (`handoff.md`).
- Planning pass 1, 2026-09-29, planner, on `main` at `14e6dcf9` (R6
  `885d2978` unpushed, its closeout running on the same tree). Mode A: no
  plan existed.
- Revision 2026-09-30 on the owner's mock review (`context.md`, "Owner
  input on the mocks"): the take line's «1» and «Все» join the count as
  one control (section 2.3, step 6, choice C1, decision b). Nothing else
  changed.
- Change 2026-09-30 (owner, `context.md`, "Owner input on the joined
  control"): the take control's ends read «Мин» / «Макс» ("Min" / "Max"),
  not «1» / «Все»; same behaviour. Built in `B4b.1`: dict keys `pickMin`,
  `pickMax`, `pickMinOf`, `pickMaxOf` (names «Мин, взять 1: <name>», «Макс,
  взять все: <name>», which start with the visible word); decision b's
  title "The take count sits between Min and Max in one control; no
  stepper" (2026-09-30).
- The owner is away and waived the mock review for this release
  (`context.md`, "Owner instruction, 2026-09-29"). The planner resolved
  its own questions with its recommendation (section 8); the mocks in
  `mocks/` are the design record. No user-visible feature is dropped.
- NEEDS_HUMAN_CONFIRMATION: no.
- Plan review: not required (no trigger fired). No migration, no SECURITY
  DEFINER function, no public contract change, no stored row or
  `localStorage` key lost, no new write or sync protocol (item 4 changes
  nothing in the database).
- Batches: one, `B4b.1` (section 6), implement-ready (section 7). Batch
  review after it: required (trigger: new or changed UI).
- Total gate cost: about 45 minutes (section 6).

## 1. Objective and current state

The owner's feedback on R4's purchase requests (four items) and one bug on
the roll tabs, verbatim in `context.md`. State at `14e6dcf9`:

- `RequestSender.send` (`app/src/state/requestSender.svelte.ts`) calls the
  `clearSel` hook on a success from the bar's own button, so the ticks and
  the taken counts go. Flow b (`after` set) keeps them.
- `RequestsPanel.svelte` draws the pending requests and a folded
  «Решённые в этот раз (N)»; each decided line is only «<link> · <age> ·
  <verdict>». `OwnerRequests.decided` (`DecidedRequest`) keeps no lines.
  The panel stays while any decided request of this page load exists, so
  after the last answer it reads «Запросы (0)» and the fold until a reload.
- `PickQty.svelte` is the take line of both list pages ("Взять [2] из 5 =
  1 мешок"): a `type="number"` field, nothing else.
- `purchase_requests` housekeeping: `create_purchase_request` deletes, on
  each accepted send, every row of any list decided or expired more than
  24 hours earlier (`supabase/migrations/20260928120000_purchase_requests.sql`;
  `tests/db/purchase-requests.test.mjs`, "the housekeeping").
- `App.svelte` draws `roll/wondrous`, `roll/dread` and `roll/dv` through
  one `{#if cfg}` branch, so one `RollPanel` instance serves all three.

## 2. The items

### 2.1 Item 1 - keep the selection after a send

Reading: the player wants the ticked entries (and their taken counts) to
stay after «Сообщить владельцу», to copy or print them.

Design (mock `m01-send-kept.html`):

- A successful send keeps the ticks and the taken counts. The toast stays
  «Запрос отправлен владельцу списка.».
- The send button then reads «Запрос отправлен» / "Request sent" and is
  disabled while the ticked entries and counts are the ones sent (the same
  key `RequestSender` already builds for the replay id: the token and the
  sorted `item*qty` pairs). A tick, an untick or a changed count enables
  «Сообщить владельцу» again; «Снять выделение», a navigation, or any other
  `#clearTicks` ends the sent state (`dismiss()`).
- `send()` and `afterAdd()` do nothing for lines that are already sent:
  an add of an already-sent selection asks nothing and sends nothing (the
  add's own toast still shows). Flow b's «Сообщить» ends in the same sent
  state.
- Correctness fix the kept selection makes likely: a ticked entry the
  shared list no longer holds (the owner applied the request and the entry
  reached zero, or deleted it) stays in `app.sel` today and is counted in
  the bar ("Выбрано 2" over one drawn row); a second send is then refused
  as `stale`. `SharedListPage` prunes `app.sel` and `app.picked` to the
  drawn list's ids whenever the list it draws changes.

Rejected: keep the button enabled (a second press sends the same request
twice, which the owner answers twice); store the sent state
(`sessionStorage`) - decision 2026-09-27 keeps nothing of a request in the
browser, and memory is enough for one page.

### 2.2 Item 2 - the request history

Reading: the decided fold shows no items, and the panel cannot be closed
without a reload.

Design (mocks `m04-history-open.html`, `m05-history-only.html`,
`m06-history-hidden.html`):

- Each decided request lists the items it asked for, with the asked count
  («Зелье Быстрого Шага ×9»), in the pending table's shape but quieter, under
  its shipped line («По ссылке для мастера · 12 минут назад · принят:
  списано 6 шт.»). The verdict says what was taken; the lines say what was
  asked. No sums: a clamped apply took less than the lines' sum.
- «Скрыть» / "Hide" (accessible name «Скрыть решённые запросы» / "Hide the
  decided requests") at the end of the fold row forgets this list's decided
  requests for the page load (`OwnerRequests.forget(listId)`). The panel
  then goes when no request is pending, as on a page load with none. A
  pending request cannot be hidden: it waits for an answer and expires in
  an hour.
- Focus after «Скрыть»: the panel's heading («Запросы (N)», `tabindex="-1"`)
  when the panel stays; `#main` (Shell.svelte's skip-link target,
  `tabindex="-1"`) with `preventScroll` when it goes.
- The fold stays closed by default.

Rejected: a history read from the database (the owner can select decided
rows for 24 hours): it adds a second read to every poll and every owner
topic message, draws decisions of other devices nobody asked for, and a
«Скрыть» that survives a reload would need a stored list of hidden ids;
sums on decided lines (wrong for a clamped apply); hiding the whole panel
with pending requests (a pending request would be missed).

### 2.3 Item 3 - min and max on the take line

Reading: on a phone, typing a count is slow; the owner asks for "min max".
The take line is `PickQty.svelte`, one component on the shared page and on
the own list page.

Design (mocks `m02-take-line-one-all.html`, `m03-own-list-take-line.html`;
revised 2026-09-30 on the owner's review, `context.md`, "Owner input on
the mocks"): the count and its two ends are one joined control,
"Взять [1|2|Все] из 5 = 1 мешок". One box - `NumberField.svelte`'s
`.numbox` shape (`--bg2` fill, one `--line2` border, gold on
`:focus-within`) at the take field's 30 px height and 7 px radius - holds
«1», the borderless count field and «Все» / "All", each end split from the
field by a 1 px `--line2` divider. «1» sets the count to 1, «Все» to the
stock; each is disabled at its own end (opacity 0.4, as `.numbox`).
Accessible names «Взять 1: <name>» / "Take 1: <name>" and «Взять все:
<name>» / "Take all: <name>"; the field keeps «Взять: <name>». At 600 px or
less the control is 36 px tall and each end at least 44 px wide (the touch
rule `RequestsPanel.svelte` applies). The control never splits; «из N» and
the sum follow it and wrap as shipped (measured in the mock at 360 px:
«Взять», the control and «из 2» on one line, the sum on the next; control
121x30 px at 960 px, 138x36 px at 360 px). Both list pages get it (one
component; decision 2026-09-23, "A selection on a list page carries a
taken count per entry").

Superseded first design (pass 1, 2026-09-29): two separate `Button
size="sm"` at the end of the line, after the sum. The owner found them
detached from the count, most of all at 960 px.

Rejected (choice C1, mock `m02b-take-line-stepper.html`): a «−» / «+»
stepper in the same joined shape - it does not answer "min/max" (N-1
presses from the stock to one). Decision 2026-09-23 ("A take line inside
the ticked row...") rejected a `− 2 +` stepper as a second quantity control
shape; the owner asked for the ends joined to the field, so R4b amends that
decision for the ends and keeps the ±1 stepper rejected. Also rejected: a
`<select>` of 1..N (a list of up to 99 options).

### 2.4 Item 4 - request clean-up

Answer: clean-up exists and nothing needs to change. From the shipped
schema and specs:

- A request expires 1 hour after it is sent. An expired pending request is
  refused by apply and decline, drawn by no page, and not counted by the
  pending cap.
- Each accepted send - from any link, to any list - first deletes every
  request, on every list, decided more than 24 hours ago or pending and
  expired more than 24 hours ago; its lines go by `on delete cascade`.
  Covered by `tests/db/purchase-requests.test.mjs`, "the housekeeping".
- A list delete (and so an account delete) removes its requests
  (`list_id ... on delete cascade`).
- The owner's decided fold is memory only; the requester's browser keeps
  nothing.
- What stays without a send anywhere on the site: at most the rows of the
  last day, bounded by 5 sends a minute per link and 10 pending per list.
  The nightly usage report (`.github/workflows/usage.yml`) counts rows per
  table, so growth is visible.

Rejected: a scheduled clean-up (`pg_cron` or a workflow job): a migration
and a plan review for rows that are already bounded and already deleted by
the next send. The spec gets one clarification: the delete runs "when the
next request is sent to any list" (today it reads as if per list).

### 2.5 Item 5 - the roll result stays across a tab switch

Cause (confirmed in code): `App.svelte` routes `roll/wondrous`,
`roll/dread` and `roll/dv` through one `{#if cfg}` branch, so Svelte keeps
the `RollPanel` instance and only its props change. `RollPanel`'s `n` is
component state (`let n = $state(1)`); it resets only on `pickerValue`,
which these three never pass. On The Dragon's Vault (1-145) the typed 105
survives the switch to Dread (1-29): `result = rows[104] ?? null` is null,
so no card is drawn, and `NumberField` keeps showing "105" because its
`value` prop did not change. A switch to a longer table keeps the number
and silently shows another table's row. Every other roll mode is its own
branch and restarts at row 1 on each visit.

Fix: key the `RollPanel` on the section in `App.svelte`
(`{#key app.route.section}`), so each visit to a whole-table roll starts
at row 1, as every other mode does and as a first visit does. No screen
changes: the result is the existing first-visit state.

Failing test that proves it: `app/src/components/roll.test.ts`, "starts
the next table at its first row after a switch from a longer one" (section
7, step 1). Before the fix the field reads "25" and no heading is drawn.

Rejected: per-mode memory across visits (the live app's `S.wond.n` and
`S.dread.n` survived a tab switch): it would change all seven modes, and
Core rules, the alternate tables, Vault of Ages and Communities already
restart on each visit in the rewrite; clamping `n` to the new range (still
shows a number nobody typed on this table).

## 3. Architecture and files

All code is client-side; no port, fake, schema or contract change.

| File | Change |
|---|---|
| `app/src/App.svelte` | `{#key app.route.section}` around `RollPanel` |
| `app/src/state/requestSender.svelte.ts` | drop the `clearSel` hook; the sent key, `isSent()`, guards in `send()` and `afterAdd()`, reset in `dismiss()` |
| `app/src/state/app.svelte.ts` | drop the `clearSel` hook wiring; add `keepTicksIn(ids)` |
| `app/src/components/SelBar.svelte` | the send button's sent text and disabled state |
| `app/src/components/SharedListPage.svelte` | prune the ticks when the drawn list changes; pass PickQty's new props |
| `app/src/components/PickQty.svelte` | one joined control «1» - count - «Все» |
| `app/src/components/ListPage.svelte` | pass PickQty's new props |
| `app/src/state/ownerRequests.svelte.ts` | `DecidedRequest.lines`; `forget(listId)` |
| `app/src/components/RequestsPanel.svelte` | the decided lines, «Скрыть», the focus |
| `app/src/lib/dict.ts` | six keys, RU and EN |
| tests, specs, decisions, inventory, goldens | section 5 |

Boundaries: `lib/` stays pure (no change there); DOM focus stays in the
component; state classes stay free of DOM.

## 4. Contracts and behaviour that stay

- No change to `CONTRACTS.md`, `docs/fixtures/`, `tests/contracts.js`,
  `llms.txt`, routes or storage keys.
- The request id and replay rule, the refusals and their toasts, flow b's
  question and `notifyGm`, the owner's apply, decline, short and clamp, the
  index line and the live arrival are unchanged.
- The take line's field, its clamp and its commit are unchanged; ticking
  still takes the whole stock.
- `docs/specs/STATE.md`'s rule "what was asked on a page is not
  remembered" holds: the sent state and the hidden history are memory only.

## 5. Tests, fixtures, specs, decisions

- Unit (vitest): section 7, steps 1-9 name each test.
- `tests/app/inventory.js`: two new states, `#/s/player-token-1 ~ sent` and
  `SHOP + ' ~ decided as gm1'`, each with a golden.
- `tests/app/states.js` case 55 rewritten for the kept selection.
- Goldens re-seeded: the two new files, and every state whose tree shows a
  take line (`_l_shared_a_row_ticked`, `_l_shared_picked`,
  `_lists_a_picked`, `_lists_a_prices`, `_s_player_token_1_ticked`,
  `_s_player_token_1_notify_question_as_gm2`).
- Specs: `FEATURES.md` ("Rolling", "Lists" take line, "Account and browser
  lists": the shared page, the send, the owner, "Limits"), `STATE.md` (the
  UI and Lists rows), `COVERAGE.md` (rows 626, 796, 1045, 1047 as numbered
  at `14e6dcf9`).
- Decisions (four new files, `node tools/decisions.js` after): section 7,
  step 11.

## 6. Batches and gate cost

One batch, `B4b.1`. No split: the four changes share one gate set
(`npm run check`, the browser states, the goldens, the sweep), no change
touches a public contract, and the harness reaches every commit. A split
per route (`#/s/`, `#/lists/<id>`, `#/roll/*`) would pay the whole gate set
three times for about 400 changed lines.

Gate cost of `B4b.1` (this host, `context.md`, "Command costs"):

| Gate | Wall clock |
|---|---|
| `rtk npm run check` | 400-600 s |
| `npm run build:test` then `node tests/run-all.js app/states` | 250-300 s |
| `node tests/app/golden.js --update --shard=n/4`, four calls | 4 x 186-201 s |
| `node tests/app/sweep.js 360` | 430 s |
| `node tests/app/sweep.js 1180` | 320-590 s |
| `npm run check:built` | about 60 s |
| `npm run e2e` (flow F12 sends and applies a request) | 104-150 s |

Total: about 2,500-2,900 s, about 45 minutes, plus the batch review.

## 7. B4b.1 - implement-ready

Objective: ship items 1, 2, 3 and 5 as sections 2.1-2.3 and 2.5 describe,
with item 4's spec clarification.

Out of scope: any `supabase/` change; the owner's `#/lists` index card; the
requester's status; the roll modes other than the three whole-table ones;
the heading «Запросы (0)» (kept as shipped).

Steps, in order:

1. Roll bug, test first. In `app/src/components/roll.test.ts`,
   `describe('rolling on a table')`, add
   `it('starts the next table at its first row after a switch from a longer one', ...)`:
   `const router = memoryRouter('#/roll/dread'); render(App, { env: fakeEnv({ router, data: fakeData(LOOT) }) });`
   clear the «Результат броска» field, type `25`, tab; expect heading
   `d вещь 25`; `router.navigate('#/roll/wondrous'); await tick();` (import
   `tick` from `svelte`); expect the field's value `'1'` and the heading
   `w вещь 1`. Run `npx vitest run app/src/components/roll.test.ts` from
   `app/` (or the repo's focused test command) and see it fail. Then in
   `app/src/App.svelte` wrap the `<RollPanel .../>` of the `{#if cfg}`
   branch in `{#key app.route.section}...{/key}` with a one-line comment:
   the three whole-table rolls share this branch, and a number kept from
   one table points past the end of a shorter one (`FEATURES.md`,
   "Rolling"). The test passes.
2. `app/src/lib/dict.ts`, RU and EN, beside the existing keys:
   `requestSentDone: 'Запрос отправлен'` / `'Request sent'`;
   `pickOneOf: 'Взять 1: %s'` / `'Take 1: %s'`;
   `pickAllOf: 'Взять все: %s'` / `'Take all: %s'`;
   `pickAllQty: 'Все'` / `'All'`;
   `requestsHide: 'Скрыть'` / `'Hide'`;
   `requestsHideName: 'Скрыть решённые запросы'` / `'Hide the decided requests'`.
3. `app/src/state/requestSender.svelte.ts`:
   - Remove `clearSel` from `SenderHooks`.
   - Move the key expression in `send()` into a module function
     `keyOf(token: string, lines: RequestLines): string` (same text:
     token, then the sorted `item*qty` pairs, joined by a space).
   - Add `#sent = $state<string | null>(null);` and
     `/** Whether these lines were the last ones sent through this link. */ isSent(token, lines): boolean { return this.#sent !== null && this.#sent === keyOf(token, lines); }`.
   - `send()`: return at once when `this.sending || !lines.length ||
     this.isSent(token, lines)`. On `r.ok`: `this.#drop(); this.#sent =
     key;` then `say(after === undefined ? t.requestSent : \`${after}.
     ${t.requestSentOwner}\`)` - no `clearSel`.
   - `afterAdd()`: return at once when `this.isSent(token, lines)`.
   - `dismiss()`: also `this.#sent = null`.
   - Update the header comment and `send()`'s doc comment: a success keeps
     the selection and marks the lines sent.
   In `app/src/state/app.svelte.ts` remove the `clearSel` entry from the
   `RequestSender` hooks. Add, near `toggleSel`:
   `/** Drops the ticks, and their taken counts, of entries not in ids - the shared page after its list changed. */ keepTicksIn(ids: readonly string[]): void`
   deleting each ticked id absent from `ids` from `this.sel` and
   `this.picked`.
4. `app/src/components/SelBar.svelte`: `const sent = $derived(token !== null && !!sender && sender.isSent(token, lines));`
   The notify button: `disabled={sender.sending || sent}` and text
   `{sent ? t.requestSentDone : sender.sending ? t.requestSending : t.requestSend}`.
5. `app/src/components/SharedListPage.svelte`: in the `$effect` that sets
   `app.shared`, after the assignment:
   `if (shared) { const ids = shared.ids; untrack(() => { app.keepTicksIn(ids); }); }`
   with a one-line comment (an entry the list no longer holds leaves the
   selection, so the bar counts only drawn rows). `untrack` is already
   imported.
6. `app/src/components/PickQty.svelte`: new props `allText: string` (the
   visible «Все»), `oneName: string`, `allName: string` (the accessible
   names). The markup becomes one joined control (mock `m02`):
   `<span class="take"><span class="pickqty"><span class="lbl">{label}</span><span class="qgroup"><button type="button" aria-label={oneName} disabled={value <= 1} onclick={() => { onchange(1); }}>1</button><input ...shipped attributes... /><button type="button" aria-label={allName} disabled={value >= max} onclick={() => { onchange(max); }}>{allText}</button></span></span>&#32;<span class="of">{ofText}</span>&#32;{#if sum}...shipped...{/if}</span>`.
   The shipped `<label class="pickqty">` becomes a `<span>`: a `<label>`
   may not hold the two buttons, and the input keeps its name through
   `aria-label={name}`. Plain `<button>`s, not `Button.svelte`: the ends
   are `.numbox`'s stepper buttons, not free-standing buttons.
   CSS (replace the `.pickqty input` rules; values off `NumberField.svelte`'s
   `.numbox` and the shipped field):
   `.qgroup { display: inline-flex; align-items: stretch; height: 30px; border: 1px solid var(--line2); border-radius: 7px; background: var(--bg2); overflow: hidden; }`;
   `.qgroup:focus-within { border-color: var(--gold); }`;
   `.qgroup input { width: 48px; height: 100%; padding: 0; border: 0; background: transparent; color: var(--txt); font: 600 13px/1 var(--mono); text-align: center; }`
   and `.qgroup input:focus { outline: none; }` (the box draws the focus);
   `.qgroup button { border: 0; background: transparent; color: var(--muted); min-width: 34px; padding: 0 8px; font: 600 12.5px/1 var(--ui); transition: 0.14s; }`;
   `.qgroup button:first-child { border-right: 1px solid var(--line2); }`;
   `.qgroup button:last-child { border-left: 1px solid var(--line2); }`;
   `.qgroup button:hover { background: var(--surface2); color: var(--gold); }`;
   `.qgroup button:disabled { opacity: 0.4; cursor: default; }`;
   `.qgroup button:focus-visible { outline: 2px solid var(--gold); outline-offset: -2px; }`;
   `@media (max-width: 600px) { .qgroup { height: 36px; } .qgroup button { min-width: 44px; } }`
   with the comment "A touch target at phone width (DESIGN.md, "The Two
   Breakpoints Rule")". Update the header comment's example line to
   "Взять [1|2|Все] из 5 = 1 мешок". Both
   callers pass `allText={t.pickAllQty}`,
   `oneName={t.pickOneOf.replace('%s', nameOf(it, app.lang))}`,
   `allName={t.pickAllOf.replace('%s', nameOf(it, app.lang))}`:
   `SharedListPage.svelte` (the `inside` snippet) and `ListPage.svelte`
   (the `.lrow-take` block).
7. `app/src/state/ownerRequests.svelte.ts`: `DecidedRequest` gains
   `/** The items the request asked for, with the asked count. */ lines: { item: string; qty: number }[];`;
   `#decided` sets `lines: r.lines.map((l) => ({ item: l.item, qty: l.qty }))`.
   Add `/** Forgets the list's decided requests of this page load. */ forget(listId: string): void { this.decided = this.decided.filter((d) => d.listId !== listId); }`.
8. `app/src/components/RequestsPanel.svelte`:
   - The heading gets `tabindex="-1"` and `bind:this={head}`.
   - The fold row becomes `<div class="dhead">` holding the shipped caret
     button and, after it, `<span class="hide"><Button size="sm" variant="bare" label={t.requestsHideName} onclick={() => void hide()}>{t.requestsHide}</Button></span>`.
   - Each `<li>` keeps its shipped line and adds
     `<table class="dlines"><tbody>{#each d.lines as l (l.item)}<tr><td>{itemName(l.item)}</td><td class="n">×{l.qty}</td></tr>{/each}</tbody></table>`.
   - `async function hide(): Promise<void>`: `owner?.forget(list.id); open = false; await tick();`
     then `if (head?.isConnected) head.focus(); else document.getElementById('main')?.focus({ preventScroll: true });`
     (`tick` from `svelte`).
   - CSS: `.dhead { display: flex; align-items: center; gap: 12px; }`,
     `.dhead .hide { margin-left: auto; }`,
     `table.dlines { margin: 4px 0 0; font-size: 13px; color: var(--muted); }`,
     `table.dlines td:first-child { color: var(--txt); }`,
     `li + li { margin-top: 10px; }` (was 4px). The shipped phone rule
     `.decided :global(.btn) { min-height: 36px; }` covers «Скрыть».
   - Update the header comment (the decided requests with their items, and
     «Скрыть»).
9. Unit tests (each case ends with `expectNoA11yViolations` where it
   renders):
   - `app/src/state/requestSender.test.ts`: rename and rewrite "clears the
     selection and says the request was sent" to "keeps the selection,
     says the request was sent and marks the lines sent" (no `clearSel` in
     the hooks; `isSent` true for the same lines in another order, false
     after a changed count and after `dismiss()`); add "sends nothing for
     lines already sent, and asks nothing after an add of them"; keep "a
     new one after success" by sending changed lines.
   - `app/src/components/sharedListPage.test.ts`, `describe('a purchase
     request')`: the first case expects `ticked()` 1 after the send and the
     button «Запрос отправлен» disabled; add "enables «Сообщить владельцу»
     again after a changed count" and "drops a ticked entry the list no
     longer holds after the owner applies the request" (tick the first row,
     send, `cloud.decide(uuid(5000), 'applied')`, then `ticked()` 0 and no
     bar). In `describe('the taken count and the total')`: update the text
     of "draws the take line inside the ticked row..." to include «1» and
     «Все» inside the control (`'Взять 1 Все из 5 = 1 мешок'` once
     `setCount` put 2; the input adds no text); add "sets the count to one
     and to the stock with «1» and «Все», each disabled at its end" and
     "draws «1», the count and «Все» as one control" (the two buttons and
     the input are children of one `.qgroup`).
   - `app/src/components/listPage.test.ts`: add "takes one piece of a
     ticked entry with «1»" (the bar's summary and «Удалить (1)» removing
     one piece, as the existing taken-count tests do).
   - `app/src/state/ownerRequests.test.ts`: the decline and apply cases
     assert `decided[0].lines`; add "forgets one list's decided requests
     and keeps the others".
   - `app/src/components/requestsPanel.test.ts`: add "lists the items of
     each decided request in the fold" and "hides the decided requests: the
     panel goes with the focus on main, or stays with the focus on its
     heading".
   - `app/src/state/app.test.ts`: add "keepTicksIn drops the ticks and
     counts of entries not in the list".
10. Browser suites:
    - `tests/app/inventory.js`: after `'#/s/player-token-1 ~ ticked'` add
      `{ id: '#/s/player-token-1 ~ sent', route: '#/s/player-token-1', why: 'signed out, ci1 and cc1 ticked and «Сообщить владельцу» pressed: both ticks and the cc1 take line kept, «Запрос отправлен» disabled last in the bar, the toast «Запрос отправлен владельцу списка.»', enter: tick both as the `~ ticked` state does, then `await d.click('Сообщить владельцу')` and settle until the text holds «Запрос отправлен владельцу списка.», timed: true }`.
      After `SHOP + ' ~ short as gm1'` add
      `{ id: SHOP + ' ~ decided as gm1', route: SHOP, as: 'gm1', why: "«Отклонить» on the GM link's request, the fold opened: «Запросы (1)» with the players' request, «Решённые в этот раз (1)» expanded with «По ссылке для мастера · только что · отклонён», «Зелье Быстрого Шага ×9» and «Палаш ×1», and «Скрыть» at the fold row's end", enter: twoRequests, settle until «Запросы (2)», click the first «Отклонить», settle until «Решённые в этот раз (1)», click it, timed: true }`.
    - `tests/app/states.js` case 55 (`sendARequest`): tick ci1 once; each of
      the five sends asserts the row still ticked and, from the first, the
      toast; between sends press «Снять выделение» and tick again (the
      sent lines keep the button disabled). After the first send assert
      the button reads «Запрос отправлен» and is disabled. The sixth send
      still toasts the rate text with the row kept. Update the doc comment.
11. Specs and decisions, in the same amend:
    - `docs/specs/FEATURES.md`: "Rolling" - after "Each keeps its own input
      in memory only.": "A mode starts at its first row on every visit: a
      switch between two modes carries no number across." "Lists" take
      line: the count sits between «1» and «Все» / "1" and "All" in one
      joined control ("Взять [1|2|Все] из 5 = 1 мешок"), each end disabled
      at its end. "The shared page `#/s/<token>`": a ticked entry the list no
      longer holds leaves the selection when the page draws the list again.
      "Purchase requests: the send": "Success keeps the selection and its
      counts, toasts ..., and the button reads «Запрос отправлен» / "Request
      sent", disabled while the ticked entries and counts are the ones
      sent; «Снять выделение» or leaving the page ends it." "flow b": an
      add of an already-sent selection asks nothing and sends nothing.
      "Purchase requests: the owner": the fold lists each request's items
      with the asked count; «Скрыть» forgets this page load's decisions for
      the list, and the panel goes when nothing is pending. "Limits": "when
      the next request is sent to any list".
    - `docs/specs/STATE.md`, table "The in-memory state object": the UI row
      `sel` gains "(on a shared page, pruned to the drawn list)"; the Lists
      row gains "the request sender's sent lines (memory, until the ticks
      change or clear)" and "the owner's hidden decided requests (page
      load)".
    - `docs/specs/COVERAGE.md`: row 626 case 55 text (the ticks kept, the
      sent button); row 796 adds the two new goldens; row 1045 replaces "the
      success toast clearing the ticks" with the kept ticks, the sent
      button, the prune and «1»/«Все»; row 1047 replaces "the cleared
      ticks" with the sent key.
    - New decision files (`.claude/templates/decision.template.md`, at most
      15 body lines, `Task: persist-4b-requests-polish (planner, 2026-09-29;
      the owner waived the review)`), then `node tools/decisions.js`:
      a) "A sent purchase request keeps the ticks; the send waits until they
      change" - rejected: the enabled button (duplicate requests),
      `sessionStorage`. `- Amends "A requester sees no request status; the
      send toast is the only answer" (2026-09-27): the send button reads
      «Запрос отправлен» while the sent ticks stay.` and the mirror
      `- Amended by "A sent purchase request keeps the ticks; the send waits
      until they change" (2026-09-29): ...` in the older file.
      b) "The take count is joined to buttons for one and for all; no ±1
      stepper" (under 80 characters; the task line also cites the owner's
      review of 2026-09-30) - rejected: separate buttons at the line's end
      (the owner: detached from the count), the ±1 stepper (N-1 presses),
      a `<select>`. The new file carries `- Amends "A take line inside the
      ticked row; the summary names entries and pieces; the shared print
      and copied prices carry the count" (2026-09-23): a joined control
      around the field holds the ends; the ±1 stepper stays rejected.` and
      the older file the mirror `- Amended by "..." (2026-09-29): ...`.
      c) "Decided requests list their items and hide until the next page
      load" - rejected: the database history, sums, hiding pending ones.
      d) "A roll mode starts at its first row on each visit; no number
      crosses tabs" - rejected: per-mode memory across visits, clamping.
12. Gates, in order (one foreground call each; `.claude/README.md`, "Run a
    long check"): `rtk npm run check` (Bash timeout 600000); `npm run
    build:test`; `node tests/run-all.js app/states`; `node
    tests/app/golden.js --update --shard=1/4` .. `--shard=4/4`, then `git
    diff --stat -- tests/app/snapshots` lists only the files of section 5;
    `node tests/app/sweep.js 360`; `node tests/app/sweep.js 1180`; `npm run
    check:built`; `npm run e2e`.

Acceptance criteria:

- The roll test of step 1 fails before the `App.svelte` change and passes
  after it; on `#/roll/dv` type 105, switch to Dread: the field reads 1
  and Dread's row 1 is drawn.
- On `#/s/<token>` a successful send keeps the ticks and the counts, and the
  button reads «Запрос отправлен», disabled, until a tick or a count
  changes, the selection is cleared, or the page is left.
- An owner's apply that removes a ticked entry removes it from the
  requester's selection and bar count.
- The take line on both list pages draws «1», the count and «Все» as one
  joined control (one border, dividers, gold on focus-within), each end
  disabled at its end, 30 px tall above 600 px and 36 px tall with 44 px
  ends at 600 px or less; the field still takes a typed count; nothing of
  the control sits apart from the field at 1180 px or at 360 px (sweep).
- The owner's fold lists each decided request's items with the asked
  count; «Скрыть» removes the fold, the panel goes when nothing is
  pending, and the focus lands as section 2.2 says.
- `FEATURES.md` "Limits" says the delete runs when the next request is sent
  to any list; no file under `supabase/` changes.
- The four decision files exist, `node tools/decisions.js` rebuilt
  `docs/DECISIONS.md`, and both pointer directions are written.
- Every gate of step 12 passes; the golden diff lists only the section 5
  files; axe passes in every new unit case.

Risks and do-nots:

- Do not touch `supabase/`, the ports or the fake: item 4 is a spec line.
- Do not persist the sent state or the hidden history (`STATE.md` rule).
- `{#key}` goes around `RollPanel` only, not around the whole `{#if cfg}`
  chain, so `StdPanel`, `AltPanel`, `VoaPanel` and `CommunityPanel` keep
  their mount behaviour.
- The prune in `SharedListPage` runs under `untrack`; without it the effect
  reads `app.sel` and reruns on every tick.
- `isSent` reads `$state`; do not make `#sent` a plain field, or the
  button does not redraw after the send.
- Keep the ends inside `.qgroup`, right against the field; do not move
  them after the sum or give them their own gap (the owner rejected that
  in the pass 1 mock).
- Settled, not to reopen: sections 2.1-2.5 and choice C1.

## 8. Choices made in place of owner questions (owner away, 2026-09-29)

- C0: the mocks m01-m06 are the built design (the owner waived the review).
- C1 (item 3): «1» and «Все» joined to the count as one control,
  [1][count][Все]. Reason: one press for each end the owner named, the
  field stays for the rest, and the owner's review of 2026-09-30 found the
  pass 1 buttons at the line's end detached. Accepted trade-off: a count
  between the ends is still typed; the control is 121 px wide at 960 px
  against the shipped field's 70 px, and at 360 px the sum takes a second
  line (measured in the mock).
- C2 (item 1): the sent button is disabled while the sent ticks stay.
  Reason: a kept selection makes a second, identical request one press
  away. Accepted trade-off: to send the same lines again the reader clears
  and ticks again.
- C3 (item 2): the history stays per page load, with items and «Скрыть».
  Reason: it answers both halves of the feedback with no new read.
  Accepted trade-off: decisions made on another device are not listed.
- C4 (item 5): a roll mode restarts at row 1 on each visit. Reason: the
  rule every other mode follows already. Accepted trade-off: a number is
  not remembered across a tab switch.

No choice drops a user-visible feature.

## 9. Deferred

- «Запросы (0)» as a heading when only decided requests remain (kept as
  shipped; C3 makes it removable).
- The roadmap row for R4b in `issues/persistent-storage/plan.md` section 12
  (the orchestrator's file; named in the planner's report).
