# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: the Game Master of a Daggerheart table.** The GM rolls loot during a
  session and prepares loot before one. The GM works mostly on a desktop or a
  laptop. Both situations are real; neither is a secondary case.
- **Secondary: the players at that table.** A player opens a shared list on a
  phone to read what the party received. A player also keeps a list as a running
  inventory across sessions. The inventory use is confirmed by the owner and is
  not an accident of the sharing feature.

Russian is the first language of both audiences. English is one switch away and
is always complete.

## Product Purpose

The product turns the published Daggerheart loot tables into a tool for play. A
person rolls on any table, browses a table in full, searches all 1091 records,
collects records into a list, hands that list to the players as one link, or
prints the list as cards. Success has two parts. The GM gets a result without
leaving the session. The players read and keep what they received.

## Positioning

The catalogue, the sharing mechanism and the print layout all run on the client.
A list lives in the URL fragment and in `localStorage`, so the product shares and
prints without an account, a server or tracking. It carries every published
source at once - Core Rulebook, Hope and Fear, Wondrous Environments, Dread GM
Toolbox, Vault of Ages, Community Magic Items, the alternate tables and the
campaign frames - in Russian and in English. Complete bilingual coverage plus
serverless sharing is the combination a neighbouring generator cannot copy
cheaply.

## Operating Context

| Scene | Device | What the person does |
|---|---|---|
| Session preparation | desktop or laptop | browses tables, filters, searches, builds a list, prints cards |
| Live session | desktop or laptop | rolls a mode, reads the result, adds it to a list, shares the link |
| Play and after play | player phone | opens a shared list, reads records, keeps the list as an inventory |
| Table handout | paper | nine 63x88 mm cards per A4 sheet, in colour or in black and white |

The app also runs from `file://`, so a person can keep a local copy.

## Capabilities and Constraints

**Confirmed capabilities**

- Six roll modes: Core rules, alternate tables, Wondrous, Dread, Vault of Ages
  and Communities. Other is two browsable tables, not a roll mode.
- 15 tables with per-table search, a list and grid switch, addressable sections,
  copy-link buttons and a filter panel driven from the address.
- One search across all 1091 records, over names, descriptions and stat lines, in
  both languages at once.
- Lists: create, rename, reorder, remove with undo, share as a link, copy as
  text, print as cards.
- Two languages at full parity, enforced by the type system.

**Durable constraints**

- There is no backend and there will not be one. A shared list is the address.
- Every page carries `noindex`, and crawling stays allowed so that crawlers can
  read the `noindex`.
- Equipment tier comes from the source book data. It is never inferred from
  stats.
- `data.js` is canonical. `data.json`, `catalog.csv` and `i/*.html` are
  generated. A shipped record id is never renumbered.
- Relative asset paths and the classic-script data adapter must survive, because
  the app runs from `file://`.
- The site is published to GitHub Pages from `dist/`.

**Open product decision**

- A player who uses a list as an inventory depends on `localStorage`, which can
  be lost. The app states the risk today. No replacement mechanism is decided,
  and none may be assumed. Any answer must respect the no-backend constraint.

## Brand Commitments

- The name is "Daggerheart Loot Generator". The Russian name is used in the
  Russian interface.
- Russian is the primary product language. `daggerheart.su` is the reference for
  Russian terminology. Item names are spelled as the books spell them, and Core
  text follows the official errata.
- The artwork in `img/` and `og/` is fan content produced by the project author.
- The code is MIT. Game text belongs to its rights holders.
- The Darrington Press Community Gaming License attribution block is required
  text. The statement that the project is not affiliated with, or endorsed by,
  Darrington Press or Critical Role is required text.
- The takedown promise in the README is a commitment: a rights holder who opens
  an issue gets the material removed.

## Evidence on Hand

- 1091 records, each with a name, a description, a stat line where it has one,
  and an illustration. 710 items and consumables, 381 pieces of equipment.
- Published machine-readable artefacts: `catalog.csv`, `data.json`, `llms.txt`.
- Behaviour specifications in `docs/specs/`, decisions in `docs/DECISIONS.md`,
  artwork provenance in `docs/provenance/`.
- Randomness is measured, not claimed: chi-square results and per-face skew are
  recorded in the README.
- No testimonials, user counts, reviews, press, benchmarks or case studies
  exist. Do not write any. The product is free, so there is no pricing to state.

## Product Principles

1. **The session does not stop.** A result must arrive in one action, and it
   must be readable at a glance from across a table.
2. **The address is the product.** State that a person may want to keep, send or
   reopen belongs in the URL.
3. **Both languages are complete at all times.** There is no partial state to
   design for and no fallback to hide behind.
4. **The source book is the authority.** The product reports what the books
   print. It does not derive, correct or improve the data.
5. **Nothing leaves the client.** No account, no upload, no tracking, no server.

## Accessibility & Inclusion

Target: WCAG 2.2 AA. This value is a recommendation by the assistant, accepted
in place of an explicit answer, and the owner may change it. The three criteria
that 2.2 adds and this product needs are target size for the player phone case,
focus appearance, and a non-drag alternative for list reordering, which the
number field already provides.

The automated gate stays: component tests end with `expectNoA11yViolations`, and
pressed and open states are covered with axe.
