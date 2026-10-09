import * as THREE from 'three';

/**
 * Diskretan proceduralni uzorak hrastovog furnira (bez fotografije kvake ili okvira).
 * 'vertical' = godovi uspravno (štok, lajsne, bočni dijelovi), 'horizontal' = vodoravno (središnje polje).
 * U okruženju bez canvasa (testovi) vraća null, a materijal koristi samo boju.
 */

const cache = new Map<string, THREE.CanvasTexture | null>();

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function drawOak(ctx: CanvasRenderingContext2D, w: number, h: number, horizontal: boolean) {
  const rnd = seeded(horizontal ? 7 : 13);
  ctx.fillStyle = '#C39260';
  ctx.fillRect(0, 0, w, h);
  // Duž = smjer godova; poprečno = mjesto linije.
  const along = horizontal ? w : h;
  const across = horizontal ? h : w;
  // Široke tonske trake
  for (let i = 0; i < 26; i++) {
    const pos = rnd() * across;
    const width = 6 + rnd() * 26;
    const light = rnd() > 0.5;
    ctx.fillStyle = light ? `rgba(222,178,124,${0.12 + rnd() * 0.16})` : `rgba(140,92,50,${0.08 + rnd() * 0.12})`;
    if (horizontal) ctx.fillRect(0, pos, along, width);
    else ctx.fillRect(pos, 0, width, along);
  }
  // Fini godovi
  for (let i = 0; i < 520; i++) {
    const pos = rnd() * across;
    const alpha = 0.05 + rnd() * 0.2;
    const dark = rnd() > 0.35;
    ctx.strokeStyle = dark ? `rgba(110,68,34,${alpha})` : `rgba(235,196,146,${alpha})`;
    ctx.lineWidth = 0.6 + rnd() * 1.6;
    ctx.beginPath();
    const wave = rnd() * 2.5;
    const freq = 0.004 + rnd() * 0.01;
    const phase = rnd() * 10;
    for (let t = 0; t <= along; t += 16) {
      const off = Math.sin(t * freq + phase) * wave;
      const x = horizontal ? t : pos + off;
      const y = horizontal ? pos + off : t;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Pore
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    ctx.fillStyle = `rgba(90,55,25,${0.05 + rnd() * 0.12})`;
    if (horizontal) ctx.fillRect(x, y, 2 + rnd() * 5, 0.8);
    else ctx.fillRect(x, y, 0.8, 2 + rnd() * 5);
  }
}

export function oakTexture(direction: 'vertical' | 'horizontal'): THREE.CanvasTexture | null {
  if (cache.has(direction)) return cache.get(direction) ?? null;
  let tex: THREE.CanvasTexture | null = null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = direction === 'horizontal' ? 1024 : 512;
    canvas.height = direction === 'horizontal' ? 512 : 1024;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawOak(ctx, canvas.width, canvas.height, direction === 'horizontal');
      tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 4;
    }
  } catch {
    tex = null;
  }
  cache.set(direction, tex);
  return tex;
}
