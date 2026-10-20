// Solo en iPhone: «Continuar con Apple» (expo-apple-authentication) y el hash del nonce (expo-crypto).
export function loadApple(): { Apple: typeof import('expo-apple-authentication'); Crypto: typeof import('expo-crypto') } | null {
  try {
    return { Apple: require('expo-apple-authentication'), Crypto: require('expo-crypto') };
  } catch {
    return null;
  }
}
