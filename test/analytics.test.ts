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
        params: { theme: 'dark', email: 'private@example.com' },
      }),
      { eventName: 'theme_toggled', params: { theme: 'dark' } },
    );
  });

  it('requires event-specific parameters and enum values', () => {
    for (const body of [
      { eventName: 'theme_toggled', params: { theme: 'blue' } },
      { eventName: 'waitlist_signup_started', params: { form: 'unknown' } },
      {
        eventName: 'waitlist_signup_failed',
        params: { form: 'hero', reason: 'email' },
      },
      {
        eventName: 'outbound_link_clicked',
        params: { destination: 'https://evil.example/?email=a@b.test' },
      },
      { eventName: 'theme_toggled', params: [] },
    ]) {
      assert.equal(parseRelayEvent(body), null);
    }
    assert.deepEqual(
      parseRelayEvent({
        eventName: 'theme_toggled',
        params: { theme: 'dark', form: 'hero' },
      }),
      { eventName: 'theme_toggled', params: { theme: 'dark' } },
    );
  });
});

describe('sanitizeParams', () => {
  it('keeps only the event parameters with known enum values', () => {
    assert.deepEqual(
      sanitizeParams('waitlist_signup_started', {
        form: 'hero',
        email: 'private@example.com',
        extra: true,
      }),
      { form: 'hero' },
    );
    assert.equal(
      sanitizeParams('waitlist_signup_succeeded', { form: 'retry' })?.form,
      'retry',
    );
    assert.deepEqual(
      sanitizeParams('waitlist_signup_failed', {
        form: 'closing',
        reason: 'server_error',
      }),
      { form: 'closing', reason: 'server_error' },
    );
    assert.deepEqual(
      sanitizeParams('outbound_link_clicked', {
        destination: 'google-policy',
      }),
      { destination: 'google-policy' },
    );
    assert.deepEqual(sanitizeParams('theme_toggled', { theme: 'system' }), {
      theme: 'system',
    });
  });

  it('rejects malformed parameter objects and invalid required values', () => {
    assert.equal(sanitizeParams('theme_toggled', 'x'), null);
    assert.equal(sanitizeParams('theme_toggled', [1, 2]), null);
    assert.equal(sanitizeParams('theme_toggled', { theme: true }), null);
    assert.equal(
      sanitizeParams('waitlist_signup_succeeded', { form: 'untrusted' }),
      null,
    );
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
