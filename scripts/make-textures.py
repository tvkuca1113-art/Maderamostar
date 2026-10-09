"""
Pravi PBR teksture za 3D prikaz (pokrenuti: python3 scripts/make-textures.py).

- Hrastov furnir: isječci ravnih ploha s originalne Maderine fotografije Hrast furnir H
  (bez kvake i okvira), izravnato osvjetljenje, plus normal i roughness mapa iz godova.
- Pod: svijetle kamene ploče (proceduralno).
- Zid: fina žbuka (proceduralna normal mapa).
Izlaz: public/textures/*.jpg
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public/images/madera/model-hrast-furnir-h.jpg"
OUT = ROOT / "public/textures"
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)


def flatten(img: Image.Image, radius: int) -> np.ndarray:
    """Uklanja gradijent osvjetljenja: dijeli sliku s jako zamućenom verzijom i vraća srednju boju."""
    a = np.asarray(img).astype(np.float32)
    blur = np.asarray(img.filter(ImageFilter.GaussianBlur(radius))).astype(np.float32)
    mean = a.reshape(-1, 3).mean(0)
    out = a / np.maximum(blur, 1) * mean
    return np.clip(out, 0, 255)


def normal_from_height(h: np.ndarray, strength: float) -> np.ndarray:
    gx = np.roll(h, -1, 1) - np.roll(h, 1, 1)
    gy = np.roll(h, -1, 0) - np.roll(h, 1, 0)
    nx, ny, nz = -gx * strength, gy * strength, np.ones_like(h)
    n = np.stack([nx, ny, nz], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)


def save(arr: np.ndarray, name: str, quality: int = 86):
    Image.fromarray(arr.astype(np.uint8)).save(OUT / name, quality=quality, optimize=True)


def oak_set(box, size, name, rotate=False):
    photo = Image.open(SRC).convert("RGB")
    crop = photo.crop(box)
    if rotate:
        crop = crop.rotate(90, expand=True)
    crop = crop.resize(size, Image.LANCZOS)
    alb = flatten(crop, 60)
    # Blago toplija i zasićenija nijansa, bliža stvarnom furniru pod dnevnim svjetlom.
    alb = np.clip(alb * np.array([1.04, 1.0, 0.94]), 0, 255)
    save(alb, f"{name}-color.jpg")
    lum = alb.mean(-1) / 255.0
    hp = lum - np.asarray(Image.fromarray((lum * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255.0
    save(normal_from_height(hp, 6.0), f"{name}-normal.jpg", 90)
    rough = np.clip(0.52 + (0.5 - lum) * 0.35 + hp * 0.8, 0.3, 0.8) * 255
    save(np.stack([rough] * 3, -1), f"{name}-rough.jpg")


# Središnje polje Hrast furnir H: vodoravni godovi, bez kvake (fotografija 1440 × 1800).
oak_set((520, 230, 870, 900), (512, 1024), "oak-h")
# Uspravni godovi (bočni dijelovi, štok, lajsne) koriste istu teksturu zarotiranu u materijalu.


def fbm(shape, octaves=5, base=8):
    h, w = shape
    out = np.zeros(shape, np.float32)
    amp = 1.0
    for o in range(octaves):
        f = base * (2 ** o)
        small = rng.random((f, f)).astype(np.float32)
        layer = np.asarray(Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255
        out += layer * amp
        amp *= 0.5
    return out / out.max()


# Pod: velike svijetle kamene ploče 60 × 60 cm (tekstura pokriva 2 × 2 ploče).
N = 1024
n = fbm((N, N), 6, 4)
veins = np.abs(np.sin((np.linspace(0, 1, N)[None, :] * 7 + n * 6) * np.pi))
base = np.array([231, 224, 212], np.float32)
col = base[None, None, :] * (0.94 + 0.08 * n[..., None]) - (1 - veins[..., None]) ** 6 * 8
grout = np.zeros((N, N), bool)
for k in (0, N // 2):
    grout[:, k : k + 3] = True
    grout[k : k + 3, :] = True
col[grout] = [196, 188, 176]
save(np.clip(col, 0, 255), "floor-color.jpg")
height = n * 0.3 - grout * 0.8
save(normal_from_height(height, 4.0), "floor-normal.jpg", 90)
rough = np.clip(0.42 + n * 0.18 + grout * 0.4, 0, 1) * 255
save(np.stack([rough] * 3, -1), "floor-rough.jpg")

# Zid: fina žbuka, samo normal mapa (boja dolazi iz materijala).
p = fbm((512, 512), 7, 16)
save(normal_from_height(p, 1.6), "plaster-normal.jpg", 88)

for f in sorted(OUT.iterdir()):
    print(f.name, f.stat().st_size // 1024, "kB")
