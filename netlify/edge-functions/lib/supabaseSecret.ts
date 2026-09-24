// Zugangsdaten fuer den GEHEIMEN SUPABASE_SECRET_KEY. Der Schluessel umgeht
// RLS und darf NIE an den Browser weitergegeben werden - er wird nur hier
// im Proxy als apikey-Header verwendet.

export function getSecretCredentials(
  logPrefix: string
): { supabaseUrl: string; secretKey: string } | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY");
  if (!supabaseUrl || !secretKey) {
    console.error(`${logPrefix} SUPABASE_URL/SUPABASE_SECRET_KEY nicht gesetzt`);
    return null;
  }
  return { supabaseUrl, secretKey };
}
