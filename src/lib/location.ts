export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressData {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  region?: string;
}

const NORDESTE_STATES = ["MA", "PI", "CE", "RN", "PB", "PE", "AL", "SE", "BA"];

export async function fetchViaCEP(cep: string): Promise<AddressData | null> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data: ViaCEPResponse = await res.json();
    if (data.erro) return null;
    return {
      cep: data.cep,
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch {
    return null;
  }
}

export function formatCEP(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function isNordeste(state: string): boolean {
  return NORDESTE_STATES.includes(state.toUpperCase());
}

export function detectBrowserLocation(): Promise<GeoLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => resolve(null),
      { timeout: 5000, maximumAge: 300000 }
    );
  });
}

export async function detectIPLocation(): Promise<GeoLocation | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined,
    });
    const data = await res.json();
    if (data.error) return null;
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      city: data.city,
      state: data.region_code,
      region: data.region,
    };
  } catch {
    return null;
  }
}

export async function detectLocation(): Promise<GeoLocation | null> {
  const browser = await detectBrowserLocation();
  if (browser) {
    if (browser.city && browser.state) return browser;
    const { reverseGeocode } = await import("@/lib/geocode");
    const geo = await reverseGeocode(browser.latitude, browser.longitude);
    if (geo && geo.city && geo.state) {
      return { ...browser, city: geo.city, state: geo.state };
    }
    return browser;
  }
  return detectIPLocation();
}