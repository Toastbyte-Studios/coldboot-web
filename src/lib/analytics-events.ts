/**
 * The analytics event vocabulary for coldboot.app.
 *
 * Ported from alley-admin, which has the same shape of site: prerendered
 * pages with one conversion. So there are only three questions worth asking:
 * how many people start the waitlist form versus finish it, where the
 * outbound clicks go, and whether anyone uses the theme switch.
 *
 * Note what is NOT here: `page_view`. Every page here is a full document
 * load, so Zaraz's automatic Pageviews action already covers it. A manual one
 * would double-count every visit. (toastbyte.studio fires it by hand only
 * because it is a hash-routed SPA.)
 *
 * Keep this small. Every name here is a commitment to fire it from somewhere,
 * to see it in reports, and to list it in the privacy policy.
 */
export const ANALYTICS_EVENTS = {
  /**
   * A waitlist form was submitted and passed the browser's own validation.
   * The `form` param is which form (`WaitlistSource`).
   */
  waitlistSignupStarted: 'waitlist_signup_started',

  /**
   * /joined loaded after a submission from this tab.
   *
   * There is no `duplicate` event, as in alley-admin: a repeat signup must
   * look exactly like a new one (see AGENTS.md, Waitlist), so the page can't
   * tell them apart, and it shouldn't be able to.
   */
  waitlistSignupSucceeded: 'waitlist_signup_succeeded',

  /**
   * /join-error loaded after a submission from this tab. The `reason` param
   * is `invalid_email` or `server_error`, from the endpoint's redirect.
   */
  waitlistSignupFailed: 'waitlist_signup_failed',

  /**
   * An outbound click to an external destination.
   *
   * Explicit rather than inherited: GA4's enhanced-measurement outbound-click
   * tracking ships with the gtag.js snippet, and Zaraz does not provide those
   * automatic events. Nothing captures this unless we fire it ourselves.
   */
  outboundLinkClicked: 'outbound_link_clicked',

  /**
   * A theme was picked with the switch. The `theme` param is 'light', 'dark'
   * or 'system'.
   */
  themeToggled: 'theme_toggled',
} as const;

export const ANALYTICS_OUTBOUND_DESTINATIONS = [
  'toastbyte-studio',
  'github-release',
  'google-policy',
] as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

const EVENT_NAMES: ReadonlySet<string> = new Set(
  Object.values(ANALYTICS_EVENTS),
);

/**
 * The allowlist the relay endpoint checks against. Unlike the siblings, whose
 * Pages Functions are bundled apart from the site and keep a hand-copied list,
 * the endpoint here is part of the same Astro build, so it reads this one.
 */
export function isAnalyticsEventName(
  value: unknown,
): value is AnalyticsEventName {
  return typeof value === 'string' && EVENT_NAMES.has(value);
}
