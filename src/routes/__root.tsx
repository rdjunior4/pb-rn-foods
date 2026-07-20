import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { StoreProvider } from "../lib/store-provider";
import { Toaster } from "../components/ui/sonner";
import { initSentry, captureError, Sentry } from "../lib/sentry";
import { CookieConsent } from "../components/CookieConsent";

if (typeof document !== "undefined") {
  initSentry();
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-5xl sm:text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  captureError(error, {
    source: "router_error_boundary",
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro ao carregar esta página. Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PB&RN Foods" },
      {
        name: "description",
        content:
          "Distribuidora de alimentos B2B — variedade, marcas selecionadas e logística eficiente para o seu negócio.",
      },
      { name: "author", content: "PB&RN Foods" },
      { property: "og:title", content: "PB&RN Foods — Atacado para o seu negócio" },
      {
        property: "og:description",
        content:
          "Abastecimento inteligente para o seu negócio. Compre no atacado com condições exclusivas para CNPJ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "PB&RN Foods — Atacado para o seu negócio" },
      {
        name: "twitter:description",
        content:
          "Abastecimento inteligente para o seu negócio. Compre no atacado com condições exclusivas para CNPJ.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1d65dc3e-abe4-4b60-a310-8c213ea696af/id-preview-cb3adfe7--c0854f59-cd86-4874-9169-1a754d5395b1.lovable.app-1780186866072.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1d65dc3e-abe4-4b60-a310-8c213ea696af/id-preview-cb3adfe7--c0854f59-cd86-4874-9169-1a754d5395b1.lovable.app-1780186866072.png",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        <Sentry.ErrorBoundary
          fallback={({ error, resetError }) => (
            <div className="flex min-h-screen items-center justify-center bg-background px-4">
              <div className="max-w-md text-center">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  Algo deu errado
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ocorreu um erro inesperado. Nossa equipe foi notificada.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={resetError}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Tentar novamente
                  </button>
                  <a
                    href="/"
                    className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                  >
                    Voltar ao início
                  </a>
                </div>
              </div>
            </div>
          )}
        >
          {children}
        </Sentry.ErrorBoundary>
        <Scripts />
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <Outlet />
        <CookieConsent />
      </StoreProvider>
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      )}
    </QueryClientProvider>
  );
}
