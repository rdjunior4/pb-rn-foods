import { MapPin, ChevronDown, Check, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { detectLocation } from "@/lib/location";
import { useAdminDistributors } from "@/lib/hooks";
import type { Distributor } from "@/lib/types";

const REGION_KEY = "@pbrn-region";

interface Region {
  distributorId: string;
  distributorName: string;
  label: string;
  value: string;
  city: string;
  state: string;
  color: string;
}

function buildRegionsFromDistributors(distributors: Distributor[]): Region[] {
  const regions: Region[] = [];
  const seen = new Set<string>();

  for (const dist of distributors) {
    if (!dist.active) continue;
    if (dist.coverageMode === "city" && dist.coverageCities.length > 0) {
      for (const city of dist.coverageCities) {
        const value = `${city}-${dist.state}`.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (seen.has(value)) continue;
        seen.add(value);
        regions.push({
          distributorId: dist.id,
          distributorName: dist.name,
          label: `${city} - ${dist.state}`,
          value,
          city,
          state: dist.state,
          color: dist.color,
        });
      }
    } else {
      const value = `${dist.city}-${dist.state}`.toLowerCase().replace(/\s+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (!seen.has(value)) {
        seen.add(value);
        regions.push({
          distributorId: dist.id,
          distributorName: dist.name,
          label: `${dist.city} - ${dist.state}`,
          value,
          city: dist.city,
          state: dist.state,
          color: dist.color,
        });
      }
    }
  }

  return regions.sort((a, b) => a.label.localeCompare(b.label));
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function guessRegion(regions: Region[], city?: string, state?: string): Region | null {
  if (!city && !state) return null;
  const c = normalize(city ?? "");
  const s = normalize(state ?? "");
  if (c) {
    const byCity = regions.find((r) => normalize(r.city) === c);
    if (byCity) return byCity;
    const byLabel = regions.find((r) => normalize(r.label).includes(c));
    if (byLabel) return byLabel;
  }
  if (s) {
    const byState = regions.find((r) => normalize(r.state) === s);
    if (byState) return byState;
  }
  return null;
}

function loadSavedRegion(): Region | null {
  try {
    const stored = localStorage.getItem(REGION_KEY);
    if (stored) return JSON.parse(stored) as Region;
  } catch {}
  return null;
}

export function TopBar() {
  const { data: distributors = [], isLoading } = useAdminDistributors();
  const regions = buildRegionsFromDistributors(distributors);
  const [selected, setSelected] = useState<Region | null>(loadSavedRegion());
  const [open, setOpen] = useState(false);
  const [detected, setDetected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((region: Region) => {
    setSelected(region);
    setDetected(false);
    setOpen(false);
    localStorage.setItem(REGION_KEY, JSON.stringify(region));
  }, []);

  useEffect(() => {
    if (regions.length === 0) return;
    if (loadSavedRegion()) return;
    let cancelled = false;
    detectLocation().then((loc) => {
      if (cancelled || !loc) return;
      const match = guessRegion(regions, loc.city, loc.state);
      if (match) {
        setSelected(match);
        setDetected(true);
        localStorage.setItem(REGION_KEY, JSON.stringify(match));
      }
    });
    return () => { cancelled = true; };
  }, [regions]);

  useEffect(() => {
    const handleClick = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground text-[11px] sm:text-xs">
        <div className="mx-auto flex max-w-[1400px] items-center justify-center px-4 sm:px-6 lg:px-[30px] h-9">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        </div>
      </div>
    );
  }

  if (regions.length === 0) return null;

  const current = selected;
  const displayText = current
    ? current.label
    : "Escolha sua região";

  return (
    <div ref={ref} className="relative z-0 bg-gradient-to-r from-primary to-primary-hover text-primary-foreground text-[11px] sm:text-xs">
      <div className="mx-auto flex max-w-[1400px] items-center justify-center px-4 sm:px-6 lg:px-[30px] h-9">
        <div className="relative z-50">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium truncate max-w-[180px] sm:max-w-none">{displayText}</span>
            {detected && <span className="text-[10px] opacity-70 hidden sm:inline">(detectado)</span>}
            <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute top-full left-0 sm:left-1/2 sm:-translate-x-1/2 mt-1.5 w-72 max-w-[calc(100vw-2rem)] rounded border border-border/40 bg-popover shadow-xl z-[100] py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="px-3.5 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Escolha sua região
              </p>
              <div className="max-h-[320px] overflow-y-auto">
                {regions.map((region) => {
                  const isSelected = current?.value === region.value;
                  return (
                    <button
                      key={region.value}
                      onClick={() => handleSelect(region)}
                      className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-popover-foreground hover:bg-muted"
                      }`}
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: region.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{region.city} - {region.state}</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {region.distributorName}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary shrink-0">
                          <Check className="h-2.5 w-2.5 text-primary-foreground" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
