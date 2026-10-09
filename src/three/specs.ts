import type { DoorConfig, FinishId, HandleId, Product } from '../types';
import type { DoorSpec, Look } from './doorBuilder';
import { DEMO_DIMENSIONS } from './dimensions';

/**
 * Ilustrativne 3D postavke po zapisu iz kataloga, izvedene iz originalnih fotografija.
 * Proporcije su demonstracijske (≈ 0,80 × 2,00 m, krilo 0,04 m) i ne ulaze u upit.
 */

const WHITE: Look = { kind: 'color', color: '#f3f2ee', roughness: 0.45 };
const OAK: Look = { kind: 'oak' };
const WALL = '#e9e2d7';
const SILVER = { handleColor: '#c8cacc', handleMetal: 0.9 };

const base = {
  leafWidth: DEMO_DIMENSIONS.leafWidth,
  leafHeight: DEMO_DIMENSIONS.leafHeight,
  leafThickness: DEMO_DIMENSIONS.leafThickness,
  wallThickness: 0.14,
  wallColor: WALL,
};

const SPECS: Record<string, DoorSpec> = {
  'hrast-furnir-h': {
    ...base,
    ...SILVER,
    kind: 'swing',
    style: 'oak-h',
    // Kvaka lijevo, kao na originalnoj fotografiji; baglame desno.
    handleSide: 'left',
    leafLook: OAK,
    frameLook: OAK,
    architrave: 'rounded',
  },
  'patras-bijeli': {
    ...base,
    ...SILVER,
    kind: 'swing',
    style: 'grooves',
    grooves: { count: 4, color: '#c9c9c4' },
    handleSide: 'right',
    leafLook: WHITE,
    frameLook: WHITE,
    architrave: 'flat',
  },
  'olimpus-bijeli': {
    ...base,
    ...SILVER,
    kind: 'swing',
    style: 'flat',
    handleSide: 'left',
    leafLook: WHITE,
    frameLook: WHITE,
    architrave: 'flat',
  },
  'milano-bijeli': {
    ...base,
    ...SILVER,
    kind: 'swing',
    style: 'grooves',
    grooves: { count: 3, color: '#dcdcd7' },
    handleSide: 'left',
    leafLook: WHITE,
    frameLook: WHITE,
    architrave: 'flat',
  },
  'sara-bijeli': {
    ...base,
    ...SILVER,
    kind: 'swing',
    style: 'two-panels',
    handleSide: 'left',
    leafLook: WHITE,
    frameLook: WHITE,
    architrave: 'rounded',
  },
  'anatolija-staklo': {
    ...base,
    ...SILVER,
    kind: 'swing',
    style: 'arched-glass',
    handleSide: 'right',
    leafLook: WHITE,
    frameLook: WHITE,
    architrave: 'flat',
  },
  'bijela-zlatni-detalji': {
    ...base,
    kind: 'swing',
    style: 'gold-lines',
    handleSide: 'left',
    handleColor: '#c9a45c',
    handleMetal: 0.9,
    leafLook: WHITE,
    frameLook: WHITE,
    architrave: 'flat',
  },
  'dvokrilna-staklo-mreza': {
    ...base,
    leafWidth: 0.62,
    kind: 'double',
    style: 'glass-grid',
    // Svako krilo: dvije kolone i četiri reda stakla, puni donji dio.
    glassGrid: { cols: 2, rows: 4, solidBottom: 0.62 },
    handleSide: 'right',
    handleColor: '#1d1d1d',
    handleMetal: 0.3,
    leafLook: WHITE,
    frameLook: WHITE,
    architrave: 'flat',
  },
  'antracit-staklo-mreza': {
    ...base,
    kind: 'swing',
    style: 'glass-grid',
    // Mreža s dvije kolone i pet redova, prema fotografiji.
    glassGrid: { cols: 2, rows: 5, solidBottom: 0.12 },
    handleSide: 'right',
    handleColor: '#26272a',
    handleMetal: 0.4,
    leafLook: { kind: 'color', color: '#2e3034', roughness: 0.5 },
    frameLook: { kind: 'color', color: '#2e3034', roughness: 0.5 },
    architrave: 'flat',
  },
  'skrivena-siva': {
    ...base,
    kind: 'flush',
    style: 'flat',
    handleSide: 'right',
    handleColor: '#1d1d1d',
    handleMetal: 0.3,
    leafLook: { kind: 'color', color: '#c5c8c7', roughness: 0.6 },
    frameLook: { kind: 'color', color: '#c5c8c7', roughness: 0.6 },
    architrave: 'none',
    wallColor: '#cfd2d1',
  },
  'klizna-staklo': {
    ...base,
    leafWidth: 0.64,
    kind: 'sliding',
    style: 'sliding-glass',
    handleSide: 'right',
    handleColor: '#3b3833',
    handleMetal: 0.3,
    leafLook: { kind: 'color', color: '#d9c8a5', roughness: 0.55 },
    frameLook: { kind: 'color', color: '#d9c8a5', roughness: 0.55 },
    architrave: 'flat',
  },
};

const FINISH_LOOKS: Partial<Record<FinishId, Look>> = {
  bijela: WHITE,
  hrast: OAK,
  tamna: { kind: 'color', color: '#2e3034', roughness: 0.5 },
  siva: { kind: 'color', color: '#c5c8c7', roughness: 0.6 },
};

const HANDLE_LOOKS: Partial<Record<HandleId, { handleColor: string; handleMetal: number }>> = {
  srebrna: SILVER,
  crna: { handleColor: '#1d1d1d', handleMetal: 0.3 },
  zlatna: { handleColor: '#c9a45c', handleMetal: 0.9 },
};

export function hasProceduralSpec(productId: string): boolean {
  return productId in SPECS;
}

/** Spaja osnovnu postavku zapisa s željama iz konfiguratora (samo za ilustraciju). */
export function specFor(product: Product, cfg: Pick<DoorConfig, 'finish' | 'handle' | 'handleSide'>): DoorSpec | null {
  const s = SPECS[product.id];
  if (!s || !product.viewer.proceduralPreviewAllowed) return null;
  const spec: DoorSpec = { ...s };
  const finishLook = FINISH_LOOKS[cfg.finish];
  if (finishLook) {
    spec.leafLook = finishLook;
    if (spec.kind !== 'flush') spec.frameLook = finishLook;
    else spec.wallColor = WALL;
  }
  const handleLook = HANDLE_LOOKS[cfg.handle];
  if (handleLook) Object.assign(spec, handleLook);
  if (spec.kind === 'swing' || spec.kind === 'flush') {
    if (cfg.handleSide === 'lijevo') spec.handleSide = 'left';
    if (cfg.handleSide === 'desno') spec.handleSide = 'right';
  }
  return spec;
}

export function specKey(spec: DoorSpec): string {
  return JSON.stringify(spec);
}
