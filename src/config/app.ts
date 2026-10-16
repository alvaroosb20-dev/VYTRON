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

export const LEGAL = {
  terms: process.env.EXPO_PUBLIC_TERMS_URL ?? '',
  privacy: process.env.EXPO_PUBLIC_PRIVACY_URL ?? '',
};

// Respaldo si la tienda no devuelve una URL de gestión propia.
export const STORE_MANAGE_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions',
  default: '',
});
