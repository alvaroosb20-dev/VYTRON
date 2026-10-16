import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { BodyProfile } from './progress';

export type Meal = 'desayuno' | 'comida' | 'cena' | 'snack';
export type FoodEntry = {
  id: string;
  date: string; // ISO
  meal: Meal;
  name: string;
  kcal: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  source: 'foto' | 'manual';
  photoUri?: string;
};

const KEY = 'vytron.nutrition.v1';

type Ctx = {
  entries: FoodEntry[];
  add: (e: Omit<FoodEntry, 'id' | 'date'> & { date?: string }) => Promise<FoodEntry>;
  remove: (id: string) => Promise<void>;
};

const NutritionContext = createContext<Ctx | null>(null);

export function NutritionProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const ref = useRef(entries);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const list = JSON.parse(raw);
        if (Array.isArray(list)) { ref.current = list; setEntries(list); }
      })
      .catch(() => {});
  }, []);

  const save = useCallback(async (next: FoodEntry[]) => {
    ref.current = next;
    setEntries(next);
    try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }, []);

  const value = useMemo<Ctx>(() => ({
    entries,
    add: async (e) => {
      const entry: FoodEntry = { ...e, id: `${Date.now()}`, date: e.date ?? new Date().toISOString() };
      await save([entry, ...ref.current]);
      return entry;
    },
    remove: (id) => save(ref.current.filter((x) => x.id !== id)),
  }), [entries, save]);

  return <NutritionContext.Provider value={value}>{children}</NutritionContext.Provider>;
}

export function useNutrition() {
  const ctx = useContext(NutritionContext);
  if (!ctx) throw new Error('useNutrition debe usarse dentro de NutritionProvider');
  return ctx;
}

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function dayTotals(entries: FoodEntry[], day = new Date()) {
  const list = entries.filter((e) => sameDay(new Date(e.date), day));
  return {
    list,
    kcal: Math.round(list.reduce((a, e) => a + e.kcal, 0)),
    protein: Math.round(list.reduce((a, e) => a + (e.proteinG ?? 0), 0)),
    carbs: Math.round(list.reduce((a, e) => a + (e.carbsG ?? 0), 0)),
    fat: Math.round(list.reduce((a, e) => a + (e.fatG ?? 0), 0)),
  };
}

/**
 * Objetivo diario ESTIMADO con la ecuación de Mifflin-St Jeor y un factor de actividad.
 * Devuelve undefined si faltan datos: nunca se inventa un objetivo.
 */
export function dailyTarget(b: BodyProfile) {
  if (!b.sex || !b.age || !b.heightCm || !b.weightKg || !b.activity) return undefined;
  const bmr = 10 * b.weightKg + 6.25 * b.heightCm - 5 * b.age + (b.sex === 'hombre' ? 5 : -161);
  const tdee = bmr * b.activity;
  const factor = b.goal === 'perder' ? 0.85 : b.goal === 'ganar' ? 1.1 : 1;
  const kcal = Math.round((tdee * factor) / 10) * 10;
  const protein = Math.round(b.weightKg * 1.8);
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, carbs, fat, bmr: Math.round(bmr), tdee: Math.round(tdee) };
}

export const MEAL_LABEL: Record<Meal, string> = { desayuno: 'Desayuno', comida: 'Comida', cena: 'Cena', snack: 'Snack' };

export function mealForNow(): Meal {
  const h = new Date().getHours();
  return h < 11 ? 'desayuno' : h < 16 ? 'comida' : h < 19 ? 'snack' : 'cena';
}
