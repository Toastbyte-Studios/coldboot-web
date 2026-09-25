import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  HONEYPOT_FIELD,
  isValidEmail,
  MAX_EMAIL_LENGTH,
  normalizeEmail,
  parseSubmission,
} from '../src/lib/waitlist.ts';

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

describe('normalizeEmail', () => {
  it('trims whitespace and lowercases', () => {
    assert.equal(normalizeEmail('  Ada@Example.COM \n'), 'ada@example.com');
  });
});

describe('isValidEmail', () => {
  for (const email of [
    'a@b.co',
    'first.last+tag@sub.example.org',
    "o'brien@example.ie",
  ]) {
    it(`accepts ${email}`, () => assert.equal(isValidEmail(email), true));
  }

  for (const email of [
    '',
    'no-at-sign.example.com',
    'two@@example.com',
    'nodomain@',
    '@nolocal.com',
    'no-tld@example',
    'dot-end@example.',
    'double-dot@example..com',
    'has space@example.com',
  ]) {
    it(`rejects ${JSON.stringify(email)}`, () =>
      assert.equal(isValidEmail(email), false));
  }

  it('rejects addresses over the length limit', () => {
    const local = 'a'.repeat(MAX_EMAIL_LENGTH);
    assert.equal(isValidEmail(`${local}@example.com`), false);
  });
});

describe('parseSubmission', () => {
  it('returns the normalized email and source', () => {
    assert.deepEqual(
      parseSubmission(form({ email: ' Ada@Example.com ', source: 'closing' })),
      { ok: true, email: 'ada@example.com', source: 'closing' },
    );
  });

  it('flags a filled honeypot as a bot, even with a valid email', () => {
    assert.deepEqual(
      parseSubmission(
        form({ email: 'ada@example.com', [HONEYPOT_FIELD]: 'spam.biz' }),
      ),
      { ok: false, reason: 'bot' },
    );
  });

  it('ignores a honeypot that is only whitespace', () => {
    const result = parseSubmission(
      form({ email: 'ada@example.com', [HONEYPOT_FIELD]: '  ' }),
    );
    assert.equal(result.ok, true);
  });

  it('rejects a missing email', () => {
    assert.deepEqual(parseSubmission(form({ source: 'hero' })), {
      ok: false,
      reason: 'invalid',
    });
  });

  it('rejects an invalid email', () => {
    assert.deepEqual(parseSubmission(form({ email: 'not-an-email' })), {
      ok: false,
      reason: 'invalid',
    });
  });

  it('falls back to "hero" for an unknown or missing source', () => {
    const cases: Array<Record<string, string>> = [
      { email: 'ada@example.com', source: 'somewhere-else' },
      { email: 'ada@example.com' },
    ];
    for (const fields of cases) {
      assert.deepEqual(parseSubmission(form(fields)), {
        ok: true,
        email: 'ada@example.com',
        source: 'hero',
      });
    }
  });
});
