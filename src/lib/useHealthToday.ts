import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayActiveEnergy, todaySteps } from './health';
import { useProgress } from './progress';
import { useSubscription } from './subscription';

/** Pasos y energía activa de hoy desde Apple Salud, si el usuario lo ha conectado y su plan lo incluye. */
export function useHealthToday() {
  const { settings } = useProgress();
  const { hasAccess } = useSubscription();
  const enabled = settings.healthSync && hasAccess('healthSync');
  const [data, setData] = useState<{ steps?: number; activeKcal?: number }>({});

  useEffect(() => {
    if (!enabled) return setData({});
    let alive = true;
    const load = async () => {
      const [steps, activeKcal] = await Promise.all([todaySteps(), todayActiveEnergy()]);
      if (alive) setData({ steps, activeKcal });
    };
    load();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && load());
    return () => {
      alive = false;
      sub.remove();
    };
  }, [enabled]);

  return { enabled, ...data };
}
