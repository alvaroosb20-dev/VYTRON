import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Linking, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthShell, Checkbox, Input, LinkText, Notice, PasswordInput } from '@/components/authUI';
import { Icon } from '@/components/Icon';
import { Button, T } from '@/components/ui';
import { LEGAL } from '@/config/app';
import { emailValid, PASSWORD_RULES, passwordValid, useAuth } from '@/lib/auth';
import { colors, fonts, space } from '@/theme/tokens';

type Errors = Partial<Record<'name' | 'email' | 'password' | 'confirm' | 'terms' | 'cloud', string>>;

export default function Register() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);
  const [cloud, setCloud] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<{ text: string; duplicate?: boolean }>();
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const validate = () => {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = 'Escribe tu nombre.';
    if (!email.trim()) e.email = 'Escribe tu email.';
    else if (!emailValid(email)) e.email = 'Este email no parece válido.';
    if (!passwordValid(password)) e.password = 'La contraseña no cumple los requisitos.';
    if (!confirm) e.confirm = 'Repite la contraseña.';
    else if (confirm !== password) e.confirm = 'Las contraseñas no coinciden.';
    if (!terms) e.terms = 'required';
    if (!cloud) e.cloud = 'required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clear = (k: keyof Errors) => errors[k] && setErrors({ ...errors, [k]: undefined });

  const submit = async () => {
    if (busy) return;
    setMessage(undefined);
    if (!validate()) {
      if (!terms || !cloud) setMessage({ text: 'Para crear la cuenta tienes que aceptar las dos casillas.' });
      return;
    }
    setBusy(true);
    const res = await signUp(name, email, password);
    setBusy(false);
    if (!res.ok) return setMessage({ text: res.error, duplicate: res.code === 'duplicate' });
    // Si hay que confirmar el email, se explica; si no, la sesión ya está abierta y la app
    // lleva sola a la configuración del perfil fitness.
    if (res.needsConfirmation) router.replace({ pathname: '/verify-email', params: { email: email.trim().toLowerCase() } });
  };

  return (
    <AuthShell>
      <T.H1>CREA TU CUENTA</T.H1>
      <T.Small style={{ marginTop: 4 }}>Guarda tu progreso y úsalo en todos tus dispositivos.</T.Small>

      <View style={{ gap: space.lg, marginTop: space.xl }}>
        <Input
          label="NOMBRE"
          value={name}
          onChangeText={(v) => { setName(v); clear('name'); }}
          error={errors.name}
          placeholder="Tu nombre"
          autoComplete="name"
          textContentType="givenName"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          maxLength={50}
          editable={!busy}
        />
        <Input
          ref={emailRef}
          label="EMAIL"
          value={email}
          onChangeText={(v) => { setEmail(v); clear('email'); }}
          error={errors.email}
          placeholder="tu@email.com"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passRef.current?.focus()}
          editable={!busy}
        />
        <View style={{ gap: space.sm }}>
          <PasswordInput
            ref={passRef}
            label="CONTRASEÑA"
            value={password}
            onChangeText={(v) => { setPassword(v); clear('password'); }}
            error={errors.password}
            autoComplete="new-password"
            textContentType="newPassword"
            passwordRules="minlength: 8; required: lower; required: digit;"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            editable={!busy}
          />
          <View style={styles.rules}>
            {PASSWORD_RULES.map((r) => {
              const ok = r.test(password);
              return (
                <View key={r.id} style={styles.rule}>
                  <Icon name={ok ? 'check' : 'close'} size={14} color={ok ? colors.neon : colors.muted} />
                  <Text style={[styles.ruleText, ok && { color: colors.white }]}>{r.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
        <PasswordInput
          ref={confirmRef}
          label="REPITE LA CONTRASEÑA"
          value={confirm}
          onChangeText={(v) => { setConfirm(v); clear('confirm'); }}
          error={errors.confirm}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
          editable={!busy}
        />
      </View>

      <View style={{ gap: space.lg, marginTop: space.xl }}>
        <Checkbox checked={terms} onChange={(v) => { setTerms(v); clear('terms'); }} error={!!errors.terms}>
          <Text style={styles.checkText}>
            Acepto los{' '}
            <Text style={styles.inline} onPress={() => Linking.openURL(LEGAL.terms)}>Términos y condiciones</Text>
            {' '}y he leído la{' '}
            <Text style={styles.inline} onPress={() => Linking.openURL(LEGAL.privacy)}>Política de privacidad</Text>.
          </Text>
        </Checkbox>
        <Checkbox checked={cloud} onChange={(v) => { setCloud(v); clear('cloud'); }} error={!!errors.cloud}>
          <Text style={styles.checkText}>
            Consiento que VYTRON guarde en la nube mis entrenamientos, mis datos corporales y mi diario de comidas para sincronizarlos. Puedo retirar este permiso borrando mi cuenta.
          </Text>
        </Checkbox>
      </View>

      {message && (
        <View style={{ marginTop: space.lg }}>
          <Notice
            tone="error"
            text={message.text}
            action={message.duplicate ? 'Ir a iniciar sesión' : undefined}
            onAction={() => router.replace({ pathname: '/login', params: { email } })}
          />
        </View>
      )}

      <Button title="CREAR CUENTA" onPress={submit} loading={busy} style={{ marginTop: space.xl }} />

      <T.Small style={{ marginTop: space.xl, textAlign: 'center' }}>
        ¿Ya tienes cuenta? <LinkText onPress={() => router.replace('/login')}>Inicia sesión</LinkText>
      </T.Small>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  rules: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ruleText: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  checkText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.muted },
  inline: { color: colors.white, textDecorationLine: 'underline' },
});
