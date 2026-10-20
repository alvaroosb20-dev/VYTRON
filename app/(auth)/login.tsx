import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { AuthShell, Input, LinkText, Notice, PasswordInput } from '@/components/authUI';
import { Button, T } from '@/components/ui';
import { emailValid, useAuth } from '@/lib/auth';
import { colors, space } from '@/theme/tokens';

export default function Login() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { signIn, resendConfirmation, expiredEmail, clearExpired } = useAuth();
  const [email, setEmail] = useState(params.email ?? expiredEmail ?? '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [message, setMessage] = useState<{ tone: 'error' | 'ok'; text: string; action?: 'resend' | 'register' }>();
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Escribe tu email.';
    else if (!emailValid(email)) e.email = 'Este email no parece válido.';
    if (!password) e.password = 'Escribe tu contraseña.';
    setErrors(e);
    return !e.email && !e.password;
  };

  const submit = async () => {
    if (busy) return; // evita envíos repetidos
    setMessage(undefined);
    if (!validate()) return;
    setBusy(true);
    const res = await signIn(email, password);
    setBusy(false);
    // Con éxito, la navegación a la app es automática (rutas protegidas).
    if (!res.ok) setMessage({ tone: 'error', text: res.error, action: res.code === 'unconfirmed' ? 'resend' : undefined });
  };

  const resend = async () => {
    setBusy(true);
    const res = await resendConfirmation(email);
    setBusy(false);
    setMessage(res.ok ? { tone: 'ok', text: `Te hemos reenviado el enlace de confirmación a ${email.trim()}.` } : { tone: 'error', text: res.error });
  };

  const otherAccount = () => {
    clearExpired();
    router.replace('/welcome');
  };

  return (
    <AuthShell>
      <T.H1>INICIA SESIÓN</T.H1>
      <T.Small style={{ marginTop: 4 }}>Entra con tu email y tu contraseña.</T.Small>

      {expiredEmail && (
        <View style={{ marginTop: space.xl }}>
          <Notice tone="info" text="Tu sesión ha caducado. Vuelve a iniciar sesión para seguir donde lo dejaste." action="Usar otra cuenta" onAction={otherAccount} />
        </View>
      )}

      <View style={{ gap: space.lg, marginTop: space.xl }}>
        <Input
          label="EMAIL"
          value={email}
          onChangeText={(v) => { setEmail(v); if (errors.email) setErrors({ ...errors, email: undefined }); }}
          error={errors.email}
          placeholder="tu@email.com"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          editable={!busy}
        />
        <PasswordInput
          ref={passwordRef}
          label="CONTRASEÑA"
          value={password}
          onChangeText={(v) => { setPassword(v); if (errors.password) setErrors({ ...errors, password: undefined }); }}
          error={errors.password}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!busy}
        />
        <View style={{ alignItems: 'flex-end', marginTop: -space.sm }}>
          <LinkText onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}>¿Has olvidado tu contraseña?</LinkText>
        </View>
      </View>

      {message && (
        <View style={{ marginTop: space.lg }}>
          <Notice tone={message.tone} text={message.text} action={message.action === 'resend' ? 'Reenviar email de confirmación' : undefined} onAction={resend} />
        </View>
      )}

      <Button title="INICIAR SESIÓN" onPress={submit} loading={busy} style={{ marginTop: space.xl }} />

      <T.Small style={{ marginTop: space.xl, textAlign: 'center', color: colors.muted }}>
        ¿Aún no tienes cuenta? <LinkText onPress={() => router.replace('/register')}>Crear cuenta</LinkText>
      </T.Small>
    </AuthShell>
  );
}
