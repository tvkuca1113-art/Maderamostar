import type { DoorConfig, PricingData } from '../types';
import { knownDimensions, quantityOf } from './validation';

/**
 * Kalkulator ima dva režima:
 *  A) cjenovnik nije odobren ili nema poreznog prikaza → priprema se specifikacija za ponudu, bez iznosa;
 *  B) odobren cjenovnik → informativna procjena, ali samo za stavke koje su u potpunosti pokrivene.
 * Nedostajuća stopa je uvijek nepoznat trošak, nikad nula.
 */

export interface PricePart {
  label: string;
  amount: number;
}

export type LineEstimate =
  | {
      status: 'priced';
      quantity: number;
      unitBAM: number;
      parts: PricePart[];
      baseIncludes: string[];
      productSubtotal: number;
      installationTotal: number;
      total: number;
    }
  | {
      status: 'requires_quote';
      quantity: number;
      reasons: string[];
    };

export type ProjectEstimate =
  | { mode: 'quote'; reason: 'pricing_not_approved' | 'nothing_priced'; totalQuantity: number; lines: LineEstimate[] }
  | {
      mode: 'estimate' | 'partial';
      totalQuantity: number;
      lines: LineEstimate[];
      delivery: { status: 'priced'; amount: number; label: string } | { status: 'requires_quote'; reason: string };
      /** Zbir svih poznatih iznosa. Kod 'partial' ovo NIJE ukupna cijena projekta. */
      knownSubtotal: number;
      unknownCount: number;
      taxNote: string;
    };

export function isPricingActive(pricing: PricingData): boolean {
  return pricing.approvedByOwner === true && pricing.taxMode !== null && pricing.taxMode !== undefined;
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

export function estimateLine(cfg: DoorConfig, pricing: PricingData): LineEstimate {
  const quantity = quantityOf(cfg);
  const reasons: string[] = [];
  const item = pricing.items.find((i) => i.productId === cfg.productId);
  const decimals = pricing.rounding?.decimals ?? 2;

  if (!isPricingActive(pricing)) {
    return { status: 'requires_quote', quantity, reasons: ['Cjenovnik još nije odobren.'] };
  }
  if (quantity < 1) reasons.push('Količina nije ispravna.');
  if (!item || item.basePriceBAM === null || item.basePriceBAM === undefined) {
    return { status: 'requires_quote', quantity, reasons: [...reasons, 'Cijena modela nije u cjenovniku.'] };
  }

  const parts: PricePart[] = [{ label: 'Osnovna cijena kompleta', amount: item.basePriceBAM }];

  const finish = item.finishSurchargesBAM?.[cfg.finish];
  if (finish === undefined || finish === null) reasons.push('Doplata za odabranu obradu nije u cjenovniku.');
  else if (finish !== 0) parts.push({ label: 'Doplata za obradu', amount: finish });

  const hardware = item.hardwareSurchargesBAM?.[cfg.handle];
  if (hardware === undefined || hardware === null) reasons.push('Doplata za odabranu kvaku nije u cjenovniku.');
  else if (hardware !== 0) parts.push({ label: 'Doplata za okove', amount: hardware });

  const dims = knownDimensions(cfg);
  const rules = item.dimensionRules;
  if (!dims) {
    reasons.push('Mjere nisu poznate ili nisu potpune.');
  } else if (!rules) {
    reasons.push('Pravila za mjere nisu u cjenovniku.');
  } else {
    const lim = rules.productionLimits;
    if (lim && (dims.w < lim.minWidthCm || dims.w > lim.maxWidthCm || dims.h < lim.minHeightCm || dims.h > lim.maxHeightCm)) {
      reasons.push('Nestandardne mjere — potrebna ponuda.');
    } else {
      const overW = dims.w > rules.standardMaxWidthCm;
      const overH = dims.h > rules.standardMaxHeightCm;
      if (overW || overH) {
        let coveredW = !overW;
        let coveredH = !overH;
        // Primjenjuje se najveća doplata za svaku dimenziju koja prelazi standard.
        const applicable = (rules.surcharges ?? []).filter(
          (s) =>
            (s.aboveWidthCm !== undefined && dims.w > s.aboveWidthCm) ||
            (s.aboveHeightCm !== undefined && dims.h > s.aboveHeightCm),
        );
        let wRule: (typeof applicable)[number] | undefined;
        let hRule: (typeof applicable)[number] | undefined;
        for (const s of applicable) {
          if (s.aboveWidthCm !== undefined && dims.w > s.aboveWidthCm && (!wRule || s.amountBAM > wRule.amountBAM)) wRule = s;
          if (s.aboveHeightCm !== undefined && dims.h > s.aboveHeightCm && (!hRule || s.amountBAM > hRule.amountBAM)) hRule = s;
        }
        if (overW && wRule) coveredW = true;
        if (overH && hRule) coveredH = true;
        if (!coveredW || !coveredH) {
          reasons.push('Mjere iznad standarda — potrebna ponuda.');
        } else {
          for (const r of new Set([wRule, hRule])) {
            if (r) parts.push({ label: `Doplata za mjere: ${r.label}`, amount: r.amountBAM });
          }
        }
      }
    }
  }

  if (item.installationPerDoorBAM === null || item.installationPerDoorBAM === undefined) {
    reasons.push('Montaža nije u cjenovniku.');
  }

  if (reasons.length > 0) return { status: 'requires_quote', quantity, reasons };

  const unit = round(parts.reduce((s, p) => s + p.amount, 0), decimals);
  const productSubtotal = round(unit * quantity, decimals);
  const installationTotal = round((item.installationPerDoorBAM as number) * quantity, decimals);
  return {
    status: 'priced',
    quantity,
    unitBAM: unit,
    parts,
    baseIncludes: item.baseIncludes ?? [],
    productSubtotal,
    installationTotal,
    total: round(productSubtotal + installationTotal, decimals),
  };
}

function normalizePlace(s: string): string {
  return s
    .toLocaleLowerCase('bs')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function estimateDelivery(
  location: string,
  pricing: PricingData,
): { status: 'priced'; amount: number; label: string } | { status: 'requires_quote'; reason: string } {
  const d = pricing.delivery;
  if (!d || !d.approved || !d.mode) return { status: 'requires_quote', reason: 'Doprema nije u cjenovniku.' };
  if (d.mode === 'flat') {
    if (d.flatBAM === null || d.flatBAM === undefined) return { status: 'requires_quote', reason: 'Doprema nije u cjenovniku.' };
    return { status: 'priced', amount: d.flatBAM, label: 'Doprema' };
  }
  const place = normalizePlace(location);
  if (!place) return { status: 'requires_quote', reason: 'Mjesto montaže nije navedeno.' };
  const zone = d.zones.find((z) => z.places.some((p) => normalizePlace(p) === place));
  if (!zone) return { status: 'requires_quote', reason: 'Doprema za navedeno mjesto potvrđuje se u ponudi.' };
  return { status: 'priced', amount: zone.feeBAM, label: `Doprema (${zone.label})` };
}

export function estimateProject(items: DoorConfig[], location: string, pricing: PricingData): ProjectEstimate {
  const totalQuantity = items.reduce((s, i) => s + quantityOf(i), 0);
  const lines = items.map((i) => estimateLine(i, pricing));
  if (!isPricingActive(pricing)) {
    return { mode: 'quote', reason: 'pricing_not_approved', totalQuantity, lines };
  }
  const priced = lines.filter((l) => l.status === 'priced');
  if (priced.length === 0) {
    return { mode: 'quote', reason: 'nothing_priced', totalQuantity, lines };
  }
  const delivery = estimateDelivery(location, pricing);
  const decimals = pricing.rounding?.decimals ?? 2;
  const linesSum = priced.reduce((s, l) => s + (l.status === 'priced' ? l.total : 0), 0);
  const knownSubtotal = round(linesSum + (delivery.status === 'priced' ? delivery.amount : 0), decimals);
  const unknownCount = lines.length - priced.length + (delivery.status === 'priced' ? 0 : 1);
  return {
    mode: unknownCount === 0 ? 'estimate' : 'partial',
    totalQuantity,
    lines,
    delivery,
    knownSubtotal,
    unknownCount,
    taxNote: pricing.taxMode === 'vat_included' ? 'Iznosi uključuju PDV.' : 'Iznosi su bez PDV-a.',
  };
}

const formatter = new Intl.NumberFormat('bs-BA', { style: 'currency', currency: 'BAM' });

export function formatBAM(amount: number): string {
  return formatter.format(amount);
}
