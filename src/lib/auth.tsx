import type { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SITE_URL } from '@/config/app';
import { supabase } from './supabase';

/**
 * Cuenta de usuario (opcional). Sin cuenta la app funciona igual y guarda todo en el teléfono.
 * Con cuenta, los datos se sincronizan y la suscripción queda ligada al usuario.
 */

type Result = { ok: true; needsConfirmation?: boolean } | { ok: false; error: string };

type Ctx = {
  available: boolean;
  ready: boolean;
  user: User | null;
  signUp: (email: string, password: string) => Promise<Result>;
  signIn: (email: string, password: string) => Promise<Result>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<Result>;
  updatePassword: (password: string) => Promise<Result>;
  deleteAccount: () => Promise<Result>;
};

const AuthContext = createContext<Ctx | null>(null);

// Mensajes de Supabase traducidos a algo que el usuario entienda y sepa resolver.
function friendly(message?: string): string {
  const m = (message ?? '').toLowerCase();
  if (m.includes('invalid login')) return 'El email o la contraseña no son correctos.';
  if (m.includes('email not confirmed')) return 'Confirma tu email con el enlace que te enviamos y vuelve a intentarlo.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ya hay una cuenta con ese email. Inicia sesión.';
  if (m.includes('password') && m.includes('characters')) return 'La contraseña debe tener al menos 8 caracteres.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera unos minutos.';
  if (m.includes('network') || m.includes('fetch')) return 'Sin conexión. Comprueba tu internet.';
  return 'No se pudo completar. Inténtalo de nuevo.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<Ctx>(() => {
    const off = async (): Promise<Result> => ({ ok: false, error: 'Las cuentas no están disponibles todavía.' });
    if (!supabase) {
      return { available: false, ready: true, user: null, signUp: off, signIn: off, signOut: async () => {}, sendPasswordReset: off, updatePassword: off, deleteAccount: off };
    }
    return {
      available: true,
      ready,
      user: session?.user ?? null,
      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${SITE_URL}/cuenta-confirmada` },
        });
        if (error) return { ok: false, error: friendly(error.message) };
        return { ok: true, needsConfirmation: !data.session };
      },
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return error ? { ok: false, error: friendly(error.message) } : { ok: true };
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
      sendPasswordReset: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${SITE_URL}/nueva-contrasena` });
        return error ? { ok: false, error: friendly(error.message) } : { ok: true };
      },
      updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        return error ? { ok: false, error: friendly(error.message) } : { ok: true };
      },
      deleteAccount: async () => {
        // El borrado lo hace el servidor: la app no tiene permisos para eliminar usuarios.
        const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
        if (error) return { ok: false, error: 'No se pudo eliminar la cuenta. Inténtalo de nuevo o escríbenos.' };
        await supabase.auth.signOut();
        return { ok: true };
      },
    };
  }, [session, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
