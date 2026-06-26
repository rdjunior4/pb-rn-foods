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
  X,
  KeyRound,
  CheckCircle,
  XCircle,
  Building2,
  UserCircle,
  FileText,
} from "lucide-react";
import { useAuth, type DocumentType } from "@/lib/auth-context";
import { formatDoc } from "@/lib/format";
import { toast } from "sonner";
const heroDesktopImg = "/hero-desktop.png";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialTab?: "login" | "register";
}

const docLabels: Record<
  DocumentType,
  { label: string; placeholder: string; icon: typeof FileText }
> = {
  cpf: { label: "CPF", placeholder: "000.000.000-00", icon: UserCircle },
  cnpj: { label: "CNPJ", placeholder: "00.000.000/0000-00", icon: Building2 },
};

export function AuthModal({ open, onClose, initialTab = "login" }: AuthModalProps) {
  const { login, register, isLoggedIn, validateDocument, requestPasswordReset, resetPassword } =
    useAuth();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
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
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isLoggedIn && open) {
      onClose();
    }
  }, [isLoggedIn, open, onClose]);

  useEffect(() => {
    if (open) {
      setError("");
      setShowPassword(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const doc = window.document;
      const prev = doc.body.style.overflow;
      doc.body.style.overflow = "hidden";
      return () => {
        doc.body.style.overflow = prev;
      };
    }
  }, [open]);

  const reset = useCallback(() => {
    setName("");
    setEmail("");
    setPassword("");
    setDocument("");
    setError("");
    setShowPassword(false);
    setShowReset(false);
    setResetStep("email");
    setResetEmail("");
    setResetCode("");
    setResetNewPassword("");
  }, []);

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
      if (tab === "register") {
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
        const result = await register(name, email, password, raw, documentType);
        if (!result.ok) { setError(result.error || "Erro ao criar conta."); return; }
        reset();
        onClose();
      } else {
        if (!email.trim()) { setError("Informe seu e-mail"); return; }
        if (!password) { setError("Informe sua senha"); return; }
        if (!(await login(email, password))) {
          setError("E-mail ou senha inválidos. Se o problema persistir, aguarde 15 minutos.");
          return;
        }
        reset();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async () => {
    if (!resetEmail.trim()) { toast.error("Informe seu e-mail."); return; }
    const result = await requestPasswordReset(resetEmail);
    if (!result.ok) { toast.error(result.error || "Erro ao solicitar recuperação."); return; }
    toast.success("Código enviado! Verifique seu e-mail.");
    setResetStep("code");
  };

  const handleConfirmReset = async () => {
    if (!resetCode.trim() || !resetNewPassword.trim()) { toast.error("Preencha o código e a nova senha."); return; }
    if (resetNewPassword.length < 4) { toast.error("A senha deve ter pelo menos 4 caracteres."); return; }
    const result = await resetPassword(resetEmail, resetCode, resetNewPassword);
    if (!result.ok) { toast.error(result.error || "Erro ao redefinir senha."); return; }
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

  const switchTab = (newTab: "login" | "register") => {
    setTab(newTab);
    setError("");
    reset();
  };

  if (!open) return null;

  const DocIcon = docLabels[documentType].icon;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-[900px] max-h-[90vh] overflow-y-auto bg-card shadow-2xl border border-border/40 flex flex-col lg:flex-row animate-in fade-in zoom-in-95 duration-200 rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left panel - branding */}
        <div className="relative lg:w-[40%] bg-brand-black shrink-0 overflow-hidden min-h-[180px] lg:min-h-0 lg:self-stretch">
          <img
            src={heroDesktopImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Right panel - form */}
        <div className="flex-1 p-6 sm:p-8 lg:p-10 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 mb-4 ring-1 ring-primary/10">
                {tab === "register" ? (
                  <UserPlus className="h-5 w-5 text-primary" />
                ) : (
                  <LogIn className="h-5 w-5 text-primary" />
                )}
              </div>
              <h1 className="text-xl font-bold tracking-tight">
                {tab === "register" ? "Cadastro" : "Login"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {tab === "register" ? "Preencha seus dados para começar" : "Digite seus dados de acesso"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {tab === "register" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">Nome completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-11 rounded-lg border border-border/40 bg-background pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">CPF / CNPJ</label>
                    <div className="relative">
                      <DocIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={document}
                        onChange={(e) => handleDocChange(e.target.value)}
                        className="w-full h-11 rounded-lg border border-border/40 bg-background pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                        placeholder={docLabels[documentType].placeholder}
                      />
                    </div>
                    {document.replace(/\D/g, "").length >= 11 && (
                      <div className="flex items-center gap-1.5 mt-0.5">
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
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 rounded-lg border border-border/40 bg-background pl-9 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground/80">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 rounded-lg border border-border/40 bg-background pl-9 pr-10 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {tab === "login" && (
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-xs text-primary hover:text-primary-hover transition-colors"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    {tab === "register" ? "Criar conta" : "Entrar"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {tab === "register" ? "Já tem uma conta?" : "Não tem conta?"}{" "}
                <button
                  onClick={() => switchTab(tab === "register" ? "login" : "register")}
                  className="text-primary font-semibold hover:text-primary-hover transition-colors"
                >
                  {tab === "register" ? "Fazer login" : "Cadastre-se"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot password modal */}
      {showReset && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowReset(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card border border-border/40 shadow-2xl p-6"
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
    </div>
  );
}
