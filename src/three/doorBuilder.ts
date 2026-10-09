import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { oakTexture } from './textures';

/** Stvarne PBR teksture (učitava ih viewer). Bez njih (npr. u testovima) koriste se boje. */
export interface TextureKit {
  oak?: { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture };
  floor?: { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture };
  plaster?: THREE.Texture;
}

/**
 * Proceduralna, ilustrativna geometrija vrata. Nije proizvodni nacrt.
 *
 * Koordinate: x desno, y gore, z prema posmatraču. Prednja ploha zida je z = 0, pod je y = 0.
 * Svako krilo ima pivot grupu na osi baglama (zaokretna vrata) ili na vodilici (klizna).
 * Kvaka i rozeta su djeca grupe krila, pa se pomjeraju s krilom; zid, štok i lajsne su u grupi 'static'.
 */

export type DoorKind = 'swing' | 'double' | 'sliding' | 'flush';
export type LeafStyle =
  | 'oak-h'
  | 'grooves'
  | 'flat'
  | 'two-panels'
  | 'arched-glass'
  | 'gold-lines'
  | 'glass-grid'
  | 'sliding-glass';

export type Look = { kind: 'oak' } | { kind: 'color'; color: string; roughness?: number };

export interface DoorSpec {
  kind: DoorKind;
  style: LeafStyle;
  /** Širina jednog krila u metrima (demonstracijska proporcija). */
  leafWidth: number;
  leafHeight: number;
  leafThickness: number;
  wallThickness: number;
  /** Strana kvake gledano s prednje strane; baglame su na suprotnoj strani. */
  handleSide: 'left' | 'right';
  leafLook: Look;
  frameLook: Look;
  handleColor: string;
  handleMetal: number;
  architrave: 'rounded' | 'flat' | 'none';
  wallColor: string;
  grooves?: { count: number; color: string };
  glassGrid?: { cols: number; rows: number; solidBottom: number };
}

export interface LeafRig {
  pivot: THREE.Group;
  type: 'rotate' | 'slide';
  /** +1 / -1: smjer rotacije oko y ose ili smjer klizanja po x osi. */
  direction: 1 | -1;
  /** Maksimalni ugao (rad) ili put klizanja (m). */
  max: number;
}

export interface BuiltDoor {
  root: THREE.Group;
  staticGroup: THREE.Group;
  rigs: LeafRig[];
  /** Otvorenost 0 (zatvoreno) do 1 (maksimalno otvoreno). */
  setOpen(t: number): void;
  dispose(): void;
}

export { DEMO_DIMENSIONS } from './dimensions';
export const MAX_SWING_RAD = THREE.MathUtils.degToRad(75);

const GAP = 0.003; // zazor krilo–štok
const CENTER_GAP = 0.004; // zazor između krila dvokrilnih vrata
const FLOOR_GAP = 0.008;
const JAMB = 0.03; // vidljiva širina štoka u otvoru
const JAMB_FLUSH = 0.006; // skriveni aluminijski okvir
const ARCH_W = 0.075;
const ARCH_T = 0.018;
const WALL_W = 7;
const WALL_H = 3.0;
const HANDLE_Y = 1.05; // visina kvake od dna krila
const HANDLE_INSET = 0.065; // os kvake od slobodnog ruba

/** Hrastova tekstura pokriva približno 0,43 × 0,82 m plohe (isječak originalne fotografije). */
const OAK_TILE_U = 0.43;
const OAK_TILE_V = 0.82;

class Materials {
  private list: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];

  constructor(private kit: TextureKit = {}) {}

  track<T extends THREE.Material>(m: T): T {
    this.list.push(m);
    return m;
  }

  private tex(src: THREE.Texture, repeatX: number, repeatY: number, rotate: boolean) {
    const t = src.clone();
    t.wrapS = THREE.MirroredRepeatWrapping;
    t.wrapT = THREE.MirroredRepeatWrapping;
    t.repeat.set(repeatX, repeatY);
    t.center.set(0.5, 0.5);
    t.rotation = rotate ? Math.PI / 2 : 0;
    t.needsUpdate = true;
    this.textures.push(t);
    return t;
  }

  /** Materijal za plohu određene veličine; za hrast prilagođava gustoću i smjer godova. */
  surface(look: Look, faceW: number, faceH: number, grain: 'vertical' | 'horizontal' = 'vertical') {
    if (look.kind === 'oak') {
      const oak = this.kit.oak;
      if (oak) {
        // Vodoravni godovi: tekstura bez rotacije. Uspravni: rotacija 90°, pa se ponavljanje zamjenjuje.
        const vertical = grain === 'vertical';
        const rx = vertical ? faceW / OAK_TILE_V : faceW / OAK_TILE_U;
        const ry = vertical ? faceH / OAK_TILE_U : faceH / OAK_TILE_V;
        return this.track(
          new THREE.MeshPhysicalMaterial({
            // Blagi topli ton: nadoknađuje ACES tonsko mapiranje, bliže medenoj nijansi s fotografije.
            color: new THREE.Color(0.93, 0.8, 0.64),
            map: this.tex(oak.map, rx, ry, vertical),
            normalMap: this.tex(oak.normalMap, rx, ry, vertical),
            normalScale: new THREE.Vector2(0.45, 0.45),
            roughnessMap: this.tex(oak.roughnessMap, rx, ry, vertical),
            roughness: 1,
            clearcoat: 0.18,
            clearcoatRoughness: 0.45,
            sheen: 0.2,
            sheenRoughness: 0.6,
            sheenColor: new THREE.Color('#f2d2a8'),
          }),
        );
      }
      const base = oakTexture(grain);
      if (!base) return this.track(new THREE.MeshStandardMaterial({ color: '#C08E5C', roughness: 0.6 }));
      const tex = base.clone();
      tex.needsUpdate = true;
      if (grain === 'vertical') tex.repeat.set(faceW / 0.5, faceH / 1.0);
      else tex.repeat.set(faceW / 1.0, faceH / 0.5);
      this.textures.push(tex);
      return this.track(new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0 }));
    }
    // Lakirane plohe: satenski lak s blagim slojem laka (clearcoat) za realne odsjaje.
    return this.track(
      new THREE.MeshPhysicalMaterial({
        color: look.color,
        roughness: look.roughness ?? 0.42,
        metalness: 0,
        clearcoat: 0.3,
        clearcoatRoughness: 0.32,
      }),
    );
  }

  color(color: string, roughness = 0.5, metalness = 0) {
    return this.track(new THREE.MeshStandardMaterial({ color, roughness, metalness }));
  }

  metal(color: string, metalness: number) {
    return this.track(new THREE.MeshStandardMaterial({ color, metalness, roughness: metalness > 0.5 ? 0.22 : 0.48, envMapIntensity: 1.3 }));
  }

  wall(color: string) {
    const n = this.kit.plaster;
    return this.track(
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.94,
        normalMap: n ? this.tex(n, 6, 3, false) : null,
        normalScale: new THREE.Vector2(0.35, 0.35),
      }),
    );
  }

  floor() {
    const f = this.kit.floor;
    if (!f) return this.color('#e7dfd2', 0.75);
    const r = (WALL_W * 2) / 1.2;
    const rz = 8 / 1.2;
    const mk = (t: THREE.Texture) => {
      const c = t.clone();
      c.wrapS = THREE.RepeatWrapping;
      c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(r, rz);
      c.needsUpdate = true;
      this.textures.push(c);
      return c;
    };
    return this.track(
      new THREE.MeshStandardMaterial({ map: mk(f.map), normalMap: mk(f.normalMap), roughnessMap: mk(f.roughnessMap), roughness: 1, envMapIntensity: 0.9 }),
    );
  }

  glass() {
    return this.track(
      new THREE.MeshPhysicalMaterial({
        color: '#f2f7f7',
        roughness: 0.03,
        metalness: 0,
        transparent: true,
        opacity: 0.16,
        envMapIntensity: 2,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
  }

  dispose() {
    this.list.forEach((m) => m.dispose());
    this.textures.forEach((t) => t.dispose());
  }
}

/**
 * Kutija zadana minimalnim i maksimalnim koordinatama. Dovoljno debele kutije dobijaju
 * blago zaobljene rubove (2–3 mm), što daje realne odsjaje na bridovima krila i okvira.
 */
function box(name: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat: THREE.Material) {
  const w = Math.abs(x1 - x0);
  const h = Math.abs(y1 - y0);
  const d = Math.abs(z1 - z0);
  const min = Math.min(w, h, d);
  const geo = min >= 0.012 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(0.003, min * 0.25)) : new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

type Hole = { kind: 'rect'; x0: number; x1: number; y0: number; y1: number } | { kind: 'arch'; x0: number; x1: number; y0: number; yShoulder: number; yPeak: number };

function drawHole<T extends THREE.Path>(p: T, h: Hole): T {
  if (h.kind === 'rect') {
    p.moveTo(h.x0, h.y0);
    p.lineTo(h.x0, h.y1);
    p.lineTo(h.x1, h.y1);
    p.lineTo(h.x1, h.y0);
    p.lineTo(h.x0, h.y0);
  } else {
    p.moveTo(h.x0, h.y0);
    p.lineTo(h.x0, h.yShoulder);
    // Kontrolna tačka je postavljena tako da vrh luka bude tačno na yPeak.
    p.quadraticCurveTo((h.x0 + h.x1) / 2, 2 * h.yPeak - h.yShoulder, h.x1, h.yShoulder);
    p.lineTo(h.x1, h.y0);
    p.lineTo(h.x0, h.y0);
  }
  return p;
}

const holePath = (h: Hole) => drawHole(new THREE.Path(), h);
const holeShape = (h: Hole) => drawHole(new THREE.Shape(), h);

/**
 * Planarna projekcija UV koordinata (x/w, y/h) za izvučenu geometriju, kako bi se
 * tekstura furnira ponašala isto kao na običnim kutijama (bez rastezanja).
 */
function planarUV(geo: THREE.BufferGeometry, x0: number, y0: number, w: number, h: number) {
  const pos = geo.getAttribute('position');
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - x0) / w;
    uv[i * 2 + 1] = (pos.getY(i) - y0) / h;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/** Ploča krila u prostoru krila: x∈[0,w], y∈[0,h], z∈[0,t] (prednja ploha je z = t). */
function slab(name: string, w: number, h: number, t: number, holes: Hole[], mat: THREE.Material, x0 = 0, y0 = 0) {
  if (holes.length === 0) return box(name, x0, x0 + w, y0, y0 + h, 0, t, mat);
  const shape = new THREE.Shape();
  shape.moveTo(x0, y0);
  shape.lineTo(x0 + w, y0);
  shape.lineTo(x0 + w, y0 + h);
  shape.lineTo(x0, y0 + h);
  shape.lineTo(x0, y0);
  shape.holes = holes.map(holePath);
  // Bevel ide prema van, pa je obris uvučen za veličinu bevela: vanjske mjere ostaju tačne.
  const b = 0.0018;
  const inner = new THREE.Shape();
  inner.moveTo(x0 + b, y0 + b);
  inner.lineTo(x0 + w - b, y0 + b);
  inner.lineTo(x0 + w - b, y0 + h - b);
  inner.lineTo(x0 + b, y0 + h - b);
  inner.lineTo(x0 + b, y0 + b);
  inner.holes = shape.holes;
  const geo = new THREE.ExtrudeGeometry(inner, { depth: t - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelSegments: 2, curveSegments: 24 });
  geo.translate(0, 0, b);
  planarUV(geo, x0, y0, w, h);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Profil lajsne (presjek) izvučen duž dužine L. Unutrašnji rub je na x = 0, vanjski na x = dir·ARCH_W. */
function architravePiece(name: string, length: number, dir: 1 | -1, rounded: boolean, mat: THREE.Material) {
  if (!rounded) {
    // Geometrija je pomjerena tako da je ishodište na unutrašnjem rubu, kao kod zaobljenog profila.
    const geo = new THREE.BoxGeometry(ARCH_W, length, ARCH_T);
    geo.translate((dir * ARCH_W) / 2, length / 2, ARCH_T / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(dir * ARCH_W, 0);
  s.lineTo(dir * ARCH_W, ARCH_T * 0.32);
  s.quadraticCurveTo(dir * ARCH_W, ARCH_T, dir * ARCH_W * 0.42, ARCH_T);
  s.lineTo(0, ARCH_T);
  s.lineTo(0, 0);
  const geo = new THREE.ExtrudeGeometry(s, { depth: length, bevelEnabled: false, curveSegments: 10 });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, length, 0);
  // Nakon rotacije: x = presjek, y = dužina, z = dubina profila (prema posmatraču).
  geo.computeVertexNormals();
  planarUV(geo, dir > 0 ? 0 : -ARCH_W, 0, ARCH_W, length);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Rozeta s oborenim rubom (okretanjem profila), okrenuta prema +z. */
function rosetteGeo(r: number, depth: number) {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(r, 0),
    new THREE.Vector2(r, depth * 0.45),
    new THREE.Vector2(r * 0.86, depth),
    new THREE.Vector2(0, depth),
  ];
  const g = new THREE.LatheGeometry(pts, 40);
  g.rotateX(Math.PI / 2);
  return g;
}

/** Kvaka s rozetom i rozetom ključa; ručica je blago savijena i pokazuje prema baglamama. */
function buildHandle(name: string, mats: Materials, color: string, metal: number, towardHinge: 1 | -1, t: number) {
  const g = new THREE.Group();
  g.name = name;
  const mat = mats.metal(color, metal);
  const dark = mats.color('#1d1d1d', 0.6, 0.2);
  for (const side of [1, -1] as const) {
    const faceZ = side > 0 ? t : 0;
    const rosette = new THREE.Mesh(rosetteGeo(0.026, 0.009), mat);
    rosette.name = `${name}-rozeta`;
    rosette.position.set(0, 0, faceZ);
    rosette.scale.z = side;
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.011, 0.05, 24), mat);
    neck.rotation.x = Math.PI / 2;
    neck.position.set(0, 0, faceZ + side * 0.03);
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(towardHinge * 0.035, 0.001, side * 0.004),
      new THREE.Vector3(towardHinge * 0.085, -0.003, side * 0.007),
      new THREE.Vector3(towardHinge * 0.128, -0.009, side * 0.004),
    ]);
    const lever = new THREE.Mesh(new THREE.TubeGeometry(path, 32, 0.0088, 16, false), mat);
    lever.name = `${name}-ručica`;
    lever.position.set(0, 0, faceZ + side * 0.055);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0088, 16, 12), mat);
    tip.position.set(towardHinge * 0.128, -0.009, faceZ + side * 0.059);
    const keyRose = new THREE.Mesh(rosetteGeo(0.02, 0.008), mat);
    keyRose.position.set(0, -0.09, faceZ);
    keyRose.scale.z = side;
    const keyHole = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.002, 12), dark);
    keyHole.rotation.x = Math.PI / 2;
    keyHole.position.set(0, -0.09, faceZ + side * 0.0085);
    [rosette, neck, lever, tip, keyRose, keyHole].forEach((m) => {
      m.castShadow = true;
      g.add(m);
    });
  }
  return g;
}

/** Baglame (ležajevi) na osi okretanja; ne ulaze u provjeru kolizija jer su dio spoja krila i štoka. */
function addHinges(pivot: THREE.Group, mats: Materials, color: string, metal: number, leafHeight: number) {
  const mat = mats.metal(color, metal);
  for (const y of [0.22, leafHeight - 0.24]) {
    const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.11, 20), mat);
    hinge.name = 'baglama';
    hinge.userData.noCollide = true;
    hinge.position.set(0, y, 0);
    hinge.castShadow = true;
    pivot.add(hinge);
  }
}

/** Ugrađeni prihvat za klizna vrata. */
function buildRecessedPull(name: string, mats: Materials, t: number) {
  const g = new THREE.Group();
  g.name = name;
  const mat = mats.color('#3b3833', 0.5, 0.4);
  g.add(box(`${name}-prednji`, -0.016, 0.016, -0.08, 0.08, t, t + 0.0015, mat));
  g.add(box(`${name}-zadnji`, -0.016, 0.016, -0.08, 0.08, -0.0015, 0, mat));
  return g;
}

/** Profilirana ploha: četiri letvice i blago izdignuto polje, na obje strane krila. */
function addPanelMolding(leaf: THREE.Group, name: string, x0: number, x1: number, y0: number, y1: number, t: number, mat: THREE.Material, panelMat: THREE.Material) {
  const m = 0.028;
  const d = 0.007;
  for (const side of [1, -1] as const) {
    const za = side > 0 ? t : -d;
    const zb = side > 0 ? t + d : 0;
    leaf.add(box(`${name}-l${side}`, x0, x0 + m, y0, y1, za, zb, mat));
    leaf.add(box(`${name}-r${side}`, x1 - m, x1, y0, y1, za, zb, mat));
    leaf.add(box(`${name}-t${side}`, x0 + m, x1 - m, y1 - m, y1, za, zb, mat));
    leaf.add(box(`${name}-b${side}`, x0 + m, x1 - m, y0, y0 + m, za, zb, mat));
    const pz0 = side > 0 ? t : -0.003;
    const pz1 = side > 0 ? t + 0.003 : 0;
    leaf.add(box(`${name}-polje${side}`, x0 + m + 0.012, x1 - m - 0.012, y0 + m + 0.012, y1 - m - 0.012, pz0, pz1, panelMat));
  }
}

function addGlassRect(leaf: THREE.Group, name: string, h: Extract<Hole, { kind: 'rect' }>, t: number, mats: Materials, beadMat: THREE.Material, grid?: { cols: number; rows: number }) {
  const glass = box(`${name}-staklo`, h.x0, h.x1, h.y0, h.y1, t / 2 - 0.003, t / 2 + 0.003, mats.glass());
  glass.castShadow = false;
  leaf.add(glass);
  const b = 0.012;
  const d = 0.008;
  for (const side of [1, -1] as const) {
    const za = side > 0 ? t : -d;
    const zb = side > 0 ? t + d : 0;
    leaf.add(box(`${name}-letva-l${side}`, h.x0, h.x0 + b, h.y0, h.y1, za, zb, beadMat));
    leaf.add(box(`${name}-letva-r${side}`, h.x1 - b, h.x1, h.y0, h.y1, za, zb, beadMat));
    leaf.add(box(`${name}-letva-t${side}`, h.x0 + b, h.x1 - b, h.y1 - b, h.y1, za, zb, beadMat));
    leaf.add(box(`${name}-letva-b${side}`, h.x0 + b, h.x1 - b, h.y0, h.y0 + b, za, zb, beadMat));
  }
  if (grid) {
    const mw = 0.022;
    // Mreža prolazi kroz staklo i vidljiva je s obje strane.
    for (let c = 1; c < grid.cols; c++) {
      const x = h.x0 + ((h.x1 - h.x0) * c) / grid.cols;
      leaf.add(box(`${name}-mreza-v${c}`, x - mw / 2, x + mw / 2, h.y0, h.y1, -0.004, t + 0.004, beadMat));
    }
    for (let r = 1; r < grid.rows; r++) {
      const y = h.y0 + ((h.y1 - h.y0) * r) / grid.rows;
      leaf.add(box(`${name}-mreza-h${r}`, h.x0, h.x1, y - mw / 2, y + mw / 2, -0.004, t + 0.004, beadMat));
    }
  }
}

/**
 * Gradi sadržaj jednog krila u prostoru krila (x∈[0,w], y∈[0,h], z∈[0,t]).
 * handleAtX je x položaj ose kvake (ili null), towardHinge smjer prema baglamama.
 */
function buildLeaf(spec: DoorSpec, mats: Materials, index: number, w: number, handleAtX: number | null, towardHinge: 1 | -1, pull?: number) {
  const leaf = new THREE.Group();
  leaf.name = `krilo-${index}`;
  const h = spec.leafHeight;
  const t = spec.leafThickness;
  const look = spec.leafLook;
  const plainMat = mats.surface(look, w, h);
  const n = `krilo-${index}`;

  switch (spec.style) {
    case 'oak-h': {
      // Bočni dijelovi s uspravnim godovima, središnje polje s vodoravnim godovima (prema fotografiji).
      const stile = 0.13;
      leaf.add(box(`${n}-bok-l`, 0, stile, 0, h, 0, t, mats.surface(look, stile, h, 'vertical')));
      leaf.add(box(`${n}-bok-d`, w - stile, w, 0, h, 0, t, mats.surface(look, stile, h, 'vertical')));
      leaf.add(box(`${n}-polje`, stile, w - stile, 0, h, 0.0005, t - 0.0005, mats.surface(look, w - 2 * stile, h, 'horizontal')));
      break;
    }
    case 'grooves': {
      leaf.add(slab(`${n}-ploca`, w, h, t, [], plainMat));
      const g = spec.grooves ?? { count: 4, color: '#cfcfca' };
      const gm = mats.color(g.color, 0.7);
      for (let i = 1; i <= g.count; i++) {
        const y = (h * i) / (g.count + 1);
        leaf.add(box(`${n}-linija${i}`, 0.035, w - 0.035, y - 0.0025, y + 0.0025, t, t + 0.0006, gm));
        leaf.add(box(`${n}-linija${i}-z`, 0.035, w - 0.035, y - 0.0025, y + 0.0025, -0.0006, 0, gm));
      }
      break;
    }
    case 'two-panels': {
      leaf.add(slab(`${n}-ploca`, w, h, t, [], plainMat));
      const edge = look.kind === 'color' ? mats.color(shade(look.color, -0.05), 0.5) : plainMat;
      addPanelMolding(leaf, `${n}-gornja`, 0.12, w - 0.12, 1.06, h - 0.13, t, edge, plainMat);
      addPanelMolding(leaf, `${n}-donja`, 0.12, w - 0.12, 0.13, 0.94, t, edge, plainMat);
      break;
    }
    case 'arched-glass': {
      // Položaji su zadani za krilo od 2,00 m i skaliraju se s visinom krila.
      const k = h / 2;
      const hole: Hole = { kind: 'arch', x0: 0.17, x1: w - 0.17, y0: 1.04 * k, yShoulder: 1.66 * k, yPeak: 1.78 * k };
      leaf.add(slab(`${n}-ploca`, w, h, t, [hole], plainMat));
      const glassGeo = new THREE.ShapeGeometry(holeShape(hole), 24);
      const glass = new THREE.Mesh(glassGeo, mats.glass());
      glass.name = `${n}-staklo`;
      glass.position.z = t / 2;
      leaf.add(glass);
      // Tri dekorativne linije na staklu, kao na fotografiji.
      const lineMat = mats.color('#9a7a52', 0.4, 0.5);
      [1.2 * k, 1.34 * k, 1.48 * k].forEach((y, i) => {
        leaf.add(box(`${n}-ukras${i}`, 0.175, w - 0.175, y - 0.006, y + 0.006, t / 2 + 0.003, t / 2 + 0.005, lineMat));
        leaf.add(box(`${n}-ukras${i}-z`, 0.175, w - 0.175, y - 0.006, y + 0.006, t / 2 - 0.005, t / 2 - 0.003, lineMat));
      });
      const edge = look.kind === 'color' ? mats.color(shade(look.color, -0.05), 0.5) : plainMat;
      addPanelMolding(leaf, `${n}-donja`, 0.15, w - 0.15, 0.15, 0.88, t, edge, plainMat);
      break;
    }
    case 'gold-lines': {
      leaf.add(slab(`${n}-ploca`, w, h, t, [], plainMat));
      const gold = mats.color('#c9a45c', 0.3, 0.9);
      // Tri okomite zlatne linije uz stranu kvake.
      const handleLeft = handleAtX !== null && handleAtX < w / 2;
      for (let i = 0; i < 3; i++) {
        const off = 0.15 + i * 0.03;
        const x = handleLeft ? off : w - off;
        leaf.add(box(`${n}-zlato${i}`, x - 0.003, x + 0.003, 0.3, h - 0.02, t, t + 0.0008, gold));
        leaf.add(box(`${n}-zlato${i}-z`, x - 0.003, x + 0.003, 0.3, h - 0.02, -0.0008, 0, gold));
      }
      break;
    }
    case 'glass-grid': {
      const grid = spec.glassGrid ?? { cols: 2, rows: 5, solidBottom: 0.12 };
      const hole: Extract<Hole, { kind: 'rect' }> = { kind: 'rect', x0: 0.085, x1: w - 0.085, y0: grid.solidBottom, y1: h - 0.085 };
      leaf.add(slab(`${n}-ploca`, w, h, t, [hole], plainMat));
      const bead = look.kind === 'color' ? mats.color(look.color, look.roughness ?? 0.5) : plainMat;
      addGlassRect(leaf, n, hole, t, mats, bead, grid);
      if (grid.solidBottom > 0.3) {
        const edge = look.kind === 'color' ? mats.color(shade(look.color, -0.04), 0.5) : plainMat;
        addPanelMolding(leaf, `${n}-donja`, 0.11, w - 0.11, 0.11, grid.solidBottom - 0.09, t, edge, plainMat);
      }
      break;
    }
    case 'sliding-glass': {
      const hole: Extract<Hole, { kind: 'rect' }> = { kind: 'rect', x0: w * 0.36, x1: w * 0.36 + 0.15, y0: 0.32, y1: h - 0.2 };
      leaf.add(slab(`${n}-ploca`, w, h, t, [hole], plainMat));
      addGlassRect(leaf, n, hole, t, mats, mats.color(shade(look.kind === 'color' ? look.color : '#c08e5c', -0.06), 0.5));
      break;
    }
    case 'flat':
    default:
      leaf.add(slab(`${n}-ploca`, w, h, t, [], plainMat));
  }

  if (handleAtX !== null) {
    const handle = buildHandle(`kvaka-${index}`, mats, spec.handleColor, spec.handleMetal, towardHinge, t);
    handle.position.set(handleAtX, HANDLE_Y, 0);
    leaf.add(handle);
  }
  if (pull !== undefined) {
    const p = buildRecessedPull(`prihvat-${index}`, mats, t);
    p.position.set(pull, 1.0, 0);
    leaf.add(p);
  }
  return leaf;
}

function shade(hex: string, amount: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + amount, 0, 1));
  return `#${c.getHexString()}`;
}

export function buildDoor(spec: DoorSpec, kit?: TextureKit): BuiltDoor {
  const mats = new Materials(kit);
  const root = new THREE.Group();
  root.name = 'vrata';
  const staticGroup = new THREE.Group();
  staticGroup.name = 'static';
  root.add(staticGroup);

  const t = spec.leafThickness;
  const wallT = spec.wallThickness;
  const lw = spec.leafWidth;
  const flush = spec.kind === 'flush';
  const sliding = spec.kind === 'sliding';
  const leafCount = spec.kind === 'double' || sliding ? 2 : 1;

  // Svijetli otvor između štokova.
  const openW = sliding ? 2 * lw - 0.08 : leafCount * lw + 2 * GAP + (leafCount === 2 ? CENTER_GAP : 0);
  const openH = sliding ? spec.leafHeight - 0.03 : spec.leafHeight + FLOOR_GAP + GAP;
  const jamb = flush ? JAMB_FLUSH : JAMB;
  const holeW = openW + 2 * jamb;
  const holeH = openH + jamb;

  const wallMat = mats.wall(spec.wallColor);
  const frameMat = mats.surface(spec.frameLook, jamb, openH, 'vertical');
  const frameMatH = mats.surface(spec.frameLook, openW, jamb, 'horizontal');
  const flushFrame = mats.color('#3a3a3a', 0.5, 0.4);

  // Zid s otvorom.
  staticGroup.add(box('zid-l', -WALL_W / 2, -holeW / 2, 0, WALL_H, -wallT, 0, wallMat));
  staticGroup.add(box('zid-d', holeW / 2, WALL_W / 2, 0, WALL_H, -wallT, 0, wallMat));
  staticGroup.add(box('zid-g', -holeW / 2, holeW / 2, holeH, WALL_H, -wallT, 0, wallMat));
  // Štok (fiksni okvir) po cijeloj dubini zida.
  const jm = flush ? flushFrame : frameMat;
  const jmh = flush ? flushFrame : frameMatH;
  staticGroup.add(box('stok-l', -holeW / 2, -openW / 2, 0, holeH, -wallT, 0, jm));
  staticGroup.add(box('stok-d', openW / 2, holeW / 2, 0, holeH, -wallT, 0, jm));
  staticGroup.add(box('stok-g', -openW / 2, openW / 2, openH, holeH, -wallT, 0, jmh));
  // Pod (tanka ploča ispod y = 0, služi i za provjeru kolizije).
  staticGroup.add(box('pod', -WALL_W, WALL_W, -0.05, 0, -4, 4, mats.floor()));
  // Sokl (podna lajsna) uz zid, s obje strane otvora.
  const skirtMat = mats.color(new THREE.Color(spec.wallColor).offsetHSL(0, 0, -0.04).getStyle(), 0.6);
  const skirtEdge = flush || spec.architrave === 'none' ? holeW / 2 : openW / 2 + ARCH_W;
  staticGroup.add(box('sokl-l', -WALL_W / 2, -skirtEdge, 0, 0.08, 0, 0.012, skirtMat));
  staticGroup.add(box('sokl-d', skirtEdge, WALL_W / 2, 0, 0.08, 0, 0.012, skirtMat));

  // Lajsne na prednjoj strani zida.
  if (spec.architrave !== 'none' && !flush) {
    const rounded = spec.architrave === 'rounded';
    const archMat = mats.surface(spec.frameLook, ARCH_W, openH + ARCH_W, 'vertical');
    // Gornja lajsna je zarotirana kopija uspravne, pa i ona koristi godove duž svoje dužine.
    const archMatH = mats.surface(spec.frameLook, ARCH_W, openW + 2 * ARCH_W, 'vertical');
    const left = architravePiece('lajsna-l', openH, -1, rounded, archMat);
    left.position.set(-openW / 2, 0, 0);
    const right = architravePiece('lajsna-d', openH, 1, rounded, archMat);
    right.position.set(openW / 2, 0, 0);
    const top = architravePiece('lajsna-g', openW + 2 * ARCH_W, 1, rounded, archMatH);
    // Gornja lajsna: rotacija za 90° okreće unutrašnji rub prema otvoru, a dužinu po x osi.
    top.rotation.set(0, 0, Math.PI / 2);
    top.position.set(openW / 2 + ARCH_W, openH, 0);
    staticGroup.add(left, right, top);
    // Lajsne i na stražnjoj strani zida (vidljive iz pogleda „druga strana”).
    [left, right, top].forEach((piece) => {
      const back = piece.clone();
      back.name = `${piece.name}-z`;
      back.position.z = -wallT;
      back.scale.z = -1;
      staticGroup.add(back);
    });
  }

  const rigs: LeafRig[] = [];
  const leafFrontZ = flush ? 0 : 0.004;

  if (sliding) {
    // Dva krila na nadgradnoj vodilici ispred zida; svako klizi prema svojoj strani.
    const z0 = ARCH_T + 0.01;
    const trackMat = mats.color('#b9ab8e', 0.5);
    const trackW = 4 * lw + 0.1;
    staticGroup.add(box('vodilica', -trackW / 2, trackW / 2, spec.leafHeight + 0.01, spec.leafHeight + 0.1, 0, z0 + t + 0.02, trackMat));
    [-1, 1].forEach((side, i) => {
      const pivot = new THREE.Group();
      pivot.name = `pivot-${i}`;
      const pullX = side < 0 ? lw - 0.07 : 0.07;
      const leaf = buildLeaf(spec, mats, i, lw, null, 1, pullX);
      const x0 = side < 0 ? -lw - GAP / 2 : GAP / 2;
      leaf.position.set(x0, 0.008, z0);
      pivot.add(leaf);
      root.add(pivot);
      rigs.push({ pivot, type: 'slide', direction: side as 1 | -1, max: lw + 0.01 });
    });
  } else if (spec.kind === 'double') {
    // Dva odvojena krila, baglame na vanjskim rubovima, kvaka na desnom krilu uz sredinu.
    [-1, 1].forEach((side, i) => {
      const hingeX = side < 0 ? -openW / 2 + GAP : openW / 2 - GAP;
      const pivot = new THREE.Group();
      pivot.name = `pivot-${i}`;
      pivot.position.set(hingeX, FLOOR_GAP, leafFrontZ - t);
      const hingeLeft = side < 0;
      const handleX = hingeLeft ? null : HANDLE_INSET;
      const leaf = buildLeaf(spec, mats, i, lw, handleX, hingeLeft ? -1 : 1);
      leaf.position.set(hingeLeft ? 0 : -lw, 0, 0);
      pivot.add(leaf);
      root.add(pivot);
      rigs.push({ pivot, type: 'rotate', direction: hingeLeft ? 1 : -1, max: MAX_SWING_RAD });
    });
  } else {
    // Jednokrilna zaokretna ili skrivena vrata. Baglame na strani suprotnoj kvaki.
    const hingeLeft = spec.handleSide === 'right';
    const hingeX = hingeLeft ? -lw / 2 : lw / 2;
    const pivot = new THREE.Group();
    pivot.name = 'pivot-0';
    // Pivot je na stražnjem rubu krila uz baglame, pa krilo pri otvaranju ne ulazi u štok.
    pivot.position.set(hingeX, FLOOR_GAP, leafFrontZ - t);
    const handleX = hingeLeft ? lw - HANDLE_INSET : HANDLE_INSET;
    const leaf = buildLeaf(spec, mats, 0, lw, handleX, hingeLeft ? -1 : 1);
    leaf.position.set(hingeLeft ? 0 : -lw, 0, 0);
    pivot.add(leaf);
    root.add(pivot);
    if (!flush) addHinges(pivot, mats, spec.handleColor, spec.handleMetal, spec.leafHeight);
    rigs.push({ pivot, type: 'rotate', direction: hingeLeft ? 1 : -1, max: MAX_SWING_RAD });
  }

  const setOpen = (raw: number) => {
    const k = THREE.MathUtils.clamp(raw, 0, 1);
    for (const rig of rigs) {
      if (rig.type === 'rotate') rig.pivot.rotation.y = rig.direction * rig.max * k;
      else rig.pivot.position.x = rig.direction * rig.max * k;
    }
  };

  return {
    root,
    staticGroup,
    rigs,
    setOpen,
    dispose() {
      root.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
      });
      mats.dispose();
    },
  };
}
