/* The candidates in the order the comparison page shows them: the
   recommended one first. stage.html, render.mjs and index.html read this. */
window.MARKS = [
  {
    id: 'a',
    file: 'a-d12.svg',
    name: 'A. The d12',
    rec: true,
    why: 'The roller rolls 1d12 to 5d12, so the d12 is the one object that is this product and not every loot site; its decagon and lit front face still read at 16 px.',
    cost: 'It says "dice" before it says "loot": a person who never rolled a d12 sees a gem or a faceted ball.'
  },
  {
    id: 'b',
    file: 'b-vault-die.svg',
    name: 'B. The vault die',
    why: "A's d12 with a keyhole through the front face: the die and the vault in one shape, and the keyhole keeps a trace of today's key icon.",
    cost: 'Below 32 px the keyhole is a dark dot that reads as an eye or a blemish; it is A at 16 px with noise.'
  },
  {
    id: 'c',
    file: 'c-chest.svg',
    name: 'C. The chest',
    why: 'The plainest "loot" sign: anyone reads a treasure chest, at every size, in both languages.',
    cost: 'It is the stock loot icon of every game and app store; it says nothing about Daggerheart or the roller.'
  },
  {
    id: 'd',
    file: 'd-pouch.svg',
    name: 'D. The coin pouch',
    why: "Coins and a tied sack: the party's purse, which suits the players who keep a list as their inventory.",
    cost: 'At 16 px the gathered top and the coin merge, and the shape reads as a bag or a garlic bulb.'
  },
  {
    id: 'e',
    file: 'e-key.svg',
    name: 'E. The refined key',
    why: "Keeps today's home-screen key, so an installed icon does not change its meaning, now as one solid diagonal shape.",
    cost: 'A key says "vault, lock, password": next to a sign-in button it reads as a password manager, not as loot.'
  },
  {
    id: 'f',
    file: 'f-gem.svg',
    name: 'F. The gem',
    why: 'A cut gem is treasure in one shape, and its facets read cleanly from 16 px to 512 px.',
    cost: "The side view of a brilliant is the Sketch app's logo shape; it reads as a design tool before it reads as loot."
  },
  {
    id: 'shipped',
    file: '../../../../app/public/icons/favicon.svg',
    name: 'B as shipped (favicon.svg)',
    why: 'Batch 2 evidence: the shipped favicon at every size it ships at.',
    cost: 'Below 32 px the keyhole is a dot, as candidate B.'
  }
];
