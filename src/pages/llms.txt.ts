/**
 * /llms.txt: a plain-text summary of ColdBoot for AI assistants and the
 * crawlers behind AI search (see llmstxt.org).
 *
 * Generated at build time from the same data the home page renders, so it
 * can't say anything the site doesn't: the claims in src/data/ have already
 * been checked against the app. Add facts there, not here.
 */
import { MODULES } from '../data/modules';
import { READOUTS, SITE, WAITLIST_PROMISE } from '../data/site';
import { SPOTLIGHT_FEATURES } from '../data/spotlight';
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const home = new URL('/', site).href;
  const link = (path: string) => new URL(path, site).href;

  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${SITE.description}`,
    '',
    `${SITE.name} (one word) is made by ${SITE.studio.name}. It isn't ` +
      `released yet (${SITE.launchLabel}, ${SITE.platforms}); the website ` +
      `at ${home} collects waitlist signups.`,
    '',
    '## At a glance',
    '',
    ...READOUTS.map((r) => `- ${r.label}: ${r.value}`),
    '',
    '## Modules and tools',
    '',
    ...MODULES.map(
      (m) => `- **${m.name}**: ${m.blurb} Tools: ${m.tools.join(', ')}.`,
    ),
    '',
    '## Highlights',
    '',
    ...SPOTLIGHT_FEATURES.map((f) => `- **${f.heading}** ${f.body}`),
    '',
    '## Waitlist',
    '',
    `${WAITLIST_PROMISE.full} Join at ${link('/#waitlist')}.`,
    '',
    '## Links',
    '',
    `- [${SITE.name}](${home}): home page and waitlist`,
    `- [Privacy policy](${link('/privacy')}): what the website collects`,
    `- [${SITE.studio.name}](${SITE.studio.url}): the studio behind ${SITE.name}`,
    `- Contact: ${SITE.contactEmail}`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
