const CACHE_KEY = "@pbrn-geocache";

interface GeocacheEntry {
  query: string;
  lat: number;
  lng: number;
  ts: number;
}

function loadCache(): Map<string, GeocacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return new Map();
    const arr = JSON.parse(raw) as GeocacheEntry[];
    return new Map(arr.map((e) => [e.query, e]));
  } catch {
    return new Map();
  }
}

function saveCache(cache: Map<string, GeocacheEntry>) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(Array.from(cache.values())));
  } catch {
    // storage full — ignore
  }
}

function extractQuery(address: string): string | null {
  const cityStateMatch = address.match(/([^,]+),\s*([A-Z]{2})(?:,|\s+Brasil)?/i);
  if (cityStateMatch) {
    return `${cityStateMatch[1].trim()}, ${cityStateMatch[2].trim()}, Brasil`;
  }
  const cepMatch = address.match(/CEP:\s*(\d{5}-?\d{3})/);
  if (cepMatch) {
    return cepMatch[1];
  }
  return null;
}

let lastRequestTime = 0;
let pendingPromise: Promise<void> | null = null;

async function throttledFetch(url: string): Promise<Response> {
  // Wait for any pending request to complete first
  if (pendingPromise) {
    await pendingPromise;
  }

  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    const waitMs = 1100 - elapsed;
    const waitPromise = new Promise<void>((r) => setTimeout(r, waitMs));
    pendingPromise = waitPromise;
    await waitPromise;
    pendingPromise = null;
  }

  lastRequestTime = Date.now();
  return fetch(url);
}

export async function geocodeAddress(
  address: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const cache = loadCache();
  const query = extractQuery(address);
  if (!query) return null;

  const cached = cache.get(query);
  if (cached && Date.now() - cached.ts < 30 * 24 * 60 * 60 * 1000) {
    return { latitude: cached.lat, longitude: cached.lng };
  }

  try {
    const encoded = encodeURIComponent(query);
    const res = await throttledFetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    if (isNaN(lat) || isNaN(lng)) return null;

    cache.set(query, { query, lat, lng, ts: Date.now() });
    saveCache(cache);

    return { latitude: lat, longitude: lng };
  } catch {
    return null;
  }
}

export interface ReverseGeocodeResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
}

export interface SearchResult {
  displayName: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  latitude: number;
  longitude: number;
}

export async function searchAddresses(
  query: string,
): Promise<SearchResult[]> {
  if (!query || query.length < 3) return [];

  try {
    const encoded = encodeURIComponent(query + ", Brasil");
    const res = await throttledFetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=5&countrycodes=br`,
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!data || data.length === 0) return [];

    return data.map((item: any) => {
      const addr = item.address || {};
      return {
        displayName: item.display_name || "",
        street: addr.road || addr.pedestrian || addr.secondary || "",
        neighborhood: addr.suburb || addr.neighbourhood || "",
        city: addr.city || addr.town || addr.village || addr.municipality || "",
        state: addr.state_code || "",
        cep: addr.postcode || "",
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      };
    });
  } catch {
    return [];
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult | null> {
  try {
    const res = await throttledFetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !data.address) return null;

    const addr = data.address;
    return {
      street: addr.road || addr.pedestrian || addr.secondary || "",
      neighborhood: addr.suburb || addr.neighbourhood || "",
      city: addr.city || addr.town || addr.village || addr.municipality || "",
      state: addr.state_code || "",
      cep: addr.postcode || "",
    };
  } catch {
    return null;
  }
}
