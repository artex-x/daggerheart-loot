# Review - B2b (ai-mcp)

Verdict: fix-then-continue
Reviewed: ed3d89545885b1612ac97ff6f2eda099dada7eed
Scope: batch B2b

<!-- The three lines above are read by .claude/hooks/agent-guard.mjs and
bash-guard.mjs rule 2r (lib.mjs, parseReviewHead): keep them first, one
value each, no markup. Then the sections of review.prompt.md, "Output
format". -->

Diff read: `git diff 4cc114e7 ed3d8954` (26 files outside the goldens, 222 goldens).
Light runs on this tree: `node tests/derived.js` (everything matches),
`node tests/contracts.js` (contracts match the fixtures), a read-only puppeteer probe of
the four generated pages at 320, 360, 390 and 1180 px. Fetched on 2026-11-13:
support.claude.com article 11175166 and cursor.com/docs/context/mcp (help.openai.com
answers a JavaScript challenge, not readable).

## Blockers

1. **About half of the goldens are not re-seeded; CI's `app/golden` rows fail.** 205 of
   443 files under `tests/app/snapshots/` still show the old footer (the privacy link and
   no `/pages/ai.html`), and 7 of them still show the old import row with a `/llms.txt`
   link: `_lists_import_panel_as_gm1`, `_lists_import_preview_by_keys_as_gm1`,
   `_lists_import_refused_as_gm1`, `_homebrew_import_panel_as_gm1`,
   `_homebrew_import_refused_as_gm1`, `_homebrew_import_over_the_limit_as_gm1`,
   `_homebrew_import_held_names_open_as_gm3`. The two `why` edits in
   `tests/app/inventory.js` fall on two of these files, so their `# why:` headers also
   disagree. `tests/app/golden.js` compares every state of a shard and fails a diverging
   one; the handoff ran no `app/golden` row. The 222 files that changed are correct: every
   changed line is a footer link, an import-row link, the new hint or an elision count
   (a script classified all changed lines; 0 unexplained).
   Fix: after `npm ci` in the worktree (Risk 4) and `npm run build:test`, run
   `MSYS_NO_PATHCONV=1 node tests/app/golden.js --update` (by `--shard=n/4`), or take the
   `--update text` of CI's failing `app/golden` rows (`.claude/README.md`, "CI credit").
   Then check that no golden holds `[url=/llms.txt]` or the privacy link without
   `[url=/pages/ai.html]`.
2. **`docs/specs/CONTRACTS.md` still lists three static pages.** Section 5, line 423:
   "the site's static pages, one copy per language: `install`, `privacy` and `terms`".
   `llms.txt` and both READMEs now link `pages/ai.html` and `pages/developers.html`, and
   the same paragraph says "A page URL is public once something outside links to it".
   `CLAUDE.md` requires `CONTRACTS.md` in the same commit as the contract change.
   Patch: "`install`, `privacy`, `terms`, `ai` (the user page of the MCP endpoint) and
   `developers` (the API reference)."

## Risks

1. **The Claude block is published before a live connector test.** `/mcp` answers 403 to
   any `Origin`, and the handoff Blockers still list the owner step "add the connector in
   Claude with "No sign in" and ask for a roll" (no record in `ai-mcp-live-checks.md`).
   If Anthropic's cloud sends `Origin`, the page tells readers to do something that
   fails. Run the owner step at landing 3. On a 403, remove the Claude block in the next
   commit, or use the allowlist fallback of `plan.md` B2a.
2. **Example prompt 5 needs the import format, and the MCP server does not give it.**
   "Build me a list file with five healing consumables ... then tell me how to import it":
   `x-mcp-instructions` and the `check_file` description name no file format and no
   `llms.txt`. An assistant with no web access guesses the format, and `check_file` then
   refuses it. Cheapest local fix: reword the prompt to "Read
   https://daggerheart-loot.pages.dev/llms.txt, then build me a list file ..." in both
   languages. A pointer in `x-mcp-instructions` changes the MCP fixtures: B5b's
   export-flow work can take it.
3. **Bundle headroom.** 275.2 of 276 kB after this batch. B5a and B5b add screens to the
   app: read `.claude/README.md` before any raise (as handoff R3 says).
4. **The worktree's `node_modules` is incomplete, and that explains the `app/typo`
   failure.** `@fontsource-variable` is not in
   `.claude/worktrees/ai-mcp/node_modules`. `app/src/main.ts` resolves its CSS import
   through the parent checkout's `node_modules` (a Node lookup up the directory tree), but
   the relative preload `href="../node_modules/..."` in `app/index.html` (lines 51-52, last
   changed in `bf0b1e17`, before this task) does not. Vite leaves the href unresolved
   (`dist-test/index.html` lines 51-52 still hold it), and the test server serves the font
   from `node_modules`. This batch did not touch `app/index.html`, `main.ts` or
   `tests/app/typo.js`, so the cause is this host, not B2b. CI runs `npm ci` and decides.
   Run `npm ci` in the worktree before any local browser run, including the Blocker 1
   re-seed.

## Nits

All are `local` (inside the paths this batch touched, cheap and safe) unless marked.

1. `local` - **The developer page scrolls sideways at 320 px** (probe: `scrollWidth` 355
   in RU, 328 in EN). The cause is the inline `<code>` with
   `https://daggerheart-loot.pages.dev/api/v1/catalog/index.json`. At 360, 390 and
   1180 px there is no sideways scroll on any of the four pages. `tests/stub.js` checks
   site pages at 320 and 390 px but lists only `install`.
   Patch: in `tools/build-pages.js` line 173, change
   `code{font-size:.92em}` to `code{font-size:.92em;overflow-wrap:anywhere}`, and add
   `pages/developers.html`, `pages/en/developers.html`, `pages/ai.html` and
   `pages/en/ai.html` to `FILES` in `tests/stub.js`.
2. `local` - `table{display:block}` (`tools/build-pages.js` line 174) removes the table
   role in WebKit screen readers. Patch: keep `table{border-collapse:collapse}`, wrap the
   error table in `<div class="scroll">` on both developer pages, and add
   `.scroll{overflow-x:auto;margin:0 0 12px}`.
3. `local` - **The Claude steps differ from the help page in three points.** The help page
   says: (a) after "Continue", Claude shows the detected authentication settings and you
   press "Continue" again; (b) the plans are "Free, Pro, Max, Ultra, Team, and
   Enterprise"; (c) custom connectors work "on Claude, Cowork, and Claude Desktop". Fixes:
   step 3 (`pages/src/en/ai.html` line 39) becomes "Press "Continue" on the detected
   settings. Under Authentication choose "No sign in", then press "Add"."
   (RU line 39: «Нажмите «Continue» на найденных настройках. В поле Authentication
   выберите «No sign in» и нажмите «Add».»); add Ultra on line 42 of both pages; change
   the heading to "Claude (claude.ai and Claude Desktop)" / «Claude (claude.ai и Claude
   Desktop)»; remove the clause "gives the steps for claude.ai only" / «даёт шаги только
   для claude.ai». Optionally, add one sentence after the list, as the help page says:
   switch the connector on in a chat with "+", then "Connectors".
4. `local` - The ChatGPT sentence (`ai.html` and `en/ai.html` lines 91-93) states as fact
   what another company's help page does not say. We could not read that page to verify
   the claim (it answers a JavaScript challenge), and the claim goes stale when OpenAI
   edits the page. Patch: "This page has no steps for ChatGPT yet." / «Для ChatGPT шагов
   здесь пока нет.»
5. `local` - Quota wording. On the developer page (EN lines 37-38, RU lines 38-39), the
   sentence leaves out MCP and has a stray comma. Patch: "The API, the MCP endpoint and
   the link cards share one daily quota of 100,000 Functions requests." / «API,
   MCP-адрес и карточки ссылок делят одну суточную квоту в 100 000 запросов Functions.»
   On the user page (EN lines 117-118, RU line 113), "shares one daily limit with the rest
   of the site" is not correct, because static pages cost no request. Patch: "with the API
   and the link previews of the site" / «с API и карточками ссылок сайта».
6. `local` - "The operations above are also tools of a read-only MCP server" (EN line 213,
   RU lines 214-215): `GET /api/v1/openapi.json` has no `x-mcp-tool`, so there are nine
   tools for ten operations. Patch: "The operations above, except `openapi.json`, are
   also tools ..." / «Операции выше, кроме `openapi.json`, также ...».
7. `local` - "A list larger than 65536 bytes of database answer answers 422" (EN lines
   110-111). Patch: "A list whose database answer is larger than 65536 bytes answers 422
   with the link of the app." In the same file, line 68 says "each with a request that
   you can run", but the homebrew uuid gets a 404 and `SHARE_TOKEN_OF_43_CHARACTERS` is a
   placeholder. Patch: "each with an example request" / «у каждой - пример запроса»
   (RU line 69).
8. `local` - `tests/contracts.js` line 383: the comment cites "(plan B2b)", which breaks
   `CLAUDE.md`, "Comments". Patch: delete "(plan B2b)".
9. `local` - `tools/check-site.lib.mjs` line 382 checks noindex, `id="app-page"` and
   `og:title` on the live install, privacy and terms pages only. Add `'ai'` and
   `'developers'` to both arrays, and update `tools/check-site.test.mjs` if it pins the
   count.
10. `local` - `DESIGN.md` line 1191: "`/pages/*.html` (privacy, terms, install, in each
    language)". Patch: "(install, privacy, terms, ai, developers, in each language)".
11. `local` - Russian phrasing (`pages/src/ai.html` line 9): «Бросить кубики на любой
    таблице лута сайта, с показанными кубиками.» Patch: «Бросить кубики на любой таблице
    лута сайта и показать, что выпало на кубиках.»
12. `local` - handoff. Status still says "B2b is implement-ready and follows B3".
    Completed has no B2b line (sha `ed3d8954`, base `4cc114e7`). "Next batch" still names
    B2b, and "Previous sha" is `646b2c04`. The States table's proof "a manual look in the
    handoff" for the static pages is not recorded. The probe above can stand in for it.

## Deviations

- `Shell.svelte` `.foot-nav a` gains `min-width: max(24px, var(--thumb))` and
  `text-align: center`: **accepted**. `--thumb` is 40px up to 600 px (`tokens.css`
  line 152) and 0 from 601 px. So «API» (17.8 px wide) gets a 40x40 box at 360 and
  390 px, which is the size checks 109 and 114 require, and 24 px from 601 px. Every
  other link is wider than its floor, so only the «API» box grows. The flex `gap: 16px`
  does not change, and no box overlaps another. The goldens are structural text (the
  aria tree and the controls), so this CSS changes no golden. The hit test was not run
  again in a browser: CI's `browser` matrix decides.
- ChatGPT has no block: **accepted** under plan step 2 ("leave its block out and say so
  in the handoff"). The wording is Nit 4.
- The lists import panel keeps its hint at the bottom of the panel (after the report and
  the actions), and the My items panel puts its hint under the row: **accepted**. The
  position was there before this batch. Plan section 7 accepts that the hint changes
  shape. FEATURES.md "a hint under it" is still true.
- `tests/app/inventory.js` has only two `why` edits and no new entry: **accepted, no
  gap**. The batch adds no state. The footer links and the file row are new content in
  states that the inventory holds already (`#/lists ~ import panel as gm1` and
  `#/homebrew ~ import panel as gm1`, the narrow states and every route). The installed
  app's four links are a component test (`shell.test.ts`). The goldens of those states
  are Blocker 1.
- `app/states` shard 2, check 68 (`#/homebrew` at 300 items, navigation median 626.8 ms
  against 500): **host-load flake**. The batch adds two anchors to the footer. The import
  panel and `ImportFileRow` draw only when the panel is open, and check 68 never opens
  it. The run took 1503 s on a busy host. CI decides.
- `app/typo` "a font from outside /assets/": **not caused by this batch** (Risk 4).

## Standing checks

1. Scale: checked. I read the plan B2b States table against the code. The footer has
   five links in a wrapping flex row (`gap` 16px); at 360 px the «API» box is 40 px and
   the row wraps. The installed app has four links (`shell.test.ts` line 416). Both
   import panels use one `ImportFileRow` (`flex-wrap`, links at the right end). For the
   static pages, the probe found the template layout, `main`, `nav` and `h1` landmarks as
   on the privacy pages, and main text of 3959 and 3987 characters (ai) and 6779 and
   6615 characters (developers), against 7532 (privacy EN). The `pre` blocks scroll
   inside their box, and no page scrolls sideways at 360, 390 or 1180 px. At 320 px the
   developer page scrolls sideways (Nit 1). Collections, limits and 3x are not
   applicable: the content is fixed.
2. Error scenarios: checked. The batch has no write path and no stored shape: two
   static pages, links and dictionary strings. The validation messages keep `llms.txt`
   as plain text (`dict.ts` lines 894, 896, 1004 and their English twins; this batch did
   not change them). A stale tab keeps the old footer until it reloads. Offline behavior
   of `pages/` does not change (`tests/sw.test.mjs`).
3. Consistency: checked. «ИИ-ассистенты» / "AI assistants" is the one name in the
   footer, both panels (`importAi`) and the page title «С ИИ-ассистентами». "API" is the
   footer name of «API для разработчиков». The two panels share one row component and
   the two link texts (`importFormat`, `importAi`). The old keys `hbImportFormat`,
   `importSchema`, `importLlms` and `importHint*` and their texts are gone from the tree.
   No `href="/llms.txt"` is left in `app/src`. The pages follow the privacy template and
   its RU/EN order. Departures: `CONTRACTS.md` and `DESIGN.md` page lists (Blocker 2,
   Nit 10), and `check-site.lib.mjs` (Nit 9).
4. RU/EN parity: checked. I compared `dict.ts` `aiLink`, `apiLink`, `importFormat`,
   `importAi`, `importFits` and `hbImportFits` in both languages: they match the plan's
   texts word for word. `PAGES` titles and descriptions are in both languages. The four
   pages have the same headings, the same facts and the same order: 9 h2/h3 blocks on
   the user pages and 16 operation and section blocks on the developer pages. Each user
   page has 5 example prompts, and both READMEs have the same paragraph. No plural forms
   apply. English uses ASCII punctuation; Russian uses «» with straight inner quotes. The
   Russian-credit test (`tests/derived.js`) holds the English sentence in `README.md`,
   `LICENSE`, `llms.txt` and the English `footBefore`, and the Russian sentence in
   `README.ru.md` and the Russian `footBefore`. It passes.

Owner rules: checked. The owner note of 2026-11-12 (`ai-mcp-docs-page.md` items 1-7b;
`context.md` "Owner decisions (2026-11-12)", home: plan B2b and the pages) is in its
homes: the two pages, the footer, the two panel links with the direct `llms.txt` link
removed, the hint texts, plain-text `llms.txt` in the validation messages, the `llms.txt`
"Read this first" item and the MCP section, `FEATURES.md` "Chrome" and the import
paragraphs, and `META.md` "Static pages". The export-flow link is placed in B5b as the
default says. The owner decision of no rate limiter (plan section 3.4) is respected: no
page promises a limiter. Both pages say "cache the lists; at most one request per user
action".

### Acceptance lines

| Line | Outcome |
|---|---|
| four pages exist, RU and EN the same facts in the same order | met (facts: Nits 3-7) |
| each client block checked on the day, URLs and date in the handoff | met: three URLs, 2026-11-13; ChatGPT left out with a reason |
| footer has two links on every screen in both languages; panels show «Формат файла» and «ИИ-ассистенты» and the new hints; no panel links `/llms.txt` | met in code and component tests |
| README, `llms.txt`, developer-page links; two `tests/contracts.js` tests pass | met (`node tests/contracts.js` passes; every operation of `openapi.json` 1.2.0, ten, is on both developer pages once) |
| Russian-credit test holds the copies | met (`node tests/derived.js` passes) |
| goldens re-seeded, only footer and import rows moved | **not met**: the 222 files changed are right, 205 are stale (Blocker 1) |
| both panels draw the row through `ImportFileRow.svelte`, the AI link through `app.pagesDir` | met (`ImportFileRow` takes `pagesDir={app.pagesDir}`; `importFileRow.test.ts` checks `/pages/en/ai.html` and runs axe in both languages) |
| `states.js` asserts five footer links; `collect-site.sh` names the four pages | met |

## Suggested next action

The orchestrator sends Blockers 1 and 2 and Nits 1-12 to one implementer fix pass on
`claude/ai-mcp`:
1. Run `npm ci` in the worktree, then `npm run build:test`.
2. Apply the page, template, spec, test and handoff patches.
3. Re-seed the goldens, all four shards, or take CI's `--update` text from this sha's
   failing `app/golden` rows.
4. Run `node tests/derived.js`, `node tests/contracts.js`, `node tests/stub.js`, and
   `rtk npm run check:fast`.
5. Push. CI's run of the fix tip is the gate for landing 3.

There is no second review: the fix pass is the one remediation cycle.

## Checks still needed

- CI `app/golden` (all four rows) green after the re-seed.
- CI `browser` `app/states` shards 3 and 4: checks 109 and 114 (the «API» hit test at
  360 and 390 px) pass with the `min-width` fix; shard 2 check 68 within 500 ms.
- CI `app/typo` passes on a clean `npm ci` (this confirms Risk 4).
- `tests/stub.js` at 320 and 390 px on the four new pages, after Nit 1.
- Owner step at landing 3: the Claude connector with "No sign in" answers a roll
  (Risk 1); and the live check of the four page URLs (200, noindex) after Nit 9.
