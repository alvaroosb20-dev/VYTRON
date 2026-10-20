import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { BACKEND_READY, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config/app';

/**
 * Cliente de Supabase con la sesión guardada en el dispositivo.
 * Si no hay backend configurado es null y la app funciona solo en local.
 */
export const supabase: SupabaseClient | null = BACKEND_READY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    })
  : null;

// En móvil, el token solo se renueva mientras la app está en primer plano.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
