import { getSupabase, isSupabaseConfigured } from "../supabase";
import type { ProductReview } from "../types";

export async function apiGetReviewsByProduct(productId: string): Promise<ProductReview[]> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    productId: r.product_id as string,
    userId: r.user_id as string,
    userName: r.user_name as string,
    rating: Number(r.rating),
    comment: r.comment as string,
    createdAt: r.created_at as string,
  }));
}

export async function apiAddReview(review: Omit<ProductReview, "id" | "createdAt">): Promise<ProductReview | null> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from("product_reviews")
    .insert({
      product_id: review.productId,
      user_id: review.userId,
      user_name: review.userName,
      rating: review.rating,
      comment: review.comment,
    })
    .select("*")
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    productId: data.product_id,
    userId: data.user_id,
    userName: data.user_name,
    rating: Number(data.rating),
    comment: data.comment,
    createdAt: data.created_at,
  };
}

export async function apiDeleteReview(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || !isSupabaseConfigured()) return;
  await supabase.from("product_reviews").delete().eq("id", id);
}
