// The catalog style rules: node --test tools/desc-style.test.mjs
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONDITIONS,
  convert,
  contextOf,
  isLabelled,
  labelOf,
  LABELS,
  OVERRIDES,
  readData,
  STRUCK,
  styleText
} from './desc-style.mjs';

const LOOT = { id: 'x1', labelled: false, ref: '' };
const EQUIP = { id: 'x2', labelled: true, ref: '' };
const en = (plain, ctx = LOOT, o = []) => styleText(plain, 'en', ctx, o).text;
const ru = (plain, ctx = LOOT, o = []) => styleText(plain, 'ru', ctx, o).text;

describe('the label rule (S1)', () => {
  it('labels a short name at the head of a line', () => {
    assert.equal(en('Reliable: +1 to attack', EQUIP), '***Reliable:*** +1 to attack');
    assert.equal(ru('Надёжное: +1 к атаке', EQUIP), '***Надёжное:*** +1 к атаке');
  });

  it('leaves prose alone, however many colons it has', () => {
    for (const prose of [
      'The GM decides, at the table, what this is worth: usually a lot',
      'One two three four five: x',
      'Head, with a comma: x',
      'no colon here'
    ])
      assert.equal(en(prose, EQUIP), prose);
  });

  it('allows a longer, comma-bearing head inside a list item', () => {
    assert.equal(
      en('- Calamity (Failure, Fear): something happens', EQUIP),
      '- ***Calamity (Failure, Fear):*** something happens'
    );
    assert.equal(labelOf('x'.repeat(41) + ': y', true), '');
    assert.equal(labelOf('x'.repeat(40) + ': y', true), 'x'.repeat(40));
  });

  it('labels only equipment, Vault of Ages and Arazo', () => {
    assert.equal(isLabelled({ eq: { t: 'weapon' }, src: 'core' }), true);
    assert.equal(isLabelled({ src: 'voa' }), true);
    assert.equal(isLabelled({ src: 'arazo' }), true);
    assert.equal(isLabelled({ src: 'mwt' }), true);
    assert.equal(isLabelled({ src: 'wondrous' }), false);
    assert.equal(en('Sharp: very'), 'Sharp: very');
  });

  it('keeps a head with an edge space as it is', () => {
    assert.equal(en(' Lead: x', EQUIP), ' Lead: x');
    assert.equal(en(': x', EQUIP), ': x');
  });

  it('labels a forced line that the length rule misses', () => {
    assert.ok(LABELS.has('dve38:en:2'));
    const ctx = { id: 'dve38', labelled: true, ref: '' };
    assert.equal(
      en('Vampirism: x\nCurse - Feed the Blade: y', ctx),
      '***Vampirism:*** x\n***Curse - Feed the Blade:*** y'
    );
  });

  it('strikes no line until the owner strikes one', () => {
    assert.equal(STRUCK.size, 0);
  });
});

describe('the rule cards (S1)', () => {
  const ooze = contextOf('ref', 'huge-green-ooze', {});
  const beast = contextOf('ref', 'powerful-beast', {});

  it('labelsAStatBlockFeatureLine', () => {
    assert.equal(en('Slow - Passive: When x', ooze), '***Slow - Passive:*** When x');
    assert.equal(ru('Деление - Реакция: Когда x', ooze), '***Деление - Реакция:*** Когда x');
    assert.equal(en('Rampage: when you roll', beast), '***Rampage:*** when you roll');
  });

  it('leavesAStatLinePlain', () => {
    for (const line of ['Motives & Tactics: Camouflage', 'Experience: Blend In +3'])
      assert.equal(en(line, ooze), line);
    assert.equal(
      en('Attack: Melee, Strength d10+4 phy', beast),
      'Attack: Melee, Strength d10+4 phy'
    );
    assert.equal(ru('Атака: Вплотную', beast), 'Атака: Вплотную');
    assert.equal(en('Name: x', contextOf('set', 'k', {})), 'Name: x');
  });
});

describe('the cost rules (S2, S3)', () => {
  it('returnsPlainForAReferenceToACost', () => {
    assert.equal(
      en('When you would spend a Hope, gain 1.'),
      'When you would spend a Hope, gain 1.'
    );
    assert.equal(
      en('You can heal without spending a Hope.'),
      'You can heal without spending a Hope.'
    );
    assert.equal(
      ru('Когда вы должны отметить Стресс, бросьте d6.'),
      'Когда вы должны отметить Стресс, бросьте d6.'
    );
    assert.equal(
      ru('Если оно не может отметить Стресс, x.'),
      'Если оно не может отметить Стресс, x.'
    );
  });

  it('returnsPlainForAnotherPayersCost', () => {
    assert.equal(
      en('On a hit, the target must mark a Stress.'),
      'On a hit, the target must mark a Stress.'
    );
    assert.equal(
      en('Creatures outside that range must mark a Stress to see inside.'),
      'Creatures outside that range must mark a Stress to see inside.'
    );
    assert.equal(
      ru('При попадании цель должна отметить Стресс.'),
      'При попадании цель должна отметить Стресс.'
    );
  });

  it('boldsAnOptionalCost', () => {
    assert.equal(en('You can spend a Hope to fly.'), 'You can **spend a Hope** to fly.');
    assert.equal(
      ru('Вы можете потратить Надежду, чтобы взлететь.'),
      'Вы можете **потратить Надежду**, чтобы взлететь.'
    );
  });

  it('boldsAPriceForAnEffect', () => {
    assert.equal(
      en('Once per rest, mark a Stress to teleport.'),
      'Once per rest, **mark a Stress** to teleport.'
    );
    assert.equal(en('Mark a Stress and clear a HP.'), '**Mark a Stress** and clear a HP.');
    assert.equal(
      en('By marking 1 Stress, you may leap.'),
      'By **marking 1 Stress**, you may leap.'
    );
    assert.equal(
      ru('Чтобы снять кулон, отметьте 3 Стресса.'),
      'Чтобы снять кулон, **отметьте 3 Стресса**.'
    );
    assert.equal(
      ru('Отметьте Стресс и передвиньтесь.'),
      '**Отметьте Стресс** и передвиньтесь.'
    );
    assert.equal(
      ru('Потратив Надежду, вы можете прыгнуть.'),
      '**Потратив Надежду**, вы можете прыгнуть.'
    );
  });

  it('keepsAPenaltyPlain', () => {
    const painful = 'Each time you make a successful attack, you must mark a Stress.';
    assert.equal(en(painful, EQUIP), painful);
    const bulky = 'Bulky: −1 to Evasion; when you take Severe damage, you must mark a Stress.';
    assert.equal(
      en(bulky, EQUIP),
      '***Bulky:*** −1 to Evasion; when you take Severe damage, you must mark a Stress.'
    );
    const ruPainful =
      'Каждый раз, когда вы совершаете успешную атаку, вы должны отметить Стресс.';
    assert.equal(ru(ruPainful, EQUIP), ruPainful);
  });

  it('boldsReloadingsCost', () => {
    assert.equal(
      en('On a result of 1, you must mark a Stress to reload this weapon.', EQUIP),
      'On a result of 1, you must **mark a Stress** to reload this weapon.'
    );
    assert.equal(
      ru('Если выпадет 1, вы должны отметить Стресс для перезарядки.', EQUIP),
      'Если выпадет 1, вы должны **отметить Стресс** для перезарядки.'
    );
  });

  it('leaves dice, rolls and ranges plain (S5, S6)', () => {
    const roll = 'Make a Spellcast Roll (15) and roll a d6 within Very Close range.';
    assert.equal(en(roll), roll);
  });
});

describe('the condition rule (S4)', () => {
  it('italicizesACapitalizedConditionOnly', () => {
    assert.equal(
      en('They become temporarily Vulnerable.'),
      'They become temporarily *Vulnerable*.'
    );
    assert.equal(
      en('The blade can be hidden in the cane.'),
      'The blade can be hidden in the cane.'
    );
    assert.equal(en('Two Vulnerables'), 'Two Vulnerables');
    assert.equal(ru('Цель становится Уязвимой.'), 'Цель становится *Уязвимой*.');
    assert.equal(ru('Цель становится уязвимой.'), 'Цель становится уязвимой.');
    assert.ok(CONDITIONS.en.includes('Roped') && CONDITIONS.ru.includes('Заарканенная'));
  });

  it('formats a label, a cost and a condition on one line', () => {
    assert.equal(
      en(
        'Grappling: On a successful attack, you can spend a Hope to Restrain the target.',
        EQUIP
      ),
      '***Grappling:*** On a successful attack, you can **spend a Hope** to *Restrain* the target.'
    );
  });
});

describe('the overrides and the data', () => {
  it('appliesAnOverrideAndRefusesAStaleOne', () => {
    const o = [
      {
        id: 'x1',
        lang: 'en',
        rule: 'cost',
        text: 'mark a Stress',
        n: 2,
        as: 'bold',
        why: 'test'
      }
    ];
    assert.equal(
      en('You must mark a Stress. You must mark a Stress.', LOOT, o),
      'You must mark a Stress. You must **mark a Stress**.'
    );
    const L = {
      items: { a: [{ id: 'x1', src: 'wondrous', ende: 'No cost here.', rud: 'Нет.' }] },
      eq: []
    };
    assert.throws(() => convert(L, o), /match nothing/);
    for (const x of OVERRIDES)
      assert.ok(x.why && x.n >= 1 && ['bold', 'italic', 'plain'].includes(x.as), x.id);
  });

  it('refusesATextWithAStarOrATable', () => {
    assert.throws(() => en('A *star*'), /holds a star/);
    assert.throws(() => en('| a | b |\n|---|---|'), /table line/);
  });

  it('changesNothingOnASecondRun', () => {
    const L = {
      items: {
        voa: [
          {
            id: 'v1',
            src: 'voa',
            ende: 'Recall Cost: 2\nYou can spend a Hope to Restrain a target.',
            rud: 'Стоимость Призыва: 2\nВы можете потратить Надежду, чтобы Обездвижить цель.'
          }
        ]
      },
      eq: []
    };
    const once = convert(L, []);
    assert.equal(
      once.data.items.voa[0].ende,
      '***Recall Cost:*** 2\nYou can **spend a Hope** to *Restrain* a target.'
    );
    assert.equal(
      L.items.voa[0].ende,
      'Recall Cost: 2\nYou can spend a Hope to Restrain a target.'
    );
    assert.deepEqual(
      once.changes.map((c) => [c.id, c.lang]),
      [
        ['v1', 'en'],
        ['v1', 'ru']
      ]
    );
    assert.deepEqual(convert(once.data, []).changes, []);
  });

  it('refuses a file that is not one JSON.stringify line', () => {
    assert.throws(
      () => readData('window.LOOT={ "items": {} };\n'),
      /not one JSON.stringify line/
    );
    assert.throws(() => readData('var x = 1;\n'), /does not start with/);
  });
});
