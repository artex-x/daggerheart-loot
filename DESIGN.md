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
  filter-pill:
    backgroundColor: "rgb(216 171 94 / 12%)"
    textColor: "{colors.seal-gold-soft}"
    rounded: "{rounded.control}"
    padding: "0 8px 0 11px"
    height: "32px"
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
file arrives. The print card is the exception: it keeps the local stack it was
fitted with (`--print-ui`) until the print batch decides its face, because a
face change moves every print measurement.

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
  bar's select-all, the "or" divider, alternate-table column heads, list
  summary labels, the help button, the record steps label); their surfaces
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
  label, a filter pill's label. It exists because a gold fill
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
  dice. They color the badge and the focus glow of the die they belong to, on
  the alternate tables only. This is the one place where a color other than
  Seal Gold reaches a focus treatment, because the glow says which die the
  person is changing.
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
current place. A pressed default (such as «Все»), a mode toggle and a selection
are neutral: a check and a lit `--muted2` border, no gold. The unique tag is
neutral and dashed, the roll number is Chalk on a seam border, and footer links
are Ash Violet and underlined. The site share cards spend gold on the star
alone.

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
**Print Font:** the print card's own local stack, `--print-ui` (Inter, then the
system stack), until the print batch decides it.
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
  inherited by every control through `font: inherit`. Prose caps at 70ch.
- **Control** (`--t-control`, 15px): a control label.
- **Body Small** (`--t-small`, 400, 14px, 1.55): record descriptions and
  secondary prose. 1.62 on a full card. Notes cap at 62ch.
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

**The Local Font Rule.** One self-hosted family, from the build's own origin:
the woff2 files of `@fontsource-variable/source-sans-3`, imported in `main.ts`
and preloaded for the Latin and Cyrillic subsets in `app/index.html`. No font
service and no font from another origin, ever; `tests/app/typo.js` fails on a
font request outside `/assets/`. The print card keeps its local stack
(`--print-ui`), because the print fit is measured with it.

## Layout

One width governs everything: `--wrap: min(1180px, 100% - 32px)`. The header
bar, the job row, the mode row, `main` and the footer all take it, so the brand,
the first mode control and the first word of the page share a left edge at every
viewport. The 32px
subtraction is the gutter, and `viewport-fit=cover` plus `env(safe-area-inset-*)`
keeps the selection bar clear of a display cutout.

The page is a vertical stack: a sticky translucent header (`rgb(14 12 21 / 86%)`
over a 14px backdrop blur) that holds the brand row and the three jobs (63px from
761px, 111px at 360px), the mode row on the nine roll pages (53px, scrolling with
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
full-width element does not invent its own container or its own gutter.

**The Two Breakpoints Rule.** The system has two, and a third step for the header.
From 761px the brand, the three jobs, the language switch and the account
control share one row, and the page head's pin and «Справка» show their labels;
the sticky header is 63px. Up to 760px the jobs take a second row and the
header is 111px at 360px in both languages (at most 112px). At 600px touch
targets grow: segment padding to 8px 14px, the section copy-link button from
about 20px to a 36px hit area, row actions onto their own line, the mode row's
controls 40px tall. Every other media query in the code belongs to one
component and its own measured problem. Do not add another system breakpoint.

**The Same Label Rule.** A label does not change with the width, and a control
is never only an icon where its label fits: the three jobs keep their labels at
360px, the signed-out account control keeps «Войти» / "Sign in" at every width,
and the pin and the help are labelled buttons («Открывать при запуске» /
"Open on start", «Справка» / "Help"). The one interim exception: up to 760px
the pin and the help stay round buttons with the same names until their page's
batch moves them into «Ещё» or «Настроить» (the tables, the roller, homebrew,
search and the account, and the lists).

**The First-Screen Rule.** At 360x640 and at 1180x720, in Russian and in
English, at scroll 0, the primary content of a route starts no lower than 40%
of the viewport height (256px at 640, 288px at 720); the header counts as a
control above it. A design aims at 240px and 270px, so a small face or
line-box difference does not fail the rule. The primary content is the first
roll result on a roll page, the table on `/tables/*`, the item on `/i/` and
`/h/`, the first result on `/search`, the first settings panel on `/account`,
the sheet on `/p/`, the first item row on a `/homebrew` tab, the first form
field in the editor, the first list card on `/lists`, and the first entry on
`/lists/<uuid>` and `/s/<token>`. Each page marks that element with
`data-primary`, and `tests/app/states.js` ("primary content starts in the
first screen") measures it.

**The Phone-First Rule.** Players use a phone at the table about 80% of the
time; GMs use a laptop about 80% of the time (`PRODUCT.md`, "Users"). The
player surfaces (the shared list, the list page, the item, search, `/lists`)
are designed at 360x640 first, then widened. The GM surfaces (the roller, the
tables, homebrew, print) keep both widths and still pass the First-Screen Rule
on a phone. Every mock and every review checks 360x640 first.

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
number field, focus ring), 8px for a compact control (small button, filter pill,
icon button), 6px for a tag, and 999px for anything that is one choice in a row
(a chip, a segment, the toast).

Borders are one pixel and a seam color, except where a border states something:
a gold-tinted border marks a filter that has a value, a dashed border marks a
property rather than a category (the unique tag), and a border at about 45 per
cent alpha echoes its own tag's hue.

Artwork is square. A record image is `aspect-ratio: 1` with `object-fit: cover`:
132px beside a compact card, full width and up to 420px on a full card, 60px in
a table row, always over the art well (`--art-well`, `#0a0810`) so a
transparent PNG keeps a ground.

### Named Rules

**The Pill Rule.** A pill means "one of these, choosable". A rounded rectangle
means "a thing". Do not round a card to a pill or square a chip.

## Components

### Buttons

- **Shape:** 9px radius at full size (46px tall, 0 18px padding); 8px radius at
  small size (32px tall, 0 11px padding, 13px text).
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
  border with Alarm Red Text for a destructive one.
- **Icons:** every icon inside a button renders at 15px whatever its own
  attributes say. Dice are the single exception and keep their own silhouette,
  because squaring them makes a d4 look heavier than a d20.
- **Icon and label:** an icon and its label share one center: the control is
  `inline-flex` with `align-items: center`, the icon sits in one square box,
  and one gap separates the two. The icon's center is within 1px of the center
  of the label's first line box (`tests/app/typo.js` measures the three
  neutral switches at 360 and 1180).

### Chips

- **Style:** pill, Vault Wall fill, Seam Lit border, Ash Violet label at 13px
  weight 540. An optional second line sits under the label at 11.5px.
- **Chosen:** Seal Gold fill, Ink on Gold label at weight 650, for a choice
  that narrows the view.
- **Pressed default:** a chip that stands for no narrowing («Все») takes the
  neutral pressed state of the segmented control below, not gold (The Seal
  Rule).
- **Hover:** border to Seal Gold, label to Chalk.
- **Semantics:** a chip that navigates is an anchor carrying `aria-current`; a
  chip that toggles is a button carrying `aria-pressed`. Middle-click keeps
  working on the navigating kind.
- **Mode row:** the roll pages' three mode controls take the chip's look; at
  600px and below they share the row, 40px tall, and a long name takes two
  lines.

### Segmented control

- **Style:** a pill track (Vault Wall, Seam border, 3px padding) holding pill
  buttons at 13px weight 650 with 0.05em tracking.
- **Chosen:** Seal Gold fill, Ink on Gold label, for a choice that narrows the
  view.
- **Neutral pressed:** a mode toggle (the language switch, the tables list or
  grid switch, the print color or black-and-white switch) passes `neutral`:
  the pressed button takes the `check` icon before its label, a Vault Wall Lit
  fill, a Chalk label and a lit `--muted2` border, and no gold.
- Every button carries `aria-pressed`, including the ones whose original did
  not.

### Cards

- **Corner:** 14px, with `overflow: clip` so a programmatic scroll cannot move
  the contents.
- **Background:** the plate gradient, a Seam border, the Plate shadow.
- **Padding:** 13px 15px 14px, with 8px between rows of content.
- **Layout:** `full` stacks the image above the body; `compact` puts a 132px
  square image beside it.
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
- **Image review:** the page under `tools/artwork/review/` draws this card
  head from the same CSS and label code. A change to it follows
  `docs/artwork.md`, "The card follows the site's card".

### Badges

- **Style:** uppercase 11.5px at weight 650 with 0.07em tracking, 6px radius, on
  a 50 per cent black ground inside a hairline border.
- **Variants:** the five kind hues, plus tier, source, roll number (the UI
  face's tabular figures, Chalk on a Seam Lit border), unique (dashed, Ash
  Violet on Seam Lit), and the Hope and Fear pair. Neither the roll number nor
  the unique tag is gold: nobody chose them (The Seal Rule).

### Inputs

- **Search:** full width, 46px tall, a Vault Ink Deep well, a Seam Lit border,
  9px radius.
- **Number field:** a 46px row holding a 74px monospace input at 19px weight 650
  between two 40px steppers.
- **Focus:** border to Seal Gold plus a 3px gold glow at 14 per cent. On the
  duality fields the glow takes that die's own color instead.

### Navigation

- **Jobs:** three real links, «Бросок» / "Roll", «Таблицы» / "Tables" and
  «Поиск» / "Search", each with its icon before the label (the die, the table,
  the magnifier), at 14px weight 560 in Ash Violet with a 2px transparent bottom
  border. The lit job turns that border gold and the label Seal Gold Soft.
  «Бросок» stands for the nine roll pages and opens the last one of the tab.
- **Mode row:** under the sticky header on the nine roll pages only, scrolling
  with the page: «Обычные правила», «Альтернативные таблицы» and the menu button
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

### Filter pills

- **Style:** 32px tall, 8px radius, a 12 per cent gold wash inside a 45 per cent
  gold border, a Seal Gold Soft label at 13px weight 600, and a dismiss glyph.
- Chosen values stay visible outside the folded panel, beside a text reset and a
  32px copy-link button.

### Toast

- **Style:** a fixed plate 26px off the bottom, centered: Vault Wall fill, a
  1px Ash Violet Low (`--muted2`) border, Chalk text, `--r` corners and the
  Float shadow, entering on a 0.2s rise. No toast is gold. The error flavor is
  the Alarm Red fill with Ink on Gold text (about 5.6:1). The action flavor
  holds a Vault Wall Lit button with a Seam Lit border.
- **Width:** as wide as its text, at most the window less 16px a side; a long
  name wraps inside it, so it stays a few lines high at 360px.
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
tier plate and the burden mark sit at fixed `cqw` offsets. Text is fitted by
measuring the rendered box, which is why reduced motion sets transition duration
to `0s` rather than removing transitions: a zero duration still applies the end
state on the same frame, and the fitting routine reads layout back immediately.
In black and white the rules text also grows into the space the picture would
have taken, to a cap under the name's size. An opt-in compact sheet lays
sixteen cards at 44x63 mm in a 4x4 grid with the same 2 mm gutters and 19.5 by
14 mm margins, in either layout; the card is the same composition at 70%.
Small text has a paper floor under its `cqw` size, `max(<design>cqw, 4.5pt)`
for labels and 5pt for values and numbers, so a field over the floor keeps
its Figma size. The weights step down from 900 (the name and the tier number)
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
  rounded cards, no illustrated empty states, no marketing gradient. The density
  these tables need is the opposite of that language.
- **Don't** add a second shadow step, a third system breakpoint, or a sixth
  radius.
- **Don't** move a control on hover. Hover changes color and border, never
  position or scale.
- **Don't** link a font service or load a font from another origin. The one
  UI face comes from the build's own `/assets/`.
- **Don't** put a kind color on a row, a card border, or body text.
- **Don't** set white text on a gold fill. Ink on Gold is the only text color
  there.
