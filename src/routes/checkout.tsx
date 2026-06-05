import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MapPin, CreditCard, Truck } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { getProductById } from "@/lib/data";
import { TopBar } from "@/components/TopBar";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, clearCart, totalItems } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("João Pessoa");
  const [state, setState] = useState("PB");
  const [payment, setPayment] = useState("credit");

  const cartProducts = items
    .map((item) => {
      const product = getProductById(item.productId);
      return product ? { ...product, quantity: item.quantity } : null;
    })
    .filter(Boolean);

  const total = cartProducts.reduce((sum, p) => sum + p!.price * p!.quantity, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar /><Header />
        <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-16 text-center">
          <h1 className="text-2xl font-bold">Carrinho vazio</h1>
          <Link to="/" className="text-primary hover:underline mt-2 inline-block">Adicionar produtos</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const handleFinish = () => {
    clearCart();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                <h2 className="font-semibold">Endereço de entrega</h2>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">CEP</label>
                    <input value={cep} onChange={(e) => setCep(e.target.value)} placeholder="58000-000" className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Número</label>
                    <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="123" className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Endereço</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, avenida..." className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="text-xs font-medium mb-1 block">Bairro</label>
                    <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Cidade</label>
                    <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Estado</label>
                    <input value={state} onChange={(e) => setState(e.target.value)} className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                <h2 className="font-semibold">Pagamento</h2>
              </div>
              <div className="space-y-3">
                {[
                  { value: "credit", label: "Cartão de crédito" },
                  { value: "boleto", label: "Boleto bancário" },
                  { value: "pix", label: "Pix" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${payment === opt.value ? "border-primary bg-primary/5" : "border-border"}`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={opt.value}
                      checked={payment === opt.value}
                      onChange={(e) => setPayment(e.target.value)}
                      className="accent-primary"
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3.5 hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
            >
              Finalizar compra — R$ {total.toFixed(2)}
            </button>
          </div>

          <div className="lg:sticky lg:top-24 h-fit">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Resumo ({totalItems} itens)</h3>
              <div className="space-y-3">
                {cartProducts.map((p) => (
                  <div key={p!.id} className="flex gap-3">
                    <img src={p!.image} alt={p!.name} className="h-14 w-14 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{p!.name}</div>
                      <div className="text-xs text-muted-foreground">Qtd: {p!.quantity}</div>
                      <div className="text-sm font-semibold mt-0.5">R$ {(p!.price * p!.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frete</span>
                  <span className="text-primary font-medium">Grátis</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                <Truck className="h-3 w-3" />
                Frete grátis para João Pessoa
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
