/**
 * Site-wide copy that is likely to change before launch. Kept in one place so
 * updating it doesn't mean hunting through markup.
 */
export const SITE = {
  name: 'ColdBoot',
  title: 'ColdBoot — offline survival tools for your phone',
  description:
    'ColdBoot is a field kit for iOS and Android: maps, compass, Morse, sun ' +
    'times, pantry tracking and a survival library that all work without a ' +
    'connection. Join the waitlist.',
  // TODO(launch): replace with the real launch window.
  launchLabel: 'Launching [SEASON 2026]',
  platforms: 'iOS + Android',
  studio: { name: 'Toastbyte Studios', url: 'https://toastbyte.studio/' },
} as const;

/** The readout strip under the hero. */
export const READOUTS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Signal', value: 'Not required' },
  { label: 'Account', value: 'None to create' },
  { label: 'Your data', value: 'Stays on the phone' },
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
