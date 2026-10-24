/**
 * Demostraciones animadas de cada ejercicio (animación vectorial original de VYTRON).
 *
 * Cada entrada describe los fotogramas clave del movimiento (inicio → final; los alternos
 * incluyen los dos lados) y el motor (src/lib/demoEngine.ts) interpola entre ellos en bucle.
 * Ángulos: 0 = abajo, 90 = delante, 180 = arriba, -90 = atrás. Lienzo 240 × 200, suelo y = 190.
 *
 * Para añadir un ejercicio nuevo: copia el más parecido, cambia ángulos y material, y
 * comprueba el resultado con `node scripts/render-demos.mjs` (genera una hoja de control).
 * Si tienes un vídeo o GIF con licencia, regístralo en src/data/media.ts: tiene prioridad.
 */
import type { Muscle } from '@/data/exercises';
import type { Demo, Pose, Segment } from '@/lib/demoEngine';

const G = 186; // altura del tobillo con el pie apoyado
const P = (p: Pose) => p;
const feet = (x: number, y = G): Pose['ik'] => ({ legN: [x, y], legF: [x, y] });

// Escenarios reutilizables (solo decorado; el movimiento de cada ejercicio es propio).
const pullBar = [{ l: [56, 4, 184, 4] as [number, number, number, number], w: 5, tone: 'equip' as const }];
const bench = (x: number, y: number, w: number) => [
  { l: [x + 10, y + 6, x + 10, 190] as [number, number, number, number], w: 4 },
  { l: [x + w - 10, y + 6, x + w - 10, 190] as [number, number, number, number], w: 4 },
  { r: [x, y, w, 9] as [number, number, number, number] },
];

const stand = (x = 120, extra: Partial<Pose> = {}): Pose => P({ at: { j: 'hip', x, y: 112 }, torso: 180, ik: feet(x + 2), armN: [4, 2], ...extra });

export const DEMOS: Record<string, Demo> = {
  // ---------- PIERNAS Y GLÚTEOS ----------
  'air-squat': {
    frames: [
      stand(118, { ik: feet(122), armN: [12, 12] }),
      P({ at: { j: 'hip', x: 90, y: 150 }, torso: 140, ik: feet(122), armN: [92, 92] }),
    ],
    move: 1000,
  },
  squat: {
    frames: [
      stand(118, { ik: feet(122), armN: [6, 118] }),
      P({ at: { j: 'hip', x: 93, y: 149 }, torso: 152, ik: feet(122), armN: [-22, 90] }),
    ],
    props: [{ k: 'dumbbell', grip: 'goblet' }],
    move: 1100,
  },
  'front-squat': {
    frames: [
      stand(118, { ik: feet(122), armN: [80, 232] }),
      P({ at: { j: 'hip', x: 98, y: 151 }, torso: 163, ik: feet(122), armN: [63, 215] }),
    ],
    props: [{ k: 'barbell', on: 'front' }],
    move: 1150,
  },
  'back-squat': {
    frames: [
      stand(118, { ik: feet(122), armN: [-45, 160] }),
      P({ at: { j: 'hip', x: 86, y: 149 }, torso: 134, ik: feet(122), armN: [-91, 114] }),
    ],
    props: [{ k: 'barbell', on: 'back' }],
    move: 1200,
  },
  deadlift: {
    frames: [
      P({ at: { j: 'hip', x: 94, y: 145 }, torso: 118, ik: { ...feet(124), armN: [131, 173], armF: [131, 173] } }),
      stand(118, { ik: feet(124), armN: [2, 0] }),
    ],
    props: [{ k: 'barbell', on: 'hands' }],
    move: [1100, 1300],
    hold: [400, 300],
  },
  rdl: {
    frames: [
      stand(118, { ik: feet(122), armN: [2, 0] }),
      P({ at: { j: 'hip', x: 89, y: 119 }, torso: 116, ik: feet(122), armN: [-2, -2] }),
    ],
    props: [{ k: 'barbell', on: 'hands' }],
    move: [1500, 1000],
  },
  'rdl-db': {
    frames: [
      stand(118, { ik: feet(122), armN: [2, 0] }),
      P({ at: { j: 'hip', x: 89, y: 121 }, torso: 110, ik: feet(122), armN: [0, 0] }),
    ],
    props: [{ k: 'dumbbell', grip: 'side' }],
    move: [1500, 1000],
  },
  lunge: {
    frames: [
      P({ at: { j: 'hip', x: 66, y: 112 }, torso: 180, ik: feet(68), armN: [5, 3] }),
      P({ at: { j: 'hip', x: 108, y: 145 }, torso: 180, ik: { legF: [66, 180] }, legN: [85, -5], footF: 45, armN: [5, 3] }),
      P({ at: { j: 'hip', x: 66, y: 112 }, torso: 180, ik: feet(68), armN: [5, 3] }),
      P({ at: { j: 'hip', x: 108, y: 145 }, torso: 180, ik: { legN: [66, 180] }, legF: [85, -5], footN: 45, armN: [5, 3] }),
    ],
    move: 900,
    hold: 200,
  },
  bulgarian: {
    frames: [
      P({ at: { j: 'hip', x: 128, y: 118 }, torso: 174, ik: { legN: [152, G], legF: [56, 145] }, footF: -95, armN: [2, 0] }),
      P({ at: { j: 'hip', x: 114, y: 148 }, torso: 164, ik: { legN: [152, G], legF: [56, 145] }, footF: -95, armN: [0, -2] }),
    ],
    props: [{ k: 'dumbbell', grip: 'side' }],
    scene: bench(12, 150, 62),
    move: 1100,
  },
  'goblet-cossack': {
    view: 'front',
    frames: [
      P({ at: { j: 'hip', x: 120, y: 120 }, torso: 180, ik: { legN: [178, G], legF: [62, G] }, armN: [-15, 200], armF: [15, 160], scale: { ftN: 0.4, ftF: 0.4 } }),
      P({ at: { j: 'hip', x: 140, y: 163 }, torso: 172, ik: { legN: [178, G], legF: [62, G] }, bend: { legN: 1, legF: -1 }, armN: [-25, 192], armF: [8, 152], footF: 180, scale: { ftN: 0.4, ftF: 0.5 } }),
      P({ at: { j: 'hip', x: 120, y: 120 }, torso: 180, ik: { legN: [178, G], legF: [62, G] }, armN: [-15, 200], armF: [15, 160], scale: { ftN: 0.4, ftF: 0.4 } }),
      P({ at: { j: 'hip', x: 100, y: 163 }, torso: 188, ik: { legN: [178, G], legF: [62, G] }, bend: { legN: 1, legF: -1 }, armN: [-8, 208], armF: [25, 168], footN: 180, scale: { ftN: 0.5, ftF: 0.4 } }),
    ],
    props: [{ k: 'kettlebell', hold: 'goblet' }],
    move: 1100,
    hold: 250,
  },
  'hip-thrust': {
    frames: [
      P({ at: { j: 'neck', x: 64, y: 131 }, torso: -128, head: -150, ik: { legN: [150, G], legF: [150, G], armN: [100, 149], armF: [100, 149] }, footN: 90 }),
      P({ at: { j: 'neck', x: 64, y: 131 }, torso: -90, head: -118, ik: { legN: [150, G], legF: [150, G], armN: [108, 119], armF: [108, 119] }, footN: 90 }),
    ],
    props: [{ k: 'barbell', on: 'hip' }],
    scene: bench(4, 138, 62),
    move: [900, 1100],
    hold: [250, 600],
  },
  'glute-bridge': {
    frames: [
      P({ at: { j: 'neck', x: 150, y: 182 }, torso: 90, ik: { legN: [70, G], legF: [70, G] }, bend: { legN: -1, legF: -1 }, armN: [-88, -90], footN: -90 }),
      P({ at: { j: 'neck', x: 150, y: 182 }, torso: 50, ik: { legN: [70, G], legF: [70, G] }, bend: { legN: -1, legF: -1 }, armN: [-80, -90], footN: -90 }),
    ],
    move: [900, 1100],
    hold: [250, 700],
  },
  'leg-press': {
    frames: [
      P({ at: { j: 'hip', x: 70, y: 150 }, torso: -140, head: -160, ik: { legN: [105, 115], legF: [105, 115] }, footN: 225, footF: 225, armN: [20, 40] }),
      P({ at: { j: 'hip', x: 70, y: 150 }, torso: -140, head: -160, ik: { legN: [120, 100], legF: [120, 100] }, footN: 225, footF: 225, armN: [20, 40] }),
    ],
    props: [{ k: 'footplate', side: -1 }],
    scene: [
      { l: [96, 172, 200, 68], w: 3 },
      { l: [40, 190, 210, 190], w: 5 },
      { l: [62, 158, 104, 158], w: 9, tone: 'pad' },
      { l: [66, 157, 30, 112], w: 9, tone: 'pad' },
      { l: [84, 164, 84, 190], w: 4 },
    ],
    move: [1000, 1300],
  },
  'leg-curl': {
    frames: [
      P({ at: { j: 'hip', x: 112, y: 140 }, torso: 93, head: 100, legN: [-90, -88], armN: [28, 62] }),
      P({ at: { j: 'hip', x: 112, y: 140 }, torso: 93, head: 100, legN: [-90, 148], armN: [28, 62] }),
    ],
    props: [{ k: 'roller', side: -1 }],
    scene: [
      { l: [70, 156, 70, 190], w: 4 }, { l: [168, 156, 168, 190], w: 4 },
      { r: [52, 147, 140, 9] },
    ],
    move: [900, 1200],
    focus: ['th'],
  },
  'leg-extension': {
    frames: [
      P({ at: { j: 'hip', x: 100, y: 140 }, torso: 186, legN: [88, 4], armN: [4, 4] }),
      P({ at: { j: 'hip', x: 100, y: 140 }, torso: 186, legN: [88, 84], armN: [4, 4] }),
    ],
    props: [{ k: 'roller', side: 1 }],
    scene: [
      { l: [82, 146, 76, 92], w: 9, tone: 'pad' },
      { l: [96, 156, 96, 190], w: 4 },
      { r: [80, 147, 58, 9] },
    ],
    move: [900, 1200],
    hold: [250, 500],
  },
  nordic: {
    frames: [
      P({ at: { j: 'knN', x: 92, y: 182 }, torso: 180, legN: [0, -90], footN: -90, armN: [10, 160] }),
      P({ at: { j: 'knN', x: 92, y: 182 }, torso: 112, head: 100, legN: [-68, -90], footN: -90, armN: [62, 70] }),
    ],
    scene: [{ c: [55, 174, 6] }, { l: [55, 180, 55, 190], w: 4 }, { r: [40, 186, 70, 4] }],
    move: [1800, 900],
    hold: [350, 250],
    focus: ['th'],
  },
  calf: {
    frames: [
      P({ at: { j: 'hip', x: 117, y: 92 }, torso: 180, ik: { legN: [117, 164], legF: [117, 164] }, footN: 120, footF: 120, armN: [4, 2] }),
      P({ at: { j: 'hip', x: 119, y: 77 }, torso: 180, ik: { legN: [120, 150], legF: [120, 150] }, footN: 45, footF: 45, armN: [4, 2] }),
    ],
    scene: [{ r: [124, 160, 90, 30], rx: 2 }],
    move: [900, 1100],
    hold: [400, 400],
  },

  // ---------- PECHO ----------
  pushup: {
    frames: [
      P({ at: { j: 'hip', x: 108, y: 152 }, torso: 110, ik: { legN: [36, 178], legF: [36, 178], armN: [150, G], armF: [150, G] }, footN: 15, footF: 15 }),
      P({ at: { j: 'hip', x: 115, y: 170 }, torso: 96, ik: { legN: [36, 178], legF: [36, 178], armN: [150, G], armF: [150, G] }, footN: 15, footF: 15 }),
    ],
    move: [1000, 800],
  },
  'incline-pushup': {
    frames: [
      P({ at: { j: 'hip', x: 106, y: 128 }, torso: 131, ik: { legN: [46, 178], legF: [46, 178], armN: [166, 141], armF: [166, 141] }, footN: 15, footF: 15 }),
      P({ at: { j: 'hip', x: 118, y: 146 }, torso: 115, ik: { legN: [46, 178], legF: [46, 178], armN: [166, 141], armF: [166, 141] }, footN: 15, footF: 15 }),
    ],
    scene: bench(150, 145, 70),
    move: [1000, 800],
  },
  bench: {
    frames: [
      P({ at: { j: 'hip', x: 70, y: 141 }, torso: 90, ik: { legN: [36, G], legF: [36, G] }, bend: { legN: -1, legF: -1 }, footN: -90, footF: -90, armN: [180, 180] }),
      P({ at: { j: 'hip', x: 70, y: 141 }, torso: 90, ik: { legN: [36, G], legF: [36, G] }, bend: { legN: -1, legF: -1 }, footN: -90, footF: -90, armN: [-36, 174] }),
    ],
    props: [{ k: 'barbell', on: 'hands' }],
    scene: bench(30, 148, 130),
    move: [1300, 900],
  },
  'incline-db': {
    frames: [
      P({ at: { j: 'hip', x: 100, y: 150 }, torso: 225, ik: feet(142), armN: [178, 180] }),
      P({ at: { j: 'hip', x: 100, y: 150 }, torso: 225, ik: feet(142), armN: [-28, 172] }),
    ],
    props: [{ k: 'dumbbell', grip: 'end' }],
    scene: [
      { l: [93, 158, 46, 111], w: 9, tone: 'pad' },
      { l: [84, 162, 130, 162], w: 9, tone: 'pad' },
      { l: [104, 168, 104, 190], w: 4 },
      { l: [56, 128, 56, 190], w: 4 },
    ],
    move: [1300, 900],
  },
  dips: {
    frames: [
      P({ at: { j: 'hip', x: 147, y: 110 }, torso: 180, ik: { armN: [148, 113], armF: [148, 113] }, legN: [14, -58] }),
      P({ at: { j: 'hip', x: 148, y: 133 }, torso: 158, ik: { armN: [148, 113], armF: [148, 113] }, legN: [4, -66] }),
    ],
    scene: [{ l: [118, 116, 190, 116], w: 6, tone: 'equip' }, { l: [126, 116, 126, 190], w: 4 }, { l: [182, 116, 182, 190], w: 4 }],
    move: [1200, 900],
  },

  // ---------- ESPALDA ----------
  pullup: {
    frames: [
      P({ at: { j: 'hip', x: 122, y: 103 }, torso: 180, ik: { armN: [126, 7], armF: [126, 7] }, legN: [14, -48] }),
      P({ at: { j: 'hip', x: 112, y: 58 }, torso: 172, ik: { armN: [126, 7], armF: [126, 7] }, legN: [20, -40] }),
    ],
    scene: pullBar,
    move: [1000, 1300],
  },
  'lat-pulldown': {
    frames: [
      P({ at: { j: 'hip', x: 100, y: 150 }, torso: 188, legN: [88, 4], ik: { armN: [110, 58], armF: [110, 58] } }),
      P({ at: { j: 'hip', x: 100, y: 150 }, torso: 196, legN: [88, 4], ik: { armN: [104, 100], armF: [104, 100] } }),
    ],
    props: [{ k: 'cable', from: [110, 10], handle: 'bar' }],
    scene: [
      { l: [40, 8, 40, 190], w: 6 }, { l: [40, 8, 116, 8], w: 5 },
      { c: [138, 136, 6] },
      { l: [100, 164, 100, 190], w: 4 },
      { r: [76, 157, 56, 8] },
    ],
    move: [900, 1200],
  },
  'cable-row': {
    frames: [
      P({ at: { j: 'hip', x: 72, y: 159 }, torso: 160, ik: { legN: [140, 172], legF: [140, 172], armN: [134, 130], armF: [134, 130] }, footN: 170, footF: 170 }),
      P({ at: { j: 'hip', x: 72, y: 159 }, torso: 184, ik: { legN: [140, 172], legF: [140, 172], armN: [96, 142], armF: [96, 142] }, footN: 170, footF: 170 }),
    ],
    props: [{ k: 'cable', from: [206, 160], handle: 'grip' }],
    scene: [
      { r: [148, 150, 10, 40] },
      { r: [198, 40, 16, 150] },
      { r: [30, 166, 84, 8] }, { l: [44, 174, 44, 190], w: 4 }, { l: [100, 174, 100, 190], w: 4 },
    ],
    move: [900, 1100],
  },
  'barbell-row': {
    frames: [
      P({ at: { j: 'hip', x: 98, y: 124 }, torso: 108, ik: feet(122), armN: [0, 0] }),
      P({ at: { j: 'hip', x: 98, y: 124 }, torso: 108, ik: { ...feet(122), armN: [128, 132], armF: [128, 132] } }),
    ],
    props: [{ k: 'barbell', on: 'hands' }],
    move: [800, 1100],
    hold: [250, 400],
  },
  'row-db': {
    frames: [
      P({ at: { j: 'hip', x: 70, y: 111 }, torso: 97, head: 100, ik: { legN: [70, G] }, legF: [0, -90], footF: -90, armN: [0, 0], armF: [8, 8] }),
      P({ at: { j: 'hip', x: 70, y: 111 }, torso: 97, head: 100, ik: { legN: [70, G] }, legF: [0, -90], footF: -90, armN: [-122, 4], armF: [8, 8] }),
    ],
    props: [{ k: 'dumbbell', hands: 'near', grip: 'side' }],
    scene: bench(22, 154, 128),
    move: [800, 1100],
    hold: [250, 450],
  },
  'renegade-row': {
    frames: [
      P({ at: { j: 'hip', x: 108, y: 150 }, torso: 110, ik: { legN: [36, 178], legF: [36, 178], armN: [150, 180], armF: [150, 180] }, footN: 15, footF: 15 }),
      P({ at: { j: 'hip', x: 108, y: 150 }, torso: 110, ik: { legN: [36, 178], legF: [36, 178], armF: [150, 180] }, armN: [-128, 2], footN: 15, footF: 15 }),
      P({ at: { j: 'hip', x: 108, y: 150 }, torso: 110, ik: { legN: [36, 178], legF: [36, 178], armN: [150, 180], armF: [150, 180] }, footN: 15, footF: 15 }),
      P({ at: { j: 'hip', x: 108, y: 150 }, torso: 110, ik: { legN: [36, 178], legF: [36, 178], armN: [150, 180] }, armF: [-128, 2], footN: 15, footF: 15 }),
    ],
    props: [{ k: 'dumbbell', grip: 'side' }],
    move: 700,
    hold: 200,
  },
  'face-pull': {
    frames: [
      P({ at: { j: 'hip', x: 108, y: 112 }, torso: 183, ik: feet(112), armN: [99, 99] }),
      P({ at: { j: 'hip', x: 108, y: 112 }, torso: 185, ik: feet(112), armN: [-95, 150], scale: { uaN: 0.55, uaF: 0.55 } }),
    ],
    props: [{ k: 'cable', from: [214, 58], handle: 'rope' }],
    scene: [{ r: [210, 20, 16, 170] }],
    move: [900, 1100],
    hold: [250, 450],
  },
  superman: {
    frames: [
      P({ at: { j: 'hip', x: 104, y: 182 }, torso: 90, head: 92, armN: [92, 92], legN: [-90, -90], footN: -150 }),
      P({ at: { j: 'hip', x: 104, y: 182 }, torso: 104, spine: -4, head: 104, armN: [114, 112], legN: [-106, -102], footN: -160 }),
    ],
    move: [900, 900],
    hold: [300, 1200],
  },

  // ---------- HOMBROS ----------
  ohp: {
    frames: [
      stand(118, { ik: feet(120), armN: [28, 172] }),
      stand(118, { ik: feet(120), armN: [180, 182], head: 176 }),
    ],
    props: [{ k: 'barbell', on: 'hands' }],
    move: [1000, 1200],
  },
  'press-db': {
    frames: [
      stand(118, { ik: feet(120), armN: [8, 178], scale: { uaN: 0.75, uaF: 0.75 } }),
      stand(118, { ik: feet(120), armN: [178, 180] }),
    ],
    props: [{ k: 'dumbbell', grip: 'end' }],
    move: [1000, 1200],
  },
  'lateral-raise': {
    view: 'front',
    frames: [
      P({ at: { j: 'hip', x: 120, y: 112 }, torso: 180, ik: { legN: [130, G], legF: [110, G] }, armN: [8, 6], armF: [-8, -6], scale: { ftN: 0.4, ftF: 0.4 } }),
      P({ at: { j: 'hip', x: 120, y: 112 }, torso: 180, ik: { legN: [130, G], legF: [110, G] }, armN: [86, 80], armF: [-86, -80], scale: { ftN: 0.4, ftF: 0.4 } }),
    ],
    props: [{ k: 'dumbbell', grip: 'end' }],
    move: [900, 1300],
    hold: [250, 350],
  },

  // ---------- BRAZOS ----------
  'curl-db': {
    frames: [
      stand(118, { ik: feet(120), armN: [2, 2] }),
      stand(118, { ik: feet(120), armN: [6, 158] }),
    ],
    props: [{ k: 'dumbbell', grip: 'end' }],
    move: [800, 1200],
  },
  'hammer-curl': {
    frames: [
      stand(118, { ik: feet(120), armN: [2, 2] }),
      stand(118, { ik: feet(120), armN: [6, 152] }),
    ],
    props: [{ k: 'dumbbell', grip: 'side' }],
    move: [800, 1200],
  },
  'triceps-pushdown': {
    frames: [
      stand(112, { ik: feet(114), torso: 172, armN: [8, 118] }),
      stand(112, { ik: feet(114), torso: 172, armN: [6, 4] }),
    ],
    props: [{ k: 'cable', from: [150, 12], handle: 'bar' }],
    scene: [{ r: [156, 6, 16, 184] }],
    move: [800, 1100],
    hold: [250, 400],
  },

  // ---------- CORE ----------
  plank: {
    frames: [
      P({ at: { j: 'hip', x: 108, y: 168 }, torso: 104, ik: { legN: [36, 178], legF: [36, 178], armN: [186, 184], armF: [186, 184] }, footN: 15, footF: 15 }),
      P({ at: { j: 'hip', x: 114, y: 165 }, torso: 99, ik: { legN: [36, 178], legF: [36, 178], armN: [186, 184], armF: [186, 184] }, footN: 15, footF: 15 }),
    ],
    move: [900, 900],
    hold: [400, 2600],
  },
  'dead-bug': {
    frames: [
      P({ at: { j: 'hip', x: 96, y: 182 }, torso: 90, armN: [180, 180], legN: [180, -90] }),
      P({ at: { j: 'hip', x: 96, y: 182 }, torso: 90, armN: [102, 100], armF: [180, 180], legN: [180, -90], legF: [-96, -95] }),
      P({ at: { j: 'hip', x: 96, y: 182 }, torso: 90, armN: [180, 180], legN: [180, -90] }),
      P({ at: { j: 'hip', x: 96, y: 182 }, torso: 90, armN: [180, 180], armF: [102, 100], legN: [-96, -95], legF: [180, -90] }),
    ],
    move: 1100,
    hold: 250,
    focus: ['torso'],
  },
  'mountain-climber': {
    frames: [
      P({ at: { j: 'hip', x: 108, y: 150 }, torso: 110, ik: { legN: [36, 178], legF: [36, 178], armN: [150, G], armF: [150, G] }, footN: 15, footF: 15 }),
      P({ at: { j: 'hip', x: 110, y: 148 }, torso: 112, ik: { legN: [104, 178], legF: [36, 178], armN: [150, G], armF: [150, G] }, footN: 30, footF: 15 }),
      P({ at: { j: 'hip', x: 108, y: 150 }, torso: 110, ik: { legN: [36, 178], legF: [36, 178], armN: [150, G], armF: [150, G] }, footN: 15, footF: 15 }),
      P({ at: { j: 'hip', x: 110, y: 148 }, torso: 112, ik: { legN: [36, 178], legF: [104, 178], armN: [150, G], armF: [150, G] }, footN: 15, footF: 30 }),
    ],
    move: 330,
    hold: 40,
  },
  'hanging-knee': {
    frames: [
      P({ at: { j: 'hip', x: 122, y: 103 }, torso: 180, ik: { armN: [124, 7], armF: [124, 7] }, legN: [3, 0], footN: 40 }),
      P({ at: { j: 'hip', x: 120, y: 102 }, torso: 174, ik: { armN: [124, 7], armF: [124, 7] }, legN: [106, 6], footN: 40 }),
    ],
    scene: pullBar,
    move: [900, 1200],
    hold: [300, 350],
  },
  pallof: {
    frames: [
      stand(118, { ik: feet(120), armN: [14, 160] }),
      stand(118, { ik: feet(120), armN: [90, 90] }),
    ],
    props: [{ k: 'cable', from: [104, 92], handle: 'grip' }],
    scene: [{ r: [96, 30, 14, 160] }],
    move: [900, 900],
    hold: [250, 900],
  },

  // ---------- CUERPO COMPLETO / CARDIO ----------
  'kb-swing': {
    frames: [
      P({ at: { j: 'hip', x: 96, y: 131 }, torso: 117, ik: feet(124), armN: [-18, -24] }),
      stand(118, { ik: feet(124), torso: 183, armN: [92, 92] }),
    ],
    props: [{ k: 'kettlebell' }],
    move: [650, 750],
    hold: [60, 120],
  },
  burpee: {
    frames: [
      stand(120, { ik: feet(122), armN: [5, 3] }),
      P({ at: { j: 'hip', x: 108, y: 158 }, torso: 128, ik: { ...feet(122), armN: [150, G], armF: [150, G] } }),
      P({ at: { j: 'hip', x: 108, y: 152 }, torso: 110, ik: { legN: [36, 178], legF: [36, 178], armN: [150, G], armF: [150, G] }, footN: 15, footF: 15 }),
      P({ at: { j: 'hip', x: 108, y: 158 }, torso: 128, ik: { ...feet(122), armN: [150, G], armF: [150, G] } }),
      P({ at: { j: 'hip', x: 120, y: 96 }, torso: 180, ik: feet(122, 172), footN: 50, footF: 50, armN: [176, 176] }),
    ],
    move: [450, 380, 380, 420, 500],
    hold: [150, 40, 80, 40, 60],
  },
  thruster: {
    frames: [
      stand(118, { ik: feet(122), armN: [40, 196] }),
      P({ at: { j: 'hip', x: 93, y: 149 }, torso: 150, ik: feet(122), armN: [18, 170] }),
      stand(118, { ik: feet(122), armN: [180, 180] }),
    ],
    props: [{ k: 'dumbbell', grip: 'end' }],
    move: [900, 700, 700],
    hold: [150, 100, 250],
  },
  farmer: {
    frames: [
      P({ at: { j: 'hip', x: 120, y: 114 }, torso: 180, legN: [22, 12], legF: [-18, -6], footF: 60, armN: [3, 3] }),
      P({ at: { j: 'hip', x: 120, y: 112 }, torso: 180, legN: [2, 0], legF: [14, -40], armN: [3, 3] }),
      P({ at: { j: 'hip', x: 120, y: 114 }, torso: 180, legF: [22, 12], legN: [-18, -6], footN: 60, armN: [3, 3] }),
      P({ at: { j: 'hip', x: 120, y: 112 }, torso: 180, legF: [2, 0], legN: [14, -40], armN: [3, 3] }),
    ],
    props: [{ k: 'dumbbell', grip: 'side' }],
    move: 420,
    hold: 0,
  },

  // ---------- MOVILIDAD ----------
  'cat-cow': {
    frames: [
      P({ at: { j: 'hip', x: 96, y: 146 }, torso: 100, spine: 9, head: 20, ik: { legN: [58, 182], legF: [58, 182], armN: [142, G], armF: [142, G] }, footN: -90, footF: -90 }),
      P({ at: { j: 'hip', x: 96, y: 146 }, torso: 98, spine: -8, head: 140, ik: { legN: [58, 182], legF: [58, 182], armN: [142, G], armF: [142, G] }, footN: -90, footF: -90 }),
    ],
    move: 1500,
    hold: 400,
    focus: ['torso'],
  },
  'hip-90': {
    // Vista cenital (desde arriba), la forma habitual de enseñar la postura 90/90.
    view: 'front',
    caption: 'Vista cenital',
    frames: [
      P({ at: { j: 'hip', x: 120, y: 92 }, torso: 180, head: 0, legF: [0, 90], legN: [90, 180], armN: [150, 172], armF: [-150, -172], scale: { torso: 0.2, uaN: 0.8, uaF: 0.8, ftN: 0.4, ftF: 0.4 } }),
      P({ at: { j: 'hip', x: 120, y: 92 }, torso: 180, head: 0, legF: [8, 4], legN: [-8, -4], armN: [150, 172], armF: [-150, -172], scale: { torso: 0.2, uaN: 0.8, uaF: 0.8, thN: 0.55, thF: 0.55, snN: 0.3, snF: 0.3, ftN: 0.3, ftF: 0.3 } }),
      P({ at: { j: 'hip', x: 120, y: 92 }, torso: 180, head: 0, legN: [0, -90], legF: [-90, 180], armN: [150, 172], armF: [-150, -172], scale: { torso: 0.2, uaN: 0.8, uaF: 0.8, ftN: 0.4, ftF: 0.4 } }),
      P({ at: { j: 'hip', x: 120, y: 92 }, torso: 180, head: 0, legF: [8, 4], legN: [-8, -4], armN: [150, 172], armF: [-150, -172], scale: { torso: 0.2, uaN: 0.8, uaF: 0.8, thN: 0.55, thF: 0.55, snN: 0.3, snF: 0.3, ftN: 0.3, ftF: 0.3 } }),
    ],
    move: 900,
    hold: 400,
    noGround: true,
    focus: ['th'],
  },
  thoracic: {
    view: 'top',
    // El brazo pasa por la vertical (apunta a la cámara), por eso se acorta a mitad de recorrido.
    frames: [
      P({ at: { j: 'hip', x: 92, y: 100 }, torso: 90, legN: [0, -90], armN: [4, 2], armF: [0, 0] }),
      P({ at: { j: 'hip', x: 92, y: 100 }, torso: 90, head: 120, legN: [0, -90], armN: [4, 2], armF: [0, 0], scale: { uaN: 0.08, faN: 0.08 } }),
      P({ at: { j: 'hip', x: 92, y: 100 }, torso: 90, head: 120, legN: [0, -90], armN: [176, 178], armF: [0, 0], scale: { uaN: 0.08, faN: 0.08 } }),
      P({ at: { j: 'hip', x: 92, y: 100 }, torso: 90, head: 150, spine: -3, legN: [0, -90], armN: [176, 178], armF: [0, 0] }),
      P({ at: { j: 'hip', x: 92, y: 100 }, torso: 90, head: 120, legN: [0, -90], armN: [176, 178], armF: [0, 0], scale: { uaN: 0.08, faN: 0.08 } }),
      P({ at: { j: 'hip', x: 92, y: 100 }, torso: 90, head: 120, legN: [0, -90], armN: [4, 2], armF: [0, 0], scale: { uaN: 0.08, faN: 0.08 } }),
    ],
    move: [700, 1, 800, 800, 1, 700],
    hold: [300, 0, 0, 700, 0, 0],
    noGround: true,
    focus: ['torso'],
  },
};

/** Vista de cada demostración, para el pie de la animación. */
export const VIEW_LABEL = { side: 'Vista lateral', front: 'Vista frontal', top: 'Vista cenital' } as const;

/** Segmentos que se resaltan según el músculo principal. */
export const FOCUS_BY_MUSCLE: Partial<Record<Muscle, Segment[]>> = {
  Pecho: ['torso'], Espalda: ['torso'], Core: ['torso'],
  Hombros: ['ua'], 'Bíceps': ['ua'], 'Tríceps': ['ua'],
  'Cuádriceps': ['th'], Isquios: ['th'], 'Glúteos': ['th'], Gemelos: ['sn'],
};

/** Ejercicios de la biblioteca que todavía no tienen demostración (hoy: ninguno). */
export const missingDemos = (ids: string[]) => ids.filter((id) => !DEMOS[id]);
