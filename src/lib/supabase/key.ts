// Prefer the modern publishable key (sb_publishable_...), fall back to the
// legacy anon JWT if that's what's configured — some Supabase services
// have historically lagged on accepting the new key format.
export function getSupabasePublicKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ""
  );
}
