import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_WEEK } from '@/data/workouts';

// Progreso real del usuario: solo lo que ha registrado. Sin datos de ejemplo ni cifras inventadas.

export type LoggedSet = { exerciseId: string; weightKg?: number };
export type Session = { id: string; workoutId: string; completedAt: string; minutes: number; sets: LoggedSet[] };
type Settings = { weeklyGoal: number; weekPlan: (string | null)[] };

const KEY = 'vytron.progress.v1';
const DEFAULTS: Settings = { weeklyGoal: 3, weekPlan: DEFAULT_WEEK };

type Ctx = {
  ready: boolean;
  sessions: Session[];
  settings: Settings;
  logSession: (s: Omit<Session, 'id' | 'completedAt'>) => Promise<void>;
  setWeeklyGoal: (n: number) => Promise<void>;
  setDayPlan: (weekday: number, workoutId: string | null) => Promise<void>;
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const data = JSON.parse(raw);
          setSessions(Array.isArray(data.sessions) ? data.sessions : []);
          setSettings({ ...DEFAULTS, ...(data.settings ?? {}) });
        }
      } catch {
        // Si el almacenamiento falla, la app sigue funcionando desde cero.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const persist = useCallback(async (nextSessions: Session[], nextSettings: Settings) => {
    setSessions(nextSessions);
    setSettings(nextSettings);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify({ sessions: nextSessions, settings: nextSettings }));
    } catch {}
  }, []);

  const value = useMemo<Ctx>(() => ({
    ready,
    sessions,
    settings,
    logSession: (s) =>
      persist([{ ...s, id: `${Date.now()}`, completedAt: new Date().toISOString() }, ...sessions], settings),
    setWeeklyGoal: (n) => persist(sessions, { ...settings, weeklyGoal: Math.max(1, Math.min(7, n)) }),
    setDayPlan: (weekday, workoutId) => {
      const weekPlan = [...settings.weekPlan];
      weekPlan[weekday] = workoutId;
      return persist(sessions, { ...settings, weekPlan });
    },
  }), [ready, sessions, settings, persist]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress debe usarse dentro de ProgressProvider');
  return ctx;
}

// ---- Cálculos (semana de lunes a domingo) ----

export function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const diff = (x.getDay() + 6) % 7; // lunes = 0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - diff);
  return x;
}

/** Días entrenados de la semana actual, de lunes (0) a domingo (6). */
export function daysTrainedThisWeek(sessions: Session[]) {
  const start = startOfWeek().getTime();
  const days = Array(7).fill(false) as boolean[];
  for (const s of sessions) {
    const t = new Date(s.completedAt);
    if (t.getTime() >= start) days[(t.getDay() + 6) % 7] = true;
  }
  return days;
}

export function sessionsThisWeek(sessions: Session[]) {
  const start = startOfWeek().getTime();
  return sessions.filter((s) => new Date(s.completedAt).getTime() >= start).length;
}

/** Sesiones por semana, de la más antigua a la actual. */
export function weeklyHistory(sessions: Session[], weeks: number) {
  const current = startOfWeek();
  return Array.from({ length: weeks }, (_, i) => {
    const from = new Date(current);
    from.setDate(from.getDate() - 7 * (weeks - 1 - i));
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    const list = sessions.filter((s) => {
      const t = new Date(s.completedAt).getTime();
      return t >= from.getTime() && t < to.getTime();
    });
    return { from, count: list.length, minutes: list.reduce((a, s) => a + s.minutes, 0) };
  });
}

/** Semanas consecutivas (hasta la anterior) cumpliendo el objetivo; suma la actual si ya lo cumple. */
export function goalStreak(sessions: Session[], goal: number) {
  const hist = weeklyHistory(sessions, 52);
  let streak = hist[hist.length - 1].count >= goal ? 1 : 0;
  for (let i = hist.length - 2; i >= 0 && hist[i].count >= goal; i--) streak++;
  return streak;
}

export function personalRecords(sessions: Session[]) {
  const best: Record<string, { weightKg: number; date: string }> = {};
  for (const s of sessions)
    for (const set of s.sets)
      if (set.weightKg && (!best[set.exerciseId] || set.weightKg > best[set.exerciseId].weightKg))
        best[set.exerciseId] = { weightKg: set.weightKg, date: s.completedAt };
  return best;
}
