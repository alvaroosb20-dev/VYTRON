import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { WeekBars } from '@/components/charts';
import { AdSlot, Gate } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Button, Card, FadeIn, Screen, SectionTitle, T } from '@/components/ui';
import { exerciseName } from '@/data/workouts';
import { goalStreak, personalRecords, Session, sessionsThisWeek, useProgress, weeklyHistory } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { achievementStatus } from '@/lib/achievements';
import { estimate1RM, sessionVolume, setsByMuscle } from '@/lib/training';
import { colors, fonts, space } from '@/theme/tokens';

const DAY = 864e5;

export default function Progress() {
  const { hasAccess } = useSubscription();
  const { sessions, settings, weights, deleteSession } = useProgress();
  const weeks = hasAccess('advancedStats') ? 8 : 4;
  const hist = weeklyHistory(sessions, weeks);
  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  const prs = Object.entries(personalRecords(sessions));
  const totalMinutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const muscles = Object.entries(setsByMuscle(sessions, Date.now() - 7 * DAY)).sort((a, b) => b[1] - a[1]);
  const maxMuscle = Math.max(1, ...muscles.map(([, v]) => v));
  const achievements = achievementStatus(sessions, settings.weeklyGoal);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  const period = (from: number, to: number) => sessions.filter((s) => { const t = new Date(s.completedAt).getTime(); return t >= from && t < to; });
  const now = Date.now();
  const cur = period(now - 30 * DAY, now + 1);
  const prev = period(now - 60 * DAY, now - 30 * DAY);
  const vol = (l: Session[]) => Math.round(l.reduce((a, s) => a + sessionVolume(s), 0));

  const confirmDelete = (s: Session) =>
    Alert.alert('Eliminar sesión', `¿Eliminar ${s.workoutName ?? 'esta sesión'}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteSession(s.id) },
    ]);

  return (
    <Screen>
      <T.H1>PROGRESO</T.H1>

      {sessions.length === 0 && (
        <Card style={{ marginTop: space.xl }}>
          <T.H2>AÚN NO HAY SESIONES</T.H2>
          <T.Small style={{ marginTop: 4 }}>Completa tu primer entrenamiento y aquí verás tu evolución real.</T.Small>
        </Card>
      )}

      <FadeIn>
        <View style={styles.grid}>
          <Stat label="ESTA SEMANA" value={`${sessionsThisWeek(sessions)}/${settings.weeklyGoal}`} />
          <Stat label="RACHA" value={`${goalStreak(sessions, settings.weeklyGoal)} sem`} />
          <Stat label="SESIONES" value={`${sessions.length}`} />
        </View>
      </FadeIn>

      <SectionTitle title={`LOGROS · ${unlocked}/${achievements.length}`} />
      <View style={styles.badges}>
        {achievements.map((a) => (
          <View key={a.id} style={[styles.badge, !a.unlocked && { opacity: 0.5 }]} accessibilityLabel={`${a.title}: ${a.description}${a.unlocked ? ', conseguido' : ''}`}>
            <View style={[styles.badgeIcon, a.unlocked && { backgroundColor: colors.neon }]}>
              <Icon name={a.unlocked ? a.icon : 'lock'} size={18} color={a.unlocked ? colors.neonInk : colors.muted} />
            </View>
            <T.Label style={{ fontSize: 10, color: a.unlocked ? colors.white : colors.muted, textAlign: 'center' }} numberOfLines={2}>{a.title}</T.Label>
            {!a.unlocked && (
              <View style={styles.badgeBar}><View style={[styles.badgeFill, { width: `${Math.round(a.value * 100)}%` as `${number}%` }]} /></View>
            )}
          </View>
        ))}
      </View>

      <SectionTitle title={`SESIONES POR SEMANA · ÚLTIMAS ${weeks}`} />
      <Card>
        <WeekBars data={hist.map((h) => ({ label: fmt(h.from), value: h.count }))} goal={settings.weeklyGoal} />
        <T.Small style={{ marginTop: space.md }}>La línea marca tu objetivo semanal.</T.Small>
      </Card>

      <SectionTitle title="ESTADÍSTICAS AVANZADAS" />
      <Gate feature="advancedStats" title="Estadísticas avanzadas" description="Tiempo total, series por músculo y 8 semanas de histórico.">
        <View style={[styles.grid, { marginTop: 0 }]}>
          <Stat label="MINUTOS TOTALES" value={`${totalMinutes}`} />
          <Stat label="SEMANAS ACTIVAS" value={`${hist.filter((h) => h.count > 0).length}/${weeks}`} />
          <Stat label="MEDIA / SEMANA" value={(hist.reduce((a, h) => a + h.count, 0) / weeks).toFixed(1).replace('.', ',')} />
        </View>
        <Card style={{ marginTop: space.sm }}>
          <T.Label>SERIES POR MÚSCULO · 7 DÍAS</T.Label>
          {muscles.length === 0 ? (
            <T.Small style={{ marginTop: space.sm }}>Sin series esta semana.</T.Small>
          ) : (
            muscles.map(([m, v]) => (
              <View key={m} style={styles.mRow}>
                <T.Small style={{ width: 110, color: colors.white }}>{m}</T.Small>
                <View style={styles.track}><View style={[styles.fill, { width: `${(v / maxMuscle) * 100}%` as `${number}%` }]} /></View>
                <T.Small style={{ width: 34, textAlign: 'right' }}>{String(v).replace('.', ',')}</T.Small>
              </View>
            ))
          )}
          <T.Small style={{ marginTop: space.sm }}>Músculo principal cuenta 1 serie; secundario, media.</T.Small>
        </Card>
      </Gate>

      <SectionTitle title="MARCAS PERSONALES" />
      <Gate feature="personalRecords" title="Marcas personales" description="Tu mejor peso y 1RM estimado por ejercicio.">
        <Card style={{ paddingVertical: space.sm }}>
          {prs.length === 0 ? (
            <T.Small style={{ paddingVertical: space.md }}>Anota el peso en tus series para ver aquí tus récords.</T.Small>
          ) : (
            prs.map(([id, pr], i) => {
              const orm = pr.reps ? estimate1RM(pr.weightKg, pr.reps) : undefined;
              return (
                <Pressable key={id} onPress={() => router.push(`/exercise/${id}`)} style={[styles.row, i > 0 && styles.line]}>
                  <Icon name="trophy" size={18} color={colors.neon} />
                  <View style={{ flex: 1 }}>
                    <T.Body>{exerciseName(id)}</T.Body>
                    {orm ? <T.Small>1RM estimado {String(orm).replace('.', ',')} kg</T.Small> : null}
                  </View>
                  <T.H2 style={{ fontSize: 20 }}>{String(pr.weightKg).replace('.', ',')} kg{pr.reps ? ` × ${pr.reps}` : ''}</T.H2>
                </Pressable>
              );
            })
          )}
        </Card>
      </Gate>

      <SectionTitle title="PESO CORPORAL" action={hasAccess('bodyWeight') ? 'Registrar' : undefined} onAction={() => router.push('/body')} />
      <Gate feature="bodyWeight" title="Registro de peso" description="Sigue tu peso con el tiempo y sincronízalo con Apple Salud.">
        <Card>
          {weights.length === 0 ? (
            <>
              <T.Small>Aún no has registrado tu peso.</T.Small>
              <Button title="Registrar peso" variant="secondary" onPress={() => router.push('/body')} style={{ marginTop: space.md }} />
            </>
          ) : (
            <WeightChart data={[...weights].slice(0, 12).reverse()} />
          )}
        </Card>
      </Gate>

      <SectionTitle title="INFORME MENSUAL" />
      <Gate feature="progressReports" title="Informes de progreso" description="Últimos 30 días comparados con los 30 anteriores.">
        <Card>
          <T.Label>ÚLTIMOS 30 DÍAS VS. 30 ANTERIORES</T.Label>
          <View style={[styles.grid, { marginTop: space.md }]}>
            <Compare label="SESIONES" now={cur.length} before={prev.length} />
            <Compare label="MINUTOS" now={cur.reduce((a, s) => a + s.minutes, 0)} before={prev.reduce((a, s) => a + s.minutes, 0)} />
            <Compare label="VOLUMEN KG" now={vol(cur)} before={vol(prev)} />
          </View>
          <T.Small style={{ marginTop: space.md }}>Volumen = kilos × repeticiones de las series con peso registrado.</T.Small>
        </Card>
      </Gate>

      {sessions.length > 0 && (
        <>
          <SectionTitle title="HISTORIAL" />
          <Card style={{ paddingVertical: space.sm }}>
            {sessions.slice(0, 15).map((s, i) => (
              <View key={s.id} style={[styles.row, i > 0 && styles.line]}>
                <View style={{ flex: 1 }}>
                  <T.Body>{s.workoutName ?? 'Sesión'}</T.Body>
                  <T.Small>{new Date(s.completedAt).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.minutes} min · {s.sets.length} series</T.Small>
                </View>
                <Pressable onPress={() => confirmDelete(s)} hitSlop={10} accessibilityLabel="Eliminar sesión">
                  <Icon name="trash" size={18} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </Card>
        </>
      )}

      <AdSlot />
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <T.Stat style={{ fontSize: 26, lineHeight: 28 }}>{value}</T.Stat>
      <T.Label style={{ fontSize: 10, marginTop: 4 }}>{label}</T.Label>
    </View>
  );
}

function Compare({ label, now, before }: { label: string; now: number; before: number }) {
  const diff = now - before;
  return (
    <View style={{ flex: 1 }}>
      <T.Stat style={{ fontSize: 24, lineHeight: 26 }}>{now.toLocaleString('es-ES')}</T.Stat>
      <T.Small style={{ color: diff > 0 ? colors.neon : colors.muted, fontFamily: fonts.semibold }}>
        {diff === 0 ? 'igual' : `${diff > 0 ? '+' : ''}${diff.toLocaleString('es-ES')}`}
      </T.Small>
      <T.Label style={{ fontSize: 10, marginTop: 2 }}>{label}</T.Label>
    </View>
  );
}

function WeightChart({ data }: { data: { date: string; kg: number }[] }) {
  const min = Math.min(...data.map((d) => d.kg));
  const max = Math.max(...data.map((d) => d.kg));
  const range = Math.max(1, max - min);
  const last = data[data.length - 1];
  const first = data[0];
  const diff = Math.round((last.kg - first.kg) * 10) / 10;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: space.md }}>
        <T.Stat>{String(last.kg).replace('.', ',')} <T.Small>kg</T.Small></T.Stat>
        {data.length > 1 && <T.Small style={{ marginBottom: 6 }}>{diff > 0 ? '+' : ''}{String(diff).replace('.', ',')} kg desde {new Date(first.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</T.Small>}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80, marginTop: space.md }}>
        {data.map((d, i) => (
          <View key={d.date} style={{ flex: 1, height: 16 + ((d.kg - min) / range) * 64, borderRadius: 4, backgroundColor: i === data.length - 1 ? colors.neon : '#3A3A40' }} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  badge: { width: '31.5%', backgroundColor: colors.card, borderRadius: 16, padding: space.md, alignItems: 'center', gap: 8 },
  badgeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center' },
  badgeBar: { alignSelf: 'stretch', height: 4, borderRadius: 2, backgroundColor: colors.graphite, overflow: 'hidden' },
  badgeFill: { height: '100%', backgroundColor: colors.neon },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  mRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.graphite, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.neon },
});
