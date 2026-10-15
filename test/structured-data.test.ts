import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { MODULES } from '../src/data/modules.ts';
import { SITE } from '../src/data/site.ts';
import {
  buildHomeStructuredData,
  serializeJsonLd,
} from '../src/lib/structured-data.ts';

const site = new URL('https://coldboot.app');

function build() {
  return buildHomeStructuredData({
    site,
    name: SITE.name,
    description: SITE.description,
    image: new URL(SITE.shareImage.path, site),
    studio: SITE.studio,
    contactEmail: SITE.contactEmail,
    features: MODULES.flatMap((m) => m.tools),
    studioSameAs: [SITE.studio.github],
  });
}

function node(type: string) {
  const found = build()['@graph'].find((n) => n['@type'] === type);
  assert.ok(found, `missing ${type}`);
  return found as Record<string, unknown>;
}

describe('buildHomeStructuredData', () => {
  it('names the site ColdBoot, as one word', () => {
    const website = node('WebSite');
    assert.equal(website.name, 'ColdBoot');
    assert.equal(website.url, 'https://coldboot.app/');
  });

  it('describes the app for both platforms with every tool', () => {
    const app = node('MobileApplication');
    assert.equal(app.operatingSystem, 'iOS, Android');
    assert.equal(app.description, SITE.description);
    assert.equal(app.image, 'https://coldboot.app/og.png');
    assert.deepEqual(
      app.featureList,
      MODULES.flatMap((m) => m.tools),
    );
  });

  it('links every node to the one Organization', () => {
    const orgId = node('Organization')['@id'];
    assert.equal(orgId, 'https://toastbyte.studio/#organization');
    assert.deepEqual(node('WebSite').publisher, { '@id': orgId });
    assert.deepEqual(node('MobileApplication').publisher, { '@id': orgId });
    assert.deepEqual(node('MobileApplication').author, { '@id': orgId });
  });

  it('claims no price, ratings or reviews before there are any', () => {
    const app = node('MobileApplication');
    for (const key of ['offers', 'aggregateRating', 'review']) {
      assert.equal(key in app, false, key);
    }
  });
});

describe('serializeJsonLd', () => {
  it('escapes < so copy can never close the script element', () => {
    const out = serializeJsonLd({ text: '</script><b>' });
    assert.equal(out.includes('<'), false);
    assert.deepEqual(JSON.parse(out), { text: '</script><b>' });
  });
});
