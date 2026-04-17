"use server";

import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";
import { SURAHS } from "@/lib/quran/surahs";

const MAX_QUESTIONS_PER_DAY = 20;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export async function askAboutAyah(input: {
  surah: number;
  ayah: number;
  arabicText: string;
  translation: string;
  question: string;
  history: AiMessage[];
}): Promise<{ answer: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const today = new Date().toISOString().slice(0, 10);
  const { data: usage } = await supabase
    .from("ai_usage")
    .select("count")
    .eq("user_id", user.id)
    .eq("day", today)
    .single();

  if (usage && usage.count >= MAX_QUESTIONS_PER_DAY) {
    return { error: `Daily limit reached (${MAX_QUESTIONS_PER_DAY} questions/day). Try again tomorrow.` };
  }

  await supabase.rpc("increment_ai_usage", { uid: user.id, d: today });

  const surahMeta = SURAHS.find((s) => s.number === input.surah);
  const surahName = surahMeta?.transliteration ?? `Surah ${input.surah}`;

  const systemPrompt = `You are a knowledgeable Quran scholar assistant. The user is reading:
Surah ${surahName} (${input.surah}), Ayah ${input.ayah}

Arabic: ${input.arabicText}
Translation: ${input.translation}

Answer questions about this ayah clearly and respectfully. Provide historical context, linguistic insights, and scholarly interpretations when relevant. Be concise. Respond in the same language the user writes in.`;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...input.history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: input.question },
  ];

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 800,
      temperature: 0.7,
    });

    const answer = completion.choices[0]?.message?.content ?? "No response.";
    return { answer };
  } catch (err) {
    console.error("OpenAI error:", err);
    return { error: "Failed to get AI response. Please try again." };
  }
}
