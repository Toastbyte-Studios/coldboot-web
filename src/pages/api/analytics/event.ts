import { env } from 'cloudflare:workers';
import { isAnalyticsConsentRequired } from '../../../lib/analytics-consent';
import {
  buildMeasurementPayload,
  checkRelayRequest,
  createRateLimiter,
  GA4_ENDPOINT,
  parseRelayEvent,
  sha256Hex,
  getClientIp,
  toClientId,
} from '../../../lib/analytics-relay';
import type { APIRoute } from 'astro';

// Runs on the Worker; see src/lib/analytics-relay.ts for what and why.
export const prerender = false;

/**
 * Both are Worker secrets (`wrangler secret put`), so they're absent from
 * the generated Env type. Neither is set in wrangler.jsonc: a `vars` entry
 * there would overwrite the dashboard value on every deploy.
 */
type AnalyticsSecrets = {
  ANALYTICS_GA4_MEASUREMENT_ID?: string;
  ANALYTICS_GA4_API_SECRET?: string;
};

const allow = createRateLimiter();

function json(body: unknown, status: number, extra: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extra,
    },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const rejection = checkRelayRequest({
    contentType: request.headers.get('content-type'),
    origin: request.headers.get('origin'),
    requestUrl: request.url,
    cookieHeader: request.headers.get('cookie'),
    consentRequired: isAnalyticsConsentRequired(),
  });
  if (rejection) {
    return json({ error: rejection.error }, rejection.status);
  }

  const rateKey = (await sha256Hex(getClientIp(request.headers))).slice(0, 16);
  if (!allow(rateKey)) {
    return json({ error: 'Too many requests.' }, 429, { 'Retry-After': '60' });
  }

  const event = parseRelayEvent(await request.json().catch(() => null));
  if (!event) {
    return json({ error: 'Invalid analytics event.' }, 400);
  }

  const secrets = env as AnalyticsSecrets;
  const measurementId = secrets.ANALYTICS_GA4_MEASUREMENT_ID?.trim();
  const apiSecret = secrets.ANALYTICS_GA4_API_SECRET?.trim();
  if (!measurementId || !apiSecret) {
    // The intended state until GA4 is provisioned. Not an error the caller
    // can act on, and not worth surfacing as one.
    return json({ ok: true, delivered: false }, 200);
  }

  const url = new URL(GA4_ENDPOINT);
  url.searchParams.set('measurement_id', measurementId);
  url.searchParams.set('api_secret', apiSecret);

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5_000),
      body: JSON.stringify(
        buildMeasurementPayload(await toClientId(request.headers), event),
      ),
    });
  } catch {
    // Analytics delivery must never surface as an error to the page.
  }

  return json({ ok: true }, 200);
};
