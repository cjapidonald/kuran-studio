const BASE_URL = "https://quranenc.com/api/v1/translation";

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

export async function fetchSurah(translationKey: string, surahNumber: number): Promise<Ayah[]> {
  const res = await fetch(
    `${BASE_URL}/sura/${translationKey}/${surahNumber}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber} for ${translationKey}`);
  const data: ApiResponse = await res.json();
  return data.result;
}
