import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthShell, Notice } from '@/components/authUI';
import { Icon } from '@/components/Icon';
import { Button, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, space } from '@/theme/tokens';

const COOLDOWN = 60;

/** Tras registrarse: hay que confirmar el email con el enlace que envía Supabase. */
export default function VerifyEmail() {
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const { resendConfirmation } = useAuth();
  const [wait, setWait] = useState(COOLDOWN);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string }>();

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const resend = async () => {
    setBusy(true);
    const res = await resendConfirmation(email);
    setBusy(false);
    if (res.ok) {
      setWait(COOLDOWN);
      setMessage({ tone: 'ok', text: 'Email reenviado. Revisa también la carpeta de spam.' });
    } else setMessage({ tone: 'error', text: res.error });
  };

  return (
    <AuthShell back={false}>
      <View style={styles.icon}>
        <Icon name="mail" size={34} color={colors.neon} />
      </View>
      <T.H1 style={{ marginTop: space.xl }}>CONFIRMA TU EMAIL</T.H1>
      <T.Body style={{ marginTop: space.md, color: colors.muted }}>
        Te hemos enviado un enlace a <T.Body style={{ color: colors.white }}>{email}</T.Body>. Ábrelo para activar tu cuenta y vuelve aquí para iniciar sesión.
      </T.Body>

      {message && (
        <View style={{ marginTop: space.lg }}>
          <Notice tone={message.tone} text={message.text} />
        </View>
      )}

      <Button title="YA LO HE CONFIRMADO" onPress={() => router.replace({ pathname: '/login', params: { email } })} style={{ marginTop: space.xxl }} />
      <Button
        title={wait > 0 ? `Reenviar email (${wait} s)` : 'Reenviar email'}
        variant="ghost"
        onPress={resend}
        disabled={wait > 0}
        loading={busy}
      />
      <Button title="Usar otro email" variant="ghost" onPress={() => router.replace('/register')} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  icon: { width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(183,255,54,0.1)', alignItems: 'center', justifyContent: 'center' },
});
