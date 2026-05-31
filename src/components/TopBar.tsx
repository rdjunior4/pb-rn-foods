import { MapPin, ChevronDown } from "lucide-react";

export function TopBar() {
  return (
    <div className="bg-primary text-primary-foreground text-xs">
      <div className="mx-auto flex max-w-[1400px] items-center justify-center px-4 sm:px-6 h-10">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:opacity-90 transition-opacity"
        >
          <MapPin className="h-4 w-4" />
          <span className="hidden sm:inline">Entrega em João Pessoa - PB</span>
          <span className="sm:hidden">João Pessoa - PB</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-80" />
        </button>
      </div>
    </div>
  );
}
