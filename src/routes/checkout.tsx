import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  MapPin,
  CreditCard,
  Truck,
  Loader2,
  Navigation,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { getProductById } from "@/lib/data";
import { saveOrders, loadOrders, generateOrderId, loadStore, validateCoupon, incrementCouponUsage } from "@/lib/admin-store";
import type { Order, Coupon } from "@/lib/types";
import { CustomerLayout } from "@/components/CustomerLayout";
import { formatCurrency, formatDoc, formatPhone } from "@/lib/format";
import type { DocumentType } from "@/lib/format";
import {
  fetchViaCEP,
  formatCEP,
  isNordeste,
  detectLocation,
  type GeoLocation,
} from "@/lib/location";
import { findDistributorForPoint } from "@/lib/distributor-utils";
import { Store } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [payment, setPayment] = useState("credit");
  const [phone, setPhone] = useState("");
  const [docType, setDocType] = useState<DocumentType>("cpf");
  const [docNumber, setDocNumber] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState("");
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationDetected, setLocationDetected] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const cartProducts = items
    .map((item) => {
      const product = getProductById(item.productId);
      if (!product) return null;
      const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : undefined;
      return {
        ...product,
        quantity: item.quantity,
        unitPrice: item.unitPrice || product.price,
        variantId: item.variantId,
        variantLabel: variant?.label,
      };
    })
    .filter(Boolean);

  const total = cartProducts.reduce((sum, p) => sum + p!.unitPrice * p!.quantity, 0);
  const deliveryState = state || location?.state || "";
  const freeShipping = isNordeste(deliveryState) || appliedCoupon?.type === "freeship";
  const shippingCost = freeShipping ? 0 : 15.9;
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") return (total * appliedCoupon.value) / 100;
    if (appliedCoupon.type === "fixed") return Math.min(appliedCoupon.value, total);
    return 0;
  }, [appliedCoupon, total]);
  const orderTotal = Math.max(0, total - couponDiscount + shippingCost);

  const distributors = useMemo(() => loadStore().distributors.filter((d) => d.active), []);
  const detectedDistributor = useMemo(() => {
    if (location?.latitude && location?.longitude) {
      return findDistributorForPoint({ lat: location.latitude, lng: location.longitude }, distributors);
    }
    return null;
  }, [location, distributors]);

  useEffect(() => {
    detectLocation().then((loc) => {
      setLocation(loc);
      setLocationDetected(true);
      if (loc?.state && !state) {
        setState(loc.state);
      }
      if (loc?.city && !city) {
        setCity(loc.city);
      }
    });
  }, []);

  useEffect(() => {
    if (user) {
      if (user.phone && !phone) setPhone(user.phone);
      if (user.document && !docNumber) {
        setDocType(user.documentType);
        setDocNumber(formatDoc(user.document, user.documentType));
      }
    }
  }, [user]);

  const handleCepLookup = useCallback(async (cepValue: string) => {
    const digits = cepValue.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setLoadingCep(true);
    setCepError("");
    const result = await fetchViaCEP(digits);
    setLoadingCep(false);

    if (result) {
      setAddress(result.street);
      setNeighborhood(result.neighborhood);
      setCity(result.city);
      setState(result.state);
    } else {
      setCepError("CEP não encontrado. Preencha o endereço manualmente.");
    }
  }, []);

  const handleCepChange = (value: string) => {
    const formatted = formatCEP(value);
    setCep(formatted);
    setCepError("");
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) {
      handleCepLookup(formatted);
    }
  };

  const handleApplyCoupon = () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    const result = validateCoupon(couponInput, total, user?.id);
    setCouponLoading(false);
    if (!result.ok) {
      setCouponError(result.error || "Cupom inválido.");
      setAppliedCoupon(null);
      return;
    }
    setAppliedCoupon(result.coupon!);
    toast.success(`Cupom ${result.coupon!.code} aplicado!`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="text-center py-24">
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-muted/50 to-muted mb-8">
            <Truck className="h-12 w-12 text-muted-foreground/40" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Carrinho vazio</h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Adicione produtos antes de finalizar a compra
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-8 py-3.5 font-semibold hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Explorar produtos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const handleFinish = () => {
    if (!phone.replace(/\D/g, "").startsWith("(") && phone.replace(/\D/g, "").length < 10) {
      return;
    }
    const orders = loadOrders();
    const newOrder: Order = {
      id: generateOrderId(),
      customerId: user?.id || "guest",
      customerName: user?.name || "Cliente visitante",
      customerEmail: user?.email || "guest@example.com",
      customerDocument: docNumber || user?.document || "",
      customerPhone: phone,
      items: cartProducts.map((p) => ({
        productId: p!.id,
        productName: p!.variantLabel ? `${p!.name} (${p!.variantLabel})` : p!.name,
        quantity: p!.quantity,
        price: p!.unitPrice,
        image: p!.image,
      })),
      subtotal: total,
      discount: couponDiscount,
      shippingCost,
      total: orderTotal,
      couponCode: appliedCoupon?.code,
      status: "pending",
      paymentMethod:
        payment === "credit"
          ? "Cartão de crédito"
          : payment === "boleto"
            ? "Boleto bancário"
            : "Pix",
      shippingAddress: `${address}, ${number}${neighborhood ? ` - ${neighborhood}` : ""}${city ? `, ${city}` : ""}${state ? ` - ${state}` : ""}${cep ? ` | CEP: ${cep}` : ""}`,
      latitude: location?.latitude,
      longitude: location?.longitude,
      distributorId: detectedDistributor?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const orderId = newOrder.id;
    orders.push(newOrder);
    saveOrders(orders);
    if (appliedCoupon) {
      incrementCouponUsage(appliedCoupon.id);
    }
    clearCart();
    navigate({ to: "/pedido-confirmado", search: { id: orderId } });
  };

  return (
    <CustomerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground text-sm mt-1">Finalize sua compra em poucos passos</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/40 bg-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20">
                1
              </span>
              <h2 className="font-semibold text-lg">Endereço de entrega</h2>
              {locationDetected && location && (
                <span className="inline-flex items-center gap-1.5 text-xs text-primary ml-auto bg-primary/5 px-2.5 py-1 rounded-full">
                  <Navigation className="h-3 w-3" />
                  {location.city || "Local detectado"}
                </span>
              )}
            </div>

            {deliveryState && (
              <div
                className={`mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium ${
                  freeShipping
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {freeShipping ? (
                  <>
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Frete grátis para a região Nordeste!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>
                      Frete de {formatCurrency(shippingCost)} para fora da região Nordeste
                    </span>
                  </>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                    CEP
                  </label>
                  <div className="relative">
                    <input
                      value={cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      className="w-full h-11 rounded-xl border border-border/40 bg-background pl-3 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {loadingCep && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                    )}
                  </div>
                  {cepError && <p className="text-xs text-destructive mt-1.5">{cepError}</p>}
                  <p className="text-[11px] text-muted-foreground/50 mt-1.5">
                    Digite o CEP para preencher automaticamente
                  </p>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                    Número
                  </label>
                  <input
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="123"
                    className="w-full h-11 rounded-xl border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                  Endereço
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, avenida..."
                  className="w-full h-11 rounded-xl border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                    Bairro
                  </label>
                  <input
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    className="w-full h-11 rounded-xl border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                    Cidade
                  </label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                    Estado
                  </label>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {detectedDistributor && (
            <div className="rounded-2xl border border-border/40 bg-card p-6">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: detectedDistributor.color + "15" }}
                >
                  <Store className="h-5 w-5" style={{ color: detectedDistributor.color }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Entrega pela</p>
                  <p className="text-sm font-semibold text-foreground">
                    {detectedDistributor.name}
                    <span className="text-xs font-normal text-muted-foreground ml-1.5">
                      ({detectedDistributor.city} — {detectedDistributor.state})
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border/40 bg-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20">
                2
              </span>
              <h2 className="font-semibold text-lg">Dados pessoais</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                  Telefone
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(83) 99999-9999"
                  className="w-full h-11 rounded-xl border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-4">
                <div className="w-24">
                  <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                    Tipo
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => {
                      setDocType(e.target.value as DocumentType);
                      setDocNumber("");
                    }}
                    className="w-full h-11 rounded-xl border border-border/40 bg-background pl-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">
                    {docType === "cpf" ? "CPF" : "CNPJ"}
                  </label>
                  <input
                    value={docNumber}
                    onChange={(e) => setDocNumber(formatDoc(e.target.value, docType))}
                    placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                    className="w-full h-11 rounded-xl border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20">
                3
              </span>
              <h2 className="font-semibold text-lg">Pagamento</h2>
            </div>
            <div className="space-y-3">
              {[
                { value: "credit", label: "Cartão de crédito", icon: "💳" },
                { value: "boleto", label: "Boleto bancário", icon: "📄" },
                { value: "pix", label: "Pix", icon: "⚡" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-all ${payment === opt.value ? "border-primary bg-primary/5 shadow-sm shadow-primary/10" : "border-border/40 hover:border-border"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.value}
                    checked={payment === opt.value}
                    onChange={(e) => setPayment(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-sm font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-4 hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            Finalizar compra — {formatCurrency(orderTotal)}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-2xl border border-border/40 bg-card p-6">
            <h3 className="font-semibold text-lg mb-5">Resumo ({totalItems} itens)</h3>
            <div className="space-y-3">
              {cartProducts.map((p) => (
                <div key={`${p!.id}-${p!.variantId || ""}`} className="flex gap-3">
                  <img
                    src={p!.image}
                    alt={p!.name}
                    className="h-16 w-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{p!.name}</div>
                    {p!.variantLabel && (
                      <div className="text-[11px] text-primary font-medium">{p!.variantLabel}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-0.5">Qtd: {p!.quantity}</div>
                    <div className="text-sm font-bold mt-1">
                      {formatCurrency(p!.unitPrice * p!.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border/40 mt-5 pt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600">
                  <span className="flex items-center gap-1.5">
                    Desconto ({appliedCoupon.code})
                    <button onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                  <span className="font-medium">-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                {freeShipping ? (
                  <span className="text-emerald-600 font-semibold">Grátis</span>
                ) : deliveryState ? (
                  <span className="font-medium">{formatCurrency(shippingCost)}</span>
                ) : (
                  <span className="text-muted-foreground">Calcule pelo CEP</span>
                )}
              </div>
              <div className="border-t border-border/40 pt-3 flex justify-between">
                <span className="font-semibold text-lg">Total</span>
                <span className="font-extrabold text-xl tracking-tight">
                  {formatCurrency(orderTotal)}
                </span>
              </div>
            </div>

            {!appliedCoupon && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Cupom de desconto"
                    className="flex-1 h-10 rounded-lg border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponInput.trim()}
                    className="rounded-lg bg-zinc-900 text-white px-4 text-sm font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {couponLoading ? "..." : "Aplicar"}
                  </button>
                </div>
                {couponError && <p className="text-xs text-destructive mt-1.5">{couponError}</p>}
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mt-5 text-xs text-muted-foreground bg-muted/30 rounded-xl py-2.5">
              <Truck className="h-3.5 w-3.5" />
              {freeShipping
                ? `Frete grátis para ${deliveryState}`
                : "Frete grátis para a região Nordeste"}
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
