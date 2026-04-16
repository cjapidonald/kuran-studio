import { createClient } from "@supabase/supabase-js";

// ---- Configuration ----
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE = "https://quranenc.com/api/v1/translation";
const DELAY_MS = 150; // delay between API calls
const MAX_RETRIES = 3;
const BATCH_SIZE = 500; // rows per upsert batch

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
  console.error("Run: SUPABASE_SERVICE_ROLE_KEY=your_key npx tsx scripts/import-quran.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ---- All translations to import ----
interface TranslationConfig {
  key: string;
  languageCode: string;
  languageName: string;
  translator: string;
  isPrimary: boolean;
}

const TRANSLATIONS: TranslationConfig[] = [
  // Balkan
  { key: "albanian_nahi", languageCode: "sq", languageName: "Shqip", translator: "Hasan Efendi Nahi", isPrimary: true },
  { key: "albanian_rwwad", languageCode: "sq", languageName: "Shqip", translator: "Rowwad Translation Center", isPrimary: false },
  { key: "bosnian_rwwad", languageCode: "bs", languageName: "Bosanski", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "bosnian_korkut", languageCode: "bs", languageName: "Bosanski", translator: "Besim Korkut", isPrimary: false },
  { key: "bosnian_mahanovic", languageCode: "bs", languageName: "Bosanski", translator: "Mihanovic", isPrimary: false },
  { key: "croatian_rwwad", languageCode: "hr", languageName: "Hrvatski", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "serbian_rwwad", languageCode: "sr", languageName: "Српски", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "macedonian_group", languageCode: "mk", languageName: "Македонски", translator: "Group of Scholars", isPrimary: true },
  { key: "bulgarian_translation", languageCode: "bg", languageName: "Български", translator: "Bulgarian Translation", isPrimary: true },
  { key: "romanian_project", languageCode: "ro", languageName: "Română", translator: "Romanian Project", isPrimary: true },
  { key: "greek_rwwad", languageCode: "el", languageName: "Ελληνικά", translator: "Rowwad Translation Center", isPrimary: true },

  // Western European
  { key: "english_saheeh", languageCode: "en", languageName: "English", translator: "Sahih International", isPrimary: true },
  { key: "english_rwwad", languageCode: "en", languageName: "English", translator: "Rowwad Translation Center", isPrimary: false },
  { key: "english_hilali_khan", languageCode: "en", languageName: "English", translator: "Hilali & Khan", isPrimary: false },
  { key: "french_hameedullah", languageCode: "fr", languageName: "Français", translator: "Muhammad Hamidullah", isPrimary: true },
  { key: "french_rashid", languageCode: "fr", languageName: "Français", translator: "Rashid Maash", isPrimary: false },
  { key: "french_montada", languageCode: "fr", languageName: "Français", translator: "Montada Islamique", isPrimary: false },
  { key: "german_bubenheim", languageCode: "de", languageName: "Deutsch", translator: "Frank Bubenheim", isPrimary: true },
  { key: "german_rwwad", languageCode: "de", languageName: "Deutsch", translator: "Rowwad Translation Center", isPrimary: false },
  { key: "german_aburida", languageCode: "de", languageName: "Deutsch", translator: "Abu Rida", isPrimary: false },
  { key: "spanish_garcia", languageCode: "es", languageName: "Español", translator: "Isa Garcia", isPrimary: true },
  { key: "spanish_montada_eu", languageCode: "es", languageName: "Español", translator: "Montada Islamique (EU)", isPrimary: false },
  { key: "spanish_montada_latin", languageCode: "es", languageName: "Español", translator: "Montada Islamique (Latin)", isPrimary: false },
  { key: "portuguese_nasr", languageCode: "pt", languageName: "Português", translator: "Helmi Nasr", isPrimary: true },
  { key: "italian_rwwad", languageCode: "it", languageName: "Italiano", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "dutch_center", languageCode: "nl", languageName: "Nederlands", translator: "Sofian Siregar", isPrimary: true },
  { key: "swedish_rwwad", languageCode: "sv", languageName: "Svenska", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "lithuanian_rwwad", languageCode: "lt", languageName: "Lietuvių", translator: "Rowwad Translation Center", isPrimary: true },

  // Turkic
  { key: "turkish_rwwad", languageCode: "tr", languageName: "Türkçe", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "turkish_shaban", languageCode: "tr", languageName: "Türkçe", translator: "Shaban Britch", isPrimary: false },
  { key: "turkish_shahin", languageCode: "tr", languageName: "Türkçe", translator: "Shahin", isPrimary: false },
  { key: "azeri_musayev", languageCode: "az", languageName: "Azərbaycan", translator: "Alikhan Musayev", isPrimary: true },
  { key: "uzbek_rwwad", languageCode: "uz", languageName: "O'zbek", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "uzbek_sadiq", languageCode: "uz", languageName: "O'zbek", translator: "Muhammad Sadiq", isPrimary: false },
  { key: "uzbek_mansour", languageCode: "uz", languageName: "O'zbek", translator: "Alauddin Mansour", isPrimary: false },
  { key: "kazakh_altai", languageCode: "kk", languageName: "Қазақ", translator: "Khalifa Altai", isPrimary: true },
  { key: "kyrgyz_hakimov", languageCode: "ky", languageName: "Кыргыз", translator: "Shamshidin Hakimov", isPrimary: true },
  { key: "uyghur_saleh", languageCode: "ug", languageName: "ئۇيغۇرچە", translator: "Muhammad Saleh", isPrimary: true },

  // Slavic
  { key: "russian_rwwad", languageCode: "ru", languageName: "Русский", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "russian_aboadel", languageCode: "ru", languageName: "Русский", translator: "Abu Adel", isPrimary: false },
  { key: "ukrainian_yakubovych", languageCode: "uk", languageName: "Українська", translator: "Mykhaylo Yakubovych", isPrimary: true },
  { key: "belarusian_krivtsov", languageCode: "be", languageName: "Беларуская", translator: "Krivtsov", isPrimary: true },

  // Middle Eastern
  { key: "persian_ih", languageCode: "fa", languageName: "فارسی", translator: "IslamHouse", isPrimary: true },
  { key: "urdu_junagarhi", languageCode: "ur", languageName: "اردو", translator: "Muhammad Junagarhi", isPrimary: true },
  { key: "pashto_rwwad", languageCode: "ps", languageName: "پښتو", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "pashto_zakaria", languageCode: "ps", languageName: "پښتو", translator: "Abu Zakaria", isPrimary: false },
  { key: "kurdish_bamoki", languageCode: "ku", languageName: "کوردی", translator: "Muhammad Saleh Bamoki", isPrimary: true },
  { key: "kurdish_salahuddin", languageCode: "ku", languageName: "کوردی", translator: "Salahuddin", isPrimary: false },
  { key: "kurmanji_ismail", languageCode: "kmr", languageName: "Kurmancî", translator: "Ismail", isPrimary: true },
  { key: "hebrew_darussalam", languageCode: "he", languageName: "עברית", translator: "Dar Al-Salam", isPrimary: true },
  { key: "dari_badkhashani", languageCode: "prs", languageName: "دری", translator: "Badakhshani", isPrimary: true },

  // South Asian
  { key: "hindi_azizul_haq", languageCode: "hi", languageName: "हिन्दी", translator: "Azizul Haq", isPrimary: true },
  { key: "bengali_abu_bakr", languageCode: "bn", languageName: "বাংলা", translator: "Abu Bakr Zakaria", isPrimary: true },
  { key: "tamil_omar_sharif", languageCode: "ta", languageName: "தமிழ்", translator: "Omar Sharif", isPrimary: true },
  { key: "telugu_abdurrahim", languageCode: "te", languageName: "తెలుగు", translator: "Abdur-Rahim ibn Muhammad", isPrimary: true },
  { key: "gujarati_rabella", languageCode: "gu", languageName: "ગુજરાતી", translator: "Rabella", isPrimary: true },
  { key: "malayalam_abdul_hamid", languageCode: "ml", languageName: "മലയാളം", translator: "Abdul Hamid & Kunhi Mohammed", isPrimary: true },
  { key: "kannada_hamza_butur", languageCode: "kn", languageName: "ಕನ್ನಡ", translator: "Hamza Butur", isPrimary: true },
  { key: "assamese_rafeeq", languageCode: "as", languageName: "অসমীয়া", translator: "Rafeeq-ul-Islam", isPrimary: true },
  { key: "punjabi_arif_haleem", languageCode: "pa", languageName: "ਪੰਜਾਬੀ", translator: "Arif Haleem", isPrimary: true },
  { key: "sinhalese_mahir", languageCode: "si", languageName: "සිංහල", translator: "Mahir", isPrimary: true },
  { key: "nepali_ahlul_hadith", languageCode: "ne", languageName: "नेपाली", translator: "Ahlul Hadith Central Committee", isPrimary: true },

  // East Asian
  { key: "chinese_suliman", languageCode: "zh", languageName: "中文", translator: "Ma Suliman", isPrimary: true },
  { key: "chinese_makin", languageCode: "zh", languageName: "中文", translator: "Ma Jian (Makin)", isPrimary: false },
  { key: "japanese_saeedsato", languageCode: "ja", languageName: "日本語", translator: "Saeed Sato", isPrimary: true },
  { key: "korean_hamid", languageCode: "ko", languageName: "한국어", translator: "Hamid Choi", isPrimary: true },

  // Southeast Asian
  { key: "indonesian_sabiq", languageCode: "id", languageName: "Bahasa Indonesia", translator: "Sabiq Company", isPrimary: true },
  { key: "indonesian_affairs", languageCode: "id", languageName: "Bahasa Indonesia", translator: "Ministry of Islamic Affairs", isPrimary: false },
  { key: "indonesian_complex", languageCode: "id", languageName: "Bahasa Indonesia", translator: "King Fahd Complex", isPrimary: false },
  { key: "malay_basumayyah", languageCode: "ms", languageName: "Bahasa Melayu", translator: "Basumayyah", isPrimary: true },
  { key: "tagalog_rwwad", languageCode: "tl", languageName: "Tagalog", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "thai_rwwad", languageCode: "th", languageName: "ไทย", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "thai_complex", languageCode: "th", languageName: "ไทย", translator: "King Fahd Complex", isPrimary: false },
  { key: "vietnamese_rwwad", languageCode: "vi", languageName: "Tiếng Việt", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "vietnamese_hassan", languageCode: "vi", languageName: "Tiếng Việt", translator: "Hassan Abdul Karim", isPrimary: false },
  { key: "khmer_rwwad", languageCode: "km", languageName: "ខ្មែរ", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "bisayan_rwwad", languageCode: "ceb", languageName: "Cebuano", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "iranun_sarro", languageCode: "mrw", languageName: "Iranun", translator: "Sarro", isPrimary: true },
  { key: "maguindanao_rwwad", languageCode: "mdh", languageName: "Maguindanaon", translator: "Rowwad Translation Center", isPrimary: true },

  // Central Asian
  { key: "tajik_arifi", languageCode: "tg", languageName: "Тоҷикӣ", translator: "Arifi", isPrimary: true },
  { key: "tajik_khawaja", languageCode: "tg", languageName: "Тоҷикӣ", translator: "Khawaja Mirof", isPrimary: false },

  // Caucasian
  { key: "georgian_rwwad", languageCode: "ka", languageName: "ქართული", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "circassian_rwwad", languageCode: "kbd", languageName: "Адыгэбзэ", translator: "Rowwad Translation Center", isPrimary: true },

  // African
  { key: "swahili_rwwad", languageCode: "sw", languageName: "Kiswahili", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "swahili_barwani", languageCode: "sw", languageName: "Kiswahili", translator: "Ali Muhsin Al-Barwani", isPrimary: false },
  { key: "somali_yacob", languageCode: "so", languageName: "Soomaali", translator: "Yacob", isPrimary: true },
  { key: "amharic_sadiq", languageCode: "am", languageName: "አማርኛ", translator: "Sadiq & Sani", isPrimary: true },
  { key: "yoruba_mikael", languageCode: "yo", languageName: "Yorùbá", translator: "Mikael", isPrimary: true },
  { key: "oromo_ababor", languageCode: "om", languageName: "Oromoo", translator: "Ghali Apapur Apapur", isPrimary: true },
  { key: "malagasy_rwwad", languageCode: "mg", languageName: "Malagasy", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "chichewa_batyala", languageCode: "ny", languageName: "Chichewa", translator: "Batyala", isPrimary: true },
  { key: "moore_rwwad", languageCode: "mos", languageName: "Mooré", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "fulani_rwwad", languageCode: "ff", languageName: "Fulfulde", translator: "Rowwad Translation Center", isPrimary: true },
  { key: "lingala_balangogo", languageCode: "ln", languageName: "Lingála", translator: "Balangogo", isPrimary: true },
  { key: "akan_ismail", languageCode: "ak", languageName: "Akan", translator: "Ismail", isPrimary: true },
  { key: "kinyarwanda_association", languageCode: "rw", languageName: "Kinyarwanda", translator: "Rwanda Muslim Association", isPrimary: true },
  { key: "kirundi_gahiti", languageCode: "rn", languageName: "Kirundi", translator: "Gahiti", isPrimary: true },
  { key: "dagbani_ghutubo", languageCode: "dag", languageName: "Dagbani", translator: "Ghutubo", isPrimary: true },
  { key: "afar_hamza", languageCode: "aa", languageName: "Afar", translator: "Hamza", isPrimary: true },
];

// ---- Helpers ----
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ApiAyah {
  id: string;
  sura: string;
  aya: string;
  arabic_text: string;
  translation: string;
  footnotes: string;
}

async function fetchSurahFromApi(translationKey: string, surahNumber: number, retries = MAX_RETRIES): Promise<ApiAyah[] | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/sura/${translationKey}/${surahNumber}`);
      if (!res.ok) {
        if (res.status === 404) return null; // translation doesn't exist
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      return data.result || [];
    } catch (err) {
      if (attempt === retries) {
        console.error(`    FAILED after ${retries} attempts: ${err}`);
        return null;
      }
      await sleep(1000 * attempt); // exponential backoff
    }
  }
  return null;
}

// ---- Main import ----
async function main() {
  console.log(`\n=== QuranEnc → Supabase Import ===`);
  console.log(`Translations: ${TRANSLATIONS.length}`);
  console.log(`Surahs per translation: 114`);
  console.log(`Total API calls: ${TRANSLATIONS.length * 114}\n`);

  // Check which translations are already fully imported - use server-side aggregation
  const ayahCountByKey: Record<string, number> = {};
  for (const t of TRANSLATIONS) {
    const { count } = await supabase
      .from("ayahs")
      .select("*", { count: "exact", head: true })
      .eq("translation_key", t.key);
    if (count && count > 0) {
      ayahCountByKey[t.key] = count;
    }
  }

  // Consider complete if >= 6000 ayahs (Quran has 6236, some translations may differ slightly)
  const completedKeys = new Set(
    Object.entries(ayahCountByKey)
      .filter(([, count]) => count >= 6000)
      .map(([key]) => key)
  );

  console.log(`Already completed: ${completedKeys.size} translations\n`);

  let totalAyahs = 0;
  let skipped = 0;
  let failed: string[] = [];

  for (let ti = 0; ti < TRANSLATIONS.length; ti++) {
    const t = TRANSLATIONS[ti];
    const progress = `[${ti + 1}/${TRANSLATIONS.length}]`;

    if (completedKeys.has(t.key)) {
      console.log(`${progress} ${t.key} — already imported (${ayahCountByKey[t.key]} ayahs), skipping`);
      skipped++;
      continue;
    }

    // Clean up partial imports
    if (ayahCountByKey[t.key]) {
      console.log(`${progress} ${t.key} — partial import found (${ayahCountByKey[t.key]} ayahs), cleaning and reimporting`);
      await supabase.from("ayahs").delete().eq("translation_key", t.key);
    }

    console.log(`${progress} ${t.key} (${t.languageName} — ${t.translator})`);

    // Test with surah 1 first
    const testData = await fetchSurahFromApi(t.key, 1);
    if (!testData || testData.length === 0) {
      console.log(`    ⚠ Translation not found on QuranEnc, skipping`);
      failed.push(t.key);
      continue;
    }

    // Insert translation metadata
    const { error: metaError } = await supabase.from("translations").upsert({
      key: t.key,
      language_code: t.languageCode,
      language_name: t.languageName,
      translator: t.translator,
      is_primary: t.isPrimary,
    }, { onConflict: "key" });

    if (metaError) {
      console.error(`    ⚠ Failed to insert translation metadata: ${metaError.message}`);
      failed.push(t.key);
      continue;
    }

    // Fetch all 114 surahs
    let translationAyahs = 0;
    let allRows: {
      translation_key: string;
      surah: number;
      ayah: number;
      arabic_text: string;
      translation_text: string;
      footnotes: string | null;
    }[] = [];

    // We already fetched surah 1
    for (const a of testData) {
      allRows.push({
        translation_key: t.key,
        surah: parseInt(a.sura),
        ayah: parseInt(a.aya),
        arabic_text: a.arabic_text,
        translation_text: a.translation,
        footnotes: a.footnotes || null,
      });
    }

    for (let s = 2; s <= 114; s++) {
      const ayahs = await fetchSurahFromApi(t.key, s);
      if (!ayahs) {
        console.log(`    ⚠ Surah ${s} failed, continuing...`);
        continue;
      }

      for (const a of ayahs) {
        allRows.push({
          translation_key: t.key,
          surah: parseInt(a.sura),
          ayah: parseInt(a.aya),
          arabic_text: a.arabic_text,
          translation_text: a.translation,
          footnotes: a.footnotes || null,
        });
      }

      if (s % 20 === 0) {
        process.stdout.write(`    surah ${s}/114 (${allRows.length} ayahs)\r`);
      }

      await sleep(DELAY_MS);
    }

    // Batch upsert all ayahs
    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
      const batch = allRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("ayahs").upsert(batch, {
        onConflict: "translation_key,surah,ayah",
      });
      if (error) {
        console.error(`    ⚠ Batch insert error: ${error.message}`);
      }
    }

    translationAyahs = allRows.length;
    totalAyahs += translationAyahs;
    console.log(`    ✓ ${translationAyahs} ayahs imported`);
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`Total ayahs imported: ${totalAyahs}`);
  console.log(`Translations skipped (already imported): ${skipped}`);
  if (failed.length > 0) {
    console.log(`Failed translations: ${failed.join(", ")}`);
  }

  // Final count check
  const { count } = await supabase.from("ayahs").select("*", { count: "exact", head: true });
  console.log(`Total rows in ayahs table: ${count}`);
}

main().catch(console.error);
