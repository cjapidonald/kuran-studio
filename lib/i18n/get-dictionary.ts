export interface Dictionary {
  [key: string]: string;
}

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  sq: () => import("./dictionaries/sq.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
};

export async function getDictionary(lang: string): Promise<Dictionary> {
  const loader = dictionaries[lang] ?? dictionaries["en"];
  return loader();
}
