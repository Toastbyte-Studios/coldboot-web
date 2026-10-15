/**
 * schema.org structured data (JSON-LD) for the home page. Pure functions, so
 * the graph is unit tested without a build.
 *
 * Three linked nodes:
 *
 * - WebSite: `name` is what Google shows as the site name in results. With
 *   "cold boot" a common computing term, telling Google the site is called
 *   "ColdBoot" is the main point of this file.
 * - Organization: Toastbyte Studios, who make it.
 * - MobileApplication: what ColdBoot is, for which platforms, with its tools.
 *
 * Deliberately absent until they're true: `offers` (no price yet),
 * `aggregateRating` and `review` (no real ratings yet; never invent them),
 * `datePublished` and download links. Google needs offers plus ratings for an
 * app rich result, so this won't produce one before launch. It still tells
 * search engines and AI tools what the site is and who is behind it.
 */
export interface StructuredDataInput {
  /** The site's origin, e.g. https://coldboot.app/ */
  site: URL;
  name: string;
  description: string;
  /** Absolute URL of the share image. */
  image: URL;
  studio: { name: string; legalName: string; url: string };
  contactEmail: string;
  /** Tool names across all modules, in display order. */
  features: readonly string[];
  /** Other profiles that are the studio, e.g. its GitHub organisation. */
  studioSameAs: readonly string[];
}

export function buildHomeStructuredData(input: StructuredDataInput) {
  const home = new URL('/', input.site).href;
  const orgId = new URL('#organization', input.studio.url).href;
  const websiteId = `${home}#website`;
  const appId = `${home}#app`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: input.studio.name,
        legalName: input.studio.legalName,
        url: input.studio.url,
        email: input.contactEmail,
        sameAs: [...input.studioSameAs],
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: home,
        name: input.name,
        // Ways people might write it. Helps Google settle on "ColdBoot" as
        // the site name rather than the domain.
        alternateName: [`${input.name} app`, new URL(home).hostname],
        inLanguage: 'en',
        publisher: { '@id': orgId },
      },
      {
        '@type': 'MobileApplication',
        '@id': appId,
        name: input.name,
        description: input.description,
        url: home,
        image: input.image.href,
        operatingSystem: 'iOS, Android',
        applicationCategory: 'UtilitiesApplication',
        applicationSubCategory: 'Outdoor and emergency preparedness',
        featureList: [...input.features],
        author: { '@id': orgId },
        publisher: { '@id': orgId },
        mainEntityOfPage: { '@id': websiteId },
      },
    ],
  };
}

/**
 * Serialises for a `<script type="application/ld+json">` body. JSON is
 * already valid there except for `<`, which could close the script element
 * early if any copy ever contained "</script>", so it's escaped.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
