import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  useAdminCustomers,
  useSaveCustomer,
  useDeleteCustomer,
  useAddCredit,
  useAdjustCredit,
  useUpdateCustomerTags,
  useUpdateCustomerNotes,
  useAdminOrders,
  useAdminAdvanceOrder,
} from "@/lib/hooks";
import { generateId } from "@/lib/admin-store";
import { formatCurrency, formatDate, formatDocAuto, formatPhone } from "@/lib/format";
import type { Customer, Order, OrderStatus } from "@/lib/types";
import {
  Users,
  Search,
  Eye,
  Plus,
  X,
  User,
  Mail,
  Phone,
  FileText,
  Wallet,
  Star,
  MessageSquare,
  ChevronRight,
  Edit,
  Save,
  Tag,
  Crown,
  Award,
  BadgeCheck,
  Trash2,
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { statusConfig, nextStatus } from "@/lib/constants";

export const Route = createFileRoute("/admin/clientes")({
  component: AdminClientes,
  errorComponent: () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold text-red-600 mb-2">Erro ao carregar</p>
      <p className="text-xs text-muted-foreground">Tente novamente ou volte para o painel.</p>
    </div>
  ),
});

type Tab = "dados" | "pedidos" | "credito" | "fidelidade" | "notas";

const ALL_TAGS = ["VIP", "Atacadista", "Novo", "Inativo", "Recorrente", "Fiel"];

const loyaltyConfig = {
  bronze: { icon: BadgeCheck, label: "Bronze", color: "text-orange-600", bg: "bg-orange-50", points: "0 — 1.999" },
  prata: { icon: Award, label: "Prata", color: "text-zinc-500", bg: "bg-zinc-100", points: "2.000 — 4.999" },
  ouro: { icon: Crown, label: "Ouro", color: "text-yellow-600", bg: "bg-yellow-50", points: "5.000+" },
};

function AdminClientes() {
  const { data: customers = [], isLoading } = useAdminCustomers();
  const { data: orders = [] } = useAdminOrders();
  const saveCustomer = useSaveCustomer();
  const deleteCustomer = useDeleteCustomer();
  const addCredit = useAddCredit();
  const adjustCredit = useAdjustCredit();
  const updateTags = useUpdateCustomerTags();
  const updateNotes = useUpdateCustomerNotes();
  const advanceOrder = useAdminAdvanceOrder();

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [tab, setTab] = useState<Tab>("dados");
  const [showNewForm, setShowNewForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");
  const [creditAction, setCreditAction] = useState<"release" | "adjust">("release");
  const [newTag, setNewTag] = useState("");
  const [notesText, setNotesText] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    document: "",
    documentType: "" as "cpf" | "cnpj" | "",
    phone: "",
    address: "",
    city: "",
    state: "",
    creditLimit: 0,
  });

  // Stats
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.loyaltyLevel !== "bronze" || c.loyaltyPoints > 0).length;
    const ticket =
      total > 0 ? customers.reduce((sum, c) => sum + (c.creditHistory.length > 0 ? 0 : 0), 0) / total : 0;
    const totalCredit = customers.reduce((sum, c) => sum + c.creditBalance, 0);
    return { total, active, ticket, totalCredit };
  }, [customers]);

  const filtered = useMemo(() => {
    let result = customers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.document.includes(q) ||
          c.phone.includes(q),
      );
    }
    if (tagFilter !== "all") {
      result = result.filter((c) => c.tags.includes(tagFilter));
    }
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [customers, search, tagFilter]);

  const getCustomerOrders = (customerId: string) =>
    orders
      .filter((o) => o.customerEmail === customerId || o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      document: "",
      documentType: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      creditLimit: 0,
    });
    setShowNewForm(false);
    setEditing(false);
  };

  const handleSaveNew = () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    const customer: Customer = {
      id: generateId(),
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      document: formData.document.trim(),
      documentType: formData.documentType,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      createdAt: new Date().toISOString(),
      creditBalance: 0,
      creditLimit: formData.creditLimit,
      creditHistory: [],
      loyaltyPoints: 0,
      loyaltyLevel: "bronze",
      tags: ["Novo"],
      notes: "",
    };

    saveCustomer.mutate(customer, {
      onSuccess: () => {
        toast.success("Cliente cadastrado com sucesso!");
        resetForm();
        setSelected(customer);
      },
    });
  };

  const handleSaveEdit = () => {
    if (!selected) return;
    const updated: Customer = {
      ...selected,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      document: formData.document.trim(),
      documentType: formData.documentType,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      creditLimit: formData.creditLimit,
    };
    saveCustomer.mutate(updated, {
      onSuccess: () => {
        toast.success("Cliente atualizado!");
        setSelected(updated);
        setEditing(false);
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteCustomer.mutate(id, {
      onSuccess: () => {
        toast.success("Cliente excluído!");
        setSelected(null);
      },
    });
  };

  const handleCredit = () => {
    if (!selected || !creditAmount) return;
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error("Valor inválido");
      return;
    }

    if (creditAction === "release") {
      addCredit.mutate(
        {
          customerId: selected.id,
          amount: Math.abs(amount),
          description: creditDescription || "Liberação de crédito",
        },
        {
          onSuccess: (updated) => {
            toast.success(`Crédito de ${formatCurrency(Math.abs(amount))} liberado!`);
            setSelected(updated);
            setCreditAmount("");
            setCreditDescription("");
          },
        },
      );
    } else {
      adjustCredit.mutate(
        {
          customerId: selected.id,
          amount,
          description: creditDescription || "Ajuste de crédito",
        },
        {
          onSuccess: (updated) => {
            toast.success(`Crédito ajustado em ${formatCurrency(amount)}!`);
            setSelected(updated);
            setCreditAmount("");
            setCreditDescription("");
          },
        },
      );
    }
  };

  const handleAddTag = () => {
    if (!selected || !newTag.trim()) return;
    const tag = newTag.trim();
    if (selected.tags.includes(tag)) {
      toast.error("Tag já existe");
      return;
    }
    updateTags.mutate(
      { customerId: selected.id, tags: [...selected.tags, tag] },
      {
        onSuccess: (updated) => {
          setSelected(updated);
          setNewTag("");
          toast.success(`Tag "${tag}" adicionada`);
        },
      },
    );
  };

  const handleRemoveTag = (tag: string) => {
    if (!selected) return;
    updateTags.mutate(
      { customerId: selected.id, tags: selected.tags.filter((t) => t !== tag) },
      { onSuccess: (updated) => setSelected(updated) },
    );
  };

  const handleSaveNotes = () => {
    if (!selected) return;
    updateNotes.mutate(
      { customerId: selected.id, notes: notesText },
      {
        onSuccess: (updated) => {
          setSelected(updated);
          toast.success("Observações salvas");
        },
      },
    );
  };

  const handleAdvanceOrder = (orderId: string) => {
    advanceOrder.mutate(orderId, {
      onSuccess: (order) => {
        toast.success(`Pedido atualizado para "${statusConfig[order.status].label}"`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Clientes</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {customers.length} cliente{customers.length !== 1 ? "s" : ""} · CRM
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowNewForm(true);
          }}
          className="inline-flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900">{stats.total}</div>
              <div className="text-xs text-zinc-500">Total</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900">{stats.active}</div>
              <div className="text-xs text-zinc-500">Ativos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900">{formatCurrency(stats.totalCredit)}</div>
              <div className="text-xs text-zinc-500">Crédito total</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-zinc-200 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-zinc-900">
                {customers.filter((c) => c.loyaltyLevel === "ouro").length}
              </div>
              <div className="text-xs text-zinc-500">Clientes Ouro</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setTagFilter("all")}
              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                tagFilter === "all"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              Todos ({customers.length})
            </button>
            {ALL_TAGS.map((tag) => {
              const count = customers.filter((c) => c.tags.includes(tag)).length;
              if (count === 0) return null;
              return (
                <button
                  key={tag}
                  onClick={() => setTagFilter(tag)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                    tagFilter === tag
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center">
          <div className="h-16 w-16 rounded-lg bg-zinc-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-zinc-300" />
          </div>
          <p className="text-sm font-medium text-zinc-900">Nenhum cliente encontrado</p>
          <p className="text-xs text-zinc-400 mt-1">
            Cadastre o primeiro cliente ou ajuste os filtros
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/50">
                  <th className="text-left px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                    Documento
                  </th>
                  <th className="text-left px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider hidden md:table-cell">
                    Tags
                  </th>
                  <th className="text-center px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                    Nível
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                    Crédito
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                    Pontos
                  </th>
                  <th className="text-right px-5 py-3 font-medium text-zinc-500 text-xs uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map((c) => {
                  const level = loyaltyConfig[c.loyaltyLevel];
                  const LevelIcon = level.icon;
                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-zinc-900 truncate max-w-[200px]">
                          {c.name}
                        </div>
                        <div className="text-xs text-zinc-400 truncate max-w-[200px]">
                          {c.email}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-zinc-500 hidden sm:table-cell">
                        {formatDocAuto(c.document)}
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {c.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
                            >
                              <Tag className="h-2.5 w-2.5" />
                              {tag}
                            </span>
                          ))}
                          {c.tags.length > 2 && (
                            <span className="text-[10px] text-zinc-400">
                              +{c.tags.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${level.color} ${level.bg}`}
                        >
                          <LevelIcon className="h-3 w-3" />
                          {level.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span
                          className={`text-sm font-semibold ${
                            c.creditBalance > 0
                              ? "text-emerald-600"
                              : c.creditBalance < 0
                                ? "text-red-600"
                                : "text-zinc-400"
                          }`}
                        >
                          {formatCurrency(c.creditBalance)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-sm font-medium text-zinc-700">
                        {c.loyaltyPoints.toLocaleString("pt-BR")}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelected(c);
                            setNotesText(c.notes);
                            setTab("dados");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[3vh] pb-8 px-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-zinc-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">{selected.name}</h2>
                  <p className="text-sm text-zinc-400">{selected.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editing && (
                  <button
                    onClick={() => {
                      setFormData({
                        name: selected.name,
                        email: selected.email,
                        document: selected.document,
                        documentType: selected.documentType,
                        phone: selected.phone,
                        address: selected.address,
                        city: selected.city,
                        state: selected.state,
                        creditLimit: selected.creditLimit,
                      });
                      setEditing(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 px-3 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Editar
                  </button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-zinc-100 px-6">
              <div className="flex gap-1 -mb-px">
                {(
                  [
                    { key: "dados", label: "Dados", icon: User },
                    { key: "pedidos", label: "Pedidos", icon: Package },
                    { key: "credito", label: "Crédito", icon: Wallet },
                    { key: "fidelidade", label: "Fidelidade", icon: Star },
                    { key: "notas", label: "Notas", icon: MessageSquare },
                  ] as const
                ).map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      onClick={() => {
                        setTab(t.key);
                        if (t.key === "notas") setNotesText(selected.notes);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                        tab === t.key
                          ? "border-zinc-900 text-zinc-900"
                          : "border-transparent text-zinc-400 hover:text-zinc-600"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* DADOS */}
              {tab === "dados" && (
                <div className="space-y-4">
                  {editing ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-zinc-500 mb-1 block">Nome</label>
                          <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-500 mb-1 block">Email</label>
                          <input
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-500 mb-1 block">Documento</label>
                          <input
                            value={formData.document}
                            onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                            placeholder="CPF ou CNPJ"
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-500 mb-1 block">Telefone</label>
                          <input
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-zinc-500 mb-1 block">Endereço</label>
                          <input
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-500 mb-1 block">Cidade</label>
                          <input
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-500 mb-1 block">UF</label>
                          <input
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase().slice(0, 2) })}
                            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => setEditing(false)}
                          className="text-sm text-zinc-500 hover:text-zinc-700 font-medium"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="inline-flex items-center gap-1.5 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors"
                        >
                          <Save className="h-4 w-4" />
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <InfoCard icon={User} label="Nome" value={selected.name} />
                      <InfoCard icon={Mail} label="Email" value={selected.email} />
                      <InfoCard
                        icon={FileText}
                        label="Documento"
                        value={formatDocAuto(selected.document) || "—"}
                        sub={selected.documentType === "cnpj" ? "PJ" : selected.documentType === "cpf" ? "PF" : ""}
                      />
                      <InfoCard icon={Phone} label="Telefone" value={formatPhone(selected.phone) || "—"} />
                      <InfoCard icon={User} label="Endereço" value={selected.address || "—"} />
                      <InfoCard
                        icon={User}
                        label="Cidade/UF"
                        value={selected.city && selected.state ? `${selected.city}/${selected.state}` : "—"}
                      />
                      <InfoCard
                        icon={Wallet}
                        label="Limite de crédito"
                        value={formatCurrency(selected.creditLimit)}
                      />
                      <InfoCard
                        icon={Clock}
                        label="Cadastrado em"
                        value={formatDate(selected.createdAt)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* PEDIDOS */}
              {tab === "pedidos" && (
                <PedidosTab
                  orders={getCustomerOrders(selected.email)}
                  onAdvance={handleAdvanceOrder}
                />
              )}

              {/* CRÉDITO */}
              {tab === "credito" && (
                <CreditoTab
                  customer={selected}
                  creditAmount={creditAmount}
                  setCreditAmount={setCreditAmount}
                  creditDescription={creditDescription}
                  setCreditDescription={setCreditDescription}
                  creditAction={creditAction}
                  setCreditAction={setCreditAction}
                  onCredit={handleCredit}
                  isLoading={addCredit.isPending || adjustCredit.isPending}
                />
              )}

              {/* FIDELIDADE */}
              {tab === "fidelidade" && <FidelidadeTab customer={selected} />}

              {/* NOTAS */}
              {tab === "notas" && (
                <NotasTab
                  customer={selected}
                  notesText={notesText}
                  setNotesText={setNotesText}
                  onSave={handleSaveNotes}
                  newTag={newTag}
                  setNewTag={setNewTag}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                  onDelete={() => handleDelete(selected.id)}
                  isLoading={updateNotes.isPending || deleteCustomer.isPending}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Client Form */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={resetForm}
          />
          <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Novo Cliente</h3>
              <button
                onClick={resetForm}
                className="h-9 w-9 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Nome *</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Email *</label>
                <input
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemplo.com"
                  type="email"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">CPF/CNPJ</label>
                <input
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Telefone</label>
                <input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Endereço</label>
                <input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua, número, bairro"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">Cidade</label>
                <input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">UF</label>
                <input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase().slice(0, 2) })}
                  placeholder="SE"
                  maxLength={2}
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                onClick={resetForm}
                className="text-sm text-zinc-500 hover:text-zinc-700 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNew}
                disabled={saveCustomer.isPending}
                className="inline-flex items-center gap-1.5 bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                {saveCustomer.isPending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-zinc-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-xs text-zinc-400">{label}</span>
      </div>
      <div className="text-sm font-medium text-zinc-900">{value}</div>
      {sub && <div className="text-[10px] text-zinc-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function PedidosTab({
  orders,
  onAdvance,
}: {
  orders: Order[];
  onAdvance: (orderId: string) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
        <p className="text-sm text-zinc-500">Nenhum pedido encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => {
        const cfg = statusConfig[order.status];
        return (
          <div
            key={order.id}
            className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-3"
          >
            <div
              className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}
            >
              {order.status === "delivered" ? (
                <CheckCircle className={`h-4 w-4 ${cfg.color}`} />
              ) : order.status === "cancelled" ? (
                <AlertCircle className={`h-4 w-4 ${cfg.color}`} />
              ) : order.status === "shipped" ? (
                <Truck className={`h-4 w-4 ${cfg.color}`} />
              ) : order.status === "preparing" ? (
                <Package className={`h-4 w-4 ${cfg.color}`} />
              ) : (
                <Clock className={`h-4 w-4 ${cfg.color}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900">{order.id}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.color} ${cfg.bg}`}
                >
                  <span className={`h-1 w-1 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-0.5">
                {formatDate(order.createdAt)} · {order.items.length} item
                {order.items.length !== 1 ? "s" : ""}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-zinc-900">
                {formatCurrency(order.total)}
              </div>
              {nextStatus[order.status] && (
                <button
                  onClick={() => onAdvance(order.id)}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 mt-0.5"
                >
                  Avançar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CreditoTab({
  customer,
  creditAmount,
  setCreditAmount,
  creditDescription,
  setCreditDescription,
  creditAction,
  setCreditAction,
  onCredit,
  isLoading,
}: {
  customer: Customer;
  creditAmount: string;
  setCreditAmount: (v: string) => void;
  creditDescription: string;
  setCreditDescription: (v: string) => void;
  creditAction: "release" | "adjust";
  setCreditAction: (v: "release" | "adjust") => void;
  onCredit: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Balance */}
      <div className="bg-zinc-50 rounded-lg p-4 text-center">
        <div className="text-xs text-zinc-400 mb-1">Saldo de crédito</div>
        <div
          className={`text-3xl font-bold ${
            customer.creditBalance > 0
              ? "text-emerald-600"
              : customer.creditBalance < 0
                ? "text-red-600"
                : "text-zinc-900"
          }`}
        >
          {formatCurrency(customer.creditBalance)}
        </div>
      </div>

      {/* Release/Adjust form */}
      <div className="bg-white rounded-lg border border-zinc-200 p-4 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Movimentar crédito
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setCreditAction("release")}
            className={`flex-1 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
              creditAction === "release"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            Liberar
          </button>
          <button
            onClick={() => setCreditAction("adjust")}
            className={`flex-1 text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
              creditAction === "adjust"
                ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            }`}
          >
            Ajustar
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">
              Valor {creditAction === "adjust" ? "(pode ser negativo)" : ""}
            </label>
            <input
              type="number"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Descrição</label>
            <input
              value={creditDescription}
              onChange={(e) => setCreditDescription(e.target.value)}
              placeholder="Motivo..."
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            />
          </div>
        </div>
        <button
          onClick={onCredit}
          disabled={isLoading || !creditAmount}
          className="w-full bg-zinc-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Processando..." : creditAction === "release" ? "Liberar crédito" : "Ajustar crédito"}
        </button>
      </div>

      {/* History */}
      {customer.creditHistory.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
            Histórico ({customer.creditHistory.length})
          </h4>
          <div className="space-y-2">
            {[...customer.creditHistory]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3"
                >
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      entry.type === "release"
                        ? "bg-emerald-50"
                        : entry.type === "usage"
                          ? "bg-red-50"
                          : "bg-amber-50"
                    }`}
                  >
                    {entry.type === "release" ? (
                      <Plus className="h-4 w-4 text-emerald-600" />
                    ) : entry.type === "usage" ? (
                      <Wallet className="h-4 w-4 text-red-600" />
                    ) : (
                      <Percent className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-900 truncate">{entry.description}</div>
                    <div className="text-[10px] text-zinc-400">{formatDate(entry.createdAt)}</div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      entry.amount > 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {entry.amount > 0 ? "+" : ""}{formatCurrency(entry.amount)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FidelidadeTab({ customer }: { customer: Customer }) {
  const level = loyaltyConfig[customer.loyaltyLevel];
  const LevelIcon = level.icon;
  const nextLevel =
    customer.loyaltyLevel === "bronze"
      ? "prata"
      : customer.loyaltyLevel === "prata"
        ? "ouro"
        : null;
  const nextThreshold = nextLevel === "prata" ? 2000 : nextLevel === "ouro" ? 5000 : 0;
  const progress = nextLevel
    ? Math.min(100, (customer.loyaltyPoints / nextThreshold) * 100)
    : 100;

  return (
    <div className="space-y-5">
      <div className="bg-zinc-50 rounded-lg p-4 text-center">
        <LevelIcon className={`h-12 w-12 mx-auto mb-2 ${level.color}`} />
        <div className="text-sm text-zinc-400 mb-1">Nível atual</div>
        <div className={`text-2xl font-bold ${level.color}`}>{level.label}</div>
        <div className="text-xs text-zinc-400 mt-1">Faixa: {level.points} pontos</div>
      </div>

      <div className="bg-zinc-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-500">Pontos acumulados</span>
          <span className="text-lg font-bold text-zinc-900">
            {customer.loyaltyPoints.toLocaleString("pt-BR")}
          </span>
        </div>
        {nextLevel && (
          <>
            <div className="h-2 bg-zinc-200 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-zinc-900 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-zinc-400">
              Faltam {(nextThreshold - customer.loyaltyPoints).toLocaleString("pt-BR")} pontos para{" "}
              <span className="font-semibold">{loyaltyConfig[nextLevel].label}</span>
            </div>
          </>
        )}
        {!nextLevel && (
          <div className="text-xs text-yellow-600 font-semibold">
            Nível máximo atingido!
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Regras de pontuação
        </h4>
        <div className="space-y-2 text-sm text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            R$ 1,00 gasto = 1 ponto
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            Prata: 2.000 pontos
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            Ouro: 5.000 pontos
          </div>
        </div>
      </div>

      <div className="bg-zinc-50 rounded-lg p-3">
        <div className="text-xs text-zinc-400 mb-1">Cliente desde</div>
        <div className="text-sm font-medium text-zinc-900">{formatDate(customer.createdAt)}</div>
      </div>
    </div>
  );
}

function NotasTab({
  customer,
  notesText,
  setNotesText,
  onSave,
  newTag,
  setNewTag,
  onAddTag,
  onRemoveTag,
  onDelete,
  isLoading,
}: {
  customer: Customer;
  notesText: string;
  setNotesText: (v: string) => void;
  onSave: () => void;
  newTag: string;
  setNewTag: (v: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onDelete: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="space-y-5">
      {/* Tags */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Tags
        </h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                customer.tags.includes(tag) ? onRemoveTag(tag) : onAddTag()
              }
              className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                customer.tags.includes(tag)
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Tag personalizada..."
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
            onKeyDown={(e) => e.key === "Enter" && onAddTag()}
          />
          <button
            onClick={onAddTag}
            disabled={!newTag.trim()}
            className="bg-zinc-900 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
          Observações internas
        </h4>
        <textarea
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          placeholder="Anotações sobre o cliente..."
          rows={5}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 resize-none"
        />
        <button
          onClick={onSave}
          disabled={isLoading}
          className="mt-2 inline-flex items-center gap-1.5 bg-zinc-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Salvar observações
        </button>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-lg p-4 bg-red-50/50">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-2">
          Zona de perigo
        </h4>
        <p className="text-xs text-red-500 mb-3">
          Excluir este cliente removerá todos os dados associados.
        </p>
        <button
          onClick={() => {
            if (confirm("Tem certeza que deseja excluir este cliente?")) {
              onDelete();
            }
          }}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir cliente
        </button>
      </div>
    </div>
  );
}
