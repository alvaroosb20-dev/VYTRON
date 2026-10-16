import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Card, Chips, Field, Screen, SectionTitle, T, TopBar } from '@/components/ui';
import { latestWeightKg, saveWeightKg } from '@/lib/health';
import { dailyTarget } from '@/lib/nutrition';
import { Activity, BodyProfile, useProgress } from '@/lib/progress';
import { useSubscription } from '@/lib/subscription';
import { colors, space } from '@/theme/tokens';

const ACTIVITY: { value: Activity; label: string }[] = [
  { value: 1.2, label: 'Sedentario' },
  { value: 1.375, label: '1-3 días/sem' },
  { value: 1.55, label: '3-5 días/sem' },
  { value: 1.725, label: '6-7 días/sem' },
  { value: 1.9, label: 'Muy intenso' },
];

const num = (v: string) => {
  const n = parseFloat(v.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

/** Datos corporales: se usan para el objetivo calórico y el registro de peso. */
export default function Body() {
  const { body, setBody, addWeight, settings } = useProgress();
  const { hasAccess } = useSubscription();
  const [b, setB] = useState<BodyProfile>(body);
  const [age, setAge] = useState(body.age ? String(body.age) : '');
  const [height, setHeight] = useState(body.heightCm ? String(body.heightCm) : '');
  const [weight, setWeight] = useState(body.weightKg ? String(body.weightKg) : '');
  const health = settings.healthSync && hasAccess('healthSync');

  const draft: BodyProfile = { ...b, age: num(age), heightCm: num(height), weightKg: num(weight) };
  const target = dailyTarget(draft);

  const save = async () => {
    const w = num(weight);
    await setBody(draft);
    // El historial de peso es una función Pro; los datos básicos se guardan siempre.
    if (w && w !== body.weightKg && hasAccess('bodyWeight')) {
      await addWeight(w);
      if (health) await saveWeightKg(w);
    }
    router.back();
  };

  const importWeight = async () => {
    const w = await latestWeightKg();
    if (w) setWeight(String(w));
    else Alert.alert('Sin datos', 'No hay registros de peso en Apple Salud o no has dado permiso.');
  };

  return (
    <Screen>
      <TopBar title="TUS DATOS" onClose={() => router.back()} />
      <T.H1>DATOS CORPORALES</T.H1>
      <T.Small style={{ marginTop: 4 }}>Se guardan solo en tu dispositivo y sirven para estimar tu objetivo diario.</T.Small>

      <SectionTitle title="SEXO" />
      <Chips value={b.sex} onChange={(sex) => setB({ ...b, sex })} options={[{ value: 'hombre', label: 'Hombre' }, { value: 'mujer', label: 'Mujer' }]} />

      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.xl }}>
        <Field label="EDAD" value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="30" />
        <Field label="ALTURA (CM)" value={height} onChangeText={setHeight} keyboardType="number-pad" placeholder="175" />
        <Field label="PESO (KG)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholder="75" />
      </View>
      {health && <Button title="Importar peso de Apple Salud" variant="ghost" onPress={importWeight} />}

      <SectionTitle title="ACTIVIDAD" />
      <Chips value={b.activity} onChange={(activity) => setB({ ...b, activity })} options={ACTIVITY} />

      <SectionTitle title="OBJETIVO" />
      <Chips value={b.goal} onChange={(goal) => setB({ ...b, goal })} options={[{ value: 'perder', label: 'Perder grasa' }, { value: 'mantener', label: 'Mantener' }, { value: 'ganar', label: 'Ganar músculo' }]} />

      <Card style={{ marginTop: space.xl }}>
        <T.Label>OBJETIVO DIARIO ESTIMADO</T.Label>
        {target ? (
          <>
            <T.Stat style={{ marginTop: space.sm }}>{target.kcal} <T.Small>kcal</T.Small></T.Stat>
            <T.Small style={{ color: colors.white }}>Proteína {target.protein} g · Carbohidratos {target.carbs} g · Grasas {target.fat} g</T.Small>
            <T.Small style={{ marginTop: space.sm }}>
              Calculado con la ecuación de Mifflin-St Jeor (metabolismo basal {target.bmr} kcal) y tu nivel de actividad. Es una referencia: ajústala según tu evolución.
            </T.Small>
          </>
        ) : (
          <T.Small style={{ marginTop: space.sm }}>Completa todos los datos para ver tu estimación.</T.Small>
        )}
      </Card>

      <Button title="GUARDAR" icon="check" onPress={save} style={{ marginTop: space.xl }} />
    </Screen>
  );
}
