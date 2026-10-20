// Solo en iOS y Android: el SDK de AdMob no existe en web y rompería la compilación web.
export function loadAdsModule(): typeof import('react-native-google-mobile-ads') | null {
  try {
    return require('react-native-google-mobile-ads');
  } catch {
    return null; // Expo Go: el módulo nativo no está incluido.
  }
}
