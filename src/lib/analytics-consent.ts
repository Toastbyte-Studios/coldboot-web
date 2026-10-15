import type { AnalyticsEventName } from './analytics-events.ts';

/**
 * Shared consent vocabulary for the browser and the relay endpoint.
 *
 * Ported from alley-admin (which ported it from toastbyte.studio). Consent
 * lives in a cookie rather than localStorage so that the relay endpoint can
 * read the same value the browser wrote. Otherwise a visitor could decline
 * and still have every server-delivered event reach GA4.
 *
 * Unlike the siblings, the endpoint (src/pages/api/analytics/event.ts) is part
 * of this Astro build, so it imports from here instead of keeping its own
 * copy of the cookie name and parse rule. Keep this module free of browser
 * globals so that stays true.
 */

export const ANALYTICS_CONSENT_COOKIE = 'analytics-consent';

/** One year, the usual ceiling for a consent record before re-prompting. */
export const ANALYTICS_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ConsentValue = 'granted' | 'denied';

/**
 * `null` means the visitor has not chosen yet, which is distinct from
 * 'denied'. Absent is treated as denied for tracking purposes but as
 * unanswered for banner purposes: the banner shows on null, not on 'denied'.
 */
export type ConsentState = ConsentValue | 'not-required' | null;

/**
 * Whether analytics waits for a yes. On unless the build sets
 * `PUBLIC_ANALYTICS_REQUIRE_CONSENT=0`.
 *
 * This is the one deliberate difference from the siblings, which require
 * `=1` to turn consent on. They are built by Cloudflare Pages, where the
 * build variable is set in the dashboard; this site is built in GitHub
 * Actions (deploy.yml) with no .env, so an opt-in flag would quietly ship
 * with consent off. Failing closed means a missing variable can only ever
 * cost us data, never a visitor's choice.
 *
 * Vite inlines `import.meta.env.*` at build time, into the browser bundle
 * and the Worker bundle alike, so the banner, the client gate and the relay
 * endpoint all read the same value. That also removes the siblings' second,
 * server-only flag, which had to be kept in step by hand. The optional chain
 * keeps this callable under `node --test`, where `import.meta.env` is unset.
 */
export function isAnalyticsConsentRequired(): boolean {
  return import.meta.env?.PUBLIC_ANALYTICS_REQUIRE_CONSENT !== '0';
}

export function parseConsentValue(
  raw: string | null | undefined,
): ConsentValue | null {
  return raw === 'granted' || raw === 'denied' ? raw : null;
}

/**
 * Reads the consent value from a `document.cookie` string or a request's
 * `Cookie` header. They share a format, so the browser and the endpoint
 * parse it with the same code.
 */
export function readConsentFromCookieString(
  cookies: string | null | undefined,
): ConsentValue | null {
  const prefix = `${ANALYTICS_CONSENT_COOKIE}=`;
  const entry = (cookies ?? '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  if (!entry) {
    return null;
  }

  try {
    return parseConsentValue(decodeURIComponent(entry.slice(prefix.length)));
  } catch {
    // A malformed escape sequence. Treat it as no answer, not as a crash.
    return null;
  }
}

/**
 * Events delivered even when consent is absent or denied.
 *
 * EMPTY, AND IT SHOULD STAY EMPTY.
 *
 * Every event on this site originates from a browser on our own origin, where
 * the consent cookie is available to be read, so every event can and must be
 * gated. If you find yourself wanting to add something here, the honest
 * question is whether the event should fire at all.
 */
export const CONSENT_EXEMPT_EVENTS: ReadonlySet<AnalyticsEventName> = new Set();
