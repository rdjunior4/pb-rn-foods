import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Plus, Pencil, Trash2, Star, ChevronLeft, Landmark, Smartphone, FileText } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCustomerPayments, useSavePaymentMethod, useDeletePaymentMethod, useSetDefaultPayment } from "@/lib/hooks";
import { detectCardBrand } from "@/lib/api/payment-methods";
import type { SavedPaymentMethod, PaymentType } from "@/lib/types";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/minha-conta/pagamentos")({
  component: PaymentsPage,
});

interface PaymentForm {
  label: string;
  cardHolder: string;
  cardNumber: string;
  cardLast4: string;
  cardBrand: string;
  paymentType: PaymentType;
  isDefault: boolean;
}

const EMPTY_FORM: PaymentForm = {
  label: "",
  cardHolder: "",
  cardNumber: "",
  cardLast4: "",
  cardBrand: "",
  paymentType: "credit",
  isDefault: false,
};

const PAYMENT_TYPES: { value: PaymentType; label: string; icon: typeof CreditCard }[] = [
  { value: "credit", label: "Credito", icon: CreditCard },
  { value: "debit", label: "Debito", icon: CreditCard },
  { value: "pix", label: "PIX", icon: Smartphone },
  { value: "boleto", label: "Boleto", icon: FileText },
];

const BRAND_LABELS: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  elo: "Elo",
  amex: "American Express",
  discover: "Discover",
};

function PaymentsPage() {
  const { user } = useAuth();
  const customerId = user?.id || "";
  const { data: methods = [], isLoading } = useCustomerPayments(customerId);
  const saveMethod = useSavePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();
  const setDefault = useSetDefaultPayment();

  const [editing, setEditing] = useState<SavedPaymentMethod | null>(null);
  const [form, setForm] = useState<PaymentForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isCard = form.paymentType === "credit" || form.paymentType === "debit";

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (m: SavedPaymentMethod) => {
    setEditing(m);
    setForm({
      label: m.label,
      cardHolder: m.cardHolder,
      cardNumber: "",
      cardLast4: m.cardLast4,
      cardBrand: m.cardBrand,
      paymentType: m.paymentType,
      isDefault: m.isDefault,
    });
  };

  const handleCardNumber = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 16);
    const brand = detectCardBrand(clean);
    setForm({
      ...form,
      cardNumber: clean,
      cardBrand: brand,
      cardLast4: clean.slice(-4),
    });
  };

  const handleSave = async () => {
    if (isCard && !form.cardHolder.trim()) {
      toast.error("Informe o nome no cartao.");
      return;
    }
    await saveMethod.mutateAsync({
      ...(editing ? { id: editing.id } : {}),
      customerId,
      label: form.label || (isCard ? BRAND_LABELS[form.cardBrand] || "Cartao" : PAYMENT_TYPES.find((t) => t.value === form.paymentType)?.label || ""),
      cardHolder: form.cardHolder,
      cardLast4: isCard ? form.cardLast4 : "",
      cardBrand: isCard ? form.cardBrand : "",
      paymentType: form.paymentType,
      isDefault: form.isDefault,
    });
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteMethod.mutateAsync({ id: deleteId, customerId });
    setDeleteId(null);
  };

  const typeIcon = (t: PaymentType) => {
    const found = PAYMENT_TYPES.find((p) => p.value === t);
    return found ? <found.icon className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />;
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2">Acesse sua conta</h2>
          <p className="text-sm text-muted-foreground mb-4">Faca login para gerenciar suas formas de pagamento.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
            <ChevronLeft className="h-4 w-4" /> Voltar
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
            <h1 className="text-2xl font-extrabold tracking-tight">Formas de Pagamento</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie seus cartoes e outras formas de pagamento.</p>
          </div>
          <button onClick={openNew} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-all inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Nova
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : methods.length === 0 && !editing ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border/60">
            <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-semibold mb-1">Nenhuma forma de pagamento</p>
            <p className="text-xs text-muted-foreground mb-4">Adicione um cartao ouPIX para compras mais rapidas.</p>
            <button onClick={openNew} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-all">
              Adicionar forma de pagamento
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {methods.map((m) => (
              <div key={m.id} className={`rounded-xl border p-4 sm:p-5 transition-all ${m.isDefault ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card"}`}>
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${m.isDefault ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"}`}>
                    {typeIcon(m.paymentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold">{m.label}</span>
                      {m.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          <Star className="h-2.5 w-2.5 fill-current" /> Padrao
                        </span>
                      )}
                    </div>
                    {m.cardLast4 ? (
                      <p className="text-xs text-muted-foreground">
                        {m.cardBrand ? `${BRAND_LABELS[m.cardBrand] || m.cardBrand} ` : ""}**** **** **** {m.cardLast4}
                        {m.cardHolder && <span className="ml-1 opacity-60">| {m.cardHolder}</span>}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{PAYMENT_TYPES.find((t) => t.value === m.paymentType)?.label}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!m.isDefault && (
                      <button onClick={() => setDefault.mutate({ customerId, methodId: m.id })} className="h-8 px-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                        Padrao
                      </button>
                    )}
                    <button onClick={() => openEdit(m)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteId(m.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {editing !== null && (
          <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditing(null)}>
            <div className="w-full sm:max-w-lg bg-card rounded-t-xl sm:rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="px-5 pt-5 pb-4 border-b border-border/40">
                <h3 className="text-base font-extrabold">{editing.id ? "Editar pagamento" : "Novo pagamento"}</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo de pagamento</label>
                  <div className="grid grid-cols-4 gap-2">
                    {PAYMENT_TYPES.map((t) => (
                      <button key={t.value} onClick={() => setForm({ ...form, paymentType: t.value })} className={`h-10 rounded-lg text-xs font-semibold flex flex-col items-center justify-center gap-0.5 border transition-all ${form.paymentType === t.value ? "border-primary bg-primary/5 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted/30"}`}>
                        <t.icon className="h-4 w-4" />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Apelido</label>
                  <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Ex: Cartao pessoal" />
                </div>

                {isCard && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome no cartao</label>
                      <input value={form.cardHolder} onChange={(e) => setForm({ ...form, cardHolder: e.target.value.toUpperCase() })} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="NOME COMO NO CARTAO" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Numero do cartao</label>
                      <input value={form.cardNumber} onChange={(e) => handleCardNumber(e.target.value)} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono tracking-wider" placeholder="0000 0000 0000 0000" maxLength={16} />
                      {form.cardBrand && <p className="text-xs text-muted-foreground">Bandeira: <span className="font-semibold capitalize">{form.cardBrand}</span></p>}
                    </div>
                  </>
                )}

                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="h-4 w-4 rounded border-border/60 text-primary focus:ring-primary/20" />
                  <span className="text-sm font-medium">Definir como padrao</span>
                </label>
              </div>
              <div className="px-5 pb-5 flex gap-3">
                <button onClick={() => setEditing(null)} className="flex-1 h-10 rounded-lg border border-border/60 text-sm font-semibold text-foreground hover:bg-muted/50 transition-all">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saveMethod.isPending} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50">
                  {saveMethod.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover forma de pagamento?</AlertDialogTitle>
              <AlertDialogDescription>Esta acao nao pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
