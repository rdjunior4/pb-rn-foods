import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Plus, Pencil, Trash2, Star, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCustomerAddresses, useSaveAddress, useDeleteAddress, useSetDefaultAddress } from "@/lib/hooks";
import { CustomerLayout } from "@/components/CustomerLayout";
import { fetchViaCEP } from "@/lib/location";
import type { CustomerAddress } from "@/lib/types";
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

export const Route = createFileRoute("/minha-conta/enderecos")({
  component: AddressesPage,
});

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

interface AddressForm {
  label: string;
  recipientName: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

const EMPTY_FORM: AddressForm = {
  label: "Casa",
  recipientName: "",
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  isDefault: false,
};

function AddressesPage() {
  const { user } = useAuth();
  const customerId = user?.id || "";
  const { data: addresses = [], isLoading } = useCustomerAddresses(customerId);
  const saveAddress = useSaveAddress();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [loadingCep, setLoadingCep] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (addr: CustomerAddress) => {
    setEditing(addr);
    setForm({
      label: addr.label,
      recipientName: addr.recipientName,
      cep: addr.cep,
      street: addr.street,
      number: addr.number,
      complement: addr.complement,
      neighborhood: addr.neighborhood,
      city: addr.city,
      state: addr.state,
      isDefault: addr.isDefault,
    });
  };

  const handleCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setLoadingCep(true);
    try {
      const data = await fetchViaCEP(clean);
      if (data) {
        setForm((f) => ({
          ...f,
          street: data.street || f.street,
          neighborhood: data.neighborhood || f.neighborhood,
          city: data.city || f.city,
          state: data.state || f.state,
        }));
      }
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSave = async () => {
    if (!form.street.trim()) { toast.error("Informe a rua."); return; }
    if (!form.city.trim()) { toast.error("Informe a cidade."); return; }
    await saveAddress.mutateAsync({
      ...(editing ? { id: editing.id } : {}),
      customerId,
      label: form.label,
      recipientName: form.recipientName,
      cep: form.cep,
      street: form.street,
      number: form.number,
      complement: form.complement,
      neighborhood: form.neighborhood,
      city: form.city,
      state: form.state,
      isDefault: form.isDefault,
    });
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAddress.mutateAsync({ id: deleteId, customerId });
    setDeleteId(null);
  };

  const formatAddr = (a: CustomerAddress) => {
    const parts = [a.street, a.number, a.complement, a.neighborhood, `${a.city}/${a.state}`, `CEP: ${a.cep}`].filter(Boolean);
    return parts.join(", ");
  };

  if (!user) {
    return (
      <CustomerLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">Acesse sua conta</h2>
            <p className="text-sm text-muted-foreground mb-4">Faca login para gerenciar seus enderecos.</p>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <ChevronLeft className="h-4 w-4" /> Voltar
            </Link>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/minha-conta" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2">
              <ChevronLeft className="h-3 w-3" /> Minha conta
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight">Meus Enderecos</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie seus enderecos de entrega.</p>
          </div>
          <button onClick={openNew} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-all inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-muted/30 animate-pulse" />
            ))}
          </div>
        ) : addresses.length === 0 && !editing ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border/60">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-semibold mb-1">Nenhum endereco cadastrado</p>
            <p className="text-xs text-muted-foreground mb-4">Adicione um endereco para facilitar suas compras.</p>
            <button onClick={openNew} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-all">
              Adicionar endereco
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div key={addr.id} className={`rounded-xl border p-4 sm:p-5 transition-all ${addr.isDefault ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          <Star className="h-2.5 w-2.5 fill-current" /> Padrao
                        </span>
                      )}
                    </div>
                    {addr.recipientName && <p className="text-xs text-muted-foreground mb-1">{addr.recipientName}</p>}
                    <p className="text-sm text-muted-foreground">{formatAddr(addr)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!addr.isDefault && (
                      <button onClick={() => setDefault.mutate({ customerId, addressId: addr.id })} className="h-8 px-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                        Tornar padrao
                      </button>
                    )}
                    <button onClick={() => openEdit(addr)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteId(addr.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all">
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
                <h3 className="text-base font-extrabold">{editing ? "Editar endereco" : "Novo endereco"}</h3>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Apelido</label>
                    <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Casa, Trabalho..." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome destinatario</label>
                    <input value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Quem vai receber?" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">CEP</label>
                  <input value={form.cep} onChange={(e) => { setForm({ ...form, cep: e.target.value }); if (e.target.value.replace(/\D/g, "").length === 8) handleCep(e.target.value); }} onBlur={(e) => handleCep(e.target.value)} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="00000-000" maxLength={9} />
                  {loadingCep && <p className="text-xs text-muted-foreground">Buscando endereco...</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Rua</label>
                  <input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Rua, Avenida..." />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Numero</label>
                    <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="123" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Complemento</label>
                    <input value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Apto 101, Bloco B..." />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Bairro</label>
                  <input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Bairro" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cidade</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" placeholder="Cidade" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">UF</label>
                    <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="w-full h-10 rounded-lg border border-border/60 bg-background text-foreground px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all" style={{ colorScheme: "light" }}>
                      <option value="">UF</option>
                      {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer py-1">
                  <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="h-4 w-4 rounded border-border/60 text-primary focus:ring-primary/20" />
                  <span className="text-sm font-medium">Definir como endereco padrao</span>
                </label>
              </div>
              <div className="px-5 pb-5 flex gap-3">
                <button onClick={() => setEditing(null)} className="flex-1 h-10 rounded-lg border border-border/60 text-sm font-semibold text-foreground hover:bg-muted/50 transition-all">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saveAddress.isPending} className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50">
                  {saveAddress.isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover endereco?</AlertDialogTitle>
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
    </CustomerLayout>
  );
}
