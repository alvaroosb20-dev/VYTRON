import type { FoodEntry, NutritionStore } from './nutrition';
import type { Store } from './progress';

/**
 * Fusión de datos entre este dispositivo y la nube.
 *
 * - Listas (sesiones, rutinas propias, pesos, comidas): se unen por id, sin duplicados.
 *   Lo borrado en cualquier dispositivo no vuelve (se guardan los ids borrados).
 * - Ajustes y datos corporales: gana la copia modificada más recientemente.
 * - Las fotos de comida son rutas de este teléfono: nunca se suben y se conservan en local.
 */

const later = (a: string, b: string) => (new Date(a).getTime() >= new Date(b).getTime() ? a : b);
const uniq = (xs: string[]) => Array.from(new Set(xs)).slice(-2000);

function unionBy<T>(newer: T[], older: T[], key: (x: T) => string, removed: Set<string>) {
  const map = new Map<string, T>();
  for (const x of older) map.set(key(x), x);
  for (const x of newer) map.set(key(x), x); // en conflicto, la versión de la copia más reciente
  return Array.from(map.values()).filter((x) => !removed.has(key(x)));
}

export function mergeProgress(local: Store, remote: Store | null | undefined): Store {
  if (!remote) return local;
  const localNewer = new Date(local.modifiedAt).getTime() >= new Date(remote.modifiedAt).getTime();
  const [newer, older] = localNewer ? [local, remote] : [remote, local];
  const deleted = {
    sessions: uniq([...(local.deleted?.sessions ?? []), ...(remote.deleted?.sessions ?? [])]),
    workouts: uniq([...(local.deleted?.workouts ?? []), ...(remote.deleted?.workouts ?? [])]),
  };
  const delS = new Set(deleted.sessions);
  const delW = new Set(deleted.workouts);
  return {
    sessions: unionBy(newer.sessions ?? [], older.sessions ?? [], (s) => s.id, delS).sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    ),
    customWorkouts: unionBy(newer.customWorkouts ?? [], older.customWorkouts ?? [], (w) => w.id, delW),
    weights: unionBy(newer.weights ?? [], older.weights ?? [], (w) => w.date, new Set()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    ),
    settings: {
      ...newer.settings,
      // Un plan que apunta a una rutina propia borrada pasa a descanso.
      weekPlan: newer.settings.weekPlan.map((id) => (id && delW.has(id) ? null : id)),
    },
    body: newer.body ?? {},
    modifiedAt: later(local.modifiedAt, remote.modifiedAt),
    deleted,
  };
}

export function mergeNutrition(local: NutritionStore, remote: NutritionStore | null | undefined): NutritionStore {
  if (!remote) return local;
  const deleted = uniq([...(local.deleted ?? []), ...(remote.deleted ?? [])]);
  const removed = new Set(deleted);
  const localById = new Map(local.entries.map((e) => [e.id, e]));
  // Para cada comida se conserva la foto local, si existe en este teléfono.
  const entries: FoodEntry[] = unionBy(local.entries, remote.entries ?? [], (e) => e.id, removed).map((e) => {
    const mine = localById.get(e.id);
    return { ...e, photoUri: mine?.photoUri };
  });
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return { entries, deleted, modifiedAt: later(local.modifiedAt, remote.modifiedAt) };
}

/** Lo que se sube a la nube: sin rutas de fotos locales. */
export const nutritionForCloud = (n: NutritionStore): NutritionStore => ({
  ...n,
  entries: n.entries.map(({ photoUri, ...e }) => e),
});

/** ¿Tiene este dispositivo algún dato propio? (para no sobrescribir nada sin preguntar) */
export const hasLocalData = (p: Store, n: NutritionStore) =>
  p.sessions.length > 0 || p.customWorkouts.length > 0 || p.weights.length > 0 || n.entries.length > 0;
