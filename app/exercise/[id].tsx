import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Gate } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Card, Pill, Screen, SectionTitle, T, TopBar } from '@/components/ui';
import { getExercise } from '@/data/exercises';
import { personalRecords, useProgress } from '@/lib/progress';
import { estimate1RM } from '@/lib/training';
import { colors, space } from '@/theme/tokens';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const e = getExercise(String(id));
  const { sessions } = useProgress();

  if (!e) {
    return (
      <Screen>
        <TopBar onClose={() => router.back()} />
        <T.H1>EJERCICIO NO ENCONTRADO</T.H1>
      </Screen>
    );
  }

  const pr = personalRecords(sessions)[e.id];
  const history = sessions
    .filter((s) => s.sets.some((x) => x.exerciseId === e.id))
    .slice(0, 5)
    .map((s) => {
      const sets = s.sets.filter((x) => x.exerciseId === e.id);
      return { date: new Date(s.completedAt), sets };
    });

  return (
    <Screen>
      <TopBar onClose={() => router.back()} />
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <Pill text={e.muscle.toUpperCase()} tone="neon" />
        <Pill text={e.equipment.toUpperCase()} />
        {(e.secondary ?? []).map((m) => <Pill key={m} text={m.toUpperCase()} />)}
      </View>
      <T.Hero style={{ marginTop: space.md }}>{e.name.toUpperCase()}</T.Hero>

      <Gate tier={e.tier} title="Técnica completa" description="Pasos, claves y errores comunes de este ejercicio.">
        <SectionTitle title="CÓMO SE HACE" />
        <Card style={{ gap: space.md }}>
          {e.steps.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
              <T.H2 style={{ color: colors.neon, width: 22 }}>{i + 1}</T.H2>
              <T.Body style={{ flex: 1 }}>{s}</T.Body>
            </View>
          ))}
        </Card>

        <SectionTitle title="CLAVE" />
        <Card style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          <Icon name="target" color={colors.neon} />
          <T.Body style={{ flex: 1 }}>{e.cue}</T.Body>
        </Card>

        <SectionTitle title="ERRORES COMUNES" />
        <Card style={{ gap: space.sm }}>
          {e.mistakes.map((m) => <T.Body key={m}>· {m}</T.Body>)}
        </Card>
      </Gate>

      {e.weighted && (
        <>
          <SectionTitle title="TU HISTORIAL" />
          <Gate feature="personalRecords" title="Marcas personales" description="Tu mejor peso y 1RM estimado en este ejercicio.">
            <Card>
              {pr ? (
                <View style={{ flexDirection: 'row', gap: space.xl }}>
                  <View>
                    <T.Stat>{pr.weightKg} <T.Small>kg</T.Small></T.Stat>
                    <T.Small>Mejor peso{pr.reps ? ` × ${pr.reps}` : ''}</T.Small>
                  </View>
                  {pr.reps && estimate1RM(pr.weightKg, pr.reps) ? (
                    <View>
                      <T.Stat>{estimate1RM(pr.weightKg, pr.reps)} <T.Small>kg</T.Small></T.Stat>
                      <T.Small>1RM estimado</T.Small>
                    </View>
                  ) : null}
                </View>
              ) : (
                <T.Small>Aún no has registrado peso en este ejercicio.</T.Small>
              )}
              {history.map((h, i) => (
                <View key={i} style={{ marginTop: space.md }}>
                  <T.Label style={{ fontSize: 10 }}>{h.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()}</T.Label>
                  <T.Body>{h.sets.map((s) => `${s.weightKg ? `${s.weightKg} kg × ` : ''}${s.reps ?? '—'}`).join('  ·  ')}</T.Body>
                </View>
              ))}
            </Card>
          </Gate>
        </>
      )}
    </Screen>
  );
}
