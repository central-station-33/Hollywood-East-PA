// Prefer the legacy anon JWT — the universally-compatible format across all
// Supabase services — and fall back to the newer publishable key only if
// that's all that's configured. Trim defensively: env values pasted through
// a dashboard UI can pick up stray leading/trailing whitespace.
export function getSupabasePublicKey(): string {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anonKey) return anonKey;

  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return publishableKey ?? "";
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}
