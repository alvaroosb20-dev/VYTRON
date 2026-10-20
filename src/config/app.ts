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

// Backend (Supabase). Solo valores públicos: la clave anónima está pensada para el cliente.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const FOOD_SCAN_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/food-scan` : '';

// Web pública de VYTRON (Vercel). Las páginas legales son HTML estático en public/.
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://vytron-eta.vercel.app').replace(/\/$/, '');

export const LEGAL = {
  terms: process.env.EXPO_PUBLIC_TERMS_URL || `${SITE_URL}/terminos`,
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL || `${SITE_URL}/privacidad`,
  support: `${SITE_URL}/soporte`,
  deleteAccount: `${SITE_URL}/soporte#eliminar-cuenta`,
};

export const SUPPORT_EMAIL = 'alvaroosb20@gmail.com';

/** Hay backend configurado: cuentas, sincronización y escáner disponibles. */
export const BACKEND_READY = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

export const STORE_MANAGE_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
  default: '',
});
