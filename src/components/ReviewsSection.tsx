import { useState, useEffect, useMemo } from "react";
import { Star, ThumbsUp, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getReviewsByProduct, addReview } from "@/lib/admin-store";
import { generateId } from "@/lib/admin-store";
import type { ProductReview } from "@/lib/types";
import { toast } from "sonner";

interface ReviewsSectionProps {
  productId: string;
}

function formatDateBR(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { user, isLoggedIn } = useAuth();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    setReviews(getReviewsByProduct(productId));
  }, [productId]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((r) => { dist[5 - r.rating]++; });
    return dist;
  }, [reviews]);

  const userAlreadyReviewed = useMemo(() => {
    if (!user) return false;
    return reviews.some((r) => r.userId === user.id);
  }, [reviews, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!comment.trim()) {
      toast.error("Escreva um comentário");
      return;
    }
    const review: ProductReview = {
      id: generateId(),
      productId,
      userId: user.id,
      userName: user.name,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    addReview(review);
    setReviews(getReviewsByProduct(productId));
    setComment("");
    setRating(5);
    setShowForm(false);
    toast.success("Avaliação publicada!");
  };

  return (
    <section className="mt-14">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-bold">Avaliações</h2>
        {reviews.length > 0 && (
          <span className="text-sm text-muted-foreground">({reviews.length})</span>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border border-border/40 bg-muted/30 p-8 text-center">
          <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Ainda não há avaliações para este produto</p>
          {isLoggedIn && !userAlreadyReviewed && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors"
            >
              <Star className="h-4 w-4" />
              Avaliar produto
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-[260px_1fr] gap-8">
          <div>
            <div className="rounded-2xl border border-border/40 bg-card p-6 text-center">
              <div className="text-4xl font-extrabold">{avgRating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">{reviews.length} avaliação(ões)</p>
            </div>
            <div className="mt-4 space-y-1.5">
              {ratingDistribution.map((count, i) => {
                const star = 5 - i;
                const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-muted-foreground">{star}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-right text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
            {isLoggedIn && !userAlreadyReviewed && (
              <button
                onClick={() => setShowForm(true)}
                className="w-full mt-4 rounded-lg border border-primary text-primary px-4 py-2 text-sm font-medium hover:bg-primary/5 transition-colors"
              >
                Avaliar produto
              </button>
            )}
          </div>

          <div className="space-y-4">
            {showForm && (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                <h3 className="font-semibold mb-3">Sua avaliação</h3>
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                    >
                      <Star
                        className={`h-7 w-7 transition-transform hover:scale-110 ${
                          s <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-zinc-200"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm font-medium text-muted-foreground">{rating} estrela{rating !== 1 ? "s" : ""}</span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte sua experiência com o produto..."
                  rows={3}
                  className="w-full rounded-lg border border-border/40 bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                />
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-lg border border-border/40 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors">
                    Publicar
                  </button>
                </div>
              </form>
            )}

            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border/40 bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary shrink-0">
                    {review.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{review.userName}</span>
                      <span className="text-xs text-muted-foreground">{formatDateBR(review.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-zinc-200"}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
