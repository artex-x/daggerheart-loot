---
name: Daggerheart Loot Generator
description: A dark bilingual catalogue of 1272 Daggerheart records, with one gold accent that marks only what was chosen.
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
  tag-ground: "rgb(10 8 16 / 50%)"
typography:
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: "23px"
    fontWeight: 680
    letterSpacing: "-0.01em"
  title:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "17px"
    fontWeight: 680
    lineHeight: 1.28
    letterSpacing: "-0.01em"
  body:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.6
  body-small:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "11.5px"
    fontWeight: 650
    letterSpacing: "0.1em"
  badge:
    fontFamily: "{typography.headline.fontFamily}"
    fontSize: "10.5px"
    fontWeight: 650
    letterSpacing: "0.07em"
  numeral:
    fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
    fontSize: "11px"
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
    textColor: "#f0a49d"
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
ink, almost black, lit by two wide radial washes that never resolve into an
object. On that ground sit the index cards: panels, record cards and table rows,
each one a slightly lighter violet plate inside a single hairline seam. Every
artefact carries a coloured tag that says what kind of thing it is, and a
numbered seal in monospace that says where it stands in its book. Gold is the
seal wax. It appears on the thing a person has chosen, and almost nowhere else.

The mood is quiet, exact and solemn. Nothing here is staged: the type scale is
small and even, the contrast values were measured rather than guessed, and the
one accent is rationed. The catalogue holds 1272 records in two languages, so
density is a requirement, not a preference. The design earns its ceremony from
the numbering and the tagging, which are real information, and never from
ornament.

There are no webfonts. `--ui` and `--mono` are lists of locally installed
families, so `document.fonts.size` is zero and the first paint is the final
paint. This is a load-bearing property of the world, not an omission: the app
also runs from `file://`, and the print sheet must measure identically on a
machine that has never been online.

`app/src/styles/tokens.css` and `tests/app/typo.js` are normative. This file
records the system they express, in the language a design decision needs. Where
the two disagree, the code is right and this file is stale.

**Key Characteristics:**

- One accent colour, spent only on the chosen thing.
- A five-hue tag system that lives on badges alone.
- Tonal depth from a four-step surface ramp, plus exactly one shadow.
- A locked type scale of sixteen sizes, enforced by a test.
- Monospace for every number a person compares.
- Two worlds in one product: the dark screen, and the white printed card.

## Colors

A near-monochrome violet ground carrying one warm accent, five categorical tags,
and a two-colour duality pair. Every colour outside the neutrals has one job.

### Primary

- **Seal Gold** (`#d8ab5e`): the chosen state. A filled chip, a pressed segment,
  the primary button, the lit tab's underline, the focus ring, the toast. It is
  never decoration and never a surface at rest.
- **Seal Gold Soft** (`#f0d091`): gold as text. Links, the lit tab label, the
  monospace roll number, a filter pill's label. It exists because a gold fill
  needs dark ink on it, while gold text needs to be lighter than that fill.
- **Ink on Gold** (`#1a1206`): the only colour printed on a gold fill. Darker
  than any page surface, chosen against the gold specifically.

### Secondary

The five kind tags. They sit roughly evenly around the wheel with at least 49
degrees between any two, so no tag reads as a paler version of another.
Lightness alone was tried and was not enough to tell steel armour from an
ordinary item.

- **Relic Blue** (`#7a8ee0`): items.
- **Philtre Green** (`#9ec96a`): consumables.
- **Forge Copper** (`#d48e6a`): primary weapons.
- **Sigil Rose** (`#cf7fa6`): secondary weapons.
- **Patina Teal** (`#5ec9c4`): armour.

### Tertiary

- **Hope Amber** (`#e9b949`) and **Fear Violet** (`#8a72d6`): the two duality
  dice. They colour the badge and the focus glow of the die they belong to, on
  the alternate tables only. This is the one place where a colour other than
  Seal Gold reaches a focus treatment, because the glow says which die the
  person is changing.
- **Alarm Red** (`#e0685f`): destructive actions and the error toast.

### Neutral

- **Vault Ink** (`#0e0c15`): the page ground, under two fixed radial washes
  (violet `#251c3d` at the top left, blue `#1b2b3d` at the top right).
- **Vault Ink Deep** (`#14111d`): input wells. An input is a hole in the plate,
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
are in. Gold on something nobody selected is wrong.

**The Tag Rule.** The five kind hues live on the badge and nowhere else. A stat
line stays secondary text. A row does not take a kind colour, and neither does a
card border. The tag is the only place a category becomes a colour.

**The Ink Rule.** Text on a gold fill is Ink on Gold (`#1a1206`), never a page
surface colour and never white.

## Typography

**UI Font:** Inter, with the system stack behind it (`-apple-system`,
`BlinkMacSystemFont`, `Segoe UI`, Roboto, `Helvetica Neue`, Arial).
**Numeral Font:** `ui-monospace`, with `SF Mono`, Menlo and Consolas behind it.

**Character:** One neutral workhorse family does everything, and a monospace
face is reserved for values. The pairing has no voice of its own on purpose. The
record names and the artwork carry the setting; the interface type carries the
catalogue.

### Hierarchy

- **Headline** (680, 23px, -0.01em): the page title. One per route.
- **Title** (680, 17px, 1.28, -0.01em): a record name on a card. 19px on a full
  card, where the record is the subject of the page rather than one result in a
  grid.
- **Body** (400, 15.5px, 1.6): the page default, set on `body` and inherited by
  every control through `font: inherit`. Prose caps at 70ch.
- **Body Small** (400, 13.5px, 1.55): record descriptions and secondary prose.
  14px and 1.62 on a full card. Notes cap at 62ch.
- **Label** (650, 11.5px, 0.1em, uppercase): field captions and section
  headings, in Ash Violet Low.
- **Badge** (650, 10.5px, 0.07em, uppercase): every tag.
- **Numeral** (650, 11px to 20px, monospace): roll numbers, stat lines, step
  rungs, and the value in a number field.

### Named Rules

**The Sixteen Steps Rule.** The scale is exactly 23, 20, 19, 18, 17, 16, 15.5,
14, 13.5, 13, 12.5, 12, 11.5, 11, 10.5 and 9.5 px. `tests/app/typo.js` measures
every rendered element on thirteen routes against that list and fails on a size
that is not in it. A new step is a decision, and it lands in both places or not
at all.

**The Numerals Rule.** A number a person compares is monospace: a roll number, a
stat line, a rung in an upgrade chain, the value in a number field. A number a
person reads as prose is not.

**The Local Font Rule.** No `@font-face` and no font service, ever. The families
are lists of locally installed names. Anything else breaks the `file://` case
and moves the print measurements.

## Layout

One width governs everything: `--wrap: min(1180px, 100% - 32px)`. The header
bar, the tab strip, `main` and the footer all take it, so the brand, the lit tab
and the first word of the page share a left edge at every viewport. The 32px
subtraction is the gutter, and `viewport-fit=cover` plus `env(safe-area-inset-*)`
keeps the selection bar clear of a display cutout.

The page is a vertical stack: a sticky translucent header (`rgb(14 12 21 / 86%)`
over a 14px backdrop blur), the tab strip, the content, then the footer. `main`
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

**The Two Breakpoints Rule.** The system has two. At 640px the tab strip stops
wrapping and becomes a horizontal scroller that keeps the current tab centred.
At 600px touch targets grow: segment padding to 8px 14px, the section copy-link
button from about 20px to a 36px hit area, row actions onto their own line.
Every other media query in the code belongs to one component and its own
measured problem. Do not add a third system breakpoint.

## Elevation & Depth

Depth is tonal first. Four surface steps (Vault Ink, Vault Ink Deep, Vault Wall,
Vault Wall Lit) and a one-pixel seam do the work, so a plate is read by its
lighter fill and its border rather than by a shadow. Every panel and every card
fills with the same top-down gradient, `linear-gradient(180deg, var(--surface2),
var(--surface))`, which reads as light from above without simulating a source.

There is exactly one shadow token. It lifts panels and cards off the page wash,
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

Borders are one pixel and a seam colour, except where a border states something:
a gold-tinted border marks a filter that has a value, a dashed border marks a
property rather than a category (the unique tag), and a border at about 45 per
cent alpha echoes its own tag's hue.

Artwork is square. A record image is `aspect-ratio: 1` with `object-fit: cover`:
132px beside a compact card, full width and up to 420px on a full card, 60px in
a table row, always over a `#0a0810` well so a transparent PNG keeps a ground.

### Named Rules

**The Pill Rule.** A pill means "one of these, choosable". A rounded rectangle
means "a thing". Do not round a card to a pill or square a chip.

## Components

### Buttons

- **Shape:** 9px radius at full size (46px tall, 0 18px padding); 8px radius at
  small size (32px tall, 0 11px padding, 12.5px text).
- **Plain:** Vault Wall fill, Seam Lit border, Chalk label at 14px weight 600.
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
  border with `#f0a49d` text for a destructive one.
- **Icons:** every icon inside a button renders at 15px whatever its own
  attributes say. Dice are the single exception and keep their own silhouette,
  because squaring them makes a d4 look heavier than a d20.

### Chips

- **Style:** pill, Vault Wall fill, Seam Lit border, Ash Violet label at 13px
  weight 540. An optional second line sits under the label at 10.5px.
- **Chosen:** Seal Gold fill, Ink on Gold label at weight 650.
- **Hover:** border to Seal Gold, label to Chalk.
- **Semantics:** a chip that navigates is an anchor carrying `aria-current`; a
  chip that toggles is a button carrying `aria-pressed`. Middle-click keeps
  working on the navigating kind.

### Segmented control

- **Style:** a pill track (Vault Wall, Seam border, 3px padding) holding pill
  buttons at 12.5px weight 650 with 0.05em tracking.
- **Chosen:** Seal Gold fill, Ink on Gold label.
- Every button carries `aria-pressed`, including the ones whose original did
  not.

### Cards

- **Corner:** 14px, with `overflow: clip` so a programmatic scroll cannot move
  the contents.
- **Background:** the plate gradient, a Seam border, the Plate shadow.
- **Padding:** 13px 15px 14px, with 8px between rows of content.
- **Layout:** `full` stacks the image above the body; `compact` puts a 132px
  square image beside it.
- **Entrance:** a 0.28s `pop` (10px up, 0.985 to 1) on
  `cubic-bezier(0.2, 0.8, 0.3, 1)`, cancelled under reduced motion.

### Badges

- **Style:** uppercase 10.5px at weight 650 with 0.07em tracking, 6px radius, on
  a 50 per cent black ground inside a hairline border.
- **Variants:** the five kind hues, plus tier, source, roll number (monospace,
  gold), unique (dashed, gold), and the Hope and Fear pair.

### Inputs

- **Search:** full width, 46px tall, a Vault Ink Deep well, a Seam Lit border,
  9px radius.
- **Number field:** a 46px row holding a 74px monospace input at 20px weight 650
  between two 40px steppers.
- **Focus:** border to Seal Gold plus a 3px gold glow at 14 per cent. On the
  duality fields the glow takes that die's own colour instead.

### Navigation

- **Tabs:** ten real links at 13.5px weight 560 in Ash Violet, each with a 2px
  transparent bottom border. The current route turns that border gold and the
  label Seal Gold Soft. Rolling and browsing are separated by `margin-left:
  auto`, not by a divider.
- **Header:** sticky, translucent, blurred, with a one-pixel seam under it.
- **Brand:** a gold star glyph with a 35 per cent gold drop shadow beside a
  two-line wordmark. The wordmark is never translated.
- **Narrow:** below 640px the strip scrolls horizontally with the current tab
  scrolled to centre, and its scrollbar is hidden.

### Filter pills

- **Style:** 32px tall, 8px radius, a 12 per cent gold wash inside a 45 per cent
  gold border, a Seal Gold Soft label at 12.5px weight 600, and a dismiss glyph.
- Chosen values stay visible outside the folded panel, beside a text reset and a
  32px copy-link button.

### Toast

- **Style:** a fixed gold pill 26px off the bottom, centred, with the Float
  shadow, entering on a 0.2s rise. The error flavour is Alarm Red with white
  text. The action flavour holds a darkened inline button.
- It is a `popover="manual"` element so it survives the inertness of a native
  `<dialog>`, and it is `display: none !important` under print.

### Signature component: the print card

The second world. A print card is 63x88 mm of white paper inside a 0.4mm dashed
`#c9c4d2` cut border, nine to an A4 sheet in a 3x3 grid with 2mm gutters and
14.5mm by 8.5mm sheet margins. Inside, the card is a container-query system:
every dimension is written in `cqw`, so the composition scales with the card
rather than with the viewport. The artwork fills a square region at the top,
masked to fade at both edges, over a blurred and darkened copy of itself. The
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
a dark arrow in a gold rim that continues the frame in colour, a solid black
arrow in black and white.

Colour and black-and-white are two distinct layouts, not one layout with the
colour removed.

## Do's and Don'ts

### Do:

- **Do** spend Seal Gold only on the chosen thing: a picked chip, the current
  tab, a focused control, the main action of a panel.
- **Do** take a new text size from the sixteen-step scale, and add the step to
  `tests/app/typo.js` in the same change when a new one is truly needed.
- **Do** build depth from the four surface steps and the one-pixel seam, and
  reach for the Plate shadow when a plate has to lift.
- **Do** set every number a person compares in the monospace face.
- **Do** keep the five kind hues on badges alone.
- **Do** span the page with `var(--wrap)` and nothing else.
- **Do** let the global `:focus-visible` ring reach the control. Override
  `outline-offset` alone, and only where clipping proves it necessary.
- **Do** grow touch targets at 600px rather than shipping a pointer-sized target
  to a phone.

### Don't:

- **Don't** drift toward a neon dark mode: no saturated purple or cyan glow, no
  gradient text, no coloured drop shadow. The ground is violet, which makes this
  a short slide, and the palette's restraint is what keeps 1272 records legible.
- **Don't** drift toward a SaaS dashboard: no generic blue accent, no oversized
  rounded cards, no illustrated empty states, no marketing gradient. The density
  these tables need is the opposite of that language.
- **Don't** add a second shadow step, a third system breakpoint, or a sixth
  radius.
- **Don't** move a control on hover. Hover changes colour and border, never
  position or scale.
- **Don't** declare an `@font-face` or link a font service.
- **Don't** put a kind colour on a row, a card border, or body text.
- **Don't** set white text on a gold fill. Ink on Gold is the only text colour
  there.
