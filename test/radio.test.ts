import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  licenseDetail,
  RADIO_SERVICES,
  SERVICE_FACTS,
} from '../src/data/radio.ts';

const byId = (id: string) => {
  const s = RADIO_SERVICES.find((r) => r.id === id);
  assert.ok(s, id);
  return s;
};

describe('RADIO_SERVICES', () => {
  it('has the five services, easiest to use first', () => {
    assert.deepEqual(
      RADIO_SERVICES.map((s) => s.id),
      ['FRS', 'GMRS', 'MURS', 'CB', 'HAM'],
    );
  });

  it('gives every channel a frequency in MHz and a mode', () => {
    for (const s of RADIO_SERVICES) {
      assert.ok(s.channels.length > 0, s.id);
      for (const c of s.channels) {
        assert.match(c.frequency, /^\d+\.\d{3,4} MHz$/, `${s.id} ${c.name}`);
        assert.ok(c.mode.length > 0);
      }
    }
  });

  it('marks the licensed services', () => {
    assert.deepEqual(
      RADIO_SERVICES.filter((s) => s.requiresLicense).map((s) => s.id),
      ['GMRS', 'HAM'],
    );
  });

  it('strips the license banner, keeping the sentence', () => {
    const detail = licenseDetail(byId('CB').licenseInfo);
    assert.match(detail, /^CB radio can be used/);
    assert.match(licenseDetail(byId('HAM').licenseInfo), /^You must have/);
  });

  it('has the frequencies the page tells people to call on', () => {
    const freq = (id: string, name: string) =>
      byId(id).channels.find((c) => c.name === name)?.frequency;
    assert.equal(freq('CB', 'Channel 9'), '27.065 MHz');
    assert.equal(freq('GMRS', 'Channel 20 / 20R'), '462.675 MHz');
    assert.equal(freq('HAM', '2m FM Simplex Calling'), '146.520 MHz');
  });

  it('lists the power limits for GMRS channels', () => {
    const notes = (name: string) =>
      byId('GMRS').channels.find((c) => c.name === name)?.notes;
    assert.match(notes('Channel 15 / 15R') ?? '', /^Up to 50W\./);
    assert.match(notes('Channel 1 (Simplex)') ?? '', /^5W max\./);
  });
});

describe('SERVICE_FACTS', () => {
  it('has one row per service, in the same order', () => {
    assert.deepEqual(
      SERVICE_FACTS.map((f) => f.id),
      RADIO_SERVICES.map((s) => s.id),
    );
  });

  it('agrees with the app on who needs a license', () => {
    for (const f of SERVICE_FACTS) {
      assert.equal(f.license !== 'None', byId(f.id).requiresLicense, f.id);
    }
  });

  it('agrees with the app on the power limits it states', () => {
    const app = (id: string) => byId(id).licenseInfo;
    assert.match(app('FRS'), /2 watts on channels 1-7 and 15-22/);
    assert.match(app('FRS'), /0\.5 watts on channels 8-14/);
    assert.match(app('MURS'), /Maximum power: 2 watts/);
    assert.match(app('CB'), /4 watts AM, 12 watts PEP SSB/);
    assert.deepEqual(
      SERVICE_FACTS.map((f) => f.power),
      [
        '2 W (0.5 W on 8–14)',
        'Up to 50 W, and repeaters',
        '2 W, external antennas allowed',
        '4 W AM, 12 W PEP SSB',
        'Depends on band and license class',
      ],
    );
  });
});
