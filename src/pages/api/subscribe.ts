import { env } from 'cloudflare:workers';
import { getClientIp, sha256Hex } from '../../lib/analytics-relay';
import { isSignupAllowed, parseSubmission } from '../../lib/waitlist';
import type { APIRoute } from 'astro';

// Runs on the Worker for every request; everything else on the site is static.
export const prerender = false;

const JOINED = '/joined';
// The reason only feeds the waitlist_signup_failed analytics event; the page
// reads the same either way, so it gives a visitor nothing new.
const TRY_AGAIN = {
  invalid: '/join-error?reason=invalid_email',
  server: '/join-error?reason=server_error',
  // /join-error reports any reason it doesn't know as server_error, so this
  // adds nothing to the analytics vocabulary or the privacy policy's list.
  throttled: '/join-error?reason=rate_limited',
} as const;

/**
 * Handles a plain HTML form post and answers with a 303 redirect, so it works
 * with JavaScript disabled and a refresh can't resubmit the form.
 *
 * Astro's `security.checkOrigin` (on by default) rejects cross-site form
 * posts before this handler runs. That only stops browsers: a script can
 * send any Origin it likes, which is what the rate limit below is for.
 */
export const POST: APIRoute = async ({ request, redirect }) => {
  // Before any other work, so a script posting in a loop is turned away
  // cheaply. The key is a truncated hash of the caller's address: the
  // limiter needs something stable per caller, not the address itself, and
  // nothing here is stored with a signup.
  const rateKey = (await sha256Hex(getClientIp(request.headers))).slice(0, 16);
  if (!(await isSignupAllowed(env.WAITLIST_LIMITER, rateKey))) {
    return redirect(TRY_AGAIN.throttled, 303);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirect(TRY_AGAIN.server, 303);
  }

  const submission = parseSubmission(form);
  if (!submission.ok) {
    // Show bots the success page so they get no signal to adapt to.
    return redirect(
      submission.reason === 'bot' ? JOINED : TRY_AGAIN.invalid,
      303,
    );
  }

  try {
    // A repeat signup is a no-op, and answers exactly like a new one, so the
    // form can't be used to check whether an address is already on the list.
    await env.DB.prepare(
      'INSERT INTO waitlist (email, source) VALUES (?1, ?2) ON CONFLICT (email) DO NOTHING',
    )
      .bind(submission.email, submission.source)
      .run();
  } catch (error) {
    // Never log the address itself.
    console.error(
      'waitlist insert failed:',
      error instanceof Error ? error.message : error,
    );
    return redirect(TRY_AGAIN.server, 303);
  }

  return redirect(JOINED, 303);
};
