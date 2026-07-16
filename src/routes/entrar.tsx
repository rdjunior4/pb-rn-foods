import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/entrar")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: ((search.tab as string) || "login") as "login" | "register",
    redirect: (search.redirect as string) || "/",
  }),
  component: EntrarPage,
});

function EntrarPage() {
  const navigate = useNavigate();
  const { tab, redirect } = Route.useSearch();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      navigate({ to: redirect, replace: true });
    }
  }, [isLoggedIn, navigate, redirect]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AuthModal
        open={true}
        onClose={() => navigate({ to: redirect, replace: true })}
        initialTab={tab}
      />
    </div>
  );
}
