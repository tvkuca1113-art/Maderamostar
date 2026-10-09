import type { DoorConfig, FinishId, HandleId, HandleSide, Product } from '../types';

export interface Option<T extends string> {
  id: T;
  label: string;
  /** Kratki opis za sažetak upita, npr. „željena bijela obrada”. */
  phrase: string;
  swatch?: string;
}

export const FINISHES: Option<FinishId>[] = [
  { id: 'kao-na-fotografiji', label: 'Kao na fotografiji', phrase: 'obrada kao na fotografiji' },
  { id: 'bijela', label: 'Bijela', phrase: 'željena bijela obrada', swatch: '#F6F5F1' },
  { id: 'hrast', label: 'Hrastov furnir', phrase: 'željeni hrastov furnir', swatch: '#B98454' },
  { id: 'tamna', label: 'Tamna / antracit', phrase: 'željena tamna obrada', swatch: '#34363A' },
  { id: 'siva', label: 'Siva', phrase: 'željena siva obrada', swatch: '#C4C6C4' },
  { id: 'po-zelji', label: 'Boja po želji', phrase: 'željena boja po dogovoru' },
  { id: 'nisam-siguran', label: 'Nisam siguran/na', phrase: 'obrada: potreban savjet' },
];

export const HANDLES: Option<HandleId>[] = [
  { id: 'kao-na-fotografiji', label: 'Kao na fotografiji', phrase: 'kvaka kao na fotografiji' },
  { id: 'srebrna', label: 'Srebrna', phrase: 'željena srebrna kvaka', swatch: '#C9CBCC' },
  { id: 'crna', label: 'Crna', phrase: 'željena crna kvaka', swatch: '#1F1F1F' },
  { id: 'zlatna', label: 'Zlatna', phrase: 'željena zlatna kvaka', swatch: '#C9A45C' },
  { id: 'nisam-siguran', label: 'Nisam siguran/na', phrase: 'kvaka: potreban savjet' },
];

export const HANDLE_SIDES: Option<HandleSide>[] = [
  { id: 'lijevo', label: 'Kvaka lijevo', phrase: 'kvaka lijevo, gledano s prikazane strane' },
  { id: 'desno', label: 'Kvaka desno', phrase: 'kvaka desno, gledano s prikazane strane' },
  { id: 'nisam-siguran', label: 'Nisam siguran/na', phrase: 'smjer otvaranja: potrebna potvrda' },
];

export const ROOMS = ['Spavaća soba', 'Dnevni boravak', 'Kupatilo', 'Hodnik', 'Drugo'] as const;

/** Prijedlozi mjesta montaže; korisnik može upisati bilo koje mjesto. */
export const PLACES = [
  'Mostar',
  'Čapljina',
  'Čitluk',
  'Grude',
  'Jablanica',
  'Konjic',
  'Ljubuški',
  'Međugorje',
  'Neum',
  'Nevesinje',
  'Posušje',
  'Prozor-Rama',
  'Stolac',
  'Široki Brijeg',
  'Trebinje',
];

const FEATURE_LABELS: Record<string, string> = {
  'hrast-furnir': 'Hrastov furnir',
  'srebrna-kvaka': 'Srebrna kvaka',
  bijela: 'Bijela obrada',
  'ravne-lajsne': 'Ravne lajsne',
  'stakleno-polje': 'Stakleno polje',
  'zlatne-linije': 'Zlatne okomite linije',
  'zlatna-kvaka': 'Zlatna kvaka',
  dvokrilna: 'Dvokrilna izvedba',
  'staklo-mreza': 'Staklo s mrežom',
  'crna-kvaka': 'Crna kvaka',
  'skrivene-baglame': 'Skrivene baglame',
  'magnetna-brava': 'Magnetna brava',
  'tamna-boja': 'Tamna boja',
  'tamna-kvaka': 'Tamna kvaka',
  siva: 'Siva obrada',
  'skrivena-vrata': 'U ravnini zida',
  'elektronska-rucka-otisak-prsta': 'Elektronska ručka na otisak prsta',
  klizna: 'Klizna izvedba',
  'uvuceni-prihvat': 'Uvučeni prihvat',
};

export function featureLabel(id: string): string {
  return FEATURE_LABELS[id] ?? id;
}

export function optionLabel<T extends string>(list: Option<T>[], id: T): string {
  return list.find((o) => o.id === id)?.label ?? id;
}

export function optionPhrase<T extends string>(list: Option<T>[], id: T): string {
  return list.find((o) => o.id === id)?.phrase ?? id;
}

/** Strana kvake ima smisla samo za jednokrilna zaokretna vrata. */
export function hasHandleSideChoice(product: Product | undefined): boolean {
  if (!product) return false;
  return !['center', 'recessed'].includes(product.observedHandleSideInPhoto);
}

export function roomLabel(cfg: Pick<DoorConfig, 'room' | 'roomCustom'>, index?: number): string {
  if (cfg.room === 'Drugo') {
    return cfg.roomCustom.trim() || (index !== undefined ? `Prostorija ${index + 1}` : 'Druga prostorija');
  }
  if (cfg.room) return cfg.room;
  return index !== undefined ? `Prostorija ${index + 1}` : 'Prostorija nije navedena';
}

export const CATALOG_FILTERS = [
  'Sva vrata',
  'Moderna',
  'Klasična',
  'Furnir',
  'Staklo',
  'Klizna',
  'Skrivena',
  'Dvokrilna',
  'Po želji',
] as const;
export type CatalogFilter = (typeof CATALOG_FILTERS)[number];

/** Filtriranje koristi kategoriju i potvrđene osobine prikazane izvedbe. */
export function matchesFilter(product: Product, filter: CatalogFilter): boolean {
  const f = product.observedFeatures;
  switch (filter) {
    case 'Sva vrata':
      return true;
    case 'Staklo':
      return product.category === 'Staklo' || f.includes('stakleno-polje') || f.includes('staklo-mreza');
    case 'Klizna':
      return product.category === 'Klizna' || f.includes('klizna');
    case 'Skrivena':
      return product.category === 'Skrivena' || f.includes('skrivena-vrata');
    case 'Dvokrilna':
      return product.category === 'Dvokrilna' || f.includes('dvokrilna');
    case 'Po želji':
      return product.recordType === 'custom_example' || product.category === 'Po želji';
    default:
      return product.category === filter;
  }
}
