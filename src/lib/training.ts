import { EXERCISES, getExercise, Muscle } from '@/data/exercises';
import { Setting, WorkoutItem } from '@/data/workouts';
import type { Session } from './progress';

/** 1RM estimado (fórmula de Epley). Solo fiable hasta ~12 repeticiones. */
export function estimate1RM(weightKg: number, reps: number) {
  if (!weightKg || !reps || reps > 12) return undefined;
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 2) / 2;
}

/** Límite superior del rango de repeticiones ("8-12" → 12, "5" → 5, "30 s" → undefined). */
export function topReps(reps: string) {
  if (/s|m/.test(reps)) return undefined;
  const nums = reps.match(/\d+/g)?.map(Number);
  return nums?.length ? Math.max(...nums) : undefined;
}

/**
 * Progresión doble (Premium): si en la última sesión se llegó al máximo del rango en
 * todas las series con el mismo peso, sugiere subir 2,5 kg (torso) o 5 kg (pierna).
 */
export function suggestNext(exerciseId: string, item: WorkoutItem, sessions: Session[]) {
  const last = sessions.find((s) => s.sets.some((x) => x.exerciseId === exerciseId && x.weightKg));
  if (!last) return undefined;
  const sets = last.sets.filter((x) => x.exerciseId === exerciseId && x.weightKg);
  const weight = Math.max(...sets.map((x) => x.weightKg!));
  const top = topReps(item.reps);
  const allTop = !!top && sets.length >= item.sets && sets.every((x) => (x.reps ?? 0) >= top);
  const step = getExercise(exerciseId)?.lower ? 5 : 2.5;
  return allTop
    ? { weightKg: weight + step, reason: `Completaste ${item.sets}×${top}: toca subir ${step} kg.` }
    : { weightKg: weight, reason: 'Repite la carga hasta completar todas las series en el máximo del rango.' };
}

/** Discos por lado para una carga objetivo con barra olímpica. */
export function platesPerSide(targetKg: number, barKg = 20, available = [25, 20, 15, 10, 5, 2.5, 1.25]) {
  let rest = Math.round(((targetKg - barKg) / 2) * 100) / 100;
  if (rest < 0) return { plates: [] as number[], remainder: 0, valid: false };
  const plates: number[] = [];
  for (const p of available) while (rest >= p - 1e-9) { plates.push(p); rest = Math.round((rest - p) * 100) / 100; }
  return { plates, remainder: rest, valid: true };
}

/** Series efectivas por grupo muscular (principal cuenta 1, secundario 0,5) en un periodo. */
export function setsByMuscle(sessions: Session[], sinceMs: number) {
  const out = {} as Record<Muscle, number>;
  for (const s of sessions) {
    if (new Date(s.completedAt).getTime() < sinceMs) continue;
    for (const set of s.sets) {
      const e = getExercise(set.exerciseId);
      if (!e) continue;
      out[e.muscle] = (out[e.muscle] ?? 0) + 1;
      for (const m of e.secondary ?? []) out[m] = (out[m] ?? 0) + 0.5;
    }
  }
  return out;
}

/** Volumen (kg × repeticiones) de una sesión. */
export const sessionVolume = (s: Session) => s.sets.reduce((a, x) => a + (x.weightKg ?? 0) * (x.reps ?? 0), 0);

// ---------------- Generador de plan personalizado (Premium) ----------------

export type Goal = 'fuerza' | 'musculo' | 'grasa' | 'salud';

const TEMPLATES: Record<Setting, Record<Goal, string[]>> = {
  Gimnasio: {
    fuerza: ['five-a', 'five-b', 'upper', 'lower', 'pull', 'push'],
    musculo: ['push', 'pull', 'legs', 'upper', 'lower', 'arms'],
    grasa: ['upper', 'conditioning', 'lower', 'athletic', 'conditioning', 'full-body-a'],
    salud: ['full-body-a', 'mobility', 'full-body-b', 'core-15', 'upper', 'lower'],
  },
  Mancuernas: {
    fuerza: ['db-strength', 'full-body-a', 'full-body-b', 'db-strength', 'conditioning', 'core-15'],
    musculo: ['db-strength', 'full-body-b', 'full-body-a', 'db-strength', 'core-15', 'mobility'],
    grasa: ['db-strength', 'conditioning', 'full-body-a', 'conditioning', 'full-body-b', 'core-15'],
    salud: ['full-body-a', 'mobility', 'full-body-b', 'core-15', 'db-strength', 'mobility'],
  },
  'Sin material': {
    fuerza: ['home-bodyweight', 'core-15', 'home-bodyweight', 'mobility', 'home-bodyweight', 'core-15'],
    musculo: ['home-bodyweight', 'core-15', 'home-bodyweight', 'mobility', 'home-bodyweight', 'core-15'],
    grasa: ['home-bodyweight', 'core-15', 'home-bodyweight', 'mobility', 'home-bodyweight', 'core-15'],
    salud: ['home-bodyweight', 'mobility', 'core-15', 'home-bodyweight', 'mobility', 'core-15'],
  },
};

// Días de entrenamiento repartidos para dejar descanso entre sesiones (0 = domingo).
const DAY_LAYOUT: Record<number, number[]> = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
  6: [1, 2, 3, 4, 5, 6],
};

export function generatePlan(goal: Goal, days: number, setting: Setting) {
  const plan: (string | null)[] = Array(7).fill(null);
  const routines = TEMPLATES[setting][goal];
  (DAY_LAYOUT[days] ?? DAY_LAYOUT[3]).forEach((d, idx) => (plan[d] = routines[idx % routines.length]));
  return plan;
}

export const LIBRARY_SIZE = EXERCISES.length;
