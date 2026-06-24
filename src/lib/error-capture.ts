// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.
// Also forwards errors to Sentry via direct HTTP ingest (server-side).

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
  reportToSentry(error);
}

async function reportToSentry(error: unknown) {
  const dsn = import.meta.env?.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const projectId = url.pathname.replace("/", "");
    const ingestUrl = `https://${url.host}/api/${projectId}/store/`;

    const eventId = crypto.randomUUID().replace(/-/g, "");
    const payload = {
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: "node",
      level: "error",
      environment: import.meta.env?.MODE ?? "production",
      exception: {
        values: [
          {
            type: error instanceof Error ? error.name : "Error",
            value: error instanceof Error ? error.message : String(error),
            stacktrace: error instanceof Error ? error.stack : undefined,
          },
        ],
      },
      tags: { source: "ssr" },
    };

    await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_key=${publicKey}, sentry_version=7`,
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Silent fail — don't crash the server if Sentry is unreachable
  }
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
