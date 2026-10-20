import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { APPLE_SIGN_IN_ENABLED, SITE_URL } from '@/config/app';
import { loadApple } from './appleModule';
import { supabase } from './supabase';

/**
 * Sesión de usuario con Supabase Auth.
 *
 * - La sesión (tokens) la guarda Supabase en el almacenamiento de la app y la renueva sola:
 *   no hay que iniciar sesión cada vez que se abre VYTRON.
 * - Las contraseñas nunca pasan por nuestro código salvo para enviarlas cifradas (HTTPS) a Supabase,
 *   que las guarda con hash. En la app no hay claves secretas.
 * - Si la sesión se pierde sin que el usuario la cierre (caducada o revocada), se recuerda el email
 *   para llevarle directamente a «Iniciar sesión» con un aviso.
 */

export type AuthResult =
  | { ok: true; needsConfirmation?: boolean }
  | { ok: false; error: string; code?: 'duplicate' | 'unconfirmed' | 'cancelled' | 'network' };

type Ctx = {
  /** Hay backend configurado. */
  available: boolean;
  /** Se ha comprobado si hay sesión guardada. */
  ready: boolean;
  /** No se pudo comprobar la sesión al arrancar. */
  initError: string | null;
  retryInit: () => void;
  user: User | null;
  displayName: string;
  /** Email de una sesión que caducó: se pide volver a entrar. */
  expiredEmail: string | null;
  clearExpired: () => void;
  appleAvailable: boolean;
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
};

const AuthContext = createContext<Ctx | null>(null);
const LAST_EMAIL = 'vytron.auth.lastEmail';
const INIT_TIMEOUT_MS = 8000;

/** Reglas de contraseña: mínimo 8 caracteres, con letras y números. */
export const PASSWORD_RULES = [
  { id: 'len', label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 },
  { id: 'letter', label: 'Al menos una letra', test: (p: string) => /[A-Za-zÀ-ÿ]/.test(p) },
  { id: 'number', label: 'Al menos un número', test: (p: string) => /\d/.test(p) },
];
export const passwordValid = (p: string) => PASSWORD_RULES.every((r) => r.test(p));
export const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

// Mensajes de Supabase traducidos a algo que el usuario entienda y sepa resolver.
function friendly(message?: string, status?: number): Extract<AuthResult, { ok: false }> {
  const m = (message ?? '').toLowerCase();
  if (m.includes('invalid login') || m.includes('invalid credentials')) return { ok: false, error: 'El email o la contraseña no son correctos.' };
  if (m.includes('email not confirmed')) return { ok: false, error: 'Aún no has confirmado tu email. Abre el enlace que te enviamos.', code: 'unconfirmed' };
  if (m.includes('already registered') || m.includes('already been registered') || m.includes('already exists'))
    return { ok: false, error: 'Ya existe una cuenta con ese email. Inicia sesión.', code: 'duplicate' };
  if (m.includes('weak') || (m.includes('password') && m.includes('characters'))) return { ok: false, error: 'La contraseña es demasiado débil. Usa al menos 8 caracteres con letras y números.' };
  if (m.includes('rate limit') || m.includes('too many') || status === 429) return { ok: false, error: 'Demasiados intentos. Espera unos minutos y vuelve a probar.' };
  if (m.includes('network') || m.includes('fetch') || m.includes('timeout')) return { ok: false, error: 'Sin conexión. Comprueba tu internet y vuelve a intentarlo.', code: 'network' };
  if (m.includes('provider is not enabled')) return { ok: false, error: 'Este método de acceso aún no está activado.' };
  return { ok: false, error: 'No se pudo completar. Inténtalo de nuevo.' };
}

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);
  const [initError, setInitError] = useState<string | null>(null);
  const [expiredEmail, setExpiredEmail] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const explicitSignOut = useRef(false);

  // Comprobación inicial de la sesión guardada (no necesita red).
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    setInitError(null);
    (async () => {
      try {
        const [{ data }, lastEmail] = await withTimeout(
          Promise.all([supabase.auth.getSession(), AsyncStorage.getItem(LAST_EMAIL).catch(() => null)]),
          INIT_TIMEOUT_MS,
        );
        if (!alive) return;
        setSession(data.session);
        if (!data.session && lastEmail) setExpiredEmail(lastEmail);
        setReady(true);
      } catch {
        if (alive) setInitError('No hemos podido comprobar tu sesión.');
      }
    })();
    return () => {
      alive = false;
    };
  }, [attempt]);

  // Cambios de sesión: inicio, renovación, cierre o caducidad.
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user?.email) {
        AsyncStorage.setItem(LAST_EMAIL, s.user.email).catch(() => {});
        setExpiredEmail(null);
      }
      if (event === 'SIGNED_OUT') {
        if (explicitSignOut.current) {
          explicitSignOut.current = false;
          setExpiredEmail(null);
        } else {
          // Se ha perdido la sesión sin que el usuario la cerrase: caducada o revocada.
          AsyncStorage.getItem(LAST_EMAIL).then((e) => e && setExpiredEmail(e)).catch(() => {});
        }
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // «Continuar con Apple»: solo en iPhone, si está activado y el dispositivo lo admite.
  useEffect(() => {
    const mod = APPLE_SIGN_IN_ENABLED ? loadApple() : null;
    if (!mod) return;
    mod.Apple.isAvailableAsync().then(setAppleAvailable).catch(() => {});
  }, []);

  const retryInit = useCallback(() => setAttempt((n) => n + 1), []);
  const clearExpired = useCallback(() => setExpiredEmail(null), []);

  const value = useMemo<Ctx>(() => {
    const off = async (): Promise<AuthResult> => ({ ok: false, error: 'Las cuentas no están disponibles todavía.' });
    const user = session?.user ?? null;
    const displayName = (user?.user_metadata?.name as string | undefined)?.trim() || user?.email?.split('@')[0] || '';
    if (!supabase) {
      return {
        available: false, ready: true, initError: null, retryInit, user: null, displayName: '', expiredEmail: null, clearExpired,
        appleAvailable: false, signUp: off, signIn: off, signInWithApple: off, resendConfirmation: off, signOut: async () => {},
        sendPasswordReset: off, updatePassword: off, deleteAccount: off,
      };
    }
    const sb = supabase;

    return {
      available: true,
      ready,
      initError,
      retryInit,
      user,
      displayName,
      expiredEmail,
      clearExpired,
      appleAvailable,

      signUp: async (name, email, password) => {
        try {
          const { data, error } = await sb.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: { emailRedirectTo: `${SITE_URL}/cuenta-confirmada`, data: { name: name.trim() } },
          });
          if (error) return friendly(error.message, error.status);
          // Con la confirmación por email activada, Supabase no da error si el email ya existe
          // (para no revelar qué emails están registrados): devuelve un usuario sin identidades.
          if (data.user && (data.user.identities?.length ?? 0) === 0) return friendly('already registered');
          return { ok: true, needsConfirmation: !data.session };
        } catch (e: any) {
          return friendly(e?.message);
        }
      },

      signIn: async (email, password) => {
        try {
          const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
          return error ? friendly(error.message, error.status) : { ok: true };
        } catch (e: any) {
          return friendly(e?.message);
        }
      },

      signInWithApple: async () => {
        const mod = loadApple();
        if (!appleAvailable || !mod) return { ok: false, error: 'El acceso con Apple no está disponible en este dispositivo.' };
        try {
          const { Apple, Crypto } = mod;
          // Nonce: Apple firma el hash y Supabase comprueba el original, para evitar reutilizar tokens.
          const rawNonce: string = Crypto.randomUUID();
          const hashedNonce: string = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
          const cred = await Apple.signInAsync({
            requestedScopes: [Apple.AppleAuthenticationScope.FULL_NAME, Apple.AppleAuthenticationScope.EMAIL],
            nonce: hashedNonce,
          });
          if (!cred.identityToken) return { ok: false, error: 'Apple no ha devuelto la identificación. Inténtalo de nuevo.' };
          const { error } = await sb.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken, nonce: rawNonce });
          if (error) return friendly(error.message, error.status);
          // Apple solo da el nombre la primera vez: se guarda en el perfil.
          const name = [cred.fullName?.givenName, cred.fullName?.familyName].filter(Boolean).join(' ');
          if (name) await sb.auth.updateUser({ data: { name } }).catch(() => {});
          return { ok: true };
        } catch (e: any) {
          if (e?.code === 'ERR_REQUEST_CANCELED') return { ok: false, error: '', code: 'cancelled' };
          return friendly(e?.message);
        }
      },

      resendConfirmation: async (email) => {
        try {
          const { error } = await sb.auth.resend({
            type: 'signup',
            email: email.trim().toLowerCase(),
            options: { emailRedirectTo: `${SITE_URL}/cuenta-confirmada` },
          });
          return error ? friendly(error.message, error.status) : { ok: true };
        } catch (e: any) {
          return friendly(e?.message);
        }
      },

      signOut: async () => {
        explicitSignOut.current = true;
        await AsyncStorage.removeItem(LAST_EMAIL).catch(() => {});
        setExpiredEmail(null);
        // 'local': cierra la sesión en este dispositivo aunque no haya conexión.
        await sb.auth.signOut({ scope: 'local' }).catch(() => {});
      },

      sendPasswordReset: async (email) => {
        try {
          const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${SITE_URL}/nueva-contrasena` });
          return error ? friendly(error.message, error.status) : { ok: true };
        } catch (e: any) {
          return friendly(e?.message);
        }
      },

      updatePassword: async (password) => {
        try {
          const { error } = await sb.auth.updateUser({ password });
          return error ? friendly(error.message, error.status) : { ok: true };
        } catch (e: any) {
          return friendly(e?.message);
        }
      },

      deleteAccount: async () => {
        // El borrado lo hace el servidor: la app no tiene permisos para eliminar usuarios.
        const { error } = await sb.functions.invoke('delete-account', { method: 'POST' });
        if (error) return { ok: false, error: 'No se pudo eliminar la cuenta. Inténtalo de nuevo o escríbenos.' };
        explicitSignOut.current = true;
        await AsyncStorage.removeItem(LAST_EMAIL).catch(() => {});
        await sb.auth.signOut({ scope: 'local' }).catch(() => {});
        return { ok: true };
      },
    };
  }, [session, ready, initError, expiredEmail, appleAvailable, retryInit, clearExpired]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
