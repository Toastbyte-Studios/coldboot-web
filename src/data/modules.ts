/**
 * The six ColdBoot modules as presented on the site.
 *
 * Order and module names follow `MODULES` in the app's `constants.ts`; tool
 * lists follow the matching `*_TOOLS` arrays there. The blurbs are marketing
 * copy and only live here. When the app adds, renames or removes a tool,
 * update this file to match.
 */
export type IconName =
  'pulse' | 'compass' | 'book' | 'chatbubbles' | 'shield' | 'earth';

export interface SiteModule {
  name: string;
  icon: IconName;
  blurb: string;
  tools: readonly string[];
}

export const MODULES: readonly SiteModule[] = [
  {
    name: 'Core',
    icon: 'pulse',
    blurb: 'The basics, always within reach.',
    tools: [
      'Flashlight',
      'Notepad',
      'Checklist',
      'Voice Log',
      'Unit Conversion',
      'Device Status',
    ],
  },
  {
    name: 'Navigation',
    icon: 'compass',
    blurb: 'Find your way without a cell tower.',
    tools: ['Offline Map', 'Map Library', 'Star Map', 'Grid Reference'],
  },
  {
    name: 'Reference',
    icon: 'book',
    blurb: "A survival library that doesn't need a search bar.",
    tools: [
      'Health',
      'Survival Guide',
      'Weather',
      'Tools & Knots',
      'Emergency',
    ],
  },
  {
    name: 'Comms',
    icon: 'chatbubbles',
    blurb: "Get a signal out when you can't make a call.",
    tools: [
      'Morse Code',
      'NATO Phonetic',
      'Digital Whistle',
      'Radio Frequencies',
      'Ground-to-Air Signals',
      'Decibel Meter',
    ],
  },
  {
    name: 'Prepper',
    icon: 'shield',
    blurb: 'Know what you have, and how long it lasts.',
    tools: [
      'Pantry',
      'Inventory',
      'Depletion Calculator',
      'Barter Estimator',
      'Emergency Planner',
      'Scenario Cards',
    ],
  },
  {
    name: 'Earth',
    icon: 'earth',
    blurb: 'Read the sky, the pressure and the season.',
    tools: [
      'Sun Times',
      'Lunar Cycles',
      'Sky Events',
      'Barometric Pressure',
      'Seasonal Outlook',
    ],
  },
];
