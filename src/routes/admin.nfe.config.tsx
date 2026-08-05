import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save, Building2, MapPin, Hash } from "lucide-react";
import { getNfeConfig, saveNfeConfig } from "@/lib/nfe-store";
import { toast } from "sonner";
import type { NfeConfig } from "@/lib/types";
import { SELECT_CLASSES } from "@/lib/constants";

export const Route = createFileRoute("/admin/nfe/config")({
  component: AdminNfeConfig,
});

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const inputClass = "w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

function AdminNfeConfig() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<NfeConfig>(() => getNfeConfig());

  const update = (field: string, value: string) => {
    setConfig((prev) => {
      if (field.startsWith("endereco.")) {
        const key = field.split(".")[1];
        return { ...prev, endereco: { ...prev.endereco, [key]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSave = () => {
    saveNfeConfig(config);
    toast.success("Configurações fiscais salvas!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/nfe"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Configuração Fiscal</h1>
          <p className="text-sm text-zinc-500 mt-1">Dados da empresa emissora de NF-e</p>
        </div>
      </div>

      {/* Empresa */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
            <Building2 className="h-4 w-4 text-zinc-600" />
          </span>
          <h2 className="text-sm font-semibold text-zinc-900">Dados da Empresa</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">CNPJ *</label>
            <input
              value={config.cnpj}
              onChange={(e) => update("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Razão Social *</label>
            <input
              value={config.razaoSocial}
              onChange={(e) => update("razaoSocial", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nome Fantasia</label>
            <input
              value={config.nomeFantasia}
              onChange={(e) => update("nomeFantasia", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Inscrição Estadual *</label>
            <input
              value={config.ie}
              onChange={(e) => update("ie", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Inscrição Municipal</label>
            <input
              value={config.im}
              onChange={(e) => update("im", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">CRT (Regime Tributário) *</label>
            <select
              value={config.crt}
              onChange={(e) => update("crt", e.target.value)}
              className={SELECT_CLASSES.admin}
            >
              <option value="1">1 — Lucro Real</option>
              <option value="2">2 — Lucro Presumido</option>
              <option value="3">3 — Simples Nacional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Telefone</label>
            <input
              value={config.telefone}
              onChange={(e) => update("telefone", e.target.value)}
              placeholder="(00) 00000-0000"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email NF-e</label>
            <input
              value={config.emailNfe}
              onChange={(e) => update("emailNfe", e.target.value)}
              type="email"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
            <MapPin className="h-4 w-4 text-zinc-600" />
          </span>
          <h2 className="text-sm font-semibold text-zinc-900">Endereço Fiscal</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Rua / Logradouro *</label>
            <input
              value={config.endereco.rua}
              onChange={(e) => update("endereco.rua", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Número *</label>
            <input
              value={config.endereco.numero}
              onChange={(e) => update("endereco.numero", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Bairro *</label>
            <input
              value={config.endereco.bairro}
              onChange={(e) => update("endereco.bairro", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Cidade *</label>
            <input
              value={config.endereco.cidade}
              onChange={(e) => update("endereco.cidade", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">UF *</label>
            <select
              value={config.endereco.uf}
              onChange={(e) => update("endereco.uf", e.target.value)}
              className={SELECT_CLASSES.admin}
            >
              {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">CEP *</label>
            <input
              value={config.endereco.cep}
              onChange={(e) => update("endereco.cep", e.target.value)}
              placeholder="00000-000"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Numeração */}
      <div className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100">
            <Hash className="h-4 w-4 text-zinc-600" />
          </span>
          <h2 className="text-sm font-semibold text-zinc-900">Numeração NF-e</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Série</label>
            <input
              type="number"
              value={config.serie}
              onChange={(e) => update("serie", e.target.value)}
              className={inputClass}
              min={1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Próximo Número</label>
            <input
              type="number"
              value={config.proximoNumero}
              onChange={(e) => update("proximoNumero", e.target.value)}
              className={inputClass}
              min={1}
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end gap-3">
        <Link
          to="/admin/nfe"
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          Cancelar
        </Link>
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 text-white text-sm font-semibold px-6 py-2.5 hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Save className="h-4 w-4" />
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}
