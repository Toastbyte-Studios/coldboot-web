// Renders the PNG app icons in public/ from the brand icon:
//
//   apple-touch-icon.png  180×180  iOS home screen and share sheets
//   icon-192.png          192×192  web app manifest
//   icon-512.png          512×512  web app manifest, Organization logo
//
// Source is src/assets/brand/icon-dark.svg (the dark tile, as in og.png and
// the no-JavaScript default theme), rendered full bleed: the tile's rounded
// corners are squared off, because iOS and Android apply their own mask and
// a pre-rounded icon would show dark corners.
//
// Run after re-copying the brand assets from ColdBoot:
//   node scripts/generate-icons.mjs
//
// sharp comes in with Astro's image service, so there's nothing to install.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('..', import.meta.url);
const source = new URL('src/assets/brand/icon-dark.svg', root);

const svg = (await readFile(source, 'utf8'))
  // Provenance metadata isn't needed to rasterise and can trip up renderers.
  .replace(/<metadata>[\s\S]*?<\/metadata>/, '')
  .replaceAll('rx="26.5"', 'rx="0"');

if (svg.includes('rx="26.5"') || !svg.includes('rx="0"')) {
  throw new Error('icon-dark.svg changed shape; update generate-icons.mjs');
}

const OUTPUTS = [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

for (const [name, size] of OUTPUTS) {
  const out = fileURLToPath(new URL(`public/${name}`, root));
  // Rasterise at the target size rather than scaling a small bitmap up.
  await sharp(Buffer.from(svg), { density: (72 * size) / 120 })
    .resize(size, size)
    .flatten({ background: '#1B2F42' })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote public/${name}`);
}
