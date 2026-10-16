import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { GUIDES, shareImagePath } from '../src/data/guides.ts';

/** Width and height from a PNG's IHDR chunk. */
function pngSize(bytes: Buffer) {
  assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

describe('guide share images', () => {
  for (const guide of GUIDES) {
    it(`${guide.path} has a 1200×630 card and alt text`, () => {
      const file = new URL(
        `../public${shareImagePath(guide)}`,
        import.meta.url,
      );
      assert.ok(
        existsSync(file),
        `missing public${shareImagePath(guide)}; run node scripts/generate-share-images.mjs`,
      );
      assert.deepEqual(pngSize(readFileSync(file)), {
        width: 1200,
        height: 630,
      });
      assert.match(guide.shareAlt, /^ColdBoot field reference card: /);
    });
  }
});
