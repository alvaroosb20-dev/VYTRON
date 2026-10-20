import { BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Splash, SPLASH_BG } from '@/components/Splash';
import { AdsProvider } from '@/lib/ads';
import { AuthProvider, useAuth } from '@/lib/auth';
import { SyncProvider } from '@/lib/cloudSync';
import { NutritionProvider } from '@/lib/nutrition';
import { ProgressProvider, useProgress } from '@/lib/progress';
import { syncTrainingReminders } from '@/lib/reminders';
import { SubscriptionProvider } from '@/lib/subscription';
import { colors } from '@/theme/tokens';

// La pantalla nativa (solo fondo) se mantiene hasta que la animada esté lista para pintarse.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, fontError] = useFonts({
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Si las fuentes fallan, se sigue con las del sistema: nunca se bloquea el arranque.
  if (!loaded && !fontError) return <View style={{ flex: 1, backgroundColor: SPLASH_BG }} />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <AdsProvider>
            <ProgressProvider>
              <NutritionProvider>
                <SyncProvider>
                  <StatusBar style="light" />
                  <RemindersSync />
                  <AppNavigator />
                </SyncProvider>
              </NutritionProvider>
            </ProgressProvider>
          </AdsProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/**
 * Rutas según la sesión:
 *  - con sesión → la app (la bienvenida de perfil fitness se muestra si aún no se ha hecho);
 *  - sin sesión → bienvenida y acceso; si la sesión caducó, directamente «Iniciar sesión».
 * La pantalla de carga se superpone solo al abrir la app, no al navegar.
 */
function AppNavigator() {
  const auth = useAuth();
  const progress = useProgress();
  const [splashDone, setSplashDone] = useState(false);
  const signedIn = !auth.available || !!auth.user;
  const bootReady = auth.ready && progress.ready;

  // La pantalla nativa se oculta en cuanto la animada está montada (mismo fondo: sin parpadeo).
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  const onFinish = useCallback(() => setSplashDone(true), []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      {bootReady && (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.black }, animation: 'fade' }}>
          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
            <Stack.Screen name="workout/[id]" options={{ animation: 'slide_from_right', gestureEnabled: false }} />
            <Stack.Screen name="exercise/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="program/[id]" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="library" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="routine-builder" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="plan-generator" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="plates" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="body" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="food-scan" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="recipes" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="account" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack.Protected>
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          {/* Destino del email de recuperación (web): accesible con o sin sesión. */}
          <Stack.Screen name="nueva-contrasena" />
        </Stack>
      )}
      {!splashDone && <Splash ready={bootReady} error={auth.initError} onRetry={auth.retryInit} onFinish={onFinish} />}
    </View>
  );
}

/** Mantiene los recordatorios al día con el plan, el horario y las sesiones guardadas. */
function RemindersSync() {
  const { ready, settings, sessions, customWorkouts } = useProgress();
  const { reminders, weekPlan, weeklyGoal } = settings;
  useEffect(() => {
    if (!ready) return;
    syncTrainingReminders({ reminders, weekPlan, weeklyGoal, sessions, customWorkouts });
  }, [ready, reminders, weekPlan, weeklyGoal, sessions, customWorkouts]);
  return null;
}
