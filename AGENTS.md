# coldboot-web — agent instructions

Marketing site for ColdBoot at <https://coldboot.app>. Right now it is a
prelaunch page that collects waitlist emails. The app itself lives in
[Toastbyte-Studios/ColdBoot](https://github.com/Toastbyte-Studios/ColdBoot).

`CLAUDE.md` is a symlink to this file, so Claude Code and other agents read the
same instructions. Edit this file, not the link.

Unlike the app, this site **does** talk to the network: the waitlist form posts
to a server endpoint, and, with the visitor's consent, analytics reach Google
Analytics through Cloudflare Zaraz. The app's "no network requests" rule does
not apply here.

---

## Stack

| Concern    | Choice                                                     |
| ---------- | ---------------------------------------------------------- |
| Framework  | Astro 7, static output by default                          |
| Language   | TypeScript (strict, `astro/tsconfigs/strict`)              |
| Hosting    | Cloudflare Workers (static assets + `@astrojs/cloudflare`) |
| Styling    | Plain CSS with ColdBoot brand tokens; no CSS framework     |
| Lint       | ESLint 10 flat config + `eslint-plugin-astro`, `import-x`  |
| Formatting | Prettier + `prettier-plugin-astro`                         |

---

## Key Commands

```bash
npm run dev           # Astro dev server
npm run build         # Production build into dist/
npm run preview       # Build, then serve with wrangler dev (Workers runtime)
npm run typecheck     # wrangler types + astro check
npm run lint          # ESLint
npm run format        # Prettier write
npm run format:check  # Prettier check (CI)
npm test              # Unit tests (node --test, native TypeScript)
npm run db:migrate:local   # Apply D1 migrations to the local database
npm run db:migrate:remote  # Apply D1 migrations to production
npm run cleanup       # format + lint + typecheck + test + build — run before a PR
npm run deploy        # Build and wrangler deploy
```

When starting the dev server from an agent, use background mode
(`astro dev --background`) and manage it with `astro dev stop`,
`astro dev status` and `astro dev logs`.

---

## PR requirements

Bump `version` in `package.json` on every PR, following semver:

- Patch — copy changes, styling tweaks, bug fixes
- Minor — new sections, pages, endpoints
- Major — breaking changes to deploy config or the waitlist data shape

`.github/workflows/require-version-bump.yml` fails the PR if the version
matches `main`.

Merging to `main` is a release: `deploy.yml` deploys to production and
`tag-and-release.yml` tags `v<version>` with a GitHub release. So `main` must
always be deployable, and the version you bump to is the version that ships.
Don't run `npm run deploy` by hand unless the workflow is broken.

Changes under `.github/workflows/` can't be pushed through the GitHub
connector (it lacks the `workflow` scope). Write and lint them with
`actionlint`, then hand them to a human to commit.

---

## Project Structure

```text
src/
  assets/brand/   # Logo SVGs, copied from ColdBoot (do not edit here)
  components/     # Building blocks (SiteHeader, SiteFooter, WaitlistForm, Mark, ...)
  data/           # Copy and content as typed data (modules.ts, site.ts, spotlight.ts)
  layouts/        # Base.astro (<head>, meta, fonts, CSS); Notice.astro (result pages)
  lib/            # Logic, unit tested where pure (waitlist.ts, analytics-*.ts)
  pages/          # Routes; files here become URLs
    api/          # Worker endpoints (subscribe.ts, analytics/event.ts)
  styles/
    tokens.css    # ColdBoot brand tokens, copied from ColdBoot (do not edit here)
    global.css    # Site-level tokens, resets and shared utilities
migrations/       # D1 schema, applied in order by wrangler
test/             # node:test unit tests for src/lib
public/           # Served as-is (favicon, icons, og.png, robots.txt, manifest)
scripts/          # generate-icons.mjs: PNG icons from the brand icon
```

---

## Conventions

### Rendering

- Pages are prerendered to static HTML. Keep it that way unless a route truly
  needs per-request work.
- A route that must run on the Worker (the waitlist endpoint) opts out with
  `export const prerender = false;` at the top of the file.
- Worker bindings (like `DB`) come from `import { env } from 'cloudflare:workers'`.
  `Astro.locals.runtime.env` was removed in Astro 6 and throws.
- `build.format` is `'file'`, so `/joined` builds to `joined.html` and is
  served without a trailing-slash redirect.
- Ship no client JavaScript by default. Prefer HTML and CSS; reach for a
  `<script>` only when there is no non-JS way, and don't add a UI framework
  integration (React etc.) for a single interactive element.
- The scripted pieces so far: the theme toggle, `FeatureSpotlight.astro`,
  and analytics (the consent banner and the small event scripts listed under
  Analytics below).
  The spotlight's tabs advance on their own, following the WAI-ARIA
  auto-rotating carousel pattern: a Pause / Play control, rotation stops when
  someone picks a tab or focuses inside it, and it never starts under
  `prefers-reduced-motion`. Without JavaScript its panels simply stack.
- The head script in `Base.astro` adds a `js` class to `<html>` before first
  paint, so a scripted component can lay out its JavaScript state from the
  start (`:global(.js)` in its CSS) and nothing shifts when it boots.

### Brand

- Colors come from the `--cb-*` custom properties in `src/styles/tokens.css`.
  Never hardcode a brand hex in a component.
- `tokens.css` and everything in `src/assets/brand/` are copies from ColdBoot's
  `assets/coldboot-assets/`. If the brand changes, re-copy from there; don't
  edit values in this repo.
- A few extra app colors the page needs (`--cb-separator`,
  `--cb-accent-container`, ...) live in `global.css`, light on `:root` and dark
  under `[data-theme='dark']`, each commented with the `LIGHT_COLORS` or
  `DARK_COLORS` role in ColdBoot's `src/theme/colors.ts` it comes from. Every
  color must work in both schemes.
- Fonts are Barlow Condensed (display), Barlow (body) and IBM Plex Mono
  (labels), configured under `fonts` in `astro.config.mjs` and emitted by the
  `<Font>` components in `Base.astro`. Astro downloads them at build time and
  serves them from our own domain, so builds need network access but
  visitors' browsers never contact a font CDN. Keep it that way.
- Light, Dark or System (the default), like the app's Settings → Appearance →
  Theme. The toggle is `ThemeToggle.astro` in the header; the inline script in
  `Base.astro` sets `data-theme` on `<html>` before first paint and stores only
  an explicit Light or Dark choice (`coldboot-theme` in localStorage). Without
  JavaScript the page stays on its `data-theme="dark"` default.
- Amber (`--cb-accent`) is the single signal color, as in the app: reserve it
  for the primary action.

### Content

- Marketing copy that is likely to change lives in `src/data/`, not in markup.
  `modules.ts` mirrors the app's `MODULES` and `*_TOOLS` in `constants.ts`;
  when the app's tool list changes, update it here.
- `spotlight.ts` holds the feature spotlight's copy and sample illustration
  data, with a note on each feature saying where in the app its claims were
  checked.
- Don't state a feature the app doesn't have. Check claims against the ColdBoot
  repo before writing them.

### Waitlist

- `/api/subscribe` answers every outcome with a 303 redirect to `/joined` or
  `/join-error`, so the form works without JavaScript.
- A duplicate signup must look exactly like a new one, so the form can't be
  used to check whether someone is on the list.
- Store only the address, time and source form. No IP addresses, user
  agents or other tracking data. Never log an email address.
- Keep validation in `src/lib/waitlist.ts` with tests in `test/`; the endpoint
  should stay a thin wrapper around it.
- Schema changes go in a new numbered file in `migrations/`; never edit one
  that has been applied.

### Analytics

Ported from alley-admin, which shares the stack; toastbyte.studio has the same
design in React. When the approach changes in one, check the others.

- Google Analytics 4 loads through **Cloudflare Zaraz**, configured in the
  Cloudflare dashboard for the coldboot.app zone, not in this repo. Zaraz
  injects its script into every HTML response and fires the page views itself,
  so there is no `page_view` event in code.
- Events are listed in `src/lib/analytics-events.ts` and fired only through
  `trackClientEvent` in `src/lib/analytics-client.ts`. Every event there must
  be fired from somewhere and listed in the privacy policy.
- **Consent is required by default.** `isAnalyticsConsentRequired()` is on
  unless the build sets `PUBLIC_ANALYTICS_REQUIRE_CONSENT=0`, the opposite of
  the siblings' opt-in flag, because builds here run in GitHub Actions with
  no .env (see `.env.example`). Nothing is sent until the visitor accepts.
- `ConsentBanner.astro` replaces Zaraz's stock modal; the footer's Cookie
  settings button reopens it. The choice lives in the `analytics-consent`
  cookie so the relay endpoint can read it. `CONSENT_EXEMPT_EVENTS` is empty
  and should stay that way.
- `/api/analytics/event` is a Measurement Protocol fallback for when Zaraz
  hasn't loaded. Its logic is in `src/lib/analytics-relay.ts` with tests in
  `test/analytics.test.ts`. It needs the `ANALYTICS_GA4_MEASUREMENT_ID` and
  `ANALYTICS_GA4_API_SECRET` Worker secrets (`.dev.vars.example`), and
  answers ok without sending anything until both are set.
- Never put an email address, or anything derived from one, in an event.
- To track another outbound link, give it `data-outbound="<destination>"` and
  add the destination to `ANALYTICS_OUTBOUND_DESTINATIONS` in
  `analytics-events.ts`. The relay rejects any param value it doesn't know.

### Search and discoverability

- The brand is **ColdBoot**, one word, everywhere (copy, alt text, metadata,
  sibling sites). "Cold boot" is a computing term that owns its own search
  results; only the one-word name is distinctive.
- `SITE.title` leads with the name and the main search phrase ("offline
  survival app") and stays under ~60 characters. `SITE.description` stays
  under ~155. Both are measured in comments in `src/data/site.ts`.
- The home `<h1>` starts with `SITE.headline`, the only heading that says in
  words what ColdBoot is; the slogan is the visual headline. Headings that
  wrap with `<br />` need an explicit `{' '}` before it, or crawlers read the
  words run together.
- Structured data is built in `src/lib/structured-data.ts` (tested in
  `test/structured-data.test.ts`) and passed to `Base` as `structuredData`.
  Never add `offers`, `aggregateRating` or `review` before they're real.
- `@astrojs/sitemap` writes `sitemap-index.xml`; noindex pages are excluded by
  `NOT_IN_SITEMAP` in `astro.config.mjs`. Add any new noindex page there.
  `public/robots.txt` points at the index.
- `/llms.txt` is generated by `src/pages/llms.txt.ts` from `src/data/`, so it
  only says what the site says. Add facts to the data, not the endpoint.
- Icons: after re-copying brand assets, run `node scripts/generate-icons.mjs`.
- Cloudflare's dashboard can prepend rules to robots.txt and block AI crawlers
  at the edge. Those settings override `public/robots.txt`.

### Privacy

- `src/pages/privacy.astro` must stay true of the code. Any PR that changes
  what the waitlist stores, adds cookies, analytics, a third-party script or
  anything else stored in the browser, or picks an email provider must update
  the policy and `PRIVACY.lastUpdated` in `src/data/site.ts` in the same PR.
- What joining the waitlist signs someone up for lives in `WAITLIST_PROMISE`
  in `src/data/site.ts`. The form note, `/joined` and the policy all read it;
  don't restate the promise in markup.
- Every waitlist form shows the note and a link to the policy, next to its
  submit button.

### Tests

- Tests use Node's built-in runner and native TypeScript stripping, so they
  need no extra dependencies. `test/` is excluded from `astro check` until
  `@types/node` is added as a devDependency.

### Code

- Import order is enforced (builtin → external → internal → parent → sibling →
  index, alphabetical within groups).
- Prettier: 80 columns, 2 spaces, single quotes, trailing commas, semicolons.
- Scoped `<style>` in each `.astro` component; site-wide rules only in
  `global.css`.
- Every interactive element must be keyboard reachable with a visible focus
  state; respect `prefers-reduced-motion`.

### Cloudflare

- After changing `wrangler.jsonc` (bindings, D1, vars), run `npm run cf:types`
  so `worker-configuration.d.ts` matches. That file is generated and gitignored.
- Secrets go in `wrangler secret put <NAME>` for production and `.dev.vars`
  locally. Never commit `.dev.vars`.
- The site is served at `coldboot.app` through a custom-domain route in
  `wrangler.jsonc`. Don't add `www.coldboot.app` as a route: it's redirected to
  the apex by a Cloudflare Redirect Rule so there's one canonical host.
- There is exactly one D1 binding, `DB`. `wrangler d1 create` offers to add a
  second binding under another name; decline it.

---

## What NOT to Do

- Do not edit brand tokens or logo SVGs here; change them in ColdBoot and copy.
- Do not add Tailwind or another CSS framework without discussing it first.
- Do not turn the whole site into server-rendered output to support one form.
- Do not store anything about waitlist signups beyond what the privacy policy
  says we store.

---

## Astro documentation

Full docs: <https://docs.astro.build>. Consult the relevant guide before working
on routing, components, content collections, styling or i18n.
