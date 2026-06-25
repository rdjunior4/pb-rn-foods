import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { formatCPF, formatCNPJ, type DocumentType } from "./format";
import { setUserContext } from "./sentry";
import { getSupabase, isSupabaseConfigured } from "./supabase";

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
  register: (name: string, email: string, password: string, document: string, documentType: DocumentType) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<AuthUser>) => Promise<void>;
  validateDocument: (doc: string, type: DocumentType) => boolean;
  formatDocument: (doc: string, type: DocumentType) => string;
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string; code?: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
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

const AUTH_KEY = "@pbrn-auth";
const USERS_KEY = "@pbrn-users";
const RESET_KEY = "@pbrn-pwreset";
const BUILTIN_EMAIL = "rosenildomoney@gmail.com";

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

// ---- localStorage fallback (quando Supabase não configurado) ----

interface StoredUser {
  id: string;
  name: string;
  email: string;
  password: string;
  document: string;
  documentType: DocumentType;
  phone?: string;
  role?: "admin" | "customer";
  createdAt: string;
}

const BUILTIN_USERS: Record<string, StoredUser> = {
  [BUILTIN_EMAIL]: {
    id: "usr_1",
    name: "Rosenildo Money",
    email: BUILTIN_EMAIL,
    password: "33milhoes",
    document: "11222333444455",
    documentType: "cnpj",
    phone: "(83) 99999-9999",
    role: "admin",
    createdAt: "2024-01-15T08:00:00.000Z",
  },
};

function loadAllUsersLocal(): Record<string, StoredUser> {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    const registered: Record<string, StoredUser> = stored ? JSON.parse(stored) : {};
    return { ...BUILTIN_USERS, ...registered };
  } catch {
    return { ...BUILTIN_USERS };
  }
}

function saveRegisteredUsersLocal(registered: Record<string, StoredUser>) {
  const builtinEmails = new Set(Object.keys(BUILTIN_USERS));
  const filtered: Record<string, StoredUser> = {};
  for (const [email, user] of Object.entries(registered)) {
    if (!builtinEmails.has(email)) filtered[email] = user;
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
}

function storedToAuth(stored: StoredUser): AuthUser {
  const { password: _, ...user } = stored;
  return user;
}

function loadCurrentUserLocal(): AuthUser | null {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function claimGuestOrdersLocal(email: string, userId: string, userName: string) {
  try {
    const ordersRaw = localStorage.getItem("@pbrn-orders");
    if (!ordersRaw) return;
    const orders = JSON.parse(ordersRaw);
    if (!Array.isArray(orders)) return;
    let changed = false;
    for (const order of orders) {
      if (order.customerId === "guest" && order.customerEmail === email) {
        order.customerId = userId;
        order.customerName = userName;
        changed = true;
      }
    }
    if (changed) localStorage.setItem("@pbrn-orders", JSON.stringify(orders));
  } catch {}
}

async function claimGuestOrdersSupabase(email: string, userId: string) {
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
  const [user, setUser] = useState<AuthUser | null>(loadCurrentUserLocal);
  const useSupabase = isSupabaseConfigured();

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      setUserContext({ id: user.id, email: user.email, name: user.name });
    } else {
      localStorage.removeItem(AUTH_KEY);
      setUserContext(null);
    }
  }, [user]);

  // Supabase: escutar mudanças de sessão
  useEffect(() => {
    if (!useSupabase) return;
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
  }, [useSupabase]);

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

    if (useSupabase) {
      const supabase = getSupabase();
      if (!supabase) return false;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });
      if (error || !data.user) return false;
      await fetchProfile(data.user.id);
      await claimGuestOrdersSupabase(cleanEmail, data.user.id);
      return true;
    }

    // Fallback localStorage
    const allUsers = loadAllUsersLocal();
    const match = allUsers[cleanEmail];
    if (match && match.password === cleanPass) {
      const authUser = storedToAuth(match);
      setUser(authUser);
      claimGuestOrdersLocal(cleanEmail, authUser.id, authUser.name);
      return true;
    }
    return false;
  }, [useSupabase]);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    document: string,
    documentType: DocumentType,
  ): Promise<{ ok: boolean; error?: string }> => {
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

    if (useSupabase) {
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
      if (error) return { ok: false, error: error.message };
      if (data.user) {
        await fetchProfile(data.user.id);
      }
      return { ok: true };
    }

    // Fallback localStorage
    const allUsers = loadAllUsersLocal();
    if (allUsers[cleanEmail]) {
      return { ok: false, error: "Este e-mail já está cadastrado." };
    }
    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName,
      email: cleanEmail,
      password: cleanPass,
      document: cleanDoc,
      documentType,
      role: "customer",
      createdAt: new Date().toISOString(),
    };
    allUsers[cleanEmail] = newUser;
    saveRegisteredUsersLocal(allUsers);
    setUser(storedToAuth(newUser));
    return { ok: true };
  }, [useSupabase]);

  const logout = useCallback(async (): Promise<void> => {
    setUser(null);
    if (useSupabase) {
      const supabase = getSupabase();
      if (supabase) await supabase.auth.signOut();
    }
  }, [useSupabase]);

  const updateUser = useCallback(async (data: Partial<AuthUser>): Promise<void> => {
    if (useSupabase && user) {
      const supabase = getSupabase();
      if (supabase) {
        const updates: Record<string, unknown> = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.phone !== undefined) updates.phone = data.phone;
        if (data.document !== undefined) updates.document = data.document;
        if (data.documentType !== undefined) updates.document_type = data.documentType;

        await supabase.from("profiles").update(updates).eq("id", user.id);
        setUser((prev) => (prev ? { ...prev, ...data } : prev));
        return;
      }
    }

    // Fallback localStorage
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      const allUsers = loadAllUsersLocal();
      const key = prev.email.toLowerCase();
      if (allUsers[key]) {
        allUsers[key] = { ...allUsers[key], ...data };
        saveRegisteredUsersLocal(allUsers);
      }
      return updated;
    });
  }, [useSupabase, user]);

  const validateDocument = useCallback((doc: string, type: DocumentType) => {
    return type === "cpf" ? validateCPF(doc) : validateCNPJ(doc);
  }, []);

  const formatDocument = useCallback((doc: string, type: DocumentType) => {
    return type === "cpf" ? formatCPF(doc) : formatCNPJ(doc);
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<{ ok: boolean; error?: string; code?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { ok: false, error: "Informe seu e-mail." };

    if (useSupabase) {
      const supabase = getSupabase();
      if (!supabase) return { ok: false, error: "Erro de conexão." };
      const { error } = await supabase.rpc("request_password_reset", { p_email: cleanEmail });
      if (error) return { ok: false, error: error.message };
      const { data: codes } = await supabase
        .from("password_reset_codes")
        .select("code")
        .eq("email", cleanEmail)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1);
      const code = (codes as Record<string, unknown>[])?.[0]?.code as string | undefined;
      return { ok: true, code };
    }

    // Fallback localStorage
    const allUsers = loadAllUsersLocal();
    if (!allUsers[cleanEmail]) {
      return { ok: false, error: "E-mail não cadastrado." };
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const resets: Record<string, string> = JSON.parse(localStorage.getItem(RESET_KEY) || "{}");
      resets[cleanEmail] = code;
      localStorage.setItem(RESET_KEY, JSON.stringify(resets));
    } catch {
      localStorage.setItem(RESET_KEY, JSON.stringify({ [cleanEmail]: code }));
    }
    return { ok: true, code };
  }, [useSupabase]);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string): Promise<{ ok: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!newPassword || newPassword.length < 4) {
      return { ok: false, error: "A senha deve ter pelo menos 4 caracteres." };
    }

    if (useSupabase) {
      const supabase = getSupabase();
      if (!supabase) return { ok: false, error: "Erro de conexão." };
      const { data: resetData, error: resetError } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", cleanEmail)
        .eq("code", code.trim())
        .eq("used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (resetError || !resetData) {
        return { ok: false, error: "Código de verificação inválido ou expirado." };
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        (resetData as Record<string, unknown>).email as string,
        { password: newPassword },
      );

      if (updateError) {
        return { ok: false, error: "Erro ao redefinir senha." };
      }

      await supabase
        .from("password_reset_codes")
        .update({ used: true })
        .eq("email", cleanEmail)
        .eq("code", code.trim());

      return { ok: true };
    }

    // Fallback localStorage
    try {
      const resets: Record<string, string> = JSON.parse(localStorage.getItem(RESET_KEY) || "{}");
      if (resets[cleanEmail] !== code.trim()) {
        return { ok: false, error: "Código de verificação inválido." };
      }
      const allUsers = loadAllUsersLocal();
      const u = allUsers[cleanEmail];
      if (!u) return { ok: false, error: "Usuário não encontrado." };
      u.password = newPassword.trim();
      allUsers[cleanEmail] = u;
      saveRegisteredUsersLocal(allUsers);
      delete resets[cleanEmail];
      localStorage.setItem(RESET_KEY, JSON.stringify(resets));
      return { ok: true };
    } catch {
      return { ok: false, error: "Erro ao redefinir senha." };
    }
  }, [useSupabase]);

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
