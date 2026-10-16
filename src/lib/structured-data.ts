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

export interface GuideStructuredDataInput {
  site: URL;
  siteName: string;
  /** Public path of the guide, e.g. /morse-code */
  path: string;
  /** Short name, also the last breadcrumb. */
  name: string;
  description: string;
  studioUrl: string;
}

/**
 * A reference guide page: a WebPage that belongs to the ColdBoot WebSite,
 * plus a BreadcrumbList (Home › Guide), which Google can show in place of
 * the raw URL. The @ids match buildHomeStructuredData's, so the graphs join
 * up across pages.
 */
export function buildGuideStructuredData(input: GuideStructuredDataInput) {
  const home = new URL('/', input.site).href;
  const url = new URL(input.path, input.site).href;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: input.name,
        description: input.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${home}#website` },
        // The page is about its topic; it mentions the app that carries it.
        mentions: { '@id': `${home}#app` },
        publisher: { '@id': new URL('#organization', input.studioUrl).href },
        breadcrumb: { '@id': `${url}#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: input.siteName,
            item: home,
          },
          { '@type': 'ListItem', position: 2, name: input.name, item: url },
        ],
      },
    ],
  };
}

export interface FaqStructuredDataInput extends GuideStructuredDataInput {
  entries: readonly { question: string; answer: readonly string[] }[];
}

/**
 * /faq: an FAQPage (a kind of WebPage) whose Questions are the page's own
 * text, plus the same breadcrumb as a guide.
 *
 * Google stopped showing FAQ rich results on 7 May 2026, so this earns no
 * special listing there. It's kept because it's accurate, costs nothing, and
 * other search engines and AI assistants still read question-and-answer
 * markup. Unlike a guide, the page is about the app itself.
 */
export function buildFaqStructuredData(input: FaqStructuredDataInput) {
  const base = buildGuideStructuredData(input);
  const [page, crumbs] = base['@graph'];
  const home = new URL('/', input.site).href;
  // A guide mentions the app; the FAQ is about it.
  const rest: Omit<typeof page, 'mentions'> & { mentions?: unknown } = {
    ...page,
  };
  delete rest.mentions;

  return {
    ...base,
    '@graph': [
      {
        ...rest,
        '@type': 'FAQPage',
        about: { '@id': `${home}#app` },
        mainEntity: input.entries.map((e) => ({
          '@type': 'Question',
          name: e.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: e.answer.join('\n\n'),
          },
        })),
      },
      crumbs,
    ],
  };
}
