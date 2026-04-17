"use client";

import { useEffect, useRef } from "react";
import { recordAyahsRead } from "@/app/actions/khatm";

/**
 * Observes elements with `[data-ayah]` attribute inside the current page.
 * When an ayah has been >= 50% visible for 1.5 s, it counts as "read".
 * Batches are flushed every 10 s and on pagehide / visibilitychange.
 */
export function ReadingTracker({ khatmId, surah }: { khatmId: string; surah: number }) {
  const pendingRef = useRef<Map<string, { surah: number; ayah: number }>>(new Map());
  const seenRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Map<Element, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const flush = () => {
      const pending = Array.from(pendingRef.current.values());
      if (!pending.length) return;
      pendingRef.current.clear();
      // Fire-and-forget; the server action handles auth + upsert.
      recordAyahsRead(khatmId, pending).catch(() => {
        // If the send failed, put them back for the next attempt.
        for (const a of pending) {
          const k = `${a.surah}:${a.ayah}`;
          if (!seenRef.current.has(k)) pendingRef.current.set(k, a);
        }
      });
    };

    const markRead = (el: Element) => {
      const ayahStr = el.getAttribute("data-ayah");
      if (!ayahStr) return;
      const ayah = parseInt(ayahStr, 10);
      if (Number.isNaN(ayah)) return;
      const key = `${surah}:${ayah}`;
      if (seenRef.current.has(key)) return;
      seenRef.current.add(key);
      pendingRef.current.set(key, { surah, ayah });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            // Arm a 1.5 s timer — once it fires, count it.
            if (timersRef.current.has(entry.target)) continue;
            const t = setTimeout(() => {
              markRead(entry.target);
              timersRef.current.delete(entry.target);
            }, 1500);
            timersRef.current.set(entry.target, t);
          } else {
            // Cancel the pending timer if the element scrolls away early.
            const t = timersRef.current.get(entry.target);
            if (t) {
              clearTimeout(t);
              timersRef.current.delete(entry.target);
            }
          }
        }
      },
      { threshold: [0, 0.5, 1] },
    );

    const nodes = document.querySelectorAll<HTMLElement>("[data-ayah]");
    nodes.forEach((n) => observer.observe(n));

    const flushTimer = setInterval(flush, 10_000);

    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });

    return () => {
      clearInterval(flushTimer);
      window.removeEventListener("pagehide", onHide);
      observer.disconnect();
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();
      flush();
    };
  }, [khatmId, surah]);

  return null;
}
