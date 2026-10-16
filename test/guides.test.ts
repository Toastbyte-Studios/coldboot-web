import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import { findGuide, GUIDES } from '../src/data/guides.ts';
import {
  lettersByLength,
  MORSE_CODE,
  MORSE_LETTERS,
  MORSE_NUMBERS,
} from '../src/data/morse.ts';
import {
  NATO_ALPHABET,
  RADIO_DIGITS,
  spellPhonetic,
} from '../src/data/nato.ts';
import { buildGuideStructuredData } from '../src/lib/structured-data.ts';
import { parseSubmission } from '../src/lib/waitlist.ts';

describe('GUIDES', () => {
  for (const guide of GUIDES) {
    it(`${guide.path} has a page and fits search-result limits`, () => {
      const file = new URL(`../src/pages${guide.path}.astro`, import.meta.url);
      assert.ok(existsSync(file), `missing src/pages${guide.path}.astro`);
      assert.ok(guide.title.length <= 60, `title is ${guide.title.length}`);
      assert.ok(guide.title.endsWith('| ColdBoot'));
      assert.ok(
        guide.description.length <= 155,
        `description is ${guide.description.length}`,
      );
    });
  }

  it('has no duplicate paths', () => {
    const paths = GUIDES.map((g) => g.path);
    assert.equal(new Set(paths).size, paths.length);
  });

  it('throws for an unregistered path', () => {
    assert.throws(() => findGuide('/nope'), /No guide registered/);
  });
});

describe('MORSE_CODE', () => {
  it('has A–Z and 0–9, like the app', () => {
    assert.equal(MORSE_LETTERS.length, 26);
    assert.equal(MORSE_NUMBERS.length, 10);
    assert.equal(MORSE_CODE.length, 36);
  });

  it('gives every character a unique pattern of dots and dashes', () => {
    const patterns = MORSE_CODE.map((c) => c.morse);
    assert.equal(new Set(patterns).size, patterns.length);
    for (const p of patterns) assert.match(p, /^[.-]{1,5}$/);
  });

  it('spells out each pattern exactly', () => {
    for (const { char, morse, spellOut } of MORSE_CODE) {
      const expected = [...morse]
        .map((s) => (s === '.' ? 'dot' : 'dash'))
        .join(' ');
      assert.equal(spellOut, expected, char);
    }
  });

  it('groups letters shortest first, E and T alone', () => {
    const groups = lettersByLength();
    assert.deepEqual(groups[0], { length: 1, chars: ['E', 'T'] });
    assert.deepEqual(
      groups.map((g) => g.length),
      [1, 2, 3, 4],
    );
    assert.equal(
      groups.reduce((n, g) => n + g.chars.length, 0),
      26,
    );
  });
});

describe('NATO_ALPHABET', () => {
  it('has one code word for each letter, A to Z in order', () => {
    assert.deepEqual(
      NATO_ALPHABET.map((l) => l.letter).join(''),
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    );
    for (const l of NATO_ALPHABET) {
      assert.equal(l.word[0], l.letter, l.word);
      assert.ok(l.say.length > 0, l.letter);
    }
  });

  it('notes the ICAO spelling only where it differs', () => {
    assert.deepEqual(
      NATO_ALPHABET.filter((l) => l.icao).map((l) => [l.word, l.icao]),
      [
        ['Alpha', 'Alfa'],
        ['Juliet', 'Juliett'],
        ['X-ray', 'Xray'],
      ],
    );
  });

  it('spells words with the code words', () => {
    assert.equal(spellPhonetic('sos'), 'Sierra Oscar Sierra');
    assert.equal(spellPhonetic('A-1 b'), 'Alpha Bravo');
  });

  it('has radio pronunciations for all ten digits', () => {
    assert.deepEqual(RADIO_DIGITS.map((d) => d.digit).join(''), '0123456789');
  });
});

describe('buildGuideStructuredData', () => {
  const data = buildGuideStructuredData({
    site: new URL('https://coldboot.app'),
    siteName: 'ColdBoot',
    path: '/morse-code',
    name: 'Morse code chart',
    description: 'A chart.',
    studioUrl: 'https://toastbyte.studio/',
  });
  const [page, crumbs] = data['@graph'];

  it('joins the page to the home graph', () => {
    assert.equal(page['@id'], 'https://coldboot.app/morse-code#webpage');
    assert.deepEqual(page.isPartOf, {
      '@id': 'https://coldboot.app/#website',
    });
    assert.deepEqual(page.mentions, { '@id': 'https://coldboot.app/#app' });
  });

  it('builds a two-step breadcrumb', () => {
    assert.deepEqual(
      crumbs.itemListElement.map((i) => [i.position, i.name, i.item]),
      [
        [1, 'ColdBoot', 'https://coldboot.app/'],
        [2, 'Morse code chart', 'https://coldboot.app/morse-code'],
      ],
    );
  });
});

describe('guide waitlist sources', () => {
  for (const source of ['morse', 'nato'] as const) {
    it(`accepts the ${source} form`, () => {
      const form = new FormData();
      form.set('email', 'ada@example.com');
      form.set('source', source);
      assert.deepEqual(parseSubmission(form), {
        ok: true,
        email: 'ada@example.com',
        source,
      });
    });
  }
});
