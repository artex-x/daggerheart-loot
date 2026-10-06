# Review - plan before B1 (70)

Verdict: fix-then-continue
Reviewed: d997f4f0cd676624157b7f009257dbf703f5ef5b
Scope: plan before B1

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

The server design holds. The players' link, the clone and
`create_purchase_request` filter in the database; the renumbered positions
leave no gap; the `stale` answer is one answer for "absent" and "GM-only";
Realtime needs no change (the statement-level touch trigger bumps the
revision, `lists_broadcast` sends only the revision). Every redefined body
is named from its newest migration: `apply_list_writes` from
`20260925130600`, `get_shared_list(text)` from `20261001130000`,
`clone_shared_list` from `20260930130000`, `create_purchase_request` from
`20260928120000`, `import_lists` from `20260930120000`. `create or replace`
keeps the `EXECUTE` grants, `prosecdef` and `search_path`, which
`tests/db/list-shares.test.mjs` pins. The two blockers below are text fixes
to the plan, not redesigns.

## Blockers

1. **Section 11, B1 step 7 contradicts step 14 (the add from a GM link).**
   Step 7 has `entryRowsOf` write `gm_only: m.gmOnly === true` on every row,
   so every `create`, `add` and undo row carries `gm_only: false`. Step 14
   requires that "an add from a GM-link selection writes no `gm_only`". An
   implementer cannot satisfy both. The every-row form also adds about 16
   bytes to each entry row against `BATCH_BYTES` (60 000, the close-time
   `keepalive` budget). It also breaks the exact op payloads that
   `state/cloudLists.test.ts`, `ports/fake-cloud.test.ts`, `lib/bundle.test.ts` and others pin.
   Change step 7 to: `entryRowsOf` writes `gm_only: true` only when
   `m.gmOnly` is true and writes no key otherwise (the database default is
   false). This is the same rule as B3's export ("writes `"gm_only": true` on a
   GM-only entry and nothing on any other entry"). Keep step 14's assertion
   as "writes no `gm_only` key".

2. **B3 standing check 4 is wrong: the import refusal texts name the
   versions.** `dict.ts` `importVersion` and `importNoVersion` say «Приложение
   читает версии 1 и 2.» / "The app reads versions 1 and 2." After B3 the
   app reads version 3, so the text is false. B3's line "no new UI string
   (the import's refusal texts are today's)" must change. Add to B3's files
   and acceptance:
   - `dict.ts` RU and EN: `importVersion` and `importNoVersion` name versions
     1-3 («Приложение читает версии 1, 2 и 3.» / "The app reads versions 1, 2
     and 3."), the same facts in both languages.
   - `importPanel.test.ts` (the two strings and the `v4.json` fixture).
   - `docs/fixtures/homebrew-file/README.md` (the hand-test row for
     `../import/v3.json` becomes `v4.json` with the new text).
   - FEATURES.md "Import" (it says "The import reads versions 1 ...").
   - An acceptance line: "the refusal texts name versions 1-3 in RU and EN".

## Risks

1. **B3 omits three places in `CONTRACTS.md` that list the published
   schemas.** The plan names only the section 4 schema bullet. Add to B3:
   - Section 4, "All of them except the three `schema/` files": the count
     becomes four.
   - Section 4, the data-zip bullet: `lists.json` is `import-v1`, `import-v2`
     or `import-v3` by the version rule.
   - Section 5, "Static asset paths": add `schema/import-v3.json`.
   These are public-contract lines and go in the same commit as the schema.

2. **An unnamed loss in section 6: the undo of a removal restores a mark
   from before a conflict.** `restoreEntry` writes the meta that
   `ListPage` captured at the removal (`itemMeta` copy). Sequence: device A
   marks an entry GM-only. Device B has not re-read yet, because a write is
   buffered there. B removes the entry, then presses «Вернуть». The re-add
   writes `gm_only` false and the entry shows on the players' link again.
   Today the same rule applies to notes (last write wins). But here the
   effect is exposure to players. Add this case to the "Conflict" row: name
   the effect and accept it as last-write-wins. The recovery is that the
   owner sees the unpressed eye on the next read.

3. **Section 10, risk 1, names only a GM-only entry edit as a revision
   signal.** `homebrew_items_touch`, `homebrew_books_touch` and
   `homebrew_cards_touch` also bump the revision of every list that holds a
   reference. An edit of an own item that only a GM-only entry references
   therefore moves «Обновлено N назад» on the players' page. No entry data
   leaks. Extend the risk text with this case so that the decision file
   records it.

## Nits

1. `local` - B1 files: add `app/src/ports/supabase.test.ts`. It pins the
   `list_entries(...)` select string (line 581), so step 11 makes it fail
   `npm run check`.
2. `local` - B1 files: add `docs/specs/COVERAGE.md`. It names the contract
   cases "A-O" for the real adapter and owns the suites of
   `list-shares`, `list-writes`, `purchase-requests`, `import-lists` and
   `fake-cloud`. Case P and the new DB cases go there in the batch that adds
   them, not in B3.
3. `local` - Step 12 and step 13: say that the fake's GM projection writes
   `gm_only` on every entry, false included, as the SQL does
   (`jsonb_build_object('gm_only', ...)` in the `v_gm` branch). Today the
   fake projection spreads `...rest` of the held row, so it must also strip
   `gm_only` from a players' answer. Case P asserts `gm_only === false` on a
   shown entry of the GM read, and asserts no `gm_only` key at any depth of
   the players' read (a walk like `hasGmNote`), so the fake and the hosted
   project cannot drift.
4. `local` - Step 12: `playEntry` has no caller in B1. `CLAUDE.md` says "Add
   no module, export, component, or variant before something uses it". Move
   it to B2's file list, where its first browser state lands.
5. `local` - Step 1c: alias the subquery as `e` (`from (select e.*,
   row_number() over (order by e.position, e.id) - 1 as ord from ... ) e`)
   and write `'position', e.ord` and `order by e.ord`. Then every other line
   of the copied body stays byte-identical to `20261001130000`'s, which
   keeps the up and down diff to the named change.
6. `local` - Section 11 split criteria: "B1 ships no screen change, so it is
   deployable alone" does not apply. The task is one commit, pushed once at
   closeout, so B1 is never deployed alone. State the split by the
   `CLAUDE.md` terms: no shared component, filter or seed, and a security
   boundary that its own review holds. Or name the accepted cost of one
   more `npm run check`.
7. `local` - Decision file (B1): add the B3 version rule (version 3 only
   when a list of the file holds a GM-only entry) and its rejected
   alternative (always version 3, which would break both data-zip pins).
   This is the same rule as `2026-10-02-a-lists-file-is-version-2-only-when-it-holds-homebrew.md`.
8. `deferred-scope` - The players' link copy toast «Ссылка для игроков
   скопирована - заметок мастера в ней нет» / its EN pair stays true, but it
   no longer names everything the link leaves out. The owner settled only
   the hint. The planner asks the owner in the B2 expansion whether the
   toast adds "и позиций «Только для мастера»". Without an answer the toast
   stays as it is.

## Deviations

- The handoff records one deviation: the decision file is written in B1,
  not in the planning pass. Accepted: the batch that establishes the
  boundary records it.

## Standing checks

1. Scale: checked. B1 draws nothing. The projection filters one list (100
   entries by default, 300 at 3x, 5000 per write ceiling); the window
   function sorts by the `(list_id, position)` index order that the
   aggregate already used. B2's States table covers the empty list, N = 0,
   one, many, the limit, one past it, 3x (300 ticks, 2 requests by
   `BATCH_OPS`, one broadcast per request), the longest name, 360 px and
   1180 px. The every-row `gm_only` key of step 7 grows each payload
   (blocker 1).
2. Error scenarios: checked. I read section 6 against `apply_list_writes`
   (update_entry, add, create), `restoreEntry`, `import_lists`, the clone,
   the request and the down migration. A failed write keeps the entry
   visible until the send lands (named). The down migration loses every
   mark (named, with the recovery through a v3 file). A JSON null patch
   fails the not-null constraint as `ok: false` (named). The undo-after-
   conflict re-add is not named (risk 2).
3. Consistency: checked. B2 follows rules 5 (the «<Причастие>: N» toast), 10
   (undo on the bulk change) and 14 and 16. The departure "the row toggle has
   no toast, as the note toggle" is named. «Скопировать текст» leaves
   GM-only entries out as it leaves out GM notes. The selection copy, print,
   roll and count keep every entry, and the plan names this. The copy toast
   is nit 8.
4. RU/EN parity: checked. The B2 keys `gmOnlyOf`, `gmOnlyN`, `gmOnlyHide`,
   `gmOnlyShow`, `gmOnlyHidden`, `gmOnlyShown`, `ownGmOnly` and `shareHint`
   carry the same facts in both languages, with ASCII punctuation. The
   colon form ("GM only: %n") needs no plural set. B3's answer misses the
   two refusal texts (blocker 2).

## Suggested next action

The planner applies blockers 1-2, risks 1-3 and the `local` nits 1-7 to
`plan.md` (sections 6, 10 and 11, and B3's outline). Then the implementer
starts B1 with no second plan review.

## Checks still needed

- B1: `rtk npm run check` and `npm run check:db` (PowerShell). The
  reversibility walk must show that the reversal restores the five bodies
  byte for byte, and the pinned-privilege tests in `list-shares.test.mjs`
  and `purchase-requests.test.mjs` must stay green unchanged.
- B1, after its batch review: `npm run db:push -- --project test --yes`,
  then `npm run e2e` for case P on the hosted test project.
