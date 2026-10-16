import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Wordmark } from '@/components/Logo';
import { Button, Card, Screen, T } from '@/components/ui';
import { BRAND, LEGAL } from '@/config/app';
import { COMPARISON, PLANS, Tier, tierAllows } from '@/config/plans';
import { usePlanPrice, useSubscription } from '@/lib/subscription';
import { colors, fonts, radius, space } from '@/theme/tokens';

const PAID: Tier[] = ['premium', 'pro'];

export default function Paywall() {
  const { tier, status, purchase, restore, manage } = useSubscription();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Tier>('premium');
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const plan = PLANS.find((p) => p.tier === selected)!;
  const price = usePlanPrice(selected);
  const owned = tierAllows(tier, selected);

  const onBuy = async () => {
    if (!plan.packageId) return;
    setBusy('buy');
    const res = await purchase(plan.packageId);
    setBusy(null);
    if (res.cancelled) return;
    if (!res.ok) return Alert.alert('Compra no completada', res.error ?? 'La tienda no ha confirmado la suscripción.');
    Alert.alert('¡Bienvenido a ' + plan.name + '!', 'Tu suscripción está verificada y activa.');
    router.back();
  };

  const onRestore = async () => {
    setBusy('restore');
    const res = await restore();
    setBusy(null);
    if (!res.ok) return Alert.alert('No se pudo restaurar', res.error ?? 'Inténtalo más tarde.');
    Alert.alert('Compras restauradas', res.tier === 'free' ? 'No hay suscripciones activas en esta cuenta de la tienda.' : `Plan activo: ${res.tier.toUpperCase()}.`);
  };

  const store = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
  const buyDisabled = owned || !price.purchasable;

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <Screen>
        <View style={styles.top}>
          <Wordmark height={20} />
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Cerrar">
            <Icon name="close" color={colors.muted} />
          </Pressable>
        </View>

        <T.Hero style={{ marginTop: space.xl }}>ELIGE TU{'\n'}NIVEL</T.Hero>
        <T.Small style={{ marginTop: space.sm }}>Cancela cuando quieras desde {store}. Sin permanencia.</T.Small>

        <View style={{ gap: space.md, marginTop: space.xl }}>
          {PAID.map((t) => <PlanCard key={t} tier={t} selected={selected === t} current={tier === t} onPress={() => setSelected(t)} />)}
        </View>

        <Text style={styles.compareTitle}>COMPARA LOS PLANES</Text>
        <Card style={{ paddingHorizontal: space.md, paddingVertical: space.sm }}>
          <View style={[styles.tr, { borderTopWidth: 0 }]}>
            <Text style={[styles.th, { flex: 1.6, textAlign: 'left' }]} />
            <Text style={styles.th}>FREE</Text>
            <Text style={styles.th}>PRO</Text>
            <Text style={[styles.th, { color: colors.neon }]}>PREMIUM</Text>
          </View>
          {COMPARISON.map((row) => (
            <View key={row.label} style={styles.tr}>
              <Text style={styles.td}>{row.label}</Text>
              {(['free', 'pro', 'premium'] as const).map((k) => (
                <View key={k} style={styles.cell}>
                  {typeof row[k] === 'string' ? (
                    <Text style={styles.cellText}>{row[k] as string}</Text>
                  ) : row[k] ? (
                    <Icon name="check" size={16} color={k === 'premium' ? colors.neon : colors.white} />
                  ) : (
                    <Text style={[styles.cellText, { color: '#55555C' }]}>—</Text>
                  )}
                </View>
              ))}
            </View>
          ))}
        </Card>

        <T.Small style={{ marginTop: space.xl, textAlign: 'center' }}>
          Suscripción mensual de renovación automática. Se cobra en tu cuenta de {store} al confirmar y se renueva cada mes al mismo precio
          salvo que la canceles al menos 24 horas antes del final del periodo. Puedes gestionarla o cancelarla en los ajustes de {store}.
        </T.Small>
        <View style={styles.links}>
          <Pressable onPress={onRestore} hitSlop={8}><Text style={styles.link}>{busy === 'restore' ? 'Restaurando…' : 'Restaurar compras'}</Text></Pressable>
          <Pressable onPress={manage} hitSlop={8}><Text style={styles.link}>Gestionar cuenta</Text></Pressable>
        </View>
        <View style={styles.links}>
          <Pressable onPress={() => LEGAL.terms && Linking.openURL(LEGAL.terms)} hitSlop={8}><Text style={styles.legal}>Términos</Text></Pressable>
          <Pressable onPress={() => LEGAL.privacy && Linking.openURL(LEGAL.privacy)} hitSlop={8}><Text style={styles.legal}>Privacidad</Text></Pressable>
        </View>
        <Text style={styles.slogan}>{BRAND.slogan}</Text>
        <View style={{ height: 150 }} />
      </Screen>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <Button
          title={owned ? 'YA TIENES ESTE PLAN' : `SUSCRIBIRME A ${plan.name} · ${price.price}${plan.period}`}
          onPress={onBuy}
          disabled={buyDisabled}
          loading={busy === 'buy'}
          textStyle={{ fontSize: 17 }}
        />
        {!price.purchasable && !owned && (
          <T.Small style={{ textAlign: 'center' }}>
            {status === 'loading' ? 'Conectando con la tienda…' : 'Las compras no están disponibles ahora mismo. Precio de referencia; el definitivo lo muestra la tienda.'}
          </T.Small>
        )}
      </View>
    </View>
  );
}

function PlanCard({ tier, selected, current, onPress }: { tier: Tier; selected: boolean; current: boolean; onPress: () => void }) {
  const plan = PLANS.find((p) => p.tier === tier)!;
  const { price } = usePlanPrice(tier);
  const premium = tier === 'premium';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.plan, premium && styles.planPremium, selected && styles.planSelected]}
    >
      {premium && <View style={styles.badge}><Text style={styles.badgeText}>EL MÁS COMPLETO</Text></View>}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.radio, selected && styles.radioOn]}>{selected && <View style={styles.radioDot} />}</View>
        <Text style={[styles.planName, premium && { color: colors.neon }]}>{plan.name}</Text>
        {current && <Text style={styles.current}>PLAN ACTUAL</Text>}
        <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
          <Text style={styles.price}>{price}</Text>
          <T.Small>{plan.period.replace('/', 'al ')}</T.Small>
        </View>
      </View>
      <T.Small style={{ marginTop: space.sm }}>{plan.pitch}</T.Small>
      <View style={{ marginTop: space.md, gap: 6 }}>
        {plan.highlights.map((h) => (
          <View key={h} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <Icon name="check" size={14} color={premium ? colors.neon : colors.muted} />
            <T.Small style={{ color: colors.white }}>{h}</T.Small>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  plan: { backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, borderWidth: 2, borderColor: 'transparent' },
  planPremium: { backgroundColor: colors.graphite, borderColor: 'rgba(183,255,54,0.25)', paddingTop: space.xl },
  planSelected: { borderColor: colors.neon },
  badge: { position: 'absolute', top: -11, left: space.lg, backgroundColor: colors.neon, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 10, letterSpacing: 1, color: colors.neonInk },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted, marginRight: space.md, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.neon },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.neon },
  planName: { fontFamily: fonts.display, fontSize: 26, color: colors.white, letterSpacing: 1 },
  current: { marginLeft: space.sm, fontFamily: fonts.semibold, fontSize: 10, color: colors.muted, letterSpacing: 1 },
  price: { fontFamily: fonts.display, fontSize: 28, color: colors.white },
  compareTitle: { marginTop: space.xxl, marginBottom: space.md, fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.4, color: colors.muted },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  th: { flex: 1, textAlign: 'center', fontFamily: fonts.displayBold, fontSize: 13, letterSpacing: 1, color: colors.white },
  td: { flex: 1.6, fontFamily: fonts.body, fontSize: 13, color: colors.white },
  cell: { flex: 1, alignItems: 'center' },
  cellText: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  links: { flexDirection: 'row', justifyContent: 'center', gap: space.xl, marginTop: space.lg },
  link: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white, textDecorationLine: 'underline' },
  legal: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  slogan: { marginTop: space.xl, textAlign: 'center', fontFamily: fonts.displayBold, fontSize: 13, letterSpacing: 3, color: colors.muted },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: space.xl, backgroundColor: 'rgba(10,10,11,0.97)', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, gap: space.sm },
});
