import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Star, Trash2, Search, Loader2 } from "lucide-react";
import { useAdminReviews, useAdminDeleteReview, useAdminProducts } from "@/lib/hooks";
import type { ProductReview } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/avaliacoes")({
  component: ReviewsAdminPage,
});

function ReviewsAdminPage() {
  const { data: reviews = [], isLoading } = useAdminReviews();
  const { data: products = [] } = useAdminProducts();
  const deleteReviewMutation = useAdminDeleteReview();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(0);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reviews
      .filter((r) => {
        if (filter > 0 && r.rating !== filter) return false;
        if (!q) return true;
        const product = products.find((p) => p.id === r.productId);
        return (
          r.userName.toLowerCase().includes(q) ||
          r.comment.toLowerCase().includes(q) ||
          (product?.name.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reviews, search, filter, products]);

  const handleDelete = (id: string) => {
    deleteReviewMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Avaliação removida!");
      },
    });
  };

  const productName = (productId: string) => {
    const p = products.find((p) => p.id === productId);
    return p?.name || "Produto removido";
  };

  return (
    <div>
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
        </div>
      )}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Avaliações</h1>
        <p className="text-sm text-zinc-500 mt-1">{reviews.length} avaliação(ões) no total</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por produto, cliente ou comentário..."
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          {[0, 5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                filter === s ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {s === 0 ? "Todas" : `${s}★`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Star className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">Nenhuma avaliação encontrada</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((review) => (
            <div key={review.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600 shrink-0">
                  {review.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-sm text-zinc-900">{review.userName}</span>
                      <span className="text-xs text-zinc-400 ml-2">
                        {new Date(review.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">{productName(review.productId)}</p>
                  <p className="text-sm text-zinc-600 mt-2 leading-relaxed">{review.comment}</p>
                </div>
                <button
                  onClick={() => handleDelete(review.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
