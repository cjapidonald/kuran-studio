const BASE_URL = "https://quranenc.com/api/v1/translation";
const TRANSLATION_KEY = "albanian_nahi";

export interface Ayah {
  id: string;
  sura: string;
  aya: string;
  arabic_text: string;
  translation: string;
  footnotes: string;
}

interface ApiResponse {
  result: Ayah[];
}

export async function fetchSurah(surahNumber: number): Promise<Ayah[]> {
  const res = await fetch(
    `${BASE_URL}/sura/${TRANSLATION_KEY}/${surahNumber}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber}`);
  const data: ApiResponse = await res.json();
  return data.result;
}
