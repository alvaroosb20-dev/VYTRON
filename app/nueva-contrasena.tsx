import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Wordmark } from '@/components/Logo';
import { Button, Card, Field, Screen, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, space } from '@/theme/tokens';

/**
 * Destino del enlace «recuperar contraseña» del email. Se abre en la web de VYTRON:
 * Supabase lee el token del enlace, crea la sesión y aquí se elige la contraseña nueva.
 */
export default function NewPassword() {
  const { user, ready, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string }>();

  const save = async () => {
    if (password.length < 8) return setMsg({ ok: false, text: 'La contraseña debe tener al menos 8 caracteres.' });
    if (password !== repeat) return setMsg({ ok: false, text: 'Las contraseñas no coinciden.' });
    setBusy(true);
    const res = await updatePassword(password);
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: 'Contraseña cambiada. Ya puedes iniciar sesión en la app.' } : { ok: false, text: res.error });
  };

  return (
    <Screen>
      <View style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}>
        <Wordmark height={22} />
        <T.H1 style={{ marginTop: space.xxl }}>NUEVA CONTRASEÑA</T.H1>
        {!ready ? (
          <T.Small style={{ marginTop: space.md }}>Comprobando el enlace…</T.Small>
        ) : !user ? (
          <Card style={{ marginTop: space.xl }}>
            <T.Body>El enlace no es válido o ha caducado. Pide otro desde la app: Perfil › Cuenta › ¿Has olvidado tu contraseña?</T.Body>
          </Card>
        ) : msg?.ok ? (
          <Card style={{ marginTop: space.xl, borderWidth: 1, borderColor: colors.neon }}>
            <T.Body>{msg.text}</T.Body>
          </Card>
        ) : (
          <View style={{ gap: space.md, marginTop: space.xl }}>
            <T.Small>Cuenta: {user.email}</T.Small>
            <Field label="CONTRASEÑA NUEVA" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
            <Field label="REPÍTELA" value={repeat} onChangeText={setRepeat} secureTextEntry autoComplete="new-password" />
            {msg && <T.Small style={{ color: colors.danger }}>{msg.text}</T.Small>}
            <Button title="GUARDAR" onPress={save} loading={busy} style={{ marginTop: space.md }} />
            <Button title="Ir a VYTRON" variant="ghost" onPress={() => router.replace('/')} />
          </View>
        )}
      </View>
    </Screen>
  );
}
