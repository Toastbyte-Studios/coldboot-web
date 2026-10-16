/**
 * US radio frequencies, for /emergency-radio-frequencies.
 *
 * `radio-frequencies.json` is a byte-for-byte copy of ColdBoot's
 * `src/data/radioFrequencies.json`, the table the app's Radio Frequencies
 * tool shows. If the app's file changes, re-copy it; don't edit it here. Its
 * `metadata.sources` lists the FCC rules and band plan it was checked against.
 *
 * `SERVICE_FACTS` is this page's own summary of the same rules, for the
 * comparison table. Each fact names its rule, and test/radio.test.ts checks
 * it against the app's text so the two can't disagree.
 */
import data from './radio-frequencies.json' with { type: 'json' };

export type ServiceId = keyof typeof data.frequencies;

export interface Channel {
  name: string;
  frequency: string;
  mode: string;
  notes?: string;
}

export interface RadioService {
  id: ServiceId;
  title: string;
  requiresLicense: boolean;
  licenseInfo: string;
  description: string;
  channels: Channel[];
}

/** The app's order (RadioFrequenciesScreen's categories), easiest first. */
const ORDER: readonly ServiceId[] = ['FRS', 'GMRS', 'MURS', 'CB', 'HAM'];

export const RADIO_SERVICES: readonly RadioService[] = ORDER.map((id) => ({
  ...data.frequencies[id],
  id,
}));

export const RADIO_DISCLAIMER = data.metadata.disclaimer;
export const RADIO_SOURCES = data.metadata.sources;

/**
 * The app's license text without its leading "⚠️ LICENSE REQUIRED:" or
 * "✓ NO LICENSE REQUIRED:" banner, which the page shows as a badge instead.
 */
export function licenseDetail(info: string): string {
  return info.replace(/^[^:]*REQUIRED:\s*/, '');
}

/** One row of the comparison table. */
export interface ServiceFacts {
  id: ServiceId;
  /** Short name for the table. */
  name: string;
  band: string;
  license: string;
  power: string;
  /** What it's good for, in a few words. */
  bestFor: string;
}

export const SERVICE_FACTS: readonly ServiceFacts[] = [
  {
    id: 'FRS',
    name: 'FRS',
    band: 'UHF, 462–467 MHz',
    license: 'None',
    // 47 CFR 95.567
    power: '2 W (0.5 W on 8–14)',
    bestFor: 'Family and group walkie-talkies',
  },
  {
    id: 'GMRS',
    name: 'GMRS',
    band: 'UHF, 462–467 MHz',
    // The app's licenseInfo; 10 years, no exam.
    license: 'FCC license, no exam',
    // 47 CFR 95.1767: main channels; 5 W on 462 MHz interstitials.
    power: 'Up to 50 W, and repeaters',
    bestFor: 'Longer range on the same channels as FRS',
  },
  {
    id: 'MURS',
    name: 'MURS',
    band: 'VHF, 151–154 MHz',
    license: 'None',
    // 47 CFR 95.2767
    power: '2 W, external antennas allowed',
    // The app's description: better range than UHF FRS in woods.
    bestFor: 'Farther than FRS, especially in woods',
  },
  {
    id: 'CB',
    name: 'CB',
    band: 'HF, 27 MHz',
    license: 'None',
    // 47 CFR 95.967
    power: '4 W AM, 12 W PEP SSB',
    bestFor: 'Roads and vehicles; channel 9 for emergencies',
  },
  {
    id: 'HAM',
    name: 'Ham (amateur)',
    band: 'Many, HF to UHF',
    license: 'FCC license with an exam',
    power: 'Depends on band and license class',
    bestFor: 'The longest range, and repeaters nationwide',
  },
];
