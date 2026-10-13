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
  /**
   * The link-preview card (og:image) shown when coldboot.app is shared in
   * Messages, Slack, social posts and so on. Without one, Messages falls
   * back to the largest image on the page: the hero's phone screenshot.
   *
   * public/og.png is a 1200×630 render of the hero in the dark scheme: the
   * lockup, "Offline field kit · iOS + Android", "Built for zero bars." and
   * the dark home-screen capture in a phone frame. It deliberately carries
   * no launch date, so it doesn't go stale when launchLabel changes.
   */
  shareImage: {
    path: '/og.png',
    width: 1200,
    height: 630,
    alt:
      'ColdBoot: an offline field kit for iOS and Android. "Built for zero ' +
      'bars." beside the ColdBoot home screen on a phone.',
  },
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
  lastUpdated: '2026-09-30',
} as const;

/** The readout strip under the hero. */
export const READOUTS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Signal', value: 'Not required' },
  { label: 'Account', value: 'None to create' },
  { label: 'What you save', value: 'Stays on the phone' },
  { label: 'Platforms', value: 'iOS + Android' },
];
