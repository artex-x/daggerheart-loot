---
name: Daggerheart Loot Generator
description: A dark bilingual catalog of 1459 Daggerheart records, with one gold accent that marks only what was chosen.
colors:
  seal-gold: "#d8ab5e"
  seal-gold-soft: "#f0d091"
  ink-on-gold: "#1a1206"
  vault-ink: "#0e0c15"
  vault-ink-deep: "#14111d"
  vault-wall: "#1a1626"
  vault-wall-lit: "#221d31"
  seam: "#312a45"
  seam-lit: "#3f3758"
  chalk: "#ece8f6"
  ash-violet: "#9b93b3"
  ash-violet-low: "#8a83a3"
  relic-blue: "#7a8ee0"
  philtre-green: "#9ec96a"
  forge-copper: "#d48e6a"
  sigil-rose: "#cf7fa6"
  patina-teal: "#5ec9c4"
  hope-amber: "#e9b949"
  fear-violet: "#8a72d6"
  alarm-red: "#e0685f"
  alarm-red-text: "#f0a49d"
  tag-ground: "rgb(10 8 16 / 50%)"
typography:
  headline:
    fontFamily: "'Source Sans 3 Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "23px"
    fontWeight: 680
    letterSpacing: "-0.01em"
  section:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "20px"
    fontWeight: 680
    lineHeight: 1.28
    letterSpacing: "-0.01em"
  title:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "18px"
    fontWeight: 680
    lineHeight: 1.28
    letterSpacing: "-0.01em"
  body:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  control:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "15px"
    fontWeight: 600
  body-small:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  data:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "13px"
    fontWeight: 400
  label:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "12px"
    fontWeight: 650
    letterSpacing: "0.1em"
  badge:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "11.5px"
    fontWeight: 650
    letterSpacing: "0.07em"
  numeral:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "19px"
    fontWeight: 650
    lineHeight: 1
rounded:
  tag: "6px"
  control: "8px"
  sm: "9px"
  md: "14px"
  pill: "999px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  panel: "18px"
components:
  button-plain:
    backgroundColor: "{colors.vault-wall}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "46px"
  button-plain-hover:
    backgroundColor: "{colors.vault-wall-lit}"
    textColor: "{colors.chalk}"
  button-primary:
    backgroundColor: "{colors.seal-gold}"
    textColor: "{colors.ink-on-gold}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "46px"
  button-primary-active:
    backgroundColor: "#b8873f"
    textColor: "{colors.ink-on-gold}"
  button-sm:
    backgroundColor: "{colors.vault-wall}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.control}"
    padding: "0 11px"
    height: "32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "46px"
  button-danger:
    backgroundColor: "{colors.vault-wall}"
    textColor: "{colors.alarm-red-text}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "46px"
  button-danger-fill:
    backgroundColor: "{colors.alarm-red}"
    textColor: "{colors.ink-on-gold}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "46px"
  chip:
    backgroundColor: "{colors.vault-wall}"
    textColor: "{colors.ash-violet}"
    rounded: "{rounded.pill}"
    padding: "7px 12px"
  chip-on:
    backgroundColor: "{colors.seal-gold}"
    textColor: "{colors.ink-on-gold}"
    rounded: "{rounded.pill}"
    padding: "7px 12px"
  badge:
    backgroundColor: "{colors.tag-ground}"
    textColor: "{colors.ash-violet}"
    typography: "{typography.badge}"
    rounded: "{rounded.tag}"
    padding: "3px 7px"
  panel:
    backgroundColor: "{colors.vault-wall-lit}"
    rounded: "{rounded.md}"
    padding: "18px"
  card:
    backgroundColor: "{colors.vault-wall-lit}"
    rounded: "{rounded.md}"
    padding: "13px 15px 14px"
  input-search:
    backgroundColor: "{colors.vault-ink-deep}"
    textColor: "{colors.chalk}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "46px"
  number-field:
    backgroundColor: "{colors.vault-ink-deep}"
    textColor: "{colors.chalk}"
    typography: "{typography.numeral}"
    rounded: "{rounded.sm}"
    height: "46px"
    width: "74px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ash-violet}"
    padding: "9px 13px 10px"
  tab-on:
    backgroundColor: "transparent"
    textColor: "{colors.seal-gold-soft}"
    padding: "9px 13px 10px"
  toast:
    backgroundColor: "{colors.seal-gold}"
    textColor: "{colors.ink-on-gold}"
    rounded: "{rounded.pill}"
    padding: "10px 18px"
---

# Design System: Daggerheart Loot Generator

## Overview

**Creative North Star: "The Vault Index"**

The product is a treasury seen through its index. The ground is a deep violet
ink, almost black, with one linear ground at the top of the page: Vault Ink
Deep at the top edge that becomes Vault Ink 520px down and scrolls with the
page. On that ground sit the index cards: panels, record cards and table rows,
each one a slightly lighter violet plate inside a single hairline seam. Every
artifact carries a colored tag that says what kind of thing it is, and a
numbered seal in tabular figures that says where it stands in its book. Gold is
the seal wax. It appears on the thing a person has chosen, and almost nowhere
else.

The mood is quiet, exact and solemn. Nothing here is staged: the type scale is
small and even, the contrast values were measured rather than guessed, and the
one accent is rationed. The catalog holds 1459 records in two languages, so
density is a requirement, not a preference. The design earns its ceremony from
the numbering and the tagging, which are real information, and never from
ornament.

The UI face is Source Sans 3, self-hosted: the build serves its woff2 files
from its own `/assets/`, and no font service is asked for anything. The face
draws with `font-display: swap`, so the system stack behind it draws until the
file arrives. The print card is set in the same face: the sheet fits its cards
again once the face has loaded, and «Напечатать» waits for that fit, so the
printed card is the same on every machine (owner, 2026-10-29).

**The Clarity Rule.** A control, a state or a section that needs help text, a
tooltip, a legend or an instruction sentence to be understood is a defect. A
label says what its control does. The fix changes the interface so that the
text can go. Removing a help panel or any visible feature needs the owner's
yes first.

`app/src/styles/tokens.css` and `tests/app/typo.js` are normative. This file
records the system they express, in the language a design decision needs. Where
the two disagree, the code is right and this file is stale.

**Key Characteristics:**

- One accent color, spent only on the chosen thing.
- A five-hue tag system that lives on badges alone.
- Tonal depth from a four-step surface ramp, plus exactly one shadow.
- One self-hosted UI face, Source Sans 3, with tabular figures.
- A locked type scale of ten steps, enforced by a test.
- Monospace only for a value a person types or counts: a number field, a rung,
  a quantity, a price, damage dice. Some monospace labels remain (the batch
  bar's select-all, the "or" divider, alternate-table column heads, the
  help button, the record steps label); their surfaces
  still owe the change.
- Two worlds in one product: the dark screen, and the white printed card.

## Colors

A near-monochrome violet ground carrying one warm accent, five categorical tags,
and a two-color duality pair. Every color outside the neutrals has one job.

### Primary

- **Seal Gold** (`#d8ab5e`): the chosen state. A filled chip, a pressed segment,
  the primary button, the lit tab's underline, the focus ring, the toast. It is
  never decoration and never a surface at rest.
- **Seal Gold Soft** (`#f0d091`): gold as text. Links in prose, the lit tab
  label. It exists because a gold fill
  needs dark ink on it, while gold text needs to be lighter than that fill.
- **Ink on Gold** (`#1a1206`): the only color printed on a gold fill. Darker
  than any page surface, chosen against the gold specifically.

### Secondary

The five kind tags. They sit roughly evenly around the wheel with at least 49
degrees between any two, so no tag reads as a paler version of another.
Lightness alone was tried and was not enough to tell steel armor from an
ordinary item.

- **Relic Blue** (`#7a8ee0`): items.
- **Philtre Green** (`#9ec96a`): consumables.
- **Forge Copper** (`#d48e6a`): primary weapons.
- **Sigil Rose** (`#cf7fa6`): secondary weapons.
- **Patina Teal** (`#5ec9c4`): armor.

### Tertiary

- **Hope Amber** (`#e9b949`) and **Fear Violet** (`#8a72d6`): the two duality
  dice. They color the badge, the die's mark before each die's label on the
  alternate tables (the page's d12 in lines, no letter; the word names the die)
  and the focus glow of the die they belong to, on the alternate tables only.
  This is the one place where a color other than Seal Gold reaches a focus
  treatment, because the glow says which die the person is changing.
- **Alarm Red** (`#e0685f`): destructive actions and the error toast.
- **Alarm Red Text** (`#f0a49d`, `--danger-text`): the same alarm as text on
  the dark ground - a destructive button's label, an error line, a failed save.

### Neutral

- **Vault Ink** (`#0e0c15`): the page ground. The top of the page is one
  linear ground, `linear-gradient(180deg, var(--bg2) 0, var(--bg) 520px)`,
  that scrolls with the page (`background-attachment: scroll`). The site share
  cards draw the same ground.
- **Vault Ink Deep** (`#14111d`): input wells, and the top of the page ground. An input is a hole in the plate,
  darker than the plate it sits in.
- **Vault Wall** (`#1a1626`) and **Vault Wall Lit** (`#221d31`): the plate ramp.
  Panels and cards fill top-down from Lit to Wall.
- **Seam** (`#312a45`) and **Seam Lit** (`#3f3758`): the hairline borders. Seam
  outlines a plate; Seam Lit outlines a control.
- **Chalk** (`#ece8f6`): primary text.
- **Ash Violet** (`#9b93b3`): secondary text and the resting state of every
  control label.
- **Ash Violet Low** (`#8a83a3`): captions, placeholders and empty states. It
  measures 4.93:1 on a panel and 5.41:1 on the page ground. Its predecessor
  measured 3.89:1 and carried exactly the text a lost person reads.

### Named Rules

**The Seal Rule.** Seal Gold marks what the person chose: a chip they picked,
the tab they are on, the control they focused, the main action of the panel they
are in. Gold on something nobody selected is wrong. The budget: a gold fill goes
to one primary action per panel, to a choice that narrows the view, and to the
current place. A pressed default (such as «Все» or a chip row with every chip on), a
mode toggle and a selection are neutral: a check and a lit `--muted2` border, no gold, on a
catalog row, a list row and a card of `/lists` alike. A notice that waits, the list
card's «Новое в списке (N)», is a neutral chip: nobody chose it. A die button
is an action and plain: no gold, no check, no lit border. A die's mark in a label is
not a button: it takes its die's color (Tertiary). The unique tag is
neutral, the roll number is Chalk on a seam border, and footer links
are Ash Violet and underlined. The site share cards spend gold on the star
alone. Seal Gold Soft on a link in prose is text, outside the fill budget.

**The Tag Rule.** The five kind hues live on the badge and nowhere else. A stat
line stays secondary text. A row does not take a kind color, and neither does a
card border. The tag is the only place a category becomes a color.

**The Ink Rule.** Text on a gold fill is Ink on Gold (`#1a1206`), never a page
surface color and never white.

## Typography

**UI Font:** Source Sans 3 (`'Source Sans 3 Variable'`, from
`@fontsource-variable/source-sans-3`, upright and italic, with full Cyrillic),
with the system stack behind it (`-apple-system`, `BlinkMacSystemFont`,
`Segoe UI`, Roboto).
The print card uses the UI font too (`var(--ui)`), at its own sizes.
**Numeral Font:** `ui-monospace`, with `SF Mono`, Menlo and Consolas behind it.

**Character:** One neutral workhorse family does everything, and a monospace
face is reserved for values a person types or counts. The pairing has no voice of its own on purpose. The
record names and the artwork carry the setting; the interface type carries the
catalog.

### Hierarchy

- **Headline** (`--t-page`, 680, 23px, -0.01em): the page title. One per route.
- **Section** (`--t-section`, 20px): a section heading, and a record name on a
  full card, where the record is the subject of the page rather than one result
  in a grid.
- **Title** (`--t-title`, 680, 18px, 1.28, -0.01em): a record name on a card.
- **Body** (`--t-body`, 400, 16px, 1.6): the page default, set on `body` and
  inherited by every control through `font: inherit`. Its measure follows The Measure
  Rule.
- **Control** (`--t-control`, 15px): a control label.
- **Body Small** (`--t-small`, 400, 14px, 1.55): record descriptions and
  secondary prose. 1.62 on a full card.
- **Data** (`--t-data`, 13px): a stat line, a meta line, a small control. The
  floor for data text.
- **Label** (`--t-label`, 650, 12px, 0.1em, uppercase): field captions and
  section labels, in Ash Violet Low.
- **Badge** (`--t-badge`, 650, 11.5px, 0.07em, uppercase): every tag.
- **Numeral** (`--t-num`, 650, 19px, monospace): the value in a number field.

### Named Rules

**The Ten Steps Rule.** The scale is exactly 23, 20, 18, 16, 15, 14, 13, 12 and
11.5 px, plus the 19 px numeral: the tokens `--t-page` to `--t-badge` and
`--t-num` in `tokens.css`. A component takes a size from a token, never a
literal. Data text is never below 13 px; only a label and a badge go under it.
`tests/app/typo.js` measures every rendered element on its routes against that
list and fails on a size that is not in it. A new step is a decision, and it
lands in both places or not at all.

**The Capitals Rule.** Capitals are for section labels and badges only, plus
the header's brand line and the account initial, which are marks. A heading, a
button, a control label and a value keep the case the text has.

**The Numerals Rule.** The roll number and the stat line take the UI face's
tabular figures (`font-variant-numeric: tabular-nums`), so the columns line up
without a second face. A value a person types or counts stays monospace: the
value in a number field, a rung in an upgrade chain, a quantity, a price and
damage dice. A number a person reads as prose takes neither.

**The Whole Message Rule.** A heading, a control label, an error line, a status line and
a toast wrap; they are never cut. A name, a description or a list of chosen values may be
cut to its clamp when one press shows it whole: up to 760px a roll page's picker cuts a long
chosen part (the select shows it whole), so the roll button keeps its line and the first
result its first screen; from 761px the button wraps instead. Exceptions: the list name and the
editor's record name, one line up to 760px (owner, 2026-10-29). Source:
https://carbondesignsystem.com/patterns/overflow-content/. `tests/app/typo.js` reads every
heading, button, label, menu item, alert, status and toast of its pages at 1180px.

**The Measure Rule.** Text keeps the measure of its class, named in `tokens.css`, never a
`ch` literal in a component. A line - a page lead, a plate's cause or hint, a sign-in lead,
an error page's sentence, a form hint or error, a warning's lead, a status line, a toast -
is at most `--measure-line` (120ch): one or two sentences take one line while the column
allows it, and a wrap is balanced. A passage - a help panel, a note, a long hint, the
footer's license - is at most `--measure-text` (70ch, about 80 characters a line in both
languages), because its lines are read one after another (WCAG 1.4.8,
https://www.w3.org/WAI/WCAG22/Understanding/visual-presentation.html; GOV.UK,
https://design-system.service.gov.uk/styles/layout/); a passage in a layout column of at
most 80ch, such as the dossier's text and a roll face, takes the column. A box that holds
only a passage is as wide as its text; a box with actions keeps its slot, and its text does
not grow past itself. A row's description has no measure (The Row Text Rule). A menu
item's second line keeps the 28ch of its 320px menu, the one exception. At 360px every
class takes the column. `tests/app/states.js` case 111 measures it.

**The Local Font Rule.** One self-hosted family, from the build's own origin:
the woff2 files of `@fontsource-variable/source-sans-3`, imported in `main.ts`
and preloaded for the Latin and Cyrillic subsets in `app/index.html`. No font
service and no font from another origin, ever; `tests/app/typo.js` fails on a
font request outside `/assets/`. The print card takes the same face, and its
fit runs again once the face has loaded (`FontsPort`); a tab with no cached
face prints in the system stack behind it.

## Layout

One width governs everything: `--wrap: min(1440px, 100% - 32px)`. The header
bar, the job row, the mode row, `main` and the footer all take it, so the brand,
the first mode control (up to 760px) and the first word of the page share a left edge
at every viewport. The 32px
subtraction is the gutter, and `viewport-fit=cover` plus `env(safe-area-inset-*)`
keeps the selection bar clear of a display cutout. The column grows with the
window from 1213px to 1472px, where it reaches 1440px, and stays 1440px and
centered above that. A window up to 1212px draws as it did at 1180px, with two
exceptions: the record page's dossier is at most 980px from a 1013px window, and the
editor's form is at most 720px from about a 1206px window (The One Width Rule). On a
wide window the owner's list page keeps its 330px side column and its rows take the rest
of the column.
320px is the narrowest width a page is built for (WCAG 1.4.10 reflow is defined
at 320); a 280px window scrolls sideways.

The page is a vertical stack: a sticky translucent header (`rgb(14 12 21 / 86%)`
over a 14px backdrop blur) that holds the brand row and the three jobs (63px from
761px, 111px at 360px; up to 760px it leaves on a scroll down and returns on a
scroll up), the mode row on the nine roll pages up to 760px (53px, scrolling with
the page), the content, then the footer. `main`
carries 26px of top padding, 48px of bottom padding, and a 60vh minimum so a
short route does not collapse. `scrollbar-gutter: stable` on `html` reserves the
scrollbar whether a route needs one or not; without it a short page after a long
one shifts the content fifteen pixels sideways.

Content grids auto-fill rather than fix a column count: record tiles at
`minmax(168px, 1fr)`, list cards at `minmax(280px, 1fr)`. Panels carry 18px of
padding with 16px between fields, and the last field in a panel drops its margin
so a one-field panel has no trailing gap.

### Named Rules

**The One Width Rule.** Anything that spans the page takes `var(--wrap)`. A new
full-width element does not invent its own container or its own gutter. From
1472px the column stays 1440px and centered; a reading surface keeps its measure
at the column's left edge: the dossier at most 980px (`--dossier-w`), the
editor's form at most 720px (it bites from about a 1206px window), and the account at
most 1100px; text inside them keeps its class's measure (The Measure Rule).

**The Two Breakpoints Rule.** The system has two, and a third step for the header.
From 761px the brand, the three jobs, the language switch and the account
control share one row, and the page head's pin and «Справка» show their labels;
the sticky header is 63px. Up to 760px the jobs take a second row and the
header is 111px at 360px in both languages (at most 112px). A linked section,
row or card lands `--anchor-gap` (12px) under the header; `--sticky-h`, the
header's measured height, is the page's `scroll-padding-top`, so a focused
control stops clear of it. At 600px every target takes the thumb size (The
Phone-First Rule), row actions take their own line, and a roll card can be the tall face
from 601px (The Roll Page Rule). The catalog adds one step, 1000px: from it the filter
column sits beside the rows; from 761px it draws the wide head (the `h1`, the
group chips, the labeled pin and «Об этих данных», then the tabs) with the filters
in the bottom sheet; below 761px the picker row, the sheet and «··· Ещё»
replace them. The list pages fold each row to the compact row up to 760px and draw the
full row from 761px; from 1000px the owner's list page draws its 330px side column at the
right of the rows (the side content sits above them from 761px to 999px), and the rows
column is a size container: under 760px of it a row's controls take a line under its
text. The print page draws one card per row, at most 420px wide, with a bottom dock up to
760px, and the A4 sheet from 761px. A container step is a component rule, not a system breakpoint. The `viewport` port (`app/src/ports/viewport.ts`) is the one place
that reads the width in code; CSS reads the same two numbers. Every other media
query in the code belongs to one component and its own measured problem. Do
not add another system breakpoint. `/account` signed in uses the 1000px step too:
one column below it, two from it, in the DOM order of the one column.

**The Roll Page Rule.** The nine roll pages share one layout. Up to 760px: a read-only
`h1`, the controls, one results line («Бросок N», «Настроить», «Ещё»); the pin, the
help and the copy of every option are items of «Ещё». From 761px: the head (The Head
Order Rule) with the `h1` «Бросок», the three mode pills and the labeled pin and help, a
320px control pane, the results. The `h1` names the job at every width; the lit pill and
the tab title name the mode. The roller has one gold
primary at most, and a die is plain. A result is the tall face only while the roll
sits on one line in a results column of at least 641px; otherwise the row face, so a
four-result roll shows every name in the first screen at 1180x720.

**The Search Head Rule.** `/search` takes the list head of the catalog with one
difference: up to 760px no picker fills the head row, so the `h1` «Поиск» stays
visible with «Ещё» (the pin, its one item) on its row. The search row follows on one
line: the box, «Фильтры», «Выбрать» last. From 761px the page head with the lead and
the labeled pin, then the search row and a row of kind chips that ends in the count
line, so a picked kind adds no line above the first result.

**The Dossier Rule.** A record page and the record dialog are one dossier: the
picture beside the text from 761px and 4:3 above it below, no plate on a page. The
name is drawn once. The dialog is a bottom sheet with a sticky dock up to 760px, not
sticky in a window shorter than 481px, where two rows would take almost half of the
height: a component rule, not a breakpoint. «В список», «Поделиться», «Печать» and
«Ещё» are the same four labeled controls on every record surface at every width;
«Изменить» joins for the author. One exception: a roll result holds three controls, no
«Печать», and a plain «В список», because the page's gold primary is the roll. The
copies and «Сохранить себе» live in «Ещё», a `Menu` that opens down on a page and, in
the dialog, up where the room is only above, so from the dock. «В список» is the one
gold primary; an open «Ещё» is not drawn pressed, because gold marks a choice. A label
never gives way to an icon (The Same Label Rule).

**The Head Order Rule.** A page head draws, in this order in the DOM and on the screen:
the heading, the pills of the sibling pages where the page has siblings, the pin, the
help, and the page's primary action at the right end. A page with no siblings has no
pills slot, so its pin follows its heading. From 1000px the head is one row, and where the
row is short the pills wrap inside their own box (the catalog's chips in Russian up to
about 1139px); from 761px to 999px the pills take the next row, under the heading, the
pin, the help and the primary, so the DOM order is the reading order in each band. A
third level (a table group's books, the homebrew sources) is underlined tabs under the
head. Up to 760px a page with siblings reads its heading, not draws it, and the mode row
or the picker row names the page. The head's geometry follows the band only, never the content: the heading
is constant, so a switch between siblings moves no pill, a row that some contents lack
keeps its reserved space, late content (a picture, a count) reserves its box, and the
catalog's tab row keeps the height of the tallest group's tabs on every table; the
homebrew sources are not reserved, because they hold the GM's own text (up to 12 names of
80 characters), so `/tables/homebrew` may draw a taller row. From 1000px to 1139px in
Russian the chips and the reserved tab row take two lines each (the rows start at 288px
at 1000x720 and 287.5px at 1050x720). The lit pill takes the gold fill of the current
place and no check (The Check Rule). Owner, 2026-11-05.

**The Hidden Header Rule.** Up to 760px the whole header leaves on a scroll down
and returns on a scroll up, on every page, because a phone reader needs the rows
more than the jobs. It slides in 0.2s, or appears at once under reduced motion. It
is shown at the top of a page, on a short page and after a navigation; a menu, a
sheet, a dialog, a text field or a drag freezes it; a keyboard focus inside brings it back.
It never leaves the tab order.

**The Same Label Rule.** A label does not change with the width, and a control
is never only an icon where its label fits: the three jobs keep their labels at
360px, the signed-out account control keeps «Войти» / "Sign in" at every width,
and the pin and the help are labeled buttons («Открывать при запуске» /
"Open on start", «Справка» / "Help"; the catalog's help is named for its
panel, «Об этих данных» / "About this data"). Up to 760px the pin and the help
are items of «Ещё» on the catalog, the roller, `/homebrew`, `/search` and
`/lists`. The account page draws neither.

**The First-Screen Rule.** At 360x640 and at 1180x720, in Russian and in
English, at scroll 0, the primary content of a route starts no lower than 40%
of the viewport height (256px at 640, 288px at 720); the header counts as a
control above it. Named exceptions: `/roll/std` at 360x640 starts at 325px, for
the rarities on the dice (owner, 2026-10-29); `/s/<token>` at 360x640 with its search
row starts at 309px (owner, 2026-11-03, 286px; the built page measured 301px on 2026-11-05
and 308.2px on 2026-11-06, when «Сохранить себе» took the thumb size, and the exception took
it while the owner was away); `/s/<token>` with a 120-character list
name at 1180x720 starts at 312px, because from 761px the name takes three lines (measured
2026-11-05); and an account list's page with its folded requests strip (a 6px inset up to
760px) and its search row at 360x640 starts at 304px (measured 2026-11-05 while the owner was
away; the owner's figure was 292px). From 761px to 999px the rule is checked at 768x1024
and 900x720 too, with one more exception: `/tables/*` in a 720px window starts at 334px,
the reserved tab row of The Head Order Rule, held to 336px (measured 2026-11-05 and
2026-11-06; owner, 2026-11-05). A design aims at 240px and 270px, so a small face or
line-box difference does not fail the rule. The primary content is the first
roll result on a roll page, the table on `/tables/*`, the item on `/i/` and
`/h/`, the first result on `/search`, the first settings panel on `/account`,
the sheet on `/p/`, the first group head on `/homebrew`, the first card row on
its Sets and Rules tabs, the form in the editor, the first list card on
`/lists`, and the first entry on
`/lists/<uuid>` and `/s/<token>`. Each page marks that element with
`data-primary`, and `tests/app/states.js` ("primary content starts in the
first screen") measures it.

**The Phone-First Rule.** Players use a phone at the table about 80% of the
time; GMs use a laptop about 80% of the time (`PRODUCT.md`, "Users"). The
player surfaces (the shared list, the list page, the item, search, `/lists`)
are designed at 360x640 first, then widened. The GM surfaces (the roller, the
tables, homebrew, print) keep both widths and still pass the First-Screen Rule
on a phone. Every mock and every review checks 360x640 first. Up to 600px every
control a person presses is a thumb target of at least 40x40px (`--thumb`), the size of
the mode row and the dice; a menu item and a row are 44px. A control with a box grows its
box; a text link grows its padded box and keeps its line. From 601px the small button is
32px. At every width a target is at least 24x24px or keeps the WCAG 2.5.8 spacing; a link
inside a sentence is the one exception, and a craft or relation line's link counts as one.
From 601px a text control (a bare button, a footer link, the license summary) takes a
24px padded box and gives the growth back, so no line moves. The fold «и ещё N» of a
relation line is the exception: from 601px it keeps the line's height, as the line's links
do, because a 24px box there comes closer than 2px to a badge on the line above ("Badges").
Owner, 2026-11-05; sources: Android adaptive app quality, Tier 2 (Touch_Targets), and
Apple's Human Interface Guidelines, Accessibility. `tests/app/sweep.js` and
`tests/app/states.js` case 109 hit-test it.

## Elevation & Depth

Depth is tonal first. Four surface steps (Vault Ink, Vault Ink Deep, Vault Wall,
Vault Wall Lit) and a one-pixel seam do the work, so a plate is read by its
lighter fill and its border rather than by a shadow. Every panel and every card
fills with the same top-down gradient, `linear-gradient(180deg, var(--surface2),
var(--surface))`, which reads as light from above without simulating a source.

There is exactly one shadow token. It lifts panels and cards off the page ground,
and nothing else uses it. Two elements carry their own shadow because they are
not plates: the toast, which floats in the top layer, and the print sheet, which
is paper on a desk. Hover never lifts anything. Hover moves a border to gold.

### Shadow Vocabulary

- **Plate** (`box-shadow: 0 10px 34px -14px rgb(0 0 0 / 85%)`): panels and
  cards, at rest.
- **Float** (`box-shadow: 0 12px 30px -10px rgb(0 0 0 / 70%)`): the toast only.
- **Paper** (`box-shadow: 0 0 0 1px rgb(0 0 0 / 50%), 0 14px 40px rgb(0 0 0 / 45%)`):
  the A4 sheet on screen, removed under print media.

### Named Rules

**The One Shadow Rule.** New work uses the Plate shadow or no shadow. A second
elevation step is a change to the system, not a component decision.

## Shapes

Rectangles with gently rounded corners, at five radii and no more: 14px for a
plate (panel, card, modal), 9px for a full-size control (button, search box,
number field, focus ring), 8px for a compact control (small button,
icon button), 6px for a tag, and 999px for anything that is one choice in a row
(a chip, a segment, the toast).

Borders are one pixel and a seam color, except where a border states something:
a gold-tinted border marks a filter that has a value, and a border at about 45 per
cent alpha echoes its own tag's hue. A border is solid (The Drop Rule).

A ticked row or tile is lit and neutral: the Vault Wall Lit ground, the
`--muted2` border and the checked box. Never gold, never a one-side stripe (The
Seal Rule: nobody chose a value there, the reader picked a row).

Artwork is square, except the record page and the dialog up to 760px and the roll
card face from 601px, which crop it to 4:3. A record image is `aspect-ratio: 1` with `object-fit: cover`:
132px beside a compact card, full width and up to 420px on a plate card, 60px in
a table row, always over the art well (`--art-well`, `#0a0810`) so a
transparent PNG keeps a ground.

### Named Rules

**The Pill Rule.** A pill means "one of these, choosable". A rounded rectangle
means "a thing". Do not round a card to a pill or square a chip.

**The Drop Rule.** A dashed border means "drop here": it marks a place that takes a
dragged thing, and nothing else is dashed. The app has no such place: the list's drop
mark is a 2px gold line, so the screen draws no dashed border. The print card's 0.4mm
cut border is a cut line on paper, the one exception. `tests/derived.js` ("Dashed means
drop") enforces it. Owner, 2026-11-05; sources: the Scottish Government Design System's
file upload (https://designsystem.gov.scot/components/file-upload) and IBM Carbon's file
uploader (https://v10.carbondesignsystem.com/components/file-uploader/usage/).

## Components

### Buttons

- **Shape:** 9px radius at full size (46px tall, 0 18px padding); 8px radius at
  small size (32px tall from 601px and 40px up to 600px, 0 11px padding, 13px text).
- **Plain:** Vault Wall fill, Seam Lit border, Chalk label at 15px weight 600.
  The default.
- **Primary:** a top-down gold gradient (`#e2b76c` to Seal Gold), an `#e8c27c`
  border, Ink on Gold label at weight 700. One per panel.
- **Hover:** border to Seal Gold and fill to Vault Wall Lit. The primary variant
  brightens by 7 per cent instead. No transform, ever.
- **Pressed and open:** `.on` gives a plain button a gold border and a gold
  label; a primary button darkens to `#c99b52`/`#b8873f` and takes an inset
  shadow. That is the one pushed-in state in the system.
- **Toggle:** gold label on a 45 per cent gold border with no fill. This is the
  filter button once a filter holds a value.
- **Ghost and Danger:** a transparent fill beside a primary action; an Alarm Red
  border with Alarm Red Text for a destructive one, the outlined default.
- **Danger fill (`danger-fill`):** the one irreversible press of a confirm: an
  Alarm Red fill and border with an Ink on Gold label (the error toast's pair,
  about 5.6:1). Its one caller is the account delete's «Удалить навсегда».
- **Icons:** every icon inside a button renders at 15px whatever its own
  attributes say. Dice are the single exception and keep their own silhouette,
  because squaring them makes a d4 look heavier than a d20.
- **Icon and label:** an icon and its label share one center: the control is
  `inline-flex` with `align-items: center`, the icon sits in one square box,
  and one gap separates the two. The icon's center is within 1px of the center
  of the label's first line box (`tests/app/typo.js` measures the pressed switches
  and chips at 360 and 1180).

### Chips

- **Style:** pill, Vault Wall fill, Seam Lit border, Ash Violet label at 13px
  weight 540; 40px tall and at least 40px wide up to 600px, the label centered.
- **Chosen:** Seal Gold fill, Ink on Gold label at weight 650, for a choice
  that narrows the view, with the `check` icon before the label (The Check Rule).
- **Pressed default:** a chip that stands for no narrowing («Все») takes the
  neutral pressed state of the segmented control below, not gold (The Seal
  Rule).
- **Dice:** plain buttons, none gold and none lit, because a die is an action:
  two lines in a 3 + 2 grid up to 760px, a list of 46px rows from 761px.
- **A row with every chip on:** each chip takes the neutral pressed state; a row
  narrowed draws the chips left on in gold.
- **A filter row:** «Все» neutral pressed, then the values; a press from «Все»
  picks one value, the last pick off returns to «Все». This is the model of every
  filter row, the catalog's and search's three kinds included.
- **Hover:** border to Seal Gold, label to Chalk.
- **Semantics:** a chip that navigates is an anchor carrying `aria-current`; a
  chip that toggles is a button carrying `aria-pressed`. Middle-click keeps
  working on the navigating kind.
- **Sibling pills:** the roll modes, the catalog's groups and the four homebrew tabs
  (with their counts, tabular, in `--muted2`) are link chips in the page head (The Head
  Order Rule); the lit one takes the Seal Gold fill of the current place and draws no
  check. Up to 600px the roll's three share the mode row, 40px tall, and a long name
  takes two lines.
- **Neutral pressed (`Chip neutral`):** the `check` icon before the label, the
  Vault Wall Lit fill, a Chalk label at weight 600 and a lit `--muted2`
  border, the icon and the label on one center. A filter row's «Все» is its
  caller; a picked value chip stays gold.
- **Two-level navigation:** the catalog's group chips in the head row, then the book
  or section of the group as underlined tabs under the head: Ash Violet text, the current tab
  gold text on a 2px gold underline. Each level is a group named for
  assistive technology («Группа», the group's name, «Источник»).

### Segmented control

- **Style:** a pill track (Vault Wall, Seam border, 3px padding) holding pill
  buttons at 13px weight 650 with 0.05em tracking.
- **Chosen:** Seal Gold fill, Ink on Gold label, for a choice that narrows the
  view, with the `check` icon before the label (The Check Rule).
- **Neutral pressed:** a mode toggle (the language switch, the tables list or
  grid switch, the print color or black-and-white switch) passes `neutral`:
  the pressed button takes the `check` icon before its label, a Vault Wall Lit
  fill, a Chalk label and a lit `--muted2` border, and no gold. It is the picker
  of a form field too (the homebrew editor, the import's «Если уже есть:», every
  picker of the account's Display section); gold stays for a choice that narrows a
  view.
- Every button carries `aria-pressed`, including the ones whose original did
  not.

### Cards

- **Corner:** 14px, with `overflow: clip` so a programmatic scroll cannot move
  the contents.
- **Background:** the plate gradient, a Seam border, the Plate shadow.
- **Padding:** 13px 15px 14px, with 8px between rows of content.
- **Layout:** `full` stacks the image above the body, or, as a dossier, sets it
  beside the text (The Dossier Rule); `compact` puts a 132px square image beside it, and
  no page draws it since the list page's roll result took `face`; `face` is a roll
  result: the picture 4:3 with a fade, the body drawn over its foot, and the row face,
  96px beside the text, wherever the roll does not sit on one line (The Roll Page
  Rule). Its action row sits under the plate, because a popover cannot leave a
  clipped plate.
- **Relation lines:** «Получается из», «Улучшается до», the set line and its bonus,
  and the tier ladder draw on the full record card only (`full`: the record page,
  `/h/`, the dialog, the editor preview); `face`, `compact`, rows and tiles draw
  none. A homebrew name draws the plain bordered badge «Хоумбрю» after it on the same
  line; a catalog name draws none.
- **Grid tile:** two columns up to 600px; the art, the name and a second line
  (the stat line, else the other-language name). A table of more than one
  kind labels the tile with its kind badge where the colored dot used to be;
  hue lives on a labeled badge (The Tag Rule).
- **Art well:** every screen picture (card, row, table tile, list cover, editor
  thumbnail) sits in `ArtWell`: the `--art-well` square with the glyph of the
  record's kind at 42% of the well in Seam Lit, hidden from assistive
  technology. Armor is a shield, a weapon is crossed swords, a consumable is a
  flask, and any other item is a gem (`kindGlyph`). A record with no picture,
  or a broken one, shows the glyph alone; a picture that loads covers it. No
  surface draws a placeholder picture; the color print card draws the glyph
  on a light well (`#ebe7f0`, glyph `#3a3350`).
- **Entrance:** a 0.28s `pop` (10px up, 0.985 to 1) on
  `cubic-bezier(0.2, 0.8, 0.3, 1)`, cancelled under reduced motion.
- **List card:** the lists index's card is the plate with the name, the meta line, up
  to six thumbs and the neutral «Новое в списке (N)» chip inside its link, and its
  actions in a labeled «Ещё: <name>», text alone in the card's top right corner (the name
  keeps clear of it); in the selection mode a pick box takes that corner. No `overflow` clip: the menu opens past the card.
- **Image review:** the page under `tools/artwork/review/` draws this card
  head from the same CSS and label code. A change to it follows
  `docs/artwork.md`, "The card follows the site's card".

### Badges

- **Style:** uppercase 11.5px at weight 650 with 0.07em tracking, 6px radius, on
  a 50 per cent black ground inside a hairline border.
- **Variants:** the five kind hues, plus tier, source, roll number (the UI
  face's tabular figures, Chalk on a Seam Lit border), unique (Ash Violet on Seam
  Lit, like the tier tag; its word says it is a property), and the Hope and Fear pair. Neither the roll number nor
  the unique tag is gold: nobody chose them (The Seal Rule). An own item written
  in the other language than the interface draws a small language tag («EN», «RU»)
  after its row's tags: a hairline box, no fill, no capitals rule. On a roll card face the
  roll number is drawn over the picture of the tall face and hidden on the row face,
  where the results line names the roll.
- **One box:** a badge is an inline block: it never splits across lines, a long label
  wraps inside its border, and in running text it keeps 2px from the lines around it.
- **The default book:** «Core» draws on the full record card only; every other source
  keeps its tag.

### Inputs

- **Search:** full width, 46px tall, a Vault Ink Deep well, a Seam Lit border,
  9px radius.
- **Number field:** a 46px row holding a monospace input at 19px weight 650
  between two 40px steppers; a lone field fills its column up to 480px (The Stepper
  Rule).
- **Focus:** border to Seal Gold plus a 3px gold glow at 14 per cent. On the
  duality fields the glow takes that die's own color instead.

### Navigation

- **Jobs:** three real links, «Бросок» / "Roll", «Таблицы» / "Tables" and
  «Поиск» / "Search", each with its icon before the label (the die, the table,
  the magnifier), at 14px weight 560 in Ash Violet with a 2px transparent bottom
  border. The lit job turns that border gold and the label Seal Gold Soft.
  «Бросок» stands for the nine roll pages and opens the last one of the tab.
- **Mode row:** up to 760px, under the sticky header on the nine roll pages only,
  scrolling with the page; from 761px the same three controls are the page head's pills
  after «Бросок»: «Обычные правила», «Альтернативные таблицы» and the menu button
  «Дополнения ▾», which shows the open supplement's name. The controls compose
  the chip's tokens; the lit one takes the Seal Gold fill of the current place.
  The menu under the button lists the seven supplements, 44px items, the open
  one with a check; no sheet and no grab handle.
- **Header:** sticky, translucent, blurred, with a one-pixel seam under it; 63px
  from 761px, 111px at 360px.
- **Brand:** the vault die - a d12 decagon in Seal Gold with a Seal Gold Soft
  face and a keyhole cut through it, with a 35 per cent gold drop shadow -
  beside a two-line wordmark: «Лут» in Russian, «Loot» in English, over
  «DAGGERHEART». The wordmark follows the language in the header only; the tab
  title and the manifest keep their names. The same mark is the favicon, the
  app icon and the share cards' mark (`docs/artwork.md`, "Icons").
- **Account control:** 8px after the language switch, on the switch's own
  track - a person glyph and «Войти» signed out, a gold-soft initial in a
  circle with a chevron signed in, with the gold ring on the account pages
  (the account, the lists and «Мои предметы»), where no job is lit, and while
  its menu is open.

- **List head:** `/homebrew` draws the catalog's: up to 760px the picker row with
  the `h1` read, not drawn; from 761px the head with the four tabs as pills with their
  counts, the pin and the primary.

### Filter chips and the count line

- **Catalog:** the filters are a 250px column beside the rows from 1000px,
  sticky under the header and scrolling inside itself, and a bottom sheet
  below it. Each row is «Все» (the neutral pressed default) and the value
  chips; a picked value is gold. No pill row at 360px or in the mid band: the
  count line under the search row names the chosen values in text, cut to one
  line, and the count, never cut.
- **Own items:** `/homebrew` draws the catalog's column and sheet and no pill row
  at any width.
- **List pages:** both list pages draw the filter as the sheet at every width
  (`ListFind`), and the count on the page's meta line («Показано 3 из 14»), not
  on a line of its own. No pill row draws anywhere.

### Bottom sheet

- `Sheet`: a native `<dialog>` opened with `showModal()`, attached to the
  bottom, `min(100%, 560px)` wide and centered, top corners at the plate
  radius, at most `min(85dvh, 640px)` tall. Its head (the title, the caller's
  controls, «Закрыть» with the close icon) and its foot stay; the body
  scrolls. No grab handle: nothing drags it. Its callers: the filter sheet (the
  catalog below 1000px, both list pages at every width), the table and tab
  pickers, the bulk move, the list page's «Цены выбранных» and the editor's
  preview.
- The record dialog has the sheet's look up to 760px and is not a `Sheet`: one
  element at every width, so a window that crosses 760px remounts nothing. «Ещё» is
  a `Menu` at every width, in the dialog too. Both close with `DialogClose`.

### Selection bar

- `SelectionBar`: one shape on every list page, pinned to the bottom of the
  screen, a Vault Wall ground under a `--muted2` top border and a blur; no
  gold. «Все» is a tri-state box with its label always visible, then the
  polite summary («Выбрано: N»), the page's actions and «Снять выделение»
  last. Below 761px the box, the summary and the clear are one row and the
  actions the next. Zero ticks: the actions off, the clear on. The owner's list
  page draws its own bar in the same place (`app.pageBar`); up to 760px its rare
  actions fold into «Ещё», which opens up; the lists index draws its bar the same way.
  The add-to-list menu is a popover at every width, headed «Списки», a neutral row
  per list with a check where it holds the record and its count in words. A panel a bar action opens is a
  `Sheet`, because the bar is sticky and a panel under it would grow past the
  window.

### Compact row

- Up to 760px a list entry is one press target of about 77px: the 44px picture
  with the true list number on a plate at its foot, the name at 15px weight 600
  on up to two lines, the meta line at 13px (the kind badge, the price or another
  book's tag, the note and GM-only marks), one 13px line cut with an ellipsis, and
  a 20px chevron. The whole body is one `<button aria-expanded>`; a press unfolds
  the full row under it.
- The quantity is a target apart from the button: a 42x44px field on the
  owner's page, the text «×2» on `/s/`, laid on the body's reserved last column.
  No remove control on the folded row: removing is in the unfolded row's «Ещё».
- The rows are flat: one divider under each, no box, no fill. A GM-only entry
  keeps its box on the Vault Wall ground; a ticked row keeps its lit ground. The unfolded part has
  no fill, so the drop mark shows over it.

### Forms

- A field is `FormField`: its caption, the control, its error line. An optional
  field carries the muted word «необязательно» after the caption, outside the
  `<label>`; a required field carries no mark, and no legend explains marks.
- A field's error is its own sentence that names the fix. The summary at the top
  of a form names the field first.
- A field has no «?» unless it states a constraint of the site and has no room
  for a caption (`FEATURES.md`, rule 15). A caption under a field states a fact
  the person must know before typing, at the data size in Ash Violet.
- The editor's sticky bar: up to 760px the buttons of a long form stick to the
  bottom of the window on the Vault Wall ground under a Seam top border, with
  the safe-area padding; a window under 481px leaves them in the flow. It holds
  one gold button. A menu may hold a single danger action where the bar has no
  room: a danger button in a sticky bar invites a mis-tap.
- The preview sheet: up to 760px the live card moves from the column into a
  `Sheet`. The card draws in one place per band, never twice.

### Empty state

- `Empty`: a plate with a Seam border (`--line`) on the Vault Wall ground (`--bg2`),
  `--gap-plate` (16px) under the block above it on every page - twice a chip row's gap, so
  it reads as the next block. Beside the filter column the column and the plate share that
  top. The catalog adds the kind glyph in its art well (the only picture), the heading
  «Ничего не найдено», one cause sentence and a primary reset while a filter is chosen.
- A search's start state: the glyph, a title («Что ищем?»), one sentence and example
  queries as chips; the syntax lives in the examples, not in an instruction.
- A search's nothing-found state: the cause (the query, the picked kinds or both) and
  one reset («Сбросить фильтры» or «Очистить поиск»). A plate holds one primary at most.

### Error page

- `ErrorPage`: the cause as the page's `h1`, one sentence that names the address or
  the way out, the actions with the primary first. No icon and no plate: the heading
  already says what happened.
- It covers every page-level failure: an unknown address of this build
  (`NoPage`), a missing record (`NoItem`), a retired print link, a failed print set
  read (primary «Повторить»), the editor's missing item and a page that threw. The
  page's name stays in the tab title.

### Toast

- **Style:** a fixed plate 26px off the bottom, centered, and 26px above the selection
  bar while the bar shows: Vault Wall fill, a
  1px Ash Violet Low (`--muted2`) border, Chalk text, `--r` corners and the
  Float shadow, entering on a 0.2s rise. No toast is gold. The error flavor is
  the Alarm Red fill with Ink on Gold text (about 5.6:1). The action flavor
  holds a Vault Wall Lit button with a Seam Lit border, 40px tall up to 600px.
- **Width:** as wide as its text, at most the line measure (The Measure Rule) and the
  window less 16px a side; a long
  name wraps inside it, so it stays a few lines high at 360px.
- **Time:** The Reading Time Rule.
- It is a `popover="manual"` element so it survives the inertness of a native
  `<dialog>`, and it is `display: none !important` under print.

### Signature component: the print card

The second world. A print card is 63x88 mm of white paper inside a 0.4mm dashed
`#c9c4d2` cut border, nine to an A4 sheet in a 3x3 grid with 2mm gutters and
14.5mm by 8.5mm sheet margins. Inside, the card is a container-query system:
every dimension is written in `cqw`, so the composition scales with the card
rather than with the viewport. The artwork fills a square region at the top,
masked to fade at both edges, over a blurred and darkened copy of itself. A
color card with no picture draws the kind glyph in dark ink on a light well,
where Figma node `714-42387` leaves blank paper. The
tier plate and the burden mark sit at fixed `cqw` offsets; the burden mark draws
the node's hands with fingers. The card is set in Source Sans 3: the rules text
starts at 4.0cqw (7.1 pt) on the standard card and 4.6cqw (5.7 pt) on the compact
card, and stops at 2.6cqw and 3.7cqw (4.5 pt on the compact card). A list item
prints an en dash. The bottom line holds the source alone, right-aligned in the
whole width. When the picture gives way to a long text, the text moves up to just
under the marks drawn over the art, and no mark covers a tag or the name: text
still cut at its floor there goes under the floor, a named shortfall (two RU
compact cards at 3.4cqw, 4.2 pt; `FEATURES.md`, "Print"). Text is fitted by
measuring the rendered box, which is why reduced motion sets transition duration
to `0s` rather than removing transitions: a zero duration still applies the end
state on the same frame, and the fitting routine reads layout back immediately.
In black and white the rules text also grows into the space the picture would
have taken, to a cap under the name's size. An opt-in compact sheet lays
sixteen cards at 44x63 mm in a 4x4 grid with the same 2 mm gutters and 19.5 by
14 mm margins, in either layout; the card is the same composition at 70%,
apart from its rules text, which starts and stops at its own sizes.
Small text has a paper floor under its `cqw` size, `max(<design>cqw, 4.5pt)`
for labels and the tier word and 5pt for values and numbers, so a field over the
floor keeps its Figma size. The weights step down from 900 (the name and the tier number)
through 700 for numbers and 600 for strip values to 500 for labels. The
damage strip's cells sit between the ribbon's own dividers and ornament
lines, so the ribbon frames every label and value instead of crossing it.
Labels print in tracked capitals and values as the data writes them, so case
tells the two apart. Each threshold arrow grows from its box's right notch:
a dark arrow in a gold rim that continues the frame in color, a solid black
arrow in black and white.

Color and black-and-white are two distinct layouts, not one layout with the
color removed. The vectors the two layouts share in shape (the tier banner, the
threshold box, the ribbons, the dice) are drawn inline from the exported files'
paths and take each layout's paints from `card-vectors.css`; the editor's
preview draws the card larger by multiplying its `mm` and `pt` values, never by
a transform.

### Named Rules

**The Row Text Rule.** A row's text takes the free width of its row: a description is cut
only when it is longer than its clamp, never while width remains. The cap of 70ch went
because a 1440px `/search` row was 54% empty (measured 2026-11-05). It is the row class of
The Measure Rule: a clamped snippet with no measure. The clamp is three lines up to
600px and from 1000px, and two lines between; a cut always has one press to the whole,
the record. From 1000px the description's line height is 1.55, so a long second line has
room for the eye's return. Rows stay one column at every width, and the layouts from 360px
to 760px do not change. A row with a short description stays partly empty: tabular stat
columns are a proposed rule (The Stat Columns Rule). Owner, 2026-11-05.
`tests/app/states.js` case 106 measures it.

**The Field Measure Rule.** A search box is at most 720px from 761px, and the controls of
its row follow it on the same line; up to 760px it takes the row's free width. Source:
Android adaptive app quality, Tier 2, UI_Secondary_Elements
(https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2).

**The Stepper Rule.** A lone number field fills its column up to 480px: «-» at its left
edge, «+» at its right edge, the value centered between them, 46px tall; a button at its
limit is disabled, and the value stays a text field. A field in a row with its button
keeps its content width. Owner, 2026-11-05. Source:
https://playbook.ebay.com/design-system/components/numeric-stepper.

**The Check Rule.** Every pressed chip and segment draws the check before its label, a
gold pick and a neutral default alike: gold says "this narrows the view", the check says
"this is on". A state never rests on color alone. A link chip marks a place and draws
none: the sibling pills of a page head, the tabs and the table chips show the current
place by their fill or their underline and by `aria-current`, and a navigation does not
look like a toggle. Sources: https://developer.android.com/develop/ui/compose/components/chip,
https://developer.apple.com/design/human-interface-guidelines/accessibility.

**The Reading Time Rule.** A toast stays long enough to read twice: 4000ms for a notice,
7000ms for an error or a toast with an action, 10000ms for one that carries an email
address or more than 80 characters, in either language. Every toast holds while a pointer,
a finger or the focus is on it, and runs on with the time it had left. A notice said while
an error or an action toast shows waits for it; the new-request toast waits behind every
other one. A retry press closes the error it answers, so its result never waits behind
the old failure (the Clarity Rule). The toast floats above the selection bar. Owner, 2026-11-05; sources: Flutter's
`SnackBar.duration` (https://api.flutter.dev/flutter/material/SnackBar/duration.html) and
Apple's Human Interface Guidelines, Accessibility. `tests/app/states.js` case 108 measures
it.

## Do's and Don'ts

### Do:

- **Do** spend Seal Gold only on the chosen thing: a picked chip, the current
  tab, a focused control, the main action of a panel.
- **Do** take a text size from the ten type tokens, and add a new step to
  `tokens.css` and `tests/app/typo.js` in the same change when one is truly
  needed.
- **Do** build depth from the four surface steps and the one-pixel seam, and
  reach for the Plate shadow when a plate has to lift.
- **Do** set a roll number and a stat line in the UI face's tabular figures,
  and a value a person types or counts in the monospace face.
- **Do** keep the five kind hues on badges alone.
- **Do** span the page with `var(--wrap)` and nothing else.
- **Do** let the global `:focus-visible` ring reach the control. Override
  `outline-offset` alone, and only where clipping proves it necessary.
- **Do** grow touch targets at 600px rather than shipping a pointer-sized target
  to a phone.

### Don't:

- **Don't** drift toward a neon dark mode: no saturated purple or cyan glow, no
  gradient text, no colored drop shadow. The ground is violet, which makes this
  a short slide, and the palette's restraint is what keeps 1459 records legible.
- **Don't** drift toward a SaaS dashboard: no generic blue accent, no oversized
  rounded cards, no illustrated empty states (the only picture an empty state
  draws is the kind glyph in its art well), no marketing gradient. The density
  these tables need is the opposite of that language.
- **Don't** add a second shadow step, a third system breakpoint, or a sixth
  radius.
- **Don't** move a control on hover. Hover changes color and border, never
  position or scale.
- **Don't** link a font service or load a font from another origin. The one
  UI face comes from the build's own `/assets/`.
- **Don't** put a kind color on a row, a card border, or body text.
- **Don't** translate a book name: «Core» and «Hope & Fear» stay Latin in
  Russian, on chips, tabs and tags.
- **Don't** set white text on a gold fill. Ink on Gold is the only text color
  there.

## Proposed rules

These candidates come from official design guidance (owner, 2026-11-05). None is a rule yet: each needs the
owner's yes, its code and its check in the batch that builds it. A reviewer may cite one as a finding with its
source.

| Rule | Source | Draft | Check | Built by |
|---|---|---|---|---|
| The Escape Rule | https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2 (Keyboard_Exit) | Escape undoes the last layer a person opened: it closes a menu, a sheet or a dialog, clears a search box that holds text, and in a selection with no layer open clears the ticks. The focus stays on its control, or goes to `main` when that control leaves. | `tests/app/states.js` on `/tables/core_item`, `/search`, `/lists` and `/lists/<uuid>` at 360 and 1180px: two ticks, Escape, «Выбрано: 0» and the focus kept; with the filter sheet open the first Escape closes only the sheet | a later task, with its mock; home `FEATURES.md` "Chrome" |
| The Tablet Screen | https://developer.android.com/docs/quality-guidelines/adaptive-app-quality/tier-2 (test devices) | The First-Screen Rule adds 1024x640, Russian and English, as a third viewport: logged first, then asserted route by route at 256px. | `FIRST_SCREEN` gains the viewport with logged rows; each route past 256px is named to the owner | a later task |
| The Detail Pane | https://developer.android.com/develop/ui/compose/layouts/adaptive/canonical-layouts (list-detail) | From a 1600px window a picked row on `/tables/*` and `/search` may open its dossier in a pane beside the rows, at the dialog's address; below 1600px the dialog stays. A direction, not a rule of task 57. | a states case at 1600 and 1920px: the `h1` in the pane, `aria-current` on the row, Escape and Back close it, print prints the sheet only | a later task, with its mock |
| The Error Line | https://developer.apple.com/design/human-interface-guidelines/accessibility ("Minimize use of time-boxed interface elements") | An error that a person must act on is also a line on the page, not a toast alone. | an audit of the error toasts of `FEATURES.md` rule 2, each with its page line | a later task |
| Window size classes | https://developer.android.com/develop/ui/compose/layouts/adaptive/window-size-classes | Not proposed: the project's 600, 760 and 1000px steps follow the same principle; only the 1600px class is of use, as the Detail Pane's threshold. | - | - |
| A step of ten | https://developer.apple.com/design/human-interface-guidelines/steppers | Not proposed: a Shift-press step of ten is a shortcut with no label (The Clarity Rule). | - | - |
| A 24px gutter | https://primer.style/product/getting-started/foundations/layout/ | Not proposed: from 1280px a 24px gutter would move every number of the 1440px column for 8px a side. | - | - |
| The Stat Columns Rule | https://m2.material.io/components/data-tables (numerical data is right-aligned; the page was not re-fetched when this row was written) | From 1440px a weapon or armor row on `/tables/eq_*` draws trait, range, damage and burden in tabular columns right of its text, right-aligned with tabular figures and labeled in both languages, in place of the stat sentence; the description keeps the free width left of them. Rows stay one column. Below 1440px, on `/search`, on the list page and on `/s/` the stat sentence stays. The values come from the source book data (`CLAUDE.md`, "Product laws"). Owner, 2026-11-05: "plan stat columns later". | a states case at 1440 and 1920px on `#/tables/eq_weapon` and `eq_armor`: the column edges equal within 1px in every row, the labels exist in RU and EN, and case 106's clamp share does not rise | a task after wave 3, with its own mock (recommended; not batch 10, a docs-only lock) |
