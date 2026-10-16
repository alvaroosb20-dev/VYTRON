import { StyleSheet, View } from 'react-native';
import { WeekBars } from '@/components/charts';
import { AdSlot, Gate } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Card, FadeIn, Screen, SectionTitle, T } from '@/components/ui';
import { WORKOUTS } from '@/data/workouts';
import { goalStreak, personalRecords, sessionsThisWeek, useProgress, weeklyHistory } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { colors, space } from '@/theme/tokens';

const exerciseName = (id: string) => WORKOUTS.flatMap((w) => w.exercises).find((e) => e.id === id)?.name ?? id;

export default function Progress() {
  const { hasAccess } = useSubscription();
  const { sessions, settings } = useProgress();
  const weeks = hasAccess('advancedStats') ? 8 : 4;
  const hist = weeklyHistory(sessions, weeks);
  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  const prs = Object.entries(personalRecords(sessions));
  const totalMinutes = sessions.reduce((a, s) => a + s.minutes, 0);
  const activeWeeks = hist.filter((h) => h.count > 0).length;

  // Resumen de los últimos 30 días (informe Premium), calculado solo con datos registrados.
  const since = Date.now() - 30 * 864e5;
  const last30 = sessions.filter((s) => new Date(s.completedAt).getTime() >= since);

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

      <SectionTitle title={`SESIONES POR SEMANA · ÚLTIMAS ${weeks}`} />
      <Card>
        <WeekBars data={hist.map((h) => ({ label: fmt(h.from), value: h.count }))} goal={settings.weeklyGoal} />
        <T.Small style={{ marginTop: space.md }}>La línea marca tu objetivo semanal.</T.Small>
      </Card>

      <SectionTitle title="ESTADÍSTICAS AVANZADAS" />
      <Gate feature="advancedStats" title="Estadísticas avanzadas" description="Tiempo total, constancia y 8 semanas de histórico.">
        <View style={styles.grid}>
          <Stat label="MINUTOS TOTALES" value={`${totalMinutes}`} />
          <Stat label="SEMANAS ACTIVAS" value={`${activeWeeks}/${weeks}`} />
          <Stat label="MEDIA / SEMANA" value={(hist.reduce((a, h) => a + h.count, 0) / weeks).toFixed(1)} />
        </View>
      </Gate>

      <SectionTitle title="MARCAS PERSONALES" />
      <Gate feature="personalRecords" title="Marcas personales" description="Registra el peso de cada serie y sigue tus mejores marcas.">
        <Card style={{ paddingVertical: space.sm }}>
          {prs.length === 0 ? (
            <T.Small style={{ paddingVertical: space.md }}>Anota el peso en tus series para ver aquí tus récords.</T.Small>
          ) : (
            prs.map(([id, pr], i) => (
              <View key={id} style={[styles.row, i > 0 && styles.line]}>
                <Icon name="trophy" size={18} color={colors.neon} />
                <T.Body style={{ flex: 1 }}>{exerciseName(id)}</T.Body>
                <T.H2 style={{ fontSize: 20 }}>{pr.weightKg} kg</T.H2>
              </View>
            ))
          )}
        </Card>
      </Gate>

      <SectionTitle title="INFORME DE PROGRESO" />
      <Gate feature="progressReports" title="Informes de progreso" description="Resumen mensual de tu actividad y tus mejoras.">
        <Card>
          <T.Label>ÚLTIMOS 30 DÍAS</T.Label>
          <View style={[styles.grid, { marginTop: space.md }]}>
            <Stat label="SESIONES" value={`${last30.length}`} flat />
            <Stat label="MINUTOS" value={`${last30.reduce((a, s) => a + s.minutes, 0)}`} flat />
            <Stat label="RUTINAS" value={`${new Set(last30.map((s) => s.workoutId)).size}`} flat />
          </View>
        </Card>
      </Gate>

      <AdSlot />
    </Screen>
  );
}

function Stat({ label, value, flat }: { label: string; value: string; flat?: boolean }) {
  return (
    <View style={[styles.stat, flat && { backgroundColor: 'transparent', padding: 0 }]}>
      <T.Stat style={{ fontSize: 26, lineHeight: 28 }}>{value}</T.Stat>
      <T.Label style={{ fontSize: 10, marginTop: 4 }}>{label}</T.Label>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: 16, padding: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  line: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
