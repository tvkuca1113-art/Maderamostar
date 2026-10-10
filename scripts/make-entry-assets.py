"""Izvorne slike za početni ulaz kroz vrata (scripts/render-room/out/, web verzije pravi optimize-entry.mjs).

- leaf-{desktop,mobile}.png: krilo izrezano iz početne fotografije, s retuširanom ručicom kvake
  (ručica je poseban sloj, pa se može spustiti prije otvaranja).
- lever-{desktop,mobile}.png: ručica s rozetom, prozirna pozadina.
Koordinate krila odgovaraju --leaf-* varijablama u styles.css; koordinate ručice ispisuju se na kraju.
Pokretanje iz korijena projekta: python3 scripts/make-entry-assets.py
"""
import colorsys
import numpy as np
import os
from PIL import Image, ImageFilter

OUT = 'scripts/render-room/out'
os.makedirs(OUT, exist_ok=True)

VARIANTS = {
    # izvor, krilo (l, t, r, b), okvir ručice u krilu (x0, y0, x1, y1), središte rozete u krilu
    'desktop': ('public/images/madera/hero-hrast-desktop.png', (1012, 92, 1320, 837), (6, 366, 66, 390), (18.5, 377.5)),
    'mobile': ('public/images/madera/hero-hrast-mobile.png', (487, 512, 818, 1300), (8, 383, 72, 407), (20.0, 395.5)),
}


def grayness(px):
    r, g, b = px[:3]
    _, s, _ = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    # Metal je gotovo neutralan, hrast je zasićeno narandžast.
    return max(0.0, min(1.0, (0.4 - s) / 0.14))


for name, (src, crop, lb, (cx, cy)) in VARIANTS.items():
    leaf = Image.open(src).convert('RGB').crop(crop)
    x0, y0, x1, y1 = lb
    w, h = x1 - x0, y1 - y0
    # Maska metala (meka), malo proširena da uhvati i rubni antialiasing.
    mask = Image.new('L', (w, h), 0)
    for y in range(h):
        for x in range(w):
            mask.putpixel((x, y), int(255 * grayness(leaf.getpixel((x0 + x, y0 + y)))))
    mask = mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    lever = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    lever.paste(leaf.crop(lb), (0, 0), mask)
    lever.save(f'{OUT}/lever-{name}.png')

    # Retuš: ručica izvan rozete se zamjenjuje furnirom iznad nje (godovi su vodoravni, pa se uklapa).
    r_rosette = 9.5
    patched = leaf.copy()
    # Rupa obuhvata i blagu sjenu ručice ispod nje (≈ 3 px niže).
    hole = mask.filter(ImageFilter.MaxFilter(5))
    shadow = Image.new('L', (w, h), 0)
    shadow.paste(hole, (2, 3))
    hole = Image.fromarray(np.maximum(np.array(hole), np.array(shadow)))
    for y in range(h):
        for x in range(w):
            a = hole.getpixel((x, y)) / 255
            gx, gy = x0 + x, y0 + y
            if a <= 0 or ((gx - cx) ** 2 + (gy - cy) ** 2) ** 0.5 <= r_rosette:
                continue
            above = leaf.getpixel((gx, gy - 12))
            below = leaf.getpixel((gx, gy + 13))
            fill = tuple(int(above[i] * 0.6 + below[i] * 0.4) for i in range(3))
            orig = leaf.getpixel((gx, gy))
            patched.putpixel((gx, gy), tuple(int(orig[i] * (1 - a) + fill[i] * a) for i in range(3)))
    patched.save(f'{OUT}/leaf-{name}.png')

    lw, lh = leaf.size
    print(
        name,
        f'--lever-l: {x0 / lw * 100:.2f}%; --lever-t: {y0 / lh * 100:.2f}%; --lever-w: {w / lw * 100:.2f}%;',
        f'--lever-ox: {(cx - x0) / w * 100:.1f}%; --lever-oy: {(cy - y0) / h * 100:.1f}%;',
    )
