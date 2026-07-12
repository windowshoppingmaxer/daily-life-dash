import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "Supabase-Konfiguration fehlt. Lege eine .env-Datei an (siehe .env.example) mit VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder");
