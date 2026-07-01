import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { formatCPF, formatCNPJ, type DocumentType } from "./format";
import { setUserContext } from "./sentry";
import { getSupabase } from "./supabase";
import { checkRateLimit, recordAttempt, resetRateLimit, formatRemainingTime } from "./rate-limit";

export type { DocumentType };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  document: string;
  documentType: DocumentType;
  phone?: string;
  role?: "admin" | "customer";
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, document: string, documentType: DocumentType) => Promise<{ ok: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => Promise<void>;
  validateDocument: (doc: string, type: DocumentType) => boolean;
  formatDocument: (doc: string, type: DocumentType) => string;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  deleteAccount: () => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (factor: number) =>
    Array.from(digits.slice(0, factor - 1)).reduce((s, d, i) => s + parseInt(d) * (factor - i), 0);
  const r1 = (calc(10) * 10) % 11;
  if ((r1 === 10 ? 0 : r1) !== parseInt(digits[9])) return false;
  const r2 = (calc(11) * 10) % 11;
  return (r2 === 10 ? 0 : r2) === parseInt(digits[10]);
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  const calc = (weights: number[]) =>
    weights.reduce((s, w, i) => s + parseInt(digits[i]) * w, 0);
  const r1 = calc([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11;
  if ((r1 < 2 ? 0 : 11 - r1) !== parseInt(digits[12])) return false;
  const r2 = calc([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) % 11;
  return (r2 < 2 ? 0 : 11 - r2) === parseInt(digits[13]);
}

function mapProfileToAuth(p: Record<string, unknown>): AuthUser {
  return {
    id: p.id as string,
    name: (p.name as string) || "",
    email: p.email as string,
    document: (p.document as string) || "",
    documentType: (p.document_type as DocumentType) || "cpf",
    phone: p.phone as string | undefined,
    role: (p.role as "admin" | "customer") || "customer",
    createdAt: (p.created_at as string) || new Date().toISOString(),
  };
}

async function claimGuestOrders(email: string, userId: string) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase
      .from("orders")
      .update({ customer_id: userId })
      .eq("customer_email", email)
      .is("customer_id", null);
  } catch {}
}

// ---- Provider ----

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (user) {
      setUserContext({ id: user.id, email: user.email, name: user.name });
    } else {
      setUserContext(null);
    }
  }, [user]);

  // Supabase: escutar mudanças de sessão
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setUser(mapProfileToAuth(data));
    }
  }

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    if (!cleanEmail || !cleanPass) return false;

    const { allowed, remainingMs } = checkRateLimit("login", cleanEmail);
    if (!allowed) {
      console.warn(`Login bloqueado por rate limit. Tente novamente em ${formatRemainingTime(remainingMs)}`);
      return false;
    }

    const supabase = getSupabase();
    if (!supabase) return false;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    });

    if (error || !data.user) {
      recordAttempt("login", cleanEmail);
      const msg = error?.message?.toLowerCase() ?? "";
      if (msg.includes("rate limit") || msg.includes("too many")) {
        throw new Error("RATE_LIMIT");
      }
      if (error && (msg.includes("email not confirmed") || msg.includes("not confirmed"))) {
        throw new Error("EMAIL_NOT_CONFIRMED");
      }
      return false;
    }

    resetRateLimit("login", cleanEmail);
    await fetchProfile(data.user.id);
    await claimGuestOrders(cleanEmail, data.user.id);
    return true;
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    document: string,
    documentType: DocumentType,
  ): Promise<{ ok: boolean; error?: string; needsEmailConfirmation?: boolean }> => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const cleanDoc = document.replace(/\D/g, "");

    if (!cleanName || !cleanEmail || !cleanPass || !cleanDoc) {
      return { ok: false, error: "Preencha todos os campos." };
    }
    if (cleanPass.length < 4) {
      return { ok: false, error: "A senha deve ter pelo menos 4 caracteres." };
    }

    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: "Erro de conexão." };

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPass,
      options: {
        data: {
          name: cleanName,
          document: cleanDoc,
          document_type: documentType,
          role: "customer",
        },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("rate limit") || msg.includes("too many")) {
        return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
      }
      return { ok: false, error: error.message };
    }
    if (data.session) {
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { ok: true };
    }
    if (data.user && !data.session) {
      return { ok: true, needsEmailConfirmation: true };
    }
    return { ok: true };
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setUser(null);
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
  }, []);

  const updateUser = useCallback(async (data: Partial<AuthUser>): Promise<void> => {
    if (!user) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.document !== undefined) updates.document = data.document;
    if (data.documentType !== undefined) updates.document_type = data.documentType;

    await supabase.from("profiles").update(updates).eq("id", user.id);
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  }, [user]);

  const validateDocument = useCallback((doc: string, type: DocumentType) => {
    return type === "cpf" ? validateCPF(doc) : validateCNPJ(doc);
  }, []);

  const formatDocument = useCallback((doc: string, type: DocumentType) => {
    return type === "cpf" ? formatCPF(doc) : formatCNPJ(doc);
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { ok: false, error: "Informe seu e-mail." };

    const { allowed, remainingMs } = checkRateLimit("reset", cleanEmail);
    if (!allowed) {
      return { ok: false, error: `Muitas tentativas. Aguarde ${formatRemainingTime(remainingMs)}.` };
    }

    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: "Erro de conexão." };

    const { error } = await supabase.rpc("request_password_reset", { p_email: cleanEmail });
    if (error) return { ok: false, error: error.message };
    recordAttempt("reset", cleanEmail);
    return { ok: true };
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!newPassword || newPassword.length < 4) {
      return { ok: false, error: "A senha deve ter pelo menos 4 caracteres." };
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email: cleanEmail, code: code.trim(), newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data.error || "Erro ao redefinir senha." };
      }

      resetRateLimit("reset", cleanEmail);
      return { ok: true };
    } catch {
      return { ok: false, error: "Erro de conexão ao redefinir senha." };
    }
  }, []);

  const deleteAccount = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!user) return { ok: false, error: "Nenhum usuário logado." };

    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: "Erro de conexão." };

    try {
      await supabase.from("product_reviews").delete().eq("user_id", user.id);
      await supabase.from("orders").update({ customer_id: null }).eq("customer_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);
    } catch {
      // Continuar mesmo com erro — o importante é deslogar
    }

    await supabase.auth.signOut();
    setUser(null);
    return { ok: true };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
        updateUser,
        validateDocument,
        formatDocument,
        requestPasswordReset,
        resetPassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
