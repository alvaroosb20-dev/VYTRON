import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { ExerciseDemo } from '@/components/ExerciseDemo';
import { Gate } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { MuscleMap } from '@/components/MuscleMap';
import { Card, Pill, Screen, SectionTitle, T, TopBar } from '@/components/ui';
import { getExercise } from '@/data/exercises';
import { formatRest, Prescription, prescriptionsFor } from '@/lib/prescription';
import { personalRecords, useProgress } from '@/lib/progress';
import { estimate1RM } from '@/lib/training';
import { colors, space } from '@/theme/tokens';

export default function ExerciseDetail() {
  // sets/reps/rest/from llegan desde la sesión de entrenamiento, si se abre desde ahí.
  const params = useLocalSearchParams<{ id: string; sets?: string; reps?: string; rest?: string; from?: string }>();
  const e = getExercise(String(params.id));
  const { sessions, settings, customWorkouts } = useProgress();

  if (!e) {
    return (
      <Screen>
        <TopBar onClose={() => router.back()} />
        <T.H1>EJERCICIO NO ENCONTRADO</T.H1>
      </Screen>
    );
  }

  const fromSession: Prescription | null = params.sets && params.reps
    ? { sets: Number(params.sets), reps: String(params.reps), restSec: Number(params.rest ?? 0), from: params.from ? String(params.from) : 'Tu sesión de hoy' }
    : null;
  const plan = fromSession ? { list: [fromSession], personal: true } : prescriptionsFor(e, settings.weekPlan, customWorkouts);
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
      <ExerciseDemo exercise={e} />
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: space.lg }}>
        <Pill text={e.muscle.toUpperCase()} tone="neon" />
        <Pill text={e.equipment.toUpperCase()} />
        {(e.secondary ?? []).map((m) => <Pill key={m} text={m.toUpperCase()} />)}
      </View>
      <T.Hero style={{ marginTop: space.md }}>{e.name.toUpperCase()}</T.Hero>

      <SectionTitle title={plan.personal ? 'TU PAUTA' : 'PAUTA'} />
      <Card style={{ gap: space.md }}>
        {plan.list.map((p, i) => (
          <View key={i} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', gap: space.lg }}>
              <Metric value={String(p.sets)} label="series" />
              <Metric value={p.reps} label="repeticiones" />
              <Metric value={p.restSec ? formatRest(p.restSec) : '—'} label="descanso" />
            </View>
            <T.Small>{p.from}</T.Small>
          </View>
        ))}
        {!plan.personal && <T.Small>Cuando lo añadas a tu semana o a una rutina propia, aquí verás tu pauta.</T.Small>}
      </Card>

      <SectionTitle title="MÚSCULOS Y MATERIAL" />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
        <MuscleMap primary={e.muscle} secondary={e.secondary} height={150} />
        <View style={{ flex: 1, gap: space.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.neon }} />
            <T.Small style={{ color: colors.white }}>{e.muscle} · principal</T.Small>
          </View>
          {(e.secondary ?? []).map((m) => (
            <View key={m} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(183,255,54,0.38)' }} />
              <T.Small>{m}</T.Small>
            </View>
          ))}
          <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 4 }} />
          <T.Label style={{ fontSize: 10 }}>MATERIAL</T.Label>
          <T.Small style={{ color: colors.white }}>{e.equipment}</T.Small>
        </View>
      </Card>

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

        <SectionTitle title="CONSEJO TÉCNICO" />
        <Card style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
          <Icon name="target" color={colors.neon} />
          <T.Body style={{ flex: 1 }}>{e.cue}</T.Body>
        </Card>

        <SectionTitle title="ERRORES FRECUENTES" />
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

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <T.H2 style={{ color: colors.neon }} numberOfLines={1} adjustsFontSizeToFit>{value}</T.H2>
      <T.Small>{label}</T.Small>
    </View>
  );
}
