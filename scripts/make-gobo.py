"""Gobo (svjetlosna maska) za 3D prikaz: sunce kroz prozor s krošnjom ispred — kao na početnoj fotografiji.
Bijelo = svjetlo, crno = sjena. Rezultat: public/textures/gobo-window.jpg (512 × 512)."""
import math, random
from PIL import Image, ImageDraw, ImageFilter

random.seed(7)
S = 1024
img = Image.new('L', (S, S), 0)
d = ImageDraw.Draw(img)
# Prozor s četiri polja i prečkama.
x0, y0, x1, y1 = 150, 120, 880, 900
d.rectangle([x0, y0, x1, y1], fill=255)
mx, my = (x0 + x1) // 2, int(y0 + (y1 - y0) * 0.42)
d.rectangle([mx - 14, y0, mx + 14, y1], fill=0)
d.rectangle([x0, my - 12, x1, my + 12], fill=0)
# Krošnja: grane i listovi koji djelimično zaklanjaju sunce.
leaves = Image.new('L', (S, S), 0)
ld = ImageDraw.Draw(leaves)
def branch(x, y, ang, length, depth):
    if depth == 0 or length < 18:
        for _ in range(3):
            lx = x + random.uniform(-34, 34)
            ly = y + random.uniform(-34, 34)
            a = random.uniform(0, math.pi)
            w, h = random.uniform(7, 12), random.uniform(20, 34)
            pts = [(lx + math.cos(a) * h * t - math.sin(a) * w * math.sin(t * math.pi), ly + math.sin(a) * h * t + math.cos(a) * w * math.sin(t * math.pi)) for t in [i / 10 for i in range(11)]]
            pts += [(lx + math.cos(a) * h * t + math.sin(a) * w * math.sin(t * math.pi), ly + math.sin(a) * h * t - math.cos(a) * w * math.sin(t * math.pi)) for t in [i / 10 for i in range(10, -1, -1)]]
            ld.polygon(pts, fill=255)
        return
    nx, ny = x + math.cos(ang) * length, y + math.sin(ang) * length
    ld.line([x, y, nx, ny], fill=255, width=max(2, depth * 2 - 1))
    for _ in range(2):
        branch(nx, ny, ang + random.uniform(-0.9, 0.9), length * random.uniform(0.6, 0.85), depth - 1)
branch(40, 1020, -1.05, 260, 6)
branch(1010, 60, 2.5, 190, 5)
leaves = leaves.filter(ImageFilter.GaussianBlur(5))
img = Image.composite(Image.new('L', (S, S), 0), img, leaves.point(lambda v: int(v * 0.8)))
# Mekani rubovi (sunce nije točkasti izvor) i blagi pad prema rubu snopa.
img = img.filter(ImageFilter.GaussianBlur(7)).resize((512, 512), Image.LANCZOS)
img.convert('RGB').save('public/textures/gobo-window.jpg', quality=88)

print('ok')
