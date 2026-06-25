import { useState, useEffect } from "react";
import { MapPin, Shield, X } from "lucide-react";
import { getGeoConsent, setGeoConsent } from "@/lib/location";

interface GeoConsentDialogProps {
  onConsent: (consent: boolean) => void;
}

export function GeoConsentDialog({ onConsent }: GeoConsentDialogProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = getGeoConsent();
    if (consent === null) {
      // Nunca perguntou — mostrar dialog após 2 segundos
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setGeoConsent(true);
    setShow(false);
    onConsent(true);
  };

  const handleReject = () => {
    setGeoConsent(false);
    setShow(false);
    onConsent(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border/40 shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-bold text-lg">Localização</h3>
          </div>
          <button
            onClick={handleReject}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Para oferecer uma experiência personalizada, gostaríamos de acessar sua localização 
          e determinar a distribuidora mais próxima.
        </p>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl px-3 py-2 mb-5">
          <Shield className="h-3.5 w-3.5 shrink-0" />
          <span>Sua localização é usada apenas para cálculo de frete e distribuidoras. Não armazenamos seus dados de localização.</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReject}
            className="flex-1 h-11 rounded-xl border border-border/40 text-sm font-medium hover:bg-accent transition-colors"
          >
            Agora não
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-colors"
          >
            Permitir
          </button>
        </div>
      </div>
    </div>
  );
}
