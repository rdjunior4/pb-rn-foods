import { MapPin, ChevronDown, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const cities = [
  { label: "João Pessoa - PB", value: "joao-pessoa-pb" },
  { label: "Natal - RN", value: "natal-rn" },
  { label: "Caicó - RN", value: "caico-rn" },
];

export function TopBar() {
  const [selected, setSelected] = useState(cities[0]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative z-[60] bg-gradient-to-r from-primary to-primary-hover text-primary-foreground text-[11px] sm:text-xs">
      <div className="mx-auto flex max-w-[1400px] items-center justify-center px-4 sm:px-6 h-9">
        <div className="relative z-50">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span className="font-medium">{selected.label}</span>
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-44 rounded-xl border border-border/50 bg-popover shadow-xl z-[100] py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {cities.map((city, i) => (
                <button
                  key={city.value}
                  onClick={() => { setSelected(city); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs text-popover-foreground hover:bg-muted transition-colors ${i < cities.length - 1 ? "border-b border-border/50" : ""}`}
                >
                  <span className={selected.value === city.value ? "font-semibold" : ""}>{city.label}</span>
                  {selected.value === city.value && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}