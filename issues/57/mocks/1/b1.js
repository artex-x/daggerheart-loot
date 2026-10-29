/* Batch 1 mock: the foundation the later batches inherit (plan section 10).
   Three specimen states; each draws real strings and real img/ files in the
   proposed system, with MOCK captions where a caption is not proposed UI. */
(function () {
  const { t, R, nm, statLine, badge, art, LANG } = window.M;
  const { E, FI } = window.UA;
  const RA = window.RA;
  const { btn, seg, cap } = RA;
  const rpage = (...a) => window.RX.rpage(...a);

  const STEPS = [
    ['--t-page', 23, 700, E('Таблицы', 'Tables'), E('заголовок страницы', 'page title')],
    ['--t-section', 20, 700, E('Ранг 1', 'Tier 1'), E('раздел', 'section')],
    ['--t-title', 18, 700, nm(R.q4), E('название записи', 'record name')],
    [
      '--t-body',
      16,
      400,
      E(
        'Во время отдыха вы автоматически очищаете Стресс.',
        'During downtime, you automatically clear a Stress.'
      ),
      E('основной текст', 'body')
    ],
    [
      '--t-control',
      15,
      600,
      E('Ссылка на таблицу', 'Link to this table'),
      E('кнопки и поля', 'controls')
    ],
    [
      '--t-small',
      14,
      400,
      E('Показано 91 из 458', '91 of 458 shown'),
      E('описание, счётчики', 'descriptions, counts')
    ],
    [
      '--t-data',
      13,
      400,
      'stat',
      E('строка характеристик: пол 13 px', 'stat line: the 13 px floor')
    ],
    [
      '--t-label',
      12,
      700,
      E('ХАРАКТЕРИСТИКА', 'TRAIT'),
      E('подпись раздела, капителью', 'section label, in capitals')
    ],
    ['--t-badge', 11.5, 700, 'badge', E('бейдж, капителью', 'badge, in capitals')],
    [
      '--t-num',
      19,
      650,
      '12',
      E('число в поле ввода, моноширинный', 'number field value, monospace')
    ]
  ];

  function typeSpec() {
    const sample = ([tok, px, w, text, role]) => {
      let s;
      if (text === 'stat')
        s = `<div class="stat" style="font-size:13px">${statLine(R.q4)}</div>`;
      else if (text === 'badge')
        s = `<div class="line">${badge(R.q4)}<span class="badge uniq">${t('unique')}</span><span class="badge rno">${t('no')} 12</span></div>`;
      else if (tok === '--t-num')
        s = `<div class="num" role="group" aria-label="${t('sumField')}" style="width:max-content"><button>−</button><output>12</output><button>+</button></div>`;
      else if (tok === '--t-label') s = `<span class="lbl">${text}</span>`;
      else
        s = `<div style="font-size:${px}px;font-weight:${w};line-height:${px > 17 ? 1.25 : 1.5}">${text}</div>`;
      return `<div class="srow2"><div class="k"><b>${px} px</b>${tok} · ${role}</div><div>${s}</div></div>`;
    };
    const main = `<main class="wrap"><div class="spec">
      <h1>${E('Шрифт и десять ступеней', 'The font and the ten steps')}</h1>
      ${cap('Source Sans 3 со своего адреса; было: Inter или системный шрифт, 16 ступеней от 9.5 до 23 px', 'Source Sans 3 from the site itself; was: Inter or the system face, 16 steps from 9.5 to 23 px')}
      <section class="panel box">${STEPS.map(sample).join('')}</section>
      <h2>${E('Цифры', 'Numerals')}</h2>
      <section class="panel box">
        <div class="srow2"><div class="k"><b>${E('Шрифт интерфейса', 'UI face')}</b>${E('табличные цифры', 'tabular figures')}</div><div><div class="stat">${statLine(R.q2)}</div><div class="stat">${statLine(R.q13)}</div><span class="badge rno">${t('no')} 89</span></div></div>
        <div class="srow2"><div class="k"><b>${E('Моноширинный', 'Monospace')}</b>${E('количество, цена, кости урона, ступень', 'quantity, price, damage dice, rung')}</div><div class="line"><span class="box2">2</span><span class="box2">150</span><span style="font:600 14px var(--mono)">d10+3</span></div></div>
      </section>
      <h2>${E('В строке таблицы', 'In a table row')}</h2>
      <section class="panel box">${RA.row(R.q4, { noSrc: true, noKind: true })}${RA.row(R.q20, { noSrc: true, noKind: true })}</section>
    </div></main>`;
    return rpage({ job: null }, main);
  }

  function pressedSpec() {
    const lang = `<div class="seg quiet np" role="group" aria-label="${E('Язык', 'Language')}"><button aria-pressed="${LANG === 'ru'}">${LANG === 'ru' ? FI('check') : ''}RU</button><button aria-pressed="${LANG === 'en'}">${LANG === 'en' ? FI('check') : ''}EN</button></div>`;
    const focused = (html) =>
      html.replace('<button aria-pressed="true">', '<button aria-pressed="true" class="fv">');
    const main = `<main class="wrap"><div class="spec">
      <h1>${E('Нажатое по умолчанию и золото', 'The default pressed state and gold')}</h1>
      ${cap('нейтральное нажатое: галочка и светлая рамка, без золота; золото - только выбор, который сужает вид, текущее место и главное действие', 'neutral pressed: a check and a lit border, no gold; gold only for a choice that narrows the view, the current place and the main action')}
      <div class="grid2">
        <section class="panel box"><h3>${E('Нейтральное нажатое', 'Neutral pressed')}</h3>
          <div class="line"><span class="lbl">${E('Язык', 'Language')}</span>${lang}</div>
          <div class="line"><span class="lbl">${E('Вид таблицы', 'Table view')}</span>${seg([t('viewList'), t('viewGrid')], 0)}</div>
          <div class="line"><span class="lbl">${E('Печать', 'Print')}</span>${seg([E('Цветная', 'Color'), E('Чёрно-белая', 'Black and white')], 1)}</div>
          <div class="note">${E('В этом пакете: переключатель языка, вид таблицы, цвет печати. Остальные - в своих пакетах.', 'In this batch: the language switch, the table view, the print color. The rest move in their own batches.')}</div></section>
        <section class="panel box"><h3>${E('Золото: только выбор', 'Gold: a choice only')}</h3>
          <div class="line"><span class="lbl">${t('tier')}</span><button class="chip" aria-pressed="false">${t('all')}</button><button class="chip" aria-pressed="true">1</button><button class="chip" aria-pressed="false">2</button></div>
          <div class="line">${btn(E('Бросить', 'Roll'), { cls: 'primary', i: 'die' })}${btn(t('share'), { i: 'share' })}</div>
          <div class="note">${E('Один золотой основной на панель; «Все» до пакета 3 остаётся как сейчас.', 'One gold primary per panel; «Все» keeps its look until batch 3.')}</div></section>
        <section class="panel box"><h3>${E('Бейджи', 'Badges')}</h3>
          <div class="line">${badge(R.ci1)}${badge(R.cc1)}${badge(R.q1)}${badge(R.q313)}</div>
          <div class="line"><span class="badge uniq">${t('unique')}</span><span class="badge rno">${t('no')} 12</span></div>
          <div class="note">${E('«Уникальное» - нейтральная пунктирная рамка, номер - шрифтом интерфейса.', '"Unique" is a neutral dashed border; the number is in the UI face.')}</div></section>
        <section class="panel box"><h3>${E('Фокус', 'Focus')}</h3>
          <div class="line">${focused(seg([t('viewList'), t('viewGrid')], 0))}${btn(t('tableLink'), { i: 'link', cls: 'fv' })}</div>
          <div class="note">${E('Кольцо фокуса остаётся золотым на любом состоянии.', 'The focus ring stays gold in every state.')}</div></section>
      </div>
    </div></main>`;
    return rpage({ job: null }, main);
  }

  function glyphSpec() {
    const noPic = [
      R.hb1,
      R.hbB,
      R.hbR,
      Object.assign({}, R.q313, { noimg: true, id: 'q313n' })
    ];
    const trio = (r, size) =>
      `<div class="line">${art(r, size)}${art(r, size, '', { loading: true })}${art(Object.assign({}, r, { noimg: true }), size)}</div>`;
    const labels = `<div class="line note">${E('картинка · грузится · нет картинки', 'picture · loading · no picture')}</div>`;
    const card = (r) =>
      `<article class="panel" style="display:grid;grid-template-columns:132px minmax(0,1fr);gap:12px;padding:12px;align-items:start">${art(r, 132)}<div style="display:grid;gap:6px"><b style="font-size:var(--t-title)">${nm(r)}</b><div class="line">${badge(r)}${r.uniq ? `<span class="badge uniq">${t('unique')}</span>` : ''}<span class="badge hb">${E('Хоумбрю', 'Homebrew')}</span></div><div class="stat" style="display:flex;flex-wrap:wrap">${statLine(r, { tier: true })}</div></div></article>`;
    const tile = (r) =>
      `<div class="gcard" style="width:170px">${art(r)}<div class="gt"><b>${nm(r)}</b><div class="stat">${statLine(r)}</div></div></div>`;
    const cover = `<article class="panel lcard" style="max-width:320px"><h3>${t('listName')}</h3><div class="m">${E('10 позиций · изменён 3 дня назад', '10 entries · changed 3 days ago')}</div><div class="thumbs">${['ci1', 'q1', 'q313', 'cc1'].map((id) => art(R[id], 36)).join('')}${art(R.hb1, 36)}${art(Object.assign({}, R.voa), 36, '', { loading: true })}</div></article>`;
    const thumb = `<div class="line">${art(R.hb1, 96)}<div style="display:grid;gap:6px"><b>${E('Картинка', 'Picture')}</b>${btn(E('Загрузить картинку', 'Upload a picture'), { sm: true, i: 'image' })}</div></div>`;
    const main = `<main class="wrap"><div class="spec">
      <h1>${E('Ниша картинки и знак вида', 'The art well and the kind glyph')}</h1>
      ${cap('запись без картинки и картинка, которая ещё грузится или сломана, показывают знак своего вида - на экране, в пустых состояниях и в печати; «?»-постамент удалён (владелец, 2026-10-29)', 'a record with no picture, and a picture still loading or broken, show the glyph of its kind - on screen, in empty states and in print; the "?" pedestal is deleted (owner, 2026-10-29)')}
      <section class="panel box"><h3>${E('Четыре знака', 'The four glyphs')}</h3>
        <div class="line">${noPic.map((r) => art(r, 72)).join('')}</div>
        <div class="note">${E('Оружие · расходник · предмет · броня (Material Icons, знак оружия в макете нарисован взамен Material Symbols «swords»)', 'Weapon · consumable · item · armor (Material Icons; the weapon glyph in the mock stands in for Material Symbols "swords")')}</div></section>
      <div class="grid2">
        <section class="panel box wide"><h3>${E('Карточка', 'Card')}</h3>${card(R.hb1)}</section>
        <section class="panel box"><h3>${E('Строка', 'Row')}</h3>${RA.row(R.hb1, { noSrc: true })}${RA.row(R.q1, { noSrc: true })}</section>
        <section class="panel box"><h3>${E('Плитка сетки', 'Grid tile')}</h3><div class="line" style="align-items:start">${tile(R.q16)}${tile(Object.assign({}, R.q16, { noimg: true, id: 'q16n' }))}</div></section>
        <section class="panel box"><h3>${E('Обложка списка', 'List cover')}</h3>${cover}</section>
        <section class="panel box"><h3>${E('Миниатюра в редакторе', 'Editor thumbnail')}</h3>${thumb}</section>
        <section class="panel box"><h3>${E('Состояния одной ниши', 'One well, three states')}</h3>${trio(R.cc1, 72)}${labels}</section>
      </div>
    </div></main>`;
    return rpage({ job: null, signedIn: true }, main);
  }

  /* The print card of a record with no picture (owner, 2026-10-29): the
     colour card draws the kind glyph in its art block; nothing else of the
     63x88 layout moves. The cards are R's captures of PrintCard.svelte; the
     colour one gets a drawn art block over its picture. */
  function printSpec() {
    const en = LANG === 'en' ? '-en' : '';
    const well = `<div class="pcm-art"><span>${FI('kindItem')}</span></div>`;
    const colour = (glyph) =>
      `<div class="pcm"><img src="../shared/printcard-ci1${en}.png" alt="">${glyph ? well : ''}</div>`;
    const bw = `<div class="pcm"><img src="../shared/preview-emberaxe-bw${en}.png" alt=""></div>`;
    const fig = (c, html) =>
      `<figure class="pfig"><figcaption>${c}</figcaption>${html}</figure>`;
    const main = `<main class="wrap"><div class="spec">
      <h1>${E('Карточка для печати без картинки', 'A print card with no picture')}</h1>
      ${cap('меняется только блок картинки: знак вида на тёмной нише вместо «?»-постамента; раскладка 63×88 мм - закон продукта', 'only the art block changes: the kind glyph on a dark well in place of the "?" pedestal; the 63x88 mm layout is product law')}
      <div class="grid2">
        <section class="panel box"><h3>${E('Цветная', 'Color')}</h3><div class="line" style="align-items:start">
          ${fig(E('запись с картинкой', 'a record with a picture'), colour(false))}
          ${fig(E('без картинки: знак вида', 'no picture: the kind glyph'), colour(true))}</div>
          <div class="note">${E('Нарисовано на снимке карточки «Первоклассный Спальный Мешок»: блок картинки закрыт нишей со знаком.', 'Drawn on the capture of the Premium Bedroll card: a well with the glyph covers its art block.')}</div></section>
        <section class="panel box"><h3>${E('Чёрно-белая', 'Black and white')}</h3><div class="line" style="align-items:start">
          ${fig(E('без картинки, как сегодня', 'no picture, as today'), bw)}</div>
          <div class="note">${E('В чёрно-белой раскладке нет блока картинки ни у одной записи: знаку негде встать без смены раскладки. Вопрос владельцу - на странице пакета.', 'The black-and-white layout has no art block for any record: the glyph has no place without a layout change. The question for the owner is on the batch page.')}</div></section>
      </div></div></main>`;
    return rpage({ job: null, signedIn: true }, main);
  }

  window.XS = { type: typeSpec, pressed: pressedSpec, glyph: glyphSpec, print: printSpec };
})();
