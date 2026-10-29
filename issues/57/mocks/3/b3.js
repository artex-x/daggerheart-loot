/* Batch 3 mock: the catalog tables and filters (plan section 7, batch 3).
   R's catalog states, plus the search highlight (C59) and the two owner
   questions: the tables help panel (C1) and where the view choice lives
   (C57). */
(function () {
  const { E, addr } = window.UA;
  const RA = window.RA;
  const { btn, cap } = RA;
  const ST = RA.STATES;
  const path = '/tables/eq_weapon';
  const at = (html, p = path) => `${addr(p)}${html}`;

  /* C1: the panel's ten paragraphs explain the controls; three of them are
     facts about the data that no control can carry. */
  const NOTES = [
    [
      E('Источники.', 'Sources.'),
      E(
        'Daggerheart Core Set и Hope & Fear, с учётом эрраты. Русские названия - перевод daggerheart.su, для Hope & Fear - таблица сообщества.',
        'The Daggerheart Core Set and Hope & Fear, with the errata applied. Russian names: the daggerheart.su translation, and the community table for Hope & Fear.'
      )
    ],
    [
      E('Ранг в Wondrous Environments.', 'Tier in Wondrous Environments.'),
      E(
        'Книга не печатает ранг рядом с вещью: он взят у локации из таблицы «Loot items by environment».',
        'The book does not print the tier next to the item: it comes from the location in the "Loot items by environment" table.'
      )
    ],
    [
      E('Класс и урон.', 'Class and damage.'),
      E(
        'Класс - раздел книги, а не тип урона: оружие с уроном «физ/маг» есть в обоих фильтрах.',
        'Class is the table the book prints the weapon in, not its damage: a weapon that deals "phy or mag" is in both filters.'
      )
    ]
  ];
  const panel = (paras, more = '') =>
    `<section class="panel helpp" aria-label="${E('Об этих данных', 'About this data')}">${paras.map(([b, p]) => `<p><b>${b}</b> ${p}</p>`).join('')}${more}</section>`;
  const TODAY = [
    [
      '',
      E(
        'Здесь лежат все таблицы целиком. В верхнем ряду - корник, Hope & Fear, «Альт. таблицы», «Дополнения», «Снаряжение» и «Прочее», а ряд под ним выбирает книгу или раздел группы, если внутри есть из чего выбирать...',
        'Every table in full. The top row holds the core set, Hope & Fear, "Alt. tables", "Supplements", "Equipment" and "Other", and the row under it picks a book or a section of that group...'
      )
    ],
    [
      E('Снаряжение', 'Equipment'),
      E(
        'собрано из всех источников, а не только из корника и Hope & Fear...',
        'is gathered from every source, not only the core set and Hope & Fear...'
      )
    ]
  ];

  const helpRec = () =>
    at(
      RA.catalog({
        headOpts: { helpLabel: E('Об этих данных', 'About this data'), helpOpen: true },
        afterHead: panel(NOTES)
      })
    );
  const helpRemove = () => at(RA.catalog({ headOpts: { help: false } }));
  const helpToday = () =>
    at(
      RA.catalog({
        headOpts: { helpOpen: true, helpToday: true },
        afterHead: panel(
          TODAY,
          `<div class="more">${E('...и ещё 8 абзацев: устройство фильтров, «Линейка», ранги, порядок, источники', '...and 8 more paragraphs: how the filters work, "Line", tiers, order, sources')}</div>`
        )
      })
    );

  /* C57: the list/grid switch changes the view until a reload; the default
     lives in the account's Display section. */
  const viewRec = () => at(RA.catalog({ grid: true }));
  const viewSave = () => {
    const N = innerWidth <= 760;
    return `<div class="ov" style="height:${N ? 1500 : 1100}px">${at(RA.catalog({ grid: true }))}<div class="toast3" role="status">${E('Вид «Сеткой» сохранён в аккаунте', 'The "Grid" view is saved to the account')}</div></div>`;
  };
  const viewButton = () =>
    at(
      RA.catalog({
        grid: true,
        underToolbar: `<div class="wb" style="margin:-4px 0 12px">${btn(E('Открывать таблицы сеткой', 'Open tables as a grid'), { sm: true, i: 'check' })}</div>`
      })
    );
  const viewToday = () =>
    at(
      RA.catalog({
        grid: true,
        underToolbar: `<p class="count2" style="margin:-4px 0 12px">${E('Только до перезагрузки. Чтобы сохранить, измените в <a href="#">настройках аккаунта</a>.', 'Until you reload only. To keep it, change it in the <a href="#">account settings</a>.')}</p>`
      })
    );

  window.XS = {
    catalog: () => at(RA.catalog()),
    'catalog-picker': () =>
      `${cap('360: заголовок - выбор таблицы, он открывает лист с группами и таблицами группы (C7); на 1180 группы и таблицы видны в шапке', '360: the heading is the table picker; it opens a sheet with the groups and the tables of the group (C7); at 1180 both rows show in the head')}${at(RA.catalog({ pickerOpen: true }))}`,
    'catalog-more': () =>
      `${cap('360: «Ещё» открыто - ссылка на таблицу, закрепление и «Об этих данных»; вид и «Выбрать» всегда на виду; на 1180 всё это видно в строке поиска и в шапке', '360: "More" open - the table link, the pin and About this data; the view switch and Select always show; at 1180 they all show in the search row and the head')}${at(RA.catalog({ moreOpen: true }))}`,
    'catalog-filtered': () => at(ST['catalog-filtered'](), path + '/f_tier-1.range-melee'),
    'catalog-filters': () =>
      `${cap('на 360 фильтры открываются листом снизу; на 1180 они - колонка слева', 'at 360 the filters open as a bottom sheet; at 1180 they are the left column')}${at(ST['catalog-filters']())}`,
    'catalog-filters-set': () =>
      `${cap('360: фильтр задан - в шапке листа «Фильтры · 2», «Ссылка на фильтры» и «Закрыть», внизу «Сбросить»; на 1180 то же в шапке колонки', '360: a filter is set - the sheet head holds "Filters · 2", "Link to these filters" and "Close", the foot "Reset"; at 1180 the same sits in the column head')}${at(RA.catalog({ sheet: true, filtered: true }), path + '/f_tier-1.range-melee')}`,
    'catalog-grid': () => at(ST['catalog-grid']()),
    'catalog-nothing': () => at(ST['catalog-nothing'](), path + '/f_tier-1.range-melee'),
    'catalog-searched': () =>
      `${cap('совпадение в названии подсвечено (C59)', 'the match in the name is highlighted (C59)')}${at(RA.catalog({ q: true }))}`,
    'catalog-selection': () => at(ST['catalog-selection']()),
    'pattern-empty': () => ST['pattern-empty'](),
    'help-rec': helpRec,
    'help-remove': helpRemove,
    'help-today': helpToday,
    'view-rec': viewRec,
    'view-save': viewSave,
    'view-button': viewButton,
    'view-today': viewToday
  };
})();
