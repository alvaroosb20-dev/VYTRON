import { router, useLocalSearchParams } from 'expo-router';
import { Alert, View } from 'react-native';
import { LockedCard } from '@/components/Gate';
import { Button, Card, Pill, Screen, SectionTitle, T, TopBar } from '@/components/ui';
import { tierAllows } from '@/config/plans';
import { getProgram, programWeek } from '@/data/programs';
import { getWorkout } from '@/data/workouts';
import { useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { colors, space } from '@/theme/tokens';

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ProgramDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = getProgram(String(id));
  const { tier } = useSubscription();
  const { settings, startProgram, stopProgram } = useProgress();

  if (!p) {
    return (
      <Screen>
        <TopBar onClose={() => router.back()} />
        <T.H1>PROGRAMA NO ENCONTRADO</T.H1>
      </Screen>
    );
  }

  const locked = !tierAllows(tier, p.tier);
  const active = settings.activeProgram?.id === p.id;
  const week = active && settings.activeProgram ? programWeek(settings.activeProgram.startedAt, p.weeks) : 0;

  const start = () =>
    Alert.alert('Empezar programa', 'Tu planificación semanal se sustituirá por la de este programa.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Empezar', onPress: async () => { await startProgram(p.id, p.schedule); router.replace('/'); } },
    ]);

  return (
    <Screen>
      <TopBar title="PROGRAMA" onClose={() => router.back()} />
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Pill text={p.goal.toUpperCase()} tone="neon" />
        {p.tier !== 'free' && <Pill text={p.tier.toUpperCase()} />}
      </View>
      <T.Hero style={{ marginTop: space.md }}>{p.name}</T.Hero>
      <T.Small style={{ marginTop: 4 }}>{p.weeks} semanas · {p.daysPerWeek} días por semana</T.Small>
      <T.Body style={{ marginTop: space.lg }}>{p.description}</T.Body>

      {active && (
        <Card style={{ marginTop: space.lg, borderWidth: 1, borderColor: colors.neon }}>
          <T.Label>EN CURSO</T.Label>
          <T.H2>SEMANA {week} DE {p.weeks}</T.H2>
          <View style={{ height: 6, backgroundColor: colors.graphite, borderRadius: 3, marginTop: space.md, overflow: 'hidden' }}>
            <View style={{ height: 6, width: `${(week / p.weeks) * 100}%` as `${number}%`, backgroundColor: colors.neon }} />
          </View>
        </Card>
      )}

      <SectionTitle title="SEMANA TIPO" />
      <Card style={{ paddingVertical: space.sm }}>
        {ORDER.map((d, i) => {
          const w = p.schedule[d] ? getWorkout(p.schedule[d]!) : undefined;
          return (
            <View key={d} style={{ flexDirection: 'row', paddingVertical: 12, borderTopWidth: i ? 0.5 : 0, borderTopColor: colors.line, gap: space.md }}>
              <T.Body style={{ width: 90, color: colors.muted }}>{DAY[d]}</T.Body>
              <T.Body style={{ flex: 1, color: w ? colors.white : colors.muted }}>{w ? w.name : 'Descanso'}</T.Body>
              {w && <T.Small>{w.minutes} min</T.Small>}
            </View>
          );
        })}
      </Card>

      <SectionTitle title="PROGRESIÓN" />
      <Card><T.Body>{p.progression}</T.Body></Card>

      <View style={{ marginTop: space.xl, gap: space.sm }}>
        {locked ? (
          <LockedCard required={p.tier} title="Desbloquea este programa" description="Planificación completa semana a semana." />
        ) : active ? (
          <Button title="Dejar el programa" variant="secondary" onPress={() => { stopProgram(); router.back(); }} />
        ) : (
          <Button title="EMPEZAR PROGRAMA" icon="play" onPress={start} />
        )}
      </View>
    </Screen>
  );
}
