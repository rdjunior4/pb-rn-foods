import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type DocumentType = "cpf" | "cnpj";

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
  register: (name: string, email: string, password: string, document: string, documentType: DocumentType) => boolean;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
  validateDocument: (doc: string, type: DocumentType) => boolean;
  formatDocument: (doc: string, type: DocumentType) => string;
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

function formatCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d.replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function formatCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

const MOCK_USERS: Record<string, { password: string; user: AuthUser }> = {
  "rosenildomoney@gmail.com": {
    password: "33milhoes",
    user: {
      id: "usr_1",
      name: "Rosenildo Money",
      email: "rosenildomoney@gmail.com",
      document: "11222333444455",
      documentType: "cnpj",
      phone: "(83) 99999-9999",
      role: "admin",
      createdAt: "2024-01-15T08:00:00.000Z",
    },
  },
};

const MOCK_USER: AuthUser = {
  id: "1",
  name: "Admin",
  email: "admin@pbrn.com",
  document: "11222333444455",
  documentType: "cnpj",
  phone: "(83) 99999-9999",
  createdAt: new Date().toISOString(),
};

function loadAuth(): AuthUser | null {
  try {
    const stored = localStorage.getItem("@pbrn-auth");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadAuth);

  useEffect(() => {
    if (user) {
      localStorage.setItem("@pbrn-auth", JSON.stringify(user));
    } else {
      localStorage.removeItem("@pbrn-auth");
    }
  }, [user]);

  const login = useCallback((email: string, password: string) => {
    if (!email || !password) return false;
    const match = MOCK_USERS[email.toLowerCase()];
    if (match && match.password === password) {
      setUser(match.user);
      return true;
    }
    if (email && password) {
      setUser({ ...MOCK_USER, email });
      return true;
    }
    return false;
  }, []);

  const register = useCallback(
    (name: string, email: string, password: string, document: string, documentType: DocumentType) => {
      if (name && email && password && document) {
        const raw = document.replace(/\D/g, "");
        setUser({
          id: Date.now().toString(),
          name,
          email,
          document: raw,
          documentType,
          createdAt: new Date().toISOString(),
        });
        return true;
      }
      return false;
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  }, []);

  const validateDocument = useCallback((doc: string, type: DocumentType) => {
    return type === "cpf" ? validateCPF(doc) : validateCNPJ(doc);
  }, []);

  const formatDocument = useCallback((doc: string, type: DocumentType) => {
    return type === "cpf" ? formatCPF(doc) : formatCNPJ(doc);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, isAdmin: user?.role === "admin", login, register, logout, updateUser, validateDocument, formatDocument }}
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