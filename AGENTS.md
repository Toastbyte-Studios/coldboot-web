# coldboot-web — agent instructions

Marketing site for ColdBoot at <https://coldboot.app>. Right now it is a
prelaunch page that collects waitlist emails. The app itself lives in
[Toastbyte-Studios/ColdBoot](https://github.com/Toastbyte-Studios/ColdBoot).

`CLAUDE.md` is a symlink to this file, so Claude Code and other agents read the
same instructions. Edit this file, not the link.

Unlike the app, this site **does** talk to the network: the waitlist form posts
to a server endpoint. The app's "no network requests" rule does not apply here.

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
  data/           # Copy and content as typed data (modules.ts, site.ts)
  layouts/        # Base.astro (<head>, meta, fonts, CSS); Notice.astro (result pages)
  lib/            # Pure logic, unit tested (waitlist.ts: parsing, validation)
  pages/          # Routes; files here become URLs
    api/          # Worker endpoints (subscribe.ts)
  styles/
    tokens.css    # ColdBoot brand tokens, copied from ColdBoot (do not edit here)
    global.css    # Site-level tokens, resets and shared utilities
migrations/       # D1 schema, applied in order by wrangler
test/             # node:test unit tests for src/lib
public/           # Served as-is (favicon)
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

### Brand

- Colors come from the `--cb-*` custom properties in `src/styles/tokens.css`.
  Never hardcode a brand hex in a component.
- `tokens.css` and everything in `src/assets/brand/` are copies from ColdBoot's
  `assets/coldboot-assets/`. If the brand changes, re-copy from there; don't
  edit values in this repo.
- A few extra app colors the page needs (`--cb-separator`,
  `--cb-accent-container`, ...) live in `global.css`, each commented with the
  `DARK_COLORS` role in ColdBoot's `src/theme/colors.ts` it comes from.
- Fonts are Barlow Condensed (display), Barlow (body) and IBM Plex Mono
  (labels), configured under `fonts` in `astro.config.mjs` and emitted by the
  `<Font>` components in `Base.astro`. Astro downloads them at build time and
  serves them from our own domain, so builds need network access but
  visitors' browsers never contact a font CDN. Keep it that way.
- The page uses the dark scheme (`data-theme="dark"` on `<html>`).
- Amber (`--cb-accent`) is the single signal color, as in the app: reserve it
  for the primary action.

### Content

- Marketing copy that is likely to change lives in `src/data/`, not in markup.
  `modules.ts` mirrors the app's `MODULES` and `*_TOOLS` in `constants.ts`;
  when the app's tool list changes, update it here.
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

### Privacy

- `src/pages/privacy.astro` must stay true of the code. Any PR that changes
  what the waitlist stores, adds cookies, analytics or a third-party script,
  or picks an email provider must update the policy and `PRIVACY.lastUpdated`
  in `src/data/site.ts` in the same PR.
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
