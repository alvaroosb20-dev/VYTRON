import { router } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LEGAL } from '@/config/app';
import { colors, fonts, radius, space } from '@/theme/tokens';
import { Icon } from './Icon';
import { Wordmark } from './Logo';
import { T } from './ui';

/** Contenedor de las pantallas de acceso: teclado, márgenes seguros y botón atrás. */
export function AuthShell({ children, back = true, footer }: { children: React.ReactNode; back?: boolean; footer?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.black }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xl, paddingHorizontal: space.lg }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          {back && router.canGoBack() ? (
            <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Volver" style={styles.back}>
              <View style={{ transform: [{ rotate: '180deg' }] }}>
                <Icon name="chevron" color={colors.white} />
              </View>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Wordmark height={18} />
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}>{children}</View>
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// En React 19 «ref» es una prop normal: se pasa tal cual al TextInput (para saltar de campo con «Siguiente»).
type InputProps = React.ComponentProps<typeof TextInput> & { label: string; error?: string | null; ref?: React.Ref<TextInput> };

/** Campo de texto con etiqueta y error debajo. */
export function Input({ label, error, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <T.Label style={{ fontSize: 11 }}>{label}</T.Label>
      <TextInput
        placeholderTextColor="#6B6B73"
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        style={[styles.input, focused && styles.inputFocus, !!error && styles.inputError, style]}
        accessibilityLabel={label}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

/** Contraseña con botón para mostrarla u ocultarla (oculta por defecto). */
export function PasswordInput({ label, error, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <T.Label style={{ fontSize: 11 }}>{label}</T.Label>
      <View style={[styles.input, styles.passwordRow, focused && styles.inputFocus, !!error && styles.inputError]}>
        <TextInput
          placeholderTextColor="#6B6B73"
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
          secureTextEntry={!visible}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          style={styles.passwordInput}
          accessibilityLabel={label}
        />
        <Pressable
          onPress={() => setVisible(!visible)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={styles.eye}
        >
          <Icon name={visible ? 'eyeOff' : 'eye'} size={20} color={colors.muted} />
        </Pressable>
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export function Checkbox({ checked, onChange, children, error }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; error?: boolean }) {
  return (
    <Pressable onPress={() => onChange(!checked)} style={styles.check} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.box, checked && styles.boxOn, error && !checked && { borderColor: colors.danger }]}>
        {checked && <Icon name="check" size={14} color={colors.neonInk} />}
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}

/** Aviso de error o confirmación, con acción opcional. */
export function Notice({ tone, text, action, onAction }: { tone: 'error' | 'ok' | 'info'; text: string; action?: string; onAction?: () => void }) {
  const color = tone === 'error' ? colors.danger : tone === 'ok' ? colors.neon : colors.muted;
  return (
    <View style={[styles.notice, { borderColor: color }]} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Icon name={tone === 'error' ? 'alert' : tone === 'ok' ? 'check' : 'mail'} size={18} color={color} />
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.noticeText}>{text}</Text>
        {action && (
          <Pressable onPress={onAction} hitSlop={8}>
            <Text style={styles.noticeAction}>{action}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function LinkText({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <Text onPress={onPress} style={styles.link} accessibilityRole="link" suppressHighlighting>
      {children}
    </Text>
  );
}

/** Enlaces a privacidad y términos. */
export function LegalLinks({ prefix }: { prefix?: string }) {
  return (
    <Text style={styles.legal}>
      {prefix ?? 'Al continuar aceptas los '}
      <Text style={styles.legalLink} onPress={() => Linking.openURL(LEGAL.terms)} accessibilityRole="link">Términos y condiciones</Text>
      {' y la '}
      <Text style={styles.legalLink} onPress={() => Linking.openURL(LEGAL.privacy)} accessibilityRole="link">Política de privacidad</Text>
      .
    </Text>
  );
}

export function OrDivider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>o</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xl, minHeight: 40 },
  back: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.graphite, alignItems: 'center', justifyContent: 'center' },
  input: {
    minHeight: 54, borderRadius: radius.md, backgroundColor: colors.graphite, borderWidth: 1, borderColor: colors.line,
    color: colors.white, paddingHorizontal: space.lg, fontFamily: fonts.medium, fontSize: 16,
  },
  inputFocus: { borderColor: colors.neon },
  inputError: { borderColor: colors.danger },
  passwordRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 0 },
  passwordInput: { flex: 1, minHeight: 52, paddingHorizontal: space.lg, color: colors.white, fontFamily: fonts.medium, fontSize: 16 },
  eye: { paddingHorizontal: space.lg, height: 52, justifyContent: 'center' },
  fieldError: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  check: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxOn: { backgroundColor: colors.neon, borderColor: colors.neon },
  notice: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', padding: space.lg, borderRadius: radius.md, borderWidth: 1, backgroundColor: colors.graphite },
  noticeText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.white },
  noticeAction: { fontFamily: fonts.semibold, fontSize: 14, color: colors.neon },
  link: { fontFamily: fonts.semibold, color: colors.neon },
  legal: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: 'center' },
  legalLink: { color: colors.white, textDecorationLine: 'underline' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginVertical: space.sm },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  dividerText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
});
