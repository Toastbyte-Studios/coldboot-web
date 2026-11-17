import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { ANALYTICS_EVENTS } from '../src/lib/analytics-events.ts';
import { sanitizeParams } from '../src/lib/analytics-relay.ts';

/**
 * The privacy policy promises "we also send these events, and no others".
 * These tests hold the page to the code, in both directions, so an event
 * can't be added (or removed) without the policy following.
 */
const policy = readFileSync(
  new URL('../src/pages/privacy.astro', import.meta.url),
  'utf8',
);

/** The Analytics section only: later sections bold cookie names too. */
function analyticsSection(): string {
  const start = policy.indexOf('id="analytics"');
  const end = policy.indexOf('id="cookies"');
  assert.ok(start !== -1 && end > start, 'Analytics section not found');
  return policy.slice(start, end);
}

function eventsNamedInPolicy(): string[] {
  return [...analyticsSection().matchAll(/<strong>([a-z_]+)<\/strong>/g)]
    .map((match) => match[1])
    .sort();
}

describe('privacy policy event list', () => {
  it('names every event the site can send, and no others', () => {
    assert.deepEqual(
      eventsNamedInPolicy(),
      Object.values(ANALYTICS_EVENTS).sort(),
    );
  });

  it('names each event once', () => {
    const named = eventsNamedInPolicy();
    assert.equal(new Set(named).size, named.length);
  });
});

describe('relay allowlist', () => {
  // An event with no branch in sanitizeParams is dropped by the relay for
  // every input, which is easy to miss: the browser path through Zaraz still
  // works, so only blocked-script visitors silently go missing.
  it('has a parameter rule for every event', () => {
    const samples: Record<string, Record<string, string>> = {
      waitlist_form_viewed: { form: 'hero' },
      waitlist_signup_started: { form: 'hero' },
      waitlist_signup_succeeded: { form: 'hero' },
      waitlist_signup_failed: { form: 'hero', reason: 'server_error' },
      outbound_link_clicked: { destination: 'toastbyte-studio' },
      theme_toggled: { theme: 'dark' },
    };
    for (const eventName of Object.values(ANALYTICS_EVENTS)) {
      assert.ok(
        samples[eventName],
        `add a sample for ${eventName} to this test`,
      );
      assert.notEqual(
        sanitizeParams(eventName, samples[eventName]),
        null,
        `${eventName} is rejected by sanitizeParams`,
      );
    }
  });
});
