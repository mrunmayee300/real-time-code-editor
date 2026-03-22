export function getBackendUrl(): string {
  const u = import.meta.env.VITE_BACKEND_URL;
  const s = typeof u === "string" ? u.trim().replace(/\/$/, "") : "";
  if (import.meta.env.PROD && !s) {
    console.error(
      "VITE_BACKEND_URL is missing. Set it in Vercel (or client/.env.production) to your API origin."
    );
  }
  return s;
}
