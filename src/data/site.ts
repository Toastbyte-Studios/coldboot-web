/**
 * Site-wide copy that is likely to change before launch. Kept in one place so
 * updating it doesn't mean hunting through markup.
 */
export const SITE = {
  name: 'ColdBoot',
  title: 'ColdBoot — offline survival tools for your phone',
  description:
    'ColdBoot is an offline-first field kit for iOS and Android: maps, ' +
    'compass, Morse, sun times, pantry tracking and a survival library, ' +
    'built to work without a connection. Join the waitlist.',
  // The announced launch window. Update it here if the date moves.
  launchLabel: 'Launching early 2027',
  platforms: 'iOS + Android',
  studio: {
    name: 'Toastbyte Studios',
    legalName: 'Toastbyte Studios, LLC',
    url: 'https://toastbyte.studio/',
  },
  contactEmail: 'support@toastbyte.studio',
} as const;

/**
 * What joining the waitlist signs someone up for. The form note, the /joined
 * page and the privacy policy all use this, so the promise made at signup
 * can't drift from the policy. Change it here, and update PRIVACY.lastUpdated.
 */
export const WAITLIST_PROMISE = {
  short:
    "We'll email you when ColdBoot launches, and now and then with product news.",
  full:
    'We use your email address to tell you when ColdBoot is available, and ' +
    'after that to send occasional news about ColdBoot and other Toastbyte ' +
    'Studios products.',
} as const;

export const PRIVACY = {
  // Update whenever the policy's substance changes.
  lastUpdated: '2026-09-25',
} as const;

/** The readout strip under the hero. */
export const READOUTS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Signal', value: 'Not required' },
  { label: 'Account', value: 'None to create' },
  { label: 'What you save', value: 'Stays on the phone' },
  { label: 'Platforms', value: 'iOS + Android' },
];

/**
 * Example values for the solar-cycle illustration. They are sample UI data,
 * not a claim about any particular place or date.
 */
export const SAMPLE_SUN_TIMES: ReadonlyArray<{
  label: string;
  time: string;
  highlight?: boolean;
}> = [
  { label: 'Dawn', time: '5:58 AM' },
  { label: 'Sunrise', time: '6:24 AM' },
  { label: 'Solar noon', time: '12:38 PM' },
  { label: 'Golden hour', time: '6:18 PM' },
  { label: 'Sunset', time: '6:52 PM', highlight: true },
  { label: 'Dusk', time: '7:18 PM' },
];
