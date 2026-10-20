import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Icon } from '@/components/Icon';
import { Button, Card, Chips, Field, Screen, SectionTitle, T, TopBar } from '@/components/ui';
import { LEGAL } from '@/config/app';
import { useAuth } from '@/lib/auth';
import { forgetSyncOwner, useSync } from '@/lib/cloudSync';
import { colors, fonts, space } from '@/theme/tokens';

type Mode = 'login' | 'signup' | 'reset';

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
      ) : auth.user ? (
        <SignedIn />
      ) : (
        <SignedOut />
      )}
    </Screen>
  );
}

function SignedOut() {
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string }>();

  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  const submit = async () => {
    setMessage(undefined);
    if (!validEmail) return setMessage({ tone: 'error', text: 'Escribe un email válido.' });
    if (mode !== 'reset' && password.length < 8) return setMessage({ tone: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' });
    if (mode === 'signup' && !consent) return setMessage({ tone: 'error', text: 'Para crear la cuenta necesitamos tu permiso para guardar tus datos en la nube.' });
    setBusy(true);
    const res = mode === 'login' ? await signIn(email, password) : mode === 'signup' ? await signUp(email, password) : await sendPasswordReset(email);
    setBusy(false);
    if (!res.ok) return setMessage({ tone: 'error', text: res.error });
    if (mode === 'reset') return setMessage({ tone: 'ok', text: 'Te hemos enviado un email con un enlace para crear una contraseña nueva.' });
    if (mode === 'signup' && res.needsConfirmation) {
      setMode('login');
      return setMessage({ tone: 'ok', text: 'Cuenta creada. Abre el enlace que te hemos enviado por email y después inicia sesión aquí.' });
    }
    router.back();
  };

  return (
    <View>
      <T.H1>{mode === 'signup' ? 'CREA TU CUENTA' : mode === 'reset' ? 'RECUPERA TU CONTRASEÑA' : 'INICIA SESIÓN'}</T.H1>
      <T.Small style={{ marginTop: 4 }}>
        {mode === 'reset'
          ? 'Te enviaremos un enlace para elegir una contraseña nueva.'
          : 'Guarda tus entrenamientos y comidas en la nube, úsalos en varios dispositivos y recupera tu plan al cambiar de teléfono.'}
      </T.Small>

      {mode !== 'reset' && (
        <View style={{ marginTop: space.xl }}>
          <Chips<Mode> value={mode} onChange={(m) => { setMode(m); setMessage(undefined); }} options={[{ value: 'login', label: 'Iniciar sesión' }, { value: 'signup', label: 'Crear cuenta' }]} />
        </View>
      )}

      <View style={{ gap: space.md, marginTop: space.xl }}>
        <Field label="EMAIL" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="tu@email.com" />
        {mode !== 'reset' && (
          <Field
            label="CONTRASEÑA"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            textContentType={mode === 'signup' ? 'newPassword' : 'password'}
            placeholder={mode === 'signup' ? 'Mínimo 8 caracteres' : ''}
          />
        )}
      </View>

      {mode === 'signup' && (
        <Pressable onPress={() => setConsent(!consent)} style={styles.consent} accessibilityRole="checkbox" accessibilityState={{ checked: consent }}>
          <View style={[styles.box, consent && styles.boxOn]}>{consent && <Icon name="check" size={14} color={colors.neonInk} />}</View>
          <T.Small style={{ flex: 1, color: colors.white }}>
            Acepto que VYTRON guarde en la nube mis entrenamientos, mis datos corporales y mi diario de comidas para sincronizarlos. Puedo borrarlos cuando quiera.{' '}
            <T.Small style={{ color: colors.neon }} onPress={() => Linking.openURL(LEGAL.privacy)}>Política de privacidad</T.Small>
          </T.Small>
        </Pressable>
      )}

      {message && (
        <Card style={[styles.msg, { borderColor: message.tone === 'ok' ? colors.neon : colors.danger }]}>
          <T.Small style={{ color: colors.white }}>{message.text}</T.Small>
        </Card>
      )}

      <Button
        title={mode === 'login' ? 'ENTRAR' : mode === 'signup' ? 'CREAR CUENTA' : 'ENVIAR ENLACE'}
        onPress={submit}
        loading={busy}
        style={{ marginTop: space.xl }}
      />
      {mode === 'login' && <Button title="¿Has olvidado tu contraseña?" variant="ghost" onPress={() => { setMode('reset'); setMessage(undefined); }} />}
      {mode === 'reset' && <Button title="Volver" variant="ghost" onPress={() => { setMode('login'); setMessage(undefined); }} />}

      <T.Small style={{ marginTop: space.xl, textAlign: 'center' }}>La cuenta es opcional. Sin ella, todo se guarda solo en este teléfono.</T.Small>
    </View>
  );
}

function SignedIn() {
  const { user, signOut, deleteAccount } = useAuth();
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
      { text: 'Cerrar sesión', onPress: async () => { await signOut(); router.back(); } },
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
            router.back();
          },
        },
      ],
    );

  return (
    <View>
      <T.H1>TU CUENTA</T.H1>
      <Card style={{ marginTop: space.xl, gap: space.sm }}>
        <T.Label>EMAIL</T.Label>
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
  consent: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', marginTop: space.lg },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  boxOn: { backgroundColor: colors.neon, borderColor: colors.neon },
  msg: { marginTop: space.lg, borderWidth: 1, backgroundColor: colors.graphite },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
