import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feature, FEATURE_TIER, Tier, tierAllows } from '@/config/plans';
import { adsModule, bannerUnitId, useAds } from '@/lib/ads';
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
 * Banner discreto del plan Free. Solo aparece si:
 *  - el plan verificado no incluye "sin anuncios" (desaparece en cuanto se verifica Pro o Premium),
 *  - el usuario ha resuelto el consentimiento de anuncios,
 *  - hay un id de bloque de anuncios configurado.
 * Si el anuncio no carga, el espacio se oculta: nunca hay huecos vacíos.
 */
export function AdSlot() {
  const { showAds } = useSubscription();
  const { ready } = useAds();
  const [failed, setFailed] = React.useState(false);
  const M = adsModule();
  const unitId = bannerUnitId();
  if (!showAds || !ready || !M || !unitId || failed) return null;
  const { BannerAd, BannerAdSize } = M;
  return (
    <View style={styles.ad}>
      <Text style={styles.adLabel}>Publicidad</Text>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} onAdFailedToLoad={() => setFailed(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.graphite },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  lock: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(183,255,54,0.1)', alignItems: 'center', justifyContent: 'center' },
  cta: { marginTop: space.md, fontFamily: fonts.semibold, fontSize: 13, color: colors.neon },
  ad: { marginTop: space.xl, alignItems: 'center', gap: 4 },
  adLabel: { fontFamily: fonts.medium, fontSize: 10, color: colors.muted, letterSpacing: 1 },
});
