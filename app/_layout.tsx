import { BarlowCondensed_700Bold, BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NutritionProvider } from '@/lib/nutrition';
import { ProgressProvider } from '@/lib/progress';
import { SubscriptionProvider } from '@/lib/subscription';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <SubscriptionProvider>
        <ProgressProvider>
          <NutritionProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.black }, animation: 'fade' }}>
            <Stack.Screen name="(tabs)" />
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
          </Stack>
          </NutritionProvider>
        </ProgressProvider>
      </SubscriptionProvider>
    </SafeAreaProvider>
  );
}
