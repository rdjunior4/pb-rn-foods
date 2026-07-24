import { useState } from "react";
import { Send, Mail, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const supabase = getSupabase();
      if (!supabase) {
        toast.error("Serviço indisponível. Tente novamente.");
        return;
      }
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.code === "23505") {
          toast.error("Este e-mail já está cadastrado!");
        } else {
          toast.error("Erro ao salvar e-mail. Tente novamente.");
        }
        return;
      }
      toast.success("E-mail cadastrado com sucesso!");
      setEmail("");
    } catch {
      toast.error("Erro ao salvar e-mail. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] mt-16">
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.06]" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 px-8 py-12 sm:px-14 sm:py-14">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Fique por dentro das ofertas
            </h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed max-w-md">
              Cadastre seu e-mail e receba em primeira mão promoções, novidades e condições especiais para seu negócio.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-72">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                required
                className="w-full h-11 rounded-lg border border-border/60 bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-6 text-sm hover:bg-primary-hover transition-all active:scale-[0.98] shadow-sm shadow-primary/20 disabled:opacity-50 disabled:pointer-events-none shrink-0"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  Cadastrar
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
