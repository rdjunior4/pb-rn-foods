import { createFileRoute } from "@tanstack/react-router";
import { loadStore, saveStore, generateId } from "@/lib/admin-store";
import { useState, useEffect } from "react";
import { Image, Plus, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";
import type { Banner } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/banners")({
  component: AdminBanners,
});

function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("/categoria/mercearia");
  const [image, setImage] = useState("");

  useEffect(() => {
    setBanners(loadStore().banners);
  }, []);

  const refresh = () => {
    setBanners(loadStore().banners);
  };

  const resetForm = () => {
    setTitle("");
    setSubtitle("");
    setLink("/categoria/mercearia");
    setImage("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (b: Banner) => {
    setTitle(b.title);
    setSubtitle(b.subtitle);
    setLink(b.link);
    setImage(b.image);
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    const store = loadStore();
    const now = new Date().toISOString();

    if (editingId) {
      const idx = store.banners.findIndex((b) => b.id === editingId);
      if (idx !== -1) {
        store.banners[idx] = {
          ...store.banners[idx],
          title,
          subtitle,
          link,
          image: image || `https://picsum.photos/seed/banner-${Date.now()}/1200/400`,
        };
      }
    } else {
      const newBanner: Banner = {
        id: generateId(),
        title,
        subtitle,
        image: image || `https://picsum.photos/seed/banner-${Date.now()}/1200/400`,
        link,
        active: true,
        order: store.banners.length,
        createdAt: now,
      };
      store.banners.push(newBanner);
    }

    saveStore(store);
    refresh();
    resetForm();
    toast.success(editingId ? "Banner atualizado" : "Banner criado");
  };

  const handleDelete = (id: string) => {
    const store = loadStore();
    store.banners = store.banners.filter((b) => b.id !== id);
    saveStore(store);
    refresh();
    toast.success("Banner removido");
  };

  const toggleActive = (id: string) => {
    const store = loadStore();
    const idx = store.banners.findIndex((b) => b.id === id);
    if (idx !== -1) {
      store.banners[idx].active = !store.banners[idx].active;
      saveStore(store);
      refresh();
    }
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const store = loadStore();
    [store.banners[idx], store.banners[idx - 1]] = [store.banners[idx - 1], store.banners[idx]];
    store.banners.forEach((b, i) => (b.order = i));
    saveStore(store);
    refresh();
  };

  const moveDown = (idx: number) => {
    const store = loadStore();
    if (idx === store.banners.length - 1) return;
    [store.banners[idx], store.banners[idx + 1]] = [store.banners[idx + 1], store.banners[idx]];
    store.banners.forEach((b, i) => (b.order = i));
    saveStore(store);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Banners</h1>
          <p className="text-sm text-zinc-500 mt-1">{banners.length} banners cadastrados</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo banner
          </button>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            {editingId ? "Editar banner" : "Novo banner"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Subtítulo</label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Link</label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">URL da imagem</label>
              <input
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              className="bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
            >
              {editingId ? "Salvar alterações" : "Criar banner"}
            </button>
            <button
              onClick={resetForm}
              className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {banners.length === 0 && !showForm ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <Image className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">Nenhum banner cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className={`rounded-xl border bg-white p-4 sm:p-5 flex items-start gap-4 ${
                !b.active ? "opacity-50" : ""
              }`}
            >
              <div className="flex flex-col items-center gap-0.5 pt-1">
                <button
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="h-5 w-5 flex items-center justify-center text-zinc-300 hover:text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </button>
                <GripVertical className="h-4 w-4 text-zinc-300" />
                <button
                  onClick={() => moveDown(idx)}
                  disabled={idx === banners.length - 1}
                  className="h-5 w-5 flex items-center justify-center text-zinc-300 hover:text-zinc-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>

              <div className="h-16 w-28 shrink-0 rounded-lg overflow-hidden bg-zinc-100">
                <img src={b.image} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/400x150/e2e8f0/94a3b8?text=Sem+imagem"; }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-zinc-900 text-sm truncate">{b.title}</div>
                {b.subtitle && <div className="text-xs text-zinc-400 truncate mt-0.5">{b.subtitle}</div>}
                <div className="text-xs text-zinc-300 mt-1">Link: {b.link}</div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => toggleActive(b.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                  title={b.active ? "Desativar" : "Ativar"}
                >
                  {b.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => handleEdit(b)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors text-xs font-medium"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
