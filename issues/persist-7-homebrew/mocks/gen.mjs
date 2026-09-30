/* Generates issues/persist-7-homebrew/mocks/*.html: one self-contained file per
   screen, each state at 960 px and 360 px side by side. The CSS is inlined, so
   a file opens from disk with no sibling. */
import { mkdirSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const OUT = process.argv[2];
if (!OUT) throw new Error('The output directory is missing. Pass it as the first argument.');
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith('.html')) unlinkSync(join(OUT, f));

const IMG = '../../../img/thumb/';
const FULL = '../../../img/';

/* ---------------- shared CSS: tokens.css values, component rules copied from the named .svelte files ---------------- */
const CSS = `
/* R7 mocks. :root copies app/src/styles/tokens.css (values, not a redesign).
   Component rules are copied from the named .svelte files. One theme (dark).
   Rules marked NEW are the proposal. */
:root { color-scheme: dark; --bg: #0e0c15; --bg2: #14111d; --surface: #1a1626; --surface2: #221d31;
  --line: #312a45; --line2: #3f3758; --txt: #ece8f6; --muted: #9b93b3; --muted2: #8a83a3;
  --gold: #d8ab5e; --gold-soft: #f0d091; --gold-rgb: 216 171 94; --hope: #e9b949; --fear: #8a72d6;
  --item: #7a8ee0; --cons: #9ec96a; --eq-weapon: #d48e6a; --eq-secondary: #cf7fa6; --eq-armor: #5ec9c4;
  --danger: #e0685f; --danger-text: #f0a49d; --warn-bg: rgb(224 104 95 / 9%); --warn-line: rgb(224 104 95 / 30%);
  --warn-text: #e0b6b1; --warn-strong: #f5c0ba; --badge-bg: rgb(10 8 16 / 50%); --r: 14px; --r-sm: 9px;
  --shadow: 0 10px 34px -14px rgb(0 0 0 / 85%);
  --ui: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace; --step-0: 15.5px;
  --h-page-size: 23px; --h-page-weight: 680; --h-page-spacing: -0.01em; --gap-sm: 6px; --ink-on-gold: #1a1206; }
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; background: radial-gradient(1200px 700px at 12% -8%, #251c3d 0%, transparent 62%),
  radial-gradient(900px 600px at 100% 0%, #1b2b3d 0%, transparent 55%), var(--bg); background-attachment: fixed;
  color: var(--txt); font: var(--step-0) / 1.6 var(--ui); }
button { font: inherit; color: inherit; cursor: pointer; }
a { color: var(--gold-soft); }
input::placeholder, textarea::placeholder { color: var(--muted2); opacity: 0.7; }

/* ---- mock chrome (not app UI) ---- */
.mockbar { max-width: 1420px; margin: 20px auto 10px; padding: 0 16px; font-size: 13px; color: var(--muted); }
.mockbar h1 { font-size: 18px; color: var(--txt); margin: 0 0 4px; }
.mockbar p { margin: 4px 0; max-width: 120ch; }
.crumb { font: 12px/1.4 var(--mono); }
.notetext { color: #d9c8f5; }
.pair { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 28px; max-width: 1420px; margin: 0 auto 40px; padding: 0 16px; }
.frame { position: relative; border: 1px dashed #5a5070; border-radius: 6px; padding: 0 0 18px; background: transparent; }
.frame.desk { flex: 0 0 960px; width: 960px; max-width: 100%; min-width: 0; }
.frame.phone { flex: 0 0 360px; width: 360px; }
.frame.textframe { flex: 1 1 640px; min-width: 0; }
.frame > .cap { display: block; font: 600 12px/1.4 var(--mono); color: #c8a0ff; padding: 6px 10px; border-bottom: 1px dashed #5a5070; }
.frame .in { padding: 0 16px; }
.new { outline: 2px dashed #c8a0ff; outline-offset: 3px; }
.note { border: 1px dashed #c8a0ff; background: rgb(200 160 255 / 8%); color: #d9c8f5; font-size: 12.5px;
  padding: 6px 10px; margin: 14px 0 0; border-radius: 4px; line-height: 1.5; }
.note code, .notetext code { font: 12px/1.4 var(--mono); color: #e6d7ff; }
table.idx { border-collapse: collapse; margin-top: 14px; font-size: 13.5px; width: 100%; }
table.idx th, table.idx td { text-align: left; border-top: 1px solid var(--line); padding: 7px 10px 7px 0; vertical-align: top; }
table.idx th { color: var(--muted2); font-size: 11.5px; letter-spacing: 0.1em; text-transform: uppercase; }
table.idx td:first-child { font-family: var(--mono); white-space: nowrap; }
pre.llms { margin: 0; padding: 14px 16px; font: 12.5px/1.55 var(--mono); color: var(--txt); white-space: pre-wrap; overflow-wrap: anywhere; }

/* ---- Shell.svelte header, outline only ---- */
.chrome { opacity: 0.6; outline: 1px dashed #5a5070; outline-offset: -1px; margin-bottom: 4px; }
.chrome.live { opacity: 1; }
.topbar { border-bottom: 1px solid var(--line); display: flex; align-items: center; justify-content: space-between; padding: 11px 16px; gap: 16px; position: relative; }
.brand { display: flex; align-items: center; gap: 10px; }
.brand .star { color: var(--gold); font-size: 22px; line-height: 1; }
.brand b { font-size: 16px; display: block; line-height: 1.1; }
.brand i { font-style: normal; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted2); }
.hright { display: flex; align-items: center; gap: 8px; }
.langsw { display: flex; border: 1px solid var(--line); border-radius: 999px; padding: 3px; background: var(--surface); }
.langsw span { padding: 4px 11px; border-radius: 999px; font: 650 12px/1.4 var(--ui); letter-spacing: 0.05em; color: var(--muted); }
.langsw span.on { background: var(--gold); color: var(--ink-on-gold); }
.acct { display: inline-flex; align-items: center; justify-content: center; height: 38px; min-width: 38px; padding: 0 14px 0 11px;
  border-radius: 999px; background: var(--surface); border: 1px solid var(--line); color: var(--muted); font-size: 12.5px; font-weight: 650; letter-spacing: 0.05em; }
.acct.in { padding: 0; width: 38px; background: var(--surface2); border-color: rgb(216 171 94 / 45%); color: var(--gold-soft); font-size: 14px; }
.acct.on { border-color: var(--gold); }
.tabs { display: flex; gap: 18px; padding: 8px 16px 0; border-bottom: 1px solid var(--line); font-size: 13.5px; color: var(--muted); overflow: hidden; }
.tabs span { padding-bottom: 8px; border-bottom: 2px solid transparent; white-space: nowrap; }
.tabs span.on { color: var(--gold-soft); border-bottom-color: var(--gold); }
.tabs .sp { margin-left: auto; }
main { padding-top: 22px; }

/* ---- AccountMenu.svelte ---- */
.acctwrap { position: relative; }
.acctmenu { position: absolute; top: calc(100% + 8px); right: 0; min-width: 220px; max-width: min(320px, 90vw); z-index: 60;
  border: 1px solid var(--line2); border-radius: 11px; background: var(--surface); padding: 6px;
  box-shadow: 0 16px 40px -14px rgb(0 0 0 / 85%); display: flex; flex-direction: column; gap: 2px; }
.acctmenu a, .acctmenu button { display: block; padding: 9px 12px; border-radius: 8px; color: var(--txt); font: inherit; font-size: 14px;
  text-align: left; text-decoration: none; background: transparent; border: 0; }
.acctmenu .out { border-top: 1px solid var(--line); border-radius: 0 0 8px 8px; margin-top: 4px; }
.topbar.tall { min-height: 230px; align-items: flex-start; }

/* ---- PageTitle / PageHead ---- */
.page-h { margin: 0 0 4px; font-size: var(--h-page-size); font-weight: var(--h-page-weight); letter-spacing: var(--h-page-spacing); overflow-wrap: anywhere; }
.page-sub { margin: 0 0 18px; color: var(--muted); font-size: 14px; max-width: 70ch; }
.page-sub a.itemtable { white-space: nowrap; font-size: 13px; text-decoration: none; border-bottom: 1px solid transparent; margin-left: 6px; }
.count { font: 600 12px/1 var(--mono); color: var(--muted2); margin: -8px 0 14px; }

/* ---- Panel.svelte / Field.svelte ---- */
.panel { background: linear-gradient(180deg, var(--surface2), var(--surface)); border: 1px solid var(--line); border-radius: var(--r); padding: 18px; box-shadow: var(--shadow); }
.panel + .panel, .panel + .rows, .rows + .panel { margin-top: 16px; }
.field { margin-bottom: 16px; }
.field:last-child { margin-bottom: 0; }
.lbl { display: block; font-size: 11.5px; font-weight: 650; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted2); margin: 0 0 8px; }
.numrow { display: flex; gap: 10px; align-items: stretch; flex-wrap: wrap; }
.grow { flex: 1 1 170px; min-width: 0; }
.input { width: 100%; height: 46px; padding: 0 14px; border-radius: var(--r-sm); background: var(--bg2); border: 1px solid var(--line2); color: var(--txt); font: inherit; }
textarea.input { height: 92px; padding: 10px 14px; resize: vertical; line-height: 1.45; font-size: 14px; }
select.input { appearance: none; background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%);
  background-position: calc(100% - 18px) 20px, calc(100% - 13px) 20px; background-size: 5px 5px; background-repeat: no-repeat; }
.twocol { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.frame.phone .twocol { grid-template-columns: 1fr; }
.hint { margin: 10px 0 0; font-size: 13px; color: var(--muted); }
.hint.lead { margin: 0 0 12px; }
.err { margin: 10px 0 0; font-size: 13px; color: var(--danger-text); }

/* ---- Button.svelte ---- */
.btn { border: 1px solid var(--line2); background: var(--surface); color: var(--txt); padding: 0 18px; height: 46px; border-radius: var(--r-sm);
  font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; text-decoration: none; cursor: pointer; white-space: nowrap; }
.btn.sm { height: 32px; padding: 0 11px; font-size: 12.5px; border-radius: 8px; gap: 6px; }
.btn.on { border-color: var(--gold); color: var(--gold-soft); }
.btn.primary { background: linear-gradient(180deg, #e2b76c, var(--gold)); border-color: #e8c27c; color: var(--ink-on-gold); font-weight: 700; }
.btn.ghost { background: transparent; border-color: var(--line); }
.btn.danger { border-color: rgb(224 104 95 / 40%); color: var(--danger-text); }
.btn[disabled] { opacity: 0.45; cursor: default; }
.caret { width: 0; height: 0; margin-left: 2px; border: 4px solid transparent; border-top-color: currentcolor; transform: translateY(2px); display: inline-block; }
.card-acts { display: flex; gap: var(--gap-sm); flex-wrap: wrap; align-items: center; }
.ml { margin-left: auto; }
.frame.phone .card-acts .ml { margin-left: 0; }

/* ---- Chip.svelte / ChipRow ---- */
.chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip { display: inline-block; border: 1px solid var(--line2); background: var(--surface); color: var(--muted); padding: 7px 12px; border-radius: 999px; font-size: 13px; font-weight: 540; text-align: left; }
.chip.on { background: var(--gold); border-color: var(--gold); color: var(--ink-on-gold); font-weight: 650; }
.chip.sm { padding: 5px 11px; font-size: 12.5px; }

/* ---- Seg.svelte ---- */
.seg { display: inline-flex; flex-wrap: wrap; background: var(--surface); border: 1px solid var(--line); border-radius: 999px; padding: 3px; }
.seg span { border: 0; background: transparent; color: var(--muted); padding: 5px 13px; border-radius: 999px; font-size: 12.5px; font-weight: 650; letter-spacing: 0.05em; }
.seg span.on { background: var(--gold); color: var(--ink-on-gold); }
.seg.small span { padding: 4px 12px; font-size: 12px; }
.frame.phone .seg span { padding: 8px 14px; }

/* ---- Badge.svelte ---- */
.badge { font-size: 10.5px; font-weight: 650; letter-spacing: 0.07em; text-transform: uppercase; padding: 3px 7px; border-radius: 6px; background: var(--badge-bg); border: 1px solid var(--line2); color: var(--muted); white-space: nowrap; }
.badge.item { color: var(--item); border-color: #7a8ee073; }
.badge.cons { color: var(--cons); border-color: #9ec96a73; }
.badge.eq-weapon { color: var(--eq-weapon); border-color: #d48e6a73; }
.badge.eq-secondary { color: var(--eq-secondary); border-color: #cf7fa673; }
.badge.eq-armor { color: var(--eq-armor); border-color: #5ec9c473; }
.badge.uniq { color: var(--gold-soft); border-color: rgb(var(--gold-rgb) / 45%); border-style: dashed; }
.badge.tier { color: var(--muted); border-color: var(--line2); }
.badge.src { color: #9a9aa6; }
.badge.num { font-family: var(--mono); font-size: 11px; letter-spacing: 0; color: var(--gold-soft); border-color: rgb(var(--gold-rgb) / 50%); }
/* NEW: the source badge of a homebrew record - the property style .uniq uses; a title names the source */
.badge.src.hb { border-style: dashed; border-color: #9a9aa6a6; }

/* ---- TableRows.svelte / RowMain.svelte ---- */
.rows { display: flex; flex-direction: column; gap: 8px; }
.row { display: flex; align-items: flex-start; gap: 2px; padding: 3px 5px 3px 3px; border: 1px solid var(--line); border-radius: 11px; background: linear-gradient(180deg, var(--surface2), var(--surface)); }
.row.sel { border-color: var(--gold); background: linear-gradient(180deg, rgb(216 171 94 / 9%), var(--surface)); }
.rtick { flex: none; width: 42px; align-self: stretch; display: flex; align-items: center; justify-content: center; }
.rtick i { width: 17px; height: 17px; border-radius: 4px; border: 1px solid var(--line2); background: var(--bg2); display: block; }
.row.sel .rtick i { background: var(--gold); border-color: var(--gold); }
.row-main { display: flex; gap: 12px; align-items: flex-start; text-align: left; flex: 1; min-width: 0; background: none; border: 0; padding: 8px; color: inherit; font: inherit; }
.row-main img { width: 60px; height: 60px; border-radius: 8px; object-fit: cover; flex: none; background: #0a0810; }
.row-main .rt { flex: 1; min-width: 0; }
.row-main .rt b { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 620; overflow-wrap: anywhere; }
.row-main .rt .rnum { font: 650 11px/1 var(--mono); color: var(--gold-soft); flex: none; border: 1px solid rgb(216 171 94 / 40%); border-radius: 5px; padding: 3px 5px; }
.row-main .rt .rtail { font-style: normal; font-weight: 600; color: var(--gold-soft); margin-left: 7px; font-size: 12.5px; }
.row-main .rt > span { display: -webkit-box; font-size: 12.5px; color: var(--muted2); margin-top: 3px; line-height: 1.45; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.row-main .rt .rstats { -webkit-line-clamp: none; line-clamp: none; display: block; margin-top: 3px; font: 600 11.5px/1.4 var(--mono); color: var(--muted); }
.row-main .rt .rcraft { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 4px; -webkit-line-clamp: none; line-clamp: none; color: var(--muted); font-size: 11.5px; margin-top: 4px; overflow: visible; }
.row-main .rt .rcraft .arr { color: var(--muted2); }
.row-main .rm { flex: none; display: flex; gap: 5px; align-items: center; }
.frame.phone .row-main { flex-wrap: wrap; }
.frame.phone .row-main .rm { flex-basis: 100%; padding-left: 72px; margin-top: 2px; flex-wrap: wrap; }
/* NEW: a homebrew record's name inside a relation - dashed, titled */
.hbname { border-bottom: 1px dashed currentcolor; }

/* ---- section heads on a table page (SectionHead.svelte, simplified) ---- */
.shead { display: flex; align-items: center; gap: 8px; margin: 18px 0 8px; font: 650 11.5px/1 var(--mono); letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted2); }
.shead:first-child { margin-top: 0; }
.shead .cnt { color: var(--muted2); font-weight: 500; letter-spacing: 0; }
.shead .lnk { margin-left: 4px; color: var(--muted2); font-size: 11px; }

/* ---- TablesPage toolbar + FilterBar.svelte ---- */
.toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin: 0 0 12px; }
.toolbar .grow { flex: 1 1 200px; }
.fbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin: 0 0 14px; }
.fpill { display: inline-flex; align-items: center; gap: 6px; height: 32px; padding: 0 8px 0 11px; border-radius: 8px; background: rgb(216 171 94 / 12%); border: 1px solid rgb(216 171 94 / 45%); color: var(--gold-soft); font-size: 12.5px; font-weight: 600; }
.fpill i { font-style: normal; color: var(--muted); }
.fcount { font: 600 12px/1 var(--mono); color: var(--muted2); }
.fpanel { margin: 0 0 16px; }
.frow { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; margin-bottom: 10px; }
.frow .lbl { margin: 0; flex: 0 0 96px; }
.frame.phone .frow .lbl { flex-basis: 100%; }

/* ---- RecordCard.svelte ---- */
.card { background: linear-gradient(180deg, var(--surface2), var(--surface)); border: 1px solid var(--line); border-radius: var(--r); overflow: clip; display: flex; box-shadow: var(--shadow); }
.card.full { flex-direction: column; max-width: 520px; }
.card.compact { flex-direction: row; align-items: stretch; }
.card-media { position: relative; background: #0a0810; overflow: hidden; flex: none; border: 0; padding: 0; display: block; }
.card.full .card-media { width: 100%; aspect-ratio: 1; max-height: 420px; }
.card.compact .card-media { width: 132px; aspect-ratio: 1; }
.frame.phone .card.compact .card-media { width: 96px; }
.card-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card-body { padding: 13px 15px 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
.card-meta { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }
.card-name { margin: 0; font-size: 17px; font-weight: 680; letter-spacing: -0.01em; line-height: 1.28; display: flex; align-items: baseline; gap: 7px; overflow-wrap: anywhere; }
.card.full .card-name { font-size: 19px; }
.eqstats { display: flex; flex-wrap: wrap; gap: 5px; margin: 2px 0 10px; }
.eqstats span { font: 600 11.5px/1 var(--mono); color: var(--muted); background: rgb(255 255 255 / 3.5%); border: 1px solid var(--line2); border-radius: 6px; padding: 4px 7px; white-space: nowrap; }
.card-desc { margin: 0; color: #cfc8e0; font-size: 13.5px; line-height: 1.55; }
.card.full .card-desc { font-size: 14px; line-height: 1.62; }
.card-desc p { margin: 0; }
.card-desc ul { margin: 4px 0 0; padding-left: 18px; }
.steps { display: flex; align-items: center; gap: 6px; margin: 10px 0 0; flex-wrap: wrap; }
.steps-l { font: 650 10.5px/1 var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted2); }
.step { min-width: 26px; height: 26px; padding: 0 6px; border-radius: 7px; border: 1px solid var(--line2); background: var(--surface); color: var(--muted); font: 650 12.5px/1 var(--ui); display: inline-flex; align-items: center; justify-content: center; }
.step.on { background: var(--gold); border-color: var(--gold); color: #191320; }
/* NEW: a homebrew rung */
.step.hb { border-style: dashed; border-color: rgb(var(--gold-rgb) / 55%); }
.step.hb.on { border-style: dashed; border-color: #191320; }
.craft { display: flex; flex-direction: column; gap: 3px; margin: -1px 0 1px; }
.craft p { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 5px; margin: 0; font-size: 12.5px; line-height: 1.45; min-width: 0; }
.craft .arr { color: var(--muted2); align-self: center; }
.craft-l { color: var(--muted2); text-transform: uppercase; letter-spacing: 0.05em; font-size: 10.5px; white-space: nowrap; }
.craft a { color: var(--gold-soft); text-decoration: none; border-bottom: 1px dotted rgb(240 208 145 / 45%); }
.craft a.hbname { border-bottom: 1px dashed rgb(240 208 145 / 70%); }
/* NEW: the fold button on a relation with more than three names */
.more { background: none; border: 1px dashed var(--line2); border-radius: 6px; color: var(--muted); font: 600 11px/1 var(--ui); padding: 3px 7px; }
.refs { display: flex; flex-direction: column; gap: 4px; margin: 1px 0 2px; }
.refs details { border: 1px solid var(--line); border-radius: 8px; background: rgb(255 255 255 / 2%); }
.refs summary { display: flex; align-items: center; gap: 6px; padding: 5px 8px; cursor: pointer; list-style: none; font-size: 12px; line-height: 1.35; flex-wrap: wrap; }
.refs summary::-webkit-details-marker { display: none; }
.ref-n { font-weight: 650; color: var(--txt); }
.ref-s { font-style: normal; color: var(--muted2); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.04em; }
.cardpick { border-top: 1px solid var(--line); margin-top: 12px; padding-top: 12px; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.itempage { max-width: 520px; }

/* ---- the editor (HomebrewEditor.svelte, NEW) ---- */
.editor { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start; }
.frame.phone .editor { grid-template-columns: 1fr; }
.fold { border: 1px solid var(--line); border-radius: var(--r-sm); background: rgb(255 255 255 / 2%); margin-bottom: 16px; }
.fold > .sum { display: flex; align-items: center; gap: 8px; padding: 10px 12px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.fold > .sum .caret { margin-left: auto; }
.fold > .sum.open .caret { transform: translateY(-1px) rotate(180deg); }
.fold > .body { padding: 4px 12px 12px; border-top: 1px solid var(--line); }
.fieldset { border: 0; padding: 0; margin: 0 0 16px; }
.fieldset > .lgd { font-size: 13.5px; font-weight: 650; margin: 0 0 12px; padding-top: 14px; border-top: 1px solid var(--line); }
/* NEW: ItemPicker.svelte - a combobox over the merged index */
.picker { position: relative; }
.picklist { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 5; border: 1px solid var(--line2); border-radius: 11px; background: var(--surface);
  padding: 6px; box-shadow: 0 16px 40px -14px rgb(0 0 0 / 85%); display: flex; flex-direction: column; gap: 2px; }
.picklist.static { position: static; margin-top: 6px; }
.pickrow { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 8px; font-size: 13.5px; min-width: 0; }
.pickrow.on { background: var(--surface2); }
.pickrow img { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; background: #0a0810; flex: none; }
.pickrow .nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pickrow .nm small { display: block; font: 600 11px/1.3 var(--mono); color: var(--muted2); }
.picked { display: flex; align-items: center; gap: 10px; padding: 6px 8px 6px 6px; border: 1px solid var(--line2); border-radius: var(--r-sm); background: var(--bg2); }
.picked img { width: 34px; height: 34px; border-radius: 7px; object-fit: cover; background: #0a0810; flex: none; }
.picked .nm { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 600; overflow-wrap: anywhere; }
.picked .nm small { display: block; font: 500 11.5px/1.3 var(--ui); color: var(--muted2); }
.picked .x { background: none; border: 0; color: var(--muted); font-size: 18px; line-height: 1; padding: 4px 6px; }
.pickempty { padding: 8px; font-size: 13px; color: var(--muted2); }

/* ---- ListPage.svelte .batch (R6's BatchBar.svelte) ---- */
.batch { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 0 0 14px; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--line2); background: var(--surface); }
.batch.on { border-color: var(--gold); background: rgb(216 171 94 / 7%); }
.batch-all { display: flex; align-items: center; gap: 8px; font: 650 11px/1 var(--mono); letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted2); }
.batch.on .batch-all { color: var(--gold-soft); }
.batch-all i { width: 17px; height: 17px; border-radius: 4px; border: 1px solid var(--line2); background: var(--bg2); display: inline-block; }
.batch.on .batch-all i { background: var(--gold); border-color: var(--gold); }
.batch-summ { font: 400 13.5px/1.3 var(--ui); color: var(--gold-soft); }
.batch-acts { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-left: auto; }
.frame.phone .batch-acts { margin-left: 0; width: 100%; }

/* ---- source rows on #/homebrew (NEW) ---- */
.srcrow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 0; border-top: 1px solid var(--line); }
.srcrow:first-of-type { border-top: 0; padding-top: 2px; }
.srcrow .who { flex: 1 1 200px; min-width: 0; display: flex; align-items: center; gap: 8px; }
.srcrow .who b { font-size: 14px; font-weight: 650; }
.srcrow .who small { font-size: 12.5px; color: var(--muted2); }
.srcrow .acts { display: flex; gap: 6px; flex-wrap: wrap; }

/* ---- SignInPrompt.svelte ---- */
.signin { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.signin-lead { margin: 0; font-size: 13.5px; color: var(--txt); max-width: 62ch; flex: 1 1 240px; }

/* ---- StorageNotice-style warning box, the import report ---- */
.errs { margin: 12px 0 0; padding: 10px 12px; border-radius: var(--r-sm); background: var(--warn-bg); border: 1px solid var(--warn-line); color: var(--warn-text); font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.errs b { color: var(--warn-strong); font-weight: 650; display: block; }
.errs ul { margin: 4px 0 0; padding-left: 18px; }
.errs code { font: 12px/1.4 var(--mono); color: var(--warn-strong); }
.preview { margin: 12px 0 0; font-size: 13.5px; line-height: 1.55; }
.preview code { font: 12.5px/1.4 var(--mono); color: var(--gold-soft); }
.fname { font-size: 13px; color: var(--muted); overflow-wrap: anywhere; }

/* ---- Toast.svelte, at the frame's bottom ---- */
.toast { position: absolute; left: 50%; bottom: 26px; transform: translateX(-50%); max-width: calc(100% - 32px); width: max-content; background: var(--gold); color: var(--ink-on-gold);
  font-weight: 650; font-size: 13.5px; padding: 10px 18px; border-radius: 999px; box-shadow: 0 12px 30px -10px rgb(0 0 0 / 70%); }
.frame:has(.toast) { padding-bottom: 96px; }

/* ---- the browser's own confirm, a flat stand-in (not app UI) ---- */
.native { max-width: 460px; margin: 18px auto 0; background: #2b2b2b; color: #eee; font: 13px/1.5 system-ui, sans-serif; border-radius: 8px; padding: 18px 18px 14px; border: 1px solid #444; }
.native .origin { font-weight: 600; margin-bottom: 8px; }
.native .acts { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
.native .acts span { padding: 6px 16px; border-radius: 4px; background: #3c3c3c; }
.native .acts span.ok { background: #8ab4f8; color: #202124; }

/* ---- AccountPage.svelte ---- */
.row-btns { display: flex; flex-wrap: wrap; gap: 8px; }
.group { margin-top: 22px; }
.frame.phone .page-sub .itemtable { display: block; margin: 4px 0 0; }

/* ---- NEW in pass 3: required marks, field errors, the form's error summary ---- */
.req { color: var(--danger-text); margin-left: 3px; letter-spacing: 0; }
.legend { margin: 0 0 14px; font-size: 12.5px; color: var(--muted2); }
.input.bad { border-color: var(--danger); box-shadow: 0 0 0 1px rgb(224 104 95 / 35%); }
.seg.bad { border-color: var(--danger); }
.ferr { display: block; margin: 6px 0 0; font-size: 12.5px; line-height: 1.45; color: var(--danger-text); }
.fhint { display: block; margin: 6px 0 0; font-size: 12.5px; line-height: 1.45; color: var(--muted2); }
.fhint.count { text-align: right; font-family: var(--mono); font-size: 11.5px; }
.errs a { color: var(--warn-strong); }
.errs .acts { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
/* NoticeBox.svelte (the move notice's box): gold for news, the warning tint for a problem */
.nbox { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; padding: 11px 14px; margin: 0 0 14px;
  border: 1px solid rgb(var(--gold-rgb) / 45%); border-radius: var(--r-sm); background: rgb(var(--gold-rgb) / 6%); font-size: 13px; line-height: 1.5; }
.nbox.warn { border-color: var(--warn-line); background: var(--warn-bg); color: var(--warn-text); }
.nbox .lead { flex: 1 1 320px; min-width: 0; }
.nbox .acts { display: flex; gap: 8px; flex-wrap: wrap; }
/* NEW: the draft marker - a property of the owner's item, drawn only from the owner's index */
.badge.draft { color: var(--gold-soft); border-color: rgb(var(--gold-rgb) / 55%); }
/* the browser's own select list, a flat stand-in (not app UI) */
.selopen { border: 1px solid #444; border-radius: 6px; background: #2b2b2b; color: #eee; font: 14px/1.4 system-ui, sans-serif; padding: 4px 0; margin-top: 4px; max-width: 360px; }
.selopen span { display: block; padding: 5px 12px; }
.selopen span.on { background: #3d5a8a; }
.selopen span.sep { border-top: 1px solid #555; margin-top: 4px; padding-top: 7px; }
/* NEW: sections inside a source on #/homebrew */
.sectlist { flex-basis: 100%; margin: 4px 0 2px; padding: 8px 0 0 14px; border-left: 2px solid var(--line); display: flex; flex-direction: column; gap: 6px; }
.sectrow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13.5px; }
.sectrow .nm { flex: 1 1 160px; min-width: 0; }
.sectrow small { color: var(--muted2); font-size: 12.5px; }
.refs details[open] summary { border-bottom: 1px solid var(--line); }
.ref-t { margin: 0; padding: 6px 8px 8px; font-size: 12.5px; line-height: 1.5; color: #cfc8e0; }
.cardgrp { margin: 0 0 14px; }
.cardgrp:last-child { margin-bottom: 0; }
`;

/* ---------------- helpers ---------------- */
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function chrome({ tab = '', signed = true, live = false, menu = false, on = false } = {}) {
  const tabs = ['Обычные правила', 'Альт. таблицы', 'Wondrous', 'Dread', 'Vault of Ages', "Dragon's Vault", 'Сообщества'];
  const browse = ['Таблицы', 'Поиск'];
  const tabHtml =
    tabs.map((t) => `<span${t === tab ? ' class="on"' : ''}>${t}</span>`).join('') +
    `<span class="sp"></span>` +
    browse.map((t) => `<span${t === tab ? ' class="on"' : ''}>${t}</span>`).join('');
  const acct = signed
    ? `<span class="acct in${on ? ' on' : ''}">g</span>`
    : `<span class="acct">&#9679; Войти</span>`;
  const menuHtml = menu
    ? `<div class="acctmenu" role="menu"><a href="#">Аккаунт</a><a href="#">Мои списки</a><a href="#" class="new">Мои предметы</a><button class="out">Выйти</button></div>`
    : '';
  return `<div class="chrome${live ? ' live' : ''}" title="Header chrome (Shell.svelte, TabBar)">
  <div class="topbar${menu ? ' tall' : ''}"><span class="brand"><span class="star">&#10022;</span><span><b>Лут</b><i>Daggerheart</i></span></span>
    <span class="hright"><span class="langsw"><span class="on">RU</span><span>EN</span></span><span class="acctwrap">${acct}${menuHtml}</span></span></div>
  <div class="tabs">${tabHtml}</div></div>`;
}

const badge = (cls, text, title) => `<span class="badge ${cls}"${title ? ` title="${esc(title)}"` : ''}>${text}</span>`;
const srcBadge = (name, hb) => (hb ? badge('src hb', name, 'Хоумбрю: ваш источник') : badge('src', name));
const HB = (name) => `<span class="hbname" title="${esc(name)} · хоумбрю">${name}</span>`;

function row({ img, name, stats, desc, craft, badges, sel = false, num, tail, isNew = false }) {
  return `<div class="row${sel ? ' sel' : ''}${isNew ? ' new' : ''}"><span class="rtick"><i></i></span><button class="row-main">
  <img src="${img}" alt="" /><span class="rt"><b>${num ? `<span class="rnum">${num}</span>` : ''}${name}${tail ? `<i class="rtail">${tail}</i>` : ''}</b>${
    stats ? `<span class="rstats">${stats}</span>` : ''
  }${desc ? `<span>${desc}</span>` : ''}${craft ? `<span class="rcraft">${craft}</span>` : ''}</span><span class="rm">${badges}</span></button></div>`;
}

const seg = (opts, on, small = false) =>
  `<span class="seg${small ? ' small' : ''}">${opts.map((o) => `<span${o === on ? ' class="on"' : ''}>${o}</span>`).join('')}</span>`;
const chips = (opts, on = [], cls = '') =>
  `<span class="chips">${opts.map((o) => `<span class="chip${cls ? ' ' + cls : ''}${on.includes(o) ? ' on' : ''}">${o}</span>`).join('')}</span>`;
const field = (label, body, extra = '') => `<div class="field${extra ? ' ' + extra : ''}"><span class="lbl">${label}</span>${body}</div>`;
const input = (value = '', placeholder = '') => `<input class="input" value="${esc(value)}" placeholder="${esc(placeholder)}" />`;
const native = (text) => `<div class="native"><div class="origin">artex-x.github.io</div><div>${text}</div><div class="acts"><span>Отмена</span><span class="ok">ОК</span></div></div>`;
const picked = (img, name, sub, hb = false) =>
  `<div class="picked"><img src="${img}" alt="" /><span class="nm">${hb ? HB(name) : name}<small>${sub}</small></span><button class="x" aria-label="Убрать">&times;</button></div>`;
const pickInput = (value, ph = 'Найти предмет по названию...') => `<div class="picker"><input class="input" value="${esc(value)}" placeholder="${esc(ph)}" role="combobox" /></div>`;

/* pass 3: a field with the required mark, an error or a hint under it */
const REQ = '<span class="req" aria-hidden="true">*</span>';
const rf = (label, body, { req = false, err = '', hint = '', extra = '' } = {}) =>
  `<div class="field${extra ? ' ' + extra : ''}"><span class="lbl">${label}${req ? REQ : ''}</span>${body}${err ? `<span class="ferr" role="alert">${err}</span>` : ''}${hint ? `<span class="fhint">${hint}</span>` : ''}</div>`;
const binput = (value = '', placeholder = '') => `<input class="input bad" aria-invalid="true" value="${esc(value)}" placeholder="${esc(placeholder)}" />`;
const legend = `<p class="legend">${REQ} - обязательное поле. Остальное можно заполнить позже.</p>`;
const nbox = (text, acts = '', warn = false) => `<div class="nbox${warn ? ' warn' : ''}" role="status"><span class="lead">${text}</span>${acts ? `<span class="acts">${acts}</span>` : ''}</div>`;
const SRC = 'Мастерская Ольхи';
const SECT1 = 'Пистоли';
const SECT2 = 'Холодное оружие';

/* the seed used by every mock */
const AXE = { name: 'Топор Тлеющих Углей', stats: 'Ранг 2 · Магическое · Хар. Заклинателя · Вплотную · d10+2 маг · Двуручное' };
const PISTOL = { name: 'Кремнёвый пистоль', stats: 'Ранг 1 · Физическое · Искусность · Далеко · d6+1 физ · Одноручное' };
const PISTOL2 = { name: 'Улучшенный кремнёвый пистоль', stats: 'Ранг 2 · Физическое · Искусность · Далеко · d8+2 физ · Одноручное' };
const MUSKET = { name: 'Мушкет', stats: 'Ранг 1 · Физическое · Искусность · Очень далеко · d8 физ · Двуручное' };
const BEDROLLS = ['Спальный мешок странника', 'Спальный мешок следопыта', 'Спальный мешок тишины', 'Спальный мешок из пепла', 'Тёплый спальный мешок',
  'Спальный мешок дозорного', 'Спальный мешок лекаря', 'Спальный мешок пилигрима', 'Мешок спокойных снов', 'Спальный мешок кочевника',
  'Спальный мешок у костра', 'Спальный мешок отшельника', 'Спальный мешок стража', 'Спальный мешок ловца снов', 'Последний спальный мешок'];

const hbRows = {
  pistol: row({ img: IMG + '_none.webp', name: PISTOL.name, stats: PISTOL.stats, desc: 'Заряжается ход. При выстреле в упор: +2 к урону.', badges: badge('eq-weapon', 'Основное оружие') + srcBadge('Мастерская Ольхи', true) }),
  pistol2: row({ img: IMG + '_none.webp', name: PISTOL2.name, stats: PISTOL2.stats, desc: 'Заряжается ход. При выстреле в упор: +2 к урону. Надёжное: +1 к Броскам Атаки.', badges: badge('eq-weapon', 'Основное оружие') + srcBadge('Мастерская Ольхи', true) }),
  musket: row({ img: IMG + '_none.webp', name: MUSKET.name, stats: MUSKET.stats, desc: 'Заряжается ход. Громкий: слышен в пределах Очень далёкой дистанции.', badges: badge('eq-weapon', 'Основное оружие') + badge('uniq', 'Уникальное') + srcBadge('Мастерская Ольхи', true) }),
  axe: row({ img: IMG + '_none.webp', name: AXE.name, stats: AXE.stats, desc: 'Лезвие тлеет и не гаснет под дождём.', badges: badge('eq-weapon', 'Основное оружие') + srcBadge('Хоумбрю', true) }),
  bedroll: row({ img: IMG + '_none.webp', name: BEDROLLS[0], desc: 'Во время отдыха вы очищаете Стресс и один Рану, если спите под открытым небом.', craft: `<span class="arr">&#8592;</span>Сделан из: Первоклассный Спальный Мешок`, badges: badge('item', 'Предмет') + srcBadge('Хоумбрю', true) }),
  potion: row({ img: IMG + '_none.webp', name: 'Настой кузнеца', desc: 'Выпейте перед работой у горна: до конца сцены вы не отмечаете Стресс от жара.', badges: badge('cons', 'Расходник') + srcBadge('Хоумбрю', true) }),
  cap: row({ img: IMG + '_none.webp', name: 'Whispering Cap', desc: 'Once per rest, hear one sentence spoken within Far range.', badges: badge('item', 'Предмет') + srcBadge('Хоумбрю', true) }),
  draft1: row({ img: IMG + '_none.webp', name: 'Кольцо с гравировкой', desc: 'Надпись на неизвестном языке. Тёплое на ощупь.', badges: badge('draft new', 'Черновик') + badge('item', 'Предмет') + srcBadge('Хоумбрю', true) }),
  draft2: row({ img: IMG + '_none.webp', name: 'Фляга контрабандиста', desc: '', badges: badge('draft new', 'Черновик') + badge('item', 'Предмет') + srcBadge('Хоумбрю', true) })
};
const offRows = {
  ci1: row({ img: IMG + 'ci1.webp', name: 'Первоклассный Спальный Мешок', num: 1, desc: 'Во время отдыха вы автоматически очищаете Стресс.', craft: `<span class="arr">&#8594;</span>Улучшается в: ${HB(BEDROLLS[0])} и ещё 14`, badges: badge('item', 'Предмет') + srcBadge('Основные правила') }),
  q1: row({ img: IMG + 'q1.webp', name: 'Палаш', stats: 'Ранг 1 · Физическое · Проворность · Вплотную · d8 физ · Одноручное', desc: 'Надёжное: +1 к Броскам Атаки', badges: badge('eq-weapon', 'Основное оружие') + srcBadge('Основные правила') }),
  q3: row({ img: IMG + 'q3.webp', name: 'Секира', stats: 'Ранг 1 · Физическое · Сила · Вплотную · d10+3 физ · Двуручное', badges: badge('eq-weapon', 'Основное оружие') + srcBadge('Основные правила') })
};

/* ---------------- the mocks ---------------- */
const MOCKS = [];
function mock(file, title, plan, note, screens) {
  MOCKS.push({ file, title, plan, note, screens });
}

/* m01 */
mock('m01-account-menu.html', 'The account menu with «Мои предметы»', 'plan 4.10, G27; B7.2; the `AccountMenu.svelte` menu-open golden as gm1 re-seeds',
  'The menu is R5b\'s (`AccountMenu.svelte`); R7 inserts one `<a role="menuitem">` between «Мои списки» and «Выйти», a link to `#/homebrew`. Nothing else in the header changes.',
  [{ cap: 'the header, menu open as gm1', signed: true, live: true, menu: true, on: true, body: `<div class="note">The dashed entry is the only new line. Arrow keys, Home, End and Escape work as today (the menu\'s own key handler).</div>` }]);

/* m02 */
const sectList = `<div class="sectlist new">
  <div class="sectrow"><span class="nm">${SECT1} <small>9 предметов</small></span><button class="btn sm ghost">Переименовать</button><button class="btn sm danger">Удалить</button></div>
  <div class="sectrow"><span class="nm">${SECT2} <small>4 предмета</small></span><button class="btn sm ghost">Переименовать</button><button class="btn sm danger">Удалить</button></div>
  <div class="sectrow"><span class="nm">Без раздела <small>2 предмета</small></span></div>
  <div class="numrow"><div class="grow">${input('', 'Название раздела, например Мушкеты')}</div><button class="btn sm">Добавить раздел</button></div>
</div>`;
const sourcesPanel = (withDownload = false, sectOpen = false) => `<div class="panel new">
  <span class="lbl">Источники</span>
  <div class="srcrow"><span class="who"><b>Хоумбрю</b><small>6 предметов</small></span><span class="acts">${withDownload ? '<a class="btn sm">Скачать JSON</a>' : ''}</span></div>
  <div class="srcrow"><span class="who"><b>${SRC}</b><small>15 предметов · 2 раздела</small></span><span class="acts"><button class="btn sm ghost${sectOpen ? ' on' : ''}" aria-expanded="${sectOpen}">Разделы <span class="caret"></span></button><button class="btn sm ghost">Переименовать</button>${withDownload ? '<a class="btn sm">Скачать JSON</a>' : ''}<button class="btn sm danger">Удалить</button></span>${sectOpen ? sectList : ''}</div>
  <div class="numrow" style="margin-top: 12px"><div class="grow">${input('', 'Название источника, например ' + SRC)}</div><button class="btn">Добавить</button></div>
</div>
<div class="fold new"><div class="sum">Карты <span style="color: var(--muted2); font-weight: 500">· 1 комплект, 1 карта правил</span><span class="caret"></span></div></div>`;

const homebrewHead = (count = '19 предметов из 500') => `<h1 class="page-h">Мои предметы</h1>
<p class="page-sub">Предметы, которых нет в книгах: они ищутся вместе с каталогом, попадают в таблицы и добавляются в списки.</p>
<p class="count">${count}</p>`;

mock('m02-homebrew-page.html', '#/homebrew as gm1 - sources with sections, cards, drafts first, the items by source and section', 'plan 4.10, 4.14 (F4 sections, F8 drafts; Q10, Q12); B7.2 (the download buttons and the import are R7b, m15 and m16)',
  'The management page behind the account menu. Sources are a panel (add, rename, delete, and «Разделы» per source, m19); the cards panel is folded (m21); the drafts made from a list page come first (m22); then the items as `TableRows` under one heading per source and section, each row opening the editor; a row\'s tick feeds the selection bar and R6\'s `BatchBar`. No tab is current.',
  [{ cap: '#/homebrew as gm1', signed: true, body: `${homebrewHead('21 предмет из 500')}${sourcesPanel()}
<div class="card-acts" style="margin: 16px 0 14px"><a class="btn primary new">+ Новый предмет</a><button class="btn ghost">Импорт предметов <span class="caret"></span></button></div>
<div class="batch"><span class="batch-all"><i></i>Выбрать все</span><span class="batch-summ"></span></div>
<div class="shead new">Черновики <span class="cnt">2</span></div>
<div class="rows">${hbRows.draft1}${hbRows.draft2}</div>
<div class="shead">${SRC} · ${SECT1} <span class="cnt">9</span></div>
<div class="rows">${hbRows.pistol}${hbRows.pistol2}</div>
<div class="shead">${SRC} · ${SECT2} <span class="cnt">4</span></div>
<div class="rows">${hbRows.axe.replace(srcBadge('Хоумбрю', true), srcBadge(SRC, true))}</div>
<div class="shead">${SRC} <span class="cnt">2</span></div>
<div class="rows">${hbRows.musket}</div>
<div class="shead">Хоумбрю <span class="cnt">4</span></div>
<div class="rows">${hbRows.bedroll}${hbRows.potion}${hbRows.cap}</div>
<div class="note">Existing: <code>PageHead</code>, <code>Panel</code>, <code>Field</code>, <code>Button</code>, <code>TableRows</code>/<code>RowMain</code>, <code>BatchBar</code> (R6). New: the source rows, the «Разделы» button, the cards fold, the drafts group and the «Черновик» badge, the dashed source badge, the count line. Headings: drafts first, then each source by name with its sections in the author\'s order and «без раздела» last as the source name alone, the default «Хоумбрю» last. A draft is listed once, under «Черновики». The English-only item draws its English name in Russian (the record-build fallback). A source with no items still lists (0 предметов). The «Импорт предметов» button ships in R7b.</div>` }]);

/* m03 */
mock('m03-homebrew-page-states.html', '#/homebrew - empty (gm2), signed out, unconfigured', 'plan 4.10, G30; B7.2; states `#/homebrew as gm2`, `#/homebrew`',
  'Three states of the same route.',
  [
    { cap: '#/homebrew as gm2 - no items yet', signed: true, body: `${homebrewHead('0 предметов из 500')}<div class="panel new"><span class="lbl">Источники</span>
<div class="srcrow"><span class="who"><b>Хоумбрю</b><small>0 предметов</small></span></div>
<div class="numrow" style="margin-top: 12px"><div class="grow">${input('', 'Название источника, например Мастерская Ольхи')}</div><button class="btn">Добавить</button></div></div>
<div class="card-acts" style="margin: 16px 0 14px"><a class="btn primary">+ Новый предмет</a><button class="btn ghost">Импорт предметов <span class="caret"></span></button></div>
<p class="hint" style="margin-top: 0">Своих предметов пока нет - создайте первый или импортируйте файл.</p>` },
    { cap: '#/homebrew signed out (a pasted address)', signed: false, body: `<h1 class="page-h">Мои предметы</h1><p class="page-sub">Предметы, которых нет в книгах: они ищутся вместе с каталогом, попадают в таблицы и добавляются в списки.</p>
<div class="panel"><div class="signin"><p class="signin-lead">Войдите, чтобы создавать свои предметы.</p><button class="btn primary">Войти</button></div></div>
<div class="note">The same <code>SignInPrompt</code> the lists index draws; «Войти» returns to <code>#/homebrew</code>.</div>` },
    { cap: '#/homebrew in a build with no sign-in configured', signed: false, body: `<h1 class="page-h">Предмет не найден</h1><p class="page-sub">Ссылка устарела или адрес набран неверно.</p><a class="btn primary">На главную</a>
<div class="note">The <code>#/account</code> precedent: the not-found page, the address kept, never sent home.</div>` }
  ]);

/* m04 - editor equipment */
const previewAxe = `<div class="card full"><span class="card-media"><img src="${FULL}_none.webp" alt="" /></span><div class="card-body">
<div class="card-meta">${badge('eq-weapon', 'Основное оружие')}${srcBadge('Мастерская Ольхи', true)}</div>
<h2 class="card-name">${AXE.name}</h2>
<div class="eqstats"><span>Ранг 2</span><span>Магическое</span><span>Характеристика Заклинателя</span><span>Вплотную</span><span>d10+2 маг</span><span>Двуручное</span></div>
<div class="card-desc"><p>Лезвие тлеет и не гаснет под дождём.</p><ul><li><i>Разжечь:</i> потратьте Надежду, чтобы поджечь цель в пределах Близкой дистанции.</li></ul></div>
<div class="steps"><span class="steps-l">Ранг</span><span class="step">1</span><span class="step">2</span><span class="step hb on" aria-current="true" title="${AXE.name} · хоумбрю">2</span><span class="step">3</span><span class="step">4</span></div>
<div class="craft"><p class="new"><span class="arr">&#8594;</span><span class="craft-l">Улучшается в</span><span><a class="hbname" href="#" title="Топор Пламени · хоумбрю">Топор Пламени</a>, <a class="hbname" href="#" title="Топор Пепла · хоумбрю">Топор Пепла</a></span></p><p><span class="arr">&#9679;</span><span class="craft-l">Комплект</span><span><span aria-current="true">${AXE.name}</span>, <a class="hbname" href="#">Щит Тлеющих Углей</a></span></p><p><span><i>Тлеющая пара:</i> когда оба предмета в вашей Руке, ваши атаки наносят +1 магического урона.</span></p></div>
<div class="refs"><details><summary><span class="ref-n">Неистовое опутывание</span><i class="ref-s">Мудрость · Уровень 1 · Заклинание</i></summary></details></div>
</div></div>`;

const sourceField = (book, sect) => `<div class="field twocol new"><div><span class="lbl">Источник</span><select class="input"><option>${book}</option></select></div>${sect ? `<div><span class="lbl">Раздел</span><select class="input"><option>${sect}</option></select></div>` : ''}</div>`;
const editorFormAxe = `<div class="panel">
${legend}
${field('Вид', seg(['Предмет', 'Расходник', 'Снаряжение'], 'Снаряжение') + ' ' + seg(['Основное оружие', 'Вторичное оружие', 'Броня'], 'Основное оружие'))}
${sourceField(SRC, SECT2)}
${rf('Название', input(AXE.name), { req: true })}
${rf('Описание', `<textarea class="input">Лезвие тлеет и не гаснет под дождём.
- Разжечь: потратьте Надежду, чтобы поджечь цель в пределах Близкой дистанции.</textarea><span class="fhint count">114 / 3000</span>`)}
<div class="fold new"><div class="sum">Другой язык (English) <span class="caret"></span></div></div>
${rf('Ранг', seg(['1', '2', '3', '4', 'Артефакт'], '2'), { req: true, hint: 'Как в книге - по характеристикам ранг не определяется.' })}
${rf('Класс', seg(['Физическое', 'Магическое'], 'Магическое'), { req: true })}
${rf('Характеристика', chips(['Проворность', 'Сила', 'Искусность', 'Инстинкт', 'Влияние', 'Знание', 'Характеристика Заклинателя'], ['Характеристика Заклинателя']), { req: true })}
${rf('Дистанция', seg(['Вплотную', 'Близко', 'Средне', 'Далеко', 'Очень далеко'], 'Вплотную'), { req: true })}
<div class="field twocol"><div><span class="lbl">Урон${REQ}</span>${input('d10+2', 'd8+1')}</div><div><span class="lbl">Тип урона${REQ}</span>${seg(['физ', 'маг', 'физ/маг'], 'маг')}</div></div>
${rf('Хват', seg(['Одноручное', 'Двуручное', 'Одноручное/двуручное'], 'Двуручное'), { req: true })}
<div class="fold new"><div class="sum">Второй набор характеристик <span class="caret"></span></div></div>
<fieldset class="fieldset new"><p class="lgd">Связи</p>
${field('Линия улучшений', seg(['Уникальный', 'В линии', 'Новая линия'], 'В линии') + `<div style="margin-top: 10px">${picked(IMG + 'q1.webp', 'Палаш', 'Основные правила · Ранг 1 · линия из 4 рангов')}</div>`)}
${rf('Улучшается в', `<div class="rows" style="gap: 6px">${picked(IMG + '_none.webp', 'Топор Пламени', `${SRC} · Ранг 3`, true)}${picked(IMG + '_none.webp', 'Топор Пепла', `${SRC} · Ранг 3`, true)}</div><div style="margin-top: 6px">${pickInput('', 'Добавить ещё: найти предмет...')}</div>`, { hint: 'До 8 предметов. Каждый покажет на своей карточке «Сделан из» этого.', extra: 'new' })}
${rf('Сделан из', pickInput(''), { hint: 'До 8 предметов.' })}
${field('Комплект', picked(IMG + '_none.webp', 'Тлеющая пара', 'ваш комплект · 2 предмета', true) + `<div class="card-acts" style="margin-top: 8px"><button class="btn sm ghost">Выбрать другой</button><button class="btn sm ghost">+ новый комплект</button></div>`)}
${field('Карты правил', picked(IMG + '_none.webp', 'Неистовое опутывание', 'Мудрость · Уровень 1 · Заклинание · Основные правила') + `<div class="card-acts" style="margin-top: 8px"><button class="btn sm ghost">+ ещё карта</button><button class="btn sm ghost">+ новая карта</button></div>`)}
</fieldset>
<div class="card-acts" style="margin-top: 18px"><button class="btn primary">Сохранить</button><a class="btn ghost">Отмена</a><button class="btn danger ml">Удалить</button></div>
<p class="hint">Предмет есть в 1 списке: изменения появятся в нём сразу, в том числе у игроков по ссылке.</p>
</div>`;

mock('m04-editor-equipment.html', '#/homebrew/hb_... as gm1 - the weapon editor: required marks, source and section, two upgrade targets', 'plan 4.10, 4.4, 4.5, 4.1, 4.14 (F2, F4, F5, F6; Q10, Q11); B7.2; the `#/homebrew/<axe> as gm1` golden',
  'The form beside a live `RecordCard` preview (under it at 360). Pass 3: the required mark (*) and its legend, the source and section selects side by side (m18, m19), «Улучшается в» holding two items with a picker for more (Q11), the length counter. The preview shows the marks: a dashed source badge, two dashed upgrade targets, a dashed rung on Broadsword\'s ladder, a dashed set member.',
  [{ cap: '#/homebrew/hb_seedaxeaaaaaaaaa as gm1', signed: true, body: `<h1 class="page-h">${AXE.name}</h1><p class="page-sub">Хоумбрю · ${SRC} · ${SECT2} · Ранг 2</p>
<div class="editor">${editorFormAxe}${previewAxe}</div>
<div class="note">Required for a weapon: the name (one language), tier, class, trait, range, damage, damage type, burden - every catalog weapon carries all of them. Everything under «Связи» is optional. A segmented control with a default (kind, type) carries no mark. Save stays a button (plan 4.10, Q8); leaving with unsaved changes asks (m13); the failure states are m20. The ladder on the preview draws Broadsword\'s four official rungs plus this item at tier 2, dashed and lit. <code>#/homebrew/new</code> is the same form empty, kind «Предмет», no «Удалить», no hint.</div>` }]);

/* m05 - editor loot */
const previewBedroll = `<div class="card full"><span class="card-media"><img src="${FULL}_none.webp" alt="" /></span><div class="card-body">
<div class="card-meta">${badge('item', 'Предмет')}${srcBadge('Хоумбрю', true)}</div>
<h2 class="card-name">${BEDROLLS[0]}</h2>
<div class="card-desc"><p>Во время отдыха вы очищаете Стресс и одну Рану, если спите под открытым небом.</p></div>
<div class="craft"><p><span class="arr">&#8592;</span><span class="craft-l">Сделан из</span><span><a href="#">Первоклассный Спальный Мешок</a>, <a href="#">Одеяло от Призраков</a></span></p></div>
</div></div>`;
const editorFormBedroll = `<div class="panel">
${legend}
${field('Вид', seg(['Предмет', 'Расходник', 'Снаряжение'], 'Предмет'))}
${sourceField('Хоумбрю', '')}
${rf('Название', input(BEDROLLS[0]), { req: true })}
${rf('Описание', `<textarea class="input">Во время отдыха вы очищаете Стресс и одну Рану, если спите под открытым небом.</textarea>`)}
<div class="fold new"><div class="sum open">Другой язык (English) <span class="caret"></span></div><div class="body">
${field('Name', input('', BEDROLLS[0]))}
${field('Description', `<textarea class="input" placeholder="Во время отдыха вы очищаете Стресс и одну Рану, если спите под открытым небом."></textarea>`)}
<p class="hint">Пустое поле показывает текст на другом языке.</p></div></div>
${field('Ранг', seg(['Нет', '1', '2', '3', '4', 'Артефакт', 'Проклятый'], 'Нет'))}
<fieldset class="fieldset new"><p class="lgd">Связи</p>
${field('Улучшается в', pickInput(''))}
${field('Сделан из', `<div class="rows new" style="gap: 6px">${picked(IMG + 'ci1.webp', 'Первоклассный Спальный Мешок', 'Основные правила · Предмет · Бросок 1')}${picked(IMG + 'dv34.webp', 'Одеяло от Призраков', "Dragon's Vault · Предмет · Бросок 34")}</div><div style="margin-top: 6px">${pickInput('', 'Добавить ещё: найти предмет...')}</div>`)}
${field('Комплект', `<div class="fold" style="margin: 0"><div class="sum open">+ новый комплект <span class="caret"></span></div><div class="body">
${rf('Название комплекта', input('', 'Например: Снаряжение странника'), { req: true })}
${rf('Бонус комплекта', `<textarea class="input" placeholder="Когда все предметы комплекта у вас, ..."></textarea>`, { req: true })}
<div class="card-acts"><button class="btn sm primary">Создать комплект</button><button class="btn sm ghost">Отмена</button></div>
<p class="hint">Комплект создаётся сразу и выбирается здесь; бонус хранится один раз и показывается на каждом предмете комплекта.</p></div></div>`)}
${field('Карты правил', pickInput('', 'Найти карту: заклинание, черта, противник...'))}
</fieldset>
<div class="card-acts" style="margin-top: 18px"><button class="btn primary">Сохранить</button><a class="btn ghost">Отмена</a></div>
</div>`;
mock('m05-editor-loot.html', '#/homebrew/new as gm1 - a loot item: tier, the other language, made from two items, a new set', 'plan 4.10, 4.1, 4.3, 4.14 (F6; Q11); B7.2',
  'The loot kind hides the weapon fields; «Ранг» offers none, 1-4, artifact and cursed (the catalog\'s `tier` values). Only the name is required. The second language fold is open; «Сделан из» holds two catalog items (Q11); the «+ новый комплект» fold shows the inline set card form, created at once by its own button (plan 4.14, F2).',
  [{ cap: '#/homebrew/new as gm1, the loot kind, folds open', signed: true, body: `<h1 class="page-h">Новый предмет</h1><p class="page-sub">Хоумбрю</p>
<div class="editor">${editorFormBedroll}${previewBedroll}</div>
<div class="note">«Сделан из» two catalog items writes <code>craft_from: ["ci1", "dv34"]</code> on this item; the official records are never written. On each of their cards the author then sees «Улучшается в: Спальный мешок странника» (m07). Two items here mean "either one upgrades into this", as two separate arrows, never a recipe of both.</div>` }]);

/* m06 - picker */
const pickList = `<div class="picklist static" role="listbox">
<div class="pickrow on"><img src="${IMG}ci1.webp" alt="" /><span class="nm">Первоклассный Спальный Мешок<small>Предмет · Основные правила · Бросок 1</small></span>${badge('item', 'Предмет')}</div>
<div class="pickrow"><img src="${IMG}_none.webp" alt="" /><span class="nm">${HB(BEDROLLS[0])}<small>Предмет · Хоумбрю</small></span>${badge('item', 'Предмет')}</div>
<div class="pickrow"><img src="${IMG}_none.webp" alt="" /><span class="nm">${HB(BEDROLLS[1])}<small>Предмет · Хоумбрю</small></span>${badge('item', 'Предмет')}</div>
<div class="pickrow"><img src="${IMG}_none.webp" alt="" /><span class="nm">${HB(BEDROLLS[2])}<small>Предмет · Хоумбрю</small></span>${badge('item', 'Предмет')}</div>
<div class="pickempty">Ещё 12 - уточните запрос</div></div>`;
mock('m06-item-picker.html', 'ItemPicker - typing, chosen, nothing found', 'plan 4.10 (ItemPicker.svelte, four uses in the editor); B7.2; `itemPicker.test.ts` with axe',
  'A combobox over the merged index: the text field searches with `matches` (both languages, the stat line), at most eight rows, homebrew names dashed. Enter or a click chooses; the chosen record is a row with a remove button. Escape closes the list.',
  [{ cap: 'the three states, in one panel', signed: true, body: `<div class="panel new">
${field('Сделан из - typing «спаль»', `<div class="picker"><input class="input" value="спаль" role="combobox" aria-expanded="true" /></div>${pickList}`)}
${field('Сделан из - chosen', picked(IMG + 'ci1.webp', 'Первоклассный Спальный Мешок', 'Основные правила · Предмет · Бросок 1'))}
${field('Улучшается в - nothing found', `<div class="picker"><input class="input" value="zzz" role="combobox" /></div><div class="picklist static"><div class="pickempty">Ничего не найдено</div></div>`)}
</div>
<div class="note">Keyboard: ArrowDown/ArrowUp move the highlight (<code>aria-activedescendant</code>), Enter picks, Escape closes, Backspace on a chosen row removes it. The item being edited is never offered to itself.</div>` }]);

/* m07 - record card relations */
const names15 = (n) => BEDROLLS.slice(0, n).map((b) => `<a class="hbname" href="#" title="${b} · хоумбрю">${b}</a>`).join(', ');
const ci1Card = (open) => `<h1 class="page-h">Первоклассный Спальный Мешок</h1><p class="page-sub">Основные правила · Предметы · Бросок 1<a class="itemtable" href="#">показать в таблице &#8599;</a></p>
<div class="itempage"><div class="card full"><span class="card-media"><img src="${FULL}ci1.webp" alt="" /></span><div class="card-body">
<div class="card-meta">${badge('num', '1')}${badge('item', 'Предмет')}${srcBadge('Основные правила')}</div>
<h2 class="card-name">Первоклассный Спальный Мешок</h2>
<div class="card-desc"><p>Во время отдыха вы автоматически очищаете Стресс.</p></div>
<div class="craft new"><p><span class="arr">&#8594;</span><span class="craft-l">Улучшается в</span><span>${open ? names15(15) : names15(3) + ' <button class="more" aria-expanded="false">и ещё 12</button>'}</span></p></div>
<div class="cardpick"><button class="btn sm primary">+ Добавить в список <span class="caret"></span></button><a class="btn sm">Печать</a></div>
</div></div></div>`;
mock('m07-record-card-relations.html', 'A catalog card with homebrew relations: the fold, the dashed names, a dashed rung', 'plan 4.4, 4.5 (items 3-6); B7.4; goldens `#/i/ci1 as gm1`, `#/i/q1 as gm1`, `#/i/voa4_t3d as gm1`',
  'Fifteen homebrew items made from «Первоклассный Спальный Мешок»: the card lists three and folds the rest behind «и ещё 12»; every homebrew name is dashed and titled. Only the author sees these lines - the signed-out card is byte-identical to today\'s.',
  [
    { cap: '#/i/ci1 as gm1 - the fold closed', signed: true, body: ci1Card(false) },
    { cap: '#/i/ci1 as gm1 - the fold open', signed: true, body: ci1Card(true) + `<div class="note">The fold is a button with <code>aria-expanded</code>; open, the names run on in catalogue order (official targets first, then homebrew by name). Copied text writes every target as a block, as today.</div>` },
    { cap: '#/i/q1 as gm1 - a homebrew rung on Broadsword\'s ladder; #/i/voa4_t3d as gm1 - a homebrew set member', signed: true, body: `<div class="itempage"><div class="card full"><span class="card-media"><img src="${FULL}q1.webp" alt="" /></span><div class="card-body">
<div class="card-meta">${badge('eq-weapon', 'Основное оружие')}${srcBadge('Основные правила')}</div>
<h2 class="card-name">Палаш</h2>
<div class="eqstats"><span>Ранг 1</span><span>Физическое</span><span>Проворность</span><span>Вплотную</span><span>d8 физ</span><span>Одноручное</span></div>
<div class="card-desc"><p><i>Надёжное:</i> +1 к Броскам Атаки</p></div>
<div class="steps"><span class="steps-l">Ранг</span><span class="step on" aria-current="true">1</span><span class="step">2</span><span class="step hb new" title="${AXE.name} · хоумбрю">2</span><span class="step">3</span><span class="step">4</span></div>
</div></div></div>
<div class="itempage" style="margin-top: 18px"><div class="card full"><span class="card-media"><img src="${FULL}voa4_t3d.webp" alt="" /></span><div class="card-body">
<div class="card-meta">${badge('num', '28')}${badge('eq-secondary', 'Вторичное оружие')}${srcBadge('Vault of Ages')}</div>
<h2 class="card-name">Святой Щит</h2>
<div class="eqstats"><span>Ранг 3</span><span>Магическое</span><span>Инстинкт</span><span>Вплотную</span><span>d6+3 маг</span><span>Одноручное</span></div>
<div class="card-desc"><p><i>Стоимость Призыва:</i> 1</p><p><i>Сияющая Защита:</i> +1 к Показателю Брони; когда противник промахивается по вам атакой, вы можете отметить Стресс, чтобы поразить его энергией.</p></div>
<div class="craft"><p><span class="arr">&#9679;</span><span class="craft-l">Комплект</span><span><span aria-current="true">Святой Щит</span>, <a href="#">Святой Клинок</a>, <a href="#">Святое Облачение</a>, <a class="hbname new" href="#" title="Святые Сапоги · хоумбрю">Святые Сапоги</a></span></p><p><span><i>Убранство Святого:</i> Когда все предметы этого комплекта в вашей Руке, получите +1 к Уклонению.</span></p></div>
</div></div></div>
<div class="note">The dashed rung is the axe at tier 2 beside the official tier 2; its title names the item and «хоумбрю». The set line lists the homebrew member last, dashed. A frozen copy in a viewer\'s list never adds a line to a catalog card (plan 4.4, item 6).</div>` }
  ]);

/* m08 - rows */
mock('m08-rows.html', 'Table and search rows: the relation count, the dashed source badge', 'plan 4.4, 4.2 (G12); B7.4',
  'A row draws one craft line: the first name and «и ещё N». A homebrew record\'s source badge is dashed («Хоумбрю» for the default source, the source name otherwise).',
  [{ cap: 'rows as gm1 - an official row with fifteen homebrew upgrades, a homebrew unique weapon, a homebrew item made from a catalog item', signed: true, body: `<div class="rows">${offRows.ci1}${hbRows.musket}${hbRows.bedroll}${offRows.q1}</div>
<div class="note"><code>RowMain</code> today: «Улучшается в: <name>». With many targets: the first name (dashed when homebrew) and «и ещё 14». Broadsword\'s row shows no ladder (rows never did). The badge title on hover: «Хоумбрю: ваш источник».</div>` }]);

/* m09 - tables homebrew */
const groupChips = (on, hb) => `<div class="chips" style="margin-bottom: 10px">${['Основные правила', 'Hope &amp; Fear', 'Альт. таблицы', 'Wondrous', 'Dread', 'Vault of Ages', "Dragon's Vault", 'Сообщества', 'Снаряжение', 'Прочее'].map((g) => `<span class="chip sm${g === on ? ' on' : ''}">${g}</span>`).join('')}${hb ? `<span class="chip sm new${on === 'Хоумбрю' ? ' on' : ''}">Хоумбрю</span>` : ''}</div>`;
const toolbar = (hbChip) => `<div class="toolbar"><div class="grow">${input('', 'Поиск в таблице...')}</div>${seg(['Список', 'Сетка'], 'Список', true)}${hbChip ? `<span class="chip sm new${hbChip === 'off' ? '' : ' on'}" aria-pressed="${hbChip === 'off' ? 'false' : 'true'}">Хоумбрю</span>` : ''}<button class="btn sm on">Фильтр <span class="caret"></span></button></div>`;
mock('m09-tables-homebrew.html', '#/tables/homebrew as gm1 - the homebrew table with sections; signed out', 'plan 4.6, 4.14 (G4, G5, Q2, F4, Q10); B7.4; a contract change (`TABLE_IDS`); states `#/tables/homebrew as gm1`, `#/tables/homebrew`',
  'A table page of the author\'s items, the group chip «Хоумбрю» last and drawn only signed in. One section per source, or per source and section where the source has sections (the community table\'s rule); facets `kind`, `src` (the author\'s sources) and `sect` (drawn when a section exists, Q10). Drafts sit in their source like any item, with the badge. Signed out the address parses and the body is the sign-in prompt.',
  [
    { cap: '#/tables/homebrew as gm1 - the filter panel open', signed: true, tab: 'Таблицы', body: `<h1 class="page-h">Таблицы</h1><p class="page-sub">Все записи книг по таблицам; фильтр по виду, рангу и источнику.</p>
${groupChips('Хоумбрю', true)}${toolbar('')}
<div class="panel fpanel new"><div class="frow"><span class="lbl">Вид</span>${chips(['Предметы', 'Расходники', 'Снаряжение'], [], 'sm')}</div><div class="frow"><span class="lbl">Источник</span>${chips(['Хоумбрю', SRC], [], 'sm')}</div><div class="frow"><span class="lbl">Раздел</span>${chips([SECT1, SECT2], [], 'sm')}</div></div>
<div class="shead">${SRC} · ${SECT1} <span class="cnt">9</span><span class="lnk">&#128279;</span></div>
<div class="rows">${hbRows.pistol}${hbRows.pistol2}</div>
<div class="shead">${SRC} · ${SECT2} <span class="cnt">4</span><span class="lnk">&#128279;</span></div>
<div class="rows">${hbRows.axe.replace(srcBadge('Хоумбрю', true), srcBadge(SRC, true))}</div>
<div class="shead">${SRC} <span class="cnt">2</span><span class="lnk">&#128279;</span></div>
<div class="rows">${hbRows.musket}</div>
<div class="shead">Хоумбрю <span class="cnt">6</span><span class="lnk">&#128279;</span></div>
<div class="rows">${hbRows.draft1}${hbRows.bedroll}${hbRows.potion}</div>
<div class="note"><code>#/tables/homebrew/hb_alderworkshopaaa</code> is a source\'s anchor, <code>#/tables/homebrew/hb_sectpistolsaaaaa</code> a section\'s (every homebrew key is unique per owner, so anchors never collide); <code>#/tables/homebrew/f_kind-equip.sect-hb_...</code> the filter form. A key from another account narrows to nothing, as any unknown value does today. Without Q10 the table has one section per source and no «Раздел» facet.</div>` },
    { cap: '#/tables/homebrew signed out', signed: false, tab: 'Таблицы', body: `<h1 class="page-h">Таблицы</h1><p class="page-sub">Все записи книг по таблицам; фильтр по виду, рангу и источнику.</p>
${groupChips('', false)}
<div class="panel"><div class="signin"><p class="signin-lead">Войдите, чтобы видеть свои предметы в таблицах.</p><button class="btn primary">Войти</button></div></div>
<div class="note">No «Хоумбрю» chip signed out, so the <code>#/tables</code> goldens without <code>as</code> do not move; the pasted address still opens here. Unconfigured: the not-found page.</div>` }
  ]);

/* m10 - eq tables */
mock('m10-tables-equipment.html', '#/tables/eq_weapon as gm1 - homebrew equipment in the tier sections, the source facet, the «Хоумбрю» chip', 'plan 4.6 (G2, G5, G6, item 11); B7.4; goldens `#/tables/eq_weapon as gm1` on and off',
  'Own equipment joins `allEquip`: it sits in its tier section beside the books\' weapons. The `src` facet gains «Хоумбрю» and each source after the fixed books and frames. The memory-only chip «Хоумбрю» (pressed = shown) hides own records for this visit; it is not in the address.',
  [
    { cap: '#/tables/eq_weapon as gm1 - the chip pressed, the source facet open', signed: true, tab: 'Таблицы', body: `<h1 class="page-h">Таблицы</h1><p class="page-sub">Все записи книг по таблицам; фильтр по виду, рангу и источнику.</p>
${groupChips('Снаряжение', true)}<div class="chips" style="margin-bottom: 12px">${chips(['Основное оружие', 'Вторичное оружие', 'Броня'], ['Основное оружие'], 'sm')}</div>
${toolbar('on')}
<div class="panel fpanel"><div class="frow"><span class="lbl">Ранг</span>${chips(['1', '2', '3', '4'], [], 'sm')}</div>
<div class="frow"><span class="lbl">Источник</span><span class="chips">${['Основные правила', 'Hope &amp; Fear', 'Wondrous', 'Vault of Ages', "Dragon's Vault", 'Beast Feast', 'Colossus', 'Dark Heart'].map((s) => `<span class="chip sm">${s}</span>`).join('')}<span class="chip sm new">Хоумбрю</span><span class="chip sm new">Мастерская Ольхи</span></span></div>
<div class="frow"><span class="lbl">Класс</span>${chips(['Физическое', 'Магическое'], [], 'sm')}</div></div>
<div class="shead">Ранг 1 <span class="cnt">99</span></div>
<div class="rows">${offRows.q1}${offRows.q3}${hbRows.pistol}${hbRows.musket}</div>
<div class="shead">Ранг 2 <span class="cnt">98</span></div>
<div class="rows">${row({ img: IMG + 'q1.webp', name: 'Улучшенный Палаш', stats: 'Ранг 2 · Физическое · Проворность · Вплотную · d8+3 физ · Одноручное', desc: 'Надёжное: +1 к Броскам Атаки', badges: badge('eq-weapon', 'Основное оружие') + srcBadge('Основные правила') })}${hbRows.pistol2}${hbRows.axe}</div>` },
    { cap: '#/tables/eq_weapon as gm1 - the chip off: the books alone', signed: true, tab: 'Таблицы', body: `<h1 class="page-h">Таблицы</h1><p class="page-sub">Все записи книг по таблицам; фильтр по виду, рангу и источнику.</p>
${groupChips('Снаряжение', true)}<div class="chips" style="margin-bottom: 12px">${chips(['Основное оружие', 'Вторичное оружие', 'Броня'], ['Основное оружие'], 'sm')}</div>
${toolbar('off')}
<div class="shead">Ранг 1 <span class="cnt">95</span></div>
<div class="rows">${offRows.q1}${offRows.q3}</div>
<div class="shead">Ранг 2 <span class="cnt">96</span></div>
<div class="rows">${row({ img: IMG + 'q1.webp', name: 'Улучшенный Палаш', stats: 'Ранг 2 · Физическое · Проворность · Вплотную · d8+3 физ · Одноручное', desc: 'Надёжное: +1 к Броскам Атаки', badges: badge('eq-weapon', 'Основное оружие') + srcBadge('Основные правила') })}</div>
<div class="note">Off, own records leave <code>allEquip</code> and <code>searchable</code> for the tables and search of this visit; the source facet loses the homebrew values (the presence filter). The chip is drawn only while the account holds at least one item, so the signed-out toolbar does not move.</div>` }
  ]);

/* m11 - search */
mock('m11-search.html', '#/search as gm1 - one merged result list, the «Хоумбрю» chip', 'plan 4.6 (G8, item 11); B7.4; goldens `#/search ~ спальн as gm1`',
  'One list, official rows first, the cap of 300 over all; the tag tells them apart. Pass 1\'s separate «Мои предметы» group is dropped: first-class means the same rows. The chip beside the kinds hides own records for this visit.',
  [{ cap: '#/search as gm1, query «спальн»', signed: true, tab: 'Поиск', body: `<h1 class="page-h">Поиск</h1><p class="page-sub">По названиям, описаниям и характеристикам, на обоих языках сразу.</p>
<div class="panel" style="margin-bottom: 16px"><div class="field">${input('спальн')}</div><div class="field"><span class="lbl">Фильтр</span><span class="chips">${chips(['Предметы', 'Расходники', 'Снаряжение'], ['Предметы', 'Расходники', 'Снаряжение']).slice(20, -7)}<span class="chip on new" aria-pressed="true">Хоумбрю</span></span></div></div>
<div class="rows">${offRows.ci1}${hbRows.bedroll}${row({ img: IMG + '_none.webp', name: BEDROLLS[1], desc: 'Во время отдыха вы можете совершить Бросок Инстинкта (12), чтобы услышать приближение врага.', craft: '<span class="arr">&#8592;</span>Сделан из: Первоклассный Спальный Мешок', badges: badge('item', 'Предмет') + srcBadge('Хоумбрю', true) })}</div>
<div class="note">Signed out: no chip, today\'s list - the search goldens without <code>as</code> do not move. The <code>hayFor</code> cache is derived from the index, so an edited item is re-folded.</div>` }]);

/* m12 - record page hb */
mock('m12-record-page.html', '#/i/hb_... as gm1 - an own item\'s page: the path line, two upgrade targets, the table link, «Изменить»', 'plan 4.2, 4.10, 4.14 (G9, G13, G14, F4, F6); B7.2 (print: B7.3); golden `#/i/hb_seed... as gm1`',
  'The sub line is the path «Хоумбрю · Мастерская Ольхи · Пистоли · Ранг 1» (the community rule: group, then the source and section leaves); «показать в таблице» opens `#/tables/homebrew` at the section\'s anchor; the pick row gains «Изменить». The print card\'s source line reads the same path. The pistol upgrades to two own items (Q11).',
  [{ cap: '#/i/hb_flintlockpistola as gm1', signed: true, body: `<h1 class="page-h">${PISTOL.name}</h1><p class="page-sub">Хоумбрю · ${SRC} · ${SECT1} · Ранг 1<a class="itemtable" href="#">показать в таблице &#8599;</a></p>
<div class="itempage"><div class="card full"><span class="card-media"><img src="${FULL}_none.webp" alt="" /></span><div class="card-body">
<div class="card-meta">${badge('eq-weapon', 'Основное оружие')}${srcBadge('Мастерская Ольхи', true)}</div>
<h2 class="card-name">${PISTOL.name}</h2>
<div class="eqstats"><span>Ранг 1</span><span>Физическое</span><span>Искусность</span><span>Далеко</span><span>d6+1 физ</span><span>Одноручное</span></div>
<div class="card-desc"><p><i>Заряжается:</i> после выстрела потратьте ход, чтобы перезарядить.</p><p><i>В упор:</i> +2 к урону по цели Вплотную.</p></div>
<div class="steps"><span class="steps-l">Ранг</span><span class="step hb on" aria-current="true">1</span><span class="step hb" title="${PISTOL2.name} · хоумбрю">2</span></div>
<div class="craft new"><p><span class="arr">&#8594;</span><span class="craft-l">Улучшается в</span><span><a class="hbname" href="#" title="Двуствольный пистоль · хоумбрю">Двуствольный пистоль</a>, <a class="hbname" href="#" title="Пистоль дуэлянта · хоумбрю">Пистоль дуэлянта</a></span></p><p><span class="arr">&#8592;</span><span class="craft-l">Сделан из</span><a href="#">Арбалет</a></p></div>
<div class="refs"><details open><summary><span class="ref-n">Перезарядка</span><i class="ref-s">Правило Мастерской Ольхи</i></summary><p class="ref-t">После выстрела потратьте ход, чтобы перезарядить оружие.</p></details></div>
<div class="cardpick"><button class="btn sm primary">+ Добавить в список <span class="caret"></span></button><a class="btn sm">Печать</a><a class="btn sm new">Изменить</a></div>
</div></div></div>
<div class="note">A homebrew line of its own: two dashed rungs, this one lit. The upgrade line and the craft links are separate relations: the rungs are the tiers of one weapon, «Улучшается в» names other items. Two targets draw in one line, the fold starts past three (m07). The own rule card «Перезарядка» opens as the catalog\'s cards do (m21). Copy link and share carry the app address <code>#/i/hb_...</code> (no stub page exists); copy image is hidden until R8 gives the item a picture. Signed out or in another account this address draws «Предмет не найден». Print card source line (text): «Хоумбрю · Мастерская Ольхи · Пистоли»; a default-source item prints «Хоумбрю».</div>` }]);

/* m13 - dialogs */
mock('m13-dialogs.html', 'The confirms: delete an item, a source, a section, a card, a set; leave with unsaved changes', 'plan 4.10, 4.12, 4.14 (Q8, F4, F7); B7.2; states with the driver answering the confirm',
  '`env.dialog.confirm`, the dialog a list delete already uses. Each delete confirm counts what the delete touches: the owner\'s lists holding a reference, the own items whose relations name the item, the items in a source or section, the items that name a card or a set.',
  [{ cap: 'six confirms', signed: true, body: `${native('Предмет «Кремнёвый пистоль» есть в 2 списках и указан в 1 связи. Удалить его и убрать из списков? Отменить нельзя.')}
${native('Удалить источник «Мастерская Ольхи»? Его 15 предметов останутся как «Хоумбрю».')}
${native('Удалить раздел «Пистоли»? Его 9 предметов останутся в источнике «Мастерская Ольхи» без раздела.')}
${native('Удалить карту правил «Перезарядка»? Она указана в 3 предметах - там она пропадёт.')}
${native('Удалить комплект «Тлеющая пара»? 2 предмета перестанут быть комплектом.')}
${native('Изменения не сохранены. Уйти со страницы?')}
<div class="note">Line 1: <code>plural</code> for списках and связи; an item in no list and no relation asks «Удалить предмет «%s»? Отменить нельзя.». On OK the item is deleted, the database removes its references, the other items keep their key to it (not drawn), the page returns to <code>#/homebrew</code> with a toast and no undo (decision 30). Lines 2-3: a source or section delete keeps its items. Lines 4-5: a card or set delete keeps its key on the items, which draw nothing for it; a card or set named by no item asks the short form «Удалить карту правил «%s»?». Line 6: the unsaved-changes guard on an in-app navigation; closing the tab gets the browser\'s own <code>beforeunload</code> prompt.</div>` }]);

/* m14 - lists */
const listRow = (r, tail) => r.replace('</b>', `${tail ? `<i class="rtail">${tail}</i>` : ''}</b>`);
mock('m14-lists.html', 'An own list with a reference; another account\'s list with a frozen copy', 'plan 4.8 (G15-G18, G20); B7.3; goldens `#/lists/<uuid(101)> as gm1`, `#/lists/<uuid(201)> as gm2`, `#/s/player-token-1` move',
  'The row of a homebrew entry looks the same in both: the difference is where the record comes from. In the owner\'s list it is the live item (an edit redraws it and every open shared page); in `gm2`\'s list it is the entry\'s own frozen snapshot, which never changes.',
  [
    { cap: '#/lists/<uuid(101)> as gm1 - «Лавка кузнеца», the axe as a live reference', signed: true, body: `<h1 class="page-h">Лавка кузнеца</h1><p class="page-sub">10 позиций · Сохранено</p>
<div class="card-acts" style="margin-bottom: 14px"><button class="btn sm">Поделиться <span class="caret"></span></button><button class="btn sm">Печать</button><button class="btn sm">Копировать</button><button class="btn sm">Скачать JSON</button></div>
<div class="batch"><span class="batch-all"><i></i>Выбрать все</span><span class="batch-summ"></span></div>
<div class="rows">${listRow(row({ img: IMG + 'ci1.webp', name: 'Первоклассный Спальный Мешок', desc: 'Во время отдыха вы автоматически очищаете Стресс.', badges: badge('item', 'Предмет') + srcBadge('Основные правила') }), '&times;2 · 150 монет')}${row({ img: IMG + 'q1.webp', name: 'Палаш', stats: 'Ранг 1 · Физическое · Проворность · Вплотную · d8 физ · Одноручное', badges: badge('eq-weapon', 'Основное оружие') + srcBadge('Основные правила') })}${listRow(hbRows.axe, '800 монет')}</div>
<div class="note">The axe row is <code>source: homebrew, snapshot: null</code>; the page resolves it through <code>withRecords(app.index, own, snapshots)</code>. The modal from it carries «Изменить». Copy list text and the print button work over the same index. R4\'s Requests panel names a line\'s item through the list\'s index too, so a frozen copy the owner saved from someone else\'s link still shows its name (G19).</div>` },
    { cap: '#/lists/<uuid(201)> as gm2 - a frozen copy after «Сохранить себе»', signed: true, body: `<h1 class="page-h">Список второго ГМа</h1><p class="page-sub">2 позиции · Сохранено</p>
<div class="rows">${row({ img: IMG + 'q14.webp', name: 'Арбалет', stats: 'Ранг 1 · Физическое · Искусность · Далеко · d6+1 физ · Одноручное', badges: badge('eq-weapon', 'Основное оружие') + srcBadge('Основные правила') })}${hbRows.axe}</div>
<div class="note"><code>gm2</code> holds no such item: the row draws from the entry\'s snapshot, which embeds the source name and the cards the card needs (the set bonus, the referenced card). The modal has no «Изменить». <code>gm1</code>\'s later edits never reach it. On <code>#/s/player-token-1</code> the same axe draws live, signed out too: the projection fills the reference from the item.</div>` }
  ]);

/* m15 - import items */
const importPanel = (state) => {
  const head = `<div class="panel"><div class="field"><span class="lbl">Импорт предметов из файла JSON</span><div class="card-acts"><label class="btn sm">Выбрать файл...</label>${state === 'empty' ? '' : `<span class="fname">alder-workshop.json</span>`}</div>`;
  if (state === 'empty') return `${head}<p class="hint">Файл в формате <a href="#">homebrew-v1</a> (<a href="#">описание для ИИ-помощников</a>): источники, комплекты, карты правил и предметы. Существующие предметы можно пропустить или обновить.</p></div></div>`;
  const where = (name, count, opts, on, hint) => `<div class="srcrow new"><span class="who"><b>${name}</b><small>${count}</small></span><span class="acts" style="flex: 1 1 220px"><select class="input" aria-label="Куда: ${name}">${opts.map((o) => `<option${o === on ? ' selected' : ''}>${o}</option>`).join('')}</select></span>${hint ? `<span class="fhint" style="flex-basis: 100%; margin-top: 0">${hint}</span>` : ''}</div>`;
  if (state === 'preview') return `${head}<p class="preview">Источников: <b>1</b>, разделов: <b>2</b>, карт: <b>2</b>, предметов: <b>23</b>.</p>
<div class="field" style="margin-top: 12px"><span class="lbl">Куда положить предметы</span>
${where(SRC, '19 предметов', ['Новый источник «' + SRC + '»', 'В «Хоумбрю»'], 'Новый источник «' + SRC + '»', 'Источник создастся вместе с 2 разделами.')}
${where('Без источника', '4 предмета', ['В «Хоумбрю»', 'В «' + SRC + '» (новый)', 'Новый источник...'], 'В «Хоумбрю»', '')}</div>
<div class="card-acts" style="margin-top: 12px"><button class="btn sm primary">Импортировать (23)</button><button class="btn sm ghost">Отмена</button></div></div></div>`;
  if (state === 'again') return `${head}<p class="preview">Источников: <b>1</b>, карт: <b>2</b>, предметов: <b>25</b>. Уже есть в аккаунте: <b>23</b> - этот файл уже импортировали.</p>
<div class="field" style="margin-top: 12px"><span class="lbl">Куда положить предметы</span>
${where(SRC, '25 предметов', ['В «' + SRC + '» (уже есть)', 'Новый источник «' + SRC + ' 2»', 'В «Хоумбрю»'], 'В «' + SRC + '» (уже есть)', 'Ключ источника совпал с вашим: предметы попадут в него.')}</div>
<div class="field" style="margin-top: 12px"><span class="lbl">Существующие предметы, карты и источники</span>${seg(['Пропустить', 'Обновить'], 'Обновить')}</div>
<div class="card-acts" style="margin-top: 12px"><button class="btn sm primary">Импортировать (25)</button><button class="btn sm ghost">Отмена</button></div>
<p class="hint">«Обновить» заменяет текст и характеристики 23 существующих предметов и названия источника и карт; ссылки на них в списках остаются живыми, замороженные копии не меняются. 2 новых предмета добавятся.</p></div></div>`;
  if (state === 'name') return `${head}<p class="preview">Источников: <b>1</b>, предметов: <b>12</b>. Уже есть в аккаунте: <b>0</b>.</p>
<div class="field" style="margin-top: 12px"><span class="lbl">Куда положить предметы</span>
${where(SRC, '12 предметов', ['В «' + SRC + '» (уже есть)', 'Новый источник «' + SRC + ' 2»', 'В «Хоумбрю»'], 'В «' + SRC + '» (уже есть)', 'Источник с таким названием уже есть, но ключ другой (файл сделан заново). По умолчанию предметы попадут в ваш источник.')}</div>
<div class="card-acts" style="margin-top: 12px"><button class="btn sm primary">Импортировать (12)</button><button class="btn sm ghost">Отмена</button></div></div></div>`;
  if (state === 'refused') return `${head}<div class="errs"><b>В файле ошибки - ничего не импортировано. Исправьте их и выберите файл снова.</b><ul>
<li>Предмет 3, «Мушкет»: <code>eq.dmg</code> «2d8» - урон записывается как d8 или d10+2</li>
<li>Предмет 7: обязательное поле отсутствует - <code>en</code> или <code>ru</code></li>
<li>Предмет 12, «Пороховница»: <code>refs</code> - больше 3 элементов</li></ul>
<p>Путь в файле: <code>items[2].eq.dmg</code>, <code>items[6]</code>, <code>items[11].refs</code>.</p></div></div></div>`;
  return `${head}</div></div>`;
};
mock('m15-import-items.html', '#/homebrew as gm1 - «Импорт предметов»: empty, first import, the same file again, a same-name source, refused, done', 'plan 4.11, 4.14 (item 8, F3; Q7, Q9); B7b.2; R6\'s import panel pattern (`ImportPanel`)',
  'R6\'s panel over the `homebrew-v1` format: choose a file, the client validates it against the schema with paths; the preview counts sources, sections, cards and items and names how many keys the account already holds. Sources are created automatically (F3, Q9): each source of the file, and the items with no source, get a «Куда» select whose default is the held key, then a same-name source, then a new source; the client rewrites `book` before the call. A `Seg` chooses skip or update for held keys (Q7). One press sends `import_homebrew`, all or nothing.',
  [
    { cap: 'the panel open, no file', signed: true, body: `${homebrewHead()}<div class="card-acts" style="margin: 0 0 14px"><a class="btn primary">+ Новый предмет</a><button class="btn ghost on" aria-expanded="true">Импорт предметов <span class="caret"></span></button></div><div class="new">${importPanel('empty')}</div>` },
    { cap: 'first import: the source is new, four items have no source', signed: true, body: `${homebrewHead()}<div class="card-acts" style="margin: 0 0 14px"><a class="btn primary">+ Новый предмет</a><button class="btn ghost on" aria-expanded="true">Импорт предметов <span class="caret"></span></button></div><div class="new">${importPanel('preview')}</div>
<div class="note">No held key, so no skip-or-update choice. The «Без источника» row lists the account\'s sources, the file\'s new ones and «Новый источник...» (which reveals a name field, m18\'s pattern). A file with no <code>books</code> at all shows only that row.</div>` },
    { cap: 'the same file again, edited: the held source, skip or update', signed: true, body: `${homebrewHead()}<div class="card-acts" style="margin: 0 0 14px"><a class="btn primary">+ Новый предмет</a><button class="btn ghost on" aria-expanded="true">Импорт предметов <span class="caret"></span></button></div><div class="new">${importPanel('again')}</div>` },
    { cap: 'a regenerated file: a new key, a source of the same name', signed: true, body: `${homebrewHead()}<div class="card-acts" style="margin: 0 0 14px"><a class="btn primary">+ Новый предмет</a><button class="btn ghost on" aria-expanded="true">Импорт предметов <span class="caret"></span></button></div><div class="new">${importPanel('name')}</div>
<div class="note">An agent that converts the same supplement twice writes new keys; matching by name keeps one source. The items themselves have new keys too, so they are added, not updated - the preview says «Уже есть: 0».</div>` },
    { cap: 'a refused file: the errors with their paths', signed: true, body: `${homebrewHead()}<div class="card-acts" style="margin: 0 0 14px"><a class="btn primary">+ Новый предмет</a><button class="btn ghost on" aria-expanded="true">Импорт предметов <span class="caret"></span></button></div><div class="new">${importPanel('refused')}</div>` },
    { cap: 'imported: the panel folded, the new source first, the toast', signed: true, body: `${homebrewHead('42 предмета из 500')}<div class="card-acts" style="margin: 0 0 14px"><a class="btn primary">+ Новый предмет</a><button class="btn ghost">Импорт предметов <span class="caret"></span></button></div>
<div class="shead">${SRC} · ${SECT1} <span class="cnt">9</span></div><div class="rows">${hbRows.pistol}${hbRows.pistol2}</div>
<div class="toast">Импортировано: 23 предмета, создан 1 источник</div>
<div class="note">A refused limit («Достигнут предел своих предметов: 500») leaves the preview on screen; a network failure too, and the next press resends the same rows (the ids are made once per file).</div>` }
  ]);

/* m16 - export */
mock('m16-export.html', 'The download surfaces on #/homebrew and the account page\'s hint', 'plan 4.11 (G22, G26); B7b.2; R6\'s zip (`lib/zip.ts`) gains `homebrew.json`',
  'Three ways to a `homebrew-v1` file: one source («Скачать JSON» on its row), a selection (the batch bar), everything (the account\'s zip). The account page\'s control does not change; its hint names the second file.',
  [
    { cap: '#/homebrew as gm1 - three items ticked', signed: true, body: `${homebrewHead()}${sourcesPanel(true)}
<div class="card-acts" style="margin: 16px 0 14px"><a class="btn primary">+ Новый предмет</a><button class="btn ghost">Импорт предметов <span class="caret"></span></button></div>
<div class="batch on"><span class="batch-all"><i></i>Выбрать все</span><span class="batch-summ">Выбрано 3 предмета</span><span class="batch-acts"><button class="btn sm new">Скачать JSON (3)</button><button class="btn sm danger">Удалить (3)</button></span></div>
<div class="shead">Мастерская Ольхи <span class="cnt">15</span></div>
<div class="rows">${hbRows.pistol.replace('class="row"', 'class="row sel"')}${hbRows.pistol2.replace('class="row"', 'class="row sel"')}${hbRows.musket.replace('class="row"', 'class="row sel"')}</div>
<div class="note">A selection\'s file carries the items, the sources and the cards they name. File names: <code>alder-workshop.json</code> for a source, <code>daggerheart-loot-homebrew-<date>.json</code> for a selection. «Удалить (3)» is R7\'s (<code>B7.2</code>), the download R7b\'s.</div>` },
    { cap: '#/account as gm1 - «Ваши данные»', signed: true, body: `<h1 class="page-h">Аккаунт</h1><p class="page-sub">Вы вошли как gm1@example.test</p>
<div class="panel"><span class="lbl">Ваши данные</span><div class="row-btns"><button class="btn">Скачать мои данные (ZIP)</button></div>
<p class="hint new">Всё, что хранится в аккаунте, одним архивом ZIP: файл lists.json с вашими списками и homebrew.json с вашими предметами, источниками и картами. Импорт принимает до 50 списков, а в одном списке позиций - не больше 100.</p></div>
<div class="note">R6\'s control, one sentence longer. The zip stays store-only with one root file per kind (R6 4.14); a R6-era build reading this zip names <code>homebrew.json</code> as a file it does not read and imports the lists.</div>` }
  ]);

/* m17 - llms and file */
const FILE_EXAMPLE = `{
  "$schema": "https://artex-x.github.io/daggerheart-loot/schema/homebrew-v1.json",
  "format": "daggerheart-loot/homebrew",
  "version": 1,
  "books": [
    { "key": "hb_alderworkshopaaa", "ru": "Мастерская Ольхи", "en": "Alder Workshop",
      "sections": [
        { "key": "hb_sectpistolsaaaaa", "ru": "Пистоли", "en": "Pistols" },
        { "key": "hb_sectbladesaaaaaa", "ru": "Холодное оружие", "en": "Blades" }
      ] }
  ],
  "cards": [
    { "key": "hb_setemberpairaaaa", "kind": "set", "book": "hb_alderworkshopaaa",
      "ru": "Тлеющая пара", "en": "Ember Pair",
      "rud": "Когда оба предмета в вашей Руке, ваши атаки наносят +1 магического урона.",
      "ende": "While both are in your loadout, your attacks deal +1 magic damage." },
    { "key": "hb_refreloadaaaaaaa", "kind": "ref", "book": "hb_alderworkshopaaa",
      "ru": "Перезарядка", "rusub": "Правило Мастерской Ольхи", "en": "Reload", "ensub": "Alder Workshop rule",
      "rud": "После выстрела потратьте ход, чтобы перезарядить оружие.",
      "ende": "After a shot, spend an action to reload the weapon." }
  ],
  "items": [
    { "key": "hb_flintlockpistola", "book": "hb_alderworkshopaaa", "section": "hb_sectpistolsaaaaa", "kind": "equip",
      "ru": "Кремнёвый пистоль", "en": "Flintlock Pistol",
      "rud": "Заряжается: после выстрела потратьте ход.\\nВ упор: +2 к урону по цели Вплотную.",
      "ende": "Reload: after a shot, spend an action.\\nPoint blank: +2 damage to a Melee target.",
      "eq": { "t": "weapon", "tier": 1, "cls": "phy", "tr": "finesse", "rg": "far", "dmg": "d6+1", "dt": "phy", "bu": 1,
              "line": "hb_flintlockpistola" },
      "refs": ["hb_refreloadaaaaaaa"] },
    { "key": "hb_flintlockpistolb", "book": "hb_alderworkshopaaa", "section": "hb_sectpistolsaaaaa", "kind": "equip",
      "ru": "Улучшенный кремнёвый пистоль", "en": "Improved Flintlock Pistol",
      "rud": "Заряжается: после выстрела потратьте ход.\\nВ упор: +2 к урону.\\nНадёжное: +1 к Броскам Атаки.",
      "eq": { "t": "weapon", "tier": 2, "cls": "phy", "tr": "finesse", "rg": "far", "dmg": "d8+2", "dt": "phy", "bu": 1,
              "line": "hb_flintlockpistola" } },
    { "key": "hb_bedrollwanderera", "kind": "item",
      "ru": "Спальный мешок странника",
      "rud": "Во время отдыха вы очищаете Стресс и одну Рану, если спите под открытым небом.",
      "craft_from": ["ci1", "dv34"] }
  ]
}`;
const LLMS_OUTLINE = `## Homebrew items as a file (homebrew-v1)

What it is: the way to bring a supplement or your own items into an account.
A signed-in GM imports the file with «Импорт предметов» / "Import items" on
#/homebrew. The file's sources and sections are created with the items; the
preview lets the GM put a source's items into an existing source instead.
An item whose key the account already holds is skipped, or updated when the
GM chooses so. The same format is written by «Скачать JSON» on a source or
a selection, and as homebrew.json inside «Скачать мои данные (ZIP)».

Schema: https://artex-x.github.io/daggerheart-loot/schema/homebrew-v1.json -
every key and value is checked; a key the schema does not name is an error.

A complete file: (the JSON block on the left)

The objects and their fields: books (key, ru, en, sections [{key, ru, en}]);
cards (key, kind set|ref, book, ru, en, rud, ende; a ref adds rusub, ensub,
url); items (key, book, section, kind item|consumable|equip, ru, en, rud,
ende, tier 1-4|A|C on loot, eq {t, tier 1-4|A, cls, tr, rg, dmg, dt, bu, as,
th, line, alt}, craft, craft_from, set, refs) - the field names of
data.json, so copy the shapes from a catalog record. Two differ: craft and
craft_from are lists here (up to 8 ids each; a single id string is read as
a list of one), because a homebrew item may upgrade into several items.

Required: one name (ru or en) on every object; for equip, eq.t and eq.tier,
and for a weapon cls, tr, rg, dmg, dt, bu; for armour as and th; a set's
bonus text and a ref card's text. Everything else is optional.

Rules: a key is hb_ plus 16 characters of a-z and 2-7, unique in the file;
relations name a key of this file or a catalog id from catalog.csv; a
section names a section of the item's own book; tiers come from the book,
never from the stats; damage is d4-d20 with an optional +N; at most 3 refs;
an account holds up to 20 sources (30 sections each), 100 cards and 500
items; a file that would pass a limit imports nothing. A draft mark is not
part of the file.

Lists as a file (import-v1): a list may now carry an entry with
"source": "homebrew" and a "snapshot" (version 2, schema import-v2.json).
A file never carries a bare reference. Version 1 files keep importing.`;
mock('m17-llms-and-file.html', 'The homebrew-v1 file and the llms.txt section, as text', 'plan 4.11, 4.14 (G24, F4, F5, F6); B7b.1; the blind round is the proof',
  'The example file `B7b.1` writes to `docs/fixtures/homebrew/example.json` and verbatim into `llms.txt`, and the section\'s content outline. Field names are `data.json`\'s, so an agent that read a catalog record can write an item.',
  [{ cap: 'text', text: true, body: `<div class="pair" style="padding: 0; margin: 0"><section class="frame textframe"><span class="cap">docs/fixtures/homebrew/example.json</span><pre class="llms">${esc(FILE_EXAMPLE)}</pre></section><section class="frame textframe"><span class="cap">llms.txt - the section outline (B7b.1 writes the prose)</span><pre class="llms">${esc(LLMS_OUTLINE)}</pre></section></div>` }]);

/* ---------------- pass 3: the owner's mock feedback (plan 4.14) ---------------- */

/* m18 - inline source creation */
const formTop = (srcBody, extra = '') => `<div class="panel">
${legend}
${field('Вид', seg(['Предмет', 'Расходник', 'Снаряжение'], 'Снаряжение') + ' ' + seg(['Основное оружие', 'Вторичное оружие', 'Броня'], 'Основное оружие'))}
${srcBody}
${rf('Название', input(PISTOL.name), { req: true })}
${extra}
<p class="hint">... the rest of the form as m04.</p>
</div>`;
const selOpen = (label, opts, on, add) => `<div class="field new"><span class="lbl">${label}</span><select class="input"><option>${on}</option></select><div class="selopen" role="listbox">${opts.map((o) => `<span${o === on ? ' class="on"' : ''}>${o}</span>`).join('')}<span class="sep on">${add}</span></div></div>`;
const newSrcField = (value, err = '') => `<div class="field new"><span class="lbl">Источник</span><div class="numrow"><div class="grow">${err ? binput(value, 'Название нового источника') : input(value, 'Название нового источника')}</div><button class="btn primary">Создать</button><button class="btn ghost">Отмена</button></div>${err ? `<span class="ferr" role="alert">${err}</span>` : '<span class="fhint">Источник создаётся сразу и выбирается здесь. Переименовать или удалить его можно на странице «Мои предметы».</span>'}</div>`;
mock('m18-editor-source-inline.html', 'The editor: a new source from the source select', 'plan 4.14 (F2); B7.2; states `#/homebrew/new as gm1` with the select on «+ Новый источник...»',
  'The source select ends with «+ Новый источник...». Choosing it swaps the select for a name field with «Создать» and «Отмена»; «Создать» writes the source at once (one awaited write, the same store call as the panel on `#/homebrew`) and selects it. The item itself is written only by «Сохранить». The section select (m19) follows the same pattern.',
  [
    { cap: 'the source select open', signed: true, body: `<h1 class="page-h">Новый предмет</h1><p class="page-sub">Хоумбрю</p>${formTop(selOpen('Источник', ['Хоумбрю', SRC], 'Хоумбрю', '+ Новый источник...'))}
<div class="note">A native <code>&lt;select&gt;</code>, drawn here as the browser\'s list. The last option is a command, not a source: choosing it never becomes the value.</div>` },
    { cap: 'after «+ Новый источник...»: the name field', signed: true, body: `<h1 class="page-h">Новый предмет</h1><p class="page-sub">Хоумбрю</p>${formTop(newSrcField('Туманный берег'))}
<div class="note">Focus moves into the name field. Enter creates, Escape or «Отмена» brings the select back with its previous value. The name is 1 to 80 characters in the UI language (the other language can be added on <code>#/homebrew</code>).</div>` },
    { cap: 'created: the new source selected, the section select appears', signed: true, body: `<h1 class="page-h">Новый предмет</h1><p class="page-sub">Хоумбрю · Туманный берег</p>${formTop(sourceField('Туманный берег', 'Без раздела'))}
<div class="toast">Источник «Туманный берег» создан</div>
<div class="note">The section select appears once a named source is chosen: «Без раздела», the source\'s sections, «+ Новый раздел...». The default «Хоумбрю» has no sections. If the author then leaves with «Отмена», the new source stays, empty, on <code>#/homebrew</code> (0 предметов) - one write per press, never a hidden second write on «Сохранить».</div>` },
    { cap: 'refusals under the name field', signed: true, body: `<div class="panel">${newSrcField(SRC, `Источник «${SRC}» уже есть - выберите его в списке.`)}${newSrcField('', 'Введите название источника.')}${newSrcField('Туманный берег', 'Достигнут предел источников: 20. Удалите ненужный на странице «Мои предметы».')}${newSrcField('Туманный берег', 'Не удалось создать источник - проверьте соединение и нажмите «Создать» ещё раз.')}</div>
<div class="note">Four failures, one line each, under the field with <code>role="alert"</code>; the typed name stays. The duplicate check compares names without case in the client (the database does not index names); the limit is the <code>homebrew_books_per_owner</code> trigger\'s refusal; the network line is the store\'s failed write.</div>` }
  ]);

/* m19 - sections inside a source */
const newSectField = (value) => `<div class="field new"><span class="lbl">Раздел</span><div class="numrow"><div class="grow">${input(value, 'Название нового раздела')}</div><button class="btn primary">Создать</button><button class="btn ghost">Отмена</button></div><span class="fhint">Раздел создаётся в источнике «${SRC}».</span></div>`;
mock('m19-sections.html', 'Sections inside a source: the source panel, the section select', 'plan 4.14 (F4, Q10); B7.2 (the table\'s sections and the `sect` facet: B7.4, m09)',
  'A section groups items inside one named source, as the community table groups by community. Sections are managed under their source on `#/homebrew` (add, rename, delete) and chosen in the editor. They head the items on `#/homebrew` and `#/tables/homebrew` (m02, m09) and join the path line (m12). This is Q10\'s recommended option; the alternative is separate sources and no section level in R7.',
  [
    { cap: '#/homebrew as gm1 - «Разделы» open under a source', signed: true, body: `${homebrewHead('21 предмет из 500')}${sourcesPanel(false, true)}
<div class="shead">${SRC} · ${SECT1} <span class="cnt">9</span></div>
<div class="rows">${hbRows.pistol}</div>
<div class="note">«Разделы» is a toggle button with <code>aria-expanded</code>. «Без раздела» counts the source\'s items with no section and has no actions. Section names are 1 to 80 characters, unique inside their source; a source holds up to 30. A section delete keeps its items in the source (m13).</div>` },
    { cap: 'the editor: the section select open', signed: true, body: `<h1 class="page-h">${PISTOL.name}</h1><p class="page-sub">Хоумбрю · ${SRC} · ${SECT1} · Ранг 1</p>${formTop(`<div class="field twocol new"><div><span class="lbl">Источник</span><select class="input"><option>${SRC}</option></select></div><div><span class="lbl">Раздел</span><select class="input"><option>${SECT1}</option></select><div class="selopen" role="listbox"><span>Без раздела</span><span class="on">${SECT1}</span><span>${SECT2}</span><span class="sep">+ Новый раздел...</span></div></div></div>`)}
<div class="note">Changing the source resets the section to «Без раздела» (a section belongs to one source).</div>` },
    { cap: 'the editor: a new section', signed: true, body: `<h1 class="page-h">${PISTOL.name}</h1><p class="page-sub">Хоумбрю · ${SRC} · Ранг 1</p>${formTop(`<div class="field"><span class="lbl">Источник</span><select class="input"><option>${SRC}</option></select></div>${newSectField('Мушкеты')}`)}
<div class="note">The m18 pattern: «Создать» writes the source row with the new section at once and selects it; the refusals are m18\'s (empty, duplicate inside the source, 30 per source, network).</div>` }
  ]);

/* m20 - validation and failures */
const errSummary = (n, items) => `<div class="errs" role="alert" tabindex="-1"><b>Не сохранено: исправьте ${n}.</b><ul>${items.map(([f, t]) => `<li><a href="#">${f}</a> - ${t}</li>`).join('')}</ul></div>`;
const formFooter = (err = '') => `<div class="card-acts" style="margin-top: 18px"><button class="btn primary">Сохранить</button><a class="btn ghost">Отмена</a></div>${err ? `<p class="err" role="alert">${err}</p>` : ''}`;
mock('m20-editor-validation.html', 'The editor\'s failure states: required fields, rule errors, a refused save, a conflict', 'plan 4.14 (F5); B7.2; states `#/homebrew/new as gm1` submitted empty, the armour form, the refused save, the conflict banner',
  'The form checks on «Сохранить», never while typing: the problems collect in a summary at the top that takes focus and links to each field; each field draws its own line under it and `aria-invalid`. A field\'s error clears when it changes. The same rules run in `lib/homebrew.ts` and in the database CHECK, so a draft that passes the form never meets a CHECK refusal. The last frame is the table of required and optional fields.',
  [
    { cap: 'a new weapon submitted with four problems', signed: true, body: `<h1 class="page-h">Новый предмет</h1><p class="page-sub">Хоумбрю</p><div class="panel">
${errSummary('4 поля', [['Название', 'введите название хотя бы на одном языке'], ['Ранг', 'выберите ранг, как в книге'], ['Урон', 'запишите как d8 или d10+2'], ['Линия улучшений', 'выберите предмет, который открывает линию']])}
<div style="height: 14px"></div>${legend}
${field('Вид', seg(['Предмет', 'Расходник', 'Снаряжение'], 'Снаряжение') + ' ' + seg(['Основное оружие', 'Вторичное оружие', 'Броня'], 'Основное оружие'))}
${sourceField('Хоумбрю', '')}
${rf('Название', binput('', 'Название на русском'), { req: true, err: 'Введите название - здесь или в «Другом языке».' })}
${rf('Описание', `<textarea class="input"></textarea>`)}
${rf('Ранг', seg(['1', '2', '3', '4', 'Артефакт'], '').replace('class="seg"', 'class="seg bad"'), { req: true, err: 'Выберите ранг, как в книге. По характеристикам ранг не определяется.' })}
${rf('Класс', seg(['Физическое', 'Магическое'], 'Физическое'), { req: true })}
${rf('Характеристика', chips(['Проворность', 'Сила', 'Искусность', 'Инстинкт', 'Влияние', 'Знание', 'Характеристика Заклинателя'], ['Искусность']), { req: true })}
${rf('Дистанция', seg(['Вплотную', 'Близко', 'Средне', 'Далеко', 'Очень далеко'], 'Далеко'), { req: true })}
<div class="field twocol"><div><span class="lbl">Урон${REQ}</span>${binput('d10+', 'd8+1')}<span class="ferr" role="alert">Запишите как d8 или d10+2: кость d4-d20 и, если нужно, +N.</span></div><div><span class="lbl">Тип урона${REQ}</span>${seg(['физ', 'маг', 'физ/маг'], 'физ')}</div></div>
${rf('Хват', seg(['Одноручное', 'Двуручное', 'Одноручное/двуручное'], 'Одноручное'), { req: true })}
<fieldset class="fieldset"><p class="lgd">Связи</p>
${rf('Линия улучшений', seg(['Уникальный', 'В линии', 'Новая линия'], 'В линии') + `<div style="margin-top: 10px"><div class="picker"><input class="input bad" aria-invalid="true" value="" placeholder="Найти предмет, который открывает линию..." role="combobox" /></div></div>`, { err: 'Выберите оружие, которое открывает линию, или отметьте «Уникальный».' })}
</fieldset>
${formFooter()}</div>
<div class="note">On a failed submit the summary takes focus and a screen reader reads it; each link moves focus to its field. Nothing is sent. The other tier segments have no default for equipment on purpose: the tier is typed from the book.</div>` },
    { cap: 'armour and a new rule card: the rules between fields', signed: true, body: `<h1 class="page-h">Кожаный колет</h1><p class="page-sub">Хоумбрю · ${SRC} · Ранг 1</p><div class="panel">
${errSummary('3 поля', [['Пороги урона', 'второй порог больше первого'], ['Текст карты', 'введите текст'], ['Ссылка', 'начните с https://']])}
<div style="height: 14px"></div>
${field('Вид', seg(['Предмет', 'Расходник', 'Снаряжение'], 'Снаряжение') + ' ' + seg(['Основное оружие', 'Вторичное оружие', 'Броня'], 'Броня'))}
${rf('Ранг', seg(['1', '2', '3', '4', 'Артефакт'], '1'), { req: true })}
<div class="field twocol"><div><span class="lbl">Показатель брони${REQ}</span>${input('3')}</div><div><span class="lbl">Пороги урона${REQ}</span><div class="numrow"><div class="grow">${binput('9')}</div><div class="grow">${binput('7')}</div></div><span class="ferr" role="alert">Второй порог должен быть больше первого.</span></div></div>
<fieldset class="fieldset"><p class="lgd">Связи</p>
${rf('Улучшается в', `<div class="rows" style="gap: 6px">${[1, 2, 3, 4, 5, 6, 7, 8].map((i) => picked(IMG + '_none.webp', 'Колет ' + ['мастера', 'стража', 'егеря', 'гонца', 'вора', 'барда', 'наёмника', 'лекаря'][i - 1], `${SRC} · Ранг 2`, true)).slice(0, 2).join('')}</div><div style="margin-top: 6px"><div class="picker"><input class="input" disabled value="" placeholder="Уже 8 - больше нельзя" role="combobox" /></div></div>`, { hint: 'Выбрано 8 из 8 (два показаны). Сам предмет в поиске не предлагается.' })}
${field('Карты правил', `<div class="fold" style="margin: 0"><div class="sum open">+ новая карта <span class="caret"></span></div><div class="body">
${rf('Название карты', input('Перезарядка'), { req: true })}
${rf('Текст карты', `<textarea class="input bad" aria-invalid="true"></textarea>`, { req: true, err: 'Введите текст карты.' })}
${rf('Ссылка', binput('http://example.org/reload'), { err: 'Ссылка должна начинаться с https://.' })}
<div class="card-acts"><button class="btn sm primary">Создать карту</button><button class="btn sm ghost">Отмена</button></div></div></div>`)}
</fieldset>
${formFooter()}</div>
<div class="note">The card\'s own «Создать карту» checks its fields the same way; here the author pressed «Сохранить» with the card form still open, so its problems join the summary and the item is not saved until the card is created or the fold is cancelled.</div>` },
    { cap: 'the database refused the save, or the network failed', signed: true, body: `<h1 class="page-h">${AXE.name}</h1><p class="page-sub">Хоумбрю · ${SRC} · ${SECT2} · Ранг 2</p>
<div class="panel"><span class="lbl">Предел</span>${formFooter('Не сохранено: достигнут предел своих предметов - 500. Удалите ненужные на странице «Мои предметы».')}</div>
<div class="panel"><span class="lbl">Нет связи</span>${formFooter('Не удалось сохранить - нет связи. Правки остались в форме: нажмите «Сохранить» ещё раз.')}</div>
<div class="note">Both keep the form as typed and the unsaved-changes guard armed. A CHECK refusal the form did not predict (a validator drift) reads as the network line and is a defect: the shared fixtures exist to keep it from happening.</div>` },
    { cap: 'changed or deleted on another device', signed: true, body: `<h1 class="page-h">${AXE.name}</h1><p class="page-sub">Хоумбрю · ${SRC} · ${SECT2} · Ранг 2</p>
${nbox('Этот предмет изменили на другом устройстве, пока форма была открыта. Ваши правки не сохранены.', '<button class="btn sm">Сохранить мою версию</button><button class="btn sm ghost">Показать новую версию</button>', true)}
${nbox('Этот предмет удалили на другом устройстве.', '<button class="btn sm">Сохранить как новый</button><a class="btn sm ghost">К моим предметам</a>', true)}
<div class="panel">${rf('Название', input(AXE.name + ' (моя правка)'), { req: true })}<p class="hint">... the form as typed.</p></div>
<div class="note">The update names the revision the form loaded (<code>revision = r</code>); zero rows answered and a re-read that finds the row is the conflict, a re-read that finds nothing is the delete. «Сохранить мою версию» writes over the newer revision; «Показать новую версию» reloads the form and drops the edits (the guard asks first). «Сохранить как новый» creates an item with a new key; the old references are gone with the deleted item.</div>` },
    { text: true, body: `<div class="pair" style="padding: 0; margin: 0"><section class="frame textframe"><span class="cap">required and optional fields (plan 4.14, F5)</span><div style="padding: 4px 16px 0"><table class="idx"><thead><tr><th>Field</th><th>Kind</th><th>Rule</th></tr></thead><tbody>
<tr><td>kind, eq.t</td><td>all</td><td>always set: the segments have a default</td></tr>
<tr><td>ru or en</td><td>all</td><td>required: one name, 1-120 characters; the other language optional</td></tr>
<tr><td>rud, ende</td><td>all</td><td>optional, 0-3000 characters; a counter shows past 2500</td></tr>
<tr><td>book, section</td><td>all</td><td>optional: none is «Хоумбрю»; a section needs a named source and must be one of its sections</td></tr>
<tr><td>tier</td><td>loot</td><td>optional: «Нет», 1-4, Артефакт, Проклятый</td></tr>
<tr><td>eq.tier</td><td>equipment</td><td>required, no default: 1-4 or Артефакт, from the book</td></tr>
<tr><td>cls, tr, rg, dmg, dt, bu</td><td>weapon, secondary</td><td>required: every catalog weapon carries all six; dmg is d4-d20 with an optional +1..+20</td></tr>
<tr><td>as, th</td><td>armour</td><td>required: as 0-12, th two whole numbers, the second larger</td></tr>
<tr><td>alt</td><td>weapon, secondary</td><td>optional; once any of its four fields is set, all four are required</td></tr>
<tr><td>eq.line</td><td>equipment</td><td>«Уникальный»: none; «В линии»: required, equipment of the same type; «Новая линия»: this item</td></tr>
<tr><td>craft, craft_from</td><td>all</td><td>optional, 0-8 each, no duplicates, never the item itself (Q11)</td></tr>
<tr><td>set</td><td>all</td><td>optional; a new set needs a name and a bonus</td></tr>
<tr><td>refs</td><td>all</td><td>optional, 0-3; a new rule card needs a name and a text; subtitle optional; a link must start with https://</td></tr>
<tr><td>quick draft</td><td>from a list</td><td>the name only; the description optional (m22)</td></tr>
</tbody></table></div></section></div>` }
  ]);

/* m21 - rule cards and sets */
const cardsPanel = `<div class="panel new"><span class="lbl">Карты</span>
<div class="cardgrp"><span class="lbl" style="margin-top: 4px">Комплекты</span>
<div class="srcrow"><span class="who"><b>Тлеющая пара</b><small>2 предмета · ${SRC}</small></span><span class="acts"><button class="btn sm ghost">Изменить</button><button class="btn sm danger">Удалить</button></span></div>
<div class="card-acts" style="margin-top: 6px"><button class="btn sm">+ Новый комплект</button></div></div>
<div class="cardgrp"><span class="lbl">Карты правил</span>
<div class="srcrow"><span class="who"><b>Перезарядка</b><small>Правило Мастерской Ольхи · 3 предмета</small></span><span class="acts"><button class="btn sm ghost">Изменить</button><button class="btn sm danger">Удалить</button></span></div>
<div class="srcrow"><span class="who"><b>Осечка</b><small>0 предметов</small></span><span class="acts"><button class="btn sm ghost">Изменить</button><button class="btn sm danger">Удалить</button></span></div>
<div class="card-acts" style="margin-top: 6px"><button class="btn sm">+ Новая карта правил</button></div></div></div>`;
const refPreview = (open = true) => `<div class="refs"><details${open ? ' open' : ''}><summary><span class="ref-n">Перезарядка</span><i class="ref-s">Правило Мастерской Ольхи</i></summary><p class="ref-t">После выстрела потратьте ход, чтобы перезарядить оружие. Пока оружие не перезаряжено, им нельзя атаковать.</p></details></div>`;
const cardForm = (compact = false) => `${rf('Название карты', input('Перезарядка'), { req: true })}
${rf('Подзаголовок', input('Правило Мастерской Ольхи'), { hint: 'Необязательно. Например: Мудрость · Уровень 1 · Заклинание.' })}
${rf('Текст карты', `<textarea class="input">После выстрела потратьте ход, чтобы перезарядить оружие. Пока оружие не перезаряжено, им нельзя атаковать.</textarea>`, { req: true })}
${rf('Ссылка', input('', 'https://...'), { hint: 'Необязательно: страница с полным текстом правила.' })}
${compact ? '' : `<div class="field"><span class="lbl">Источник</span><select class="input"><option>${SRC}</option></select></div>`}
<div class="fold"><div class="sum">Другой язык (English) <span class="caret"></span></div></div>`;
mock('m21-rule-cards.html', 'Rule cards and sets: the «Карты» panel, a new rule card, the inline form in the item editor', 'plan 4.3, 4.14 (F7); B7.2',
  'A rule card («Карта правил», the catalog\'s `refs`) is text an item points at, drawn as a fold on the item\'s card; a set card holds a set\'s shared bonus. Both are rows of `homebrew_cards`. They are made in two places: the «Карты» panel on `#/homebrew` and the inline «+ новая карта» / «+ новый комплект» in the item editor; each creates at once with its own button.',
  [
    { cap: '#/homebrew as gm1 - the «Карты» panel open', signed: true, body: `${homebrewHead('21 предмет из 500')}${cardsPanel}
<div class="note">Each card lists the items that name it; «Осечка» is named by none (made from the editor and then not used). «Изменить» opens the card\'s form in place of its row; one form is open at a time.</div>` },
    { cap: '«+ Новая карта правил» in the panel, with how it draws', signed: true, body: `<div class="panel new"><span class="lbl">Новая карта правил</span>${legend}${cardForm()}
<div class="card-acts" style="margin-top: 12px"><button class="btn sm primary">Создать карту</button><button class="btn sm ghost">Отмена</button></div>
<div class="field" style="margin-top: 16px"><span class="lbl">Так карта выглядит на предмете</span>${refPreview()}</div></div>
<div class="note">The source is optional (none: «Хоумбрю») and only groups the card in the panel and the file; any item may name any of the author\'s cards and any catalog card, up to three.</div>` },
    { cap: 'the item editor: «+ новая карта» open beside a catalog card', signed: true, body: `<div class="panel"><fieldset class="fieldset"><p class="lgd">Связи</p>
${field('Карты правил', `${picked(IMG + '_none.webp', 'Неистовое опутывание', 'Мудрость · Уровень 1 · Заклинание · Основные правила')}<div class="fold new" style="margin: 8px 0 0"><div class="sum open">+ новая карта <span class="caret"></span></div><div class="body">${cardForm(true)}
<div class="card-acts"><button class="btn sm primary">Создать карту</button><button class="btn sm ghost">Отмена</button></div>
<p class="hint">Карта создаётся сразу, в источнике этого предмета, и выбирается здесь. На предмете - до 3 карт.</p></div></div>`)}
</fieldset></div>
<div class="note">The picker («+ ещё карта») searches the catalog\'s 13 cards and the author\'s own, by name and subtitle. After «Создать карту» the fold closes and the new card is the second chosen row.</div>` },
    { cap: 'editing a set from the panel', signed: true, body: `<div class="panel new"><span class="lbl">Комплект</span>
${rf('Название комплекта', input('Тлеющая пара'), { req: true })}
${rf('Бонус комплекта', `<textarea class="input">Когда оба предмета в вашей Руке, ваши атаки наносят +1 магического урона.</textarea>`, { req: true })}
<div class="card-acts"><button class="btn sm primary">Сохранить</button><button class="btn sm ghost">Отмена</button><button class="btn sm danger ml">Удалить</button></div>
<p class="hint">Изменения появятся на 2 предметах и в списках, где они лежат.</p></div>
<div class="note">Members are not edited here: an item joins a set from its own editor (the set is a property of the item, as in the catalog).</div>` }
  ]);

/* m22 - quick draft from a list page */
const listActs = (open) => `<div class="card-acts" style="margin-bottom: 14px"><button class="btn sm">Поделиться <span class="caret"></span></button><button class="btn sm new${open ? ' on' : ''}" aria-expanded="${open}">+ Свой предмет <span class="caret"></span></button><button class="btn sm">Копировать</button><button class="btn sm">Скачать JSON</button><button class="btn sm">Печать</button><button class="btn sm danger">Удалить</button></div>`;
const draftPanel = (name, desc, err = '', fail = '') => `<div class="panel new" style="margin-bottom: 14px"><span class="lbl">Свой предмет в этот список</span>
${rf('Название', err ? binput(name, 'Например: Фляга контрабандиста') : input(name, 'Например: Фляга контрабандиста'), { req: true, err })}
${rf('Описание', `<textarea class="input" placeholder="Что делает предмет - можно дописать после игры">${desc}</textarea>`)}
<div class="card-acts"><button class="btn sm primary">Добавить в список</button><button class="btn sm ghost">Закрыть</button></div>
${fail ? `<p class="err" role="alert">${fail}</p>` : '<p class="hint">Предмет сохранится в «Мои предметы» как черновик в «Хоумбрю». Вид, источник, связи и цену можно задать потом.</p>'}</div>`;
const listHead = `<h1 class="page-h">Лавка кузнеца</h1><p class="page-sub">10 позиций · Сохранено</p>`;
const listRows = (withDraft) => `<div class="rows">${listRow(row({ img: IMG + 'ci1.webp', name: 'Первоклассный Спальный Мешок', desc: 'Во время отдыха вы автоматически очищаете Стресс.', badges: badge('item', 'Предмет') + srcBadge('Основные правила') }), '&times;2 · 150 монет')}${listRow(hbRows.axe, '800 монет')}${withDraft ? hbRows.draft2.replace('class="row"', 'class="row new"') : ''}</div>`;
mock('m22-list-quick-draft.html', 'A quick draft from a list page: name and description now, the rest after the game', 'plan 4.14 (F8, Q12); B7.3; states `#/lists/<uuid(101)> as gm1` with the panel open, after an add, refused; `#/homebrew/<draft> as gm1`',
  'An own account list gains «+ Свой предмет», a toggle like «Поделиться». Its panel takes a name (required) and a description; «Добавить в список» creates a homebrew item marked as a draft (kind «Предмет», source «Хоумбрю») and adds it to this list as a live reference, then clears the fields for the next one. After the game the author finds it under «Черновики» on `#/homebrew` (m02) and completes it in the editor; the first save there removes the mark.',
  [
    { cap: '#/lists/<uuid(101)> as gm1 - «+ Свой предмет» open', signed: true, body: `${listHead}${listActs(true)}${draftPanel('Фляга контрабандиста', 'Двойное дно: во второй половине можно спрятать письмо.')}${listRows(false)}
<div class="note">Only on a list of the signed-in account (<code>isCloud</code>) and not read-only: a browser list never holds a homebrew entry (G36). Enter in the name field adds; Escape closes the panel. The empty list\'s hint gains «...или добавьте свой предмет кнопкой «+ Свой предмет».».</div>` },
    { cap: 'added: the draft row at the end, the fields cleared', signed: true, body: `${listHead.replace('10 позиций', '11 позиций')}${listActs(true)}${draftPanel('', '')}${listRows(true)}
<div class="toast">«Фляга контрабандиста» добавлена в список</div>
<div class="note">Two writes in order: the item (awaited, <code>draft = true</code>), then the entry through the list\'s write buffer as <code>source: homebrew</code> - the reference-exists trigger needs the item first. The badge «Черновик» draws only from the owner\'s index: players on <code>#/s/...</code> see the item live without it, and a frozen copy never carries it.</div>` },
    { cap: 'refused: no name, or the item could not be created', signed: true, body: `${listHead}${listActs(true)}${draftPanel('', 'Двойное дно: во второй половине можно спрятать письмо.', 'Введите название.')}${draftPanel('Фляга контрабандиста', '', '', 'Не удалось создать предмет - проверьте соединение. Текст остался в форме.')}
<div class="note">The limit refusal reads «Достигнут предел своих предметов: 500.». If the item was created and the entry write fails, the item stays under «Черновики» and the list\'s own «Не сохранено · Повторить» line takes over, as for any list write.</div>` },
    { cap: '#/homebrew/<draft> as gm1 - the draft opened in the editor', signed: true, body: `<h1 class="page-h">Фляга контрабандиста</h1><p class="page-sub">Хоумбрю</p>
${nbox('Черновик: задайте вид, источник и связи и сохраните - метка «Черновик» снимется.')}
<div class="editor"><div class="panel">${legend}
${field('Вид', seg(['Предмет', 'Расходник', 'Снаряжение'], 'Предмет'))}
${sourceField('Хоумбрю', '')}
${rf('Название', input('Фляга контрабандиста'), { req: true })}
${rf('Описание', `<textarea class="input">Двойное дно: во второй половине можно спрятать письмо.</textarea>`)}
<p class="hint">... the rest of the form as m05.</p>
<div class="card-acts" style="margin-top: 18px"><button class="btn primary">Сохранить</button><a class="btn ghost">Отмена</a><button class="btn danger ml">Удалить</button></div>
<p class="hint">Предмет есть в 1 списке: изменения появятся в нём сразу, в том числе у игроков по ссылке.</p></div>
<div class="card full"><span class="card-media"><img src="${FULL}_none.webp" alt="" /></span><div class="card-body"><div class="card-meta">${badge('draft new', 'Черновик')}${badge('item', 'Предмет')}${srcBadge('Хоумбрю', true)}</div><h2 class="card-name">Фляга контрабандиста</h2><div class="card-desc"><p>Двойное дно: во второй половине можно спрятать письмо.</p></div></div></div></div>
<div class="note">The banner shows while the item carries the mark. «Сохранить» writes <code>draft = false</code> with the content, so the mark drops even with no other change.</div>` }
  ]);

/* ---------------- writer ---------------- */
function page(title, body) {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>${CSS}</style>
</head>
<body>
${body}
</body>
</html>
`;
}

for (const m of MOCKS) {
  const screens = m.screens
    .map((s) => {
      if (s.text) return s.body;
      const inner = (cls, cap) => `<section class="frame ${cls}"><span class="cap">${cap}</span>${chrome(s)}<main class="in">${s.body}</main></section>`;
      return `<div class="pair">${inner('desk', `${esc(s.cap)} - 960 px`)}${inner('phone', `${esc(s.cap)} - 360 px`)}</div>`;
    })
    .join('\n');
  const prose = (x) => esc(x).replace(/`([^`]+)`/g, "<code>$1</code>");
  const body = `<div class="mockbar"><p class="crumb"><a href="index.html">R7 mocks</a> / ${m.file}</p><h1>${esc(m.title)}</h1><p><b>Plan:</b> ${prose(m.plan)}</p><p class="notetext">${prose(m.note)}</p></div>
${screens}`;
  writeFileSync(join(OUT, m.file), page(m.title, body.replace(/<(axe|name|date|uuid(d+))>/g, "&lt;$1&gt;")));
}

const indexRows = MOCKS.map((m) => `<tr><td><a href="${m.file}">${m.file}</a></td><td>${esc(m.title)}</td><td>${esc(m.plan).replace(/`([^`]+)`/g, "<code>$1</code>")}</td></tr>`).join('\n');
writeFileSync(
  join(OUT, 'index.html'),
  page(
    'R7 mocks',
    `<div class="mockbar"><h1>R7 and R7b - homebrew items: mocks (planning pass 3)</h1>
<p class="notetext">One file per screen, every state at 960 px and at 360 px side by side, in the app's tokens (app/src/styles/tokens.css) and the markup of the components each one extends (PageHead, Panel, Field, Seg, Chip, Badge, TableRows/RowMain, RecordCard, AccountMenu, FilterBar, R6's BatchBar and import panel). Dashed purple outline: proposed. Everything else exists. Russian text as it would ship. The header chrome is drawn in outline only. Open from disk; the pictures load from the repository's img/ folder.</p>
<p class="notetext">One visual rule this release adds: dashed means homebrew - the source badge, a homebrew name inside a relation, a homebrew rung on a ladder. The owner's questions are in plan.md section 9 (Q1-Q12; Q9-Q12 are new in pass 3); the answers to the owner's first mock review are section 4.14 (F1-F8); the gap audit is section 3. Pass 3 changed m02, m04, m05, m09, m12, m13, m15, m17 and added m18-m22. The example source is the invented «Мастерская Ольхи» / Alder Workshop.</p>
<table class="idx"><thead><tr><th>Mock</th><th>What it shows</th><th>Plan</th></tr></thead><tbody>${indexRows}</tbody></table></div>`
  )
);
console.log('wrote', MOCKS.length + 1, 'files');
