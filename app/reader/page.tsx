import { SURAHS } from "@/lib/quran/surahs";
import { SurahCard } from "@/components/reader/surah-card";

export const metadata = { title: "Lexuesi" };

export default function ReaderPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Kurani Fisnik</h1>
        <p className="text-sm text-gray-500 mt-1">114 sure &bull; Perkthimi shqip nga Hasan Efendi Nahi</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SURAHS.map((surah) => (
          <SurahCard key={surah.number} surah={surah} />
        ))}
      </div>
    </div>
  );
}
