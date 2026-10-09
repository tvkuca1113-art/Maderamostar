import * as THREE from 'three';
import type { BuiltDoor } from './doorBuilder';

/** Orijentirana kutija u svjetskim koordinatama. */
export interface OBB {
  name: string;
  center: THREE.Vector3;
  axes: [THREE.Vector3, THREE.Vector3, THREE.Vector3];
  half: [number, number, number];
}

export function meshOBB(mesh: THREE.Mesh, shrink = 0): OBB {
  const geo = mesh.geometry;
  if (!geo.boundingBox) geo.computeBoundingBox();
  const bb = geo.boundingBox as THREE.Box3;
  const localCenter = bb.getCenter(new THREE.Vector3());
  const size = bb.getSize(new THREE.Vector3());
  const m = mesh.matrixWorld;
  const center = localCenter.clone().applyMatrix4(m);
  const ex = new THREE.Vector3().setFromMatrixColumn(m, 0);
  const ey = new THREE.Vector3().setFromMatrixColumn(m, 1);
  const ez = new THREE.Vector3().setFromMatrixColumn(m, 2);
  const sx = ex.length();
  const sy = ey.length();
  const sz = ez.length();
  return {
    name: mesh.name,
    center,
    axes: [ex.normalize(), ey.normalize(), ez.normalize()],
    half: [
      Math.max(0, (size.x * sx) / 2 - shrink),
      Math.max(0, (size.y * sy) / 2 - shrink),
      Math.max(0, (size.z * sz) / 2 - shrink),
    ],
  };
}

/** Test razdvajajuće ose (SAT) za dvije orijentirane kutije. */
export function obbIntersects(a: OBB, b: OBB): boolean {
  const axes: THREE.Vector3[] = [...a.axes, ...b.axes];
  for (const u of a.axes) {
    for (const v of b.axes) {
      const c = new THREE.Vector3().crossVectors(u, v);
      if (c.lengthSq() > 1e-10) axes.push(c.normalize());
    }
  }
  const d = new THREE.Vector3().subVectors(b.center, a.center);
  for (const L of axes) {
    const ra = a.half[0] * Math.abs(a.axes[0].dot(L)) + a.half[1] * Math.abs(a.axes[1].dot(L)) + a.half[2] * Math.abs(a.axes[2].dot(L));
    const rb = b.half[0] * Math.abs(b.axes[0].dot(L)) + b.half[1] * Math.abs(b.axes[1].dot(L)) + b.half[2] * Math.abs(b.axes[2].dot(L));
    if (Math.abs(d.dot(L)) > ra + rb) return false;
  }
  return true;
}

function meshesOf(obj: THREE.Object3D): THREE.Mesh[] {
  const out: THREE.Mesh[] = [];
  obj.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && !o.userData.noCollide) out.push(o as THREE.Mesh);
  });
  return out;
}

/**
 * Provjerava kolizije pomičnih dijelova (krila s kvakama) sa zidom, štokom, lajsnama, podom
 * i međusobno, u zadanom broju koraka od zatvorenog do potpuno otvorenog položaja.
 * Tolerancija `shrink` (m) uklanja lažne dodire na spojevima.
 */
export function findCollisions(door: BuiltDoor, steps = 24, shrink = 0.0005): string[] {
  const hits = new Set<string>();
  const statics = meshesOf(door.staticGroup);
  for (let i = 0; i <= steps; i++) {
    door.setOpen(i / steps);
    door.root.updateMatrixWorld(true);
    const staticBoxes = statics.map((m) => meshOBB(m, shrink));
    const leafBoxes = door.rigs.map((r) => meshesOf(r.pivot).map((m) => meshOBB(m, shrink)));
    leafBoxes.forEach((boxes, li) => {
      for (const a of boxes) {
        for (const s of staticBoxes) {
          if (obbIntersects(a, s)) hits.add(`${a.name} ↔ ${s.name} @ ${(i / steps).toFixed(2)}`);
        }
        for (let lj = li + 1; lj < leafBoxes.length; lj++) {
          for (const b of leafBoxes[lj]) {
            if (obbIntersects(a, b)) hits.add(`${a.name} ↔ ${b.name} @ ${(i / steps).toFixed(2)}`);
          }
        }
      }
    });
  }
  door.setOpen(0);
  return [...hits];
}
