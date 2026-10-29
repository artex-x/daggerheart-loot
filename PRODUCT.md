# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: the Game Master of a Daggerheart table.** The GM rolls loot during a
  session and prepares loot before one. A GM works on a laptop or a desktop
  about 80% of the time and on a phone about 20% of the time. Both situations
  are real; neither is a secondary case.
- **Primary: the players at that table.** A player opens a shared list to read
  what the party received, and keeps a list as a running inventory across
  sessions. A player works on a phone about 80% of the time and on a laptop
  about 20% of the time, so the player on a phone is a primary case, not a
  secondary one. The inventory use is confirmed by the owner and is not an
  accident of the sharing feature.

Russian is the first language of both audiences. English is one switch away and
is always complete.

## Product Purpose

The product turns the published Daggerheart loot tables into a tool for play. A
person rolls on any table, browses a table in full, searches all 1459 records,
collects records into a list, hands that list to the players as one link, or
prints the list as cards. Success has two parts. The GM gets a result without
leaving the session. The players read and keep what they received.

## Positioning

The catalogue, the rolls and the print layout run on the client. Lists are
account lists since R10 (`docs/decisions/`, 2026-10-28): a signed-in person
keeps them in the one backend, and a share link (`/s/<token>`) opens a list for
the players without an account and without tracking. The product carries every
published source at once - Core Rulebook, Hope and Fear, Wondrous Environments,
Dread GM Toolbox, Vault of Ages, The Dragon's Vault, Arazo's Artifacts, Many
Worlds Tavern, Community Magic Items, the alternate tables and the campaign
frames - in Russian and in English. Complete bilingual coverage plus a list
that the players open from one link is the combination a neighbouring
generator cannot copy cheaply.

## Operating Context

| Scene | Device | What the person does |
|---|---|---|
| Session preparation | GM: laptop or desktop about 80%, phone about 20% | browses tables, filters, searches, builds a list, prints cards |
| Live session | GM: laptop about 80%, phone about 20%; players: phone about 80% | the GM rolls a mode, reads the result, adds it to a list, shares the link; a player opens the link |
| Play and after play | players: phone about 80%, laptop about 20% | opens a shared list, reads records, keeps the list as an inventory |
| Table handout | paper | the players read printed cards at the table: nine 63x88 mm cards per A4 sheet, in colour or in black and white, or sixteen 44x63 mm on the opt-in compact sheet |

The app is served over HTTP only; running from `file://` was retired on
2026-09-24 (`docs/DECISIONS.md`).

## Capabilities and Constraints

**Confirmed capabilities**

- Nine roll modes: Core rules, alternate tables, Wondrous Environments, Dread
  GM Toolbox, Vault of Ages, The Dragon's Vault, Arazo's Artifacts, Community
  items and Many Worlds Tavern. Other is two browsable tables, not
  a roll mode.
- 19 catalog tables with per-table search, a list and grid switch, addressable
  sections, copy-link buttons and a filter panel driven from the address, and a
  eighteenth for a signed-in GM's own items.
- One search across all 1459 records, over names, descriptions and stat lines, in
  both languages at once.
- Lists: create, rename, reorder, remove with undo, share as a link, copy as
  text, print as cards.
- Two languages at full parity, enforced by the type system.

**Durable constraints**

- The Supabase backend is the only server that stores data, and one stateless
  preview Worker renders link cards. No other backend is added.
- Every page carries `noindex`, and crawling stays allowed so that crawlers can
  read the `noindex`.
- Equipment tier comes from the source book data. It is never inferred from
  stats.
- `data.js` is canonical. `data.json`, `catalog.csv` and `i/*.html` are
  generated. A shipped record id is never renumbered.
- Root-absolute URLs and the classic-script data adapter must survive: the app
  runs at a host root, and `data.js` is cached apart from the bundle.
- The site is published from `dist/` by the `deploy` job of `ci.yml`.

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

- 1459 records, each with a name, a description, a stat line where it has one,
  and an illustration. 1078 items and consumables, 381 pieces of equipment.
- Published machine-readable artefacts: `catalog-index.csv`, `catalog.csv`,
  `data.json`, `llms.txt`, `schema/import-v1.json`.
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
