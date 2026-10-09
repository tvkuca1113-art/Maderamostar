// Pravi optimizirane izvedenice (AVIF/WebP) iz originalnih slika.
// Originali u public/images/madera ostaju netaknuti i služe za lightbox.
import sharp from 'sharp';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'public/images/madera';
const OUT = 'public/images/madera/opt';

const jobs = [
  { file: 'hero-hrast-desktop.png', widths: [960, 1440, 1672] },
  { file: 'hero-hrast-mobile.png', widths: [640, 1024] },
  ...[
    'model-hrast-furnir-h.jpg',
    'model-patras-bijeli.jpg',
    'model-olimpus-bijeli.jpg',
    'model-milano-bijeli.jpg',
    'model-sara-bijeli.jpg',
    'model-anatolija-staklo.jpg',
    'izvedba-bijela-zlatni-detalji.jpg',
    'izvedba-dvokrilna-staklo-mreza.jpg',
    'izvedba-antracit-staklo-mreza.jpg',
    'izvedba-skrivena-siva.jpg',
    'izvedba-klizna-staklo.jpg',
  ].map((file) => ({ file, widths: [480, 960] })),
];

await mkdir(OUT, { recursive: true });

for (const { file, widths } of jobs) {
  const base = path.parse(file).name;
  const input = path.join(SRC, file);
  const meta = await sharp(input).metadata();
  for (const w of widths) {
    const width = Math.min(w, meta.width);
    const img = sharp(input).resize({ width, withoutEnlargement: true });
    const webp = path.join(OUT, `${base}-${w}.webp`);
    const avif = path.join(OUT, `${base}-${w}.avif`);
    await img.clone().webp({ quality: 80 }).toFile(webp);
    await img.clone().avif({ quality: 55, effort: 4 }).toFile(avif);
    const [a, b] = await Promise.all([stat(webp), stat(avif)]);
    console.log(`${base}-${w}: webp ${(a.size / 1024).toFixed(0)} kB, avif ${(b.size / 1024).toFixed(0)} kB`);
  }
}
