/*
  The DOM glue of the image review page. Everything that can be stated over
  data is in ../lib.mjs; this file holds only the DOM, fetch, the clipboard and
  localStorage. The card head is drawn by renderCard from the app's own label
  code and CSS: a change to RecordCard.svelte, Badge.svelte or Seg.svelte must
  check it (docs/artwork.md, "The card follows the site's card").
*/
import {
  catalogRecords,
  parseReviewQuery,
  buildDeck,
  readVerdicts,
  setVerdict,
  setComment,
  pruneVerdicts,
  pendingRegen,
  regenJson,
  reviewKeyAction,
  readLang,
  REVIEW_ART_SIZES
} from '/tools/artwork/lib.mjs';

const STORE_KEY = 'dhl-image-review';
const LANG_KEY = 'dhl-image-review-lang';
const SWIPE_MS = 220;

const $ = (id) => document.getElementById(id);

// A DOM node from plain data: text goes in through textContent, never as markup.
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

let mods = null;
let records = [];
let byId = new Map();
let shas = {};
let verdicts = {};
let saveOff = null;
let deck = null;
let query = { all: false, ids: [] };
let lang = 'ru';
let screen = 'start';
let field = null; // 'comment' while the card field is open, 'edit' on the end screen
let pos = 0;
let selected = 0;
let animating = false;
let startMessage = null;
const undoStack = [];
const decided = new Map(); // asset -> 'keep' | 'regen', this page load only

/* ---------- storage ---------- */

function setSaveOff(message) {
  saveOff = message;
  const box = $('warning');
  box.textContent = message;
  box.classList.remove('hidden');
}

function today() {
  const d = new Date();
  const two = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());
}

// Applies `mutate` to the stored verdicts (read again, so another tab's verdicts
// stay) and writes the result. Without a usable store it changes memory only.
function persist(mutate) {
  if (!saveOff) {
    try {
      const read = readVerdicts(localStorage.getItem(STORE_KEY));
      if (read.ok) {
        // No prune on write: this tab may hold older hashes than a newer tab, and an
        // entry with an unknown hash is another tab's valid verdict.
        const next = mutate(read.verdicts);
        localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, verdicts: next }));
        verdicts = pruneVerdicts(next, shas);
        return;
      }
      setSaveOff(
        'Verdicts are not saved: ' +
          read.reason +
          '. Shift+Delete on the start screen forgets them.'
      );
    } catch (err) {
      setSaveOff('Verdicts are not saved in this browser: ' + err.message + '.');
    }
  }
  verdicts = pruneVerdicts(mutate(verdicts), shas);
}

/* ---------- language ---------- */

function drawLang() {
  for (const b of document.querySelectorAll('[data-lang]')) {
    const on = b.dataset.lang === lang;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  }
}

function setLang(next) {
  lang = next;
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // The choice holds for this page load only.
  }
  drawLang();
  if (screen === 'card') {
    if (field === 'comment') {
      // Keep the typed draft: redraw only the text that depends on the language.
      const card = deck.cards[pos];
      $('card').setAttribute('lang', lang);
      $('c-head').replaceChildren(renderCard(card.record, lang));
      drawShared(card);
      $('c-comment-in').focus();
    } else drawCard();
  }
  if (screen === 'end') {
    const draft = field === 'edit' ? $('e-edit').value : null;
    drawEnd();
    if (draft !== null) $('e-edit').value = draft;
  }
}

/* ---------- the card ---------- */

// The card head of RecordCard.svelte: badges, name, stat chips, description.
function renderCard(record, cardLang) {
  const { label, i18n, desc, dict } = mods;
  const t = dict.dict(cardLang);
  const frag = document.createDocumentFragment();

  const meta = el('div', { class: 'card-meta' });
  if (record.roll) meta.append(el('span', { class: 'badge num', text: String(record.roll) }));
  for (const b of label.cardBadges(record, cardLang, t)) {
    const badge = el('span', { class: 'badge ' + b.cls, text: b.text });
    if (b.title) badge.title = b.title;
    meta.append(badge);
  }
  meta.append(el('span', { class: 'badge src', text: label.srcLabel(record, cardLang) }));
  frag.append(meta);

  frag.append(
    el('h2', { class: 'card-name' }, el('span', { text: i18n.nameOf(record, cardLang) }))
  );

  const stats = i18n.eqParts(
    record,
    cardLang,
    { tier: t.tier, thresholds: t.eqTh, armorScore: t.eqScore, artifact: t.voaArtifact1 },
    { noType: true }
  );
  if (stats.length) {
    const box = el('div', { class: 'eqstats' });
    for (const chip of stats) box.append(el('span', { text: chip }));
    frag.append(box);
  }

  const body = el('div', { class: 'card-desc' });
  const withLabel = (parent, line) => {
    if (line.label) parent.append(el('i', { text: line.label + ':' }));
    parent.append(document.createTextNode(line.body));
  };
  for (const part of desc.descParts(record, cardLang)) {
    if (part.kind === 'list') {
      const ul = el('ul');
      for (const line of part.items) {
        const li = el('li');
        withLabel(li, line);
        ul.append(li);
      }
      body.append(ul);
    } else {
      const p = el('p');
      withLabel(p, part);
      body.append(p);
    }
  }
  frag.append(body);
  return frag;
}

function dateText(date) {
  if (date === 'uncommitted') return 'uncommitted';
  return date ? date.slice(0, 10) : 'no date';
}

function drawSizes(card) {
  const row = $('c-sizes');
  row.replaceChildren();
  for (const size of REVIEW_ART_SIZES) {
    const img = el('img', {
      src: '/' + size.dir + card.asset,
      alt: '',
      width: String(size.px),
      height: String(size.px),
      loading: 'eager'
    });
    img.style.borderRadius = size.radius + 'px';
    row.append(el('figure', {}, img, el('figcaption', { text: size.label })));
  }
}

function drawShared(card) {
  const shared = $('c-shared');
  shared.classList.toggle('hidden', card.others.length === 0);
  shared.replaceChildren();
  if (card.others.length) {
    shared.append(
      el('span', { text: 'Shared picture, ' + (card.others.length + 1) + ' records' }),
      document.createTextNode(
        card.others.map((r) => r.id + ' ' + mods.i18n.nameOf(r, lang)).join(', ')
      )
    );
  }
}

function drawCard() {
  const card = deck.cards[pos];
  if (!card) {
    show('end');
    return;
  }
  const article = $('card');
  window.scrollTo(0, 0);
  article.className = 'card full';
  article.style.transform = '';
  article.setAttribute('lang', lang);
  const img = el('img', {
    src: '/img/' + card.asset,
    alt: '',
    decoding: 'async',
    draggable: 'false'
  });
  img.addEventListener('error', () => {
    $('c-media').append(
      el('div', { class: 'media-error', text: 'Picture did not load: img/' + card.asset })
    );
  });
  $('c-media').replaceChildren(img);
  $('c-head').replaceChildren(renderCard(card.record, lang));

  const facts = $('c-facts');
  facts.replaceChildren(
    el('span', { text: 'image ' }, el('b', { text: dateText(card.date) })),
    el('span', { text: card.asset }),
    el('span', { text: 'id ' + card.id }),
    el('span', { text: pos + 1 + ' / ' + deck.cards.length })
  );
  if (card.verdict) facts.append(el('span', { text: 'verdict ' + card.verdict }));

  drawShared(card);
  closeCommentField();
  drawSizes(card);
  const upcoming = deck.cards[pos + 1];
  if (upcoming) new Image().src = '/img/' + upcoming.asset;
}

/* ---------- decisions ---------- */

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function leave(direction) {
  const article = $('card');
  animating = true;
  article.classList.remove('dragging');
  article.style.transform = '';
  article.classList.add(direction === 'right' ? 'out-right' : 'out-left');
  setTimeout(
    () => {
      animating = false;
      pos++;
      drawProgress();
      if (pos >= deck.cards.length) show('end');
      else drawCard();
    },
    reducedMotion() ? 0 : SWIPE_MS
  );
}

function decide(verdict, comment) {
  const card = deck.cards[pos];
  if (!card || animating) return;
  undoStack.push({ asset: card.asset, previous: verdicts[card.asset] || null });
  decided.set(card.asset, verdict);
  persist((v) =>
    setVerdict(v, {
      asset: card.asset,
      verdict,
      sha256: card.sha256,
      at: today(),
      comment
    })
  );
  drawProgress();
  leave(verdict === 'keep' ? 'right' : 'left');
}

function undo() {
  if (animating) return;
  const last = undoStack.pop();
  if (!last) return;
  decided.delete(last.asset);
  persist((v) =>
    last.previous
      ? { ...v, [last.asset]: last.previous }
      : setVerdict(v, { asset: last.asset, verdict: null })
  );
  pos = deck.cards.findIndex((c) => c.asset === last.asset);
  if (screen !== 'card') show('card');
  else drawCard();
  drawProgress();
}

function openCommentField() {
  field = 'comment';
  $('c-comment').classList.remove('hidden');
  const input = $('c-comment-in');
  input.value = '';
  input.focus();
}

function closeCommentField() {
  if (field === 'comment') field = null;
  $('c-comment').classList.add('hidden');
  $('c-comment-in').blur();
}

/* ---------- screens ---------- */

function marks() {
  return pendingRegen({ records, verdicts, shas });
}

function drawProgress() {
  const box = $('progress');
  box.replaceChildren();
  if (!deck) return;
  const run = [...decided.values()];
  box.append(
    document.createTextNode('Reviewed '),
    el('b', { text: String(run.length) }),
    document.createTextNode(' of ' + deck.cards.length + ' - '),
    el('span', {
      class: 'regen',
      text: run.filter((v) => v === 'regen').length + ' to regenerate'
    })
  );
}

function show(next) {
  screen = next;
  field = null;
  for (const name of ['start', 'card', 'end']) {
    $('s-' + name).classList.toggle('hidden', name !== next);
  }
  if (next === 'start') drawStart();
  if (next === 'card') drawCard();
  if (next === 'end') {
    drawEnd();
    $('e-list').scrollTop = 0;
  }
  drawProgress();
}

function countRow(text, value, cls) {
  return el(
    'tr',
    cls ? { class: cls } : {},
    el('td', { text }),
    el('td', { class: 'n', text: String(value) })
  );
}

function drawStart() {
  const panel = $('s-start');
  panel.replaceChildren();
  if (startMessage) {
    panel.append(
      el('h2', { text: 'Image review' }),
      el('p', { class: 'note', text: startMessage })
    );
    return;
  }
  const modeBox = el('div', { class: 'mode' });
  modeBox.append(
    el('div', {
      class: 'on',
      text: query.all
        ? 'Mode: every picture; stored verdicts are shown and a new decision replaces them'
        : 'Mode: new and changed pictures'
    })
  );
  if (query.ids.length)
    modeBox.append(el('div', { class: 'on', text: 'Only records: ' + query.ids.join(', ') }));
  if (deck.unknownIds.length) {
    modeBox.append(
      el('div', { class: 'on', text: 'Unknown ids: ' + deck.unknownIds.join(', ') })
    );
  }
  if (deck.missingFiles.length) {
    modeBox.append(
      el('div', { class: 'on', text: 'No picture file for: ' + deck.missingFiles.join(', ') })
    );
  }
  modeBox.append(
    el(
      'div',
      { class: 'off' },
      document.createTextNode('Full review, every picture: open '),
      el('code', { text: '/?all=1' }),
      document.createTextNode('. Only some records: open '),
      el('code', { text: '/?ids=ci2,q4' }),
      document.createTextNode('.')
    )
  );

  const first = deck.cards[0];
  const scope = query.ids.length
    ? 'Pictures of the chosen records (shared pictures counted once)'
    : 'Pictures in data.js (' + records.length + ' records, shared pictures counted once)';
  const table = el(
    'table',
    { class: 'counts' },
    countRow(scope, deck.total),
    countRow('Kept earlier and unchanged - skipped', deck.skippedKeep),
    countRow(
      'Marked for regeneration earlier and unchanged - skipped, still in the list',
      deck.skippedRegen
    ),
    countRow(
      'To review now' + (first ? ', from ' + dateText(first.date) : ''),
      deck.cards.length,
      'total'
    )
  );

  panel.append(
    el('h2', { text: 'Oldest picture first' }),
    modeBox,
    table,
    deck.cards.length
      ? el('p', {
          class: 'note',
          text: 'Each verdict is saved in this browser at once, keyed by the picture content hash. A picture whose bytes change shows again. Another browser or cleared site data starts from zero.'
        })
      : el('p', {
          class: 'note',
          text: 'Nothing to review in this mode. Enter opens the list.'
        }),
    el(
      'div',
      { class: 'subkeys' },
      el('kbd', { text: 'Enter' }),
      document.createTextNode(' or '),
      el('kbd', { text: 'Right' }),
      document.createTextNode(' start   '),
      el('kbd', { text: 'L' }),
      document.createTextNode(' RU / EN   '),
      el('kbd', { text: 'Shift' }),
      document.createTextNode('+'),
      el('kbd', { text: 'Delete' }),
      document.createTextNode(' forget all verdicts (asks first)')
    )
  );
}

function drawEnd() {
  const list = marks();
  const runMarks = list.filter((e) => decided.get(byId.get(e.id).img) === 'regen').length;
  const kept = [...decided.values()].filter((v) => v === 'keep').length;
  $('e-reviewed').textContent = decided.size + ' of ' + deck.cards.length;
  $('e-kept').textContent = String(kept);
  $('e-run').textContent = String(runMarks);
  $('e-earlier').textContent = String(list.length - runMarks);
  $('e-total').textContent = String(list.length);
  selected = Math.max(0, Math.min(selected, list.length - 1));

  const ol = $('e-marks');
  ol.replaceChildren();
  list.forEach((m, i) => {
    const li = el('li', i === selected ? { class: 'sel' } : {});
    li.append(
      el('span', { class: 'mid', text: m.id }),
      el('span', { text: mods.i18n.nameOf(byId.get(m.id), lang) })
    );
    if (field === 'edit' && i === selected) {
      li.append(
        el('input', { id: 'e-edit', maxlength: '500', 'aria-label': 'Comment for ' + m.id })
      );
    } else {
      li.append(
        el('span', { class: m.comment ? 'mc' : 'mc none', text: m.comment || 'no comment' })
      );
    }
    ol.append(li);
  });
  $('e-list').value = regenJson(list);
  $('e-recheck').textContent = list.length
    ? '/?ids=' + list.map((m) => m.id).join(',')
    : 'no marked records';
  if (field === 'edit') {
    const input = $('e-edit');
    input.value = list[selected].comment || '';
    input.focus();
  }
}

async function copyList() {
  const list = marks();
  const text = regenJson(list);
  const status = $('e-status');
  try {
    await navigator.clipboard.writeText(text);
    status.textContent = list.length
      ? 'Copied ' + list.length + ' records as JSON.'
      : 'Copied an empty list.';
  } catch {
    const area = $('e-list');
    area.focus();
    area.select();
    status.textContent = 'Copy failed. The list is selected: press Ctrl+C.';
  }
}

function saveEdit() {
  const list = marks();
  const m = list[selected];
  const text = $('e-edit').value;
  field = null;
  if (m) {
    const asset = byId.get(m.id).img;
    persist((v) => setComment(v, asset, text));
  }
  drawEnd();
}

function forget() {
  let confirmText = 'Forget the unreadable verdict store in this browser?';
  if (!saveOff) {
    confirmText = 'Forget all ' + Object.keys(verdicts).length + ' verdicts in this browser?';
  }
  if (!window.confirm(confirmText)) return;
  try {
    localStorage.removeItem(STORE_KEY);
  } catch (err) {
    setSaveOff('Verdicts are not saved in this browser: ' + err.message + '.');
    return;
  }
  window.location.reload();
}

/* ---------- actions and input ---------- */

function act(action) {
  if (action === 'start') {
    if (deck.cards.length) show('card');
    else show('end');
  } else if (action === 'forget') forget();
  else if (action === 'lang') setLang(lang === 'ru' ? 'en' : 'ru');
  else if (action === 'keep' || action === 'regen') {
    if (screen === 'card' && !field) decide(action, null);
  } else if (action === 'regenComment') {
    if (screen === 'card' && !field && !animating) openCommentField();
  } else if (action === 'undo') {
    if (screen === 'card' && !field) undo();
  } else if (action === 'finish') {
    if (screen === 'card' && !field && !animating) show('end');
  } else if (action === 'save') {
    if (field === 'comment') {
      const text = $('c-comment-in').value;
      closeCommentField();
      decide('regen', text);
    } else if (field === 'edit') saveEdit();
  } else if (action === 'cancel') {
    if (field === 'comment') closeCommentField();
    else if (field === 'edit') {
      field = null;
      drawEnd();
    }
  } else if (action === 'prev' || action === 'next') {
    const count = marks().length;
    selected = Math.max(0, Math.min(count - 1, selected + (action === 'next' ? 1 : -1)));
    drawEnd();
    $('e-marks').children[selected]?.scrollIntoView({ block: 'nearest' });
  } else if (action === 'edit') {
    if (marks().length) {
      field = 'edit';
      drawEnd();
    }
  } else if (action === 'copy') void copyList();
  else if (action === 'back') {
    if (pos < deck.cards.length) show('card');
  }
}

document.addEventListener('keydown', (e) => {
  if (!deck || e.repeat || e.isComposing || e.ctrlKey || e.altKey || e.metaKey) return;
  const shifted = e.shiftKey && (e.key === 'ArrowLeft' || e.key === 'Delete');
  const key = shifted ? 'Shift+' + e.key : e.key;
  const action = reviewKeyAction(field ? 'comment' : screen, key);
  if (!action) return;
  e.preventDefault();
  act(action);
});

for (const b of document.querySelectorAll('[data-act]')) {
  b.addEventListener('click', () => {
    if (deck) act(b.dataset.act);
  });
}
for (const b of document.querySelectorAll('[data-lang]')) {
  b.addEventListener('click', () => {
    setLang(b.dataset.lang);
  });
}

// Pointer: drag the card past 30% of its width to decide.
{
  const article = $('card');
  let startX = null;
  article.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || screen !== 'card' || field || animating) return;
    if (e.target.closest('.comment')) return;
    startX = e.clientX;
    article.setPointerCapture(e.pointerId);
    article.classList.add('dragging');
  });
  article.addEventListener('pointermove', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    article.style.transform = 'translateX(' + dx + 'px) rotate(' + dx / 40 + 'deg)';
  });
  const release = (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    article.classList.remove('dragging');
    if (Math.abs(dx) > article.offsetWidth * 0.3) {
      decide(dx > 0 ? 'keep' : 'regen', null);
    } else {
      article.style.transform = '';
    }
  };
  article.addEventListener('pointerup', release);
  article.addEventListener('pointercancel', () => {
    startX = null;
    article.classList.remove('dragging');
    article.style.transform = '';
  });
}

/* ---------- start-up ---------- */

async function loadMods() {
  try {
    const [label, i18n, desc, dict] = await Promise.all([
      import('/app/src/lib/label.js'),
      import('/app/src/lib/i18n.js'),
      import('/app/src/lib/desc.js'),
      import('/app/src/lib/dict.js')
    ]);
    return { label, i18n, desc, dict };
  } catch (err) {
    let message = err.message;
    try {
      const probe = await fetch('/app/src/lib/label.js');
      if (!probe.ok) message = (await probe.text()) || message;
    } catch {
      // Keep the import error.
    }
    throw new Error(message, { cause: err });
  }
}

async function boot() {
  try {
    lang = readLang(localStorage.getItem(LANG_KEY));
  } catch {
    lang = 'ru';
  }
  drawLang();
  if (!window.LOOT) {
    startMessage =
      'data.js did not load. Start the page with node tools/artwork/run.mjs review.';
    drawStart();
    return;
  }
  try {
    mods = await loadMods();
  } catch (err) {
    startMessage = 'The card code from app/src/lib did not load: ' + err.message;
    drawStart();
    return;
  }
  let state;
  try {
    const res = await fetch('/review-state.json');
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'status ' + res.status);
    state = body;
  } catch (err) {
    startMessage =
      err instanceof TypeError
        ? 'The review server did not answer. Start node tools/artwork/run.mjs review and reload.'
        : String(err.message);
    drawStart();
    return;
  }
  shas = state.shas;
  records = catalogRecords(window.LOOT);
  byId = new Map(records.map((r) => [r.id, r]));
  query = parseReviewQuery(window.location.search);

  try {
    const read = readVerdicts(localStorage.getItem(STORE_KEY));
    if (read.ok) verdicts = pruneVerdicts(read.verdicts, shas);
    else {
      setSaveOff(
        'Verdicts are not saved: ' +
          read.reason +
          '. Shift+Delete on the start screen forgets them.'
      );
    }
  } catch (err) {
    setSaveOff('Verdicts are not saved in this browser: ' + err.message + '.');
  }
  deck = buildDeck({ records, dates: state.dates, shas, verdicts, query });
  show('start');
}

void boot();
