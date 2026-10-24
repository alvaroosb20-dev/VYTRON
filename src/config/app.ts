import { Platform } from 'react-native';

export const BRAND = {
  name: 'VYTRON',
  slogan: 'TRAIN. EVOLVE. DOMINATE.',
} as const;

export const REVENUECAT_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
  default: undefined,
});

// Backend (Supabase, proyecto «vytron», UE-Irlanda). Ambos valores son PÚBLICOS por diseño:
// la seguridad la dan las políticas RLS (cada usuario solo accede a su fila) y las claves
// secretas viven únicamente en el servidor. Se pueden sobrescribir con variables de entorno.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dycoqoehcdymxblfvbyv.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5Y29xb2VoY2R5bXhibGZ2Ynl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTczMTIsImV4cCI6MjEwODA3MzMxMn0.20I3xLdWiul_yJAo7q64OuJVq1tW0J5cjnLWV0uAVdE';
export const FOOD_SCAN_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/food-scan` : '';

// Web pública de VYTRON (Vercel). Las páginas legales son HTML estático en public/.
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://vytron-eta.vercel.app').replace(/\/$/, '');

export const LEGAL = {
  terms: process.env.EXPO_PUBLIC_TERMS_URL || `${SITE_URL}/terminos`,
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL || `${SITE_URL}/privacidad`,
  support: `${SITE_URL}/soporte`,
  deleteAccount: `${SITE_URL}/soporte#eliminar-cuenta`,
};

export const SUPPORT_EMAIL = 'vytronsoporte@gmail.com';

/**
 * «Continuar con Apple». Activar SOLO cuando estén configurados el proveedor Apple en Supabase
 * y la capacidad Sign in with Apple en Apple Developer (ver README). Variable: EXPO_PUBLIC_APPLE_SIGN_IN=1
 */
export const APPLE_SIGN_IN_ENABLED = process.env.EXPO_PUBLIC_APPLE_SIGN_IN === '1';

/** Hay backend configurado: cuentas, sincronización y escáner disponibles. */
export const BACKEND_READY = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const STORE_MANAGE_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
  default: '',
});
