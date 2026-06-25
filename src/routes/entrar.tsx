import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Store,
  Package,
  Truck,
  ShieldCheck,
  FileText,
  Building2,
  UserCircle,
  CreditCard,
  CheckCircle,
  XCircle,
  KeyRound,
} from "lucide-react";
import { useAuth, type DocumentType } from "@/lib/auth-context";
import { formatDoc } from "@/lib/format";
import { CustomerLayout } from "@/components/CustomerLayout";
import { toast } from "sonner";

export const Route = createFileRoute("/entrar")({
  component: LoginPage,
});

const docLabels: Record<
  DocumentType,
  { label: string; placeholder: string; icon: typeof FileText }
> = {
  cpf: { label: "CPF", placeholder: "000.000.000-00", icon: UserCircle },
  cnpj: { label: "CNPJ", placeholder: "00.000.000/0000-00", icon: Building2 },
};

function LoginPage() {
  const search = useSearch({ strict: false }) as { tab?: string };
  const tab = search.tab || "";
  const { login, register, isLoggedIn, validateDocument, requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(tab === "cadastro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [document, setDocument] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("cnpj");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "code" | "done">("email");

  useEffect(() => {
    if (tab) setIsRegister(tab === "cadastro");
  }, [tab]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const raw = document.replace(/\D/g, "");
        if (!name.trim()) {
          setError("Informe seu nome");
          return;
        }
        if (!email.trim()) {
          setError("Informe seu e-mail");
          return;
        }
        if (!password) {
          setError("Informe uma senha");
          return;
        }
        if (password.length < 4) {
          setError("A senha deve ter pelo menos 4 caracteres");
          return;
        }
        if (!raw) {
          setError("Informe seu CPF ou CNPJ");
          return;
        }
        if (!validateDocument(raw, documentType)) {
          setError(
            documentType === "cnpj"
              ? "CNPJ inválido. Verifique os dígitos."
              : "CPF inválido. Verifique os dígitos.",
          );
          return;
        }
        const result = await register(name, email, password, raw, documentType);
        if (!result.ok) {
          setError(result.error || "Erro ao criar conta.");
          return;
        }
      } else {
        if (!email.trim()) {
          setError("Informe seu e-mail");
          return;
        }
        if (!password) {
          setError("Informe sua senha");
          return;
        }
        if (!(await login(email, password))) {
          setError("E-mail ou senha inválidos");
          return;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async () => {
    if (!resetEmail.trim()) {
      toast.error("Informe seu e-mail.");
      return;
    }
    const result = await requestPasswordReset(resetEmail);
    if (!result.ok) {
      toast.error(result.error || "Erro ao solicitar recuperação.");
      return;
    }
    toast.success("Código enviado! Verifique seu e-mail.");
    setResetStep("code");
  };

  const handleConfirmReset = async () => {
    if (!resetCode.trim() || !resetNewPassword.trim()) {
      toast.error("Preencha o código e a nova senha.");
      return;
    }
    if (resetNewPassword.length < 4) {
      toast.error("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    const result = await resetPassword(resetEmail, resetCode, resetNewPassword);
    if (!result.ok) {
      toast.error(result.error || "Erro ao redefinir senha.");
      return;
    }
    toast.success("Senha redefinida com sucesso! Faça login.");
    setResetStep("done");
    setTimeout(() => {
      setShowReset(false);
      setResetStep("email");
      setResetEmail("");
      setResetCode("");
      setResetNewPassword("");
      setEmail(resetEmail);
    }, 1500);
  };

  const DocIcon = docLabels[documentType].icon;

  return (
    <CustomerLayout variant="gradient">
      <div className="flex flex-col lg:flex-row rounded-3xl border border-border/40 bg-card shadow-xl shadow-primary/5 overflow-hidden">
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
                {isRegister ? (
                  <UserPlus className="h-6 w-6 text-primary" />
                ) : (
                  <LogIn className="h-6 w-6 text-primary" />
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isRegister ? "Cadastro" : "Login"}
              </h1>
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
                        className="w-full h-12 rounded border border-border/40 bg-background pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
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
                        className="w-full h-12 rounded border border-border/40 bg-background pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
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
                    className="w-full h-12 rounded border border-border/40 bg-background pl-10 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
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
                    className="w-full h-12 rounded border border-border/40 bg-background pl-10 pr-10 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
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
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-xs text-primary hover:text-primary-hover transition-colors mt-1"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {isRegister ? "Criar conta" : "Entrar"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {isRegister ? "Já tem uma conta?" : "Não tem conta?"}{" "}
                <button
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError("");
                    setShowPassword(false);
                    setDocument("");
                    setName("");
                    setEmail("");
                    setPassword("");
                  }}
                  className="text-primary font-semibold hover:text-primary-hover transition-colors"
                >
                  {isRegister ? "Fazer login" : "Cadastre-se"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {showReset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowReset(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card border border-border/40 shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Recuperar senha</h3>
                <p className="text-xs text-muted-foreground">
                  {resetStep === "email" && "Digite seu e-mail cadastrado"}
                  {resetStep === "code" && "Insira o código e a nova senha"}
                  {resetStep === "done" && "Senha redefinida!"}
                </p>
              </div>
            </div>

            {resetStep === "email" && (
              <div className="space-y-4">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full h-11 rounded-xl border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowReset(false)}
                    className="flex-1 h-11 rounded-xl border border-border/40 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRequestReset}
                    className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
                  >
                    Enviar código
                  </button>
                </div>
              </div>
            )}

            {resetStep === "code" && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="Código de 6 dígitos"
                  maxLength={6}
                  className="w-full h-11 rounded-xl border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-center text-lg tracking-widest"
                />
                <input
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full h-11 rounded-xl border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setResetStep("email")}
                    className="flex-1 h-11 rounded-xl border border-border/40 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmReset}
                    className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
                  >
                    Redefinir senha
                  </button>
                </div>
              </div>
            )}

            {resetStep === "done" && (
              <div className="text-center py-4">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-medium">Senha redefinida com sucesso!</p>
                <p className="text-xs text-muted-foreground mt-1">Redirecionando para o login...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
