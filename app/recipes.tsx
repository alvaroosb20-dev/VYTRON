import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Gate } from '@/components/Gate';
import { Card, Chips, Pill, Screen, T, TopBar } from '@/components/ui';
import { RECIPES } from '@/data/recipes';
import { space } from '@/theme/tokens';

export default function Recipes() {
  const tags = ['Todas', ...Array.from(new Set(RECIPES.map((r) => r.tag)))];
  const [tag, setTag] = useState('Todas');
  const [open, setOpen] = useState<string>();
  const list = RECIPES.filter((r) => tag === 'Todas' || r.tag === tag);

  return (
    <Screen>
      <TopBar title="RECETAS" onClose={() => router.back()} />
      <T.H1>RECETAS PARA ENTRENAR</T.H1>
      <T.Small style={{ marginTop: 4, marginBottom: space.lg }}>
        Ajusta las cantidades a tu objetivo. Para registrar un plato, escanéalo desde Nutrición.
      </T.Small>
      <Gate feature="nutrition" title="Recetas" description="Incluidas en Premium.">
        <Chips options={tags.map((t) => ({ value: t, label: t }))} value={tag} onChange={setTag} />
        <View style={{ gap: space.md, marginTop: space.lg }}>
          {list.map((r) => {
            const isOpen = open === r.id;
            return (
              <Card key={r.id} onPress={() => setOpen(isOpen ? undefined : r.id)}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <Pill text={r.tag.toUpperCase()} />
                  <Pill text={`${r.minutes} MIN`} tone="neon" />
                </View>
                <T.H2 style={{ marginTop: space.sm }}>{r.name.toUpperCase()}</T.H2>
                {isOpen ? (
                  <>
                    <T.Label style={{ marginTop: space.md }}>INGREDIENTES</T.Label>
                    {r.ingredients.map((i) => <T.Body key={i}>· {i}</T.Body>)}
                    <T.Label style={{ marginTop: space.md }}>PASOS</T.Label>
                    {r.steps.map((s, n) => <T.Body key={s}>{n + 1}. {s}</T.Body>)}
                  </>
                ) : (
                  <T.Small>Toca para ver ingredientes y pasos</T.Small>
                )}
              </Card>
            );
          })}
        </View>
      </Gate>
    </Screen>
  );
}
