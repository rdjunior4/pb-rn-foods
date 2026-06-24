import { useState } from "react";
import { Send, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function Newsletter() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      const stored: string[] = JSON.parse(localStorage.getItem("@pbrn-newsletter") || "[]");
      if (stored.includes(email.trim().toLowerCase())) {
        toast.error("Este e-mail já está cadastrado!");
        return;
      }
      stored.push(email.trim().toLowerCase());
      localStorage.setItem("@pbrn-newsletter", JSON.stringify(stored));
      toast.success("E-mail cadastrado com sucesso!");
      setEmail("");
    } catch {
      toast.error("Erro ao salvar e-mail. Tente novamente.");
    }
  };

  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] mt-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-black via-primary to-primary-hover px-8 py-14 sm:px-16 sm:py-16 text-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.3),transparent_50%)]" />
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-white/[0.04] blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-white/[0.03] blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/[0.02] blur-2xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
          <div className="absolute top-1/4 left-[15%] h-2 w-2 rounded-full bg-white/20 blur-[1px]" />
          <div className="absolute top-[60%] left-[20%] h-1.5 w-1.5 rounded-full bg-white/15" />
          <div className="absolute top-[30%] right-[18%] h-2.5 w-2.5 rounded-full bg-white/20 blur-[1px]" />
          <div className="absolute top-[70%] right-[25%] h-1 w-1 rounded-full bg-white/15" />
          <div className="absolute top-[20%] right-[40%] h-1 w-1 rounded-full bg-white/10" />
          <div className="absolute bottom-[25%] left-[35%] h-1.5 w-1.5 rounded-full bg-white/10" />
          <div className="absolute top-[45%] left-[8%] h-1 w-1 rounded-full bg-white/20" />
          <div className="absolute top-[55%] right-[8%] h-1.5 w-1.5 rounded-full bg-white/15" />
        </div>

        <div className="relative z-10 mx-auto max-w-xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-md mb-6 ring-1 ring-white/20 shadow-lg shadow-black/10">
            <Mail className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
            Receba ofertas exclusivas
          </h3>
          <p className="mt-3 text-white/80 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
            Cadastre-se e seja o primeiro a saber de promoções, lançamentos e condições especiais para CNPJ.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <div className="relative flex-1 group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 group-focus-within:text-white/80 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                required
                className="w-full h-12 rounded border border-white/20 bg-white/10 pl-11 pr-4 text-sm text-white placeholder:text-white/50 outline-none focus:border-white/40 focus:bg-white/15 focus:ring-2 focus:ring-white/20 transition-all backdrop-blur-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded bg-white text-primary font-semibold px-8 text-sm hover:bg-white/90 hover:shadow-xl hover:shadow-white/10 transition-all active:scale-[0.98] shadow-lg shadow-black/5"
            >
              Cadastrar
              <Send className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-5 text-xs text-white/55 flex items-center justify-center gap-1.5">
            <Sparkles className="h-3 w-3 text-white/60" />
            Ao se cadastrar, você concorda com nossa Política de Privacidade
          </p>
        </div>
      </div>
    </section>
  );
}
