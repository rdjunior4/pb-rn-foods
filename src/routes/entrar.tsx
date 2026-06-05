import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import {
  LogIn, UserPlus, Mail, Lock, User, Eye, EyeOff, ArrowRight,
  Store, Package, Truck, ShieldCheck, FileText, Building2, UserCircle,
  CreditCard, CheckCircle, XCircle,
} from "lucide-react";
import { useAuth, type DocumentType } from "@/lib/auth-context";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/entrar")({
  component: LoginPage,
});

const docLabels: Record<DocumentType, { label: string; placeholder: string; icon: typeof FileText }> = {
  cpf: { label: "CPF", placeholder: "000.000.000-00", icon: UserCircle },
  cnpj: { label: "CNPJ", placeholder: "00.000.000/0000-00", icon: Building2 },
};

function formatDoc(value: string, type: DocumentType): string {
  const d = value.replace(/\D/g, "");
  if (type === "cpf") {
    return d.slice(0, 11)
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  }
  return d.slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
}

function LoginPage() {
  const { login, register, isLoggedIn, validateDocument } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [document, setDocument] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("cnpj");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      navigate({ to: "/" });
    }
  }, [isLoggedIn, navigate]);

  const handleDocChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "");
    const type: DocumentType = digits.length <= 11 ? "cpf" : "cnpj";
    setDocumentType(type);
    setDocument(formatDoc(value, type));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      const raw = document.replace(/\D/g, "");
      if (!name.trim()) { setError("Informe seu nome"); return; }
      if (!email.trim()) { setError("Informe seu e-mail"); return; }
      if (!password) { setError("Informe uma senha"); return; }
      if (password.length < 4) { setError("A senha deve ter pelo menos 4 caracteres"); return; }
      if (!raw) { setError("Informe seu CPF ou CNPJ"); return; }
      if (!validateDocument(raw, documentType)) {
        setError(documentType === "cnpj" ? "CNPJ inválido. Verifique os dígitos." : "CPF inválido. Verifique os dígitos.");
        return;
      }
      if (register(name, email, password, raw, documentType)) {
        // redirect handled by useEffect
      } else {
        setError("Erro ao criar conta. Tente novamente.");
      }
    } else {
      if (!email.trim()) { setError("Informe seu e-mail"); return; }
      if (!password) { setError("Informe sua senha"); return; }
      if (login(email, password)) {
        // redirect handled by useEffect
      } else {
        setError("E-mail ou senha inválidos");
      }
    }
  };

  const DocIcon = docLabels[documentType].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/50 via-background to-muted/30">
      <TopBar />
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row rounded-3xl border border-border/60 bg-card shadow-xl shadow-primary/5 overflow-hidden">
          <div className="relative lg:w-[45%] bg-gradient-to-br from-primary via-primary-hover to-primary p-8 sm:p-12 lg:p-14 flex flex-col justify-between min-h-[300px] lg:min-h-[600px]">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/[0.06]" />
              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/[0.04]" />
              <div className="absolute top-1/3 right-1/4 h-2 w-2 rounded-full bg-white/20" />
              <div className="absolute bottom-1/3 left-1/3 h-1.5 w-1.5 rounded-full bg-white/20" />
            </div>

            <div className="relative z-10">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/10 mb-6">
                <Store className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight tracking-tight">
                {isRegister ? "Crie sua conta" : "Bem-vindo de volta"}
              </h2>
              <p className="mt-3 text-white/60 text-sm sm:text-base leading-relaxed max-w-sm">
                {isRegister
                  ? "Cadastre-se com CPF ou CNPJ e tenha acesso a condições especiais para seu negócio."
                  : "Acesse sua conta para continuar comprando no atacado."}
              </p>
            </div>

            <div className="relative z-10 space-y-5 mt-8 lg:mt-0">
              {[
                { icon: Package, text: "Compra no atacado com preços especiais" },
                { icon: Truck, text: "Entrega em toda região Nordeste" },
                { icon: ShieldCheck, text: "Condições exclusivas para CNPJ" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                    <item.icon className="h-4 w-4 text-white" />
                  </span>
                  <span className="text-sm text-white/70">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 p-8 sm:p-12 lg:p-14 flex items-center">
            <div className="w-full max-w-md mx-auto">
              <div className="mb-8">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-5 ring-1 ring-primary/10">
                  {isRegister ? <UserPlus className="h-6 w-6 text-primary" /> : <LogIn className="h-6 w-6 text-primary" />}
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{isRegister ? "Cadastro" : "Login"}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRegister ? "Preencha seus dados para começar" : "Digite seus dados de acesso"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground/80">Nome completo</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full h-12 rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                          placeholder="Seu nome completo"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground/80">CPF / CNPJ</label>
                      <div className="relative">
                        <DocIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          type="text"
                          value={document}
                          onChange={(e) => handleDocChange(e.target.value)}
                          className="w-full h-12 rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                          placeholder={docLabels[documentType].placeholder}
                        />
                      </div>
                      {document.replace(/\D/g, "").length >= 11 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          {validateDocument(document.replace(/\D/g, ""), documentType) ? (
                            <span className="flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle className="h-3 w-3" />
                              {documentType === "cnpj" ? "CNPJ" : "CPF"} válido
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs text-destructive">
                              <XCircle className="h-3 w-3" />
                              {documentType === "cnpj" ? "CNPJ" : "CPF"} inválido
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/80">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground/80">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-12 rounded-xl border border-border bg-background pl-10 pr-10 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 mt-2"
                >
                  {isRegister ? "Criar conta" : "Entrar"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  {isRegister ? "Já tem uma conta?" : "Não tem conta?"}{" "}
                  <button
                    onClick={() => { setIsRegister(!isRegister); setError(""); setShowPassword(false); setDocument(""); }}
                    className="text-primary font-semibold hover:text-primary-hover transition-colors"
                  >
                    {isRegister ? "Fazer login" : "Cadastre-se"}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}