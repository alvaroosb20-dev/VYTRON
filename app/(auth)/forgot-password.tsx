import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AuthShell, Input, Notice } from '@/components/authUI';
import { Button, T } from '@/components/ui';
import { emailValid, useAuth } from '@/lib/auth';
import { colors, space } from '@/theme/tokens';

/**
 * Recuperar contraseña: Supabase envía un enlace que abre la web de VYTRON
 * (/nueva-contrasena), donde se elige la contraseña nueva de forma segura.
 */
export default function ForgotPassword() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (!email.trim()) return setError('Escribe tu email.');
    if (!emailValid(email)) return setError('Este email no parece válido.');
    setError(undefined);
    setBusy(true);
    const res = await sendPasswordReset(email);
    setBusy(false);
    // Solo se confirma el envío si Supabase lo ha aceptado de verdad.
    if (res.ok) setSentTo(email.trim().toLowerCase());
    else setError(res.error);
  };

  if (sentTo) {
    return (
      <AuthShell>
        <T.H1>REVISA TU EMAIL</T.H1>
        <View style={{ marginTop: space.xl }}>
          <Notice
            tone="ok"
            text={`Si existe una cuenta con ${sentTo}, te hemos enviado un enlace para crear una contraseña nueva. Puede tardar unos minutos; revisa también el spam.`}
          />
        </View>
        <Button title="VOLVER A INICIAR SESIÓN" onPress={() => router.replace({ pathname: '/login', params: { email: sentTo } })} style={{ marginTop: space.xl }} />
        <Button title="No me ha llegado, enviar otra vez" variant="ghost" onPress={() => setSentTo(undefined)} />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <T.H1>RECUPERA TU CONTRASEÑA</T.H1>
      <T.Small style={{ marginTop: 4 }}>Escribe el email de tu cuenta y te enviaremos un enlace para crear una nueva.</T.Small>
      <View style={{ marginTop: space.xl }}>
        <Input
          label="EMAIL"
          value={email}
          onChangeText={(v) => { setEmail(v); setError(undefined); }}
          error={error}
          placeholder="tu@email.com"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="send"
          onSubmitEditing={submit}
          editable={!busy}
        />
      </View>
      <Button title="ENVIAR ENLACE" onPress={submit} loading={busy} style={{ marginTop: space.xl }} />
      <T.Small style={{ marginTop: space.lg, textAlign: 'center', color: colors.muted }}>
        El enlace caduca en una hora por seguridad.
      </T.Small>
    </AuthShell>
  );
}
