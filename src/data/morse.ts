/**
 * International Morse Code, as shipped in the ColdBoot app.
 *
 * Copied from ColdBoot's `src/utils/morseCodeMapping.ts` (`morseCodeData`):
 * the same 36 characters, A–Z then 0–9, with the same dot/dash patterns and
 * spoken spell-outs. The app has no punctuation, so neither does this, and
 * the /morse-code page doesn't claim it. If the app's table changes, re-copy.
 */
export interface MorseCharacter {
  char: string;
  /** Dots and dashes as `.` and `-`, e.g. `.-` for A. */
  morse: string;
  /** How it's said aloud, e.g. "dot dash". */
  spellOut: string;
}

export const MORSE_CODE: readonly MorseCharacter[] = [
  { char: 'A', morse: '.-', spellOut: 'dot dash' },
  { char: 'B', morse: '-...', spellOut: 'dash dot dot dot' },
  { char: 'C', morse: '-.-.', spellOut: 'dash dot dash dot' },
  { char: 'D', morse: '-..', spellOut: 'dash dot dot' },
  { char: 'E', morse: '.', spellOut: 'dot' },
  { char: 'F', morse: '..-.', spellOut: 'dot dot dash dot' },
  { char: 'G', morse: '--.', spellOut: 'dash dash dot' },
  { char: 'H', morse: '....', spellOut: 'dot dot dot dot' },
  { char: 'I', morse: '..', spellOut: 'dot dot' },
  { char: 'J', morse: '.---', spellOut: 'dot dash dash dash' },
  { char: 'K', morse: '-.-', spellOut: 'dash dot dash' },
  { char: 'L', morse: '.-..', spellOut: 'dot dash dot dot' },
  { char: 'M', morse: '--', spellOut: 'dash dash' },
  { char: 'N', morse: '-.', spellOut: 'dash dot' },
  { char: 'O', morse: '---', spellOut: 'dash dash dash' },
  { char: 'P', morse: '.--.', spellOut: 'dot dash dash dot' },
  { char: 'Q', morse: '--.-', spellOut: 'dash dash dot dash' },
  { char: 'R', morse: '.-.', spellOut: 'dot dash dot' },
  { char: 'S', morse: '...', spellOut: 'dot dot dot' },
  { char: 'T', morse: '-', spellOut: 'dash' },
  { char: 'U', morse: '..-', spellOut: 'dot dot dash' },
  { char: 'V', morse: '...-', spellOut: 'dot dot dot dash' },
  { char: 'W', morse: '.--', spellOut: 'dot dash dash' },
  { char: 'X', morse: '-..-', spellOut: 'dash dot dot dash' },
  { char: 'Y', morse: '-.--', spellOut: 'dash dot dash dash' },
  { char: 'Z', morse: '--..', spellOut: 'dash dash dot dot' },
  { char: '0', morse: '-----', spellOut: 'dash dash dash dash dash' },
  { char: '1', morse: '.----', spellOut: 'dot dash dash dash dash' },
  { char: '2', morse: '..---', spellOut: 'dot dot dash dash dash' },
  { char: '3', morse: '...--', spellOut: 'dot dot dot dash dash' },
  { char: '4', morse: '....-', spellOut: 'dot dot dot dot dash' },
  { char: '5', morse: '.....', spellOut: 'dot dot dot dot dot' },
  { char: '6', morse: '-....', spellOut: 'dash dot dot dot dot' },
  { char: '7', morse: '--...', spellOut: 'dash dash dot dot dot' },
  { char: '8', morse: '---..', spellOut: 'dash dash dash dot dot' },
  { char: '9', morse: '----.', spellOut: 'dash dash dash dash dot' },
];

export const MORSE_LETTERS = MORSE_CODE.filter((c) => /[A-Z]/.test(c.char));
export const MORSE_NUMBERS = MORSE_CODE.filter((c) => /[0-9]/.test(c.char));

/**
 * Letters grouped by how many dots and dashes they take, shortest first, as
 * the app's cheat sheet can sort them. The code's designers gave the
 * shortest patterns to the most common English letters, which is why learners
 * often start here.
 */
export function lettersByLength(): { length: number; chars: string[] }[] {
  const groups = new Map<number, string[]>();
  for (const { char, morse } of MORSE_LETTERS) {
    groups.set(morse.length, [...(groups.get(morse.length) ?? []), char]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([length, chars]) => ({ length, chars }));
}

/** SOS, the distress signal: three dots, three dashes, three dots. */
export const SOS = { text: 'SOS', morse: '... --- ...' } as const;

/**
 * Standard International Morse timing, in units of one dot. The app's
 * Flashlight SOS mode uses these ratios with a 200 ms unit.
 */
export const MORSE_TIMING: readonly { element: string; units: number }[] = [
  { element: 'Dot', units: 1 },
  { element: 'Dash', units: 3 },
  { element: 'Gap between dots and dashes in a letter', units: 1 },
  { element: 'Gap between letters', units: 3 },
  { element: 'Gap between words', units: 7 },
];
