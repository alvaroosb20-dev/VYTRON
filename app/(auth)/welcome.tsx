import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LegalLinks, Notice, OrDivider } from '@/components/authUI';
import { Mark, Wordmark } from '@/components/Logo';
import { Button, FadeIn, T } from '@/components/ui';
import { BRAND } from '@/config/app';
import { loadApple } from '@/lib/appleModule';
import { useAuth } from '@/lib/auth';
import { colors, fonts, space } from '@/theme/tokens';

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const { appleAvailable, signInWithApple, expiredEmail } = useAuth();
  const [appleBusy, setAppleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sesión caducada: directamente a «Iniciar sesión», con el email ya puesto.
  if (expiredEmail) return <Redirect href="/login" />;

  const onApple = async () => {
    setError(null);
    setAppleBusy(true);
    const res = await signInWithApple();
    setAppleBusy(false);
    if (!res.ok && res.code !== 'cancelled') setError(res.error);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }]}>
      <View style={styles.watermark} pointerEvents="none">
        <Mark size={420} color="rgba(183,255,54,0.05)" />
      </View>

      <FadeIn style={{ alignItems: 'center' }}>
        <Wordmark height={26} />
      </FadeIn>

      <View style={styles.middle}>
        <FadeIn delay={80}>
          <T.Label style={{ color: colors.neon }}>{BRAND.slogan}</T.Label>
          <T.Hero style={styles.title}>BIENVENIDO{'\n'}A VYTRON</T.Hero>
          <T.Body style={styles.subtitle}>Tu evolución empieza aquí.</T.Body>
        </FadeIn>
      </View>

      <FadeIn delay={160} style={{ gap: space.md, width: '100%', maxWidth: 480, alignSelf: 'center' }}>
        {error && <Notice tone="error" text={error} />}
        <Button title="INICIAR SESIÓN" onPress={() => router.push('/login')} />
        <Button title="CREAR CUENTA" variant="secondary" onPress={() => router.push('/register')} />
        {Platform.OS === 'ios' && appleAvailable && <AppleButton onPress={onApple} busy={appleBusy} />}
        <View style={{ marginTop: space.sm }}>
          <LegalLinks />
        </View>
      </FadeIn>
    </View>
  );
}

/** Botón oficial de Apple (obligatorio usar su diseño según las normas de Apple). */
function AppleButton({ onPress, busy }: { onPress: () => void; busy: boolean }) {
  const mod = loadApple();
  if (!mod) return null;
  const { Apple } = mod;
  return (
    <View style={{ gap: space.md, opacity: busy ? 0.5 : 1 }} pointerEvents={busy ? 'none' : 'auto'}>
      <OrDivider />
      <Apple.AppleAuthenticationButton
        buttonType={Apple.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={Apple.AppleAuthenticationButtonStyle.WHITE}
        cornerRadius={16}
        style={{ height: 54, width: '100%' }}
        onPress={onPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black, paddingHorizontal: space.lg },
  watermark: { position: 'absolute', right: -90, top: 120 },
  middle: { flex: 1, justifyContent: 'center', width: '100%', maxWidth: 480, alignSelf: 'center' },
  title: { fontSize: 54, lineHeight: 54, marginTop: space.md },
  subtitle: { marginTop: space.md, fontFamily: fonts.medium, fontSize: 17, color: colors.muted },
});
