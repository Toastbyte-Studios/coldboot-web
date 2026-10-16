/**
 * The NATO (ICAO) phonetic alphabet, for /nato-phonetic-alphabet.
 *
 * `word` is the app's own table, copied from ColdBoot's
 * `src/screens/MorseCode/NatoPhoneticScreen.tsx`: the common English
 * spellings (Alpha, Juliet, X-ray), which are also how most people search.
 * If the app's table changes, re-copy.
 *
 * `icao` and `say` are not in the app. They're the official ICAO spelling and
 * ICAO's English pronunciation respelling (capitals mark the stressed
 * syllables), as given in the ICAO 1950 respellings on Wikipedia's "NATO
 * phonetic alphabet" article, checked 2026-10-16. The page presents them as
 * reference, never as something the app shows.
 */
export interface PhoneticLetter {
  letter: string;
  /** As in the app. */
  word: string;
  /** ICAO's official spelling, where it differs from `word`. */
  icao?: string;
  /** ICAO pronunciation respelling; capitals are stressed. */
  say: string;
}

export const NATO_ALPHABET: readonly PhoneticLetter[] = [
  { letter: 'A', word: 'Alpha', icao: 'Alfa', say: 'AL FAH' },
  { letter: 'B', word: 'Bravo', say: 'BRAH VOH' },
  { letter: 'C', word: 'Charlie', say: 'CHAR LEE or SHAR LEE' },
  { letter: 'D', word: 'Delta', say: 'DELL TAH' },
  { letter: 'E', word: 'Echo', say: 'ECK OH' },
  { letter: 'F', word: 'Foxtrot', say: 'FOKS TROT' },
  { letter: 'G', word: 'Golf', say: 'golf' },
  { letter: 'H', word: 'Hotel', say: 'ho TELL' },
  { letter: 'I', word: 'India', say: 'IN dee ah' },
  { letter: 'J', word: 'Juliet', icao: 'Juliett', say: 'JEW lee ETT' },
  { letter: 'K', word: 'Kilo', say: 'KEY loh' },
  { letter: 'L', word: 'Lima', say: 'LEE mah' },
  { letter: 'M', word: 'Mike', say: 'mike' },
  { letter: 'N', word: 'November', say: 'no VEM ber' },
  { letter: 'O', word: 'Oscar', say: 'OSS cah' },
  { letter: 'P', word: 'Papa', say: 'pah PAH' },
  { letter: 'Q', word: 'Quebec', say: 'keh BECK' },
  { letter: 'R', word: 'Romeo', say: 'ROW me oh' },
  { letter: 'S', word: 'Sierra', say: 'SEE AIR rah' },
  { letter: 'T', word: 'Tango', say: 'TANG go' },
  { letter: 'U', word: 'Uniform', say: 'YOU nee form or OO nee form' },
  { letter: 'V', word: 'Victor', say: 'VIK tah' },
  { letter: 'W', word: 'Whiskey', say: 'WISS key' },
  { letter: 'X', word: 'X-ray', icao: 'Xray', say: 'ECKS ray' },
  { letter: 'Y', word: 'Yankee', say: 'YANG key' },
  { letter: 'Z', word: 'Zulu', say: 'ZOO loo' },
];

/**
 * ICAO's pronunciation of the digits for radio, same source. Not in the app,
 * whose NATO table is letters only; the page says so.
 */
export const RADIO_DIGITS: readonly { digit: string; say: string }[] = [
  { digit: '0', say: 'ZE-RO' },
  { digit: '1', say: 'WUN' },
  { digit: '2', say: 'TOO' },
  { digit: '3', say: 'TREE' },
  { digit: '4', say: 'FOW-er' },
  { digit: '5', say: 'FIFE' },
  { digit: '6', say: 'SIX' },
  { digit: '7', say: 'SEV-en' },
  { digit: '8', say: 'AIT' },
  { digit: '9', say: 'NIN-er' },
];

/** The date the current ICAO alphabet took effect. */
export const NATO_IN_EFFECT = '1 March 1956';

/**
 * Spells a word with the code words: "SOS" → "Sierra Oscar Sierra".
 * Letters only; anything else is dropped.
 */
export function spellPhonetic(text: string): string {
  const byLetter = new Map(NATO_ALPHABET.map((l) => [l.letter, l.word]));
  return [...text.toUpperCase()]
    .map((ch) => byLetter.get(ch))
    .filter((w): w is string => w !== undefined)
    .join(' ');
}
