import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FAQ, FAQ_PAGE, launchWhen } from '../src/data/faq.ts';
import { buildFaqStructuredData } from '../src/lib/structured-data.ts';

describe('FAQ', () => {
  it('has unique ids that work as URL fragments', () => {
    const ids = FAQ.map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^[a-z][a-z-]*$/);
  });

  it('asks questions and answers them in plain text', () => {
    for (const e of FAQ) {
      assert.match(e.question, /\?$/, e.id);
      assert.ok(e.answer.length > 0, e.id);
      for (const p of e.answer) assert.doesNotMatch(p, /<[a-z]/i, e.id);
    }
  });

  it('spells the brand as one word', () => {
    for (const e of FAQ) {
      const text = [e.question, ...e.answer].join(' ');
      assert.doesNotMatch(text, /Cold Boot|Coldboot/, e.id);
    }
  });

  it('fits search-result limits', () => {
    assert.ok(FAQ_PAGE.title.length <= 60, `${FAQ_PAGE.title.length}`);
    assert.ok(FAQ_PAGE.description.length <= 155);
  });

  it('reads the launch window from the label', () => {
    assert.equal(launchWhen('Launching early 2027'), 'early 2027');
    assert.throws(() => launchWhen('Early 2027'), /should start/);
  });
});

describe('buildFaqStructuredData', () => {
  const data = buildFaqStructuredData({
    site: new URL('https://coldboot.app'),
    siteName: 'ColdBoot',
    path: FAQ_PAGE.path,
    name: FAQ_PAGE.name,
    description: FAQ_PAGE.description,
    studioUrl: 'https://toastbyte.studio/',
    entries: FAQ,
  });
  const [page, crumbs] = data['@graph'];

  it('is an FAQPage about the app, joined to the site graph', () => {
    assert.equal(page['@type'], 'FAQPage');
    assert.equal(page['@id'], 'https://coldboot.app/faq#webpage');
    assert.deepEqual(page.about, { '@id': 'https://coldboot.app/#app' });
    assert.ok(!('mentions' in page));
    assert.equal(crumbs['@type'], 'BreadcrumbList');
  });

  it('marks up exactly the questions and answers the page shows', () => {
    assert.deepEqual(
      page.mainEntity.map((q) => [q.name, q.acceptedAnswer.text]),
      FAQ.map((e) => [e.question, e.answer.join('\n\n')]),
    );
  });
});
