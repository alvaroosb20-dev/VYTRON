/**
 * Motor de las demostraciones animadas de VYTRON.
 *
 * Es un modelo biomecánico 2D propio (cinemática directa): cada fotograma clave describe
 * los ángulos de cada segmento del cuerpo y un punto de apoyo fijo (pie, mano, cadera…).
 * Entre fotogramas se interpolan los ángulos, así los huesos nunca cambian de longitud y
 * el apoyo se queda clavado en el suelo. No depende de React Native: la app y el script de
 * verificación (scripts/render-demos.mjs) dibujan exactamente lo mismo.
 *
 * Convención de ángulos (grados, dirección absoluta del segmento):
 *   0 = hacia abajo · 90 = hacia delante (derecha) · 180 = hacia arriba · -90 = hacia atrás.
 */

export type JointName =
  | 'hip' | 'neck' | 'head'
  | 'shN' | 'elN' | 'haN' | 'shF' | 'elF' | 'haF'
  | 'hpN' | 'knN' | 'anN' | 'toN' | 'hpF' | 'knF' | 'anF' | 'toF' | 'spine';
export type Joints = Record<JointName, [number, number]>;

type ScaleKey = 'torso' | 'uaN' | 'faN' | 'uaF' | 'faF' | 'thN' | 'snN' | 'thF' | 'snF' | 'ftN' | 'ftF';

type Limb = 'armN' | 'armF' | 'legN' | 'legF';

export type Pose = {
  /**
   * Punto de apoyo: la articulación `j` se coloca en (x, y). Si la postura usa `ik`, el apoyo
   * debe ser del tronco (hip, neck, head, shN, shF, hpN, hpF).
   */
  at: { j: JointName; x: number; y: number };
  torso: number;
  /** Curvatura de la columna en px (+ = espalda redondeada/hacia atrás, - = arqueada). */
  spine?: number;
  head?: number;
  /** [brazo, antebrazo]. N = lado cercano (o derecho de la pantalla en vista frontal). */
  armN?: [number, number];
  armF?: [number, number];
  /** [muslo, pierna]. */
  legN?: [number, number];
  legF?: [number, number];
  /**
   * Cinemática inversa: en lugar de ángulos, el punto donde debe quedar la mano o el tobillo
   * (pies en el suelo, manos en la barra). Así no resbalan durante la animación.
   */
  ik?: Partial<Record<Limb, [number, number]>>;
  /** Hacia dónde se dobla la articulación con `ik`: 1 = rodilla/codo hacia delante (derecha). */
  bend?: Partial<Record<Limb, 1 | -1>>;
  /** Dirección del pie (90 = apoyado plano hacia delante). */
  footN?: number;
  footF?: number;
  /** Escorzo: segmentos que apuntan hacia la cámara se ven más cortos (1 = normal). */
  scale?: Partial<Record<ScaleKey, number>>;
};

export type Prop =
  | { k: 'barbell'; on: 'hands' | 'back' | 'front' | 'hip' }
  /** end = se ve de frente (círculo); side = de lado, perpendicular al antebrazo; goblet = vertical en el pecho. */
  | { k: 'dumbbell'; hands?: 'both' | 'near' | 'far'; grip?: 'end' | 'side' | 'goblet' }
  | { k: 'kettlebell'; hold?: 'hang' | 'goblet' }
  | { k: 'cable'; from: [number, number]; to?: 'hands' | 'near'; handle?: 'bar' | 'rope' | 'grip' }
  | { k: 'band'; from: [number, number] }
  /** Plataforma de la prensa, pegada a la planta del pie. */
  | { k: 'footplate'; side: 1 | -1 }
  /** Rodillo acolchado de máquina, pegado al tobillo. */
  | { k: 'roller'; side: 1 | -1 };

export type SceneItem =
  | { r: [number, number, number, number]; rx?: number; tone?: 'equip' | 'pad' }
  | { l: [number, number, number, number]; w?: number; tone?: 'equip' | 'pad' | 'cable' }
  | { c: [number, number, number]; tone?: 'equip' | 'pad' };

export type View = 'side' | 'front' | 'top';

export type Demo = {
  view?: View;
  frames: Pose[];
  /** ms de transición desde cada fotograma al siguiente (el último vuelve al primero). */
  move?: number | number[];
  /** ms de pausa en cada fotograma. */
  hold?: number | number[];
  props?: Prop[];
  scene?: SceneItem[];
  /** Segmentos que se resaltan en verde (por defecto, según el músculo principal). */
  focus?: Segment[];
  /** Sin línea de suelo. */
  noGround?: boolean;
  /** Texto de la vista si no es el estándar (p. ej. «Vista cenital»). */
  caption?: string;
};

export type Segment = 'torso' | 'ua' | 'fa' | 'th' | 'sn';

// Proporciones (unidades del lienzo 240 × 200).
export const CANVAS = { w: 240, h: 200, ground: 190 } as const;
const L = { torso: 46, neck: 13, headR: 8.5, ua: 26, fa: 24, th: 38, sn: 37, ft: 12, shW: 14, hpW: 8 } as const;

type V = [number, number];
const rad = (a: number) => (a * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const dir = (a: number, len: number): V => [Math.sin(rad(a)) * len, Math.cos(rad(a)) * len];
const add = (p: V, v: V): V => [p[0] + v[0], p[1] + v[1]];
const angleOf = (from: V, to: V) => deg(Math.atan2(to[0] - from[0], to[1] - from[1]));
const CORE: JointName[] = ['hip', 'neck', 'head', 'shN', 'shF', 'hpN', 'hpF', 'spine'];

/** Ángulos de dos segmentos que llevan el extremo de `root` a `target`. */
function twoBone(root: V, target: V, l1: number, l2: number, bend: number): [number, number] {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const base = deg(Math.atan2(dx, dy));
  const alpha = deg(Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)));
  const a1 = base + alpha * bend;
  const mid = add(root, dir(a1, l1));
  return [a1, angleOf(mid, add(root, dir(base, d)))];
}

export type Solved = { joints: Joints; angles: Record<Limb, [number, number]> };

/** Coloca todas las articulaciones de una postura. */
export function solveFull(p: Pose, view: View = 'side'): Solved {
  const s = (k: ScaleKey) => p.scale?.[k] ?? 1;
  const wide = view === 'front';
  let hip: V = [0, 0];
  const core = () => {
    const neck = add(hip, dir(p.torso, L.torso * s('torso')));
    const sp = add(add(hip, dir(p.torso, (L.torso * s('torso')) / 2)), dir(p.torso + 90, p.spine ?? 0));
    return {
      hip, neck, spine: sp,
      head: add(neck, dir(p.head ?? p.torso, L.neck)),
      shN: wide ? add(neck, dir(p.torso - 90, L.shW)) : neck,
      shF: wide ? add(neck, dir(p.torso + 90, L.shW)) : neck,
      hpN: wide ? add(hip, dir(p.torso - 90, L.hpW)) : hip,
      hpF: wide ? add(hip, dir(p.torso + 90, L.hpW)) : hip,
    };
  };
  let c = core();
  const coreAnchor = CORE.includes(p.at.j);
  if (coreAnchor) {
    const ref = (c as Record<string, V>)[p.at.j];
    hip = [p.at.x - (ref[0] - hip[0]), p.at.y - (ref[1] - hip[1])];
    c = core();
  }
  const useIk = coreAnchor && p.ik ? p.ik : {};
  const defBend: Record<Limb, 1 | -1> = { armN: -1, armF: -1, legN: 1, legF: 1 };
  const limb = (name: Limb, root: V, l1: number, l2: number, fallback?: [number, number]): [number, number] => {
    const t = useIk[name];
    if (t) return twoBone(root, t, l1, l2, p.bend?.[name] ?? defBend[name]);
    return fallback ?? [0, 0];
  };
  const armN = limb('armN', c.shN, L.ua * s('uaN'), L.fa * s('faN'), p.armN);
  const armF = limb('armF', c.shF, L.ua * s('uaF'), L.fa * s('faF'), p.armF ?? p.armN);
  const legN = limb('legN', c.hpN, L.th * s('thN'), L.sn * s('snN'), p.legN);
  const legF = limb('legF', c.hpF, L.th * s('thF'), L.sn * s('snF'), p.legF ?? p.legN);
  const elN = add(c.shN, dir(armN[0], L.ua * s('uaN')));
  const haN = add(elN, dir(armN[1], L.fa * s('faN')));
  const elF = add(c.shF, dir(armF[0], L.ua * s('uaF')));
  const haF = add(elF, dir(armF[1], L.fa * s('faF')));
  const knN = add(c.hpN, dir(legN[0], L.th * s('thN')));
  const anN = add(knN, dir(legN[1], L.sn * s('snN')));
  const toN = add(anN, dir(p.footN ?? 90, L.ft * s('ftN')));
  const knF = add(c.hpF, dir(legF[0], L.th * s('thF')));
  const anF = add(knF, dir(legF[1], L.sn * s('snF')));
  const toF = add(anF, dir(p.footF ?? 90, L.ft * s('ftF')));
  const j: Joints = { ...c, elN, haN, elF, haF, knN, anN, toN, knF, anF, toF };
  if (!coreAnchor) {
    const ref = j[p.at.j];
    const dx = p.at.x - ref[0];
    const dy = p.at.y - ref[1];
    (Object.keys(j) as JointName[]).forEach((k) => { j[k] = [j[k][0] + dx, j[k][1] + dy]; });
  }
  return { joints: j, angles: { armN, armF, legN, legF } };
}

export const solve = (p: Pose, view: View = 'side') => solveFull(p, view).joints;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpAngle = (a: number, b: number, t: number) => {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return a + d * t;
};
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const LIMBS: Limb[] = ['armN', 'armF', 'legN', 'legF'];
const SCALES: ScaleKey[] = ['torso', 'uaN', 'faN', 'uaF', 'faF', 'thN', 'snN', 'thF', 'snF', 'ftN', 'ftF'];

function blend(a: Pose, b: Pose, t: number, view: View): Joints {
  const sa = solveFull(a, view);
  const sb = solveFull(b, view);
  const scale: Partial<Record<ScaleKey, number>> = {};
  SCALES.forEach((k) => { scale[k] = lerp(a.scale?.[k] ?? 1, b.scale?.[k] ?? 1, t); });
  const sameAnchor = a.at.j === b.at.j;
  const pose: Pose = {
    at: sameAnchor
      ? { j: a.at.j, x: lerp(a.at.x, b.at.x, t), y: lerp(a.at.y, b.at.y, t) }
      : { j: 'hip', x: lerp(sa.joints.hip[0], sb.joints.hip[0], t), y: lerp(sa.joints.hip[1], sb.joints.hip[1], t) },
    torso: lerpAngle(a.torso, b.torso, t),
    spine: lerp(a.spine ?? 0, b.spine ?? 0, t),
    head: lerpAngle(a.head ?? a.torso, b.head ?? b.torso, t),
    footN: lerpAngle(a.footN ?? 90, b.footN ?? 90, t),
    footF: lerpAngle(a.footF ?? 90, b.footF ?? 90, t),
    scale,
    ik: {},
    bend: { ...a.bend },
  };
  const coreA = CORE.includes(pose.at.j);
  LIMBS.forEach((l) => {
    const ta = a.ik?.[l];
    const tb = b.ik?.[l];
    if (coreA && ta && tb && (a.bend?.[l] ?? 0) === (b.bend?.[l] ?? 0)) {
      pose.ik![l] = [lerp(ta[0], tb[0], t), lerp(ta[1], tb[1], t)];
    } else {
      const x = sa.angles[l];
      const y = sb.angles[l];
      pose[l] = [lerpAngle(x[0], y[0], t), lerpAngle(x[1], y[1], t)];
    }
  });
  return solve(pose, view);
}

const arr = (v: number | number[] | undefined, n: number, d: number) =>
  Array.from({ length: n }, (_, i) => (Array.isArray(v) ? v[i] ?? v[v.length - 1] ?? d : v ?? d));

/** Duración de una repetición completa (ida y vuelta), en ms. */
export function cycleMs(demo: Demo): number {
  const n = demo.frames.length;
  const mv = arr(demo.move, n, 1000);
  const hd = arr(demo.hold, n, 300);
  return mv.reduce((x, y) => x + y, 0) + hd.reduce((x, y) => x + y, 0);
}

/** Articulaciones en el instante `ms` del ciclo, y el fotograma clave más cercano. */
export function sample(demo: Demo, ms: number): { joints: Joints; frame: number } {
  const view = demo.view ?? 'side';
  const n = demo.frames.length;
  if (n === 1) return { joints: solve(demo.frames[0], view), frame: 0 };
  const mv = arr(demo.move, n, 1000);
  const hd = arr(demo.hold, n, 300);
  const total = cycleMs(demo);
  let t = ((ms % total) + total) % total;
  for (let i = 0; i < n; i++) {
    if (t < hd[i]) return { joints: solve(demo.frames[i], view), frame: i };
    t -= hd[i];
    if (t < mv[i]) {
      const next = (i + 1) % n;
      const k = ease(t / mv[i]);
      return { joints: blend(demo.frames[i], demo.frames[next], k, view), frame: k < 0.5 ? i : next };
    }
    t -= mv[i];
  }
  return { joints: solve(demo.frames[0], view), frame: 0 };
}

// ---------- Dibujo ----------

export type Shape =
  | { t: 'line'; x1: number; y1: number; x2: number; y2: number; w: number; c: string; o?: number }
  | { t: 'circle'; cx: number; cy: number; r: number; fill: string; stroke?: string; sw?: number }
  | { t: 'rect'; x: number; y: number; w: number; h: number; rx: number; fill: string; stroke?: string; sw?: number; rot?: number };

export const DEMO_COLORS = {
  body: '#E9E9EE',
  bodyFar: '#5E5E66',
  focus: '#B7FF36',
  focusFar: '#58761F',
  equip: '#A0A0A8',
  plate: '#26262B',
  pad: '#2C2C32',
  padLine: '#3C3C44',
  ground: '#2E2E33',
} as const;

const W = { torso: 15, ua: 8.5, fa: 7, th: 12, sn: 9, ft: 5 } as const;
const mid = (a: V, b: V): V => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

/** Lista de figuras (líneas, círculos y rectángulos) para pintar un instante de la demostración. */
export function draw(demo: Demo, j: Joints, focus: Segment[]): Shape[] {
  const C = DEMO_COLORS;
  const side = (demo.view ?? 'side') === 'side';
  const out: Shape[] = [];
  const f = new Set(focus);
  const line = (a: V, b: V, w: number, c: string) => out.push({ t: 'line', x1: a[0], y1: a[1], x2: b[0], y2: b[1], w, c });
  const seg = (a: JointName, b: JointName, w: number, key: Segment | null, far: boolean) => {
    const hot = key ? f.has(key) : false;
    const c = far && side ? (hot ? C.focusFar : C.bodyFar) : hot ? C.focus : C.body;
    line(j[a], j[b], w, c);
  };
  const props = demo.props ?? [];

  // Escenario (bancos, máquinas, barras fijas).
  for (const s of demo.scene ?? []) {
    if ('r' in s) out.push({ t: 'rect', x: s.r[0], y: s.r[1], w: s.r[2], h: s.r[3], rx: s.rx ?? 3, fill: s.tone === 'equip' ? C.equip : C.pad, stroke: C.padLine, sw: 1 });
    else if ('l' in s) {
      if (s.tone === 'pad') { line([s.l[0], s.l[1]], [s.l[2], s.l[3]], (s.w ?? 8) + 2, C.padLine); line([s.l[0], s.l[1]], [s.l[2], s.l[3]], s.w ?? 8, C.pad); }
      else line([s.l[0], s.l[1]], [s.l[2], s.l[3]], s.w ?? 4, s.tone === 'cable' ? C.equip : '#55555D');
    } else out.push({ t: 'circle', cx: s.c[0], cy: s.c[1], r: s.c[2], fill: s.tone === 'equip' ? C.equip : C.pad, stroke: C.padLine, sw: 1 });
  }

  const forearm = (el: JointName, ha: JointName) => angleOf(j[el], j[ha]);
  const dumbbell = (h: V, grip: 'end' | 'side' | 'goblet', a: number) => {
    if (grip === 'end') {
      out.push({ t: 'circle', cx: h[0], cy: h[1], r: 7, fill: C.plate, stroke: C.equip, sw: 2 });
      out.push({ t: 'circle', cx: h[0], cy: h[1], r: 2, fill: C.equip });
      return;
    }
    const d = grip === 'goblet' ? 0 : a + 90;
    const e1 = add(h, dir(d, 8)); const e2 = add(h, dir(d, -8));
    line(e1, e2, 3.5, C.equip);
    [[e1, add(h, dir(d, 14))], [e2, add(h, dir(d, -14))]].forEach(([p, q]) => { line(p, q, 13, C.equip); line(p, q, 10, C.plate); });
  };
  const roller = (side_: 1 | -1, near: boolean) => {
    const an = near ? j.anN : j.anF; const kn = near ? j.knN : j.knF;
    const a = angleOf(kn, an);
    const c = add(add(an, dir(a, -6)), dir(a + 90 * side_, 9));
    out.push({ t: 'circle', cx: c[0], cy: c[1], r: 7, fill: C.pad, stroke: C.equip, sw: 1.5 });
  };

  // Cables y bandas (detrás del cuerpo).
  props.forEach((p) => {
    if (p.k !== 'cable' && p.k !== 'band') return;
    const to = p.k === 'cable' && p.to === 'near' ? [j.haN] : side ? [j.haN] : [j.haN, j.haF];
    to.forEach((h) => line(p.from, h, p.k === 'band' ? 3 : 1.6, p.k === 'band' ? '#7FB327' : C.equip));
    if (p.k === 'cable') out.push({ t: 'circle', cx: p.from[0], cy: p.from[1], r: 4, fill: C.plate, stroke: C.equip, sw: 1.5 });
  });

  // Lado lejano (más oscuro en vista lateral).
  if (side) {
    seg('hpF', 'knF', W.th, 'th', true); seg('knF', 'anF', W.sn, 'sn', true); seg('anF', 'toF', W.ft, null, true);
    props.forEach((p) => { if (p.k === 'roller') roller(p.side, false); });
    seg('shF', 'elF', W.ua, 'ua', true); seg('elF', 'haF', W.fa, 'fa', true);
    props.forEach((p) => {
      if (p.k === 'dumbbell' && (p.hands ?? 'both') !== 'near' && p.grip !== 'goblet') dumbbell(j.haF, p.grip ?? 'end', forearm('elF', 'haF'));
    });
  }

  // Tronco y cabeza.
  seg('hip', 'spine', W.torso, 'torso', false);
  seg('spine', 'neck', W.torso, 'torso', false);
  out.push({ t: 'circle', cx: j.spine[0], cy: j.spine[1], r: W.torso / 2, fill: f.has('torso') ? C.focus : C.body });
  out.push({ t: 'circle', cx: j.head[0], cy: j.head[1], r: L.headR, fill: C.body });

  // Barra: en vista lateral se ve el disco; en frontal, la barra entera.
  const torsoA = angleOf(j.hip, j.neck);
  props.forEach((p) => {
    if (p.k !== 'barbell') return;
    const c: V = p.on === 'hands' ? mid(j.haN, j.haF)
      : p.on === 'back' ? add(add(j.neck, dir(torsoA + 90, 8)), dir(torsoA, -3))
      : p.on === 'front' ? add(add(j.neck, dir(torsoA - 90, 9)), dir(torsoA, -3))
      : add(j.hip, dir(torsoA - 90, 13));
    if (side) {
      out.push({ t: 'circle', cx: c[0], cy: c[1], r: 17, fill: C.plate, stroke: C.equip, sw: 2.2 });
      out.push({ t: 'circle', cx: c[0], cy: c[1], r: 3.2, fill: C.equip });
    } else {
      line([c[0] - 62, c[1]], [c[0] + 62, c[1]], 3, C.equip);
      [-1, 1].forEach((k) => out.push({ t: 'rect', x: c[0] + k * 52 - 4, y: c[1] - 17, w: 8, h: 34, rx: 2, fill: C.plate, stroke: C.equip, sw: 1.5 }));
    }
  });
  props.forEach((p) => {
    if (p.k !== 'footplate') return;
    const fa = angleOf(j.anN, j.toN);
    const n = dir(fa + 90 * p.side, 6);
    line(add(add(j.anN, dir(fa, -12)), n), add(add(j.toN, dir(fa, 10)), n), 6, C.equip);
  });

  // Lado cercano.
  const legs: JointName[][] = side ? [['hpN', 'knN', 'anN', 'toN']] : [['hpF', 'knF', 'anF', 'toF'], ['hpN', 'knN', 'anN', 'toN']];
  if (!side) seg('hpF', 'hpN', W.th, null, false);
  legs.forEach(([h, k, a, t]) => { seg(h, k, W.th, 'th', false); seg(k, a, W.sn, 'sn', false); seg(a, t, W.ft, null, false); });
  props.forEach((p) => { if (p.k === 'roller') roller(p.side, true); });
  if (!side) seg('shF', 'shN', W.ua, null, false);
  const arms: JointName[][] = side ? [['shN', 'elN', 'haN']] : [['shF', 'elF', 'haF'], ['shN', 'elN', 'haN']];
  arms.forEach(([s, e, h]) => { seg(s, e, W.ua, 'ua', false); seg(e, h, W.fa, 'fa', false); });

  props.forEach((p) => {
    if (p.k === 'dumbbell') {
      const hands = p.hands ?? 'both';
      if (p.grip === 'goblet') dumbbell(mid(j.haN, j.haF), 'goblet', 0);
      else {
        if (hands !== 'far') dumbbell(j.haN, p.grip ?? 'end', forearm('elN', 'haN'));
        if (!side && hands !== 'near') dumbbell(j.haF, p.grip ?? 'end', forearm('elF', 'haF'));
      }
    }
    if (p.k === 'kettlebell') {
      const h = mid(j.haN, j.haF);
      const a = p.hold === 'goblet' ? 0 : forearm('elN', 'haN');
      const b = add(h, dir(a, p.hold === 'goblet' ? 8 : 11));
      line(h, b, 3, C.equip);
      out.push({ t: 'circle', cx: b[0], cy: b[1], r: 9.5, fill: C.plate, stroke: C.equip, sw: 2.2 });
    }
    if (p.k === 'cable' && p.handle) {
      const h = j.haN;
      if (p.handle === 'bar') line([h[0] - 10, h[1]], [h[0] + 10, h[1]], 3.5, C.equip);
      else out.push({ t: 'circle', cx: h[0], cy: h[1], r: p.handle === 'rope' ? 4.5 : 3.5, fill: C.equip });
    }
  });
  return out;
}

export function groundLine(demo: Demo, box: Box = [0, 0, CANVAS.w, CANVAS.h]): Shape | null {
  if (demo.noGround) return null;
  return { t: 'line', x1: box[0] + 4, y1: CANVAS.ground + 1.5, x2: box[0] + box[2] - 4, y2: CANVAS.ground + 1.5, w: 3, c: DEMO_COLORS.ground };
}

export type Box = [number, number, number, number];
const boxes = new WeakMap<Demo, Box>();

/**
 * Encuadre (viewBox) que contiene todo el movimiento con margen, en proporción 6:5.
 * Así cada ejercicio se ve lo más grande posible sin que nada se corte durante el ciclo.
 */
export function frameBox(demo: Demo): Box {
  const cached = boxes.get(demo);
  if (cached) return cached;
  let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
  const take = (x: number, y: number, r = 0) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
  const total = cycleMs(demo);
  for (let t = 0; t < total; t += Math.max(30, total / 80)) {
    const { joints } = sample(demo, t);
    draw(demo, joints, []).forEach((s) => {
      if (s.t === 'line') { take(s.x1, s.y1, s.w / 2); take(s.x2, s.y2, s.w / 2); }
      else if (s.t === 'circle') take(s.cx, s.cy, s.r + (s.sw ?? 0));
      else { take(s.x, s.y); take(s.x + s.w, s.y + s.h); }
    });
  }
  if (!demo.noGround) y1 = Math.max(y1, CANVAS.ground + 4);
  const pad = 10;
  // Margen superior extra para la etiqueta de la esquina.
  x0 -= pad; y0 -= pad + 18; x1 += pad; y1 += demo.noGround ? pad : 2;
  let w = x1 - x0; let h = y1 - y0;
  const ratio = CANVAS.w / CANVAS.h;
  if (w < 150) { x0 -= (150 - w) / 2; w = 150; }
  if (w / h > ratio) { const nh = w / ratio; y0 -= nh - h; h = nh; } else { const nw = h * ratio; x0 -= (nw - w) / 2; w = nw; }
  const box: Box = [x0, y0, w, h];
  boxes.set(demo, box);
  return box;
}

/** Instante (ms) en que empieza el fotograma clave `i` (útil para miniaturas fijas). */
export function keyframeMs(demo: Demo, i: number): number {
  const n = demo.frames.length;
  const mv = arr(demo.move, n, 1000);
  const hd = arr(demo.hold, n, 300);
  let t = 0;
  for (let k = 0; k < Math.min(i, n); k++) t += hd[k] + mv[k];
  return t;
}
