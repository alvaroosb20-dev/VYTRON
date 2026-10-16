import type { Tier } from '@/config/plans';
import { getExercise } from './exercises';

export type Setting = 'Gimnasio' | 'Mancuernas' | 'Sin material';

export type WorkoutItem = { exerciseId: string; sets: number; reps: string; restSec: number };

export type Workout = {
  id: string;
  name: string;
  focus: string;
  level: 'Inicial' | 'Intermedio' | 'Avanzado';
  minutes: number;
  tier: Tier;
  setting: Setting;
  items: WorkoutItem[];
  custom?: boolean;
};

const i = (exerciseId: string, sets: number, reps: string, restSec: number): WorkoutItem => ({ exerciseId, sets, reps, restSec });

// Rutinas basadas en estructuras de entrenamiento habituales (cuerpo completo, torso/pierna, push/pull/legs, 5×5).
export const WORKOUTS: Workout[] = [
  // ---------- FREE ----------
  { id: 'full-body-a', name: 'CUERPO COMPLETO A', focus: 'Fuerza general', level: 'Inicial', minutes: 40, tier: 'free', setting: 'Mancuernas',
    items: [i('squat', 3, '8-10', 90), i('pushup', 3, '8-12', 75), i('row-db', 3, '10-12', 75), i('glute-bridge', 3, '12-15', 60), i('plank', 3, '30 s', 45)] },
  { id: 'full-body-b', name: 'CUERPO COMPLETO B', focus: 'Fuerza general', level: 'Inicial', minutes: 40, tier: 'free', setting: 'Mancuernas',
    items: [i('lunge', 3, '10-12', 75), i('press-db', 3, '8-10', 90), i('rdl-db', 3, '10-12', 90), i('curl-db', 2, '10-12', 60), i('dead-bug', 3, '8-10', 45)] },
  { id: 'home-bodyweight', name: 'EN CASA SIN MATERIAL', focus: 'Cuerpo completo', level: 'Inicial', minutes: 30, tier: 'free', setting: 'Sin material',
    items: [i('air-squat', 4, '15-20', 60), i('incline-pushup', 3, '10-15', 60), i('superman', 3, '12', 45), i('lunge', 3, '10-12', 60), i('mountain-climber', 3, '30 s', 45), i('plank', 3, '40 s', 45)] },
  { id: 'core-15', name: 'CORE EXPRÉS', focus: 'Abdomen y estabilidad', level: 'Inicial', minutes: 15, tier: 'free', setting: 'Sin material',
    items: [i('dead-bug', 3, '8-10', 30), i('plank', 3, '40 s', 30), i('mountain-climber', 3, '30 s', 30), i('glute-bridge', 2, '15', 30)] },
  { id: 'mobility', name: 'MOVILIDAD ACTIVA', focus: 'Recuperación', level: 'Inicial', minutes: 20, tier: 'free', setting: 'Sin material',
    items: [i('cat-cow', 2, '10', 20), i('hip-90', 2, '8', 20), i('thoracic', 2, '8', 20), i('glute-bridge', 2, '12', 20)] },

  // ---------- PRO ----------
  { id: 'five-a', name: 'FUERZA 5×5 · A', focus: 'Fuerza máxima', level: 'Intermedio', minutes: 55, tier: 'pro', setting: 'Gimnasio',
    items: [i('back-squat', 5, '5', 180), i('bench', 5, '5', 180), i('barbell-row', 5, '5', 150)] },
  { id: 'five-b', name: 'FUERZA 5×5 · B', focus: 'Fuerza máxima', level: 'Intermedio', minutes: 50, tier: 'pro', setting: 'Gimnasio',
    items: [i('back-squat', 5, '5', 180), i('ohp', 5, '5', 150), i('deadlift', 1, '5', 180)] },
  { id: 'push', name: 'EMPUJE', focus: 'Pecho, hombro y tríceps', level: 'Intermedio', minutes: 55, tier: 'pro', setting: 'Gimnasio',
    items: [i('bench', 4, '6-8', 150), i('ohp', 3, '6-8', 120), i('incline-db', 3, '8-12', 90), i('lateral-raise', 3, '12-15', 60), i('triceps-pushdown', 3, '10-12', 60)] },
  { id: 'pull', name: 'TRACCIÓN', focus: 'Espalda y bíceps', level: 'Intermedio', minutes: 55, tier: 'pro', setting: 'Gimnasio',
    items: [i('deadlift', 3, '5', 180), i('pullup', 4, '6-10', 120), i('cable-row', 3, '10-12', 90), i('face-pull', 3, '12-15', 60), i('hammer-curl', 3, '10-12', 60)] },
  { id: 'legs', name: 'PIERNA', focus: 'Tren inferior completo', level: 'Intermedio', minutes: 60, tier: 'pro', setting: 'Gimnasio',
    items: [i('back-squat', 4, '6-8', 180), i('rdl', 3, '8-10', 150), i('leg-press', 3, '10-12', 120), i('leg-curl', 3, '10-12', 75), i('calf', 4, '12-15', 60)] },
  { id: 'upper', name: 'TORSO', focus: 'Empuje y tracción', level: 'Intermedio', minutes: 55, tier: 'pro', setting: 'Gimnasio',
    items: [i('bench', 4, '6-8', 150), i('barbell-row', 4, '6-8', 120), i('ohp', 3, '8-10', 120), i('lat-pulldown', 3, '10-12', 90), i('dips', 2, '8-12', 90)] },
  { id: 'lower', name: 'PIERNA Y GLÚTEO', focus: 'Tren inferior', level: 'Intermedio', minutes: 55, tier: 'pro', setting: 'Gimnasio',
    items: [i('front-squat', 4, '6-8', 150), i('hip-thrust', 4, '8-10', 120), i('bulgarian', 3, '8-10', 90), i('leg-extension', 3, '12-15', 60), i('hanging-knee', 3, '10-12', 60)] },
  { id: 'arms', name: 'BRAZOS Y HOMBROS', focus: 'Hipertrofia', level: 'Intermedio', minutes: 40, tier: 'pro', setting: 'Gimnasio',
    items: [i('dips', 3, '8-12', 90), i('curl-db', 3, '10-12', 60), i('triceps-pushdown', 3, '10-12', 60), i('hammer-curl', 3, '10-12', 60), i('lateral-raise', 4, '12-15', 45), i('face-pull', 3, '15', 45)] },
  { id: 'db-strength', name: 'FUERZA CON MANCUERNAS', focus: 'Cuerpo completo en casa', level: 'Intermedio', minutes: 45, tier: 'pro', setting: 'Mancuernas',
    items: [i('bulgarian', 4, '8-10', 90), i('incline-db', 4, '8-10', 90), i('row-db', 4, '10-12', 75), i('rdl-db', 3, '10-12', 90), i('pallof', 3, '10', 45)] },

  // ---------- PREMIUM ----------
  { id: 'conditioning', name: 'ACONDICIONAMIENTO', focus: 'Resistencia y potencia', level: 'Avanzado', minutes: 30, tier: 'premium', setting: 'Mancuernas',
    items: [i('kb-swing', 5, '15', 45), i('thruster', 4, '10', 60), i('burpee', 4, '10', 45), i('farmer', 4, '40 m', 60)] },
  { id: 'athletic', name: 'ATLÉTICO', focus: 'Fuerza y control', level: 'Avanzado', minutes: 45, tier: 'premium', setting: 'Gimnasio',
    items: [i('front-squat', 4, '5', 150), i('renegade-row', 3, '8-10', 75), i('goblet-cossack', 3, '6-8', 75), i('nordic', 3, '4-6', 90), i('pallof', 3, '10', 45)] },
];

export const getWorkout = (id: string, custom: Workout[] = []) => [...WORKOUTS, ...custom].find((w) => w.id === id);

export const totalSets = (w: Workout) => w.items.reduce((a, it) => a + it.sets, 0);

/** Duración aproximada calculada con series, ~45 s por serie y los descansos indicados. */
export const estimateMinutes = (items: WorkoutItem[]) =>
  Math.max(10, Math.round(items.reduce((a, it) => a + it.sets * (45 + it.restSec), 0) / 60));

export const exerciseName = (id: string) => getExercise(id)?.name ?? id;

// Plan semanal por defecto (0 = domingo).
export const DEFAULT_WEEK: (string | null)[] = [null, 'full-body-a', 'mobility', 'full-body-b', null, 'full-body-a', 'core-15'];
