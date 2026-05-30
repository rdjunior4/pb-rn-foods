import { MapPin, Phone } from "lucide-react";

export function TopBar() {
  return (
    <div className="bg-brand-black text-brand-black-foreground text-xs">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 sm:px-6 h-10">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Entrega em João Pessoa - PB</span>
          <span className="sm:hidden">João Pessoa - PB</span>
        </div>
        <div className="flex items-center gap-6">
          <nav className="hidden lg:flex items-center gap-6 text-sm">
            <a href="#" className="hover:text-primary transition-colors">Atendimento</a>
            <a href="#" className="hover:text-primary transition-colors">Quem somos</a>
            <a href="#" className="hover:text-primary transition-colors">Trabalhe conosco</a>
            <a href="#" className="hover:text-primary transition-colors">Blog</a>
          </nav>
          <a
            href="tel:1140022600"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <Phone className="h-3.5 w-3.5" />
            (11) 4002-2600
          </a>
        </div>
      </div>
    </div>
  );
}
