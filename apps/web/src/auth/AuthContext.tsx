import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  /** All auth ops return an error message, or null on success. One convention. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  /** True when the user arrived via a password-reset link. */
  recovery: boolean;
  clearRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = {
    session,
    loading,

    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    },

    async signUp(name, email, password) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } } // handle_new_user trigger reads this
      });
      return error ? error.message : null;
    },

    async resetPassword(email) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`
      });
      return error ? error.message : null;
    },

    async updatePassword(password) {
      const { error } = await supabase.auth.updateUser({ password });
      return error ? error.message : null;
    },

    async signOut() {
      await supabase.auth.signOut();
    },

    recovery,
    clearRecovery: () => setRecovery(false)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
