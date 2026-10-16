"""Rasteriza los SVG de assets/brand a PNG sin dependencias de sistema (solo Pillow).

Solo entiende el formato simple que produce scripts/generate-brand.mjs:
rect de fondo, <g transform="translate(x y) scale(s)"> y paths M/L/Z con fill-rule evenodd.
Uso: python3 scripts/render-png.py
"""
import re
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BRAND = ROOT / "assets" / "brand"
SS = 4  # supermuestreo para bordes suaves


def hex_rgba(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4)) + (255,)


def render(svg_name, out_name, size):
    src = (BRAND / svg_name).read_text()
    vw, vh = map(float, re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', src).group(1, 2))
    W, H = size
    k = min(W / vw, H / vh) * SS
    ox = (W * SS - vw * k) / 2
    oy = (H * SS - vh * k) / 2
    bg = re.search(r'<rect[^>]*fill="(#[0-9A-Fa-f]{6})"', src)
    img = Image.new("RGBA", (W * SS, H * SS), hex_rgba(bg.group(1)) if bg else (0, 0, 0, 0))

    tx = ty = 0.0
    sc = 1.0
    g = re.search(r'<g transform="translate\(([-\d.]+) ([-\d.]+)\)(?: scale\(([\d.]+)\))?">', src)
    if g:
        tx, ty = float(g.group(1)), float(g.group(2))
        sc = float(g.group(3) or 1)

    for fill, d in re.findall(r'<path[^>]*fill="(#[0-9A-Fa-f]{6})"[^>]*d="([^"]+)"', src):
        mask = Image.new("L", img.size, 0)
        md = ImageDraw.Draw(mask)
        for i, ring in enumerate(s for s in d.split("Z") if s.strip()):
            nums = list(map(float, re.findall(r"[-\d.]+", ring)))
            pts = [
                (ox + (tx + nums[j] * sc) * k, oy + (ty + nums[j + 1] * sc) * k)
                for j in range(0, len(nums), 2)
            ]
            # Primer anillo = contorno; los siguientes = huecos (evenodd en nuestras letras).
            md.polygon(pts, fill=255 if i == 0 else 0)
        img.paste(Image.new("RGBA", img.size, hex_rgba(fill)), (0, 0), mask)

    img = img.resize((W, H), Image.LANCZOS)
    out = ROOT / out_name
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)
    print("ok", out_name)


render("vytron-mark.svg", "assets/icon.png", (1024, 1024))
render("vytron-adaptive-foreground.svg", "assets/adaptive-icon.png", (1024, 1024))
render("vytron-splash.svg", "assets/splash-icon.png", (1024, 1024))
render("vytron-mark.svg", "assets/favicon.png", (48, 48))
render("vytron-wordmark.svg", "assets/brand/png/vytron-wordmark@2x.png", (1130, 232))
render("vytron-mark.svg", "assets/brand/png/vytron-social-avatar.png", (800, 800))
