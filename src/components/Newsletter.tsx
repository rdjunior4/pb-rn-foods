import { useState } from "react";
import { Mail, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { getSupabase } from "@/lib/supabase";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      setSubmitted(true);
      setEmail("");
    } catch {
      toast.error("Erro ao salvar e-mail. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] mt-16">
      <div className="relative overflow-hidden rounded-xl px-6 py-14 sm:px-12 sm:py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-red-950/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.2),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(220,38,38,0.08),transparent_60%)]" />

        <div className="relative z-10 max-w-md mx-auto text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 mb-5 mx-auto">
            <Mail className="h-5 w-5 text-white" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Receba ofertas exclusivas
          </h3>
          <p className="mt-2 text-white/50 text-sm leading-relaxed">
            Cadastre seu e-mail e fique por dentro de promoções e condições especiais para seu negócio.
          </p>

          {submitted ? (
            <div className="mt-8 inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-400 rounded-lg px-5 py-3 text-sm font-medium">
              <Check className="h-4 w-4" />
              Cadastro realizado com sucesso!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor e-mail"
                required
                className="w-full h-11 rounded-lg border border-white/15 bg-white/5 px-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-lg bg-red-600 text-white font-semibold text-sm hover:bg-red-700 transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    Cadastrar
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-4 text-[11px] text-white/20">
            Prometemos: apenas ofertas relevantes. Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  );
}
