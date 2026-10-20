import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './auth';
import { NutritionStore, useNutrition } from './nutrition';
import { Store, useProgress } from './progress';
import { supabase } from './supabase';
import { mergeNutrition, mergeProgress, nutritionForCloud } from './syncMerge';

/**
 * Sincronización con la nube (tabla user_data, una fila por usuario, protegida con RLS).
 *
 * - Al iniciar sesión, al volver a la app y unos segundos después de cada cambio:
 *   descarga, fusiona con lo local y sube el resultado.
 * - Si en el teléfono había datos de OTRA cuenta, no se mezclan: se cargan los de la nueva.
 */

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'error';
type Ctx = {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  syncNow: () => Promise<void>;
  /** La primera sincronización tras iniciar sesión ha terminado (bien o mal). */
  initialSyncDone: boolean;
};

const SyncContext = createContext<Ctx>({ status: 'off', lastSyncedAt: null, syncNow: async () => {}, initialSyncDone: true });
const OWNER_KEY = 'vytron.sync.owner';
const DEBOUNCE_MS = 2500;

const EMPTY_NUTRITION: NutritionStore = { entries: [], deleted: [], modifiedAt: new Date(0).toISOString() };

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const progress = useProgress();
  const nutrition = useNutrition();
  const [status, setStatus] = useState<SyncStatus>('off');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [initialSyncDone, setInitialSyncDone] = useState(true);

  // Refs para leer siempre lo último sin re-crear la función de sincronizar.
  const p = useRef(progress);
  const n = useRef(nutrition);
  p.current = progress;
  n.current = nutrition;
  const running = useRef(false);
  const pending = useRef(false);
  const remoteVersion = useRef<string | null>(null);
  const lastPushed = useRef<string | null>(null);
  const userId = user?.id ?? null;

  const sync = useCallback(async () => {
    if (!supabase || !userId || !p.current.ready || !n.current.ready) return;
    if (running.current) {
      pending.current = true;
      return;
    }
    running.current = true;
    setStatus('syncing');
    try {
      const { data: remote, error } = await supabase
        .from('user_data')
        .select('progress, nutrition, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;

      const owner = await AsyncStorage.getItem(OWNER_KEY);
      const otherAccount = !!owner && owner !== userId;

      if (otherAccount) {
        // Datos de otra cuenta en este teléfono: se sustituyen por los de esta cuenta.
        const rp = remote?.progress as Store | undefined;
        if (rp?.settings) await p.current.replaceAll(rp);
        await n.current.replaceAll((remote?.nutrition as NutritionStore) ?? EMPTY_NUTRITION);
      } else if (remote && remote.updated_at !== remoteVersion.current) {
        // Se vuelve a fusionar con el estado actual por si el usuario guardó algo mientras tanto.
        const mp = mergeProgress(p.current.snapshot(), remote.progress as Store);
        const mn = mergeNutrition(n.current.snapshot(), remote.nutrition as NutritionStore);
        await p.current.replaceAll(mergeProgress(p.current.snapshot(), mp));
        await n.current.replaceAll(mergeNutrition(n.current.snapshot(), mn));
      }
      await AsyncStorage.setItem(OWNER_KEY, userId);
      remoteVersion.current = remote?.updated_at ?? null;

      const payload = { progress: p.current.snapshot(), nutrition: nutritionForCloud(n.current.snapshot()) };
      const json = JSON.stringify(payload);
      if (!remote || json !== lastPushed.current) {
        const { data: saved, error: upErr } = await supabase
          .from('user_data')
          .upsert({ user_id: userId, ...payload })
          .select('updated_at')
          .single();
        if (upErr) throw upErr;
        remoteVersion.current = saved.updated_at;
        lastPushed.current = json;
      }
      setLastSyncedAt(new Date());
      setStatus('idle');
    } catch {
      setStatus('error');
    } finally {
      setInitialSyncDone(true);
      running.current = false;
      if (pending.current) {
        pending.current = false;
        sync();
      }
    }
  }, [userId]);

  // Al iniciar o cerrar sesión.
  useEffect(() => {
    remoteVersion.current = null;
    lastPushed.current = null;
    if (!userId) {
      setStatus('off');
      setLastSyncedAt(null);
      setInitialSyncDone(true);
      return;
    }
    setInitialSyncDone(false);
    sync();
    // Sin red, no se bloquea a nadie: a los 10 s se continúa con los datos locales.
    const t = setTimeout(() => setInitialSyncDone(true), 10000);
    return () => clearTimeout(t);
  }, [userId, progress.ready, nutrition.ready, sync]);

  // Tras cada cambio local, con un pequeño retardo para agrupar varios cambios.
  useEffect(() => {
    if (!userId) return;
    const t = setTimeout(sync, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [progress.modifiedAt, nutrition.modifiedAt, userId, sync]);

  // Al volver a la app, por si hay cambios de otro dispositivo.
  useEffect(() => {
    if (!userId) return;
    const sub = AppState.addEventListener('change', (s) => s === 'active' && sync());
    return () => sub.remove();
  }, [userId, sync]);

  const value = useMemo(() => ({ status, lastSyncedAt, syncNow: sync, initialSyncDone }), [status, lastSyncedAt, sync, initialSyncDone]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export const useSync = () => useContext(SyncContext);

/** Olvida a qué cuenta pertenecían los datos locales (tras borrar la cuenta). */
export const forgetSyncOwner = () => AsyncStorage.removeItem(OWNER_KEY).catch(() => {});
