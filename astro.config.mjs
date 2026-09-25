// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://coldboot.app',
  // Pages are prerendered to static HTML by default. Anything that has to run
  // per request (the waitlist endpoint) opts out with `export const prerender
  // = false` and runs on the Worker.
  output: 'static',
  adapter: cloudflare({
    // Optimise images once at build time rather than through the Cloudflare
    // Images binding on every request. The site has a handful of static
    // images; per-request transforms would be cost with no benefit.
    imageService: 'compile',
  }),
  // The adapter enables Astro sessions backed by a KV namespace unless told
  // otherwise. Nothing here needs server-side sessions, so don't provision a
  // KV namespace that nothing reads.
  session: false,
  // Fonts are downloaded from Google at build time and served from our own
  // domain, so visitors' browsers never contact Google. Astro also generates
  // metric-matched fallbacks to limit layout shift while they load.
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Barlow Condensed',
      cssVariable: '--font-display',
      weights: [600, 700],
      subsets: ['latin'],
      fallbacks: ['Arial Narrow', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Barlow',
      cssVariable: '--font-body',
      weights: [400, 500, 600],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      weights: [400, 500],
      subsets: ['latin'],
      fallbacks: ['ui-monospace', 'monospace'],
    },
  ],
});
