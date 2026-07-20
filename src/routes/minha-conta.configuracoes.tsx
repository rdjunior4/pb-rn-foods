import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, ChevronLeft, Mail, Bell, Globe, Save, Loader2, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUserPreferences, useSaveUserPreferences } from "@/lib/hooks";
import type { UserPreferences } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/minha-conta/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | PB&RN Foods" },
      { name: "description", content: "Gerencie suas preferencias de notificacao e idioma na PB&RN Foods." },
    ],
  }),
  component: SettingsPage,
});

const LANGUAGES = [
  { value: "pt-BR", label: "Portugues (Brasil)" },
  { value: "en-US", label: "English (US)" },
  { value: "es", label: "Espanhol" },
];

function SettingsPage() {
  const { user } = useAuth();
  const userId = user?.id || "";
  const { data: prefs, isLoading } = useUserPreferences(userId);
  const savePrefs = useSaveUserPreferences();

  const [form, setForm] = useState({
    emailOrderUpdates: true,
    emailPromotions: true,
    emailStockAlerts: false,
    pushOrderUpdates: true,
    pushPromotions: false,
    pushStockAlerts: false,
    language: "pt-BR",
  });

  useEffect(() => {
    if (prefs) {
      setForm({
        emailOrderUpdates: prefs.emailOrderUpdates,
        emailPromotions: prefs.emailPromotions,
        emailStockAlerts: prefs.emailStockAlerts,
        pushOrderUpdates: prefs.pushOrderUpdates,
        pushPromotions: prefs.pushPromotions,
        pushStockAlerts: prefs.pushStockAlerts,
        language: prefs.language,
      });
    }
  }, [prefs]);

  const handleSave = () => {
    savePrefs.mutate({ userId, prefs: form });
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/50 mb-6">
            <Settings className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h2 className="text-xl font-bold mb-2">Acesse sua conta</h2>
          <p className="text-sm text-muted-foreground mb-6">Faca login para gerenciar suas preferencias.</p>
          <Link to="/minha-conta" className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-hover transition-all">
            <LogIn className="h-4 w-4" /> Ir para Minha Conta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/minha-conta" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
            <ChevronLeft className="h-3 w-3" /> Minha conta
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight">Configuracoes</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie suas preferencias de notificacao e idioma.</p>
        </div>
        <button onClick={handleSave} disabled={savePrefs.isPending || isLoading} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-all inline-flex items-center gap-2 disabled:opacity-50">
          {savePrefs.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="rounded-xl border border-border/40 bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Notificacoes por e-mail</h3>
                <p className="text-xs text-muted-foreground">Receba atualizacoes no seu e-mail</p>
              </div>
            </div>
            <div className="space-y-4">
              <ToggleRow label="Atualizacoes de pedido" description="Confirmacao, envio e entrega" checked={form.emailOrderUpdates} onChange={(v) => setForm({ ...form, emailOrderUpdates: v })} />
              <ToggleRow label="Promocoes e ofertas" description="Descontos e novidades" checked={form.emailPromotions} onChange={(v) => setForm({ ...form, emailPromotions: v })} />
              <ToggleRow label="Alertas de estoque" description="Quando produtos voltam ao estoque" checked={form.emailStockAlerts} onChange={(v) => setForm({ ...form, emailStockAlerts: v })} />
            </div>
          </div>

          {/* Push Notifications */}
          <div className="rounded-xl border border-border/40 bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center">
                <Bell className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Notificacoes push</h3>
                <p className="text-xs text-muted-foreground">Notificacoes no navegador</p>
              </div>
            </div>
            <div className="space-y-4">
              <ToggleRow label="Atualizacoes de pedido" description="Acompanhe em tempo real" checked={form.pushOrderUpdates} onChange={(v) => setForm({ ...form, pushOrderUpdates: v })} />
              <ToggleRow label="Promocoes e ofertas" description="Ofertas relampago" checked={form.pushPromotions} onChange={(v) => setForm({ ...form, pushPromotions: v })} />
              <ToggleRow label="Alertas de estoque" description="Produtos favoritados disponiveis" checked={form.pushStockAlerts} onChange={(v) => setForm({ ...form, pushStockAlerts: v })} />
            </div>
          </div>

          {/* Language */}
          <div className="rounded-xl border border-border/40 bg-card p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Globe className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Idioma e regiao</h3>
                <p className="text-xs text-muted-foreground">Idioma da interface</p>
              </div>
            </div>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="w-full sm:w-64 h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              style={{ colorScheme: "light" }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`} />
      </button>
    </div>
  );
}
