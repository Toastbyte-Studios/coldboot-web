import { env } from 'cloudflare:workers';
import { parseSubmission } from '../../lib/waitlist';
import type { APIRoute } from 'astro';

// Runs on the Worker for every request; everything else on the site is static.
export const prerender = false;

const JOINED = '/joined';
// The reason only feeds the waitlist_signup_failed analytics event; the page
// reads the same either way, so it gives a visitor nothing new.
const TRY_AGAIN = {
  invalid: '/join-error?reason=invalid_email',
  server: '/join-error?reason=server_error',
} as const;

/**
 * Handles a plain HTML form post and answers with a 303 redirect, so it works
 * with JavaScript disabled and a refresh can't resubmit the form.
 *
 * Astro's `security.checkOrigin` (on by default) rejects cross-site form
 * posts before this handler runs.
 */
export const POST: APIRoute = async ({ request, redirect }) => {
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
