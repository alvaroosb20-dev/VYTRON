import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Gate } from '@/components/Gate';
import { Icon } from '@/components/Icon';
import { Card, Pill, Screen, T } from '@/components/ui';
import { RECIPES } from '@/data/workouts';
import { colors, space } from '@/theme/tokens';

export default function Nutrition() {
  return (
    <Screen>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginBottom: space.lg }}>
        <Icon name="close" color={colors.muted} />
      </Pressable>
      <T.H1>NUTRICIÓN</T.H1>
      <T.Small style={{ marginTop: 4, marginBottom: space.xl }}>
        Recetas sencillas. Ajusta las cantidades a tus necesidades; ante cualquier condición de salud, consulta a un profesional.
      </T.Small>
      <Gate feature="nutrition" title="Nutrición y recetas" description="Incluido en Premium.">
        <View style={{ gap: space.md }}>
          {RECIPES.map((r) => (
            <Card key={r.id}>
              <Pill text={`${r.minutes} MIN`} tone="neon" />
              <T.H2 style={{ marginTop: space.sm }}>{r.name.toUpperCase()}</T.H2>
              <T.Label style={{ marginTop: space.md }}>INGREDIENTES</T.Label>
              {r.ingredients.map((i) => <T.Body key={i}>· {i}</T.Body>)}
              <T.Label style={{ marginTop: space.md }}>PASOS</T.Label>
              {r.steps.map((s, n) => <T.Body key={s}>{n + 1}. {s}</T.Body>)}
            </Card>
          ))}
        </View>
      </Gate>
    </Screen>
  );
}
