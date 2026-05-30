import { ShieldCheck, Truck, Headset, Award } from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Marcas selecionadas", desc: "Parcerias com as melhores marcas do mercado." },
  { icon: Truck, title: "Logística ágil", desc: "Entregas rápidas e cobertura em todo o Brasil." },
  { icon: Headset, title: "Atendimento especializado", desc: "Equipe preparada para atender você e o seu negócio." },
  { icon: Award, title: "Qualidade garantida", desc: "Processos rigorosos para garantir produtos de qualidade." },
];

export function BenefitsBar() {
  return (
    <section className="mt-12 bg-muted/60 border-t border-border">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((b) => (
          <div key={b.title} className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-background border border-border">
              <b.icon className="h-6 w-6 text-foreground" />
            </div>
            <div>
              <div className="font-semibold">{b.title}</div>
              <div className="text-sm text-muted-foreground">{b.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
