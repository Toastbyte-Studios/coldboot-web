/**
 * Logic for /api/analytics/event, the Measurement Protocol fallback for
 * client events. Pure functions (plus one in-memory limiter), so it can be
 * unit tested without a Worker runtime; the endpoint stays a thin wrapper,
 * like /api/subscribe and waitlist.ts.
 *
 * Ported from alley-admin's functions/api/analytics/event.ts. The relay is
 * only reached when Zaraz has not loaded in the visitor's browser (see
 * `trackClientEvent`), so it should see very little traffic. If it starts
 * seeing a lot, something is wrong with the Zaraz configuration for the zone.
 */
import { readConsentFromCookieString } from './analytics-consent.ts';
import {
  ANALYTICS_EVENTS,
  ANALYTICS_OUTBOUND_DESTINATIONS,
  isAnalyticsEventName,
  type AnalyticsEventName,
} from './analytics-events.ts';
import { WAITLIST_SOURCES } from './waitlist.ts';

export const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

export type RelayRejection = {
  status: 400 | 403 | 415;
  error: string;
};

/**
 * The checks that run before any work is done, cheapest first. Returns why
 * the request is refused, or `null` to carry on.
 */
export function checkRelayRequest(input: {
  contentType: string | null;
  origin: string | null;
  requestUrl: string;
  cookieHeader: string | null;
  consentRequired: boolean;
}): RelayRejection | null {
  if (!input.contentType?.toLowerCase().includes('application/json')) {
    return { status: 415, error: 'Content-Type must be application/json.' };
  }

  // Same-origin only. The endpoint holds an API secret; without this it would
  // be an open relay into our GA4 property. Astro's checkOrigin doesn't cover
  // it: that only applies to form content types.
  if (!input.origin || input.origin !== new URL(input.requestUrl).origin) {
    return { status: 403, error: 'Origin not allowed.' };
  }

  // Before the rate-limit budget is spent, so a visitor who declined is not
  // also throttled.
  if (
    input.consentRequired &&
    readConsentFromCookieString(input.cookieHeader) !== 'granted'
  ) {
    return { status: 403, error: 'Analytics consent not granted.' };
  }

  return null;
}

export type RelayEvent = {
  eventName: AnalyticsEventName;
  params: Record<string, string | number>;
};

/** Validates the JSON body. `null` for anything that isn't a known event. */
export function parseRelayEvent(body: unknown): RelayEvent | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }
  const { eventName, params } = body as Record<string, unknown>;
  if (!isAnalyticsEventName(eventName)) {
    return null;
  }
  const sanitizedParams = sanitizeParams(eventName, params);
  if (!sanitizedParams) {
    return null;
  }
  return { eventName, params: sanitizedParams };
}

/**
 * Keeps only the known parameters and enum values for each event. This also
 * prevents arbitrary request data, including email addresses, reaching GA4.
 */
export function sanitizeParams(
  eventName: AnalyticsEventName,
  raw: unknown,
): Record<string, string | number> | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return null;
  }

  const input = raw as Record<string, unknown>;
  if (
    eventName === ANALYTICS_EVENTS.waitlistSignupStarted ||
    eventName === ANALYTICS_EVENTS.waitlistSignupSucceeded
  ) {
    return (WAITLIST_SOURCES as readonly unknown[]).includes(input.form)
      ? { form: input.form as string }
      : null;
  }
  if (eventName === ANALYTICS_EVENTS.waitlistSignupFailed) {
    if (
      !(WAITLIST_SOURCES as readonly unknown[]).includes(input.form) ||
      (input.reason !== 'invalid_email' && input.reason !== 'server_error')
    ) {
      return null;
    }
    return { form: input.form as string, reason: input.reason };
  }
  if (eventName === ANALYTICS_EVENTS.themeToggled) {
    return input.theme === 'light' ||
      input.theme === 'dark' ||
      input.theme === 'system'
      ? { theme: input.theme }
      : null;
  }
  if (eventName === ANALYTICS_EVENTS.outboundLinkClicked) {
    return (ANALYTICS_OUTBOUND_DESTINATIONS as readonly unknown[]).includes(
      input.destination,
    )
      ? { destination: input.destination as string }
      : null;
  }
  return null;
}

/**
 * cf-connecting-ip is set by Cloudflare and cannot be spoofed by the caller.
 * The x-forwarded-for fallback takes the RIGHTMOST segment: the closest
 * trusted proxy appends its view of the peer, while anything to the left was
 * supplied by the caller and is forgeable.
 */
export function getClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get('cf-connecting-ip')?.trim();
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  const segments = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments[segments.length - 1] ?? 'unknown';
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * A stable-ish pseudonymous identifier so GA4 has something to group events
 * by. It is derived per request and never stored, and it will not match the
 * client ID Zaraz uses, which is exactly why relayed events don't join the
 * visitor's real session. The privacy policy describes this; keep them in step.
 */
export async function toClientId(headers: Headers): Promise<string> {
  const seed = [
    getClientIp(headers),
    headers.get('user-agent') ?? '',
    headers.get('accept-language') ?? '',
  ].join('|');
  const hex = await sha256Hex(seed);
  return `${hex.slice(0, 10)}.${hex.slice(10, 20)}`;
}

/**
 * Best-effort, per-isolate throttling. Not shared across Worker instances and
 * reset on cold start; a global limit would need KV or a Durable Object.
 * Enough to stop a single client hammering the endpoint into our GA4 quota.
 * Keys are hashed by the caller so no raw IP sits in memory.
 */
export function createRateLimiter({
  windowMs = 60_000,
  maxRequests = 20,
  maxEntries = 10_000,
} = {}) {
  const hits = new Map<string, number[]>();

  return function allow(key: string, now = Date.now()): boolean {
    const windowStart = now - windowMs;
    const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

    if (recent.length >= maxRequests) {
      hits.set(key, recent);
      return false;
    }

    recent.push(now);
    hits.set(key, recent);

    if (hits.size > maxEntries) {
      for (const [k, timestamps] of hits) {
        const kept = timestamps.filter((t) => t > windowStart);
        if (kept.length === 0) hits.delete(k);
        else hits.set(k, kept);
      }
      // Still over: drop the oldest keys (Map keeps insertion order).
      for (const k of hits.keys()) {
        if (hits.size <= maxEntries) break;
        hits.delete(k);
      }
    }

    return true;
  };
}

/** The Measurement Protocol request body for one event. */
export function buildMeasurementPayload(clientId: string, event: RelayEvent) {
  return {
    client_id: clientId,
    non_personalized_ads: true,
    events: [
      {
        name: event.eventName,
        // Without an engagement time GA4 drops the event from most reports.
        params: { ...event.params, engagement_time_msec: 1 },
      },
    ],
  };
}
