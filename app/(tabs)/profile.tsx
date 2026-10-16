import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gate } from '@/components/Gate';
import { Icon, IconName } from '@/components/Icon';
import { Mark } from '@/components/Logo';
import { Button, Card, Pill, Screen, SectionTitle, T } from '@/components/ui';
import { BRAND, LEGAL } from '@/config/app';
import { PLANS } from '@/config/plans';
import { useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { colors, fonts, radius, space } from '@/theme/tokens';

// Plantillas de planificación personalizada (Premium). Índice 0 = domingo.
const TEMPLATES: { id: string; name: string; desc: string; plan: (string | null)[] }[] = [
  { id: 'strength', name: 'Fuerza', desc: '4 días, foco en básicos pesados', plan: [null, 'lower-power', 'upper-power', 'mobility', 'lower-power', 'upper-power', null] },
  { id: 'balance', name: 'Equilibrado', desc: '4 días de fuerza y acondicionamiento', plan: [null, 'full-body-a', 'conditioning', null, 'full-body-b', 'mobility', null] },
  { id: 'engine', name: 'Resistencia', desc: '5 días con más trabajo metabólico', plan: [null, 'conditioning', 'full-body-a', 'conditioning', 'mobility', 'full-body-b', null] },
];

export default function Profile() {
  const { tier, status, restore, manage } = useSubscription();
  const { settings, setWeeklyGoal, setDayPlan } = useProgress();
  const [restoring, setRestoring] = useState(false);
  const plan = PLANS.find((p) => p.tier === tier)!;

  const onRestore = async () => {
    setRestoring(true);
    const res = await restore();
    setRestoring(false);
    if (!res.ok) return Alert.alert('No se pudo restaurar', res.error ?? 'Inténtalo de nuevo más tarde.');
    Alert.alert(
      'Compras restauradas',
      res.tier === 'free' ? 'No hemos encontrado ninguna suscripción activa en esta cuenta de la tienda.' : `Plan activo: ${res.tier.toUpperCase()}.`,
    );
  };

  const applyTemplate = (p: (string | null)[]) => p.forEach((id, d) => setDayPlan(d, id));

  return (
    <Screen>
      <T.H1>PERFIL</T.H1>

      <Card style={styles.planCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={styles.avatar}><Mark size={26} /></View>
          <View style={{ flex: 1 }}>
            <T.Label>TU PLAN</T.Label>
            <T.H2 style={{ fontSize: 26 }}>{plan.name}</T.H2>
          </View>
          {status === 'loading' && <Pill text="VERIFICANDO" />}
        </View>
        {tier === 'free' ? (
          <Button title="VER PLANES" onPress={() => router.push('/paywall')} style={{ marginTop: space.lg }} />
        ) : (
          <Button title="GESTIONAR SUSCRIPCIÓN" variant="secondary" onPress={manage} style={{ marginTop: space.lg }} />
        )}
        <Button title="Restaurar compras" variant="ghost" loading={restoring} onPress={onRestore} />
        {status === 'unavailable' && (
          <T.Small style={{ textAlign: 'center' }}>Las compras dentro de la app no están disponibles en este dispositivo.</T.Small>
        )}
      </Card>

      <SectionTitle title="OBJETIVO SEMANAL" />
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <T.H2>{settings.weeklyGoal} SESIONES</T.H2>
          <T.Small>Un objetivo realista te ayuda a ser constante.</T.Small>
        </View>
        <Stepper onPress={() => setWeeklyGoal(settings.weeklyGoal - 1)} label="−" />
        <Stepper onPress={() => setWeeklyGoal(settings.weeklyGoal + 1)} label="+" />
      </Card>

      <SectionTitle title="PLANIFICACIÓN PERSONALIZADA" />
      <Gate feature="customPlanning" title="Plan personalizado ampliado" description="Plantillas completas según tu objetivo, aplicadas a tu semana.">
        <View style={{ gap: space.sm }}>
          {TEMPLATES.map((t) => (
            <Card key={t.id} onPress={() => { applyTemplate(t.plan); Alert.alert('Plan aplicado', `Tu semana sigue ahora el plan «${t.name}».`); }}>
              <T.H2 style={{ fontSize: 19 }}>{t.name.toUpperCase()}</T.H2>
              <T.Small>{t.desc}</T.Small>
            </Card>
          ))}
        </View>
      </Gate>

      <SectionTitle title="NUTRICIÓN" />
      <Gate feature="nutrition" title="Nutrición y recetas" description="Recetas sencillas para acompañar tu entrenamiento.">
        <Row icon="food" title="Recetas para entrenar" onPress={() => router.push('/nutrition')} />
      </Gate>

      <SectionTitle title="LEGAL" />
      <Card style={{ paddingVertical: space.xs }}>
        <Row icon="report" title="Términos de uso" onPress={() => LEGAL.terms && Linking.openURL(LEGAL.terms)} flat />
        <Row icon="lock" title="Privacidad" onPress={() => LEGAL.privacy && Linking.openURL(LEGAL.privacy)} flat line />
      </Card>

      <Text style={styles.footer}>{BRAND.name} · {BRAND.slogan}</Text>
    </Screen>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.stepper} hitSlop={6}>
      <Text style={styles.stepperText}>{label}</Text>
    </Pressable>
  );
}

function Row({ icon, title, onPress, flat, line }: { icon: IconName; title: string; onPress: () => void; flat?: boolean; line?: boolean }) {
  const content = (
    <View style={[styles.row, line && styles.line]}>
      <Icon name={icon} size={20} color={colors.neon} />
      <T.Body style={{ flex: 1 }}>{title}</T.Body>
      <Icon name="chevron" size={18} color={colors.muted} />
    </View>
  );
  return flat ? <Pressable onPress={onPress}>{content}</Pressable> : <Card onPress={onPress} style={{ paddingVertical: space.xs }}>{content}</Card>;
}

const styles = StyleSheet.create({
  planCard: { marginTop: space.xl, backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.line },
  avatar: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  stepper: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center', marginLeft: space.sm },
  stepperText: { fontFamily: fonts.display, fontSize: 24, color: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  footer: { marginTop: space.xxl, textAlign: 'center', fontFamily: fonts.displayBold, fontSize: 13, letterSpacing: 3, color: colors.muted },
});
