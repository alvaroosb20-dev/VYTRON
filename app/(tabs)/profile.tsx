import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Gate } from '@/components/Gate';
import { Icon, IconName } from '@/components/Icon';
import { Mark } from '@/components/Logo';
import { Button, Card, Chips, Pill, Screen, SectionTitle, T } from '@/components/ui';
import { BRAND, LEGAL } from '@/config/app';
import { PLANS } from '@/config/plans';
import { useAds } from '@/lib/ads';
import { useAuth } from '@/lib/auth';
import { useSync } from '@/lib/cloudSync';
import { connectHealth, healthAvailable, latestWeightKg } from '@/lib/health';
import { useProgress } from '@/lib/progress';
import { notificationPermission } from '@/lib/reminders';
import { useSubscription } from '@/lib/subscription';
import { colors, fonts, radius, space } from '@/theme/tokens';

export default function Profile() {
  const { tier, status, restore, manage, hasAccess } = useSubscription();
  const auth = useAuth();
  const sync = useSync();
  const ads = useAds();
  const { settings, setWeeklyGoal, setHealthSync, body, setBody, setReminders } = useProgress();
  const [restoring, setRestoring] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const toggleReminders = async (on: boolean) => {
    if (!on) return setReminders({ enabled: false });
    if (Platform.OS === 'web') return Alert.alert('No disponible', 'Los recordatorios funcionan en la app de iPhone y Android.');
    if (await notificationPermission(true)) return setReminders({ enabled: true });
    Alert.alert('Notificaciones desactivadas', 'Actívalas para VYTRON en los ajustes del teléfono y vuelve a intentarlo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir ajustes', onPress: () => Linking.openSettings() },
    ]);
  };
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

  const toggleHealth = async (on: boolean) => {
    if (!on) return setHealthSync(false);
    if (!healthAvailable()) {
      Alert.alert('Apple Salud', Platform.OS === 'ios' ? 'Apple Salud necesita la versión instalada de la app (no funciona en Expo Go).' : 'Apple Salud solo está disponible en iPhone.');
      return;
    }
    setConnecting(true);
    const ok = await connectHealth();
    setConnecting(false);
    if (!ok) return Alert.alert('Sin permiso', 'Puedes dar acceso a VYTRON en Ajustes › Salud › Acceso a datos y dispositivos.');
    await setHealthSync(true);
    // Si no tenemos peso, lo traemos de Salud.
    if (!body.weightKg) {
      const w = await latestWeightKg();
      if (w) await setBody({ weightKg: w });
    }
  };

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
        {tier !== 'premium' && (
          <Button title={tier === 'free' ? 'VER PLANES' : 'PASAR A PREMIUM'} onPress={() => router.push('/paywall')} style={{ marginTop: space.lg }} />
        )}
        {tier !== 'free' && <Button title="GESTIONAR SUSCRIPCIÓN" variant="secondary" onPress={manage} style={{ marginTop: space.sm }} />}
        <Button title="Restaurar compras" variant="ghost" loading={restoring} onPress={onRestore} />
        {status === 'unavailable' && (
          <T.Small style={{ textAlign: 'center' }}>Las compras dentro de la app no están disponibles en este dispositivo.</T.Small>
        )}
      </Card>

      <SectionTitle title="TUS DATOS" />
      <Row
        icon="profile"
        title="Cuenta"
        detail={auth.user ? (sync.status === 'error' ? 'Sin sincronizar' : 'Sincronizada') : auth.available ? 'Crear o iniciar sesión' : undefined}
        onPress={() => router.push('/account')}
      />
      <View style={{ height: space.sm }} />
      <Row icon="scale" title="Datos corporales" detail={body.weightKg ? `${String(body.weightKg).replace('.', ',')} kg` : 'Completar'} onPress={() => router.push('/body')} />

      <SectionTitle title="OBJETIVO SEMANAL" />
      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <T.H2>{settings.weeklyGoal} {settings.weeklyGoal === 1 ? 'SESIÓN' : 'SESIONES'}</T.H2>
          <T.Small>Un objetivo realista te ayuda a ser constante.</T.Small>
        </View>
        <Stepper onPress={() => setWeeklyGoal(settings.weeklyGoal - 1)} label="−" />
        <Stepper onPress={() => setWeeklyGoal(settings.weeklyGoal + 1)} label="+" />
      </Card>

      <SectionTitle title="RECORDATORIOS" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={styles.healthIcon}><Icon name="calendar" color={colors.neon} /></View>
          <View style={{ flex: 1 }}>
            <T.Body style={{ fontFamily: fonts.semibold }}>Avisos de entrenamiento</T.Body>
            <T.Small>Solo los días que toca entrenar, y un aviso el domingo si tu semana está en juego.</T.Small>
          </View>
          <Switch
            value={settings.reminders.enabled}
            onValueChange={toggleReminders}
            trackColor={{ true: colors.neon, false: colors.line }}
            thumbColor={colors.white}
            ios_backgroundColor={colors.line}
          />
        </View>
        {settings.reminders.enabled && (
          <View style={{ marginTop: space.lg }}>
            <Chips<number>
              value={settings.reminders.hour}
              onChange={(h) => setReminders({ hour: h, minute: 0 })}
              options={[7, 9, 13, 17, 18, 19, 20, 21].map((h) => ({ value: h, label: `${String(h).padStart(2, '0')}:00` }))}
            />
          </View>
        )}
      </Card>

      <SectionTitle title="APPLE SALUD" />
      <Gate feature="healthSync" title="Conecta con Apple Salud" description="Envía tus entrenamientos y tu peso, y ve tus pasos en Inicio.">
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={styles.healthIcon}><Icon name="heart" color={colors.neon} /></View>
            <View style={{ flex: 1 }}>
              <T.Body style={{ fontFamily: fonts.semibold }}>Sincronizar con Salud</T.Body>
              <T.Small>{settings.healthSync ? 'Conectado' : 'Desconectado'}</T.Small>
            </View>
            <Switch
              value={settings.healthSync}
              onValueChange={toggleHealth}
              disabled={connecting}
              trackColor={{ true: colors.neon, false: colors.line }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.line}
            />
          </View>
          <View style={{ marginTop: space.md, gap: 4 }}>
            <T.Small>· Lee: pasos, energía activa y peso</T.Small>
            <T.Small>· Guarda: entrenamientos de fuerza y peso corporal</T.Small>
            <T.Small>· {hasAccess('healthNutrition') ? 'Guarda' : 'Con Premium guarda'}: calorías y macros de tus comidas</T.Small>
          </View>
        </Card>
      </Gate>

      <SectionTitle title="LEGAL" />
      <Card style={{ paddingVertical: space.xs }}>
        <Row icon="report" title="Términos de uso" onPress={() => LEGAL.terms && Linking.openURL(LEGAL.terms)} flat />
        <Row icon="lock" title="Privacidad" onPress={() => LEGAL.privacy && Linking.openURL(LEGAL.privacy)} flat line />
        <Row icon="book" title="Soporte" onPress={() => Linking.openURL(LEGAL.support)} flat line />
        {ads.privacyOptionsRequired && <Row icon="target" title="Privacidad de anuncios" onPress={ads.showPrivacyOptions} flat line />}
      </Card>

      <Text style={styles.footer}>{BRAND.name} · {BRAND.slogan}</Text>
    </Screen>
  );
}

function Stepper({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.stepper} hitSlop={6} accessibilityLabel={label === '+' ? 'Aumentar' : 'Reducir'}>
      <Text style={styles.stepperText}>{label}</Text>
    </Pressable>
  );
}

function Row({ icon, title, detail, onPress, flat, line }: { icon: IconName; title: string; detail?: string; onPress: () => void; flat?: boolean; line?: boolean }) {
  const content = (
    <View style={[styles.row, line && styles.line]}>
      <Icon name={icon} size={20} color={colors.neon} />
      <T.Body style={{ flex: 1 }}>{title}</T.Body>
      {detail && <T.Small>{detail}</T.Small>}
      <Icon name="chevron" size={18} color={colors.muted} />
    </View>
  );
  return flat ? <Pressable onPress={onPress}>{content}</Pressable> : <Card onPress={onPress} style={{ paddingVertical: space.xs }}>{content}</Card>;
}

const styles = StyleSheet.create({
  planCard: { marginTop: space.xl, backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.line },
  avatar: { width: 52, height: 52, borderRadius: radius.md, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  healthIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(183,255,54,0.1)', alignItems: 'center', justifyContent: 'center' },
  stepper: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center', marginLeft: space.sm },
  stepperText: { fontFamily: fonts.display, fontSize: 24, color: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14 },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  footer: { marginTop: space.xxl, textAlign: 'center', fontFamily: fonts.displayBold, fontSize: 13, letterSpacing: 3, color: colors.muted },
});
