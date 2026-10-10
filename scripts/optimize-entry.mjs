// Web izvedenice za ulaz kroz vrata: soba iza vrata (render), krilo i ručica.
// Ulaz: scripts/render-room/out/ (render.mjs i make-entry-assets.py); izlaz: public/images/madera/entry/.
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';

const SRC = 'scripts/render-room/out';
const OUT = 'public/images/madera/entry';
await mkdir(OUT, { recursive: true });
const jobs = [
  { src: `${SRC}/room-desktop.png`, base: 'room-desktop', widths: [1280, 1920], q: [80, 56] },
  { src: `${SRC}/room-mobile.png`, base: 'room-mobile', widths: [720, 1080], q: [80, 56] },
  { src: `${SRC}/leaf-desktop.png`, base: 'leaf-desktop', widths: [308], q: [88, 70] },
  { src: `${SRC}/leaf-mobile.png`, base: 'leaf-mobile', widths: [331], q: [88, 70] },
];

for (const { src, base, widths, q } of jobs) {
  for (const w of widths) {
    const img = sharp(src).resize({ width: w, withoutEnlargement: true });
    const webp = `${OUT}/${base}-${w}.webp`;
    const avif = `${OUT}/${base}-${w}.avif`;
    await img.clone().webp({ quality: q[0] }).toFile(webp);
    await img.clone().avif({ quality: q[1], effort: 5 }).toFile(avif);
    const [a, b] = await Promise.all([stat(webp), stat(avif)]);
    console.log(`${base}-${w}: webp ${(a.size / 1024).toFixed(0)} kB, avif ${(b.size / 1024).toFixed(0)} kB`);
  }
}
for (const name of ['desktop', 'mobile']) {
  const file = `${OUT}/lever-${name}.webp`;
  await sharp(`${SRC}/lever-${name}.png`).webp({ quality: 90, alphaQuality: 100 }).toFile(file);
  console.log(`lever-${name}: webp ${((await stat(file)).size / 1024).toFixed(1)} kB`);
}
