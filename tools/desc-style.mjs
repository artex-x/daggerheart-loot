/*
  The catalog text style (docs/specs/FEATURES.md, "Records", "Catalog style"):
  writes every record, set bonus and rule card text of data.js from its plain
  text - a feature name `***Name:***`, a cost paid by choice in bold, a
  condition in italics - so a second run changes nothing.

  Run:  node tools/desc-style.mjs                  prints the counts and what --write would change
        node tools/desc-style.mjs --write          rewrites data.js, then run node tools/build.js
        node tools/desc-style.mjs --report <path>  writes the review report (Markdown)
        --from <file>                              reads that data.js in place of the working one
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* require(), not import: Node imports a .ts file of this typeless package with a
   MODULE_TYPELESS_PACKAGE_JSON warning, and requires it silently (measured
   2026-10-15, Node 24.15.0). */
const { markupText, parseMarkup } = createRequire(import.meta.url)('../app/src/lib/markup.ts');

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data.js');
const HEAD = 'window.LOOT=';

/** A label is a short property name, not every colon in the prose. */
const LABEL_MAX = 34;
/** Inside a list item the head is the name of an option, which runs longer. */
const LABEL_MAX_IN_LIST = 40;

/** Lines that keep their colon as prose, `id:lang:line` (1-based): the owner's
 *  strikes in the label audit. None were struck on 2026-10-14. */
export const STRUCK = new Set([]);

/** Lines whose head is a label that the length rule misses, `id:lang:line`. */
export const LABELS = new Set([
  /* "Curse - Feed the Blade" has five words; the Russian line is labelled. */
  'dve38:en:2'
]);

/** Stat lines of a beastform or transformation card: a stat, not a feature name. */
export const STAT_HEADS = new Set(['Attack', 'Advantage on', 'Атака']);

/** Rule cards whose `Name:` lines are features: two beastforms and one transformation. */
export const FEATURE_REFS = new Set(['powerful-beast', 'pack-predator', 'vampire']);

/** An adversary stat block names a feature `<Name> - <Passive|Action|Reaction>:`. */
const STAT_BLOCK_FEATURE = {
  en: /^.+ - (Passive|Action|Reaction)$/,
  ru: /^.+ - (Пассивный|Пассивно|Действие|Реакция)$/
};

/**
 * The conditions a feature defines (S4): the English terms, their Russian
 * forms, and where the catalog applies each one ("become temporarily X", "While X").
 * The SRD 2.0 PDF pages are where it italicises the same condition.
 */
export const FEATURE_CONDITIONS = [
  {
    en: ['Ablaze'],
    ru: ['Пылать', 'Пылает', 'Объятыми пламенем', 'Объято пламенем'],
    src: 'hc35, set ember-spark; SRD p. 83'
  },
  { en: ['Awed'], ru: ['В Трепете'], src: 'dv10' },
  { en: ['Bleeding'], ru: ['Кровоточить', 'Кровоточащего'], src: 'dve37' },
  { en: ['Blinded'], ru: ['Ослепить', 'Ослеплено', 'Ослеплённое'], src: 'dv20, dve22' },
  { en: ['Chilled'], ru: ['Охлаждённой', 'Охлаждена'], src: 'dve11; SRD p. 144' },
  {
    en: ['Corrupt', 'Corrupted'],
    ru: ['Осквернить', 'Осквернённое', 'Осквернённые'],
    src: 'dve7'
  },
  /* The Russian text names it with a noun; dve7 takes it by override. */
  { en: ['Dominated'], ru: [], src: 'dve7' },
  {
    en: ['Enraptured'],
    ru: ['Очарованной', 'Очарована', 'Очарованную', 'Восхищёнными', 'Восхищённые'],
    src: 'w81, ref enrapture; SRD p. 215'
  },
  { en: ['Enveloped'], ru: [], src: 'ref huge-green-ooze; SRD p. 137' },
  { en: ['Hexed'], ru: ['Проклясть', 'Проклятое'], src: 'dv22; SRD p. 29' },
  { en: ['Horrified'], ru: ['Устрашена', 'Устрашённое'], src: 'voa4_t2e; SRD p. 218' },
  {
    en: ['Incorporeal'],
    ru: ['Бестелесными', 'Бестелесны', 'Нематериальным'],
    src: 'w84, dv65'
  },
  { en: ['Invincible'], ru: ['Неуязвимым'], src: 'w32' },
  { en: ['Irritated'], ru: ['Раздражены', 'Раздражённые'], src: 'dve15' },
  /* The Russian text names it with the noun «Метка»; overrides take those uses. */
  { en: ['Marked'], ru: [], src: 'voa2_t2e, voa3_t4d; SRD p. 9' },
  { en: ['Paranoid'], ru: ['Параноидальной', 'Параноидальна'], src: 'voa2_t4e; SRD p. 132' },
  {
    en: ['Rope', 'Roped'],
    ru: ['Заарканить', 'Заарканенная', 'Заарканенной'],
    src: 'f49, f50, f51, f52; SRD p. 197'
  },
  { en: ['Sapped'], ru: ['Обессиленной'], src: 'aa74, aa75, aa76, aa77' },
  { en: ['Seduced'], ru: ['Соблазнённой', 'Соблазнённая'], src: 'voa3_t4e' },
  { en: ['Slowed'], ru: ['Замедлен'], src: 'dve66; SRD p. 110' },
  {
    en: ['Stun', 'Stunned'],
    ru: [
      'Оглушить',
      'Оглушите',
      'Оглушён',
      'Оглушена',
      'Оглушены',
      'Оглушённым',
      'Оглушённая',
      'Оглушённое'
    ],
    src: 'w42, w54, voa2_t4c, dv67; SRD p. 215'
  },
  { en: ['Terrified'], ru: ['Напугано', 'Напуганное'], src: 'dv37' },
  { en: ['Tethered'], ru: ['Привязанной', 'Привязана'], src: 'w51' },
  { en: ['Thunderstruck'], ru: ['Поражёнными Громом', 'Поражённая Громом'], src: 'dv72' },
  { en: ['Wracked'], ru: ['Измученной', 'Измученное'], src: 'dv21' }
];

/** Conditions in a rules sense (S4), capitalised forms only: the core ones (SRD p. 52),
 *  then the feature-defined ones. */
export const CONDITIONS = {
  en: [
    ...['Hidden', 'Restrained', 'Restrain', 'Restrains', 'Restraining', 'Vulnerable'],
    ...FEATURE_CONDITIONS.flatMap((c) => c.en)
  ],
  ru: [
    ...['Уязвим', 'Уязвима', 'Уязвимо', 'Уязвимы', 'Уязвимой', 'Уязвимым', 'Уязвимыми'],
    ...['Обездвижен', 'Обездвижена', 'Обездвижены', 'Обездвиженное', 'Обездвиженная'],
    ...['Обездвиженного', 'Обездвиженной', 'Обездвиженным', 'Обездвиженными'],
    ...['Обездвижить', 'Обездвиживают', 'Обездвиживая'],
    ...['Скрыт', 'Скрыты', 'Скрытым', 'Скрытыми'],
    ...FEATURE_CONDITIONS.flatMap((c) => c.ru)
  ]
};

/**
 * The choices the rules do not make, each with its reason: `{ id, lang, rule, text,
 * n, as, why }`. `rule` is `cost` or `condition`, `text` the matched phrase or term,
 * `n` its 1-based use among the same matches in that text, `as` `bold`, `italic` or
 * `plain`. An override that matches nothing throws.
 */
export const OVERRIDES = [
  ...['en', 'ru'].map((lang) => ({
    id: 'cc21',
    lang,
    rule: 'cost',
    text: lang === 'en' ? 'spend any number of Hope' : 'потратить любое количество Надежды',
    n: 1,
    as: 'bold',
    why: 'an option for an effect: "You can use this stitcher to spend any number of Hope and clear"'
  })),
  ...['en', 'ru'].map((lang) => ({
    id: 'w11',
    lang,
    rule: 'cost',
    text: lang === 'en' ? 'spend all your Hope' : 'потратить всю Надежду',
    n: 1,
    as: 'bold',
    why: 'an option for an effect: "You can swallow this stone and spend all your Hope (minimum 1) to unsay"'
  })),
  {
    id: 'w48',
    lang: 'en',
    rule: 'cost',
    text: 'spend a Hope',
    n: 1,
    as: 'bold',
    why: 'an option: "You can then spend a Hope at any time to cast the spell"'
  },
  {
    id: 'w60',
    lang: 'ru',
    rule: 'condition',
    text: 'Обездвиживания',
    n: 1,
    as: 'italic',
    why: 'the Restrained condition as a noun: EN "to avoid being Restrained"'
  },
  {
    id: 'cm33',
    lang: 'ru',
    rule: 'cost',
    text: 'Получив Стресс',
    n: 1,
    as: 'bold',
    why: 'the price of the leap: RU writes EN "By marking 1 Stress" as «Получив Стресс»'
  },
  {
    id: 'voa2_t2e',
    lang: 'ru',
    rule: 'condition',
    text: 'Меткой',
    n: 2,
    as: 'italic',
    why: 'the Marked condition: «Пока цель отмечена Меткой» is EN "While Marked"'
  },
  ...[1, 2].map((n) => ({
    id: 'voa3_t4d',
    lang: 'ru',
    rule: 'condition',
    text: 'Метку',
    n,
    as: 'italic',
    why: 'the Marked condition: «получает Метку» is EN "they are Marked"'
  })),
  {
    id: 'voa3_t4d',
    lang: 'ru',
    rule: 'condition',
    text: 'Меткой',
    n: 1,
    as: 'italic',
    why: 'the Marked condition: «Пока цель отмечена Меткой» is EN "While Marked"'
  },
  {
    id: 'voa1_t3e',
    lang: 'en',
    rule: 'condition',
    text: 'Dominated',
    n: 1,
    as: 'plain',
    why: 'the name of a countdown, not a creature in the condition (RU «Отсчёт Подчинения»)'
  },
  {
    id: 'voa2_c4',
    lang: 'en',
    rule: 'condition',
    text: 'Dominated',
    n: 1,
    as: 'plain',
    why: 'the name of a counter, not a creature in the condition (RU «счётчик Подчинения»)'
  },
  ...[1, 2].map((n) => ({
    id: 'voa4_t4e',
    lang: 'en',
    rule: 'condition',
    text: 'hidden',
    n,
    as: 'italic',
    why: 'the Hidden condition, which the RU text capitalises («Скрыты», «Скрытым»)'
  })),
  ...['en', 'ru'].map((lang) => ({
    id: 'w30',
    lang,
    rule: 'cost',
    text: lang === 'en' ? 'mark a Stress' : 'отметить Стресс',
    n: 1,
    as: 'plain',
    why: 'another payer: "A creature creating a magical tune can mark a Stress to maintain it"'
  })),
  {
    id: 'w59',
    lang: 'ru',
    rule: 'cost',
    text: 'отметить Стресс',
    n: 1,
    as: 'plain',
    why: 'another payer: the mimicked creature («оно испытывает ... должно отметить Стресс»)'
  },
  ...['en', 'ru'].map((lang) => ({
    id: 'dve9',
    lang,
    rule: 'cost',
    text: lang === 'en' ? 'mark a Stress' : 'отметьте Стресс',
    n: 1,
    as: 'plain',
    why: 'a penalty of every attack, not an option; the cost is "a Stress and a HP"'
  })),
  {
    id: 'dve7',
    lang: 'ru',
    rule: 'condition',
    text: 'Контролем',
    n: 1,
    as: 'italic',
    why: 'the Dominated condition: «под вашим Контролем» is EN "Dominated by you"'
  },
  {
    id: 'dve7',
    lang: 'ru',
    rule: 'condition',
    text: 'Контролируемые',
    n: 1,
    as: 'italic',
    why: 'the Dominated condition: «Контролируемые вами существа» is EN "Dominated creatures"'
  },
  {
    id: 'mw63',
    lang: 'ru',
    rule: 'cost',
    text: 'отметьте Стресс',
    n: 1,
    as: 'bold',
    why: 'the price of each range beyond Very Close: EN "Mark a Stress for each", RU «за каждую»'
  },
  {
    id: 'mw77',
    lang: 'en',
    rule: 'cost',
    text: 'mark a Stress',
    n: 1,
    as: 'bold',
    why: 'an option for a purpose with the trigger between: "mark a Stress when ... to gain a +1"'
  },
  ...['en', 'ru'].map((lang) => ({
    id: 'mw34',
    lang,
    rule: 'cost',
    text: lang === 'en' ? 'Mark 2 Stress' : 'Отметьте 2 Стресса',
    n: 1,
    as: 'bold',
    why: 'the price of the move: "Mark 2 Stress, and all other party members clear a Stress"'
  }))
];

/** The records whose EN and RU markup shapes differ on purpose, with the reason. */
export const SHAPE_EXCEPTIONS = new Map([
  ['hc35', 'RU says «это состояние» where EN names "the Ablaze condition"'],
  ['w32', 'RU joins "While Invincible" into the sentence before and names the condition once'],
  [
    'w57',
    'RU names the Restrained target («Обездвиженная цель») where EN says "a trapped target"'
  ],
  [
    'ref huge-green-ooze',
    'RU drops the two "Enveloped" clauses and writes the verb «обволакивает» in lowercase'
  ]
]);

const CYR = 'а-яёА-ЯЁ';
const EN_N =
  '(?:an additional|any number of|all your|your last|up to \\d+|\\d+ or more|one or more|this stored|the|an|a|one|two|three|\\d+)';
const RU_N =
  '(?:любое количество|эту сохранённую|\\d+ или более|дополнительн[а-яё]*|последн[а-яё]*|всю|одну|один|две|два|три|ещё|\\d+)';
const COST = {
  en: new RegExp(
    `\\b(?:[Ss]pend|[Ss]pends|[Ss]pending|[Mm]ark|[Mm]arks|[Mm]arking)\\s+(?:${EN_N}\\s+)?(?:Hope|Fear|Stress|Armor Slots?|Hit Points?|HP)\\b`,
    'g'
  ),
  ru: new RegExp(
    `(?<![${CYR}])(?:[Пп]отрат[а-яё]*|[Тт]рат[а-яё]*|[Оо]тмет[а-яё]*|[Оо]тмеча[а-яё]*)\\s+(?:${RU_N}\\s+)?(?:Надежд[а-яё]*|Страх[а-яё]*|Стресс[а-яё]*|Ран[а-яё]*|Ячейк[а-яё]* Брони)(?![${CYR}])`,
    'g'
  )
};

/** The bold rules of a cost (S2/S3), in order: the first that fires decides. */
const REFERENCE = {
  en: [
    /\b(when|whenever|if|until|unless|before|after|time|once|while)\s+(you|they|it|the \w+|an? \w+)\s+(would\s+)?(also\s+)?$/i,
    /\b(would|without|instead of|not|can't|cannot)\s+$/i
  ],
  ru: [
    new RegExp(
      `(?<![${CYR}])(когда|если|пока|прежде чем|перед тем как|как только|вместо того,? чтобы)\\s+(вы\\s+)?(бы\\s+|хотите\\s+|должны\\s+)?$`,
      'i'
    ),
    new RegExp(`(?<![${CYR}])(не|без|вместо)\\s+((может|можете|могут|можно)\\s+)?$`, 'i')
  ]
};
const OTHER_PAYER = {
  en: /\b(target|targets|they|it|creature|creatures|enemy|enemies|adversary|adversaries|ally|allies|GM|who|that|each)\s+(must\s+|also\s+|can\s+|immediately\s+)?$/i,
  ru: new RegExp(
    `(?<![${CYR}])(цель|цели|они|оно|он|она|существо|существа|противник[а-яё]*|враг[а-яё]*|союзник[а-яё]*|Мастер|кто|котор[а-яё]*)\\s+(долж[а-яё]+\\s+|также\\s+|может\\s+|могут\\s+|немедленно\\s+)?$`,
    'i'
  )
};
/* The subject of a "must" clause is a creature, not the user: "Creatures outside
   that range must mark a Stress to see inside". */
const OTHER_MUST = {
  en: /\b(creature|creatures|spirits|target|targets|they|enemies|adversaries)\b((?!\byou\b)[^.])*\bmust\s+$/i,
  ru: new RegExp(
    `(?<![${CYR}])(существо|существа|духи|цель|цели|они|оно|враги|противники)(?![${CYR}])((?!(?<![${CYR}])вы(?![${CYR}]))[^.])*(?<![${CYR}])долж[а-яё]+\\s+$`,
    'i'
  )
};
const OPTION = {
  en: /\b(can|may)\s+(also\s+|instead\s+)?$/i,
  ru: new RegExp(
    `(?<![${CYR}])(можете|может|могут|можно)\\s+(также\\s+|вместо этого\\s+)?$`,
    'i'
  )
};
const PURPOSE_AFTER = { en: /^ (to|for) /, ru: /^(,? чтобы | для )/ };
const PURPOSE_BEFORE = { en: /^To /, ru: /^Чтобы / };

/** Returns how a cost phrase is written, and the rule that decided it. */
export function costRule(lang, phrase, pre, post, sentence) {
  if (REFERENCE[lang].some((re) => re.test(pre))) return { as: 'plain', by: 'reference' };
  if (OTHER_PAYER[lang].test(pre) || OTHER_MUST[lang].test(pre))
    return { as: 'plain', by: 'another payer' };
  if (OPTION[lang].test(pre)) return { as: 'bold', by: 'option' };
  if (
    PURPOSE_AFTER[lang].test(post) ||
    PURPOSE_BEFORE[lang].test(sentence) ||
    (lang === 'en' && /\bby\s+$/i.test(pre)) ||
    /* An order and its effect: "Mark a Stress and clear a HP", «Отметьте Стресс и ...». */
    (lang === 'en' &&
      /^(spend|mark)\s/i.test(phrase) &&
      /(^|,\s*)$/.test(pre) &&
      /^ and /.test(post)) ||
    (lang === 'ru' && /те$/.test(phrase.split(/\s/)[0]) && /^ и /.test(post)) ||
    (lang === 'ru' && /в$/.test(phrase.split(/\s/)[0]) && /^, (вы можете|можно)/.test(post))
  )
    return { as: 'bold', by: 'price' };
  return { as: 'plain', by: 'review' };
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Returns a regexp of whole-word uses of `words` (case-sensitive) in `lang`. */
function wordsRe(words, lang) {
  const alt = [...words]
    .sort((a, b) => b.length - a.length)
    .map(escapeRe)
    .join('|');
  return lang === 'ru'
    ? new RegExp(`(?<![${CYR}])(?:${alt})(?![${CYR}])`, 'g')
    : new RegExp(`\\b(?:${alt})\\b`, 'g');
}
const CONDITION_RE = { en: wordsRe(CONDITIONS.en, 'en'), ru: wordsRe(CONDITIONS.ru, 'ru') };

/** Returns whether a record's text names its properties, as a catalog book does:
 *  equipment, Vault of Ages, Arazo's Artifacts and Many Worlds Tavern. */
export function isLabelled(record) {
  return !!record.eq || record.src === 'voa' || record.src === 'arazo' || record.src === 'mwt';
}

/** Returns the label of a line by the rule the app used before 2026-10-15
 *  (`git show 74359d13:app/src/lib/desc.ts`, `splitLabel`), or '' for none. */
export function labelOf(line, inList) {
  const i = line.indexOf(': ');
  if (i < 0) return '';
  const head = line.slice(0, i);
  const ok = inList
    ? head.length <= LABEL_MAX_IN_LIST
    : head.length <= LABEL_MAX && !/[,.;]/.test(head) && head.split(' ').length <= 4;
  return ok ? head : '';
}

/** Returns the context the style of one text needs: `{ id, labelled, ref }`. */
export function contextOf(kind, key, value) {
  if (kind === 'set') return { id: 'set ' + key, labelled: false, ref: '' };
  if (kind === 'ref') return { id: 'ref ' + key, labelled: false, ref: key };
  return { id: value.id, labelled: isLabelled(value), ref: '' };
}

/** Returns the label head of line `n` (1-based) of a text, or ''. */
function headOf(body, inList, lang, ctx, n) {
  const key = `${ctx.id}:${lang}:${String(n)}`;
  let head = '';
  if (LABELS.has(key)) head = body.slice(0, Math.max(0, body.indexOf(': ')));
  else if (STRUCK.has(key)) head = '';
  else if (ctx.labelled) head = labelOf(body, inList);
  else if (ctx.ref) {
    const i = body.indexOf(': ');
    const h = i < 0 ? '' : body.slice(0, i);
    if (STAT_BLOCK_FEATURE[lang].test(h)) head = h;
    else if (FEATURE_REFS.has(ctx.ref)) {
      const l = labelOf(body, inList);
      if (!STAT_HEADS.has(l)) head = l;
    }
  }
  /* A head that starts or ends with a space cannot open or close a span. */
  return head && head.trim() === head ? head : '';
}

/** Returns the sentence of `s` around [start, end): its start offset and its end offset. */
function sentenceOf(s, start, end) {
  let a = 0;
  for (const m of s.slice(0, start).matchAll(/[.!?;:]\s+/g)) a = m.index + m[0].length;
  const rest = /[.!?;]\s|[.!?]$/.exec(s.slice(end));
  return [a, rest ? end + rest.index : s.length];
}

/** Returns the uses of `text` as a whole word in `s`, as offsets. */
function usesOf(s, text, lang) {
  return [...s.matchAll(wordsRe([text], lang))].map((m) => m.index);
}

/**
 * Returns the styled text of `plain` and its spans: `{ text, spans: [{ rule, text,
 * line, as, by, why? }], used }`. `used` is the set of overrides it applied.
 */
export function styleText(plain, lang, ctx, overrides = OVERRIDES) {
  if (/[*\\]/.test(plain) || plain.split('\n').some((l) => l.startsWith('|')))
    throw new Error(
      `The plain text of ${ctx.id} (${lang}) holds a star, a backslash or a table line. Write the markup by hand and leave it out of the style`
    );
  const spans = [];
  const used = new Set();
  const mine = overrides.filter((o) => o.id === ctx.id && o.lang === lang);
  const parts = plain.split('\n').map((line, k) => {
    const inList = line.startsWith('- ');
    const body = inList ? line.slice(2) : line;
    const head = body ? headOf(body, inList, lang, ctx, k + 1) : '';
    return { lead: inList ? '- ' : '', head, rest: body.slice(head ? head.length + 1 : 0) };
  });
  /* Where each override lands: its n-th use in the text, counted over the lines. */
  const targets = parts.map(() => []);
  for (const o of mine) {
    let left = o.n;
    for (const [k, p] of parts.entries()) {
      const uses = usesOf(p.rest, o.text, lang);
      if (left <= uses.length) {
        targets[k].push({ o, at: uses[left - 1] });
        used.add(o);
        break;
      }
      left -= uses.length;
    }
  }
  const lines = parts.map(({ lead, head, rest }, k) => {
    /* Candidates on the rest of the line, after the label. */
    const marks = [];
    const offset = lead.length + (head ? head.length + 1 : 0);
    for (const m of rest.matchAll(COST[lang])) {
      const [a, z] = sentenceOf(rest, m.index, m.index + m[0].length);
      const sentence = rest.slice(a, z);
      const pre = rest.slice(a, m.index);
      const post = rest.slice(m.index + m[0].length, z);
      const { as, by } = costRule(lang, m[0], pre, post, sentence);
      marks.push({ start: m.index, end: m.index + m[0].length, rule: 'cost', as, by });
    }
    for (const m of rest.matchAll(CONDITION_RE[lang]))
      marks.push({
        start: m.index,
        end: m.index + m[0].length,
        rule: 'condition',
        as: 'italic',
        by: 'term'
      });
    for (const { o, at } of targets[k]) {
      const found = marks.find((x) => x.start === at && x.end === at + o.text.length);
      if (found) Object.assign(found, { as: o.as, by: 'override', why: o.why });
      else
        marks.push({
          start: at,
          end: at + o.text.length,
          rule: o.rule,
          as: o.as,
          by: 'override',
          why: o.why
        });
    }
    marks.sort((x, y) => x.start - y.start);
    let out = '';
    let at = 0;
    for (const x of marks) {
      if (x.start < at)
        throw new Error(`Two spans overlap in ${ctx.id} (${lang}) line ${String(k + 1)}`);
      const word = rest.slice(x.start, x.end);
      const mark = x.as === 'bold' ? '**' : x.as === 'italic' ? '*' : '';
      out += rest.slice(at, x.start) + mark + word + mark;
      at = x.end;
      const span = {
        rule: x.rule,
        text: word,
        line: k + 1,
        at: offset + x.start,
        as: x.as,
        by: x.by
      };
      if (x.why) span.why = x.why;
      spans.push(span);
    }
    out += rest.slice(at);
    if (head)
      spans.push({
        rule: 'label',
        text: head,
        line: k + 1,
        at: lead.length,
        as: 'label',
        by: 'label'
      });
    return lead + (head ? '***' + head + ':***' : '') + out;
  });
  return { text: lines.join('\n'), spans, used };
}

/** Returns the count of bold and italic spans of `src`, as the shape check counts them. */
export function shapeOf(src) {
  const n = { b: 0, i: 0 };
  const walk = (c) =>
    c.forEach((x) => {
      if (x.t === 'text') return;
      n[x.t]++;
      walk(x.c);
    });
  for (const b of parseMarkup(src)) {
    if (b.t === 'p') walk(b.c);
    else if (b.t === 'table') [b.head, ...b.rows].forEach((row) => row.forEach(walk));
    else b.items.forEach(walk);
  }
  return n;
}

/** Returns every catalog text of `L`: `[ctx, holder]`, records, then sets, then rule cards. */
function textsOf(L) {
  const out = [];
  for (const r of [].concat(...Object.values(L.items), L.eq))
    out.push([contextOf('record', r.id, r), r]);
  for (const [k, s] of Object.entries(L.sets || {})) out.push([contextOf('set', k, s), s]);
  for (const [k, r] of Object.entries(L.refs || {})) out.push([contextOf('ref', k, r), r]);
  return out;
}

/**
 * Returns the styled data and the changes: `{ data, changes: [{ id, lang, before,
 * after, spans }], styled: [{ id, lang, text, spans }] }`. Throws when a styled
 * text, markers removed, is not its plain text, and on a stale override.
 */
export function convert(L, overrides = OVERRIDES) {
  const data = structuredClone(L);
  const changes = [];
  const styled = [];
  const used = new Set();
  for (const [ctx, holder] of textsOf(data)) {
    for (const [key, lang] of [
      ['ende', 'en'],
      ['rud', 'ru']
    ]) {
      const before = holder[key];
      if (typeof before !== 'string' || !before) continue;
      const plain = markupText(before);
      const out = styleText(plain, lang, ctx, overrides);
      out.used.forEach((o) => used.add(o));
      const n = shapeOf(out.text);
      const want = out.spans.reduce(
        (acc, s) => {
          if (s.as === 'label' || s.as === 'bold') acc.b++;
          if (s.as === 'label' || s.as === 'italic') acc.i++;
          return acc;
        },
        { b: 0, i: 0 }
      );
      if (markupText(out.text) !== plain || n.b !== want.b || n.i !== want.i)
        throw new Error(
          `The styled text of ${ctx.id} (${lang}) does not read as its plain text. Fix the style rule before --write`
        );
      styled.push({ id: ctx.id, lang, text: out.text, spans: out.spans });
      if (out.text === before) continue;
      holder[key] = out.text;
      changes.push({ id: ctx.id, lang, before, after: out.text, spans: out.spans });
    }
  }
  const stale = overrides.filter((o) => !used.has(o));
  if (stale.length)
    throw new Error(
      `${String(stale.length)} overrides match nothing, first ${stale[0].id} (${stale[0].lang}) "${stale[0].text}" #${String(stale[0].n)}. Remove them from OVERRIDES`
    );
  return { data, changes, styled };
}

/** Returns the parsed data.js, and refuses a file that JSON.stringify would not write back. */
export function readData(text) {
  if (!text.startsWith(HEAD)) throw new Error('data.js does not start with window.LOOT=');
  const end = text.lastIndexOf('};') + 1;
  const L = JSON.parse(text.slice(HEAD.length, end));
  const tail = text.slice(end);
  if (HEAD + JSON.stringify(L) + tail !== text)
    throw new Error('data.js is not one JSON.stringify line. Rewrite it by hand instead');
  return { L, tail };
}

/** Returns the counts of each rule's spans per language: `{ 'label en': n, ... }`. */
export function countsOf(styled) {
  const out = {};
  for (const t of styled)
    for (const s of t.spans) {
      const k = `${s.rule} ${s.as} ${t.lang}`;
      out[k] = (out[k] || 0) + 1;
    }
  return out;
}

/** Returns the texts whose EN and RU shapes differ: `[{ id, en, ru, exception }]`. */
export function shapeDiffs(styled) {
  const by = new Map();
  for (const t of styled) {
    const e = by.get(t.id) || { en: '', ru: '' };
    e[t.lang] = t.text;
    by.set(t.id, e);
  }
  const out = [];
  for (const [id, { en, ru }] of by) {
    const a = shapeOf(en);
    const b = shapeOf(ru);
    if (a.b !== b.b || a.i !== b.i)
      out.push({ id, en: a, ru: b, exception: SHAPE_EXCEPTIONS.get(id) || '' });
  }
  return out;
}

/** Returns a short context of a span: the words around it on its line. */
function around(text, span) {
  const line = markupText(text).split('\n')[span.line - 1] || '';
  const end = span.at + span.text.length;
  const a = Math.max(0, line.lastIndexOf(' ', Math.max(0, span.at - 28)));
  const z = line.indexOf(' ', Math.min(line.length, end + 18));
  const mark = span.as === 'bold' ? '**' : span.as === 'italic' ? '*' : '';
  return (
    (a > 0 ? '...' : '') +
    (
      line.slice(a, span.at) +
      mark +
      span.text +
      mark +
      line.slice(end, z < 0 ? line.length : z)
    ).trim() +
    (z < 0 ? '' : '...')
  );
}

/** Returns the review report of a run, as Markdown. */
export function reportOf(result, sources) {
  const { styled, changes } = result;
  const counts = countsOf(styled);
  const out = ['# Catalog style report', ''];
  out.push(
    'Generated by `node tools/desc-style.mjs --report`. Task scratch: it leaves with the task directory.',
    ''
  );
  out.push('## Counts', '', '| Rule | As | EN | RU |', '|---|---|---|---|');
  const keys = new Set(Object.keys(counts).map((k) => k.split(' ').slice(0, 2).join(' ')));
  for (const k of [...keys].sort())
    out.push(
      `| ${k.split(' ')[0]} | ${k.split(' ')[1]} | ${String(counts[k + ' en'] || 0)} | ${String(counts[k + ' ru'] || 0)} |`
    );
  out.push(
    '',
    `Changed texts: ${String(changes.length)} in ${String(new Set(changes.map((c) => c.id)).size)} records, sets and rule cards.`,
    ''
  );
  out.push('## SRD sources', '', ...sources, '');
  out.push('## Ambiguous cases', '', ...AMBIGUOUS, '');
  const diffs = shapeDiffs(styled);
  out.push('## Shape exceptions', '');
  if (!diffs.length) out.push('None: every EN and RU pair has the same shape.');
  for (const d of diffs)
    out.push(
      `- ${d.id}: EN b${String(d.en.b)} i${String(d.en.i)}, RU b${String(d.ru.b)} i${String(d.ru.i)} - ${d.exception || 'NO EXCEPTION'}`
    );
  out.push('', '## Overrides', '');
  for (const t of styled)
    for (const s of t.spans.filter((x) => x.by === 'override'))
      out.push(`- ${t.id} ${t.lang} ${s.rule} "${s.text}" -> ${s.as}: ${s.why}`);
  out.push(
    '',
    '## Review: costs no bold rule names',
    '',
    'Each is plain (bold rule 5): no option, price, order or purpose names it, so it reads as a penalty or a consequence (S3). The choices that differ are overrides, above.',
    ''
  );
  for (const t of styled)
    for (const s of t.spans.filter((x) => x.rule === 'cost' && x.by === 'review'))
      out.push(`- ${t.id} ${t.lang}: ${around(t.text, s)}`);
  out.push(
    '',
    '## The set name lead',
    '',
    'The set name before a set bonus stays italic: code draws it (`RecordCard`, `PrintCard`, `share.ts`), not the record text.',
    ''
  );
  out.push('## Every cost and condition span', '');
  for (const t of styled)
    for (const s of t.spans.filter((x) => x.rule !== 'label'))
      out.push(
        `- ${t.id} ${t.lang} ${s.rule === 'cost' ? 'S2' : 'S4'} ${s.by}: ${around(t.text, s)}`
      );
  const byId = Map.groupBy(styled, (t) => t.id);
  const labelOnly = [...byId]
    .filter(
      ([, ts]) =>
        ts.some((t) => t.spans.length) &&
        ts.every((t) => t.spans.every((x) => x.rule === 'label'))
    )
    .map(([id]) => id);
  out.push(
    '',
    '## Label-only texts',
    '',
    `${String(labelOnly.length)} records carry labels and no other span: ${labelOnly.join(', ')}.`,
    ''
  );
  return out.join('\n');
}

/** Where the SRD 2.0 PDF (DH_SRD_2_2026_08_25.pdf, PDF pages) shows each rule, for the report. */
const SOURCES = [
  '- S1, a feature name `***Name:***`: p. 36 (ancestry, "Adaptability:"), p. 16 (beastform, "Rampage:"), p. 97 (adversary, "Bite - Action:").',
  '- S2, a cost paid by choice in bold: p. 218 (domain card, "you can **spend a Hope** to"), p. 97 ("**Mark a Stress** to make an attack"). The SRD loot tables, pp. 75-83, keep the same costs plain; the catalog takes the card style for loot (docs/decisions/2026-10-15-catalog-text-follows-the-srd-card-style.md).',
  '- S3, a consequence plain: p. 21 ("they must mark a Stress"), p. 77.',
  '- S4, a condition in italics: p. 52 (Conditions), p. 10 ("temporarily *Vulnerable*"); feature-defined conditions, for example p. 29 (*Hexed*) and p. 83 (*Ablaze*, a loot entry).',
  '- S5, dice and the Spellcast Roll plain: the SRD bolds them (p. 23, "**Spellcast Roll (15)**"; p. 9, "**d6s**"); the catalog keeps them plain (docs/decisions/2026-10-15-catalog-text-follows-the-srd-card-style.md).',
  '- S6, ranges, damage types and numbers plain: p. 97 ("knocked back to Very Close range").',
  '- Stat lines: the SRD bolds an adversary stat head (p. 97, "**ATK:**", "**Experience:**"); the catalog keeps the stat lines plain.',
  '- S7, Recall Cost: Vault of Ages is not in the SRD; it is a property name, as S1.'
];

/** The cases a reader could take either way, with the choice and its reason, for the report. */
const AMBIGUOUS = [
  '- "hidden" as an ordinary word (q88, q125, cm3, cm58, cm62, hi5, voa4_t2h; RU «скрыт-» in cm3, cm62, q125): plain. A lowercase form is never the condition (S4).',
  '- voa4_t4e, lowercase "hidden" in EN, «Скрыты», «Скрытым» in RU: italic in both. The RU text writes the condition, so EN takes it by override.',
  '- voa3_t4f, "locate hidden creatures" / «скрытых существ»: plain in both. An adjective in both languages.',
  '- "restrain" as an ordinary verb (cm22 "A restrained target gains the Restrained condition", cm82): the lowercase uses plain, the capitalised condition italic.',
  '- w60, «Обездвиживания»: italic by override. It is the noun of EN "being *Restrained*".',
  '- Marked (voa2_t2e, voa3_t4d): italic. RU names the condition with the noun «Метка», which takes the italics by override where EN writes "Marked"; "Mark another creature" and "your Mark" stay plain.',
  '- Dominated: italic in dve7 (RU «Контролем», «Контролируемые» by override); plain in voa1_t3e and voa2_c4, where it names a countdown or a counter.',
  '- References, not costs (q330 and voa4_t2d "When you would spend a Hope", hi60, hc27 "without spending a Hope", ci29, hc59, hc40 "until you mark a Hit Point"): plain by bold rule 1. RU «Когда вы должны отметить ...» is the same reference (rule 1 takes «должны»).',
  '- Reloading (q36, q59, q97, q128, q148, q165, q196, q214, q227, q232) "you must mark a Stress to reload": bold by rule 4 (S2). Painful (q143, q211, q351, voa4_t4b) and Bulky (q320, q334, q355, q375) "you must mark a Stress": plain, rule 5.',
  '- A cost an order names with its effect ("Mark a Stress and clear a HP", cc18; «Отметьте Стресс и передвиньтесь», q155, q376, dve14): bold by rule 4.',
  '- Another payer in a "must" clause (w53 spirits, w81 Enraptured creatures, w105 creatures outside the light, dv10 an Awed creature): plain by bold rule 2.',
  '- dve9, "mark a Stress and a HP" on every attack: plain by override. A penalty, not an option.',
  '- hi52, hi53, "spend the Hope of whoever is wearing the other ring": bold. An option the wearer takes.',
  '- dve38, "Curse - Feed the Blade" has five words: a forced label (`LABELS`); EN and RU both label line 2.',
  '- Rule card stat lines (`Motives & Tactics:`, `Difficulty:`, `ATK:`, `Experience:`, `Attack:`, `Advantage on:`): plain, although the SRD bolds an adversary stat head. Only the feature lines take S1.'
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i < 0 ? '' : process.argv[i + 1] || '';
}

function main() {
  const from = arg('--from') || DATA;
  const text = readFileSync(from, 'utf8');
  const { L, tail } = readData(text);
  const result = convert(L);
  const counts = countsOf(result.styled);
  for (const k of Object.keys(counts).sort()) console.log(`${k}: ${String(counts[k])}`);
  const diffs = shapeDiffs(result.styled).filter((d) => !d.exception);
  console.log(`${String(diffs.length)} texts differ in EN and RU shape with no exception`);
  const records = new Set(result.changes.map((c) => c.id)).size;
  console.log(`${String(result.changes.length)} texts in ${String(records)} records change`);
  const report = arg('--report');
  if (report) {
    writeFileSync(report, reportOf(result, SOURCES), 'utf8');
    console.log('wrote ' + report);
  }
  if (process.argv.includes('--write') && result.changes.length) {
    writeFileSync(DATA, HEAD + JSON.stringify(result.data) + tail, 'utf8');
    console.log('wrote data.js; run node tools/build.js');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
