import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_WEEK, Workout } from '@/data/workouts';

// Datos del usuario guardados en el dispositivo. Solo lo que el usuario registra: sin datos de ejemplo.

export type LoggedSet = { exerciseId: string; reps?: number; weightKg?: number };
export type Session = { id: string; workoutId: string; workoutName: string; completedAt: string; minutes: number; sets: LoggedSet[] };
export type WeightEntry = { date: string; kg: number };
export type Sex = 'hombre' | 'mujer';
export type Activity = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;
export type BodyProfile = { sex?: Sex; age?: number; heightCm?: number; weightKg?: number; activity?: Activity; goal?: 'perder' | 'mantener' | 'ganar' };

type Settings = {
  weeklyGoal: number;
  weekPlan: (string | null)[];
  activeProgram?: { id: string; startedAt: string };
  healthSync: boolean;
};

type Store = {
  sessions: Session[];
  settings: Settings;
  customWorkouts: Workout[];
  weights: WeightEntry[];
  body: BodyProfile;
};

const KEY = 'vytron.progress.v2';
const DEFAULTS: Store = {
  sessions: [],
  settings: { weeklyGoal: 3, weekPlan: DEFAULT_WEEK, healthSync: false },
  customWorkouts: [],
  weights: [],
  body: {},
};

type Ctx = Store & {
  ready: boolean;
  logSession: (s: Omit<Session, 'id' | 'completedAt'>) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  setWeeklyGoal: (n: number) => Promise<void>;
  setDayPlan: (weekday: number, workoutId: string | null) => Promise<void>;
  setWeekPlan: (plan: (string | null)[]) => Promise<void>;
  startProgram: (id: string, schedule: (string | null)[]) => Promise<void>;
  stopProgram: () => Promise<void>;
  saveCustomWorkout: (w: Workout) => Promise<void>;
  deleteCustomWorkout: (id: string) => Promise<void>;
  addWeight: (kg: number) => Promise<void>;
  setBody: (b: BodyProfile) => Promise<void>;
  setHealthSync: (on: boolean) => Promise<void>;
};

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [store, setStore] = useState<Store>(DEFAULTS);
  const ref = useRef(store);

  useEffect(() => {
    (async () => {
      try {
        const raw = (await AsyncStorage.getItem(KEY)) ?? (await AsyncStorage.getItem('vytron.progress.v1'));
        if (raw) {
          const d = JSON.parse(raw);
          const next: Store = {
            sessions: Array.isArray(d.sessions) ? d.sessions : [],
            settings: { ...DEFAULTS.settings, ...(d.settings ?? {}) },
            customWorkouts: Array.isArray(d.customWorkouts) ? d.customWorkouts : [],
            weights: Array.isArray(d.weights) ? d.weights : [],
            body: d.body ?? {},
          };
          ref.current = next;
          setStore(next);
        }
      } catch {
        // Si el almacenamiento falla, la app sigue funcionando desde cero.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Actualización atómica: siempre parte del último estado guardado.
  const update = useCallback(async (fn: (s: Store) => Store) => {
    const next = fn(ref.current);
    ref.current = next;
    setStore(next);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const value = useMemo<Ctx>(() => ({
    ...store,
    ready,
    logSession: async (s) => {
      const session: Session = { ...s, id: `${Date.now()}`, completedAt: new Date().toISOString() };
      await update((st) => ({ ...st, sessions: [session, ...st.sessions] }));
      return session;
    },
    deleteSession: (id) => update((st) => ({ ...st, sessions: st.sessions.filter((x) => x.id !== id) })),
    setWeeklyGoal: (n) => update((st) => ({ ...st, settings: { ...st.settings, weeklyGoal: Math.max(1, Math.min(7, n)) } })),
    setDayPlan: (d, id) =>
      update((st) => {
        const weekPlan = [...st.settings.weekPlan];
        weekPlan[d] = id;
        return { ...st, settings: { ...st.settings, weekPlan } };
      }),
    setWeekPlan: (plan) => update((st) => ({ ...st, settings: { ...st.settings, weekPlan: plan, activeProgram: undefined } })),
    startProgram: (id, schedule) =>
      update((st) => ({
        ...st,
        settings: {
          ...st.settings,
          weekPlan: schedule,
          weeklyGoal: schedule.filter(Boolean).length,
          activeProgram: { id, startedAt: new Date().toISOString() },
        },
      })),
    stopProgram: () => update((st) => ({ ...st, settings: { ...st.settings, activeProgram: undefined } })),
    saveCustomWorkout: (w) =>
      update((st) => ({ ...st, customWorkouts: [w, ...st.customWorkouts.filter((x) => x.id !== w.id)] })),
    deleteCustomWorkout: (id) =>
      update((st) => ({
        ...st,
        customWorkouts: st.customWorkouts.filter((x) => x.id !== id),
        settings: { ...st.settings, weekPlan: st.settings.weekPlan.map((p) => (p === id ? null : p)) },
      })),
    addWeight: (kg) =>
      update((st) => ({
        ...st,
        weights: [{ date: new Date().toISOString(), kg }, ...st.weights],
        body: { ...st.body, weightKg: kg },
      })),
    setBody: (b) => update((st) => ({ ...st, body: { ...st.body, ...b } })),
    setHealthSync: (on) => update((st) => ({ ...st, settings: { ...st.settings, healthSync: on } })),
  }), [store, ready, update]);

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
  const diff = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - diff);
  return x;
}

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

export function goalStreak(sessions: Session[], goal: number) {
  const hist = weeklyHistory(sessions, 52);
  let streak = hist[hist.length - 1].count >= goal ? 1 : 0;
  for (let i = hist.length - 2; i >= 0 && hist[i].count >= goal; i--) streak++;
  return streak;
}

/** Mejor marca por ejercicio: mayor peso y mejor 1RM estimado. */
export function personalRecords(sessions: Session[]) {
  const best: Record<string, { weightKg: number; reps?: number; date: string }> = {};
  for (const s of sessions)
    for (const set of s.sets)
      if (set.weightKg && (!best[set.exerciseId] || set.weightKg > best[set.exerciseId].weightKg))
        best[set.exerciseId] = { weightKg: set.weightKg, reps: set.reps, date: s.completedAt };
  return best;
}
