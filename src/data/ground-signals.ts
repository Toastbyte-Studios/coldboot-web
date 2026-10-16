/**
 * Ground-to-air signals, for /ground-to-air-signals.
 *
 * `GROUND_SIGNALS` and `AIR_ACKNOWLEDGEMENT` are the app's own data, copied
 * from ColdBoot's `src/screens/SignalMirror/data.ts` (symbol, meaning, code
 * and materials; the app's per-symbol size is the shared minimum below). If
 * the app's table changes, re-copy.
 *
 * The app's sources, which this page relies on too:
 * - `icao`: ICAO Annex 12 (Search and Rescue), Appendix: 2.1 the survivors'
 *   code, 2.3 the size and materials, 3.1–3.2 the pilot's acknowledgement.
 *   Checked against Albania AIP GEN 3.6 and Airservices Australia AIP SUP
 *   H102/26, which reproduce it.
 * - `older`: the emergency code on WWII-era Air Ministry cards and the FAA /
 *   US Forest Service "Visual Emergency Signals" card (GPO 1985).
 *
 * Meanings keep those sources' wording ("Probably safe to land here").
 */
export type SignalCode = 'icao' | 'older';

export interface GroundSignal {
  symbol: string;
  meaning: string;
  code: SignalCode;
  materials: string;
}

/** ICAO Annex 12, Appendix 2.3: "at least 2.5 metres (8 feet) long". */
export const MIN_SIZE = { metres: 2.5, feet: 8 } as const;

export const AIR_ACKNOWLEDGEMENT =
  'A pilot who has understood your signal rocks the wings by day, or ' +
  'flashes the landing or navigation lights on and off twice at night. No ' +
  'response means the signal was not understood.';

export const GROUND_SIGNALS: readonly GroundSignal[] = [
  {
    symbol: 'V',
    meaning: 'Require assistance',
    code: 'icao',
    materials:
      'Rocks, logs, torn clothing, trampled vegetation, any contrast material',
  },
  {
    symbol: 'X',
    meaning: 'Require medical assistance',
    code: 'icao',
    materials: 'Rocks, logs, brightly colored fabric, snow trench',
  },
  {
    symbol: 'N',
    meaning: 'No or negative',
    code: 'icao',
    materials: 'Rocks, logs, clothing, any high-contrast material',
  },
  {
    symbol: 'Y',
    meaning: 'Yes or affirmative',
    code: 'icao',
    materials: 'Rocks, logs, clothing, any high-contrast material',
  },
  {
    symbol: '→',
    meaning: 'Proceeding in this direction',
    code: 'icao',
    materials:
      'Rocks, branches, clothing; point arrow toward direction of travel',
  },
  {
    symbol: 'F',
    meaning: 'Require food and water',
    code: 'older',
    materials: 'Rocks, logs, sand furrows, trampled grass',
  },
  {
    symbol: 'K',
    meaning: 'Indicate direction to proceed',
    code: 'older',
    materials: 'Rocks, branches, clothing',
  },
  {
    symbol: '△',
    meaning: 'Probably safe to land here',
    code: 'older',
    materials: 'Rocks, logs, fabric; place in open flat area free of obstacles',
  },
  {
    symbol: 'LL',
    meaning: 'All well',
    code: 'older',
    materials: 'Rocks, logs, clothing, any high-contrast material',
  },
  {
    symbol: 'JL',
    meaning: 'Not understood',
    code: 'older',
    materials: 'Rocks, logs, any available material',
  },
];

export const ICAO_SIGNALS = GROUND_SIGNALS.filter((s) => s.code === 'icao');
export const OLDER_SIGNALS = GROUND_SIGNALS.filter((s) => s.code === 'older');

/**
 * How the pilot answers, by ICAO Annex 12, Appendix 3.1–3.2. Not in the app
 * as a table (the app has it as the `AIR_ACKNOWLEDGEMENT` sentence); split
 * out here so the page can lay it out. Keep the two saying the same thing.
 */
export const AIR_REPLIES = [
  { when: 'By day', reply: 'Rocks its wings', meaning: 'Understood' },
  {
    when: 'At night',
    reply:
      'Flashes its landing lights on and off twice (navigation lights if it has no landing lights)',
    meaning: 'Understood',
  },
  { when: 'Day or night', reply: 'No signal', meaning: 'Not understood' },
] as const;

/**
 * ICAO Annex 12, Appendix 2.3's materials, in its order: what to build
 * symbols from when there's nothing better.
 */
export const ICAO_MATERIALS = [
  'strips of fabric',
  'parachute material',
  'pieces of wood',
  'stones',
  'tramping or staining the ground (with oil, for example)',
] as const;
