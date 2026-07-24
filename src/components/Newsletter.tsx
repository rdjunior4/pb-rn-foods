import { useState } from "react";
import { Send, Mail, Percent, Truck, ShieldCheck, ArrowRight, Check, Gift } from "lucide-react";
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
      <div className="relative overflow-hidden rounded-2xl">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(249,115,22,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(249,115,22,0.08),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 px-6 py-12 sm:px-10 sm:py-14 lg:px-16 lg:py-16">
          <div className="max-w-4xl mx-auto">
            {/* Top badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5">
                <Gift className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-white/80">Ofertas exclusivas para seu negócio</span>
              </div>
            </div>

            {/* Content grid */}
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
              {/* Left - Text */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-sm mb-5 ring-1 ring-white/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                  Receba ofertas que<br />
                  <span className="text-primary">fazem a diferença</span>
                </h3>
                <p className="mt-3 text-white/50 text-sm sm:text-base leading-relaxed max-w-md mx-auto lg:mx-0">
                  Cadastre seu e-mail e ganhe acesso antecipado a promoções, lançamentos e condições especiais para CNPJ.
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-6">
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Percent className="h-3 w-3 text-emerald-400" />
                    </div>
                    Descontos exclusivos
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Truck className="h-3 w-3 text-blue-400" />
                    </div>
                    Frete grátis em ofertas
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-white/60">
                    <div className="h-5 w-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <ShieldCheck className="h-3 w-3 text-amber-400" />
                    </div>
                    Sem spam, só vantagens
                  </div>
                </div>
              </div>

              {/* Right - Form */}
              <div className="w-full lg:w-[380px] shrink-0">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 mb-4">
                      <Check className="h-8 w-8 text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-bold text-white mb-1">Cadastro realizado!</h4>
                    <p className="text-sm text-white/50">Você receberá nossas ofertas em primeira mão.</p>
                    <button
                      onClick={() => setSubmitted(false)}
                      className="mt-4 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      Cadastrar outro e-mail
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Seu melhor e-mail"
                        required
                        className="w-full h-12 rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-primary/20 transition-all backdrop-blur-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-hover text-white font-semibold text-sm hover:from-primary-hover hover:to-primary-hover transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {loading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <>
                          Quero receber ofertas
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-white/25 text-center pt-1">
                      Prometemos: apenas ofertas relevantes. Cancele quando quiser.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
