import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { formatCPF, formatCNPJ, type DocumentType } from "./format";
import { setUserContext } from "./sentry";

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
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, document: string, documentType: DocumentType) => { ok: boolean; error?: string };
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
  validateDocument: (doc: string, type: DocumentType) => boolean;
  formatDocument: (doc: string, type: DocumentType) => string;
  requestPasswordReset: (email: string) => { ok: boolean; error?: string };
  resetPassword: (email: string, code: string, newPassword: string) => { ok: boolean; error?: string };
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

function claimGuestOrders(email: string, userId: string, userName: string) {
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
    if (changed) {
      localStorage.setItem("@pbrn-orders", JSON.stringify(orders));
    }
  } catch {}
}

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
  "rosenildomoney@gmail.com": {
    id: "usr_1",
    name: "Rosenildo Money",
    email: "rosenildomoney@gmail.com",
    password: "33milhoes",
    document: "11222333444455",
    documentType: "cnpj",
    phone: "(83) 99999-9999",
    role: "admin",
    createdAt: "2024-01-15T08:00:00.000Z",
  },
};

function loadAllUsers(): Record<string, StoredUser> {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    const registered: Record<string, StoredUser> = stored ? JSON.parse(stored) : {};
    return { ...BUILTIN_USERS, ...registered };
  } catch {
    return { ...BUILTIN_USERS };
  }
}

function saveRegisteredUsers(registered: Record<string, StoredUser>) {
  const builtinEmails = new Set(Object.keys(BUILTIN_USERS));
  const filtered: Record<string, StoredUser> = {};
  for (const [email, user] of Object.entries(registered)) {
    if (!builtinEmails.has(email)) {
      filtered[email] = user;
    }
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(filtered));
}

function storedToAuth(stored: StoredUser): AuthUser {
  const { password: _, ...user } = stored;
  return user;
}

function loadCurrentUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadCurrentUser);

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      setUserContext({ id: user.id, email: user.email, name: user.name });
    } else {
      localStorage.removeItem(AUTH_KEY);
      setUserContext(null);
    }
  }, [user]);

  const login = useCallback((email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    if (!cleanEmail || !cleanPass) return false;
    const allUsers = loadAllUsers();
    const match = allUsers[cleanEmail];
    if (match && match.password === cleanPass) {
      const authUser = storedToAuth(match);
      setUser(authUser);
      claimGuestOrders(cleanEmail, authUser.id, authUser.name);
      return true;
    }
    return false;
  }, []);

  const register = useCallback(
    (name: string, email: string, password: string, document: string, documentType: DocumentType) => {
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
      const allUsers = loadAllUsers();
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
      saveRegisteredUsers(allUsers);
      setUser(storedToAuth(newUser));
      return { ok: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      const allUsers = loadAllUsers();
      const key = prev.email.toLowerCase();
      if (allUsers[key]) {
        allUsers[key] = { ...allUsers[key], ...data };
        saveRegisteredUsers(allUsers);
      }
      return updated;
    });
  }, []);

  const validateDocument = useCallback((doc: string, type: DocumentType) => {
    return type === "cpf" ? validateCPF(doc) : validateCNPJ(doc);
  }, []);

  const formatDocument = useCallback((doc: string, type: DocumentType) => {
    return type === "cpf" ? formatCPF(doc) : formatCNPJ(doc);
  }, []);

  const requestPasswordReset = useCallback((email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return { ok: false, error: "Informe seu e-mail." };
    const allUsers = loadAllUsers();
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
  }, []);

  const resetPassword = useCallback((email: string, code: string, newPassword: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!newPassword || newPassword.length < 4) {
      return { ok: false, error: "A senha deve ter pelo menos 4 caracteres." };
    }
    try {
      const resets: Record<string, string> = JSON.parse(localStorage.getItem(RESET_KEY) || "{}");
      if (resets[cleanEmail] !== code.trim()) {
        return { ok: false, error: "Código de verificação inválido." };
      }
      const allUsers = loadAllUsers();
      const user = allUsers[cleanEmail];
      if (!user) {
        return { ok: false, error: "Usuário não encontrado." };
      }
      user.password = newPassword.trim();
      allUsers[cleanEmail] = user;
      saveRegisteredUsers(allUsers);
      delete resets[cleanEmail];
      localStorage.setItem(RESET_KEY, JSON.stringify(resets));
      return { ok: true };
    } catch {
      return { ok: false, error: "Erro ao redefinir senha." };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, isAdmin: user?.role === "admin", login, register, logout, updateUser, validateDocument, formatDocument, requestPasswordReset, resetPassword }}
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