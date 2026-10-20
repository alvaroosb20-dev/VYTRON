// Android y web: no hay «Continuar con Apple». La versión de iPhone está en appleModule.ios.ts.
export function loadApple(): { Apple: typeof import('expo-apple-authentication'); Crypto: typeof import('expo-crypto') } | null {
  return null;
}
