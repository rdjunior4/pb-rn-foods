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
const heroMobileImg = "/hero-mobile.png";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [document, setDocument] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("cnpj");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    setConfirmPassword("");
    setDocument("");
    setError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
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
    setSuccessMessage("");
    setLoading(true);

    try {
      if (tab === "register") {
        const raw = document.replace(/\D/g, "");
        if (!name.trim()) { setError("Informe seu nome"); return; }
        if (!email.trim()) { setError("Informe seu e-mail"); return; }
        if (!password) { setError("Informe uma senha"); return; }
        if (password.length < 4) { setError("A senha deve ter pelo menos 4 caracteres"); return; }
        if (password !== confirmPassword) { setError("As senhas não conferem"); return; }
        if (!raw) { setError("Informe seu CPF ou CNPJ"); return; }
        if (!validateDocument(raw, documentType)) {
          setError(documentType === "cnpj" ? "CNPJ inválido. Verifique os dígitos." : "CPF inválido. Verifique os dígitos.");
          return;
        }
        const result = await register(name, email, password, raw, documentType);
        if (!result.ok) { setError(result.error || "Erro ao criar conta."); return; }
        if (result.needsEmailConfirmation) {
          setSuccessMessage("Conta criada! Verifique seu e-mail (incluindo o spam) e clique no link de confirmação para ativar sua conta.");
          setTab("login");
          return;
        }
        reset();
        onClose();
      } else {
        if (!email.trim()) { setError("Informe seu e-mail"); return; }
        if (!password) { setError("Informe sua senha"); return; }
        try {
          if (!(await login(email, password))) {
            setError("E-mail ou senha inválidos. Se o problema persistir, aguarde 15 minutos.");
            return;
          }
        } catch (err: any) {
          if (err?.message === "EMAIL_NOT_CONFIRMED") {
            setSuccessMessage("Sua conta ainda não foi confirmada. Verifique seu e-mail (incluindo o spam) e clique no link de confirmação.");
            return;
          }
          if (err?.message === "RATE_LIMIT") {
            setError("Muitas tentativas de login. Aguarde alguns minutos e tente novamente.");
            return;
          }
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
        className="w-full max-w-[900px] max-h-[90vh] bg-card shadow-2xl outline outline-border/40 outline-1 flex flex-col lg:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left panel - desktop branding */}
        <div className="relative hidden lg:block lg:w-[40%] bg-white shrink-0 overflow-hidden">
          <img
            src={heroDesktopImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover scale-[1.03]"
          />
        </div>

        {/* Top banner - mobile branding */}
        <div className="relative lg:hidden shrink-0 h-[90px] sm:h-[130px] overflow-hidden">
          <img
            src={heroMobileImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          />
        </div>

        {/* Right panel - form */}
        <div className="flex-1 relative overflow-y-auto overflow-x-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
            <div className="w-full max-w-sm mx-auto">
            <div className="mb-8 text-left">
              <div className="flex items-center gap-4 mb-3">
                <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  {tab === "register" ? (
                    <UserPlus className="h-6 w-6" />
                  ) : (
                    <LogIn className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                    {tab === "register" ? "Criar conta" : "Entrar"}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {tab === "register" ? "Preencha seus dados para começar" : "Acesse sua conta para continuar"}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "register" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-12 rounded-lg border border-border/60 bg-background text-foreground text-foreground pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                        placeholder="Seu nome completo"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CPF / CNPJ</label>
                    <div className="relative">
                      <DocIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                      <input
                        type="text"
                        value={document}
                        onChange={(e) => handleDocChange(e.target.value)}
                        className="w-full h-12 rounded-lg border border-border/60 bg-background text-foreground pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
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
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 rounded-lg border border-border/60 bg-background text-foreground pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 rounded-lg border border-border/60 bg-background text-foreground pl-10 pr-12 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {tab === "register" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-12 rounded-lg border border-border/60 bg-background text-foreground pl-10 pr-12 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                      placeholder="********"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2.5 text-sm text-destructive bg-destructive/5 border border-destructive/15 rounded-lg px-4 py-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                  <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

              {tab === "login" && (
                <button
                  type="button"
                  onClick={() => setShowReset(true)}
                  className="w-full text-center text-xs font-medium text-muted-foreground hover:text-primary transition-colors mt-2"
                >
                  Esqueci minha senha
                </button>
              )}

              {tab === "login" && (
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="w-full h-11 rounded-lg border border-border/60 text-sm font-semibold text-foreground hover:bg-muted/50 transition-all inline-flex items-center justify-center gap-2 mt-3"
                >
                  Criar conta
                </button>
              )}

              {tab === "register" && (
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="w-full h-11 rounded-lg border border-border/60 text-sm font-semibold text-foreground hover:bg-muted/50 transition-all inline-flex items-center justify-center gap-2 mt-3"
                >
                  Entrar na conta
                </button>
              )}
            </form>
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
            className="w-full max-w-sm bg-card border border-border/40 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold tracking-tight">
                  {resetStep === "email" && "Recuperar senha"}
                  {resetStep === "code" && "Redefinir senha"}
                  {resetStep === "done" && "Pronto!"}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {resetStep === "email" && "Digite seu e-mail cadastrado"}
                  {resetStep === "code" && "Insira o código e a nova senha"}
                  {resetStep === "done" && "Senha redefinida"}
                </p>
              </div>
            </div>

            {resetStep === "email" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">E-mail</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full h-12 rounded-lg border border-border/60 bg-background text-foreground px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowReset(false)}
                    className="flex-1 h-12 rounded-lg bg-muted text-sm font-semibold text-foreground hover:bg-muted/80 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRequestReset}
                    className="flex-1 h-12 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 transition-all"
                  >
                    Enviar código
                  </button>
                </div>
              </div>
            )}

            {resetStep === "code" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full h-12 rounded-lg border border-border/60 bg-background text-foreground px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40 text-center text-lg tracking-[0.3em] font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nova senha</label>
                  <input
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="********"
                    className="w-full h-12 rounded-lg border border-border/60 bg-background text-foreground px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setResetStep("email")}
                    className="flex-1 h-12 rounded-lg bg-muted text-sm font-semibold text-foreground hover:bg-muted/80 transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleConfirmReset}
                    className="flex-1 h-12 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 transition-all"
                  >
                    Redefinir
                  </button>
                </div>
              </div>
            )}

            {resetStep === "done" && (
              <div className="text-center py-6">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <p className="text-sm font-semibold">Senha redefinida com sucesso!</p>
                <p className="text-xs text-muted-foreground mt-1">Redirecionando para o login...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
