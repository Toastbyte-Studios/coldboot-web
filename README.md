# coldboot-web

The marketing site for [ColdBoot](https://github.com/Toastbyte-Studios/ColdBoot),
served at <https://coldboot.app>. Before launch it is a single prelaunch page
that collects waitlist emails.

Built by [Toastbyte Studios](https://toastbyte.studio/).

## Getting started

Requires Node.js 22.18 or later (see `.nvmrc`).

```sh
npm install
npm run dev
```

The dev server runs at <http://localhost:4321>.

## The waitlist

The forms post to `/api/subscribe`, which runs on the Worker and writes to a
Cloudflare D1 database bound as `DB`. It stores the address, the time, and
which form it came from; nothing else. The schema lives in `migrations/`.

To try the whole flow locally:

```sh
npm run db:migrate:local   # create the table in a local SQLite file
npm run preview            # build, then serve in the Workers runtime
```

Then submit the form at <http://localhost:8787>.

### Deploying

Merging to `main` deploys automatically (`.github/workflows/deploy.yml`): it
builds, applies any new D1 migrations, then runs `wrangler deploy`. You can
also redeploy `main` from the Actions tab (Deploy to Cloudflare → Run
workflow). `npm run deploy` still works from a laptop for emergencies.

The workflow needs two repository secrets (Settings → Secrets and variables →
Actions). If they're already defined as organization secrets shared with this
repo, there's nothing to add.

- `CLOUDFLARE_ACCOUNT_ID`: shown on the right of any zone's overview page in
  the Cloudflare dashboard.
- `CLOUDFLARE_API_TOKEN`: create one under My Profile → API Tokens, starting
  from the **Edit Cloudflare Workers** template. Add the permission
  **Account → D1 → Edit** (for migrations), and make sure the zone resources
  include `coldboot.app` (for the custom domain).

### First-time setup

Already done for production; kept for reference and for new environments:

1. `npx wrangler login`
2. `npx wrangler d1 create coldboot-waitlist`, then add the `database_id` it
   prints to the existing `DB` entry in `wrangler.jsonc`. If Wrangler offers
   to add a binding to the config for you, decline: it adds a second binding
   under a different name, and the site only reads `DB`.
3. `npm run db:migrate:remote` to create the table.
4. `npm run deploy`. Because `wrangler.jsonc` routes `coldboot.app` as a
   custom domain, this also creates its DNS record and TLS certificate. If it
   fails saying the hostname already has DNS records, delete any A, AAAA or
   CNAME record on the apex in the Cloudflare dashboard and deploy again.

### Redirecting www

`www.coldboot.app` isn't attached to the Worker, so it doesn't serve a
duplicate copy of the site. To send it to the apex, in the Cloudflare
dashboard for the `coldboot.app` zone:

1. DNS: add an `AAAA` record for `www` pointing to `100::`, proxied (orange
   cloud). The address is a placeholder; the redirect below answers first.
2. Rules → Redirect Rules: use the "Redirect from WWW to root" template, or
   match hostname `www.coldboot.app` and redirect with a 301 to
   `https://coldboot.app` with the path and query string preserved.

## Scripts

| Command                     | What it does                                        |
| --------------------------- | --------------------------------------------------- |
| `npm run dev`               | Start the Astro dev server                          |
| `npm run build`             | Build the site into `dist/`                         |
| `npm run preview`           | Build, then serve locally in the Workers runtime    |
| `npm run typecheck`         | Generate Worker types and run `astro check`         |
| `npm run lint`              | Run ESLint                                          |
| `npm run format`            | Format with Prettier                                |
| `npm run format:check`      | Check formatting without writing                    |
| `npm test`                  | Run unit tests (Node's built-in test runner)        |
| `npm run db:migrate:local`  | Apply D1 migrations to the local database           |
| `npm run db:migrate:remote` | Apply D1 migrations to production                   |
| `npm run cleanup`           | Format, lint, typecheck, test and build in one pass |
| `npm run deploy`            | Build and deploy to Cloudflare with Wrangler        |

## GitHub Actions

| Workflow                   | Runs on        | What it does                                              |
| -------------------------- | -------------- | --------------------------------------------------------- |
| `ci.yml`                   | Pull requests  | Typecheck, lint, Prettier check, tests, build             |
| `require-version-bump.yml` | Pull requests  | Fails if `package.json`'s version matches `main`          |
| `deploy.yml`               | Push to `main` | Build, apply D1 migrations, deploy to Cloudflare          |
| `tag-and-release.yml`      | Push to `main` | Tags `v<version>` and creates a GitHub release with notes |

Tagging and release are skipped if the tag already exists, so a merge that
somehow skipped the version bump doesn't fail; it just doesn't release.

## Brand assets

`src/styles/tokens.css` and the SVGs in `src/assets/brand/` are copied from
ColdBoot's `assets/coldboot-assets/`, which is the source of truth. Re-copy
them from there when the brand changes.
