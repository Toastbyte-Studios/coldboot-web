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

### First deploy

Do this once, and not before the privacy policy page (`/privacy`) exists:

1. `npx wrangler login`
2. `npx wrangler d1 create coldboot-waitlist`, then add the `database_id` it
   prints to the `d1_databases` entry in `wrangler.jsonc`.
3. `npm run db:migrate:remote` to create the table in production.
4. `npm run deploy`.

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

CI runs typecheck, lint, the Prettier check and a build on every pull request,
and requires the `package.json` version to be bumped.

## Brand assets

`src/styles/tokens.css` and the SVGs in `src/assets/brand/` are copied from
ColdBoot's `assets/coldboot-assets/`, which is the source of truth. Re-copy
them from there when the brand changes.
