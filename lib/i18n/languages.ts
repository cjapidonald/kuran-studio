export interface Language {
  code: string;
  name: string;
  nameEn: string;
  dir: "ltr" | "rtl";
  translationKey: string;
  alternateKeys?: string[];
}

export const LANGUAGES: Record<string, Language> = {
  // Balkan
  sq: { code: "sq", name: "Shqip", nameEn: "Albanian", dir: "ltr", translationKey: "albanian_nahi", alternateKeys: ["albanian_rwwad"] },
  bs: { code: "bs", name: "Bosanski", nameEn: "Bosnian", dir: "ltr", translationKey: "bosnian_rwwad", alternateKeys: ["bosnian_korkut", "bosnian_mahanovic"] },
  hr: { code: "hr", name: "Hrvatski", nameEn: "Croatian", dir: "ltr", translationKey: "croatian_rwwad" },
  sr: { code: "sr", name: "Српски", nameEn: "Serbian", dir: "ltr", translationKey: "serbian_rwwad" },
  mk: { code: "mk", name: "Македонски", nameEn: "Macedonian", dir: "ltr", translationKey: "macedonian_group" },
  bg: { code: "bg", name: "Български", nameEn: "Bulgarian", dir: "ltr", translationKey: "bulgarian_translation" },
  ro: { code: "ro", name: "Română", nameEn: "Romanian", dir: "ltr", translationKey: "romanian_project" },
  el: { code: "el", name: "Ελληνικά", nameEn: "Greek", dir: "ltr", translationKey: "greek_rwwad" },

  // Western European
  en: { code: "en", name: "English", nameEn: "English", dir: "ltr", translationKey: "english_saheeh", alternateKeys: ["english_rwwad", "english_hilali_khan"] },
  fr: { code: "fr", name: "Français", nameEn: "French", dir: "ltr", translationKey: "french_hameedullah", alternateKeys: ["french_rashid", "french_montada"] },
  de: { code: "de", name: "Deutsch", nameEn: "German", dir: "ltr", translationKey: "german_bubenheim", alternateKeys: ["german_rwwad", "german_aburida"] },
  es: { code: "es", name: "Español", nameEn: "Spanish", dir: "ltr", translationKey: "spanish_garcia", alternateKeys: ["spanish_montada_eu", "spanish_montada_latin"] },
  pt: { code: "pt", name: "Português", nameEn: "Portuguese", dir: "ltr", translationKey: "portuguese_nasr" },
  it: { code: "it", name: "Italiano", nameEn: "Italian", dir: "ltr", translationKey: "italian_rwwad" },
  nl: { code: "nl", name: "Nederlands", nameEn: "Dutch", dir: "ltr", translationKey: "dutch_center" },
  sv: { code: "sv", name: "Svenska", nameEn: "Swedish", dir: "ltr", translationKey: "swedish_rwwad" },
  lt: { code: "lt", name: "Lietuvių", nameEn: "Lithuanian", dir: "ltr", translationKey: "lithuanian_rwwad" },

  // Turkic
  tr: { code: "tr", name: "Türkçe", nameEn: "Turkish", dir: "ltr", translationKey: "turkish_rwwad", alternateKeys: ["turkish_shaban", "turkish_shahin"] },
  az: { code: "az", name: "Azərbaycan", nameEn: "Azerbaijani", dir: "ltr", translationKey: "azeri_musayev" },
  uz: { code: "uz", name: "O'zbek", nameEn: "Uzbek", dir: "ltr", translationKey: "uzbek_rwwad", alternateKeys: ["uzbek_sadiq", "uzbek_mansour"] },
  kk: { code: "kk", name: "Қазақ", nameEn: "Kazakh", dir: "ltr", translationKey: "kazakh_altai" },
  ky: { code: "ky", name: "Кыргыз", nameEn: "Kyrgyz", dir: "ltr", translationKey: "kyrgyz_hakimov" },
  ug: { code: "ug", name: "ئۇيغۇرچە", nameEn: "Uyghur", dir: "rtl", translationKey: "uyghur_saleh" },

  // Slavic
  ru: { code: "ru", name: "Русский", nameEn: "Russian", dir: "ltr", translationKey: "russian_rwwad", alternateKeys: ["russian_aboadel"] },
  uk: { code: "uk", name: "Українська", nameEn: "Ukrainian", dir: "ltr", translationKey: "ukrainian_yakubovych" },
  be: { code: "be", name: "Беларуская", nameEn: "Belarusian", dir: "ltr", translationKey: "belarusian_krivtsov" },

  // Middle Eastern
  ar: { code: "ar", name: "العربية", nameEn: "Arabic", dir: "rtl", translationKey: "arabic_source" },
  fa: { code: "fa", name: "فارسی", nameEn: "Persian", dir: "rtl", translationKey: "persian_ih" },
  ur: { code: "ur", name: "اردو", nameEn: "Urdu", dir: "rtl", translationKey: "urdu_junagarhi" },
  ps: { code: "ps", name: "پښتو", nameEn: "Pashto", dir: "rtl", translationKey: "pashto_rwwad", alternateKeys: ["pashto_zakaria"] },
  ku: { code: "ku", name: "کوردی", nameEn: "Kurdish (Sorani)", dir: "rtl", translationKey: "kurdish_bamoki", alternateKeys: ["kurdish_salahuddin"] },
  kmr: { code: "kmr", name: "Kurmancî", nameEn: "Kurdish (Kurmanji)", dir: "ltr", translationKey: "kurmanji_ismail" },
  he: { code: "he", name: "עברית", nameEn: "Hebrew", dir: "rtl", translationKey: "hebrew_darussalam" },
  prs: { code: "prs", name: "دری", nameEn: "Dari", dir: "rtl", translationKey: "dari_badkhashani" },

  // South Asian
  hi: { code: "hi", name: "हिन्दी", nameEn: "Hindi", dir: "ltr", translationKey: "hindi_omari" },
  ta: { code: "ta", name: "தமிழ்", nameEn: "Tamil", dir: "ltr", translationKey: "tamil_omar", alternateKeys: ["tamil_baqavi"] },
  te: { code: "te", name: "తెలుగు", nameEn: "Telugu", dir: "ltr", translationKey: "telugu_muhammad" },
  gu: { code: "gu", name: "ગુજરાતી", nameEn: "Gujarati", dir: "ltr", translationKey: "gujarati_omari" },
  ml: { code: "ml", name: "മലയാളം", nameEn: "Malayalam", dir: "ltr", translationKey: "malayalam_kunhi" },
  kn: { code: "kn", name: "ಕನ್ನಡ", nameEn: "Kannada", dir: "ltr", translationKey: "kannada_hamza" },
  as: { code: "as", name: "অসমীয়া", nameEn: "Assamese", dir: "ltr", translationKey: "assamese_rafeeq" },
  pa: { code: "pa", name: "ਪੰਜਾਬੀ", nameEn: "Punjabi", dir: "ltr", translationKey: "punjabi_arif" },
  si: { code: "si", name: "සිංහල", nameEn: "Sinhalese", dir: "ltr", translationKey: "sinhalese_mahir" },
  // bn (Bengali) and ne (Nepali) not available on QuranEnc — dropped for now

  // East Asian
  zh: { code: "zh", name: "中文", nameEn: "Chinese", dir: "ltr", translationKey: "chinese_suliman", alternateKeys: ["chinese_makin"] },
  ja: { code: "ja", name: "日本語", nameEn: "Japanese", dir: "ltr", translationKey: "japanese_saeedsato" },
  ko: { code: "ko", name: "한국어", nameEn: "Korean", dir: "ltr", translationKey: "korean_hamid" },

  // Southeast Asian
  id: { code: "id", name: "Bahasa Indonesia", nameEn: "Indonesian", dir: "ltr", translationKey: "indonesian_sabiq", alternateKeys: ["indonesian_affairs", "indonesian_complex"] },
  ms: { code: "ms", name: "Bahasa Melayu", nameEn: "Malay", dir: "ltr", translationKey: "malay_basumayyah" },
  tl: { code: "tl", name: "Tagalog", nameEn: "Tagalog", dir: "ltr", translationKey: "tagalog_rwwad" },
  th: { code: "th", name: "ไทย", nameEn: "Thai", dir: "ltr", translationKey: "thai_rwwad", alternateKeys: ["thai_complex"] },
  vi: { code: "vi", name: "Tiếng Việt", nameEn: "Vietnamese", dir: "ltr", translationKey: "vietnamese_rwwad", alternateKeys: ["vietnamese_hassan"] },
  km: { code: "km", name: "ខ្មែរ", nameEn: "Khmer", dir: "ltr", translationKey: "khmer_rwwad" },
  ceb: { code: "ceb", name: "Cebuano", nameEn: "Cebuano", dir: "ltr", translationKey: "bisayan_rwwad" },
  mrw: { code: "mrw", name: "Iranun", nameEn: "Iranun", dir: "ltr", translationKey: "iranun_sarro" },
  mdh: { code: "mdh", name: "Maguindanaon", nameEn: "Maguindanaon", dir: "ltr", translationKey: "maguindanao_rwwad" },

  // Central Asian
  tg: { code: "tg", name: "Тоҷикӣ", nameEn: "Tajik", dir: "ltr", translationKey: "tajik_arifi", alternateKeys: ["tajik_khawaja"] },

  // Caucasian
  ka: { code: "ka", name: "ქართული", nameEn: "Georgian", dir: "ltr", translationKey: "georgian_rwwad" },
  kbd: { code: "kbd", name: "Адыгэбзэ", nameEn: "Circassian", dir: "ltr", translationKey: "circassian_rwwad" },

  // African
  sw: { code: "sw", name: "Kiswahili", nameEn: "Swahili", dir: "ltr", translationKey: "swahili_rwwad", alternateKeys: ["swahili_barwani"] },
  so: { code: "so", name: "Soomaali", nameEn: "Somali", dir: "ltr", translationKey: "somali_yacob" },
  am: { code: "am", name: "አማርኛ", nameEn: "Amharic", dir: "ltr", translationKey: "amharic_sadiq" },
  yo: { code: "yo", name: "Yorùbá", nameEn: "Yoruba", dir: "ltr", translationKey: "yoruba_mikail" },
  om: { code: "om", name: "Oromoo", nameEn: "Oromo", dir: "ltr", translationKey: "oromo_ababor" },
  mg: { code: "mg", name: "Malagasy", nameEn: "Malagasy", dir: "ltr", translationKey: "malagasy_rwwad" },
  // ny (Chichewa) and dag (Dagbani) not available on QuranEnc — dropped
  mos: { code: "mos", name: "Mooré", nameEn: "Mossi", dir: "ltr", translationKey: "moore_rwwad" },
  ff: { code: "ff", name: "Fulfulde", nameEn: "Fulani", dir: "ltr", translationKey: "fulani_rwwad" },
  ln: { code: "ln", name: "Lingála", nameEn: "Lingala", dir: "ltr", translationKey: "lingala_zakaria" },
  ak: { code: "ak", name: "Akan", nameEn: "Akan", dir: "ltr", translationKey: "asante_harun" },
  rw: { code: "rw", name: "Kinyarwanda", nameEn: "Kinyarwanda", dir: "ltr", translationKey: "kinyarwanda_assoc" },
  rn: { code: "rn", name: "Kirundi", nameEn: "Kirundi", dir: "ltr", translationKey: "ikirundi_gehiti" },
  aa: { code: "aa", name: "Afar", nameEn: "Afar", dir: "ltr", translationKey: "afar_hamza" },
  ha: { code: "ha", name: "Hausa", nameEn: "Hausa", dir: "ltr", translationKey: "hausa_gummi" },
  nqo: { code: "nqo", name: "ߒߞߏ", nameEn: "N'Ko", dir: "rtl", translationKey: "ankobambara_dayyan" },
};

export const SUPPORTED_LOCALES = Object.keys(LANGUAGES);
export const DEFAULT_LOCALE = "en";

export function getLanguage(code: string): Language | undefined {
  return LANGUAGES[code];
}

export function isValidLocale(code: string): boolean {
  return code in LANGUAGES;
}
