/**
 * The feature spotlight under the modules: four tools, one at a time.
 *
 * Every claim here was checked against the ColdBoot app; the note on each
 * feature says where. Re-check them when the app changes. The illustration
 * data below is sample UI: reference text is quoted from the app's own data,
 * while times, counts and "days until" values are examples, not a claim about
 * any particular place or date.
 */
export type SpotlightIcon = 'flash' | 'book' | 'telescope' | 'cube';

export interface SpotlightFeature {
  id: 'morse' | 'reference' | 'sky' | 'inventory';
  /** Tab label. */
  tab: string;
  /** The app's icon for the tool, from `constants.ts`. */
  icon: SpotlightIcon;
  eyebrow: string;
  heading: string;
  body: string;
}

export const SPOTLIGHT = {
  eyebrow: 'A closer look',
  heading: 'Inside the kit.',
  /** How long each feature shows before the next, when rotating. */
  intervalSeconds: 8,
} as const;

export const SPOTLIGHT_FEATURES: readonly SpotlightFeature[] = [
  {
    // src/screens/MorseCode: Alpha to Morse ("Flashes the torch, and
    // optionally beeps"), Morse to Alpha (dot and dash keys) and the trainer's
    // easy / medium / hard levels (character, word, sentence), played as audio.
    id: 'morse',
    tab: 'Morse Code',
    icon: 'flash',
    eyebrow: 'Comms · Morse Code',
    heading: 'Signal with light and sound.',
    body:
      "Type a message and ColdBoot flashes it with your phone's light, with " +
      'an optional tone. Tap in dots and dashes to decode a reply, and train ' +
      'your ear with a trainer that plays Morse for you to name, from single ' +
      'letters up to full sentences.',
  },
  {
    // src/data/{health,emergency,tools,weather,survival}.json: 99 entries,
    // each with steps, do_not and watch_for. Search is on-device
    // (utils/ragSearch.ts) and entries can be bookmarked (EntryScreen).
    id: 'reference',
    tab: 'Reference',
    icon: 'book',
    eyebrow: 'Reference',
    heading: 'A survival library in your pocket.',
    body:
      'Nearly 100 guides across health, emergencies, tools and knots, ' +
      'weather and survival. Each gives clear steps, what not to do and the ' +
      'warning signs to watch for. Search them with no signal, and bookmark ' +
      "the ones you'll want fast.",
  },
  {
    // src/stores/AstronomyEventStore.ts: eclipses, solstices, equinoxes and
    // supermoons for the next 12 months, plus rise times for Venus, Mars,
    // Jupiter and Saturn at the user's location, from astronomia's VSOP87
    // models and suncalc. Nothing is downloaded. It does not yet filter
    // eclipses by visibility, so don't claim that.
    id: 'sky',
    tab: 'Sky Events',
    icon: 'telescope',
    eyebrow: 'Earth · Sky Events',
    heading: 'The next twelve months of sky.',
    body:
      'Eclipses, solstices, equinoxes and supermoons for the year ahead, plus ' +
      'when Venus, Mars, Jupiter and Saturn rise where you are. It is all ' +
      "worked out on the phone from planetary models, so it's there without " +
      'a connection.',
  },
  {
    // src/stores/InventoryStore.ts: items have a category (Home Base and Main
    // Vehicle by default, editable), quantity, unit and an optional expiry
    // month and year. DepletionCalculatorScreen estimates how long pantry and
    // inventory last for a number of people; the app calls the math
    // approximate. Expiry alerts come from the Pantry, not Inventory.
    id: 'inventory',
    tab: 'Inventory',
    icon: 'cube',
    eyebrow: 'Prepper · Inventory',
    heading: 'Every supply, accounted for.',
    body:
      'Track supplies by where you keep them, at home, in the car or anywhere ' +
      'you add, with quantities, units and expiry dates. The Depletion ' +
      'Calculator then gives a rough estimate of how long your pantry and ' +
      "inventory would last for the people you're planning for.",
  },
];

/** Alpha to Morse, mid-transmission. */
export const SAMPLE_MORSE = {
  message: 'SOS',
  code: '··· ––– ···',
} as const;

/** A Reference search and its top result, quoted from health.json. */
export const SAMPLE_REFERENCE = {
  query: 'bleeding',
  title: 'Severe Bleeding',
  meta: 'Health · Emergency',
  steps: [
    'Check that the area is safe before approaching the injured person.',
    'Have the person lie down if possible to reduce the risk of fainting.',
  ],
  doNot:
    'Do not remove blood-soaked cloths already on the wound; add new layers on top instead.',
  watchFor: 'Continued heavy bleeding despite direct pressure.',
} as const;

/** Sky Events rows, using the app's labels, icons and "days until" format. */
export const SAMPLE_SKY_EVENTS: ReadonlyArray<{
  label: string;
  when: string;
  icon: 'planet' | 'moon' | 'snow' | 'contrast';
}> = [
  { label: 'Jupiter rises at 9:14 PM', when: 'Today', icon: 'planet' },
  { label: 'Supermoon', when: 'In 12 days', icon: 'moon' },
  { label: 'Winter Solstice', when: 'In ~2 months', icon: 'snow' },
  { label: 'Total Lunar Eclipse', when: 'In ~5 months', icon: 'contrast' },
];

/** Inventory's two default categories and some of their starter items. */
export const SAMPLE_INVENTORY: ReadonlyArray<{
  category: string;
  items: ReadonlyArray<{ name: string; amount: string }>;
}> = [
  {
    category: 'Home Base',
    items: [
      { name: 'Water', amount: '10 gallons' },
      { name: 'Canned Food', amount: '20 cans' },
      { name: 'Batteries (AA)', amount: '24 pieces' },
    ],
  },
  {
    category: 'Main Vehicle',
    items: [
      { name: 'Jumper Cables', amount: '1 set' },
      { name: 'Blanket', amount: '2 pieces' },
    ],
  },
];
