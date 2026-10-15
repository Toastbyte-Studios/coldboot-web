/**
 * Site-wide copy that is likely to change before launch. Kept in one place so
 * updating it doesn't mean hunting through markup.
 */
export const SITE = {
  /**
   * One word, capital C and B, everywhere: "cold boot" on its own is a
   * computing term that owns its search results, so the brand only stands
   * out spelled as one distinctive name. toastbyte.studio should match.
   */
  name: 'ColdBoot',
  /**
   * The <title> and share title. Leads with the name, then the search phrase
   * people use for this kind of app ("offline survival app"), and says
   * "iPhone" because that's how people search for iOS apps. Keep it under
   * ~60 characters so Google shows it whole.
   */
  title: 'ColdBoot: Offline Survival App for iPhone & Android',
  /**
   * Meta description. Google shows about 155 characters, so keep it under
   * that (151 now) and lead with what the app is. "Built for no signal"
   * rather than "works with no signal": maps need one download first.
   */
  description:
    'ColdBoot is an offline survival app for iPhone and Android. Maps, ' +
    'compass, Morse, sun times, pantry tracking and a survival guide, built ' +
    'for no signal.',
  /**
   * The first line of the home page's <h1>, above the "Built for zero bars."
   * slogan. It's the one heading that says in words what ColdBoot is, so it
   * carries the name and the main search phrase.
   */
  headline: 'ColdBoot, the offline survival app',
  // The announced launch window. Update it here if the date moves.
  launchLabel: 'Launching early 2027',
  platforms: 'iOS + Android',
  studio: {
    name: 'Toastbyte Studios',
    legalName: 'Toastbyte Studios, LLC',
    url: 'https://toastbyte.studio/',
    // The studio's other profile, for the Organization structured data.
    github: 'https://github.com/Toastbyte-Studios',
  },
  contactEmail: 'support@toastbyte.studio',
  /**
   * Search-engine ownership tokens, emitted as <meta> tags in every page's
   * <head> by Base.astro. Keep them after verification succeeds: Bing
   * re-checks, and removing the tag un-verifies the site.
   */
  verification: {
    // Bing Webmaster Tools, HTML meta tag method.
    bing: 'C03A0EB81C06CD60946A9B15222A7210',
  },
  /**
   * Public repo for this site. tag-and-release.yml publishes a GitHub release
   * named v<version> on every merge to main, so the footer's version links to
   * `${repoUrl}/releases/tag/v<version>`.
   */
  repoUrl: 'https://github.com/Toastbyte-Studios/coldboot-web',
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
  lastUpdated: '2026-10-14',
} as const;

/** The readout strip under the hero. */
export const READOUTS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Signal', value: 'Not required' },
  { label: 'Account', value: 'None to create' },
  { label: 'What you save', value: 'Stays on the phone' },
  { label: 'Platforms', value: 'iOS + Android' },
];
