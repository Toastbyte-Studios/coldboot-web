/**
 * Waitlist input handling. Pure functions only, so it can be unit tested
 * without a Worker runtime or a database.
 */

/** RFC 5321 caps a forward path at 256 octets, which leaves 254 for the address. */
export const MAX_EMAIL_LENGTH = 254;

/**
 * Which form a signup came from. Matches `WaitlistForm`'s `id`. Guide pages
 * each have their own (`morse` is /morse-code, `nato` is
 * /nato-phonetic-alphabet, `signals` is /ground-to-air-signals, `radio` is
 * /emergency-radio-frequencies) and so does /faq (`faq`), so their signups
 * can be told apart from the home page's.
 */
export const WAITLIST_SOURCES = [
  'hero',
  'closing',
  'retry',
  'morse',
  'nato',
  'signals',
  'radio',
  'faq',
] as const;
export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

/**
 * Name of the honeypot field. It is hidden from people and from assistive
 * tech, so anything that fills it in is almost certainly a bot.
 */
export const HONEYPOT_FIELD = 'website';

export type WaitlistSubmission =
  | { ok: true; email: string; source: WaitlistSource }
  | { ok: false; reason: 'bot' | 'invalid' };

/**
 * Trims and lowercases an address so the same person can't sign up twice by
 * changing case. Strictly, the local part is case-sensitive, but no mainstream
 * provider treats it that way.
 */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Deliberately loose: one `@`, something before it, a dotted domain after it,
 * no whitespace. The browser's `type="email"` check does the rest, and the
 * only real test of an address is whether mail arrives.
 */
export function isValidEmail(email: string): boolean {
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) {
    return false;
  }
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email);
}

function isWaitlistSource(value: string): value is WaitlistSource {
  return (WAITLIST_SOURCES as readonly string[]).includes(value);
}

/** Reads and validates a waitlist form post. */
export function parseSubmission(form: FormData): WaitlistSubmission {
  const honeypot = form.get(HONEYPOT_FIELD);
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    return { ok: false, reason: 'bot' };
  }

  const rawEmail = form.get('email');
  if (typeof rawEmail !== 'string') {
    return { ok: false, reason: 'invalid' };
  }

  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return { ok: false, reason: 'invalid' };
  }

  // An unknown source isn't worth rejecting a real signup over.
  const rawSource = form.get('source');
  const source =
    typeof rawSource === 'string' && isWaitlistSource(rawSource)
      ? rawSource
      : 'hero';

  return { ok: true, email, source };
}
