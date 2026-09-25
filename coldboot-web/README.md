# coldboot-web

The marketing site for [ColdBoot](https://github.com/Toastbyte-Studios/ColdBoot),
served at <https://coldboot.app>. Before launch it is a single prelaunch page
that collects waitlist emails.

Built by [Toastbyte Studios](https://toastbyte.studio/).

## Getting started

Requires Node.js 22.12 or later (see `.nvmrc`).

```sh
npm install
npm run dev
```

The dev server runs at <http://localhost:4321>.

## Scripts

| Command                | What it does                                     |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start the Astro dev server                       |
| `npm run build`        | Build the site into `dist/`                      |
| `npm run preview`      | Build, then serve locally in the Workers runtime |
| `npm run typecheck`    | Generate Worker types and run `astro check`      |
| `npm run lint`         | Run ESLint                                       |
| `npm run format`       | Format with Prettier                             |
| `npm run format:check` | Check formatting without writing                 |
| `npm run cleanup`      | Format, lint, typecheck and build in one pass    |
| `npm run deploy`       | Build and deploy to Cloudflare with Wrangler     |

CI runs typecheck, lint, the Prettier check and a build on every pull request,
and requires the `package.json` version to be bumped.

## Brand assets

`src/styles/tokens.css` and the SVGs in `src/assets/brand/` are copied from
ColdBoot's `assets/coldboot-assets/`, which is the source of truth. Re-copy
them from there when the brand changes.
