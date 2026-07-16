import { useState, useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from "react-leaflet";
import { geocodeAddress } from "@/lib/geocode";
import { formatCurrency } from "@/lib/format";
import { useAdminDistributors } from "@/lib/hooks";
import { pointInDistributorCoverage } from "@/lib/distributor-utils";
import { PinMarker } from "@/components/admin/PinMarker";
import type { Order, OrderStatus, Distributor } from "@/lib/types";
import "leaflet/dist/leaflet.css";

const CITY_RADIUS_KM = 15;
const CITY_GEOCODE_CACHE = "@pbrn-city-geocache";

interface DeliveryMapProps {
  orders: Order[];
}

interface MapPoint {
  orderId: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  address: string;
  lat: number;
  lng: number;
}

const statusColors: Record<OrderStatus, string> = {
  pending: "#ef4444",
  confirmed: "#ef4444",
  preparing: "#ef4444",
  shipped: "#ef4444",
  delivered: "#a1a1aa",
  cancelled: "#a1a1aa",
};

const statusLabel: Record<OrderStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Separando",
  shipped: "Em trânsito",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusBadge: Record<OrderStatus, string> = {
  pending: "bg-red-100 text-red-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-violet-100 text-violet-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-zinc-100 text-zinc-500",
};

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
      return;
    }
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, map]);

  return null;
}

function FitBoundsWithPolygons({ points, distributors }: { points: MapPoint[]; distributors: Distributor[] }) {
  const map = useMap();

  useEffect(() => {
    if (distributors.length === 1) {
      const d = distributors[0];
      map.setView([d.latitude, d.longitude], 8);
      return;
    }

    const allLats: number[] = [];
    const allLngs: number[] = [];

    distributors.forEach((d) => {
      allLats.push(d.latitude);
      allLngs.push(d.longitude);
    });

    points.forEach((p) => {
      allLats.push(p.lat);
      allLngs.push(p.lng);
    });

    if (allLats.length === 0) {
      map.setView([-7.5, -36.0], 6);
      return;
    }

    const bounds: [[number, number], [number, number]] = [
      [Math.min(...allLats), Math.min(...allLngs)],
      [Math.max(...allLats), Math.max(...allLngs)],
    ];
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [points, distributors, map]);

  return null;
}

export function DeliveryMap({ orders }: DeliveryMapProps) {
  const [geocoded, setGeocoded] = useState<Record<string, { lat: number; lng: number }>>({});
  const [geocoding, setGeocoding] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("todas");
  const [cityCoords, setCityCoords] = useState<Record<string, { lat: number; lng: number }>>({});

  const { data: allDistributors = [] } = useAdminDistributors();
  const distributors = useMemo(() => allDistributors.filter((d) => d.active), [allDistributors]);

  const visibleDistributors = useMemo(() => {
    if (activeTab === "todas") return distributors;
    return distributors.filter((d) => d.id === activeTab);
  }, [activeTab, distributors]);

  useEffect(() => {
    const loadCityCache = (): Record<string, { lat: number; lng: number }> => {
      try {
        const raw = localStorage.getItem(CITY_GEOCODE_CACHE);
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    };

    const saveCityCache = (cache: Record<string, { lat: number; lng: number }>) => {
      try {
        localStorage.setItem(CITY_GEOCODE_CACHE, JSON.stringify(cache));
      } catch {}
    };

    const cache = loadCityCache();

    const existingKeys = new Set(Object.keys(cache));
    const citiesToGeocode: { city: string; state: string; key: string }[] = [];

    visibleDistributors.forEach((d) => {
      if (d.coverageMode === "city" && d.coverageCities) {
        d.coverageCities.forEach((city) => {
          const key = `${city}, ${d.state}`;
          if (!existingKeys.has(key)) {
            citiesToGeocode.push({ city, state: d.state, key });
          }
        });
      }
    });

    setCityCoords(cache);

    if (citiesToGeocode.length === 0) return;

    let cancelled = false;
    async function run() {
      const newCache = { ...cache };
      for (const { city, state, key } of citiesToGeocode) {
        if (cancelled) break;
        if (newCache[key]) continue;
        const result = await geocodeAddress(`${city}, ${state}`);
        if (result && !cancelled) {
          newCache[key] = { lat: result.latitude, lng: result.longitude };
          saveCityCache(newCache);
          setCityCoords({ ...newCache });
        }
      }
    }
    run();
    return () => { cancelled = true; };
  }, [visibleDistributors]);

  const ordersWithCoords = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status !== "cancelled" &&
        typeof o.latitude === "number" &&
        typeof o.longitude === "number" &&
        !isNaN(o.latitude) &&
        !isNaN(o.longitude),
    );
  }, [orders]);

  const ordersNeedingGeocode = useMemo(() => {
    return orders.filter(
      (o) =>
        o.status !== "cancelled" && (o.latitude == null || o.longitude == null) && !geocoded[o.id],
    );
  }, [orders, geocoded]);

  useEffect(() => {
    if (ordersNeedingGeocode.length === 0) return;
    setGeocoding(true);

    let cancelled = false;
    async function run() {
      for (const order of ordersNeedingGeocode) {
        if (cancelled) break;
        const result = await geocodeAddress(order.shippingAddress);
        if (result && !cancelled) {
          setGeocoded((prev) => ({
            ...prev,
            [order.id]: { lat: result.latitude, lng: result.longitude },
          }));
        }
      }
      if (!cancelled) setGeocoding(false);
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [ordersNeedingGeocode]);

  const points: MapPoint[] = useMemo(() => {
    const result: MapPoint[] = [];

    ordersWithCoords.forEach((o) => {
      result.push({
        orderId: o.id,
        customerName: o.customerName,
        total: o.total,
        status: o.status,
        address: o.shippingAddress,
        lat: o.latitude!,
        lng: o.longitude!,
      });
    });

    ordersNeedingGeocode.forEach((o) => {
      const gc = geocoded[o.id];
      if (gc) {
        result.push({
          orderId: o.id,
          customerName: o.customerName,
          total: o.total,
          status: o.status,
          address: o.shippingAddress,
          lat: gc.lat,
          lng: gc.lng,
        });
      }
    });

    return result;
  }, [ordersWithCoords, ordersNeedingGeocode, geocoded]);

  const filteredPoints = useMemo(() => {
    if (activeTab === "todas") return points;
    const dist = distributors.find((d) => d.id === activeTab);
    if (!dist) return points;
    if (dist.coverageMode === "radius") {
      return points.filter((p) => pointInDistributorCoverage({ lat: p.lat, lng: p.lng }, dist));
    }
    if (dist.coverageMode === "city" && dist.coverageCities) {
      return points.filter((p) => {
        const key = `${p.address}`;
        return dist.coverageCities.some((city) => key.toLowerCase().includes(city.toLowerCase()));
      });
    }
    return points;
  }, [points, activeTab, distributors]);

  const center: [number, number] = useMemo(() => {
    if (activeTab !== "todas") {
      const dist = distributors.find((d) => d.id === activeTab);
      if (dist) return [dist.latitude, dist.longitude];
    }
    if (filteredPoints.length === 0) {
      if (distributors.length > 0) {
        const avgLat = distributors.reduce((s, d) => s + d.latitude, 0) / distributors.length;
        const avgLng = distributors.reduce((s, d) => s + d.longitude, 0) / distributors.length;
        return [avgLat, avgLng];
      }
      return [-7.5, -36.0];
    }
    const avgLat = filteredPoints.reduce((s, p) => s + p.lat, 0) / filteredPoints.length;
    const avgLng = filteredPoints.reduce((s, p) => s + p.lng, 0) / filteredPoints.length;
    return [avgLat, avgLng];
  }, [filteredPoints, distributors, activeTab]);

  const activeCount = filteredPoints.filter((p) => p.status !== "delivered").length;
  const deliveredCount = filteredPoints.filter((p) => p.status === "delivered").length;

  return (
    <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">Mapa de entregas</h2>
              <p className="text-[11px] text-zinc-400">
                {filteredPoints.length} localização(ões)
                {geocoding && " · geocodificando..."}
                {activeTab !== "todas" && " · filtrado"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-[11px] text-zinc-500">
                Ativo{activeCount !== 1 ? "s" : ""} ({activeCount})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-zinc-400" />
              <span className="text-[11px] text-zinc-500">
                Concluído{deliveredCount !== 1 ? "s" : ""} ({deliveredCount})
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab("todas")}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === "todas"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Todas
          </button>
          {distributors.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveTab(d.id)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === d.id
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[420px] relative">
        {filteredPoints.length === 0 && distributors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full bg-zinc-50">
            <div className="h-16 w-16 rounded-lg bg-zinc-100 flex items-center justify-center mb-3">
              <svg
                className="h-8 w-8 text-zinc-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-500">Nenhuma localização</p>
            <p className="text-xs text-zinc-400 mt-1">Pedidos com endereço aparecerão aqui</p>
          </div>
        ) : (
          <MapContainer
            center={center}
            zoom={5}
            style={{ height: "100%", width: "100%" }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBoundsWithPolygons points={filteredPoints} distributors={visibleDistributors} />

            {/* Coverage areas — radius */}
            {visibleDistributors.map((d) => {
              const isSelected = activeTab === d.id;
              return d.coverageMode === "radius" ? (
                <Circle
                  key={`radius-${d.id}`}
                  center={[d.latitude, d.longitude]}
                  radius={d.coverageRadiusKm * 1000}
                  pathOptions={{
                    color: d.color,
                    weight: isSelected ? 3 : 2,
                    fillColor: d.color,
                    fillOpacity: isSelected ? 0.2 : 0.08,
                    dashArray: isSelected ? undefined : "2 6",
                    lineCap: "round",
                    lineJoin: "round",
                  }}
                >
                  <Popup>
                    <div className="min-w-[140px] p-1">
                      <div className="text-xs font-bold text-zinc-900 mb-1">{d.name}</div>
                      <div className="text-[11px] text-zinc-500">{d.city} — {d.state}</div>
                      <div className="text-[11px] text-zinc-400 mt-1">Raio: {d.coverageRadiusKm} km</div>
                    </div>
                  </Popup>
                </Circle>
              ) : null;
            })}

            {/* Coverage areas — city circles */}
            {visibleDistributors.map((d) => {
              if (d.coverageMode !== "city" || !d.coverageCities) return null;
              const isSelected = activeTab === d.id;
              return d.coverageCities.map((city) => {
                const key = `${city}, ${d.state}`;
                const coords = cityCoords[key];
                if (!coords) return null;
                return (
                  <Circle
                    key={`city-${d.id}-${city}`}
                    center={[coords.lat, coords.lng]}
                    radius={CITY_RADIUS_KM * 1000}
                    pathOptions={{
                      color: d.color,
                      weight: isSelected ? 2.5 : 1.5,
                      fillColor: d.color,
                      fillOpacity: isSelected ? 0.18 : 0.07,
                      dashArray: isSelected ? undefined : "2 6",
                      lineCap: "round",
                      lineJoin: "round",
                    }}
                  >
                    <Popup>
                      <div className="min-w-[120px] p-1">
                        <div className="text-xs font-bold text-zinc-900 mb-0.5">{city}</div>
                        <div className="text-[11px] text-zinc-500">{d.name}</div>
                      </div>
                    </Popup>
                  </Circle>
                );
              });
            })}

            {/* Distributor center markers */}
            {visibleDistributors.map((d) => (
              <PinMarker
                key={`center-${d.id}`}
                position={[d.latitude, d.longitude]}
                color={d.color}
                label={`${d.name} — ${d.city}, ${d.state}`}
              />
            ))}

            {/* Order markers */}
            {filteredPoints.map((p) => {
              const isActive = p.status !== "delivered";
              const color = statusColors[p.status];
              return (
                <CircleMarker
                  key={p.orderId}
                  center={[p.lat, p.lng]}
                  radius={isActive ? 8 : 6}
                  pathOptions={{
                    color: "#ffffff",
                    weight: 2,
                    fillColor: color,
                    fillOpacity: isActive ? 0.9 : 0.5,
                    className: isActive ? "animate-pulse-marker" : "",
                  }}
                >
                  <Popup>
                    <div className="min-w-[180px] p-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-zinc-900">{p.orderId}</span>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusBadge[p.status]}`}
                        >
                          {statusLabel[p.status]}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-600 mb-1">{p.customerName}</div>
                      <div className="text-xs font-semibold text-zinc-900 mb-1.5">
                        {formatCurrency(p.total)}
                      </div>
                      <div className="text-[11px] text-zinc-400 leading-tight">
                        {p.address.length > 50 ? p.address.slice(0, 50) + "..." : p.address}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      {distributors.length > 0 && (
        <div className="px-5 py-3 border-t border-zinc-100 flex items-center gap-4">
          {distributors.map((d) => (
            <div key={d.id} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-[11px] text-zinc-500">{d.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
