/**
 * Reference guides: standalone pages for things people search for that
 * ColdBoot also carries offline (Morse code, the NATO alphabet, ...).
 *
 * This list drives the footer links, /llms.txt and each guide's structured
 * data, so adding a guide is: write its page in src/pages/, then add it here.
 * Every claim a guide makes about the app must be checked against the
 * ColdBoot repo first, as for the rest of the site.
 */
export interface Guide {
  /** Public path, no trailing slash. Also the page's file name. */
  path: `/${string}`;
  /** Short name for links and breadcrumbs. */
  name: string;
  /**
   * The <title>. Leads with the search phrase, ends with "| ColdBoot".
   * Under ~60 characters.
   */
  title: string;
  /** Meta description, under ~155 characters. */
  description: string;
  /** The ColdBoot tool the guide is about, for the page's app section. */
  tool: string;
}

export const GUIDES: readonly Guide[] = [
  {
    path: '/morse-code',
    name: 'Morse code chart',
    title: 'Morse Code Chart: Letters, Numbers and SOS | ColdBoot',
    description:
      'International Morse code for A–Z and 0–9, with how each code sounds, ' +
      'SOS and the timing rules. Printable, and offline in the ColdBoot app.',
    tool: 'Morse Code',
  },
];

export function findGuide(path: string): Guide {
  const guide = GUIDES.find((g) => g.path === path);
  if (!guide) {
    throw new Error(`No guide registered for ${path} in src/data/guides.ts`);
  }
  return guide;
}
