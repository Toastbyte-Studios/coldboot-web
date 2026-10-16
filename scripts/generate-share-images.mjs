// Renders a link-preview card (og:image, 1200×630) for each reference guide:
//
//   public/og/<guide path>.png    e.g. public/og/morse-code.png
//
// Each card carries the lockup, "Field reference", the guide's name and a
// sample of the guide's own data (SOS in Morse, the first NATO code words,
// the ICAO symbols, the calling frequencies), so a shared link shows what the
// page is rather than the generic home card.
//
// Layout is rendered by satori with the brand fonts from @fontsource (the
// same Barlow Condensed, Barlow and IBM Plex Mono the site serves), which
// turns text into outlines, so the result doesn't depend on the fonts
// installed on whatever machine runs this. sharp then rasterises the SVG.
// Colors are read from the dark scheme in tokens.css and global.css, so the
// cards follow the brand if it's re-copied.
//
// Run after adding a guide or changing what a card shows, and commit the PNGs:
//   node scripts/generate-share-images.mjs
//
// test/share-images.test.ts fails if a guide has no card.
import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import sharp from 'sharp';
import { ICAO_SIGNALS } from '../src/data/ground-signals.ts';
import { GUIDES } from '../src/data/guides.ts';
import { MORSE_CODE } from '../src/data/morse.ts';
import { NATO_ALPHABET } from '../src/data/nato.ts';
import { RADIO_SERVICES } from '../src/data/radio.ts';

const root = new URL('..', import.meta.url);
const require = createRequire(import.meta.url);
const WIDTH = 1200;
const HEIGHT = 630;

// --- Brand ----------------------------------------------------------------

/** The `--cb-*` values in a CSS file's `[data-theme='dark']` block. */
async function darkTokens(file) {
  const css = await readFile(new URL(file, root), 'utf8');
  const block = css.match(/\[data-theme='dark'\]\s*{([^}]*)}/)?.[1] ?? '';
  const light = css.match(/:root\s*{([^}]*)}/)?.[1] ?? '';
  const read = (text) =>
    Object.fromEntries(
      [...text.matchAll(/--(cb-[a-z-]+):\s*([^;]+);/g)].map((m) => [
        m[1],
        m[2].trim(),
      ]),
    );
  // Dark overrides on top of the shared :root values (ice, steel, ...).
  return { ...read(light), ...read(block) };
}

const T = {
  ...(await darkTokens('src/styles/tokens.css')),
  ...(await darkTokens('src/styles/global.css')),
};
for (const name of [
  'cb-bg',
  'cb-surface',
  'cb-border',
  'cb-ice',
  'cb-steel-pale',
  'cb-muted',
  'cb-accent',
  'cb-separator',
  'cb-secondary-container',
  'cb-on-secondary-container',
]) {
  if (!/^#[0-9a-f]{6}$/i.test(T[name] ?? '')) {
    throw new Error(`--${name} is missing or not a hex color in the CSS`);
  }
}

const font = (pkg, file) =>
  readFile(require.resolve(`@fontsource/${pkg}/files/${file}`));

const FONTS = [
  {
    name: 'Barlow Condensed',
    weight: 700,
    data: await font(
      'barlow-condensed',
      'barlow-condensed-latin-700-normal.woff',
    ),
  },
  {
    name: 'Barlow Condensed',
    weight: 600,
    data: await font(
      'barlow-condensed',
      'barlow-condensed-latin-600-normal.woff',
    ),
  },
  {
    name: 'Barlow',
    weight: 500,
    data: await font('barlow', 'barlow-latin-500-normal.woff'),
  },
  {
    name: 'IBM Plex Mono',
    weight: 500,
    data: await font('ibm-plex-mono', 'ibm-plex-mono-latin-500-normal.woff'),
  },
];

const icon = `data:image/svg+xml;base64,${Buffer.from(
  (await readFile(new URL('src/assets/brand/icon-dark.svg', root), 'utf8'))
    // Provenance metadata isn't needed to rasterise and can trip up renderers.
    .replace(/<metadata>[\s\S]*?<\/metadata>/, ''),
).toString('base64')}`;

// --- A tiny element helper (satori takes React-shaped objects) ------------

function h(type, style, ...children) {
  const flat = children.flat().filter((c) => c !== null && c !== false);
  return {
    type,
    props: {
      style: { display: 'flex', ...style },
      children: flat.length === 1 ? flat[0] : flat,
    },
  };
}

const img = (src, style) => ({ type: 'img', props: { src, style } });

const mono = (size, color, extra = {}) => ({
  fontFamily: 'IBM Plex Mono',
  fontWeight: 500,
  fontSize: size,
  letterSpacing: size * 0.18,
  color,
  ...extra,
});

const display = (size, color, weight = 700) => ({
  fontFamily: 'Barlow Condensed',
  fontWeight: weight,
  fontSize: size,
  lineHeight: 0.92,
  color,
});

// The webfont subsets don't carry → or △, so the arrow is drawn, as on the
// page (GroundSymbol.astro).
const arrow = (size, color) =>
  img(
    `data:image/svg+xml;base64,${Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><path d="M4 35H88M60 8l29 27-29 27" fill="none" stroke="${color}" stroke-width="11"/></svg>`,
    ).toString('base64')}`,
    { width: size, height: size * 0.7 },
  );

// --- Each guide's sample --------------------------------------------------

function panelRow(left, right, last = false) {
  return h(
    'div',
    {
      alignItems: 'center',
      gap: 28,
      padding: '22px 30px',
      borderBottom: last ? 'none' : `2px solid ${T['cb-separator']}`,
    },
    left,
    right,
  );
}

function morseSample() {
  const code = (ch) => MORSE_CODE.find((c) => c.char === ch).morse;
  const sym = (s) =>
    h('div', {
      width: s === '.' ? 22 : 66,
      height: 22,
      borderRadius: 11,
      background: T['cb-steel-pale'],
    });
  const rows = ['S', 'O', 'S'];
  return rows.map((ch, i) =>
    panelRow(
      h('div', { ...display(64, T['cb-ice']), width: 48 }, ch),
      h('div', { gap: 16, alignItems: 'center' }, [...code(ch)].map(sym)),
      i === rows.length - 1,
    ),
  );
}

function natoSample() {
  const rows = NATO_ALPHABET.slice(0, 3);
  return rows.map((l, i) =>
    panelRow(
      h('div', { ...display(64, T['cb-ice']), width: 48 }, l.letter),
      h('div', display(56, T['cb-steel-pale'], 600), l.word),
      i === rows.length - 1,
    ),
  );
}

function groundSample() {
  const tile = (s) =>
    h(
      'div',
      {
        width: 112,
        height: 112,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        background: T['cb-secondary-container'],
        ...display(84, T['cb-on-secondary-container']),
      },
      s.symbol === '→' ? arrow(72, T['cb-on-secondary-container']) : s.symbol,
    );
  const [a, b, c, d, e] = ICAO_SIGNALS;
  return [
    h('div', { gap: 14, padding: '30px 30px 7px' }, [a, b, c].map(tile)),
    h('div', { gap: 14, padding: '7px 30px 30px' }, [d, e].map(tile)),
  ];
}

function radioSample() {
  const find = (id, name) =>
    RADIO_SERVICES.find((s) => s.id === id).channels.find(
      (c) => c.name === name,
    ).frequency;
  const rows = [
    ['CB 9', find('CB', 'Channel 9')],
    ['GMRS 20', find('GMRS', 'Channel 20 / 20R')],
    ['2 M', find('HAM', '2m FM Simplex Calling')],
  ];
  return rows.map(([label, freq], i) =>
    panelRow(
      h('div', { ...mono(20, T['cb-muted']), width: 130 }, label),
      h(
        'div',
        { alignItems: 'baseline', gap: 10 },
        h('div', display(60, T['cb-steel-pale']), freq.replace(' MHz', '')),
        h('div', mono(16, T['cb-muted'], { letterSpacing: 1 }), 'MHz'),
      ),
      i === rows.length - 1,
    ),
  );
}

/**
 * Where a title should break, when wrapping would split it badly
 * ("GROUND-TO-" / "AIR SIGNALS").
 */
const TITLE_LINES = {
  '/ground-to-air-signals': ['Ground-to-air', 'signals'],
};

const SAMPLES = {
  '/morse-code': morseSample,
  '/nato-phonetic-alphabet': natoSample,
  '/ground-to-air-signals': groundSample,
  '/emergency-radio-frequencies': radioSample,
};

// --- The card -------------------------------------------------------------

/** Contour rings behind the panel, as on the home card (public/og.png). */
function rings() {
  return [260, 400, 540, 680].map((r) =>
    h('div', {
      position: 'absolute',
      left: 900 - r,
      top: 300 - r,
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      border: `2px solid ${T['cb-surface']}`,
    }),
  );
}

function card(guide) {
  const sample = SAMPLES[guide.path];
  if (!sample) {
    throw new Error(`No share-card sample for ${guide.path}; add one above.`);
  }
  const lines = TITLE_LINES[guide.path] ?? [guide.name];
  // Longer names take a smaller size so they stay inside the left column.
  const titleSize =
    guide.name.split(' ').length > 2 || lines.some((l) => l.length > 12)
      ? 92
      : 112;

  return h(
    'div',
    {
      position: 'relative',
      width: WIDTH,
      height: HEIGHT,
      background: T['cb-bg'],
      overflow: 'hidden',
    },
    rings(),
    h(
      'div',
      {
        position: 'absolute',
        left: 80,
        top: 72,
        bottom: 64,
        width: 560,
        flexDirection: 'column',
        justifyContent: 'space-between',
      },
      h(
        'div',
        { alignItems: 'center', gap: 16 },
        img(icon, { width: 52, height: 52, borderRadius: 12 }),
        h(
          'div',
          { flexDirection: 'column', gap: 2 },
          h('div', display(34, T['cb-ice']), 'COLDBOOT'),
          h('div', mono(11, T['cb-steel-pale']), 'OFFLINE SURVIVAL'),
        ),
      ),
      h(
        'div',
        { flexDirection: 'column', gap: 26 },
        h(
          'div',
          { alignItems: 'center', gap: 14 },
          h('div', {
            width: 12,
            height: 12,
            borderRadius: 6,
            background: T['cb-accent'],
          }),
          h('div', mono(20, T['cb-steel-pale']), 'FIELD REFERENCE'),
        ),
        h(
          'div',
          { flexDirection: 'column' },
          lines.map((line) =>
            h(
              'div',
              { ...display(titleSize, T['cb-ice']), flexWrap: 'wrap' },
              line.toUpperCase(),
            ),
          ),
        ),
      ),
      h(
        'div',
        mono(22, T['cb-steel-pale'], { letterSpacing: 1 }),
        'coldboot.app',
      ),
    ),
    h(
      'div',
      {
        position: 'absolute',
        right: 72,
        top: 0,
        bottom: 0,
        alignItems: 'center',
      },
      h(
        'div',
        {
          width: 440,
          flexDirection: 'column',
          borderRadius: 28,
          border: `2px solid ${T['cb-border']}`,
          background: T['cb-surface'],
        },
        sample(),
      ),
    ),
  );
}

await mkdir(new URL('public/og/', root), { recursive: true });

for (const guide of GUIDES) {
  const svg = await satori(card(guide), {
    width: WIDTH,
    height: HEIGHT,
    fonts: FONTS,
  });
  const name = `og${guide.path}.png`;
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(new URL(`public/${name}`, root)));
  console.log(`wrote public/${name}`);
}
