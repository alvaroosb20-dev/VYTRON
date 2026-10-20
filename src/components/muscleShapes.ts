import type { Muscle } from '@/data/exercises';

/**
 * Silueta propia de VYTRON (frente y espalda) para marcar los músculos de cada ejercicio.
 * Dibujo original: no depende de fotos ni de licencias de terceros.
 * Caja de cada figura: 120 × 240.
 */

export type Region =
  | 'chest' | 'abs' | 'deltsF' | 'biceps' | 'forearmsF' | 'quads' | 'shins'
  | 'traps' | 'back' | 'deltsB' | 'triceps' | 'forearmsB' | 'glutes' | 'hams' | 'calves';

export type Shape =
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; region?: Region }
  | { kind: 'path'; d: string; region?: Region };

const mirror = (cx: number) => 120 - cx;
const pair = (region: Region | undefined, cx: number, cy: number, rx: number, ry: number): Shape[] => [
  { kind: 'ellipse', cx, cy, rx, ry, region },
  { kind: 'ellipse', cx: mirror(cx), cy, rx, ry, region },
];

// Partes comunes que nunca se resaltan (cabeza, cuello, manos, rodillas, pies).
const neutral = (): Shape[] => [
  { kind: 'ellipse', cx: 60, cy: 18, rx: 11, ry: 13 },
  { kind: 'path', d: 'M54 29 h12 v9 h-12 z' },
  ...pair(undefined, 25, 112, 4.5, 6),
  ...pair(undefined, 50, 168, 6, 5),
  ...pair(undefined, 50, 224, 7, 4),
];

export const FRONT: Shape[] = [
  ...neutral(),
  ...pair('deltsF', 38, 47, 9, 8),
  { kind: 'path', d: 'M43 41 Q59 37 59 41 L59 60 Q51 64 43 60 Q39 50 43 41 z', region: 'chest' },
  { kind: 'path', d: 'M77 41 Q61 37 61 41 L61 60 Q69 64 77 60 Q81 50 77 41 z', region: 'chest' },
  { kind: 'path', d: 'M47 65 h26 q2 0 1 6 l-3 32 q-11 6 -22 0 l-3 -32 q-1 -6 1 -6 z', region: 'abs' },
  ...pair('biceps', 30, 68, 6, 12),
  ...pair('forearmsF', 27, 93, 5, 12),
  { kind: 'path', d: 'M46 104 q14 8 28 0 l4 10 q-18 8 -36 0 z' },
  ...pair('quads', 50, 140, 9.5, 24),
  ...pair('shins', 50, 195, 6, 20),
];

export const BACK: Shape[] = [
  ...neutral(),
  { kind: 'path', d: 'M60 30 L76 42 L60 56 L44 42 z', region: 'traps' },
  ...pair('deltsB', 38, 47, 9, 8),
  { kind: 'path', d: 'M44 50 L60 58 L76 50 Q80 72 70 98 L60 102 L50 98 Q40 72 44 50 z', region: 'back' },
  ...pair('triceps', 30, 68, 6, 12),
  ...pair('forearmsB', 27, 93, 5, 12),
  ...pair('glutes', 51, 114, 10, 10),
  ...pair('hams', 50, 145, 8.5, 21),
  ...pair('calves', 50, 192, 7.5, 16),
];

const ALL: Region[] = ['chest', 'abs', 'deltsF', 'biceps', 'quads', 'traps', 'back', 'deltsB', 'triceps', 'glutes', 'hams', 'calves'];

export const MUSCLE_REGIONS: Record<Muscle, Region[]> = {
  Pecho: ['chest'],
  Espalda: ['traps', 'back'],
  Hombros: ['deltsF', 'deltsB'],
  'Bíceps': ['biceps'],
  'Tríceps': ['triceps'],
  'Cuádriceps': ['quads'],
  Isquios: ['hams'],
  'Glúteos': ['glutes'],
  Gemelos: ['calves'],
  Core: ['abs'],
  'Cuerpo completo': ALL,
  Movilidad: [],
};

export const BODY_COLORS = {
  neutral: '#2E2E33',
  idle: '#3A3A40',
  primary: '#B7FF36',
  secondary: 'rgba(183,255,54,0.38)',
};

/** Color de una forma según los músculos principales y secundarios del ejercicio. */
export function shapeColor(region: Region | undefined, primary: Set<Region>, secondary: Set<Region>) {
  if (!region) return BODY_COLORS.neutral;
  if (primary.has(region)) return BODY_COLORS.primary;
  if (secondary.has(region)) return BODY_COLORS.secondary;
  return BODY_COLORS.idle;
}
