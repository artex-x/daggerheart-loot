/* The homebrew item editor (#/homebrew/<id>, Ember Axe as gm1), shared by
   every direction. `EDITOR(variant)` returns the main content:
   'A' - form | sticky preview, one field per row;
   'B' - form | sticky preview, short choices two to a row;
   'C' - the preview card first, the form beside it.
   `?state=errors` draws the failed save (A7, A8). */
(function () {
  const { t, LANG, ic, art } = window.M;
  const E = (ru, en) => (LANG === 'en' ? en : ru);
  const ERR = new URLSearchParams(location.search).get('state') === 'errors';
  const AXE = { id: 'q17', kind: 'weapon' };

  const seg = (opts, on, cls = '') =>
    `<div class="seg quiet ${cls}" role="group">${opts.map((o, i) => `<button aria-pressed="${i === on}">${o}</button>`).join('')}</div>`;
  const opt = (s) => `<span class="opt">${E('необязательно', 'optional')}</span>`;
  const err = (id, msg) =>
    ERR && msg ? `<p class="ferr" id="${id}-e">${ic('x')}${msg}</p>` : '';
  const fld = (id, label, body, o = {}) =>
    `<div class="ef ${o.wide ? 'wide' : ''} ${ERR && o.err ? 'bad' : ''}" id="${id}"><div class="el"><span>${label}</span>${o.optional ? opt() : ''}</div>${body}${err(id, o.err)}</div>`;

  function form(variant) {
    const dense = variant !== 'A';
    const name = ERR ? '' : E('Топор Тлеющих Углей', 'Emberaxe');
    const sum = ERR
      ? `<div class="esum" role="alert"><b>${E('Не сохранено: заполните 3 поля', 'Not saved: fill in 3 fields')}</b>
          <ul><li><a href="#name">${E('Название', 'Name')}</a></li><li><a href="#tier">${E('Ранг', 'Tier')}</a></li><li><a href="#dmg">${E('Урон', 'Damage')}</a></li></ul></div>`
      : '';
    return `${sum}<section class="es"><h2>${E('Предмет', 'Item')}</h2>
      ${fld('kind', E('Вид', 'Kind'), seg([E('Предмет', 'Item'), E('Расходник', 'Consumable'), E('Снаряжение', 'Equipment')], 2))}
      ${fld('etype', E('Тип снаряжения', 'Equipment type'), seg([E('Основное оружие', 'Primary weapon'), E('Вторичное оружие', 'Secondary weapon'), E('Броня', 'Armor')], 0))}
      ${fld('name', E('Название', 'Name'), `<div class="langs">${seg([`RU <i class="fill ${ERR ? '' : 'on'}"></i>`, 'EN <i class="fill"></i>'], 0, 'lang2')}<span class="lh">${E('Текст на языке', 'Text in')}</span></div><label class="field"><input value="${name}" placeholder="${E('Например, Топор Тлеющих Углей', 'For example, Emberaxe')}" aria-invalid="${ERR}"></label>`, { err: E('Введите название.', 'Enter a name.') })}
      ${fld('desc', E('Описание', 'Description'), `<div class="ta"><div class="tb"><button>${'B'}</button><button><i>I</i></button><button>${ic('list')}</button><button>${ic('table')}</button></div><div class="tx">${E('Лезвие тлеет и не гаснет под дождём.', 'The blade smoulders and does not go out in the rain.')}</div></div>`, { optional: true })}
      ${fld('pic', E('Картинка', 'Picture'), `<div class="pic">${art(AXE, 72)}<button class="btn sm">${ic('image')}${E('Заменить', 'Replace')}</button><button class="btn sm ghost">${E('Убрать', 'Remove')}</button></div>`, { optional: true })}
      </section>
      <section class="es"><h2>${E('Характеристики', 'Statistics')}</h2><div class="${dense ? 'g2' : ''}">
      ${fld('tier', E('Ранг', 'Tier'), seg(['1', '2', '3', '4'], ERR ? -1 : 1), { err: E('Выберите ранг.', 'Pick a tier.') })}
      ${fld('cls', E('Класс', 'Class'), seg([E('Физическое', 'Physical'), E('Магическое', 'Magic')], 1))}
      ${fld('trait', E('Характеристика', 'Trait'), seg([E('Проворность', 'Agility'), E('Сила', 'Strength'), E('Искусность', 'Finesse'), E('Инстинкт', 'Instinct'), E('Влияние', 'Presence'), E('Знание', 'Knowledge'), E('Характеристика Заклинателя', 'Spellcast'), E('Любая', 'Any')], 6, 'wrapseg'), { wide: true })}
      ${fld('range', E('Дистанция', 'Range'), seg([E('Вплотную', 'Melee'), E('Близко', 'Very close'), E('Средне', 'Close'), E('Далеко', 'Far'), E('Очень далеко', 'Very far')], 0, 'wrapseg'), { wide: true })}
      ${fld('dmg', E('Урон', 'Damage'), `<div class="dmg"><label class="field sel"><span>${ERR ? E('Кость', 'Die') : 'd10'}</span>${ic('chev')}</label><span>+</span><label class="field num2"><input value="2" aria-label="${E('Бонус к урону', 'Damage bonus')}"></label></div>`, { err: E('Выберите кость урона.', 'Pick a damage die.') })}
      ${fld('dt', E('Тип урона', 'Damage type'), seg([E('Физический', 'Physical'), E('Магический', 'Magic'), E('Оба', 'Both')], 1))}
      ${fld('burden', E('Хват', 'Burden'), seg([E('Одной рукой', 'One hand'), E('Двумя', 'Two hands'), E('Любой', 'Either')], 1))}
      </div><button class="btn sm ghost addalt">${ic('plus')}${E('Второй набор характеристик', 'Second set of statistics')}</button></section>
      <section class="es"><h2>${E('Где лежит', 'Where it lives')}</h2><div class="${dense ? 'g2' : ''}">
      ${fld('src', E('Источник', 'Source'), `<label class="field sel"><span>${E('Мастерская Ольхи', "Olkha's workshop")}</span>${ic('chev')}</label>`)}
      ${fld('sect', E('Раздел', 'Section'), `<label class="field sel"><span>${E('Холодное оружие', 'Melee weapons')}</span>${ic('chev')}</label>`, { optional: true })}
      </div></section>`;
  }

  function preview(variant) {
    const img = `../shared/preview-emberaxe-bw.png`;
    return `<aside class="prev ${variant === 'C' ? 'big' : ''}" aria-label="${E('Предпросмотр', 'Preview')}">
      <div class="pt">${seg([E('Экран', 'Screen'), E('Печать', 'Print')], 1)}${seg([E('Цвет', 'Colour'), E('Ч/б', 'B&W')], 1)}${seg(['63×88', '44×63'], 1)}</div>
      <img class="pcard" src="${img}" alt="${E('Карточка для печати', 'Print card')}"></aside>`;
  }

  function bar() {
    return `<div class="ebar"><button class="btn primary">${E('Сохранить', 'Save')}</button><button class="btn prevbtn">${ic('image')}${E('Предпросмотр', 'Preview')}</button>
      <a class="inl" href="#">${E('В списках: 1', 'In lists: 1')}</a><button class="btn sm ghost danger2" aria-label="${t('more')}">${ic('more')}${t('more')}</button></div>`;
  }

  window.EDITOR = function (variant) {
    const head = `<a class="back" href="#">← ${t('myItems')}</a><div class="ph"><h1>${E('Топор Тлеющих Углей', 'Emberaxe')}</h1><span class="badge">${E('Хоумбрю', 'Homebrew')}</span></div>`;
    const layout =
      variant === 'C'
        ? `<div class="ed edC">${preview(variant)}<div class="panel eform">${form(variant)}${bar()}</div></div>`
        : `<div class="ed">${`<div class="panel eform">${form(variant)}${bar()}</div>`}${preview(variant)}</div>`;
    const sheet =
      innerWidth <= 760 && !ERR
        ? `<div class="cap">${E('нажат «Предпросмотр»: лист поверх формы', 'Preview pressed: a sheet over the form')}</div>
        <section class="psheet" role="dialog" aria-label="${E('Предпросмотр', 'Preview')}"><div class="grab"></div><div class="sh"><b>${E('Предпросмотр', 'Preview')}</b><button class="btn sm ghost">${ic('x')}${t('close')}</button></div>
        <div class="pt">${seg([E('Экран', 'Screen'), E('Печать', 'Print')], 1)}${seg([E('Цвет', 'Colour'), E('Ч/б', 'B&W')], 1)}${seg(['63×88', '44×63'], 1)}</div><img class="pcard" src="../shared/preview-emberaxe-bw.png" alt=""></section>`
        : '';
    return `<main class="wrap">${head}${layout}${sheet}</main>`;
  };
  window.EDITOR_ERR = ERR;
})();
