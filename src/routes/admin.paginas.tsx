import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { FileText, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { loadPages, apiSavePage, apiDeletePage } from "@/lib/pages-store";
import type { StaticPage } from "@/lib/pages-store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/paginas")({
  component: PagesAdminPage,
});

function PagesAdminPage() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [editing, setEditing] = useState<StaticPage | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPages(loadPages());
  }, []);

  const refresh = () => setPages(loadPages());

  const handleSave = async (page: StaticPage) => {
    setSaving(true);
    try {
      await apiSavePage(page);
      refresh();
      setEditing(null);
      toast.success("Página salva!");
    } catch {
      toast.error("Erro ao salvar página.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteSlug) return;
    try {
      await apiDeletePage(deleteSlug);
      refresh();
      setDeleteSlug(null);
      toast.success("Página excluída!");
    } catch {
      toast.error("Erro ao excluir página.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Páginas</h1>
          <p className="text-sm text-zinc-500 mt-1">{pages.length} página(s) cadastrada(s)</p>
        </div>
        <button
          onClick={() => setEditing({ slug: "", title: "", content: "", updatedAt: new Date().toISOString() })}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova página
        </button>
      </div>

      <div className="grid gap-3">
        {pages.map((page) => (
          <div key={page.slug} className="flex items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-zinc-900 text-sm">{page.title}</div>
              <div className="text-xs text-zinc-500">
                /pagina/{page.slug} • Atualizada em {new Date(page.updatedAt).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <button
              onClick={() => setEditing({ ...page })}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDeleteSlug(page.slug)}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <PageEditor page={editing} onClose={() => setEditing(null)} onSave={handleSave} saving={saving} />
      )}

      {deleteSlug && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={() => setDeleteSlug(null)}>
          <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-zinc-900">Excluir página?</h3>
            </div>
            <p className="text-sm text-zinc-500 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteSlug(null)} className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50">
                Cancelar
              </button>
              <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-red-600">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PageEditor({ page, onClose, onSave, saving }: { page: StaticPage; onClose: () => void; onSave: (p: StaticPage) => void; saving: boolean }) {
  const [slug, setSlug] = useState(page.slug);
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim() || !title.trim()) {
      toast.error("Preencha slug e título");
      return;
    }
    onSave({
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      title: title.trim(),
      content,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <h2 className="font-bold text-zinc-900 text-lg">{page.slug ? "Editar página" : "Nova página"}</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-zinc-100">
            <X className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Slug (URL)</label>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="sobre"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
              <p className="text-[11px] text-zinc-400 mt-1">URL: /pagina/{slug || "..."}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sobre nós"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1.5 block">Conteúdo (Markdown simplificado)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={18}
              placeholder="## Título da seção&#10;&#10;Texto do parágrafo..."
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-mono outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none"
            />
            <p className="text-[11px] text-zinc-400 mt-1">Use ## para títulos, ### para subtítulos, **texto** para negrito</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-zinc-900 text-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-800 inline-flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar página"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
