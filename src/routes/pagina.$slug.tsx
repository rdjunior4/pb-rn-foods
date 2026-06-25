import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getPage } from "@/lib/pages-store";
import { sanitizeHtml } from "@/lib/sanitize";
import { CustomerLayout } from "@/components/CustomerLayout";

export const Route = createFileRoute("/pagina/$slug")({
  component: StaticPageView,
});

function StaticPageView() {
  const { slug } = Route.useParams();
  const page = getPage(slug);

  if (!page) {
    return (
      <CustomerLayout maxWidth="800">
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
          <Link to="/" className="text-primary hover:underline">Voltar ao início</Link>
        </div>
      </CustomerLayout>
    );
  }

  const html = sanitizeHtml(
    page.content
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-8 mb-3">$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .split("\n\n")
      .map((block) => {
        if (block.startsWith("<h")) return block;
        return `<p class="text-sm text-muted-foreground leading-relaxed mb-3">${block.replace(/\n/g, "<br/>")}</p>`;
      })
      .join("\n")
  );

  return (
    <CustomerLayout maxWidth="800">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" />
        Voltar ao início
      </Link>
      <div className="rounded-2xl border border-border/40 bg-card p-8 sm:p-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </CustomerLayout>
  );
}
