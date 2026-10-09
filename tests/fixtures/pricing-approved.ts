import type { PricingData } from '../../src/types';

/**
 * KONTROLIRANI TESTNI CJENOVNIK — izmišljene vrijednosti samo za provjeru računa.
 * Ne koristi se u aplikaciji i ne smije ući u javnu ponudu.
 */
export const testPricing: PricingData = {
  schemaVersion: 1,
  currency: 'BAM',
  approvedByOwner: true,
  approvedAt: '2026-01-01',
  validUntil: null,
  taxMode: 'vat_included',
  items: [
    {
      productId: 'hrast-furnir-h',
      basePriceBAM: 500,
      baseIncludes: ['krilo', 'štok', 'lajsne', 'standardna kvaka'],
      finishSurchargesBAM: { 'kao-na-fotografiji': 0, bijela: 0, hrast: 0, tamna: 40 },
      hardwareSurchargesBAM: { 'kao-na-fotografiji': 0, srebrna: 0, crna: 25 },
      dimensionRules: {
        standardMaxWidthCm: 90,
        standardMaxHeightCm: 210,
        surcharges: [
          { id: 'w100', label: 'širina do 100 cm', aboveWidthCm: 90, amountBAM: 60 },
          { id: 'h220', label: 'visina do 220 cm', aboveHeightCm: 210, amountBAM: 50 },
        ],
        productionLimits: { minWidthCm: 50, maxWidthCm: 100, minHeightCm: 180, maxHeightCm: 220 },
      },
      installationPerDoorBAM: 50,
    },
    {
      productId: 'patras-bijeli',
      basePriceBAM: 400,
      baseIncludes: ['krilo', 'štok', 'lajsne'],
      finishSurchargesBAM: { 'kao-na-fotografiji': 0, bijela: 0 },
      hardwareSurchargesBAM: { 'kao-na-fotografiji': 0 },
      dimensionRules: { standardMaxWidthCm: 90, standardMaxHeightCm: 210, surcharges: [], productionLimits: null },
      installationPerDoorBAM: null,
    },
  ],
  delivery: {
    approved: true,
    mode: 'zones',
    zones: [{ id: 'mostar', label: 'Mostar', places: ['Mostar'], feeBAM: 30 }],
  },
  rounding: { decimals: 2 },
  disclaimer: 'Test',
};
