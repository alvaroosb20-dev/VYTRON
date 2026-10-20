// Extiende app.json con los valores que dependen del entorno de compilación (.env o EAS).
// AdMob: sin variables se usan los IDs de prueba oficiales de Google (no generan ingresos).
const GOOGLE_TEST_APP_IDS = {
  android: 'ca-app-pub-3940256099942544~3347511713',
  ios: 'ca-app-pub-3940256099942544~1458002511',
};

// «Continuar con Apple»: solo se añade la capacidad cuando está configurada en Apple Developer.
const appleSignIn = process.env.EXPO_PUBLIC_APPLE_SIGN_IN === '1';

module.exports = ({ config }) => ({
  ...config,
  ios: { ...config.ios, usesAppleSignIn: appleSignIn },
  plugins: [
    ...(config.plugins ?? []),
    ...(appleSignIn ? ['expo-apple-authentication'] : []),
    [
      'react-native-google-mobile-ads',
      {
        androidAppId: process.env.ADMOB_ANDROID_APP_ID || GOOGLE_TEST_APP_IDS.android,
        iosAppId: process.env.ADMOB_IOS_APP_ID || GOOGLE_TEST_APP_IDS.ios,
        userTrackingUsageDescription:
          'Si lo permites, los anuncios del plan gratuito serán más relevantes para ti. VYTRON nunca usa tus datos de salud para publicidad.',
        // No se mide nada hasta que el usuario resuelve el consentimiento.
        delayAppMeasurementInit: true,
      },
    ],
  ],
});
