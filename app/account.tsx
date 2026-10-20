import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Button, Card, Screen, SectionTitle, T, TopBar } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { forgetSyncOwner, useSync } from '@/lib/cloudSync';
import { colors, fonts, space } from '@/theme/tokens';

export default function Account() {
  const auth = useAuth();
  const close = () => router.back();

  return (
    <Screen>
      <TopBar title="CUENTA" onClose={close} />
      {!auth.available ? (
        <Card>
          <T.H2>CUENTAS PRÓXIMAMENTE</T.H2>
          <T.Small style={{ marginTop: 4 }}>Tus datos se guardan en este teléfono. Muy pronto podrás crear una cuenta para no perderlos y usarlos en varios dispositivos.</T.Small>
        </Card>
      ) : (
        <SignedIn />
      )}
    </Screen>
  );
}

function SignedIn() {
  const { user, displayName, signOut, deleteAccount } = useAuth();
  const { status, lastSyncedAt, syncNow } = useSync();
  const [busy, setBusy] = useState(false);

  const statusText =
    status === 'syncing' ? 'Sincronizando…'
    : status === 'error' ? 'No se pudo sincronizar. Lo intentaremos de nuevo.'
    : lastSyncedAt ? `Sincronizado a las ${lastSyncedAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    : 'Pendiente de sincronizar';

  const confirmSignOut = () =>
    Alert.alert('Cerrar sesión', 'Tus datos siguen guardados en la nube y en este teléfono.', [
      { text: 'Cancelar', style: 'cancel' },
      // Al cerrar sesión, la app vuelve sola a la bienvenida (rutas protegidas).
      { text: 'Cerrar sesión', onPress: () => signOut() },
    ]);

  const confirmDelete = () =>
    Alert.alert(
      'Eliminar cuenta',
      'Se borrarán para siempre tu cuenta y la copia de tus datos en la nube. Los datos de este teléfono se quedan aquí. Eliminar la cuenta NO cancela tu suscripción: cancélala en los ajustes de la tienda.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            const res = await deleteAccount();
            setBusy(false);
            if (!res.ok) return Alert.alert('No se pudo eliminar', res.error);
            await forgetSyncOwner();
            Alert.alert('Cuenta eliminada', 'Hemos borrado tu cuenta y tus datos de la nube.');
          },
        },
      ],
    );

  return (
    <View>
      <T.H1>TU CUENTA</T.H1>
      <Card style={{ marginTop: space.xl, gap: space.sm }}>
        <T.Label>NOMBRE</T.Label>
        <T.Body style={{ fontFamily: fonts.semibold }}>{displayName}</T.Body>
        <T.Label style={{ marginTop: space.sm }}>EMAIL</T.Label>
        <T.Body style={{ fontFamily: fonts.semibold }}>{user?.email}</T.Body>
      </Card>

      <SectionTitle title="SINCRONIZACIÓN" />
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={[styles.dot, { backgroundColor: status === 'error' ? colors.danger : status === 'syncing' ? colors.muted : colors.neon }]} />
        <T.Small style={{ flex: 1, color: colors.white }}>{statusText}</T.Small>
        <Pressable onPress={syncNow} hitSlop={10} disabled={status === 'syncing'}>
          <T.Small style={{ color: colors.neon, fontFamily: fonts.semibold }}>Sincronizar</T.Small>
        </Pressable>
      </Card>
      <T.Small style={{ marginTop: space.sm }}>Entrenamientos, rutinas, plan semanal, datos corporales y diario de comidas. Las fotos de comidas se quedan en cada teléfono.</T.Small>

      <Button title="Cerrar sesión" variant="secondary" onPress={confirmSignOut} style={{ marginTop: space.xxl }} />
      <Button title="Eliminar cuenta" variant="ghost" onPress={confirmDelete} loading={busy} textStyle={{ color: colors.danger }} />
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { width: 10, height: 10, borderRadius: 5 },
});
