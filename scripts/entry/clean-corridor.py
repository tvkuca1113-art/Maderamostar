"""Čisti prijedlog dizajna hodnika (docs/design/ulaz-hodnik-prijedlog.*) od upisanog teksta i izrezuje fotografiju.

Naslov na stropu se uklanja glatkom (harmonijskom) popunom iz okoline, a oznake na vratima kopiranjem istog
mjesta iznad i ispod (sve su na uspravnim površinama). Zatim se izrezuje fotografija bez zaglavlja i donjeg panela
(y 116–1296 od 1536). Naslov, tačke i dugme na stranici su pravi elementi (src/components/Corridor.tsx).
Rezultat je spremljen kao scripts/entry/hodnik-izvor.jpg (pokrenuto na originalnom PNG-u 1024 × 1536).
Upotreba: python3 -I scripts/entry/clean-corridor.py <prijedlog.png> <izlaz.jpg>
"""
import sys
import cv2
import numpy as np

src, out = sys.argv[1], sys.argv[2]
img = cv2.imread(src).astype(np.float32)
H, W = img.shape[:2]

# 1) Natpis na stropu: glatka (harmonijska) popuna iz okoline + zrno.
ceil = np.zeros((H, W), np.float32)
for x0, y0, x1, y1 in [(356, 158, 686, 199), (343, 199, 694, 297), (416, 291, 624, 353)]:
    ceil[y0:y1, x0:x1] = 1
ceil = cv2.dilate(ceil, np.ones((5, 5), np.uint8))
known = 1 - ceil
X0, Y0, X1, Y1 = 300, 120, 740, 400
reg = img[Y0:Y1, X0:X1].copy()
k = known[Y0:Y1, X0:X1][..., None]
# normalizirana konvolucija kao početna procjena
num = cv2.GaussianBlur(reg * k, (0, 0), 30)
den = cv2.GaussianBlur(np.repeat(k, 3, 2), (0, 0), 30)
fill = num / np.maximum(den, 1e-4)
cur = reg * k + fill * (1 - k)
for _ in range(1500):
    blurred = cv2.blur(cur, (3, 3))
    cur = reg * k + blurred * (1 - k)
rng = np.random.default_rng(4)
grain = cv2.GaussianBlur(rng.normal(0, 1.2, cur.shape).astype(np.float32), (0, 0), 0.7)
cur = cur + grain * (1 - k)
img[Y0:Y1, X0:X1] = cur

# 2) Oznake na vratima i zidovima: prekrivaju uspravne strukture, pa se popunjavaju istim mjestom iznad i ispod.
lum = cv2.cvtColor(np.clip(img, 0, 255).astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.int16)
orig = img.copy()
for x0, y0, x1, y1 in [(238, 586, 347, 630), (554, 656, 658, 700), (874, 665, 1006, 710)]:
    pad = 24
    region = lum[y0 - pad:y1 + pad, x0 - pad:x1 + pad].astype(np.uint8)
    bg = cv2.medianBlur(region, 31).astype(np.int16)
    m = ((region.astype(np.int16) - bg) > 6).astype(np.uint8) * 255
    m[:pad, :] = 0
    m[-pad:, :] = 0
    m[:, :pad] = 0
    m[:, -pad:] = 0
    m = cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=3)
    a = cv2.GaussianBlur(m.astype(np.float32) / 255, (0, 0), 2.0)
    a = np.clip(a * 1.6, 0, 1)[..., None]
    ys, xs = slice(y0 - pad, y1 + pad), slice(x0 - pad, x1 + pad)
    d = 46
    above = orig[y0 - pad - d:y1 + pad - d, x0 - pad:x1 + pad]
    below = orig[y0 - pad + d:y1 + pad + d, x0 - pad:x1 + pad]
    patch = above * 0.5 + below * 0.5
    img[ys, xs] = orig[ys, xs] * (1 - a) + patch * a

cv2.imwrite(out, np.clip(img, 0, 255).astype(np.uint8)[116:1296], [cv2.IMWRITE_JPEG_QUALITY, 95])
print('ok')
