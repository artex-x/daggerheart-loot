# The Measure Rule - one width rule for every multi-line text block (owner item 15; docs only)

Purpose: this brief audits every multi-line text block of the app, states one measure rule with three classes, and
names the CSS, the DESIGN.md and FEATURES.md text, the browser check and the placement (an extension of merged batch
TD). It changes no code and no other plan file; the fold list at the end is for the orchestrator.

Evidence: `mocks/text/` - `index.html` (the before and after shots side by side), `measure.cjs` (the live probe),
`summarise.cjs`, `today.json` with `today-summary.txt`, `long-today.json` (the longest record and the dialog),
`after.json` with `after-summary.txt` (the proposed CSS, `after.css`, injected over the live site) and `shots/`
(`today-*` and `after-*`, RU, 1180 and 1920 px). Live site `https://daggerheart-loot.pages.dev`, signed out,
2026-11-05, one browser, a fresh context per reading, 230 readings today (23 states, 5 widths, RU and EN). Widths: 360x640, 768x1024, 1180x900, 1440x900, 1920x1080.
"cpl" is characters per line (the text's characters over its drawn lines); "free" is the width the block takes with its
own cap removed, in place; "early" means the block draws more lines than its free width needs.

## 1. Inventory

Measured live where a signed-out reader reaches it; "CSS" marks a block that needs a sign-in, read from the source at
HEAD `340fa727` plus 9b's working tree. Font sizes: 14 px (`--t-small`) unless named; at 14 px 1ch = 6.96 px, so 70ch =
487 px, 78ch = 543 px, 120ch = 835 px. One row per block; the numbers are the longest instance, RU first, EN in
parentheses.

| # | Block | Component, selector | Container | Cap today | 360 | 768 | 1180 | 1440 | 1920 | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Page lead, `/search` (91 c RU, 90 EN) | `PageHead` `.page-sub` | the column | 70ch | hidden | 2 L, 46 cpl | 2 L, 46 | 2 L, 46 | 2 L, 46 | early from 768 (free 721-1440, needs 593) |
| 2 | Page lead, `/homebrew` (105, 113; measured signed out, the same lead signed in) | `PageHead`/`PageTitle` `.page-sub` | the column | 70ch | hidden | 2 L, 53 (57) | 2 L | 2 L | 2 L | early from 768 (needs 684 / 633) |
| 3 | Page lead, `/lists` (59, 70), the roll pages (37-66), `/p/` (33), `/s/` not found (38-40) | `PageHead`/`PageTitle` `.page-sub` | the column | 70ch | 2 L, 30 (`/lists`); hidden on roll | 1 L | 1 L | 1 L | 1 L | right |
| 4 | Page lead, `/account` signed out (97, 88) | `PageTitle` `.page-sub` in `AccountPage` `.col` | `.col`, 70ch of 16 px = 557 px | 70ch and the column | 3 L, 32 (2 L) | 2 L, 49 (2 L, 44, early) | 2 L | 2 L | 2 L | early: EN needs 499 of 557; RU needs 633, the column cuts it |
| 5 | Sign-in lead, `/lists` signed out (91, 78) | `SignInPrompt` `.signin-lead` | the panel, beside its button | 62ch = 434 px | 3 L, 30 | 2 L, 46 (2 L, 39, early) | 2 L, early | 2 L, early | 2 L, early | early from 768 EN, 1180 RU (free 593-1312) |
| 6 | Sign-in lead, `/homebrew` signed out (39, 33) | `SignInPrompt` `.signin-lead` | the panel | 62ch | 1 L | 1 L | 1 L | 1 L | 1 L | right |
| 7 | Plate cause, start and nothing found (`/search`, `/tables/*`; 47-62) | `SearchPage`, `TablesPage`, `HomebrewPage` `.cause` in `Empty` | the plate, centered | 60ch = 418 px | 2 L, 25-31 | 1 L | 1 L | 1 L | 1 L | right (a longer cause, a long typed query, would wrap at 60ch: same class as row 1) |
| 8 | Plate hint, `/lists` no lists (75, 67) | `ListsPage` `.hint` | the plate, centered | 46ch = 320 px | CSS: 2-3 L | CSS: 2 L, early | 2 L, early | 2 L, early | 2 L, early | early (needs about 495 px) |
| 9 | Help panel «Об этих данных», `/tables/eq_weapon` (3 paragraphs, 100-144 c RU, 136-163 EN) | `HelpBox` `.helpbox p` | the panel spans the column (277-1404 px inside) | 78ch = 543 px | 4 L, 36 | 2 L, 72 (82) | 2 L, 72 (82) | 2 L | 2 L | the box is 1.3-2.7x its text: an empty band of 560-890 px inside the panel from 1180 (owner item 15) |
| 10 | Help panel «Где какая редкость», `/roll/std` (4 paragraphs, 62-114 c) | `HelpBox` | the panel | 78ch | 3 L, 38 | 2 L, 57 | 2 L | 2 L | 2 L | band 600-900 px inside the panel; one paragraph wraps |
| 11 | Help panel, `/roll/alt` (5 paragraphs, up to 180 c) | `HelpBox` | the panel | 78ch | 5 L, 36 | 3 L, 60 (2 L, 83) | 3 L | 3 L | 3 L | as row 9 |
| 12 | Help panel «Об этой книге», `/roll/vault_of_ages` (5 paragraphs, up to 372 c) | `HelpBox` | the panel | 78ch | 9 L, 41 (EN) | 5 L, 74 (4 L, 93) | 5 L, 74 (93) | 5 L | 5 L | the text is long prose and keeps a measure; the box is the defect (shot `today-roll-voa-help__1920__ru.png`: 880 px empty); EN at 93 cpl is past every source's band |
| 13 | Footer licence (661 c, both languages) | `Shell` `details.foot-licence p` (13 px) | the column | none | 13 L, 51 | 6 L, 110 | 4 L, 165 | 3 L, 220 | 3 L, 220 | too long: 220 characters a line from 1440 |
| 14 | Roll result face text (82-208 c) | `RecordCard` `.card-desc` on a roll face | the face, 181-378 px | none | 6-8 L, 23-35 | 30-42 | 22-45 | 37-52 | 37-52 | right (the face is the measure) |
| 15 | Record card description, set bonus, rule-card text (`/i/voa2_a3`, the longest: 847 c RU, 874 EN; the record dialog) | `RecordCard` `.card-desc`, `.set-bonus`, `.ref-text` | the dossier's text column beside the picture from 761 px: 401 px at 768, 556 px from 1180 (the dialog 526 px) | none | 8 L, 40 (7 L, 49) | 6 L, 53 (57) | 4 L, 80 (86) | 80 (86) | 80 (86) | right: the layout column is the measure (at most 80ch of its 14 px text) |
| 16 | List note and GM note on `/s/` (`NOTE_MAX` 4000) | `HitNote` `.htext` (13 px) in `SharedListPage` `.notes` | the column | none | CSS: the column | CSS: about 690 px, about 110 cpl | about 1100 px, about 175 | about 1360 px, about 215 | 1390 px, about 220 | too long from 768 |
| 17 | Entry notes on a row (`/lists/<uuid>` `.rnote`, `/s/` `.rnotes`) | `HitNote` | the row, less 146 px of indent on the list page | none | CSS | CSS: about 85 cpl | about 150 | about 190 | about 195 | too long from 1180 |
| 18 | List notes in the side column (`/lists/<uuid>` from 1000 px) | `HitNote` in `ListPage` `.lnotes` (stretched) | 330 px less padding | none | CSS: the column (up to 999 px) | CSS: about 110 cpl (one column) | 298 px, about 47 | 47 | 47 | right from 1000; too long at 768-999 |
| 19 | Share panel hint (240 c RU), price guess note (220 c), request lines | `SharePanel` `.hint`, `ListPage` `.guess-note`, `RequestsPanel` `.ntext` | the side column from 1000, else the column or a sheet (560 px) | none | CSS | CSS: up to 110 cpl | side column, about 45 | 45 | 45 | too long at 768-999 only |
| 20 | Import preview lines (the counts, the zip and frozen notes) | `ImportPanel`, `HomebrewImport` `.preview`, `.hint`, `.fhint` | the panel in the column | none | CSS | CSS | short lines (under 120 c) | - | - | right (line class) |
| 21 | Editor meta line, form hints, captions and error lines (`hbArtLine` 90 c, `hbCardSourceCap`, refusals) | `HomebrewEditor` `.esub` (70ch), `ArtField`/`CardForm`/`HomebrewRelations` `.hint`, `.cap`, `.refused`, `FormField` `.ferr`, `NameField` `.err` | the form, at most 720 px | `.esub` 70ch, others none | CSS | CSS | under 120 c each: 1 line in the 720 px form | 1 L | 1 L | right; `.esub` takes the line token |
| 22 | Warning box (the editor's conflict and gone banners, the print clip warnings) | `NoticeBox` `.lead` (13 px) | its slot, with actions | `flex: 1 1 320px` | CSS | CSS | under 150 c: 1-2 L | - | - | right: a box with actions is a control row; its lead takes the line cap |
| 23 | Print page notes (`printNote` 150 c, the missing note, the clip warning) | `PrintPage` `.printnote`, `.clipwarn` (13 px) | the column | 62ch = 434 px | CSS | CSS: 2 L | 2 L | 2 L | 2 L | passage text, right in kind; 62ch is a fourth literal |
| 24 | Error page sentence (`noItemSub` up to about 120 c with the address) | `ErrorPage` `.errtext` | the column | 62ch | not drawn by the probe (the host answered) | - | CSS: 2 L for 100 c | 2 L | 2 L | early (a one-to-two sentence line) |
| 25 | Account hints signed in (`deleteHint` 60 c, `yourDataHint` 41 c, the consent line 59 c) | `AccountPage` `.hint` (13 px) | the panel: one column, or a half of 1100 px | none | 2 L, 30 (the consent line) | 1 L | 1 L | 1 L | 1 L | right |
| 26 | Toasts (up to 110 c, `plan-T.md`) | `Toast` `.toast` (14 px semibold) | the window less 32 px, `max-content` | none | CSS: 3 L at 296 px | 1 L | 1 L | 1 L | 1 L | right |
| 27 | Row descriptions (`/search`, `/tables/*`, the list page, `/s/`) | `RowMain` `.rt` | the row | 70ch on production; none in 9b's tree | 3-line clamp | 2-line clamp | 43% of a row empty | 54% | 55% | settled by 9b (The Row Text Rule, case 106; `mocks/9b/measure.json`) |
| 28 | A menu item's second line (the relink line) | `PickRow` `.mit small` (13 px) | the menu, at most 320 px | 28ch = 195 px | CSS | CSS | CSS | CSS | CSS | right: a caption in a 320 px menu; kept as a named exception |
| 29 | Static pages `privacy.html`, `terms.html`, `install.html` (paragraphs to 908 c, lists to 427 c) | `tools/build-pages.js` `main` (system face, 15 px) | the page | 640 px | 21-32 L, 37-45 | RU 80 cpl, EN 97 | 80 (97) | 80 (97) | 80 (97) | RU right; EN 97 cpl is past every source's band |

Totals: 29 blocks (33 selectors). Live measured: 16 blocks (rows 1-7, 9-15, 25, 29); read from the CSS: 13 (rows 8,
16-24, 26-28), because they need a sign-in or a state the signed-out site does not reach. Of the 29: 10 wrap early or sit in a
box wider than their text (rows 1, 2, 4, 5, 8, 9-12, 24), 6 run too long (rows 13, 16-19, 29 EN; row 12 is also too
long in EN), 13 are right (rows 3, 6, 7, 14, 15, 20-23, 25-28). Caps today: 15 literals in seven
values (28ch, 46ch, 60ch three times, 62ch four times, 70ch four times, 78ch, and 640 px), no token.

## 2. Where the width is wrong

Early wraps (the block wraps while its column has the room; the owner's complaint):

- Row 1 `/search` lead and row 2 `/homebrew` lead from 768 px (owner item 14, already in `plan-D.md` D-6).
- Row 4 `/account` lead (EN from 768; RU because the 557 px column is narrower than its 633 px line).
- Row 5 `/lists` sign-in lead (62ch).
- Row 8 `/lists` plate hint (46ch).
- Row 24 the error page sentence (62ch).
- Rows 9-12 the help panels: the text keeps a measure, which is right for 3-5 paragraphs, but the box spans the column,
  so 560-890 px of the panel is empty from 1180 px (owner item 15).

Too long (the other direction; no source accepts these):

- Row 13 the footer licence: 165-220 characters a line from 1180 px.
- Rows 16-17 the notes on `/s/` and on rows: 110-220 characters a line from 768 px; a note can hold 4000 characters.
- Rows 18-19 the list page's notes and long hints from 768 to 999 px (about 110 cpl).
- Row 29 EN static pages (97 cpl).
- Row 12 EN help prose at 78ch (93 cpl).

Right today: rows 3, 6, 7, 14, 15, 20-23, 25, 26, 28; row 27 is settled by 9b.

Cause, in one line: the caps are chosen per component (seven values), so a short line gets a prose cap and long prose
gets none.

## 3. The rule

### Sources

| Source | Official | What it says (own words) | Use here |
|---|---|---|---|
| WCAG 2.2, SC 1.4.8 Visual Presentation (AAA), https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html | yes, W3C | A block of text is at most 80 characters wide. The reason is the return sweep: with long lines a reader with a reading or vision disability loses the start of the next line. It sets a ceiling only. | The passage measure: about 80 characters. The project's target is WCAG 2.2 AA, so this AAA ceiling is a design choice, taken for its reason. |
| GOV.UK Design System, Layout, https://design-system.service.gov.uk/styles/layout/ | yes, UK Government Digital Service | Main content is in a two-thirds column, "usually ... no more than 75 characters per line", so lines do not get too long on a desktop. | The same band for prose. |
| U.S. Web Design System, Typography, https://designsystem.digital.gov/components/typography/, and its measure tokens, https://designsystem.digital.gov/design-tokens/typesetting/measure/ | yes, U.S. General Services Administration | Most lines are 45-90 characters, 66 for long texts; short passages may sit outside the range; the system names measure tokens (1 to 6 and none) instead of literals. | The shape of this rule: named measure tokens, not a literal per component; a one-line block may run past the prose band. |
| Apple UIKit, `readableContentGuide`, https://developer.apple.com/documentation/uikit/uiview/readablecontentguide | yes, Apple developer documentation | One column of text takes a "readable width" tied to the text size, so a reader does not move the head to track the lines, and it never passes the view's margins. | The passage box: the text keeps a readable width at every window; a narrow window gives the column. No character count is given. |
| Material Design 3 and 2 | yes, Google | No source found: `m3.material.io` and `m2.material.io` render by script, and the fetch read only a title (as `plan-D.md` D-1 found). | Not cited. |

Owner preference (items 14 and 15): no early wraps; a block of one or two sentences takes one line while its column
allows it; a box is not wider than its text.

The sources and the owner agree once two cases are told apart. A block that draws one line has no return sweep, so the
80-character ceiling has no reason to bind it. A block whose lines are read in sequence has one, so it keeps the prose
band, and its box follows its text so no band is left inside the box.

### The classes

| Class | Blocks (inventory rows) | Measure | When it applies | At 360 px |
|---|---|---|---|---|
| Line | a page lead, a plate's cause and hint, a sign-in lead, an error page's sentence, the editor's meta line, a form hint, caption or error line, a warning box's lead, an import preview line, a status line, a toast (rows 1-8, 20-22, 24-26) | `--measure-line: 120ch` (835 px at 14 px; about 140 characters of Source Sans 3) | text of one or two sentences, at most 120 characters in either language (the longest measured is 113, `/homebrew` EN); it takes one line while its column allows it; when it wraps, `text-wrap: balance` evens its lines | wraps in the column; balanced |
| Passage | a help panel, a note (`HitNote`), the print page's notes, the share and price hints, the request lines, the footer licence, the static pages; a record's text and a roll face's text by their layout column (rows 9-19, 23, 29) | `--measure-text: 70ch` (487 px at 14 px, 454 px at 13 px: about 80 characters in RU and EN, see below) | text read as lines in sequence: three lines or more, or any text a person can make long (a note, a description); a passage in a layout column of at most 80ch takes the column (the dossier's text column, a roll face, the list page's side column) | the column (313 px, about 45 characters) |
| Row | a row's description (row 27) | none | the clamped snippet of a row (The Row Text Rule, 9b): the row's free width, 3 lines up to 600 px and from 1000 px, 2 between | unchanged (9b) |

A box that holds only passage text (`HelpBox`, `HitNote`) is as wide as its text: `width: fit-content; max-width: 100%`.
A box with actions (`NoticeBox`, the sign-in panel, `Panel`) is a control row: it keeps its slot's width, and its text
takes the line class without growing past its own text (`flex: 0 1 auto`), so the action follows the text and not the
cap (measured: with the cap alone, the `/lists` sign-in button sat 248 px right of its one-line lead at 1920 px). In a
column narrower than the measure the box fills the column (the list page's side column keeps its stretched notes).

Why 70ch for a passage, not 78ch or 80ch: `ch` is the width of «0», and the average letter is narrower (measured on the
help text at 14 px: 6.3 px a character RU, 5.9 px EN, 6.96 px a `ch`). At 78ch (543 px) the widest help line holds about
86 RU and 91 EN characters, and the Vault of Ages panel averages 93 a line in EN (rows 9-12): past WCAG's 80 and at the
edge of USWDS's 90. At 70ch (487 px) the widest line holds about 76 RU and 81 EN characters (the after run: widest lines
454-482 px), inside WCAG's 80 within one or two characters, GOV.UK's 75 within one and USWDS's 45-90. It is also the
value DESIGN.md already names for prose ("Prose caps at 70ch") and the code uses for `AccountPage` and `HomebrewEditor`,
so the token keeps it.

Why 120ch for a line: it is `plan-D.md` D-6's value, already approved with batch D (owner, 2026-11-05: "the lead cap
120ch"); every measured line-class text fits it in one line from 768 px.

Named exceptions: the print card (its fit ladder sets its own type, a product law); a menu item's second line (row 28:
the menu's 320 px is its box); the account's signed-in 1100 px and the dossier's 980 px (layout widths of The One Width
Rule, not measures). The dossier's text column (556 px from 1180, 80ch of its text: RU 80, EN 86 characters a line,
measured on `voa2_a3`) is within WCAG's ceiling and USWDS's band, so the record text takes no cap of its own: a 70ch cap
there would leave a 69 px band inside the card and add a line to every long record for no reader gain.

Trade-off accepted: a help paragraph of 100-163 characters takes two or three lines at every width, not one: a panel is
three to five paragraphs read in sequence, which is the case WCAG's measure is for. Its box shrinks to the text, so the
owner's "panel wider than its text" goes. The EN `/tables` panel gains about one line per long paragraph (78ch to 70ch).
Fallback, if the owner reads the panel as wrapping early: help paragraphs take the line class (120ch) inside the hugging
box - one token on one selector.

### Defaults (AFK, logged in `C:\Users\Ignat\.dhloot\notes\owner-afk-2026-11-03\decisions.md`, item 23)

- MR-1: three classes, two tokens (`--measure-line` 120ch, `--measure-text` 70ch); rows keep 9b's rule. Alternative: one
  80ch measure everywhere (rejects the owner's one-line lead) or no caps (220-character footer and note lines).
- MR-2: the passage box hugs its text. Alternative: the text fills a full-width box (one-line paragraphs of up to 220
  characters at 1920).
- MR-3: a line that wraps is balanced. Alternative: greedy wrap (a 121-character lead leaves one word on line two).
- MR-4: help panels are passages. Alternative: the line class for help paragraphs (the fallback above).
- MR-5: `/account` signed out: the 70ch cap moves from the column to its sign-in panel (`--measure-text`), so the lead
  follows the line class like every lead (RU 633 px, EN 499 px: one line from 768). Alternative: keep the column cap (RU
  stays on two lines, as `plan-D.md` accepted).
- MR-6: the static pages take `max-width: 70ch` in `tools/build-pages.js` in place of 640 px. Alternative: keep 640 px
  (EN 97 characters a line).

### Measured with the rule injected (`after.json`, `after-summary.txt`, `shots/after-*`)

The proposed CSS (`after.css`, 70ch and 120ch) over the live site, 9 states, 5 widths, RU and EN:

| Block | 768 | 1180 | 1440 | 1920 | Today at 1180 |
|---|---|---|---|---|---|
| `/search` lead (91 c RU, 90 EN) | 1 L | 1 L | 1 L | 1 L | 2 L |
| `/homebrew` lead (105, 113) | 1 L | 1 L | 1 L | 1 L | 2 L |
| `/account` lead (97, 88) | 1 L (633 px RU) | 1 L | 1 L | 1 L | 2 L |
| `/lists` sign-in lead (91, 78) | RU 2 L (needs 597 of 593), EN 1 L | 1 L | 1 L | 1 L | 2 L |
| `/tables` help panel box | 487 px wide, text to 454-478 px | the same | the same | the same | box 1097 px, text 514-538 px |
| `/tables` help paragraphs (144 RU, 163 EN) | RU 2 L, 72 cpl; EN 3 L, 54 cpl | the same | the same | the same | RU 2 L; EN 2 L, 82 cpl |
| `/roll/vault_of_ages` help (372 c) | RU 6 L, 62 cpl; EN 5 L, 74 | the same | the same | the same | RU 5 L, 74; EN 4 L, 93 |
| `/roll/std` help (4 paragraphs) | box hugs, «Легендарная» 2 L | the same | the same | the same | box 1097 px |
| Footer licence (661 c) | 9 L, 73 cpl | 9 L, 73 | 9 L, 73 | 9 L, 73 | 4 L, 165 |
| Plate causes | 1 L | 1 L | 1 L | 1 L | 1 L |
| 360 px, every block | unchanged in width (the column is narrower than every measure); the sign-in lead and the account lead balance their lines | | | | |

The record dialog opened in this run (row 15): its text column is 526 px at 1180. `after.css` still capped the record
text at 70ch (487 px); this brief drops that cap after the `voa2_a3` reading (`long-today.json`: RU 80, EN 86 characters
a line in the 556 px column), so the record text is unchanged by the batch.

## 4. The changes

### CSS (one comment line per rule only where the reason is not in the token's name)

`app/src/styles/tokens.css`, beside `--wrap` and `--dossier-w`:

```css
  /* The Measure Rule (DESIGN.md "Typography"): a line, and a passage read line after line. */
  --measure-line: 120ch;
  --measure-text: 70ch;
```

`ch` in a custom property resolves where it is used, in that element's font, so 70ch is 487 px on 14 px text and 454 px
on 13 px text. That is the intent: the measure counts letters, not pixels.

| File | Selector | Today | After |
|---|---|---|---|
| `PageHead.svelte` | `.page-sub` | `max-width: 70ch` (120ch after `plan-D.md` S5) | `max-width: var(--measure-line); text-wrap: balance;` (replaces D-6's literal) |
| `PageTitle.svelte` | `.page-sub` | 70ch | same as `PageHead` |
| `SignInPrompt.svelte` | `.signin-lead` | 62ch, `flex: 1 1 240px` | `max-width: var(--measure-line); flex: 0 1 auto; text-wrap: balance;` (the button follows the text, not the cap) |
| `SearchPage.svelte`, `TablesPage.svelte`, `HomebrewPage.svelte` | `.cause` | 60ch | `var(--measure-line)`, balance |
| `ListsPage.svelte` | `.hint` | 46ch | `var(--measure-line)`, balance |
| `ErrorPage.svelte` | `.errtext` | 62ch | `var(--measure-line)`, balance |
| `HomebrewEditor.svelte` | `.esub` | 70ch | `var(--measure-line)` |
| `NoticeBox.svelte` | `.lead` | none | `max-width: var(--measure-line)` |
| `Toast.svelte` | `.toast` | `max-width: calc(100% - 32px)` | `max-width: min(var(--measure-line), calc(100% - 32px)); text-wrap: balance;` (T opens this file) |
| `HelpBox.svelte` | `.helpbox` and `.helpbox p` | the box spans; p 78ch | `.helpbox { width: fit-content; max-width: 100%; }`; `p { max-width: var(--measure-text); }` |
| `HitNote.svelte` | `.hitnote`, `.htext` | none | `.hitnote { width: fit-content; max-width: 100%; }`; `.htext { max-width: var(--measure-text); }` |
| `ListPage.svelte` | `.lnotes > :global(.hitnote)` | `align-self: stretch` | add `width: auto` so the side column keeps its stretched notes |
| `RecordCard.svelte` | `.card-desc`, `.set-bonus`, `.ref-text` | none | unchanged: the dossier's text column is the measure (named exception) |
| `SharePanel.svelte` `.hint`, `ListPage.svelte` `.guess-note`, `RequestsPanel.svelte` `.ntext` | - | none | `max-width: var(--measure-text)` |
| `PrintPage.svelte` | `.printnote`, `.clipwarn` | 62ch | `var(--measure-text)` |
| `Shell.svelte` | `.foot-licence p` | none | `max-width: var(--measure-text)` |
| `AccountPage.svelte` | `.col` signed out | `max-width: 70ch` on the column | the column takes no cap; `.col:not(:has(.acc)) > :global(.panel) { max-width: var(--measure-text); }`; the signed-in 1100 px stays |
| `tools/build-pages.js` | `main` | `max-width: 640px` | `max-width: 70ch` |
| `PickRow.svelte` | `.mit small` | 28ch | unchanged; one comment line names it as The Measure Rule's menu exception |
| `RowMain.svelte` | `.rt` | none (9b) | unchanged |

`text-wrap: balance` is a progressive enhancement: Chrome 114, Firefox 121 and Safari 17.5 balance; an older engine
wraps greedily with the same caps. No `@supports` is needed.

### The static check

`tests/derived.js`, a block "One measure" beside D's "Dashed means drop": no `max-width` with a `ch` literal in
`app/src` (`.svelte`, `.css`) outside `styles/tokens.css`, except `components/PickRow.svelte` (`.mit small`). Pattern:
`/max-width\s*:\s*[\d.]+ch\b/g`; first assert it matches `max-width: 70ch` and not `var(--measure-text)`.

### DESIGN.md (replaces the scattered sentences)

"Typography", "Named Rules", a new rule after The Whole Message Rule:

> **The Measure Rule.** Text keeps the measure of its class, named in `tokens.css`, never a `ch` literal in a
> component. A line - a page lead, a plate's cause or hint, a sign-in lead, an error page's sentence, a form hint or
> error, a warning's lead, a status line, a toast - is at most `--measure-line` (120ch): one or two sentences take one
> line while the column allows it, and a wrap is balanced. A passage - a help panel, a note, a long hint, the footer's
> licence - is at most `--measure-text` (70ch, about 80 characters a line in both languages), because its lines are
> read one after another (WCAG 1.4.8, https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html; GOV.UK,
> https://design-system.service.gov.uk/styles/layout/); a passage in a layout column of at most 80ch, such as the
> dossier's text and a roll face, takes the column. A box that holds only a passage is as wide as its text; a box with
> actions keeps its slot, and its text does not grow past itself. A row's description has no measure (The Row Text
> Rule). At 360px every class takes the column. `tests/app/states.js` case 111 measures it.

Sentences that change (each now points at the rule):

| Place | Today | After |
|---|---|---|
| "Typography", "Hierarchy", Body | "Prose caps at 70ch." | "Its measure follows The Measure Rule." |
| "Typography", "Hierarchy", Body Small | "1.62 on a full card. Notes cap at 62ch." | "1.62 on a full card." |
| "Layout", "The One Width Rule" | "the account at most 1100px and prose at most 78ch. A row's text is a clamped snippet, not prose, and takes its row's free width (The Row Text Rule)." | "and the account at most 1100px; text inside them keeps its class's measure (The Measure Rule)." This replaces `plan-D.md`'s measure sentence for the same place. |
| "Components", "The Row Text Rule" | "The text is a clamped snippet, not prose, so the prose measure does not apply." | "It is the row class of The Measure Rule: a clamped snippet with no measure." |
| "Components", "Toast", Width | "as wide as its text, at most the window less 16px a side" | "as wide as its text, at most the line measure (The Measure Rule) and the window less 16px a side" |

### FEATURES.md

- "Account" (the sentence "Signed out it is one column at 70ch"): "Signed out its sign-in panel keeps the passage measure
  and its lead takes one line while the column allows it (DESIGN.md, "The Measure Rule")".
- "Chrome", the help panels item: add "An open panel is as wide as its text (DESIGN.md, "The Measure Rule")."
- "Consistency rules": no new rule; the measure is visual and lives in DESIGN.md.

### COVERAGE.md

- Case 111 is "the text measure" (it replaces D's "the page lead"), and the derived block "One measure".

## 5. First-screen effects and the browser check

First screen (`FIRST_SCREEN`, 360x640 and 1180x720; nothing at 360 moves, because every measure is wider than the 313 px
column):

| Row | Effect at 1180 | Cause |
|---|---|---|
| `#/search ~ searched`, `#/search ~ kind picked` | about -22 px | the lead takes one line (D-6, unchanged by this rule) |
| `#/homebrew as gm3`, the homebrew tab rows with a lead | about -22 px | the same |
| `#/account as gm1` | none | the signed-in page has no lead |
| `#/lists as gm1` | none | its lead is one line today |
| `#/i/ci1`, `#/h/... as gm1` | none | the record text keeps its layout column |
| the help panels | none: they are folded by default | - |

Not a `FIRST_SCREEN` row, logged in `handoff.md`: `/lists` and `/account` signed out rise about 22 px from 768 px (the
sign-in lead and the account lead take one line).

The browser check: case 111 "the text measure" in `tests/app/states.js` (TD's numbering; D's lead case, 111 in `plan-D.md`, is widened into it).
One case reads every class on its routes, at 360x640, 768x1024, 1180x720, 1440x900 and 1920x1080, RU and EN, through the
in-memory loader on `dist-test/`:

- (a) Line: `#/search`, `#/homebrew as gm3`, `#/roll/alt`, `#/lists` (signed out: the lead and the sign-in lead),
  `#/account` (signed out), `#/search ~ nothing found` (the cause), `#/lists ~ no lists as gm1` (the plate hint), and the
  not-found page (the error sentence). For each block: its computed `max-width` equals 120ch of its own font (a probe
  span of «0» x 100), within 1 px; where its one-line width (a hidden `nowrap` clone) is at most its free width, it
  draws one line; at 360 it wraps inside its column with no sideways scroll; its `text-wrap` is `balance` where the engine
  reports it.
- (b) Passage: `#/tables/eq_weapon` with «Об этих данных» open, `#/roll/vault_of_ages` with its panel open,
  `#/s/gm-token-1` (the list note), the footer licence opened. For each block: every drawn line (the `Range` line
  boxes) is at most 70ch of its font plus 1 px; for `.helpbox` and `.hitnote`, the box's inner width is at most its
  widest paragraph's box plus 1 px (no empty band), and at 360 the box is the column. On `#/i/voa2_a3` (the longest
  description) the `.card-desc` box is at most 80ch of its font (the layout-column exception holds).
- (a2) A box with actions: on `#/lists` signed out at 1180 and 1920, the sign-in button's left edge is within 12 px of
  the lead's widest line (the 10 px gap), RU and EN.
- (c) Row: not read here; case 106 (9b) owns it.
- (d) The static check "One measure" runs in `tests/derived.js`.

Proof that it fails at HEAD: (a) fails on `/search` from 768 (two lines) and on the `/lists` sign-in lead; (b) fails on
the help panel's box at 1180 (inner 1097 px, paragraph 543 px) and on the footer licence at 1440 (1391 px lines).

## 6. Placement

Recommended: extend merged batch TD (`plan-T.md` with `plan-D.md`). Reasons: D-6 already opens `PageHead` and
`PageTitle` for the lead cap and writes the lead case (TD's 111) of the same shape; T opens `Toast.svelte`; D opens `HitNote`,
`ListPage`, `ListsPage`, `TablesPage`, `SearchPage`, `HomebrewPage` and DESIGN.md's "The One Width Rule" and "Typography".
No `CLAUDE.md` split criterion applies: no public contract, the same route set as D, no golden moves (the goldens are
accessibility trees and control lists; widths are not in them), the same gates. The new files for TD: `tokens.css` (T
already), `HelpBox`, `SignInPrompt`, `ErrorPage`, `PrintPage`, `Shell`, `AccountPage`, `NoticeBox`, `SharePanel`,
`RequestsPanel`, `HomebrewEditor`, `PickRow` (a comment), `tools/build-pages.js` (12 files, each one to three
declarations).

Cost inside TD: about 40-55 min more (CSS edits 15; case 111 widened from five routes and three widths to the three
classes at five widths, 15-20 to write and 5-8 to run red then green; the derived block 5; the docs 10; the review grows
5-10). TD becomes about 168-230 min (`plan-rebatch.md`: 128-175). As its own step after TD: about 100-130 min (dispatch,
`check:fast`, one CI run, a review and its fix cycle, the lints and the detector, `build:test`), so the merge saves about
60-75 min. Review size: TD's about 45 files plus 12, all one-to-three-line CSS edits; goldens 6 headers. It stays inside
one pass by `plan-rebatch.md`'s yardstick (40 files and 150 goldens), because the added files carry no logic.

Not N: N restructures `PageHead`'s markup and moves about 145 goldens; it keeps the token when it moves `.page-sub`.
Not batch 10: it is the docs lock and carries no code.

## 7. Standing checks (for the TD dispatch)

1. Scale. States:

   | State | What the screen shows | Proof |
   |---|---|---|
   | empty (a plate) | the cause and hint on one line from 768 px, centered, balanced at 360 | case 111 (a) |
   | one, many | leads one line from 768 px; help panels as wide as their text; notes at the passage measure | case 111 |
   | at the limit | a 4000-character note at 70ch: about 50 lines at 1180, the box as wide as its text | case 111 (b) on `#/s/gm-token-1` reads the cap; the length is arithmetic |
   | one past it, 3x | not applicable: the measure has no limit of its own; `NOTE_MAX` is a validator constant | unchanged |
   | the longest text | `voa2_a3` (874 characters EN) in its dossier column (at most 80ch: RU 80, EN 86 characters a line); the `/homebrew` EN lead (113 characters) on one line from 768 px | case 111 |
   | 360 px | every class takes the column; nothing moves | case 111, `FIRST_SCREEN` |
   | 1180 px | leads one line, panels hug their text | case 111 |

   No sticky region and no popup changes; the toast keeps its window inset.
2. Error scenarios: not applicable to storage - CSS only. Loading and failed reads draw `LoadState`'s line (line class,
   short); the error page's sentence takes the line measure. A stale tab draws the old widths; nothing is stored.
3. Consistency: one measure per class on every page (leads, plates, sign-in leads, help panels, notes); the sibling
   pages' leads and plates now match. Named differences: the print card, the menu item's line, the signed-in account and
   dossier layout widths.
4. RU/EN parity: no string changes. The measure is in `ch`, so RU and EN take the same box; the widest lines differ (about
   76 RU and 81 EN characters at 70ch), both inside the sources' bands. Every case reads both languages.

## 8. Fold list (folded into `plan.md`, `plan-TD.md` and `handoff.md` on 2026-11-06; kept for the record)

1. `plan-T.md` / `plan-D.md` dispatch (TD): read this brief with them; TD's acceptance gains lines MT-1 to MT-7 below;
   D-6's literal 120ch becomes `var(--measure-line)` (same value); D's lead case (TD 111) widens into "the text measure"
   (section 5); `plan-D.md` S8's One Width Rule sentence and its "Typography", "Hierarchy" Body line are replaced by
   this brief's (section 4).
   - MT-1: `tokens.css` holds `--measure-line: 120ch` and `--measure-text: 70ch`; every selector of section 4 uses them.
   - MT-2: case 111 (a) and (a2) pass: every line-class block of its routes draws one line from 768 px where it fits,
     wraps in the column at 360, RU and EN; the `/lists` sign-in button follows its lead within 12 px.
   - MT-3: case 111 (b) passes: no passage line past 70ch; `.helpbox` and `.hitnote` inner width within 1 px of their
     widest paragraph from 768 px; at 360 the column.
   - MT-4: `tests/derived.js` "One measure" passes (no `ch` literal outside `tokens.css` and `PickRow`).
   - MT-5: DESIGN.md carries The Measure Rule and the five replaced sentences; FEATURES.md the account and help-panel
     lines; COVERAGE.md case 111 and the derived block.
   - MT-6: `tools/build-pages.js` `main` is 70ch; `node tools/build.js` regenerates the pages; EN `privacy.html` at 1180
     draws at most about 85 characters a line (logged in `handoff.md`).
   - MT-7: `handoff.md` logs the before and after lines of rows 1-13 at 1180 and 1920 RU (from `mocks/text/` and the
     built run), and the `/lists` and `/account` signed-out rise.
2. `plan.md` Status: "Owner item 15 (2026-11-05): `plan-text.md` (The Measure Rule; defaults MR-1 to MR-6, AFK
   decisions file item 23), inside batch TD; no plan review (no trigger fired: no migration, contract, stored data or
   write protocol)."
3. `plan.md` section 8: TD's cost 168-230 min (was 128-175).
4. `plan-N.md` preflight: when `PageHead` moves `.page-sub`, it keeps `var(--measure-line)` and `text-wrap: balance`.
5. `context.md` item 15: "Placed (planner, 2026-11-05): `plan-text.md`, batch TD (MT-1 to MT-7, case 111)."
6. Batch 10 (the lock): `.impeccable/design.json` is regenerated by `document` after the tokens land; no other line.

## 9. Risks and do-nots

- `HitNote`'s scoped `width: fit-content` and `ListPage`'s `.lnotes > :global(.hitnote) { width: auto }` have near-equal
  specificity: case 111 (b) reads the side column at 1180 on a list page state with its list notes open (the implementer picks it
  from `inventory.js`) and fails if a note there is narrower than the column.
- Do not cap the record text (row 15) or the row text (row 27); both are settled.
- Do not add a third token for the plates: their causes are lines.
- A hugging help panel at 1920 px leaves the page area right of it empty: that is page space, not a band inside a box.
  The owner may read it as wasted width; the MR-4 fallback widens the panel, not the page.
- `text-wrap: balance` changes no line count of a one-line block; on a wrapped lead it moves words, not heights.

## 10. Open questions

None blocking. The owner may take the fallback of MR-4 (help paragraphs as lines) or MR-5's alternative at the TD mock;
both are one-line switches.
