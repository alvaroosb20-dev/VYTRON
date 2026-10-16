// Genera los trazados del logotipo VYTRON (TS + SVG) a partir de una única fuente.
// Uso: node scripts/generate-brand.mjs
// Después, para los PNG: npm run brand:png (requiere ImageMagick).
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const NEON = '#B7FF36';
const WHITE = '#F5F5F5';
const BLACK = '#0A0A0B';

// Letras geométricas propias, rejilla de 100 de alto. Cada letra: contorno + huecos.
// La V tiene el brazo derecho más alto que el resto: progreso / evolución.
const LETTERS = [
  { ch: 'V', w: 80, accent: true, rings: [[[0, 0], [20, 0], [40, 72], [64, -16], [86, -16], [52, 100], [28, 100]]] },
  { ch: 'Y', w: 76, rings: [[[0, 0], [20, 0], [38, 38], [56, 0], [76, 0], [47, 58], [47, 100], [29, 100], [29, 58]]] },
  { ch: 'T', w: 72, rings: [[[0, 0], [72, 0], [72, 18], [45, 18], [45, 100], [27, 100], [27, 18], [0, 18]]] },
  {
    ch: 'R', w: 80, rings: [
      [[0, 0], [62, 0], [78, 16], [78, 42], [66, 54], [80, 100], [60, 100], [48, 58], [18, 58], [18, 100], [0, 100]],
      [[18, 18], [56, 18], [60, 22], [60, 36], [56, 40], [18, 40]],
    ],
  },
  {
    ch: 'O', w: 80, rings: [
      [[14, 0], [66, 0], [80, 14], [80, 86], [66, 100], [14, 100], [0, 86], [0, 14]],
      [[24, 18], [56, 18], [62, 24], [62, 76], [56, 82], [24, 82], [18, 76], [18, 24]],
    ],
  },
  { ch: 'N', w: 76, rings: [[[0, 0], [18, 0], [58, 64], [58, 0], [76, 0], [76, 100], [58, 100], [18, 36], [18, 100], [0, 100]]] },
];

const GAP = 14;
const SHEAR = Math.tan((12 * Math.PI) / 180); // inclinación deportiva de 12°
const MIN_Y = -16;
const HEIGHT = 100 - MIN_Y;

const r = (n) => Math.round(n * 100) / 100;
// Inclina respecto a la línea base (y = 100) y desplaza para que todo quede en x >= 0.
const shear = ([x, y], dx) => [r(x + dx + (100 - y) * SHEAR), r(y - MIN_Y)];
const ringToD = (ring, dx) =>
  ring.map((p, i) => { const [x, y] = shear(p, dx); return `${i ? 'L' : 'M'}${x} ${y}`; }).join(' ') + ' Z';

let cursor = 0;
const letters = LETTERS.map((l) => {
  const d = l.rings.map((ring) => ringToD(ring, cursor)).join(' ');
  cursor += l.w + GAP;
  return { ch: l.ch, d, accent: !!l.accent };
});
const WIDTH = r(cursor - GAP + (100 - MIN_Y) * SHEAR);

// Marca compacta: solo la V, normalizada a su propia caja.
const vRing = LETTERS[0].rings[0];
const markD = ringToD(vRing, 0);
const MARK_W = r(86 + (100 - MIN_Y) * SHEAR);

const ts = `// Archivo generado por scripts/generate-brand.mjs. No editar a mano.
export const WORDMARK = {
  width: ${WIDTH},
  height: ${HEIGHT},
  letters: ${JSON.stringify(letters, null, 2).replace(/\n/g, '\n  ')},
} as const;

export const MARK = {
  width: ${MARK_W},
  height: ${HEIGHT},
  d: ${JSON.stringify(markD)},
} as const;
`;
mkdirSync(join(root, 'src/brand'), { recursive: true });
writeFileSync(join(root, 'src/brand/logoPaths.ts'), ts);

const svg = (w, h, body, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${bg ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}</svg>\n`;

const wordmarkBody = (base, accent, ox = 0, oy = 0) =>
  `<g transform="translate(${ox} ${oy})">` +
  letters.map((l) => `<path fill-rule="evenodd" fill="${l.accent ? accent : base}" d="${l.d}"/>`).join('') +
  '</g>';

const out = join(root, 'assets/brand');
mkdirSync(out, { recursive: true });

// Logotipo completo (fondo oscuro y versión para fondos claros).
writeFileSync(join(out, 'vytron-wordmark.svg'), svg(WIDTH, HEIGHT, wordmarkBody(WHITE, NEON)));
writeFileSync(join(out, 'vytron-wordmark-on-light.svg'), svg(WIDTH, HEIGHT, wordmarkBody(BLACK, BLACK)));

// Logotipo con eslogan (pantallas, web, fichas de tienda, redes).
const lockW = WIDTH;
const lockH = HEIGHT + 60;
writeFileSync(
  join(out, 'vytron-lockup.svg'),
  svg(
    lockW,
    lockH,
    wordmarkBody(WHITE, NEON) +
      `<text x="${lockW / 2}" y="${HEIGHT + 46}" text-anchor="middle" fill="#A0A0A8" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="28" letter-spacing="9">TRAIN. EVOLVE. DOMINATE.</text>`,
    BLACK,
  ),
);

// Icono compacto: V neón sobre negro, con margen de seguridad para máscaras de iOS/Android.
const ICON = 1024;
const scale = (ICON * 0.58) / HEIGHT;
const mx = (ICON - MARK_W * scale) / 2;
const my = (ICON - HEIGHT * scale) / 2;
const markBody = (fill) =>
  `<g transform="translate(${r(mx)} ${r(my)}) scale(${r(scale)})"><path fill="${fill}" d="${markD}"/></g>`;
writeFileSync(join(out, 'vytron-mark.svg'), svg(ICON, ICON, markBody(NEON), BLACK));
writeFileSync(join(out, 'vytron-mark-transparent.svg'), svg(ICON, ICON, markBody(NEON)));

// Adaptive icon de Android: la zona segura es ~66 %, se reduce la V.
const aScale = (ICON * 0.38) / HEIGHT;
const ax = (ICON - MARK_W * aScale) / 2;
const ay = (ICON - HEIGHT * aScale) / 2;
writeFileSync(
  join(out, 'vytron-adaptive-foreground.svg'),
  svg(ICON, ICON, `<g transform="translate(${r(ax)} ${r(ay)}) scale(${r(aScale)})"><path fill="${NEON}" d="${markD}"/></g>`),
);

// Splash: logotipo completo centrado.
const S = 1024;
const sScale = (S * 0.8) / WIDTH;
writeFileSync(
  join(out, 'vytron-splash.svg'),
  svg(S, S, wordmarkBody(WHITE, NEON, 0, 0).replace('<g transform="translate(0 0)">', `<g transform="translate(${r((S - WIDTH * sScale) / 2)} ${r((S - HEIGHT * sScale) / 2)}) scale(${r(sScale)})">`)),
);

console.log('Marca generada:', { WIDTH, HEIGHT, MARK_W });
