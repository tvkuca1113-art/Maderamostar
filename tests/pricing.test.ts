import { describe, expect, it } from 'vitest';
import { pricing as publicPricing } from '../src/data';
import { estimateLine, estimateProject, formatBAM, isPricingActive } from '../src/lib/pricing';
import { emptyConfig } from '../src/state/store';
import type { DoorConfig } from '../src/types';
import { testPricing } from './fixtures/pricing-approved';

const cfg = (patch: Partial<DoorConfig>): DoorConfig => ({ ...emptyConfig(), ...patch });

describe('Režim A — bez odobrenog cjenovnika', () => {
  it('javni cjenovnik nije aktivan i ne sadrži testne cijene', () => {
    expect(isPricingActive(publicPricing)).toBe(false);
    expect(publicPricing.items.every((i) => i.basePriceBAM === null)).toBe(true);
  });

  it('priprema upit i ne proizvodi iznos', () => {
    const est = estimateProject([cfg({ widthCm: '80', heightCm: '200', quantity: '2' })], 'Mostar', publicPricing);
    expect(est.mode).toBe('quote');
    expect(est.totalQuantity).toBe(2);
    expect('knownSubtotal' in est).toBe(false);
    expect(est.lines.every((l) => l.status === 'requires_quote')).toBe(true);
  });
});

describe('Režim B — kontrolirani testni cjenovnik', () => {
  it('količina, doplate, montaža i doprema daju očekivani zbroj', () => {
    const line = estimateLine(
      cfg({ widthCm: '95', heightCm: '200', quantity: '2', finish: 'tamna', handle: 'crna' }),
      testPricing,
    );
    expect(line.status).toBe('priced');
    if (line.status !== 'priced') return;
    // 500 + 40 (obrada) + 25 (okovi) + 60 (širina) = 625 po komadu
    expect(line.unitBAM).toBe(625);
    expect(line.productSubtotal).toBe(1250);
    expect(line.installationTotal).toBe(100);
    expect(line.total).toBe(1350);

    const est = estimateProject(
      [cfg({ widthCm: '95', heightCm: '200', quantity: '2', finish: 'tamna', handle: 'crna' })],
      'mostar',
      testPricing,
    );
    expect(est.mode).toBe('estimate');
    if (est.mode === 'quote') return;
    expect(est.knownSubtotal).toBe(1380);
    expect(est.unknownCount).toBe(0);
  });

  it('decimalni zarez u mjerama radi', () => {
    const line = estimateLine(cfg({ widthCm: '80,5', heightCm: '200,0' }), testPricing);
    expect(line.status).toBe('priced');
  });

  it('nedostajuća stopa vraća „Potrebna ponuda”, nikad nulu', () => {
    const line = estimateLine(cfg({ productId: 'patras-bijeli', widthCm: '80', heightCm: '200' }), testPricing);
    expect(line.status).toBe('requires_quote');
    if (line.status === 'requires_quote') expect(line.reasons.join(' ')).toMatch(/Montaža/);

    const noFinish = estimateLine(cfg({ widthCm: '80', heightCm: '200', finish: 'po-zelji' }), testPricing);
    expect(noFinish.status).toBe('requires_quote');

    const noModel = estimateLine(cfg({ productId: 'sara-bijeli', widthCm: '80', heightCm: '200' }), testPricing);
    expect(noModel.status).toBe('requires_quote');
  });

  it('nepotpune ili nepoznate dimenzije vraćaju „Potrebna ponuda”', () => {
    expect(estimateLine(cfg({ widthCm: '80', heightCm: '' }), testPricing).status).toBe('requires_quote');
    expect(estimateLine(cfg({ dimsUnknown: true }), testPricing).status).toBe('requires_quote');
  });

  it('mjere izvan proizvodnih granica idu na ponudu, ne odbijaju se', () => {
    const line = estimateLine(cfg({ widthCm: '120', heightCm: '200' }), testPricing);
    expect(line.status).toBe('requires_quote');
    if (line.status === 'requires_quote') expect(line.reasons.join(' ')).toMatch(/ponuda/);
  });

  it('djelimičan obračun označava poznati međuzbir i nepoznate stavke', () => {
    const est = estimateProject(
      [
        cfg({ widthCm: '80', heightCm: '200', quantity: '1' }),
        cfg({ productId: 'patras-bijeli', widthCm: '80', heightCm: '200', quantity: '2' }),
      ],
      'Čapljina',
      testPricing,
    );
    expect(est.mode).toBe('partial');
    if (est.mode === 'quote') return;
    expect(est.knownSubtotal).toBe(550);
    // patras bez montaže + doprema za mjesto izvan zona
    expect(est.unknownCount).toBe(2);
    expect(est.totalQuantity).toBe(3);
  });

  it('bez poreznog prikaza nema novčane procjene', () => {
    const est = estimateProject([cfg({ widthCm: '80', heightCm: '200' })], 'Mostar', { ...testPricing, taxMode: null });
    expect(est.mode).toBe('quote');
  });

  it('formatira iznose u KM', () => {
    expect(formatBAM(1380)).toMatch(/1\.380,00\s?KM/);
  });
});
