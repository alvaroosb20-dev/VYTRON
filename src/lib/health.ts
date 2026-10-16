import { Platform } from 'react-native';

/**
 * Conexión con Apple Salud (HealthKit) mediante react-native-health. Solo iOS y solo en
 * builds de desarrollo o producción (no en Expo Go). Todo es opcional: si el usuario no
 * concede permisos, la app funciona igual.
 */

// Carga diferida para que Android y web no intenten cargar el módulo nativo.
function kit(): any | null {
  if (Platform.OS !== 'ios') return null;
  try {
    return require('react-native-health').default;
  } catch {
    return null;
  }
}

export const healthAvailable = () => !!kit();

const call = <T,>(fn: (cb: (err: unknown, res: T) => void) => void) =>
  new Promise<T>((resolve, reject) => fn((err, res) => (err ? reject(err) : resolve(res))));

export async function connectHealth(): Promise<boolean> {
  const K = kit();
  if (!K) return false;
  const P = K.Constants.Permissions;
  const permissions = {
    permissions: {
      read: [P.Steps, P.ActiveEnergyBurned, P.Weight, P.Workout],
      write: [P.Workout, P.Weight, P.EnergyConsumed, P.Protein, P.Carbohydrates, P.FatTotal],
    },
  };
  try {
    await call<unknown>((cb) => K.initHealthKit(permissions, cb));
    return true;
  } catch {
    return false;
  }
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export async function todaySteps(): Promise<number | undefined> {
  const K = kit();
  if (!K) return undefined;
  try {
    const r = await call<{ value: number }>((cb) => K.getStepCount({ date: new Date().toISOString(), includeManuallyAdded: true }, cb));
    return Math.round(r?.value ?? 0);
  } catch {
    return undefined;
  }
}

export async function todayActiveEnergy(): Promise<number | undefined> {
  const K = kit();
  if (!K) return undefined;
  try {
    const r = await call<{ value: number }[]>((cb) =>
      K.getActiveEnergyBurned({ startDate: startOfToday().toISOString(), endDate: new Date().toISOString() }, cb),
    );
    return Math.round((r ?? []).reduce((a, x) => a + (x.value ?? 0), 0));
  } catch {
    return undefined;
  }
}

export async function latestWeightKg(): Promise<number | undefined> {
  const K = kit();
  if (!K) return undefined;
  try {
    const r = await call<{ value: number }>((cb) => K.getLatestWeight({ unit: 'gram' }, cb));
    return r?.value ? Math.round(r.value / 100) / 10 : undefined;
  } catch {
    return undefined;
  }
}

/** Guarda un entrenamiento de fuerza. No se envían calorías: VYTRON no las mide. */
export async function saveStrengthWorkout(start: Date, end: Date) {
  const K = kit();
  if (!K) return false;
  try {
    await call((cb) =>
      K.saveWorkout(
        { type: K.Constants.Activities.TraditionalStrengthTraining, startDate: start.toISOString(), endDate: end.toISOString() },
        cb,
      ),
    );
    return true;
  } catch {
    return false;
  }
}

export async function saveWeightKg(kg: number) {
  const K = kit();
  if (!K) return false;
  try {
    await call((cb) => K.saveWeight({ value: kg * 1000, unit: 'gram' }, cb));
    return true;
  } catch {
    return false;
  }
}

export async function saveFood(f: { name: string; kcal: number; proteinG?: number; carbsG?: number; fatG?: number; date: string; meal: string }) {
  const K = kit();
  if (!K) return false;
  const mealType = { desayuno: 'Breakfast', comida: 'Lunch', cena: 'Dinner', snack: 'Snacks' }[f.meal] ?? 'Snacks';
  try {
    await call((cb) =>
      K.saveFood(
        {
          foodName: f.name,
          mealType,
          date: f.date,
          energy: f.kcal,
          protein: f.proteinG,
          carbohydrates: f.carbsG,
          fatTotal: f.fatG,
        },
        cb,
      ),
    );
    return true;
  } catch {
    return false;
  }
}
