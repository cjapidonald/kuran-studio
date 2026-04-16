import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const QURAN_COM_API = "https://api.quran.com/api/v4";

interface ReciterSeed {
  slug: string;
  display_name: string;
  style: "murattal" | "mujawwad";
  match: { name_contains: string; style: "murattal" | "mujawwad" };
  sort_order: number;
  is_default: boolean;
}

const RECITERS: ReciterSeed[] = [
  { slug: "alafasy",              display_name: "Mishary Rashid Al-Afasy",  style: "murattal", match: { name_contains: "Afasy",   style: "murattal" }, sort_order: 10, is_default: true },
  { slug: "abdul_basit_mujawwad", display_name: "Abdul Basit Abd us-Samad", style: "mujawwad", match: { name_contains: "Basit",   style: "mujawwad" }, sort_order: 20, is_default: false },
  { slug: "maher_al_muaiqly",     display_name: "Maher Al-Muaiqly",         style: "murattal", match: { name_contains: "Muaiqly", style: "murattal" }, sort_order: 30, is_default: false },
  { slug: "sudais",               display_name: "Abdur-Rahman As-Sudais",   style: "murattal", match: { name_contains: "Sudais",  style: "murattal" }, sort_order: 40, is_default: false },
  { slug: "husary",               display_name: "Mahmoud Khalil Al-Husary", style: "murattal", match: { name_contains: "Husary",  style: "murattal" }, sort_order: 50, is_default: false },
];

async function main() {
  console.log("seed-reciters: start");
  // resolveReciterIds, seedReciters, seedRecitations — added in later tasks
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
