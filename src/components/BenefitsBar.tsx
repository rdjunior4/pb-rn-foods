import { loadStoreConfig } from "@/lib/store-config";
import * as Icons from "lucide-react";

const fallbackItems: { id: string; icon: string; title: string; desc: string }[] = [
  { id: "f1", icon: "ShieldCheck", title: "Marcas selecionadas", desc: "Parcerias com as melhores marcas do mercado." },
  { id: "f2", icon: "BadgePercent", title: "Condições exclusivas", desc: "Preços especiais e benefícios para clientes CNPJ." },
  { id: "f3", icon: "Truck", title: "Logística ágil", desc: "Entregas rápidas e pontuais em toda a região Nordeste." },
  { id: "f4", icon: "Headset", title: "Atendimento especializado", desc: "Suporte dedicado com consultores para seu negócio." },
];

export function BenefitsBar() {
  const config = loadStoreConfig();
  const items = config.benefits.filter((b) => b.active);

  const displayItems = items.length > 0 ? items : fallbackItems;

  return (
    <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-[30px] mt-10">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {displayItems.map((b, i) => {
          const IconComp = (Icons as any)[b.icon] || Icons.ShieldCheck;
          return (
            <div
              key={b.id || i}
              className="group relative flex flex-col items-center text-center rounded-2xl bg-gradient-to-b from-primary to-primary-hover p-5 sm:p-7 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b from-white/20 to-white/5 text-white backdrop-blur-sm mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-white/20 transition-all duration-300 ring-1 ring-white/15">
                <IconComp className="h-6 w-6" />
              </div>
              <div className="font-semibold text-sm text-white relative">{b.title}</div>
              <div className="text-xs text-white/60 mt-1.5 leading-relaxed max-w-[200px] relative">{b.desc}</div>
              <div className="absolute bottom-3 right-3 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-white/20 transition-all -translate-x-1 group-hover:translate-x-0">
                <Icons.ArrowRight className="h-3 w-3 text-white" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}