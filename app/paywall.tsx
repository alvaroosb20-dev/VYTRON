import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Wordmark } from '@/components/Logo';
import { Button, Card, Screen, T } from '@/components/ui';
import { BRAND, LEGAL } from '@/config/app';
import { Billing, COMPARISON, PLANS, Tier, tierAllows } from '@/config/plans';
import { useProgress } from '@/lib/progress';
import { scheduleTrialEndReminder } from '@/lib/reminders';
import { useHasAnnual, usePlanPrice, useSubscription } from '@/lib/subscription';
import { planForTier } from '@/lib/training';
import { colors, fonts, radius, space } from '@/theme/tokens';

const PAID: Tier[] = ['premium', 'pro'];

export default function Paywall() {
  const { tier, status, purchase, restore, manage } = useSubscription();
  const { settings, setWeekPlan } = useProgress();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromOnboarding = from === 'onboarding';
  const insets = useSafeAreaInsets();
  const hasAnnual = useHasAnnual();
  const [selected, setSelected] = useState<Tier>('premium');
  const [billing, setBilling] = useState<Billing>('annual');
  const period: Billing = hasAnnual ? billing : 'monthly';
  const [busy, setBusy] = useState<'buy' | 'restore' | null>(null);
  const plan = PLANS.find((p) => p.tier === selected)!;
  const price = usePlanPrice(selected, period);
  const annualPremium = usePlanPrice('premium', 'annual');
  const owned = tierAllows(tier, selected);
  const trial = price.trialDays;

  const onBuy = async () => {
    if (!price.packageId) return;
    setBusy('buy');
    const res = await purchase(price.packageId);
    if (res.cancelled) return setBusy(null);
    if (!res.ok) {
      setBusy(null);
      return Alert.alert('Compra no completada', res.error ?? 'La tienda no ha confirmado la suscripción.');
    }
    // Con el plan ya verificado, el plan de la bienvenida pasa a usar todas sus rutinas.
    const a = settings.onboarding;
    if (fromOnboarding && a) await setWeekPlan(planForTier(a.goal, a.days, a.setting, res.tier));
    if (trial) await scheduleTrialEndReminder(trial, plan.name);
    setBusy(null);
    Alert.alert(
      '¡Bienvenido a ' + plan.name + '!',
      trial
        ? `Tu prueba de ${trial} días está activa. Si tienes las notificaciones activadas, te avisaremos antes de que termine.`
        : 'Tu suscripción está verificada y activa.',
    );
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

        <T.Hero style={{ marginTop: space.xl }}>{fromOnboarding ? 'DESBLOQUEA\nTU PLAN' : 'ELIGE TU\nNIVEL'}</T.Hero>
        <T.Small style={{ marginTop: space.sm }}>
          {fromOnboarding
            ? 'Tu semana completa, todas las rutinas y la nutrición con IA. Cancela cuando quieras.'
            : `Cancela cuando quieras desde ${store}. Sin permanencia.`}
        </T.Small>

        {hasAnnual && (
          <View style={styles.toggle} accessibilityRole="tablist">
            {(['annual', 'monthly'] as Billing[]).map((b) => (
              <Pressable key={b} onPress={() => setBilling(b)} style={[styles.toggleBtn, period === b && styles.toggleOn]} accessibilityState={{ selected: period === b }}>
                <Text style={[styles.toggleText, period === b && { color: colors.neonInk }]}>{b === 'annual' ? 'ANUAL' : 'MENSUAL'}</Text>
                {b === 'annual' && annualPremium.savingsPct ? (
                  <Text style={[styles.toggleSave, period === b && { color: colors.neonInk }]}>-{annualPremium.savingsPct}%</Text>
                ) : null}
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ gap: space.md, marginTop: space.xl }}>
          {PAID.map((t) => <PlanCard key={t} tier={t} billing={period} selected={selected === t} current={tier === t} onPress={() => setSelected(t)} />)}
        </View>

        {trial > 0 && !owned && (
          <Card style={{ marginTop: space.xl }}>
            <T.Label style={{ marginBottom: space.md }}>CÓMO FUNCIONA LA PRUEBA</T.Label>
            <Step icon="spark" title="Hoy" text={`Acceso completo a ${plan.name}. No se cobra nada.`} />
            {trial >= 3 && <Step icon="calendar" title={`Día ${trial - 2}`} text="Te enviamos un aviso de que la prueba está a punto de terminar (con notificaciones activadas)." />}
            <Step icon="check" title={`Día ${trial}`} text={`Empieza tu suscripción: ${price.price}${price.period}. Cancela antes y no pagas nada.`} last />
          </Card>
        )}

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
          {trial > 0
            ? `Prueba gratuita de ${trial} días; al terminar se cobra ${price.price}${price.period} en tu cuenta de ${store}. `
            : `Se cobra en tu cuenta de ${store} al confirmar. `}
          Suscripción {period === 'annual' ? 'anual' : 'mensual'} de renovación automática al mismo precio salvo que la canceles al menos 24 horas
          antes del final del periodo{trial > 0 ? ' o de la prueba' : ''}. Puedes gestionarla o cancelarla en los ajustes de {store}.
        </T.Small>
        <View style={styles.links}>
          <Pressable onPress={onRestore} hitSlop={8}><Text style={styles.link}>{busy === 'restore' ? 'Restaurando…' : 'Restaurar compras'}</Text></Pressable>
          <Pressable onPress={manage} hitSlop={8}><Text style={styles.link}>Gestionar cuenta</Text></Pressable>
        </View>
        <View style={styles.links}>
          <Pressable onPress={() => LEGAL.terms && Linking.openURL(LEGAL.terms)} hitSlop={8}><Text style={styles.legal}>Términos y condiciones</Text></Pressable>
          <Pressable onPress={() => LEGAL.privacy && Linking.openURL(LEGAL.privacy)} hitSlop={8}><Text style={styles.legal}>Privacidad</Text></Pressable>
        </View>
        <Text style={styles.slogan}>{BRAND.slogan}</Text>
        <View style={{ height: 150 }} />
      </Screen>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <Button
          title={owned ? 'YA TIENES ESTE PLAN' : trial > 0 ? `PROBAR ${trial} DÍAS GRATIS` : `SUSCRIBIRME A ${plan.name} · ${price.price}${price.period}`}
          onPress={onBuy}
          disabled={buyDisabled}
          loading={busy === 'buy'}
          textStyle={{ fontSize: 17 }}
        />
        {trial > 0 && !owned && price.purchasable && (
          <T.Small style={{ textAlign: 'center' }}>Después, {price.price}{price.period}. Sin compromiso: cancela cuando quieras.</T.Small>
        )}
        {!price.purchasable && !owned && (
          <T.Small style={{ textAlign: 'center' }}>
            {status === 'loading' ? 'Conectando con la tienda…' : 'Las compras no están disponibles ahora mismo. Precio de referencia; el definitivo lo muestra la tienda.'}
          </T.Small>
        )}
      </View>
    </View>
  );
}

function PlanCard({ tier, billing, selected, current, onPress }: { tier: Tier; billing: Billing; selected: boolean; current: boolean; onPress: () => void }) {
  const plan = PLANS.find((p) => p.tier === tier)!;
  const price = usePlanPrice(tier, billing);
  const premium = tier === 'premium';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.plan, premium && styles.planPremium, selected && styles.planSelected]}
    >
      {premium && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{price.trialDays ? `${price.trialDays} DÍAS GRATIS · EL MÁS COMPLETO` : 'EL MÁS COMPLETO'}</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.radio, selected && styles.radioOn]}>{selected && <View style={styles.radioDot} />}</View>
        <Text style={[styles.planName, premium && { color: colors.neon }]}>{plan.name}</Text>
        {current && <Text style={styles.current}>PLAN ACTUAL</Text>}
        <View style={{ marginLeft: 'auto', alignItems: 'flex-end' }}>
          <Text style={styles.price}>{price.price}</Text>
          <T.Small>{price.perMonth ? `${price.perMonth} al mes` : price.period.replace('/', 'al ')}</T.Small>
        </View>
      </View>
      {!premium && price.trialDays > 0 && <T.Small style={{ marginTop: space.sm, color: colors.neon }}>{price.trialDays} días gratis</T.Small>}
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

function Step({ icon, title, text, last }: { icon: 'spark' | 'calendar' | 'check'; title: string; text: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: space.md }}>
      <View style={{ alignItems: 'center' }}>
        <View style={styles.stepDot}><Icon name={icon} size={14} color={colors.neonInk} /></View>
        {!last && <View style={styles.stepLine} />}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : space.lg }}>
        <T.Body style={{ fontFamily: fonts.semibold }}>{title}</T.Body>
        <T.Small>{text}</T.Small>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggle: { flexDirection: 'row', marginTop: space.xl, backgroundColor: colors.graphite, borderRadius: radius.pill, padding: 4, borderWidth: 1, borderColor: colors.line },
  toggleBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.pill },
  toggleOn: { backgroundColor: colors.neon },
  toggleText: { fontFamily: fonts.displayBold, fontSize: 15, letterSpacing: 1.2, color: colors.white },
  toggleSave: { fontFamily: fonts.semibold, fontSize: 11, color: colors.neon },
  stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.neon, alignItems: 'center', justifyContent: 'center' },
  stepLine: { flex: 1, width: 2, backgroundColor: 'rgba(183,255,54,0.3)', marginVertical: 4 },
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
