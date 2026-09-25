// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

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
});
