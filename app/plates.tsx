import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LockedCard } from '@/components/Gate';
import { Card, Chips, Field, Screen, T, TopBar } from '@/components/ui';
import { useSubscription } from '@/lib/subscription';
import { platesPerSide } from '@/lib/training';
import { colors, fonts, space } from '@/theme/tokens';

// Altura relativa del disco según su peso, para dibujarlos en la barra.
const SIZE: Record<number, number> = { 25: 120, 20: 110, 15: 96, 10: 80, 5: 62, 2.5: 48, 1.25: 40 };

export default function Plates() {
  const { hasAccess } = useSubscription();
  const [target, setTarget] = useState('100');
  const [bar, setBar] = useState(20);

  if (!hasAccess('plateCalculator')) {
    return (
      <Screen>
        <TopBar onClose={() => router.back()} />
        <LockedCard required="pro" title="Calculadora de discos" description="Qué discos poner en cada lado de la barra." />
      </Screen>
    );
  }

  const kg = parseFloat(target.replace(',', '.')) || 0;
  const r = platesPerSide(kg, bar);

  return (
    <Screen>
      <TopBar title="CALCULADORA DE DISCOS" onClose={() => router.back()} />
      <Field label="PESO TOTAL (KG)" value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
      <T.Label style={{ marginTop: space.lg, marginBottom: space.sm }}>BARRA</T.Label>
      <Chips<number> value={bar} onChange={setBar} options={[{ value: 20, label: '20 kg' }, { value: 15, label: '15 kg' }, { value: 10, label: '10 kg' }]} />

      <Card style={{ marginTop: space.xl, alignItems: 'center', gap: space.lg }}>
        <T.Label>EN CADA LADO</T.Label>
        {!r.valid ? (
          <T.Body>El peso es menor que la barra.</T.Body>
        ) : r.plates.length === 0 ? (
          <T.Body>Solo la barra.</T.Body>
        ) : (
          <>
            <View style={styles.barRow}>
              <View style={styles.sleeve} />
              {r.plates.map((p, i) => (
                <View key={i} style={[styles.plate, { height: SIZE[p] ?? 40, backgroundColor: p >= 20 ? colors.neon : p >= 10 ? colors.white : colors.muted }]} />
              ))}
              <View style={styles.collar} />
            </View>
            <Text style={styles.list}>{r.plates.map((p) => String(p).replace('.', ',')).join(' + ')} kg</Text>
          </>
        )}
        {r.remainder > 0 && <T.Small>No se puede formar exactamente: faltan {String(r.remainder * 2).replace('.', ',')} kg en total.</T.Small>}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  barRow: { flexDirection: 'row', alignItems: 'center', height: 130 },
  sleeve: { width: 60, height: 12, backgroundColor: colors.line, borderRadius: 2 },
  plate: { width: 16, borderRadius: 3, marginHorizontal: 1 },
  collar: { width: 10, height: 24, backgroundColor: colors.line, borderRadius: 2 },
  list: { fontFamily: fonts.display, fontSize: 24, color: colors.white, textAlign: 'center' },
});
