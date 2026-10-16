import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { LockedCard } from '@/components/Gate';
import { Button, Card, Chips, Screen, SectionTitle, T, TopBar } from '@/components/ui';
import { getWorkout, Setting } from '@/data/workouts';
import { useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { generatePlan, Goal } from '@/lib/training';
import { colors, space } from '@/theme/tokens';

const ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function PlanGenerator() {
  const { hasAccess } = useSubscription();
  const { setWeekPlan, setWeeklyGoal } = useProgress();
  const [goal, setGoal] = useState<Goal>('musculo');
  const [days, setDays] = useState(4);
  const [setting, setSetting] = useState<Setting>('Gimnasio');

  if (!hasAccess('customPlanning')) {
    return (
      <Screen>
        <TopBar onClose={() => router.back()} />
        <LockedCard required="premium" title="Plan personalizado" description="Una semana de entrenamiento según tu objetivo, días y material." />
      </Screen>
    );
  }

  const plan = generatePlan(goal, days, setting);

  const apply = async () => {
    await setWeekPlan(plan);
    await setWeeklyGoal(days);
    router.replace('/train');
  };

  return (
    <Screen>
      <TopBar title="PLAN PERSONALIZADO" onClose={() => router.back()} />
      <T.H1>TU SEMANA A MEDIDA</T.H1>
      <T.Small style={{ marginTop: 4 }}>Responde tres preguntas y VYTRON organiza tus entrenamientos.</T.Small>

      <SectionTitle title="OBJETIVO" />
      <Chips<Goal>
        value={goal}
        onChange={setGoal}
        options={[{ value: 'fuerza', label: 'Ganar fuerza' }, { value: 'musculo', label: 'Ganar músculo' }, { value: 'grasa', label: 'Perder grasa' }, { value: 'salud', label: 'Salud y forma' }]}
      />
      <SectionTitle title="DÍAS POR SEMANA" />
      <Chips<number> value={days} onChange={setDays} options={[2, 3, 4, 5, 6].map((d) => ({ value: d, label: `${d} días` }))} />
      <SectionTitle title="MATERIAL" />
      <Chips<Setting> value={setting} onChange={setSetting} options={(['Gimnasio', 'Mancuernas', 'Sin material'] as Setting[]).map((s) => ({ value: s, label: s }))} />

      <SectionTitle title="TU PLAN" />
      <Card style={{ paddingVertical: space.sm }}>
        {ORDER.map((d, i) => {
          const w = plan[d] ? getWorkout(plan[d]!) : undefined;
          return (
            <View key={d} style={{ flexDirection: 'row', gap: space.md, paddingVertical: 12, borderTopWidth: i ? 0.5 : 0, borderTopColor: colors.line }}>
              <T.Body style={{ width: 44, color: colors.neon }}>{DAY[d]}</T.Body>
              <T.Body style={{ flex: 1, color: w ? colors.white : colors.muted }}>{w ? w.name : 'Descanso'}</T.Body>
              {w && <T.Small>{w.minutes} min</T.Small>}
            </View>
          );
        })}
      </Card>
      <T.Small style={{ marginTop: space.md }}>Los días de descanso están repartidos para que llegues recuperado a cada sesión.</T.Small>
      <Button title="APLICAR A MI SEMANA" icon="check" onPress={apply} style={{ marginTop: space.xl }} />
    </Screen>
  );
}
