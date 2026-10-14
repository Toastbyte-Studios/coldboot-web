import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isAnalyticsConsentRequired,
  readConsentFromCookieString,
} from '../src/lib/analytics-consent.ts';
import { isAnalyticsEventName } from '../src/lib/analytics-events.ts';
import {
  buildMeasurementPayload,
  checkRelayRequest,
  createRateLimiter,
  getClientIp,
  parseRelayEvent,
  sanitizeParams,
  toClientId,
} from '../src/lib/analytics-relay.ts';

describe('isAnalyticsConsentRequired', () => {
  it('fails closed when the build variable is unset', () => {
    assert.equal(isAnalyticsConsentRequired(), true);
  });
});

describe('readConsentFromCookieString', () => {
  it('reads granted and denied', () => {
    assert.equal(
      readConsentFromCookieString('a=1; analytics-consent=granted; b=2'),
      'granted',
    );
    assert.equal(
      readConsentFromCookieString('analytics-consent=denied'),
      'denied',
    );
  });

  it('treats missing, unknown and malformed values as no answer', () => {
    for (const cookies of [
      null,
      '',
      'other=granted',
      'analytics-consent=yes',
      'analytics-consent=%E0%A4%A',
      'xanalytics-consent=granted',
    ]) {
      assert.equal(readConsentFromCookieString(cookies), null, String(cookies));
    }
  });
});

describe('isAnalyticsEventName', () => {
  it('accepts known events only', () => {
    assert.equal(isAnalyticsEventName('theme_toggled'), true);
    assert.equal(isAnalyticsEventName('page_view'), false);
    assert.equal(isAnalyticsEventName(42), false);
  });
});

describe('checkRelayRequest', () => {
  const ok = {
    contentType: 'application/json',
    origin: 'https://coldboot.app',
    requestUrl: 'https://coldboot.app/api/analytics/event',
    cookieHeader: 'analytics-consent=granted',
    consentRequired: true,
  };

  it('lets a same-origin JSON request with consent through', () => {
    assert.equal(checkRelayRequest(ok), null);
  });

  it('requires JSON', () => {
    assert.equal(
      checkRelayRequest({ ...ok, contentType: 'text/plain' })?.status,
      415,
    );
  });

  it('refuses other origins and missing origins', () => {
    for (const origin of ['https://evil.example', null]) {
      assert.equal(checkRelayRequest({ ...ok, origin })?.status, 403);
    }
  });

  it('refuses without consent when consent is required', () => {
    for (const cookieHeader of [null, 'analytics-consent=denied']) {
      assert.deepEqual(checkRelayRequest({ ...ok, cookieHeader }), {
        status: 403,
        error: 'Analytics consent not granted.',
      });
    }
  });

  it('skips the consent check when consent is not required', () => {
    assert.equal(
      checkRelayRequest({ ...ok, cookieHeader: null, consentRequired: false }),
      null,
    );
  });
});

describe('parseRelayEvent', () => {
  it('rejects unknown events and non-objects', () => {
    for (const body of [null, 'x', { eventName: 'page_view' }, {}]) {
      assert.equal(parseRelayEvent(body), null);
    }
  });

  it('returns the event with sanitized params', () => {
    assert.deepEqual(
      parseRelayEvent({
        eventName: 'theme_toggled',
        params: { theme: 'dark' },
      }),
      { eventName: 'theme_toggled', params: { theme: 'dark' } },
    );
  });
});

describe('sanitizeParams', () => {
  it('keeps primitives, maps booleans and drops the rest', () => {
    assert.deepEqual(
      sanitizeParams({
        s: 'x',
        n: 3,
        t: true,
        f: false,
        nan: Number.NaN,
        o: {},
        a: [],
        u: undefined,
        z: null,
      }),
      { s: 'x', n: 3, t: 1, f: 0 },
    );
  });

  it('enforces GA4 limits', () => {
    const many = Object.fromEntries(
      Array.from({ length: 30 }, (_, i) => [`p${i}`, i]),
    );
    assert.equal(Object.keys(sanitizeParams(many)).length, 24);
    assert.deepEqual(sanitizeParams({ ['k'.repeat(41)]: 1 }), {});
    assert.equal(
      (sanitizeParams({ v: 'v'.repeat(150) }).v as string).length,
      100,
    );
  });

  it('ignores non-object input', () => {
    assert.deepEqual(sanitizeParams('x'), {});
    assert.deepEqual(sanitizeParams([1, 2]), {});
  });
});

describe('getClientIp', () => {
  it('prefers cf-connecting-ip', () => {
    const headers = new Headers({
      'cf-connecting-ip': '1.1.1.1',
      'x-forwarded-for': '2.2.2.2',
    });
    assert.equal(getClientIp(headers), '1.1.1.1');
  });

  it('takes the rightmost x-forwarded-for segment', () => {
    const headers = new Headers({ 'x-forwarded-for': 'forged, 3.3.3.3' });
    assert.equal(getClientIp(headers), '3.3.3.3');
  });
});

describe('toClientId', () => {
  it('is stable for the same request and shaped like a GA client id', async () => {
    const headers = new Headers({ 'cf-connecting-ip': '1.1.1.1' });
    const id = await toClientId(headers);
    assert.match(id, /^[0-9a-f]{10}\.[0-9a-f]{10}$/);
    assert.equal(await toClientId(headers), id);
  });
});

describe('createRateLimiter', () => {
  it('allows up to the limit per window, then recovers', () => {
    const allow = createRateLimiter({ windowMs: 1000, maxRequests: 2 });
    assert.equal(allow('a', 0), true);
    assert.equal(allow('a', 1), true);
    assert.equal(allow('a', 2), false);
    assert.equal(allow('b', 2), true);
    assert.equal(allow('a', 1001), true);
  });

  it('caps the number of keys it remembers', () => {
    const allow = createRateLimiter({ maxRequests: 1, maxEntries: 2 });
    allow('a', 0);
    allow('b', 0);
    allow('c', 0);
    // 'a' was evicted, so it's allowed again inside the same window.
    assert.equal(allow('a', 1), true);
  });
});

describe('buildMeasurementPayload', () => {
  it('adds an engagement time and turns off ad personalization', () => {
    assert.deepEqual(
      buildMeasurementPayload('1.2', {
        eventName: 'theme_toggled',
        params: { theme: 'light' },
      }),
      {
        client_id: '1.2',
        non_personalized_ads: true,
        events: [
          {
            name: 'theme_toggled',
            params: { theme: 'light', engagement_time_msec: 1 },
          },
        ],
      },
    );
  });
});
