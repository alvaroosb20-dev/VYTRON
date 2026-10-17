import type { IconName } from '@/components/Icon';
import { personalRecords, Session, weeklyHistory } from './progress';
import { sessionVolume } from './training';

/** Logros calculados a partir de lo que el usuario ha registrado. Nada se guarda aparte. */

type Ctx = { sessions: number; streak: number; records: number; volumeKg: number };

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  /** Progreso de 0 a 1. */
  progress: (c: Ctx) => number;
};

const count = (n: number, key: keyof Ctx) => (c: Ctx) => Math.min(1, c[key] / n);

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: 'PRIMER PASO', description: 'Completa tu primera sesión', icon: 'play', progress: count(1, 'sessions') },
  { id: 'week', title: 'SEMANA CUMPLIDA', description: 'Cumple tu objetivo semanal', icon: 'target', progress: count(1, 'streak') },
  { id: 's10', title: 'CONSTANCIA', description: '10 sesiones completadas', icon: 'train', progress: count(10, 'sessions') },
  { id: 'pr', title: 'NUEVA MARCA', description: 'Registra tu primera serie con peso', icon: 'trophy', progress: count(1, 'records') },
  { id: 'streak4', title: 'UN MES SIN FALLAR', description: '4 semanas seguidas cumpliendo', icon: 'flame', progress: count(4, 'streak') },
  { id: 's25', title: 'HÁBITO', description: '25 sesiones completadas', icon: 'calendar', progress: count(25, 'sessions') },
  { id: 'vol10k', title: '10 TONELADAS', description: '10.000 kg levantados en total', icon: 'scale', progress: count(10000, 'volumeKg') },
  { id: 'streak12', title: 'IMPARABLE', description: '12 semanas seguidas cumpliendo', icon: 'flame', progress: count(12, 'streak') },
  { id: 's50', title: 'DISCIPLINA', description: '50 sesiones completadas', icon: 'spark', progress: count(50, 'sessions') },
  { id: 's100', title: 'CENTURIÓN', description: '100 sesiones completadas', icon: 'trophy', progress: count(100, 'sessions') },
];

/** Mejor racha de semanas cumpliendo el objetivo (último año). Un logro no se pierde aunque la racha se corte. */
function bestStreak(sessions: Session[], goal: number) {
  let best = 0;
  let run = 0;
  for (const w of weeklyHistory(sessions, 52)) {
    run = w.count >= goal ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

function context(sessions: Session[], weeklyGoal: number): Ctx {
  return {
    sessions: sessions.length,
    streak: bestStreak(sessions, weeklyGoal),
    records: Object.keys(personalRecords(sessions)).length,
    volumeKg: sessions.reduce((a, s) => a + sessionVolume(s), 0),
  };
}

export function achievementStatus(sessions: Session[], weeklyGoal: number) {
  const c = context(sessions, weeklyGoal);
  return ACHIEVEMENTS.map((a) => ({ ...a, value: a.progress(c), unlocked: a.progress(c) >= 1 }));
}

/** Logros que se desbloquean al pasar de `before` a `after`. */
export function newlyUnlocked(before: Session[], after: Session[], weeklyGoal: number) {
  const had = new Set(achievementStatus(before, weeklyGoal).filter((a) => a.unlocked).map((a) => a.id));
  return achievementStatus(after, weeklyGoal).filter((a) => a.unlocked && !had.has(a.id));
}
