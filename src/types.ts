export type RecordType = 'named_model' | 'custom_example';

export interface Product {
  id: string;
  displayName: string;
  recordType: RecordType;
  category: string;
  description: string;
  image: string;
  imageAlt: string;
  sourceUrl: string;
  sourceCaption: string;
  observedFeatures: string[];
  observedHandleSideInPhoto: 'left' | 'right' | 'center' | 'varies' | 'recessed' | string;
  photoIsOriginal: boolean;
  manufacturerModelNameConfirmedInCaption: boolean;
  currentAvailability: string;
  approvedForCatalog: boolean;
  approvedPriceBAM: number | null;
  dimensions: Record<string, number | null>;
  manufacturingOptions: {
    approvedFinishIds: string[];
    approvedHardwareIds: string[];
    approvedDimensionRules: unknown;
  };
  viewer: {
    exactGlbPath: string | null;
    proceduralPreviewAllowed: boolean;
    productionGeometryVerified: boolean;
    label: string;
  };
  commercialNote: string;
}

export interface SiteConfig {
  brand: string;
  serviceText: string;
  locationText: string;
  phoneDisplay: string;
  phoneHref: string;
  instagramUrl: string;
  whatsapp: { enabled: boolean; phoneE164Digits: string; requiresOwnerConfirmation: boolean };
  contactForm: { endpoint: string | null; email: string | null; mode: string };
  hours: string | null;
  warranty: string | null;
  leadTime: string | null;
}

/** Pravila za mjere koja unosi vlasnik. Sve mjere su mjere otvora u cm. */
export interface DimensionRules {
  /** Mjere do ovih vrijednosti nemaju doplatu. */
  standardMaxWidthCm: number;
  standardMaxHeightCm: number;
  /** Doplate za mjere iznad standarda. Ako nijedno pravilo ne pokriva mjeru, potrebna je ponuda. */
  surcharges?: Array<{
    id: string;
    label: string;
    aboveWidthCm?: number;
    aboveHeightCm?: number;
    amountBAM: number;
  }>;
  /** Potvrđeni proizvodni minimumi i maksimumi; izvan njih se traži ponuda (kupac se ne odbija). */
  productionLimits?: {
    minWidthCm: number;
    maxWidthCm: number;
    minHeightCm: number;
    maxHeightCm: number;
  } | null;
}

export interface PricingItem {
  productId: string;
  basePriceBAM: number | null;
  baseIncludes: string[];
  finishSurchargesBAM: Record<string, number>;
  hardwareSurchargesBAM: Record<string, number>;
  dimensionRules: DimensionRules | null;
  installationPerDoorBAM: number | null;
}

export interface PricingData {
  schemaVersion: number;
  currency: string;
  approvedByOwner: boolean;
  approvedAt: string | null;
  validUntil: string | null;
  /** 'vat_included' | 'vat_excluded'; null = porez nije definisan → nema novčane procjene. */
  taxMode: 'vat_included' | 'vat_excluded' | null;
  items: PricingItem[];
  delivery: {
    approved: boolean;
    mode: 'flat' | 'zones' | null;
    flatBAM?: number | null;
    zones: Array<{ id: string; label: string; places: string[]; feeBAM: number }>;
  };
  measurement?: { feeBAM: number | null; deductedFromOrder: boolean | null };
  rounding: { decimals: number };
  disclaimer: string;
}

export type FinishId =
  | 'kao-na-fotografiji'
  | 'bijela'
  | 'hrast'
  | 'tamna'
  | 'siva'
  | 'po-zelji'
  | 'nisam-siguran';

export type HandleId = 'kao-na-fotografiji' | 'srebrna' | 'crna' | 'zlatna' | 'nisam-siguran';

export type HandleSide = 'lijevo' | 'desno' | 'nisam-siguran';

/** Jedna konfiguracija vrata. Mjere i količina čuvaju se kao uneseni tekst radi validacije. */
export interface DoorConfig {
  productId: string;
  finish: FinishId;
  handle: HandleId;
  handleSide: HandleSide;
  widthCm: string;
  heightCm: string;
  dimsUnknown: boolean;
  wallCm: string;
  quantity: string;
  room: string;
  roomCustom: string;
}

export interface ProjectItem extends DoorConfig {
  id: string;
}
