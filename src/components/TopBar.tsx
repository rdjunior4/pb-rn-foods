import { MapPin, ChevronDown } from "lucide-react";

export function TopBar() {
  return (
    <div className="bg-brand-black text-brand-black-foreground text-xs">
      <div className="mx-auto flex max-w-[1400px] items-center justify-center px-4 sm:px-6 h-10">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:text-primary transition-colors"
        >
          <MapPin className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Entrega em João Pessoa - PB</span>
          <span className="sm:hidden">João Pessoa - PB</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>
      </div>
    </div>
  );
}
