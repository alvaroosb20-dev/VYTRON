import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feature, FEATURE_TIER, Tier, tierAllows } from '@/config/plans';
import { useSubscription } from '@/lib/subscription';
import { colors, fonts, space } from '@/theme/tokens';
import { Icon } from './Icon';
import { Card, T } from './ui';

type GateProps = {
  title: string;
  description: string;
  children: React.ReactNode;
} & ({ feature: Feature; tier?: never } | { tier: Tier; feature?: never });

/**
 * Muestra el contenido solo si el usuario tiene un derecho VERIFICADO.
 * Si no, enseña una tarjeta clara que lleva a la pantalla de planes.
 */
export function Gate({ feature, tier, title, description, children }: GateProps) {
  const sub = useSubscription();
  const required: Tier = feature ? FEATURE_TIER[feature] : tier!;
  if (tierAllows(sub.tier, required)) return <>{children}</>;
  return <LockedCard required={required} title={title} description={description} />;
}

export function LockedCard({ required, title, description }: { required: Tier; title: string; description: string }) {
  return (
    <Card onPress={() => router.push('/paywall')} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.lock}>
          <Icon name="lock" size={18} color={colors.neon} />
        </View>
        <View style={{ flex: 1 }}>
          <T.H2 style={{ fontSize: 19 }}>{title}</T.H2>
          <T.Small>{description}</T.Small>
        </View>
      </View>
      <Text style={styles.cta}>Disponible en {required === 'premium' ? 'PREMIUM' : 'PRO'}  →</Text>
    </Card>
  );
}

/**
 * Espacio publicitario discreto. Solo existe en Free y desaparece en cuanto se verifica
 * un plan sin anuncios. Aquí se conecta el SDK de anuncios elegido (AdMob, etc.).
 * Mientras no haya SDK configurado, no se pinta nada: nunca se muestran anuncios falsos.
 */
export function AdSlot() {
  const { showAds } = useSubscription();
  if (!showAds) return null;
  const AdBanner = getAdBanner();
  if (!AdBanner) return null;
  return (
    <View style={styles.ad}>
      <Text style={styles.adLabel}>Publicidad</Text>
      <AdBanner />
    </View>
  );
}

// Punto de integración del SDK de anuncios. Devuelve null hasta que se configure.
function getAdBanner(): React.ComponentType | null {
  return null;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.graphite },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  lock: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(183,255,54,0.1)', alignItems: 'center', justifyContent: 'center' },
  cta: { marginTop: space.md, fontFamily: fonts.semibold, fontSize: 13, color: colors.neon },
  ad: { marginTop: space.xl, alignItems: 'center', gap: 4 },
  adLabel: { fontFamily: fonts.medium, fontSize: 10, color: colors.muted, letterSpacing: 1 },
});
