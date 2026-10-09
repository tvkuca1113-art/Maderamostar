import type { DoorConfig } from '../types';

/** Pretvara unos s decimalnim zarezom ili tačkom u broj. Prazno → null, neispravno → NaN. */
export function parseDecimal(raw: string): number | null {
  const s = raw.trim().replace(/\s+/g, '');
  if (s === '') return null;
  if (!/^\d+([.,]\d+)?$/.test(s)) return Number.NaN;
  return Number(s.replace(',', '.'));
}

export function parseQuantity(raw: string): number | null {
  const s = raw.trim();
  if (s === '') return null;
  if (!/^\d+$/.test(s)) return Number.NaN;
  return Number(s);
}

/**
 * Raspon služi samo za hvatanje grešaka u unosu (npr. milimetri umjesto centimetara).
 * Ovo nije proizvodni limit: nestandardne mjere idu na ponudu.
 */
const SANE_MIN_CM = 20;
const SANE_MAX_CM = 400;
const MAX_QUANTITY = 99;

export type ConfigErrors = Partial<Record<'widthCm' | 'heightCm' | 'quantity' | 'wallCm', string>>;

function checkMeasure(raw: string, label: string, required: boolean): string | undefined {
  const v = parseDecimal(raw);
  if (v === null) return required ? `Unesite ${label} ili označite „Ne znam mjere”.` : undefined;
  if (Number.isNaN(v)) return `Unesite ${label} kao broj u centimetrima, npr. 80 ili 80,5.`;
  if (v <= 0) return `${capitalize(label)} mora biti veća od nule.`;
  if (v < SANE_MIN_CM || v > SANE_MAX_CM)
    return `Provjerite ${label}: unesite mjeru u centimetrima (ne u milimetrima).`;
  return undefined;
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function validateConfig(cfg: DoorConfig): ConfigErrors {
  const errors: ConfigErrors = {};
  if (!cfg.dimsUnknown) {
    const w = checkMeasure(cfg.widthCm, 'širinu otvora', true);
    const h = checkMeasure(cfg.heightCm, 'visinu otvora', true);
    if (w) errors.widthCm = w;
    if (h) errors.heightCm = h;
  }
  const wall = parseDecimal(cfg.wallCm);
  if (wall !== null && (Number.isNaN(wall) || wall <= 0 || wall > 100)) {
    errors.wallCm = 'Debljinu zida unesite u centimetrima, npr. 12. Polje možete ostaviti prazno.';
  }
  const q = parseQuantity(cfg.quantity);
  if (q === null || Number.isNaN(q) || q < 1) {
    errors.quantity = 'Unesite broj vrata kao cijeli broj, najmanje 1.';
  } else if (q > MAX_QUANTITY) {
    errors.quantity = `Za više od ${MAX_QUANTITY} vrata u jednoj stavci kontaktirajte Maderu direktno.`;
  }
  return errors;
}

export function isValid(errors: ConfigErrors): boolean {
  return Object.keys(errors).length === 0;
}

/** Mjere za prikaz: „80 × 200 cm” ili null ako nisu poznate/valjane. */
export function knownDimensions(cfg: DoorConfig): { w: number; h: number } | null {
  if (cfg.dimsUnknown) return null;
  const w = parseDecimal(cfg.widthCm);
  const h = parseDecimal(cfg.heightCm);
  if (w === null || h === null || Number.isNaN(w) || Number.isNaN(h) || w <= 0 || h <= 0) return null;
  return { w, h };
}

export function formatCm(n: number): string {
  return new Intl.NumberFormat('bs-BA', { maximumFractionDigits: 1 }).format(n);
}

export function quantityOf(cfg: DoorConfig): number {
  const q = parseQuantity(cfg.quantity);
  return q !== null && !Number.isNaN(q) && q > 0 ? q : 0;
}
