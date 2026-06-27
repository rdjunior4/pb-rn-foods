import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { useAdminStore, useSaveDistributor, useDeleteDistributor, useToggleDistributor } from "@/lib/hooks";
import { generateId } from "@/lib/admin-store";
import { SELECT_CLASSES } from "@/lib/constants";
import type { Distributor, CoverageMode } from "@/lib/types";
import {
  MapContainer,
  TileLayer,
  Circle,
} from "react-leaflet";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  Save,
  MapPin,
  CheckCircle2,
  CircleDot,
  Loader2,
  Crosshair,
  X,
  Search,
} from "lucide-react";
import { fetchViaCEP, formatCEP, detectIPLocation } from "@/lib/location";
import { geocodeAddress, searchAddresses, type SearchResult } from "@/lib/geocode";
import { PinMarker } from "@/components/admin/PinMarker";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/admin/distribuidoras")({
  component: AdminDistribuidoras,
});

const NORtheastCities = [
  "João Pessoa", "Campina Grande", "Santa Rita", "Patos", "Bayeux", "Sousa",
  "Cajazeiras", "Guarabira", "Sapé", "Queimadas", "Lagoa Seca", "Esperança",
  "Natal", "Mossoró", "Parnamirim", "São Gonçalo do Amarante", "Macaíba",
  "Ceará-Mirim", "Açu", "Currais Novos", "São José de Mipibu", "Caicó",
  "Touros", "São Tomé", "Lajes", "Barra de Camaã", "Portalegre",
  "Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru", "Petrolina",
  "Paulista", "Cabo de Santo Agostinho", "Camaragibe", "Goiana",
  "Salvador", "Feira de Santana", "Vitória da Conquista", "Camaçari",
  "Lauro de Freitas", "Itabuna", "Juazeiro", "Teixeira de Freitas",
  "Barreiras", "Alagoinhas", "Porto Seguro", "Simões Filho",
  "Maceió", "Arapiraca", "Rio Largo", "Penedo", "Delmiro Gouveia",
  "Aracaju", "Nossa Senhora do Socorro", "Lagarto", "Itabaiana",
  "São Luís", "Imperatriz", "São José de Ribamar", "Timon", "Caxias",
  "Teresina", "Timon", "Parnaíba", "Picos", "Piripiri",
];

function AdminDistribuidoras() {
  const { data: store, isLoading } = useAdminStore();
  const saveDistributorMutation = useSaveDistributor();
  const deleteDistributorMutation = useDeleteDistributor();
  const toggleDistributorMutation = useToggleDistributor();

  const [editing, setEditing] = useState<Distributor | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [color, setColor] = useState("#ef4444");
  const [coverageMode, setCoverageMode] = useState<CoverageMode>("radius");
  const [coverageRadiusKm, setCoverageRadiusKm] = useState("100");
  const [coverageCities, setCoverageCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState("");

  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingGeocode, setLoadingGeocode] = useState(false);

  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<SearchResult[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [showAddressResults, setShowAddressResults] = useState(false);
  const addressRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setName("");
    setCep("");
    setAddress("");
    setCity("");
    setStateUf("");
    setLatitude("");
    setLongitude("");
    setColor("#ef4444");
    setCoverageMode("radius");
    setCoverageRadiusKm("100");
    setCoverageCities([]);
    setCityInput("");
    setAddressQuery("");
    setAddressResults([]);
    setShowAddressResults(false);
    setEditing(null);
    setShowForm(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) {
        setShowAddressResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddressSearch = useCallback(async (query: string) => {
    setAddressQuery(query);
    if (query.length < 3) {
      setAddressResults([]);
      setShowAddressResults(false);
      return;
    }
    setSearchingAddress(true);
    const results = await searchAddresses(query);
    setAddressResults(results);
    setShowAddressResults(results.length > 0);
    setSearchingAddress(false);
  }, []);

  const selectAddress = (result: SearchResult) => {
    setAddress(result.street);
    setCity(result.city);
    setStateUf(result.state);
    if (result.cep) setCep(formatCEP(result.cep));
    setLatitude(String(result.latitude));
    setLongitude(String(result.longitude));
    setAddressQuery(result.street);
    setShowAddressResults(false);
    toast.success("Endereço selecionado");
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (d: Distributor) => {
    setName(d.name);
    setCep(d.cep || "");
    setAddress(d.address || "");
    setCity(d.city);
    setStateUf(d.state);
    setLatitude(String(d.latitude));
    setLongitude(String(d.longitude));
    setColor(d.color);
    setCoverageMode(d.coverageMode || "radius");
    setCoverageRadiusKm(String(d.coverageRadiusKm || 100));
    setCoverageCities([...(d.coverageCities || [])]);
    setCityInput("");
    setAddressQuery(d.address || "");
    setAddressResults([]);
    setShowAddressResults(false);
    setEditing(d);
    setShowForm(true);
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCEP(value);
    setCep(formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) {
      setLoadingCep(true);
      const result = await fetchViaCEP(digits);

      if (result) {
        setAddress(result.street);
        setAddressQuery(result.street);
        setCity(result.city);
        setStateUf(result.state);
        toast.success("Endereço preenchido via CEP");

        const geoResult = await geocodeAddress(`${result.city}, ${result.state}, Brasil`);
        if (geoResult) {
          setLatitude(String(geoResult.latitude));
          setLongitude(String(geoResult.longitude));
        }
      } else {
        const ipLoc = await detectIPLocation();
        if (ipLoc?.city && ipLoc?.state) {
          setCity(ipLoc.city);
          setStateUf(ipLoc.state);
          if (ipLoc.latitude && ipLoc.longitude) {
            setLatitude(String(ipLoc.latitude));
            setLongitude(String(ipLoc.longitude));
          }
          toast.info("CEP não encontrado. Cidade detectada pela internet.");
        } else {
          toast.error("CEP não encontrado. Preencha o endereço manualmente.");
        }
      }

      setLoadingCep(false);
    }
  };

  const handleDetectLocation = async () => {
    setLoadingGeocode(true);
    const ipLoc = await detectIPLocation();
    if (ipLoc?.city && ipLoc?.state) {
      setCity(ipLoc.city);
      setStateUf(ipLoc.state);
      if (ipLoc.latitude && ipLoc.longitude) {
        setLatitude(String(ipLoc.latitude));
        setLongitude(String(ipLoc.longitude));
      }
      toast.success("Localização detectada pela internet");
    } else {
      toast.error("Não foi possível detectar a localização");
    }
    setLoadingGeocode(false);
  };

  const handleGeocodeAddress = useCallback(async () => {
    const query = city && stateUf
      ? `${city}, ${stateUf}, Brasil`
      : address
        ? `${address}, Brasil`
        : "";
    if (!query || query.length < 5) {
      toast.error("Preencha cidade e estado primeiro");
      return;
    }
    setLoadingGeocode(true);
    const result = await geocodeAddress(query);
    setLoadingGeocode(false);

    if (result) {
      setLatitude(String(result.latitude));
      setLongitude(String(result.longitude));
      toast.success("Coordenadas obtidas com sucesso");
    } else {
      toast.error("Não foi possível geocodificar o endereço");
    }
  }, [address, city, stateUf]);

  const addCity = (cityName: string) => {
    const trimmed = cityName.trim();
    if (!trimmed) return;
    if (coverageCities.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Cidade já adicionada");
      return;
    }
    setCoverageCities((prev) => [...prev, trimmed]);
    setCityInput("");
  };

  const removeCity = (idx: number) => {
    setCoverageCities((prev) => prev.filter((_, i) => i !== idx));
  };

  const filteredSuggestions = NORtheastCities.filter(
    (c) =>
      c.toLowerCase().includes(cityInput.toLowerCase()) &&
      !coverageCities.some((cc) => cc.toLowerCase() === c.toLowerCase()) &&
      cityInput.length > 0,
  ).slice(0, 8);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Preencha o nome da distribuidora");
      return;
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Coordenadas inválidas");
      return;
    }
    if (coverageMode === "radius") {
      const radius = parseFloat(coverageRadiusKm);
      if (isNaN(radius) || radius <= 0) {
        toast.error("Informe um raio de cobertura válido");
        return;
      }
      if (radius > 500) {
        toast.error("Raio máximo permitido é 500 km");
        return;
      }
    }
    if (coverageMode === "city" && coverageCities.length === 0) {
      toast.error("Adicione pelo menos uma cidade de cobertura");
      return;
    }
    if (coverageMode === "city" && coverageCities.length > 50) {
      toast.error("Máximo de 50 cidades por distribuidora");
      return;
    }

    const validUFs = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
    const uf = stateUf.trim().toUpperCase();
    if (uf && !validUFs.includes(uf)) {
      toast.error("UF inválida. Use uma sigla de estado brasileiro");
      return;
    }

    if (editing) {
      saveDistributorMutation.mutate({
        ...editing,
        name: name.trim(),
        city: city.trim() || editing.city,
        state: stateUf.trim().toUpperCase() || editing.state,
        address: address.trim(),
        cep: cep.replace(/\D/g, ""),
        latitude: lat,
        longitude: lng,
        color,
        coverageMode,
        coverageRadiusKm: parseFloat(coverageRadiusKm) || 100,
        coverageCities: [...coverageCities],
      }, {
        onSuccess: () => {
          toast.success("Distribuidora atualizada");
          resetForm();
        },
      });
    } else {
      if (!city.trim()) {
        toast.error("Informe a cidade da distribuidora");
        return;
      }
      if (!stateUf.trim()) {
        toast.error("Informe o estado (UF)");
        return;
      }
      saveDistributorMutation.mutate({
        id: generateId(),
        name: name.trim(),
        city: city.trim(),
        state: stateUf.trim().toUpperCase(),
        address: address.trim(),
        cep: cep.replace(/\D/g, ""),
        latitude: lat,
        longitude: lng,
        color,
        coverageMode,
        coverageRadiusKm: parseFloat(coverageRadiusKm) || 100,
        coverageCities: [...coverageCities],
        active: true,
        createdAt: new Date().toISOString(),
      }, {
        onSuccess: () => {
          toast.success("Distribuidora criada");
          resetForm();
        },
      });
    }
  };

  const handleToggle = (id: string) => {
    toggleDistributorMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteDistributorMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Distribuidora removida");
      },
    });
  };

  const center: [number, number] = (() => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    return [-7.5, -36.0];
  })();

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasCoords = !isNaN(lat) && !isNaN(lng);
  const radiusMeters = (parseFloat(coverageRadiusKm) || 0) * 1000;

  const distributors = store?.distributors || [];

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Distribuidoras</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Gerencie as distribuidoras e suas áreas de cobertura
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-zinc-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> Nova distribuidora
        </button>
      </div>

      {!showForm && (
        <div className="grid gap-4 sm:grid-cols-2">
          {distributors.map((d) => (
            <div
              key={d.id}
              className={`bg-white rounded-xl border border-zinc-200 p-5 transition-all hover:shadow-md ${!d.active ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: d.color + "15" }}
                  >
                    <MapPin className="h-5 w-5" style={{ color: d.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">{d.name}</h3>
                    <p className="text-xs text-zinc-500">
                      {d.city} — {d.state}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(d.id)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title={d.active ? "Desativar" : "Ativar"}
                  >
                    {d.active ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <CircleDot className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(d)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                    title="Editar"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-zinc-500 flex-wrap">
                <span>{d.address || "Sem endereço"}</span>
                {d.coverageMode === "radius" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-600 px-2 py-0.5 font-medium">
                    <Crosshair className="h-3 w-3" />
                    Raio {d.coverageRadiusKm} km
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-600 px-2 py-0.5 font-medium">
                    <MapPin className="h-3 w-3" />
                    {d.coverageCities?.length || 0} cidade(s)
                  </span>
                )}
              </div>

              <div className="mt-3 h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: d.active ? "100%" : "0%",
                    backgroundColor: d.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {distributors.length === 0 && !showForm && (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <MapPin className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-zinc-900">Nenhuma distribuidora</p>
          <p className="text-xs text-zinc-400 mt-1">Adicione a primeira distribuidora</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">
              {editing ? "Editar distribuidora" : "Nova distribuidora"}
            </h2>
            <button
              onClick={resetForm}
              className="text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
            >
              Cancelar
            </button>
          </div>

          <div className="p-6 grid gap-5 lg:grid-cols-[1fr_1.5fr]">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Nome</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={SELECT_CLASSES.admin}
                  placeholder="Ex: PB Foods"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">CEP</label>
                <div className="relative">
                  <input
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className={`${SELECT_CLASSES.admin} pr-10`}
                  />
                  {loadingCep && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 animate-spin" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Digite o CEP para preencher endereço, cidade e estado
                </p>
              </div>

              <div className="relative" ref={addressRef}>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Endereço</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    value={addressQuery}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    onFocus={() => addressResults.length > 0 && setShowAddressResults(true)}
                    placeholder="Buscar endereço..."
                    className="w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-10 py-2.5 text-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
                  />
                  {searchingAddress && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 animate-spin" />
                  )}
                  {addressQuery && !searchingAddress && (
                    <button
                      onClick={() => { setAddressQuery(""); setAddressResults([]); setShowAddressResults(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {showAddressResults && addressResults.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {addressResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => selectAddress(r)}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0"
                      >
                        <div className="font-medium text-zinc-900 truncate">{r.street}</div>
                        <div className="text-xs text-zinc-500 truncate">{r.city} — {r.state}{r.cep ? ` · ${r.cep}` : ""}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Cidade</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={SELECT_CLASSES.admin}
                    placeholder="João Pessoa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">UF</label>
                  <input
                    value={stateUf}
                    onChange={(e) => setStateUf(e.target.value.toUpperCase().slice(0, 2))}
                    className={SELECT_CLASSES.admin}
                    placeholder="PB"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className={SELECT_CLASSES.admin}
                    placeholder="-7.12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className={SELECT_CLASSES.admin}
                    placeholder="-34.86"
                  />
                </div>
              </div>

              <button
                onClick={handleDetectLocation}
                disabled={loadingGeocode}
                className="w-full inline-flex items-center justify-center gap-2 border border-zinc-200 text-zinc-700 text-xs font-medium rounded-lg px-3 py-2 hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {loadingGeocode ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <MapPin className="h-3.5 w-3.5" />
                )}
                Detectar minha localização
              </button>

              <button
                onClick={handleGeocodeAddress}
                disabled={loadingGeocode}
                className="w-full inline-flex items-center justify-center gap-2 border border-zinc-200 text-zinc-700 text-xs font-medium rounded-lg px-3 py-2 hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                {loadingGeocode ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Crosshair className="h-3.5 w-3.5" />
                )}
                Obter coordenadas do endereço
              </button>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1.5">Cor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-9 rounded-lg border border-zinc-200 cursor-pointer"
                  />
                  <span className="text-xs text-zinc-500">{color}</span>
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-4">
                <label className="block text-xs font-medium text-zinc-700 mb-2">
                  Área de cobertura
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setCoverageMode("radius")}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                      coverageMode === "radius"
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <Crosshair className="h-3.5 w-3.5 inline mr-1.5" />
                    Raio circular
                  </button>
                  <button
                    onClick={() => setCoverageMode("city")}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors ${
                      coverageMode === "city"
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5 inline mr-1.5" />
                    Por cidade
                  </button>
                </div>

                {coverageMode === "radius" && (
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1.5">
                      Raio de cobertura (km)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={coverageRadiusKm}
                      onChange={(e) => setCoverageRadiusKm(e.target.value)}
                      className={SELECT_CLASSES.admin}
                      placeholder="100"
                    />
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Raio de {coverageRadiusKm || 0} km a partir do centro
                    </p>
                  </div>
                )}

                {coverageMode === "city" && (
                  <div className="relative">
                    <label className="block text-[11px] text-zinc-500 mb-1.5">
                      Cidades atendidas
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={cityInput}
                        onChange={(e) => setCityInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCity(cityInput);
                          }
                        }}
                        placeholder="Digite e pressione Enter"
                        className={`${SELECT_CLASSES.admin} flex-1`}
                      />
                      <button
                        onClick={() => addCity(cityInput)}
                        className="px-3 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {filteredSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-zinc-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {filteredSuggestions.map((c) => (
                          <button
                            key={c}
                            onClick={() => addCity(c)}
                            className="w-full text-left px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    )}

                    {coverageCities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {coverageCities.map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full px-2.5 py-1"
                          >
                            {c}
                            <button
                              onClick={() => removeCity(i)}
                              className="hover:text-emerald-900 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {coverageCities.length === 0 && (
                      <p className="text-[11px] text-zinc-400 mt-2 text-center">
                        Nenhuma cidade adicionada
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleSave}
                className="w-full inline-flex items-center justify-center gap-2 bg-zinc-900 text-white text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-zinc-800 transition-colors"
              >
                <Save className="h-4 w-4" />
                {editing ? "Salvar alterações" : "Criar distribuidora"}
              </button>
            </div>

            <div className="rounded-xl border border-zinc-200 overflow-hidden h-[400px]">
              <MapContainer
                center={center}
                zoom={hasCoords ? 10 : 7}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {coverageMode === "radius" && hasCoords && radiusMeters > 0 && (
                  <Circle
                    center={[lat, lng]}
                    radius={radiusMeters}
                    pathOptions={{
                      color: color,
                      weight: 3,
                      fillColor: color,
                      fillOpacity: 0.2,
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  />
                )}

                {hasCoords && (
                  <PinMarker
                    position={[lat, lng]}
                    color={color}
                    label={name || "Distribuidora"}
                  />
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
