import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ProgressRing, WeekStrip } from '@/components/charts';
import { AdSlot } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Mark, Wordmark } from '@/components/Logo';
import { Button, Card, FadeIn, Pill, Screen, SectionTitle, T } from '@/components/ui';
import { tierAllows } from '@/config/plans';
import { getProgram, programWeek } from '@/data/programs';
import { getWorkout, totalSets, WORKOUTS } from '@/data/workouts';
import { dailyTarget, dayTotals, useNutrition } from '@/lib/nutrition';
import { daysTrainedThisWeek, goalStreak, sessionsThisWeek, useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { useHealthToday } from '@/lib/useHealthToday';
import { colors, space } from '@/theme/tokens';

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function Home() {
  const { tier, hasAccess } = useSubscription();
  const { sessions, settings, customWorkouts, body } = useProgress();
  const { entries } = useNutrition();
  const health = useHealthToday();

  const weekday = new Date().getDay();
  const planned = settings.weekPlan[weekday];
  const plannedWorkout = planned ? getWorkout(planned, customWorkouts) : undefined;
  // Nunca se propone una rutina de un plan que el usuario no tiene verificado.
  const today = plannedWorkout && tierAllows(tier, plannedWorkout.tier) ? plannedWorkout : undefined;
  const main = today ?? WORKOUTS.find((w) => w.id === 'mobility')!;
  const restDay = !planned;

  const done = sessionsThisWeek(sessions);
  const goal = settings.weeklyGoal;
  const streak = goalStreak(sessions, goal);
  const trained = daysTrainedThisWeek(sessions);
  const trainedToday = trained[(weekday + 6) % 7];

  const program = settings.activeProgram ? getProgram(settings.activeProgram.id) : undefined;
  const pWeek = program && settings.activeProgram ? programWeek(settings.activeProgram.startedAt, program.weeks) : 0;

  const nutrition = hasAccess('nutrition') ? dayTotals(entries) : undefined;
  const target = dailyTarget(body);

  const upcoming = [1, 2, 3].map((o) => {
    const d = (weekday + o) % 7;
    const id = settings.weekPlan[d];
    return { day: DAY_NAMES[d], workout: id ? getWorkout(id, customWorkouts) : undefined };
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Wordmark height={22} />
        <Pill text={tier.toUpperCase()} tone={tier === 'free' ? 'muted' : 'neon'} />
      </View>

      <FadeIn>
        <T.Label style={{ marginTop: space.xl }}>{DAY_NAMES[weekday].toUpperCase()} · ENTRENAMIENTO DEL DÍA</T.Label>
        <Card style={styles.hero}>
          <View style={styles.heroMark} pointerEvents="none">
            <Mark size={180} color="rgba(183,255,54,0.06)" />
          </View>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {program && <Pill text={`${program.name} · SEMANA ${pWeek}/${program.weeks}`} tone="neon" />}
            {restDay && <Pill text="DÍA DE DESCANSO · OPCIONAL" />}
            {trainedToday && <Pill text="HOY YA HAS ENTRENADO" tone="neon" />}
          </View>
          <T.Hero style={{ marginTop: space.md }}>{main.name}</T.Hero>
          <T.Small style={{ marginTop: 4 }}>{main.focus} · {main.level} · {main.setting}</T.Small>
          <View style={styles.meta}>
            <Meta value={`${main.minutes}`} unit="min" />
            <Meta value={`${main.items.length}`} unit="ejercicios" />
            <Meta value={`${totalSets(main)}`} unit="series" />
          </View>
          <Button
            title={restDay ? 'HACER MOVILIDAD' : 'EMPEZAR A ENTRENAR'}
            icon="play"
            onPress={() => router.push(`/workout/${main.id}`)}
            style={{ marginTop: space.xl }}
          />
        </Card>
      </FadeIn>

      <FadeIn delay={80}>
        <SectionTitle title="PROGRESO SEMANAL" action="Ver todo" onAction={() => router.push('/progress')} />
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xl }}>
            <ProgressRing value={done / goal}>
              <T.Stat>{done}<T.Small>/{goal}</T.Small></T.Stat>
            </ProgressRing>
            <View style={{ flex: 1, gap: 6 }}>
              <T.H2>{done >= goal ? 'OBJETIVO CUMPLIDO' : goal - done === 1 ? 'TE QUEDA 1 SESIÓN' : `TE QUEDAN ${goal - done} SESIONES`}</T.H2>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name="flame" size={16} color={streak ? colors.neon : colors.muted} />
                <T.Small style={{ flex: 1 }}>
                  {streak ? `${streak} ${streak === 1 ? 'semana' : 'semanas'} seguidas cumpliendo` : 'Cumple tu objetivo para iniciar una racha'}
                </T.Small>
              </View>
            </View>
          </View>
          <View style={{ marginTop: space.xl }}>
            <WeekStrip trained={trained} />
          </View>
        </Card>
      </FadeIn>

      {(health.enabled || nutrition) && (
        <FadeIn delay={120}>
          <SectionTitle title="HOY" />
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            {health.enabled && (
              <Card style={styles.tile}>
                <Icon name="steps" size={18} color={colors.neon} />
                <T.Stat style={styles.tileStat}>{health.steps != null ? health.steps.toLocaleString('es-ES') : '—'}</T.Stat>
                <T.Small>pasos · Apple Salud</T.Small>
              </Card>
            )}
            {nutrition && (
              <Card style={styles.tile} onPress={() => router.push('/nutrition')}>
                <Icon name="food" size={18} color={colors.neon} />
                <T.Stat style={styles.tileStat}>{nutrition.kcal}</T.Stat>
                <T.Small>{target ? `de ${target.kcal} kcal objetivo` : 'kcal registradas'}</T.Small>
              </Card>
            )}
          </View>
        </FadeIn>
      )}

      <FadeIn delay={160}>
        <SectionTitle title="PRÓXIMOS DÍAS" action="Planificar" onAction={() => router.push('/train')} />
        <Card style={{ paddingVertical: space.sm }}>
          {upcoming.map((u, i) => (
            <View key={u.day} style={[styles.row, i > 0 && styles.rowLine]}>
              <T.Body style={{ width: 96, color: colors.muted }}>{u.day}</T.Body>
              <T.Body style={{ flex: 1 }} numberOfLines={1}>{u.workout ? u.workout.name : 'Descanso'}</T.Body>
              {u.workout && <T.Small>{u.workout.minutes} min</T.Small>}
            </View>
          ))}
        </Card>
      </FadeIn>

      {tier !== 'premium' && (
        <Card onPress={() => router.push('/paywall')} style={styles.upgrade}>
          <View style={{ flex: 1 }}>
            <T.H2 style={{ fontSize: 19 }}>{tier === 'free' ? 'LLEVA TU ENTRENAMIENTO MÁS LEJOS' : 'AÑADE LA NUTRICIÓN A TU PLAN'}</T.H2>
            <T.Small>
              {tier === 'free'
                ? 'Programas por semanas, marcas personales y Apple Salud, sin anuncios.'
                : 'Escanea tus comidas, sigue tus calorías y genera un plan a tu medida.'}
            </T.Small>
          </View>
          <Icon name="chevron" color={colors.neon} />
        </Card>
      )}

      <AdSlot />
    </Screen>
  );
}

function Meta({ value, unit }: { value: string; unit: string }) {
  return (
    <View>
      <T.Stat style={{ fontSize: 28, lineHeight: 30 }}>{value}</T.Stat>
      <T.Small>{unit}</T.Small>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { marginTop: space.md, padding: space.xl, overflow: 'hidden', backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.line },
  heroMark: { position: 'absolute', right: -30, top: -20 },
  meta: { flexDirection: 'row', gap: space.xxl, marginTop: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md },
  rowLine: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  tile: { flex: 1, gap: 6 },
  tileStat: { fontSize: 28, lineHeight: 30 },
  upgrade: { marginTop: space.xl, flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 1, borderColor: 'rgba(183,255,54,0.3)', backgroundColor: colors.graphite },
});
