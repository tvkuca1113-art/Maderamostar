import type { DoorConfig, Product } from '../types';
import { FINISHES, HANDLES, HANDLE_SIDES, hasHandleSideChoice, optionPhrase, roomLabel } from './options';
import { formatCm, knownDimensions, parseDecimal, quantityOf } from './validation';

export interface InquiryContact {
  name: string;
  phone: string;
  message: string;
}

type ProductLookup = (id: string) => Product | undefined;

export function describeDimensions(cfg: DoorConfig): string {
  const d = knownDimensions(cfg);
  if (!d) return 'mjere nisu poznate';
  return `približne mjere otvora ${formatCm(d.w)} × ${formatCm(d.h)} cm`;
}

/** Detalji jedne stavke, bez prostorije i modela. */
export function describeDetails(cfg: DoorConfig, product: Product | undefined): string[] {
  const parts: string[] = [`${quantityOf(cfg)} kom.`, describeDimensions(cfg)];
  if (cfg.finish !== 'kao-na-fotografiji') parts.push(optionPhrase(FINISHES, cfg.finish));
  if (cfg.handle !== 'kao-na-fotografiji') parts.push(optionPhrase(HANDLES, cfg.handle));
  if (hasHandleSideChoice(product)) parts.push(optionPhrase(HANDLE_SIDES, cfg.handleSide));
  const wall = parseDecimal(cfg.wallCm);
  if (wall !== null && !Number.isNaN(wall) && wall > 0) parts.push(`debljina zida ${formatCm(wall)} cm`);
  return parts;
}

export function describeItem(cfg: DoorConfig, index: number, getProduct: ProductLookup): string {
  const product = getProduct(cfg.productId);
  const name = product?.displayName ?? cfg.productId;
  return `${roomLabel(cfg, index)}: ${name}, ${describeDetails(cfg, product).join(', ')}.`;
}

export function buildInquiryText(
  items: DoorConfig[],
  location: string,
  getProduct: ProductLookup,
  contact?: Partial<InquiryContact>,
): string {
  const total = items.reduce((s, i) => s + quantityOf(i), 0);
  const lines: string[] = [
    'Upit za Madera vrata.',
    `Mjesto montaže: ${location.trim() || 'nije navedeno'}.`,
    `Ukupno: ${total} vrata.`,
    '',
    ...items.map((cfg, i) => `${i + 1}. ${describeItem(cfg, i, getProduct)}`),
    '',
  ];
  const name = contact?.name?.trim();
  const phone = contact?.phone?.trim();
  const message = contact?.message?.trim();
  if (name) lines.push(`Ime: ${name}`);
  if (phone) lines.push(`Telefon: ${phone}`);
  if (message) lines.push(`Poruka: ${message}`);
  if (name || phone || message) lines.push('');
  lines.push('Molim ponudu i potvrdu dostupnih opcija.');
  return lines.join('\n');
}

export function buildInquiryJson(
  items: DoorConfig[],
  location: string,
  getProduct: ProductLookup,
  contact?: Partial<InquiryContact>,
) {
  return {
    type: 'madera-upit',
    version: 1,
    createdAt: new Date().toISOString(),
    location: location.trim() || null,
    totalQuantity: items.reduce((s, i) => s + quantityOf(i), 0),
    items: items.map((cfg, i) => {
      const product = getProduct(cfg.productId);
      const dims = knownDimensions(cfg);
      const wall = parseDecimal(cfg.wallCm);
      return {
        room: roomLabel(cfg, i),
        productId: cfg.productId,
        productName: product?.displayName ?? null,
        quantity: quantityOf(cfg),
        openingWidthCm: dims?.w ?? null,
        openingHeightCm: dims?.h ?? null,
        dimensionsKnown: dims !== null,
        wallThicknessCm: wall !== null && !Number.isNaN(wall) ? wall : null,
        desiredFinish: cfg.finish,
        desiredHandle: cfg.handle,
        handleSide: hasHandleSideChoice(product) ? cfg.handleSide : null,
        requiresConfirmation: true,
      };
    }),
    contact: contact && (contact.name || contact.phone || contact.message)
      ? { name: contact.name?.trim() || null, phone: contact.phone?.trim() || null, message: contact.message?.trim() || null }
      : null,
    note: 'Konačnu cijenu, mjere i dostupne opcije potvrđuje Madera.',
  };
}

export function downloadFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Kopira tekst; vraća false ako preglednik ne dozvoli pristup međuspremniku. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* rezervni put ispod */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
