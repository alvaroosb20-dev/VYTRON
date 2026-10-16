import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Card, Chips, Field, Pill, Screen, T, TopBar } from '@/components/ui';
import { tierAllows } from '@/config/plans';
import { EXERCISES, Muscle, MUSCLES } from '@/data/exercises';
import { useSubscription } from '@/lib/subscription';
import { colors, space } from '@/theme/tokens';

export default function Library() {
  const { tier } = useSubscription();
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<Muscle | 'Todos'>('Todos');

  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const list = EXERCISES.filter((e) => (muscle === 'Todos' || e.muscle === muscle) && norm(e.name).includes(norm(q)));

  return (
    <Screen>
      <TopBar title="BIBLIOTECA" onClose={() => router.back()} />
      <T.H1>EJERCICIOS</T.H1>
      <T.Small style={{ marginTop: 4, marginBottom: space.lg }}>{EXERCISES.length} ejercicios con técnica paso a paso.</T.Small>
      <Field label="BUSCAR" value={q} onChangeText={setQ} placeholder="Sentadilla, remo, press…" />
      <View style={{ marginVertical: space.lg }}>
        <Chips options={[{ value: 'Todos' as const, label: 'Todos' }, ...MUSCLES.map((m) => ({ value: m, label: m }))]} value={muscle} onChange={setMuscle} />
      </View>
      <View style={{ gap: space.sm }}>
        {list.map((e) => {
          const locked = !tierAllows(tier, e.tier);
          return (
            <Card key={e.id} onPress={() => router.push(`/exercise/${e.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={{ flex: 1 }}>
                <T.Body>{e.name}</T.Body>
                <T.Small>{e.muscle} · {e.equipment}</T.Small>
              </View>
              {locked ? <Pill text={e.tier.toUpperCase()} tone="neon" /> : <Icon name="chevron" size={18} color={colors.muted} />}
            </Card>
          );
        })}
        {!list.length && <T.Small>No hay ejercicios con ese nombre.</T.Small>}
      </View>
    </Screen>
  );
}
