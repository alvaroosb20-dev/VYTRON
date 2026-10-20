import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

// Sin sesión, la app abre la bienvenida (o «Iniciar sesión» si la sesión caducó, ver welcome.tsx).
export const unstable_settings = { initialRouteName: 'welcome' };

/** Bienvenida y acceso: solo se ven sin sesión (ver Stack.Protected en app/_layout.tsx). */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.black }, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="verify-email" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
