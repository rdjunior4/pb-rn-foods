/**
 * Rate limiting client-side via localStorage
 * Limita tentativas de login e reset de senha
 * NOTA: Em produção, usar rate limiting server-side (Edge Function + Redis/Supabase)
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

const RATE_LIMIT_KEY = "@pbrn-rate-limit";
const MAX_LOGIN_ATTEMPTS = 5;
const MAX_RESET_ATTEMPTS = 3;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

function getEntries(): Record<string, RateLimitEntry> {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveEntries(entries: Record<string, RateLimitEntry>): void {
  try {
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entries));
  } catch {}
}

function cleanupOldEntries(entries: Record<string, RateLimitEntry>): Record<string, RateLimitEntry> {
  const now = Date.now();
  const cleaned: Record<string, RateLimitEntry> = {};
  for (const [key, entry] of Object.entries(entries)) {
    if (now - entry.firstAttempt < WINDOW_MS) {
      cleaned[key] = entry;
    }
  }
  return cleaned;
}

export function checkRateLimit(action: "login" | "reset", identifier: string): { allowed: boolean; remainingMs: number } {
  const key = `${action}:${identifier}`;
  const maxAttempts = action === "login" ? MAX_LOGIN_ATTEMPTS : MAX_RESET_ATTEMPTS;
  const now = Date.now();
  
  let entries = getEntries();
  entries = cleanupOldEntries(entries);
  
  const entry = entries[key];
  if (!entry) {
    return { allowed: true, remainingMs: 0 };
  }
  
  const elapsed = now - entry.firstAttempt;
  if (elapsed >= WINDOW_MS) {
    delete entries[key];
    saveEntries(entries);
    return { allowed: true, remainingMs: 0 };
  }
  
  if (entry.count >= maxAttempts) {
    return { allowed: false, remainingMs: WINDOW_MS - elapsed };
  }
  
  return { allowed: true, remainingMs: 0 };
}

export function recordAttempt(action: "login" | "reset", identifier: string): void {
  const key = `${action}:${identifier}`;
  const entries = getEntries();
  const now = Date.now();
  
  const existing = entries[key];
  if (existing && now - existing.firstAttempt < WINDOW_MS) {
    existing.count++;
  } else {
    entries[key] = { count: 1, firstAttempt: now };
  }
  
  saveEntries(entries);
}

export function resetRateLimit(action: "login" | "reset", identifier: string): void {
  const key = `${action}:${identifier}`;
  const entries = getEntries();
  delete entries[key];
  saveEntries(entries);
}

export function formatRemainingTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes === 1) return "1 minuto";
  return `${minutes} minutos`;
}
