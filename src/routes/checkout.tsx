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
import { useProducts, useAdminDistributors, useCustomerAddresses, useCustomerPayments } from "@/lib/hooks";
import { saveOrders, loadOrders, generateOrderId, validateCoupon, incrementCouponUsage, decrementStockForOrder, syncFromSupabase } from "@/lib/admin-store";
import { isSupabaseConfigured } from "@/lib/supabase";
import { apiSaveOrder, apiDecrementStock, apiValidateCoupon, apiIncrementCouponUsage, apiCreateOrderAtomic } from "@/lib/api";
import type { Order, Coupon, CustomerAddress, SavedPaymentMethod } from "@/lib/types";
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
import { findDistributorForPoint, findDistributorForCity } from "@/lib/distributor-utils";
import { carriers, ZERO_FEE_CARRIERS } from "@/lib/constants";
import { Store, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: allProducts = [] } = useProducts();
  const { data: allDistributors = [] } = useAdminDistributors();
  const { data: savedAddresses = [] } = useCustomerAddresses(user?.id);
  const { data: savedPayments = [] } = useCustomerPayments(user?.id);
  const productMap = new Map(allProducts.map((p) => [p.id, p]));

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showSavedAddress, setShowSavedAddress] = useState(true);
  const [showSavedPayment, setShowSavedPayment] = useState(true);

  const cartProducts = items
    .map((item) => {
      const product = productMap.get(item.productId);
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
  const carrierZeroFee = ZERO_FEE_CARRIERS.includes(selectedCarrier);
  const shippingCost = freeShipping || carrierZeroFee ? 0 : 15.9;
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percent") return (total * appliedCoupon.value) / 100;
    if (appliedCoupon.type === "fixed") return Math.min(appliedCoupon.value, total);
    return 0;
  }, [appliedCoupon, total]);
  const orderTotal = Math.max(0, total - couponDiscount + shippingCost);

  const distributors = useMemo(() => allDistributors.filter((d) => d.active), [allDistributors]);
  const detectedDistributor = useMemo(() => {
    const cityName = city || location?.city;
    if (location?.latitude && location?.longitude) {
      return findDistributorForPoint(
        { lat: location.latitude, lng: location.longitude },
        distributors,
        cityName,
      );
    }
    if (cityName) {
      return findDistributorForCity(cityName, distributors);
    }
    return null;
  }, [location, distributors, city]);

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

  // Auto-select default address
  useEffect(() => {
    if (savedAddresses.length > 0 && !selectedAddressId) {
      const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
      if (def) {
        setSelectedAddressId(def.id);
        setCep(def.cep);
        setAddress(def.street);
        setNumber(def.number);
        setNeighborhood(def.neighborhood);
        setCity(def.city);
        setState(def.state);
      }
    }
  }, [savedAddresses, selectedAddressId]);

  // Auto-select default payment
  useEffect(() => {
    if (savedPayments.length > 0 && !selectedPaymentId) {
      const def = savedPayments.find((p) => p.isDefault) || savedPayments[0];
      if (def) {
        setSelectedPaymentId(def.id);
        setPayment(def.paymentType === "credit" ? "credit" : def.paymentType === "debit" ? "credit" : def.paymentType === "pix" ? "pix" : "boleto");
      }
    }
  }, [savedPayments, selectedPaymentId]);

  const handleSelectSavedAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    setCep(addr.cep);
    setAddress(addr.street);
    setNumber(addr.number);
    setNeighborhood(addr.neighborhood);
    setCity(addr.city);
    setState(addr.state);
  };

  const handleSelectSavedPayment = (m: SavedPaymentMethod) => {
    setSelectedPaymentId(m.id);
    setPayment(m.paymentType === "credit" ? "credit" : m.paymentType === "debit" ? "credit" : m.paymentType === "pix" ? "pix" : "boleto");
  };

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

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    let result;
    if (isSupabaseConfigured()) {
      result = await apiValidateCoupon(couponInput, total, user?.id);
    } else {
      result = validateCoupon(couponInput, total, user?.id);
    }
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
          <div className="inline-flex h-24 w-24 items-center justify-center rounded-lg bg-gradient-to-br from-muted/50 to-muted mb-8">
            <Truck className="h-12 w-12 text-muted-foreground/40" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Carrinho vazio</h1>
          <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
            Adicione produtos antes de finalizar a compra
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-8 py-3.5 font-semibold hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Explorar produtos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const phoneDigits = phone.replace(/\D/g, "");
    const docDigits = docNumber.replace(/\D/g, "");
    if (selectedCarrier !== "retirada" && phoneDigits.length < 10) {
      toast.error("Informe um telefone válido com DDD.");
      return;
    }
    if (docDigits.length < 11) {
      toast.error("Informe um CPF ou CNPJ válido.");
      return;
    }
    if (!selectedCarrier) {
      toast.error("Selecione uma forma de recebimento.");
      return;
    }
    if (selectedCarrier === "propria") {
      if (!cep.replace(/\D/g, "")) {
        toast.error("Informe o CEP.");
        return;
      }
      if (!address.trim() || !number.trim()) {
        toast.error("Informe o endereço e o número.");
        return;
      }
      if (!city.trim() || !state.trim()) {
        toast.error("Informe a cidade e o estado.");
        return;
      }
    }

    const orderId = generateOrderId();
    const newOrder: Order = {
      id: orderId,
      customerId: user?.id || "guest",
      customerName: user?.name || "Cliente visitante",
      customerEmail: user?.email || "guest@example.com",
      customerDocument: docDigits || user?.document || "",
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
      shippingAddress: selectedCarrier === "retirada"
        ? "Retirada no local — Rua Example, 123 — Centro, Campina Grande — PB"
        : `${address}, ${number}${neighborhood ? ` - ${neighborhood}` : ""}${city ? `, ${city}` : ""}${state ? ` - ${state}` : ""}${cep ? ` | CEP: ${cep}` : ""}`,
      latitude: location?.latitude,
      longitude: location?.longitude,
      distributorId: detectedDistributor?.id,
      shippingCarrier: selectedCarrier || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const useSupabase = isSupabaseConfigured();

    try {
      if (useSupabase) {
        const result = await apiCreateOrderAtomic(newOrder, appliedCoupon?.id);
        if (!result.ok) {
          toast.error(result.error || "Erro ao processar pedido.");
          return;
        }
      } else {
        const orders = loadOrders();
        orders.push(newOrder);
        saveOrders(orders);
        decrementStockForOrder(
          cartProducts.map((p) => ({
            productId: p!.id,
            variantId: p!.variantId,
            quantity: p!.quantity,
            productName: p!.name,
          })),
          orderId,
        );
        if (appliedCoupon) {
          incrementCouponUsage(appliedCoupon.id);
        }
      }

      if (useSupabase) {
        syncFromSupabase();
      }

      clearCart();
      toast.success("Pedido realizado com sucesso!");
      navigate({ to: "/pedido-confirmado", search: { id: orderId } });
    } catch (err) {
      console.error("[checkout] erro ao salvar pedido:", err);
      toast.error("Erro ao processar pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground text-sm mt-1">Finalize sua compra em poucos passos</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-6">
          {/* ═══════ STEP 1: Como deseja receber? ═══════ */}
          <div className="rounded-lg border border-border/40 bg-card p-6">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 shrink-0">
                1
              </span>
              <h2 className="font-semibold text-base sm:text-lg">Como deseja receber?</h2>
              {selectedCarrier && (
                <span className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                  Frete grátis
                </span>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <label
                className={`relative flex flex-col items-center gap-3 rounded-lg border-2 p-6 cursor-pointer transition-all text-center ${
                  selectedCarrier === "propria"
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-border/40 hover:border-border hover:bg-zinc-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="carrier"
                  value="propria"
                  checked={selectedCarrier === "propria"}
                  onChange={(e) => setSelectedCarrier(e.target.value)}
                  className="sr-only"
                />
                <div className={`h-14 w-14 rounded-lg flex items-center justify-center ${
                  selectedCarrier === "propria" ? "bg-primary/10" : "bg-zinc-100"
                }`}>
                  <Truck className={`h-7 w-7 ${selectedCarrier === "propria" ? "text-primary" : "text-zinc-400"}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Entrega própria</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Receba no seu endereço</div>
                </div>
                {selectedCarrier === "propria" && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </label>

              <label
                className={`relative flex flex-col items-center gap-3 rounded-lg border-2 p-6 cursor-pointer transition-all text-center ${
                  selectedCarrier === "retirada"
                    ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                    : "border-border/40 hover:border-border hover:bg-zinc-50/50"
                }`}
              >
                <input
                  type="radio"
                  name="carrier"
                  value="retirada"
                  checked={selectedCarrier === "retirada"}
                  onChange={(e) => setSelectedCarrier(e.target.value)}
                  className="sr-only"
                />
                <div className={`h-14 w-14 rounded-lg flex items-center justify-center ${
                  selectedCarrier === "retirada" ? "bg-primary/10" : "bg-zinc-100"
                }`}>
                  <Store className={`h-7 w-7 ${selectedCarrier === "retirada" ? "text-primary" : "text-zinc-400"}`} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Retirada no local</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Retire na nossa loja</div>
                </div>
                {selectedCarrier === "retirada" && (
                  <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </label>
            </div>
            {!selectedCarrier && (
              <p className="text-xs text-muted-foreground mt-3 text-center">Escolha uma opção para continuar</p>
            )}
          </div>

          {/* ═══════ STEP 2: Endereço (só para entrega) ═══════ */}
          {selectedCarrier === "propria" && (
            <div className="rounded-lg border border-border/40 bg-card p-6">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 shrink-0">
                  2
                </span>
                <h2 className="font-semibold text-base sm:text-lg">Endereço de entrega</h2>
                {locationDetected && location && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary ml-auto bg-primary/5 px-2.5 py-1 rounded-full">
                    <Navigation className="h-3 w-3" />
                    {location.city || "Local detectado"}
                  </span>
                )}
              </div>

              {/* Saved addresses */}
              {savedAddresses.length > 0 && (
                <div className="mb-5">
                  <button onClick={() => setShowSavedAddress(!showSavedAddress)} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors">
                    Endereços salvos
                    {showSavedAddress ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {showSavedAddress && (
                    <div className="space-y-2">
                      {savedAddresses.map((addr) => (
                        <label key={addr.id} className={`flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-all ${selectedAddressId === addr.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"}`}>
                          <input type="radio" name="savedAddress" checked={selectedAddressId === addr.id} onChange={() => handleSelectSavedAddress(addr)} className="mt-0.5 accent-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold">{addr.label}</span>
                              {addr.isDefault && <span className="text-[10px] font-semibold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">Padrao</span>}
                            </div>
                            <p className="text-xs text-muted-foreground">{addr.street}{addr.number ? `, ${addr.number}` : ""}{addr.neighborhood ? ` - ${addr.neighborhood}` : ""}{addr.city ? `, ${addr.city}` : ""}{addr.state ? ` - ${addr.state}` : ""} | CEP: {addr.cep}</p>
                          </div>
                        </label>
                      ))}
                      <button onClick={() => { setSelectedAddressId(null); setShowSavedAddress(false); }} className="text-xs text-primary font-semibold hover:underline mt-1">
                        Usar novo endereco
                      </button>
                    </div>
                  )}
                </div>
              )}

              {deliveryState && (
                <div
                  className={`mb-5 flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium ${
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
                      <span>Frete de {formatCurrency(shippingCost)} para fora da região Nordeste</span>
                    </>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">CEP</label>
                    <div className="relative">
                      <input
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        placeholder="00000-000"
                        className="w-full h-11 rounded-lg border border-border/40 bg-background pl-3 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {loadingCep && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                      )}
                    </div>
                    {cepError && <p className="text-xs text-destructive mt-1.5">{cepError}</p>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Número</label>
                    <input
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="123"
                      className="w-full h-11 rounded-lg border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Endereço</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Rua, avenida..."
                    className="w-full h-11 rounded-lg border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Bairro</label>
                    <input
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Bairro"
                      className="w-full h-11 rounded-lg border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Cidade</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-11 rounded-lg border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Estado</label>
                    <input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full h-11 rounded-lg border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {detectedDistributor && (
                <div className="mt-4 rounded-lg bg-primary/5 border border-primary/10 p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: detectedDistributor.color + "15" }}
                    >
                      <Store className="h-4 w-4" style={{ color: detectedDistributor.color }} />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Entrega pela</p>
                      <p className="text-xs font-semibold text-foreground">
                        {detectedDistributor.name}
                        <span className="text-[11px] font-normal text-muted-foreground ml-1.5">
                          ({detectedDistributor.city} — {detectedDistributor.state})
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══════ STEP 2: Informações de retirada ═══════ */}
          {selectedCarrier === "retirada" && (
            <div className="rounded-lg border border-border/40 bg-card p-6">
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 shrink-0">
                  2
                </span>
                <h2 className="font-semibold text-base sm:text-lg">Retirada no local</h2>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-emerald-800">Retire seu pedido na loja</p>
                    <div className="text-xs text-emerald-700 space-y-1">
                      <p><strong>Endereço:</strong> Rua Example, 123 — Centro, Campina Grande — PB</p>
                      <p><strong>Horário:</strong> Segunda a Sexta, das 8h às 18h | Sábado das 8h às 12h</p>
                      <p><strong>Prazo:</strong> Seu pedido ficará pronto em até 24h após a confirmação</p>
                    </div>
                    <p className="text-[11px] text-emerald-600 mt-2">
                      Você receberá uma notificação por e-mail quando seu pedido estiver disponível para retirada.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Nome de quem vai retirar</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="Nome completo"
                  className="w-full h-11 rounded-lg border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          )}

          {/* ═══════ STEP 3: Dados pessoais ═══════ */}
          {selectedCarrier && (
          <div className="rounded-lg border border-border/40 bg-card p-6">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 shrink-0">
                {selectedCarrier === "retirada" ? "3" : "3"}
              </span>
              <h2 className="font-semibold text-base sm:text-lg">Dados pessoais</h2>
            </div>
            <div className="space-y-4">
              {selectedCarrier === "propria" && (
                <div>
                  <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Telefone</label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="(83) 99999-9999"
                    className="w-full h-11 rounded-lg border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              )}
              <div className="grid grid-cols-[auto_1fr] gap-4">
                <div className="w-24">
                  <label className="text-xs font-semibold mb-1.5 block text-muted-foreground">Tipo</label>
                  <select
                    value={docType}
                    onChange={(e) => {
                      setDocType(e.target.value as DocumentType);
                      setDocNumber("");
                    }}
                    className="w-full h-11 rounded-lg border border-border/40 bg-background pl-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
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
                    className="w-full h-11 rounded-lg border border-border/40 bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* ═══════ STEP 4: Pagamento ═══════ */}
          {selectedCarrier && (
          <div className="rounded-lg border border-border/40 bg-card p-6">
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm shadow-primary/20 shrink-0">
                {selectedCarrier === "retirada" ? "4" : "4"}
              </span>
              <h2 className="font-semibold text-base sm:text-lg">Pagamento</h2>
            </div>

            {/* Saved payment methods */}
            {savedPayments.length > 0 && (
              <div className="mb-5">
                <button onClick={() => setShowSavedPayment(!showSavedPayment)} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 hover:text-foreground transition-colors">
                  Formas salvas
                  {showSavedPayment ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {showSavedPayment && (
                  <div className="space-y-2">
                    {savedPayments.map((m) => (
                      <label key={m.id} className={`flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer transition-all ${selectedPaymentId === m.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"}`}>
                        <input type="radio" name="savedPayment" checked={selectedPaymentId === m.id} onChange={() => handleSelectSavedPayment(m)} className="accent-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold">{m.label}</span>
                            {m.isDefault && <span className="text-[10px] font-semibold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">Padrao</span>}
                          </div>
                          {m.cardLast4 ? (
                            <p className="text-xs text-muted-foreground">{m.cardBrand ? `${m.cardBrand} ` : ""}**** {m.cardLast4}</p>
                          ) : (
                            <p className="text-xs text-muted-foreground">{m.paymentType === "pix" ? "PIX" : m.paymentType === "boleto" ? "Boleto" : "Cartao"}</p>
                          )}
                        </div>
                      </label>
                    ))}
                    <button onClick={() => { setSelectedPaymentId(null); setShowSavedPayment(false); }} className="text-xs text-primary font-semibold hover:underline mt-1">
                      Escolher outra forma
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              {[
                { value: "credit", label: "Cartão de crédito", icon: "💳" },
                { value: "boleto", label: "Boleto bancário", icon: "📄" },
                { value: "pix", label: "Pix", icon: "⚡" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all ${payment === opt.value ? "border-primary bg-primary/5 shadow-sm shadow-primary/10" : "border-border/40 hover:border-border"}`}
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
          )}

          {!detectedDistributor && selectedCarrier === "propria" && city && (
            <div className="flex items-center gap-2.5 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Nenhuma distribuidora atende a sua região. O pedido será processado sem distribuidora definida.
            </div>
          )}

          <button
            onClick={handleFinish}
            disabled={isSubmitting || !selectedCarrier}
            className="w-full rounded-lg bg-primary text-primary-foreground font-semibold py-4 hover:bg-primary-hover transition-all active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {selectedCarrier === "retirada" ? "Confirmar pedido" : "Finalizar compra"} — {formatCurrency(orderTotal)}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-lg border border-border/40 bg-card p-6">
            <h3 className="font-semibold text-lg mb-5">Resumo ({totalItems} itens)</h3>
            <div className="space-y-3">
              {cartProducts.map((p) => (
                <div key={`${p!.id}-${p!.variantId || ""}`} className="flex gap-3">
                  <img
                    src={p!.image}
                    alt={p!.name}
                    className="h-16 w-16 rounded-lg object-cover shrink-0"
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
            <div className="flex items-center justify-center gap-2 mt-5 text-xs text-muted-foreground bg-muted/30 rounded-lg py-2.5">
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
