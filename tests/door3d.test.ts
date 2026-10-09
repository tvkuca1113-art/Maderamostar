import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { products } from '../src/data';
import { buildDoor, MAX_SWING_RAD } from '../src/three/doorBuilder';
import { findCollisions } from '../src/three/collision';
import { specFor } from '../src/three/specs';
import { emptyConfig } from '../src/state/store';

const world = (o: THREE.Object3D) => {
  o.updateWorldMatrix(true, false);
  return new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
};

function find(root: THREE.Object3D, name: string): THREE.Object3D {
  const o = root.getObjectByName(name);
  if (!o) throw new Error(`Nema čvora ${name}`);
  return o;
}

describe('3D vrata — mehanika', () => {
  const hrast = products.find((p) => p.id === 'hrast-furnir-h')!;

  it('krilo, kvaka i rozeta se pomjeraju zajedno, okvir ostaje na mjestu', () => {
    const door = buildDoor(specFor(hrast, emptyConfig())!);
    const leaf = find(door.root, 'krilo-0');
    const handle = find(door.root, 'kvaka-0');
    const rosette = find(door.root, 'kvaka-0-rozeta');
    const jamb = find(door.root, 'stok-d');
    const arch = find(door.root, 'lajsna-g');

    // Kvaka i rozeta su potomci grupe krila.
    let p: THREE.Object3D | null = rosette;
    while (p && p !== leaf) p = p.parent;
    expect(p).toBe(leaf);
    expect(handle.parent).toBe(leaf);

    door.setOpen(0);
    door.root.updateMatrixWorld(true);
    const h0 = world(handle);
    const r0 = world(rosette);
    const j0 = world(jamb);
    const a0 = world(arch);
    const leafToHandle0 = h0.clone().sub(world(leaf)).length();

    door.setOpen(1);
    door.root.updateMatrixWorld(true);
    const h1 = world(handle);
    expect(h1.distanceTo(h0)).toBeGreaterThan(0.3);
    expect(world(rosette).distanceTo(r0)).toBeGreaterThan(0.3);
    // Udaljenost kvake od krila se ne mijenja (kruto tijelo).
    expect(h1.clone().sub(world(leaf)).length()).toBeCloseTo(leafToHandle0, 6);
    expect(world(jamb).distanceTo(j0)).toBe(0);
    expect(world(arch).distanceTo(a0)).toBe(0);
    // Krilo se otvara od posmatrača (u prostor iza zida).
    expect(h1.z).toBeLessThan(h0.z);
    expect(door.rigs[0].pivot.rotation.y).toBeCloseTo(-MAX_SWING_RAD, 6);
    door.dispose();
  });

  it('Hrast furnir H: kvaka lijevo kao na fotografiji, baglame desno', () => {
    const door = buildDoor(specFor(hrast, emptyConfig())!);
    door.root.updateMatrixWorld(true);
    expect(world(find(door.root, 'kvaka-0')).x).toBeLessThan(0);
    expect(door.rigs[0].pivot.position.x).toBeGreaterThan(0);
    door.dispose();
  });

  it('izbor „kvaka desno” zrcali stranu kvake i ose', () => {
    const door = buildDoor(specFor(hrast, { ...emptyConfig(), handleSide: 'desno' })!);
    door.root.updateMatrixWorld(true);
    expect(world(find(door.root, 'kvaka-0')).x).toBeGreaterThan(0);
    expect(door.rigs[0].pivot.position.x).toBeLessThan(0);
    door.dispose();
  });

  it('dvokrilna vrata imaju dva odvojena krila koja se otvaraju na suprotne strane', () => {
    const p = products.find((x) => x.id === 'dvokrilna-staklo-mreza')!;
    const door = buildDoor(specFor(p, emptyConfig())!);
    expect(door.rigs).toHaveLength(2);
    door.setOpen(1);
    expect(Math.sign(door.rigs[0].pivot.rotation.y)).toBe(-Math.sign(door.rigs[1].pivot.rotation.y));
    door.dispose();
  });

  it('klizna vrata klize, ne rotiraju', () => {
    const p = products.find((x) => x.id === 'klizna-staklo')!;
    const door = buildDoor(specFor(p, emptyConfig())!);
    door.setOpen(1);
    expect(door.rigs.every((r) => r.type === 'slide' && r.pivot.rotation.y === 0 && r.pivot.position.x !== 0)).toBe(true);
    door.dispose();
  });

  it('tamna staklena vrata imaju mrežu s dvije kolone i pet redova', () => {
    const p = products.find((x) => x.id === 'antracit-staklo-mreza')!;
    const door = buildDoor(specFor(p, emptyConfig())!);
    const names: string[] = [];
    door.root.traverse((o) => names.push(o.name));
    expect(names.filter((n) => /mreza-v/.test(n))).toHaveLength(1);
    expect(names.filter((n) => /mreza-h/.test(n))).toHaveLength(4);
    door.dispose();
  });

  it('provjera kolizija stvarno otkriva prolazak krila kroz zid', () => {
    const door = buildDoor(specFor(hrast, emptyConfig())!);
    door.rigs[0].max = Math.PI; // namjerno pogrešan raspon od 180°
    expect(findCollisions(door, 30).some((h) => /zid|stok/.test(h))).toBe(true);
    door.dispose();
  });

  for (const product of products) {
    for (const handleSide of ['nisam-siguran', 'lijevo', 'desno'] as const) {
      it(`bez kolizija: ${product.id} (${handleSide})`, () => {
        const spec = specFor(product, { ...emptyConfig(product.id), handleSide });
        expect(spec).not.toBeNull();
        const door = buildDoor(spec!);
        expect(findCollisions(door, 30)).toEqual([]);
        // Nema duplih vrata: tačno jedan pivot po krilu.
        const pivots: string[] = [];
        door.root.traverse((o) => o.name.startsWith('pivot-') && pivots.push(o.name));
        expect(pivots.length).toBe(door.rigs.length);
        door.dispose();
      });
    }
  }
});
