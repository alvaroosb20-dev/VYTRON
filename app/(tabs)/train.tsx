import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AdSlot, Gate } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Card, FadeIn, Pill, Screen, SectionTitle, T } from '@/components/ui';
import { tierAllows } from '@/config/plans';
import { getWorkout, WORKOUTS } from '@/data/workouts';
import { useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { colors, fonts, radius, space } from '@/theme/tokens';

const WEEK = [
  { d: 1, n: 'LUN' }, { d: 2, n: 'MAR' }, { d: 3, n: 'MIÉ' }, { d: 4, n: 'JUE' },
  { d: 5, n: 'VIE' }, { d: 6, n: 'SÁB' }, { d: 0, n: 'DOM' },
];

export default function Train() {
  const { tier } = useSubscription();
  const { settings, setDayPlan } = useProgress();
  const available = WORKOUTS.filter((w) => tierAllows(tier, w.tier));

  // Rota la rutina de un día entre las disponibles y "descanso".
  const cycleDay = (d: number) => {
    const options = [null, ...available.map((w) => w.id)];
    const i = options.indexOf(settings.weekPlan[d] ?? null);
    setDayPlan(d, options[(i + 1) % options.length]);
  };

  return (
    <Screen>
      <T.H1>ENTRENAR</T.H1>
      <T.Small style={{ marginTop: 4 }}>Elige una rutina o planifica tu semana.</T.Small>

      <SectionTitle title="PLANIFICACIÓN SEMANAL" />
      <Gate feature="weeklyPlanning" title="Planifica tu semana" description="Asigna rutinas a cada día y la app te las propone en Inicio.">
        <Card style={{ paddingVertical: space.sm }}>
          {WEEK.map(({ d, n }, i) => {
            const w = settings.weekPlan[d] ? getWorkout(settings.weekPlan[d]!) : undefined;
            return (
              <Pressable key={d} onPress={() => cycleDay(d)} style={[styles.planRow, i > 0 && styles.line]}>
                <Text style={styles.day}>{n}</Text>
                <T.Body style={{ flex: 1, color: w ? colors.white : colors.muted }}>{w ? w.name : 'Descanso'}</T.Body>
                <T.Small>Cambiar</T.Small>
              </Pressable>
            );
          })}
        </Card>
      </Gate>

      <SectionTitle title="RUTINAS" />
      {WORKOUTS.map((w, i) => {
        const locked = !tierAllows(tier, w.tier);
        return (
          <FadeIn key={w.id} delay={i * 40} style={{ marginBottom: space.md }}>
            <Card onPress={() => router.push(locked ? '/paywall' : `/workout/${w.id}`)} style={locked ? styles.locked : undefined}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    <Pill text={w.level.toUpperCase()} />
                    {w.tier !== 'free' && <Pill text={w.tier.toUpperCase()} tone="neon" />}
                  </View>
                  <T.H2>{w.name}</T.H2>
                  <T.Small>{w.focus} · {w.minutes} min · {w.exercises.length} ejercicios</T.Small>
                </View>
                <View style={[styles.go, locked && { backgroundColor: colors.graphite }]}>
                  <Icon name={locked ? 'lock' : 'play'} size={18} color={locked ? colors.muted : colors.neonInk} fill={!locked} />
                </View>
              </View>
            </Card>
          </FadeIn>
        );
      })}

      <AdSlot />
    </Screen>
  );
}

const styles = StyleSheet.create({
  planRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: space.md },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  day: { width: 40, fontFamily: fonts.display, fontSize: 16, color: colors.neon },
  locked: { opacity: 0.7 },
  go: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.neon, alignItems: 'center', justifyContent: 'center' },
});
