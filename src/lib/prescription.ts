import type { ExerciseInfo } from '@/data/exercises';
import { WORKOUTS, type Workout } from '@/data/workouts';

/** Series, repeticiones y descanso de un ejercicio dentro de un entrenamiento. */
export type Prescription = { sets: number; reps: string; restSec: number; from: string };

/**
 * Pauta del ejercicio según el entrenamiento del usuario: primero los entrenamientos de su
 * semana, luego sus rutinas propias y, si no está en ninguno, la pauta más habitual en los
 * entrenamientos de VYTRON (o una orientativa según el tipo de ejercicio).
 */
export function prescriptionsFor(e: ExerciseInfo, weekPlan: (string | null)[], custom: Workout[]): { list: Prescription[]; personal: boolean } {
  const all = [...custom, ...WORKOUTS];
  const byId = new Map(all.map((w) => [w.id, w]));
  const mine: Workout[] = [];
  weekPlan.forEach((id) => { const w = id ? byId.get(id) : undefined; if (w && !mine.includes(w)) mine.push(w); });
  custom.forEach((w) => { if (!mine.includes(w)) mine.push(w); });
  const pick = (ws: Workout[]) => ws.flatMap((w) => w.items.filter((it) => it.exerciseId === e.id).map((it) => ({ sets: it.sets, reps: it.reps, restSec: it.restSec, from: w.name })));
  const personal = pick(mine);
  if (personal.length) return { list: personal.slice(0, 3), personal: true };
  const general = pick(WORKOUTS);
  if (general.length) {
    const count = new Map<string, { p: Prescription; n: number }>();
    general.forEach((p) => { const k = `${p.sets}|${p.reps}|${p.restSec}`; const c = count.get(k); if (c) c.n++; else count.set(k, { p, n: 1 }); });
    const best = [...count.values()].sort((a, b) => b.n - a.n)[0].p;
    return { list: [{ ...best, from: 'Pauta habitual en VYTRON' }], personal: false };
  }
  return { list: [{ ...fallback(e), from: 'Pauta orientativa' }], personal: false };
}

function fallback(e: ExerciseInfo): Omit<Prescription, 'from'> {
  if (e.muscle === 'Movilidad') return { sets: 2, reps: '8 por lado', restSec: 30 };
  if (e.id === 'plank') return { sets: 3, reps: '30-45 s', restSec: 45 };
  if (e.muscle === 'Core') return { sets: 3, reps: '10-12', restSec: 45 };
  if (e.muscle === 'Cuerpo completo') return { sets: 3, reps: '10', restSec: 60 };
  if (e.weighted) return e.lower ? { sets: 3, reps: '8-10', restSec: 120 } : { sets: 3, reps: '8-12', restSec: 90 };
  return { sets: 3, reps: '10-15', restSec: 60 };
}

export const formatRest = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min` : `${s} s`);
