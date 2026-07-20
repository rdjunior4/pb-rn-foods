import { useState, useEffect } from "react";
import { Shield } from "lucide-react";

const STORAGE_KEY = "pbrn-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const handleConsent = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4">
      <div className="mx-auto max-w-3xl bg-card border-t border-border/40 shadow-lg rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Utilizamos cookies para melhorar sua experiencia. Ao continuar navegando, voce concorda com nossa{" "}
              <a href="/pagina/privacidade" className="font-semibold text-foreground hover:underline">
                Politica de Privacidade
              </a>
              .
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleConsent("rejected")}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Rejeitar
            </button>
            <button
              onClick={() => handleConsent("accepted")}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
