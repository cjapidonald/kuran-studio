"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, createContext, useContext, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const TILT_MAX = 9;
const TILT_SPRING = { stiffness: 300, damping: 28 } as const;
const GLOW_SPRING = { stiffness: 180, damping: 22 } as const;

type RowCtx = { hoveredId: string | null; setHoveredId: (id: string | null) => void };
const TiltRowContext = createContext<RowCtx>({ hoveredId: null, setHoveredId: () => {} });

export function TiltCardRow({ children, className }: { children: React.ReactNode; className?: string }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return (
    <TiltRowContext.Provider value={{ hoveredId, setHoveredId }}>
      <div className={className}>{children}</div>
    </TiltRowContext.Provider>
  );
}

export interface TiltCardProps {
  id: string;
  color: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function TiltCard({ id, color, children, className, onClick }: TiltCardProps) {
  const { hoveredId, setHoveredId } = useContext(TiltRowContext);
  const cardRef = useRef<HTMLDivElement>(null);
  const dimmed = hoveredId !== null && hoveredId !== id;
  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);
  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);
  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  }, [normX, normY]);

  const handleMouseEnter = useCallback(() => {
    glowOpacity.set(1);
    setHoveredId(id);
  }, [glowOpacity, setHoveredId, id]);

  const handleMouseLeave = useCallback(() => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    setHoveredId(null);
  }, [normX, normY, glowOpacity, setHoveredId]);

  return (
    <motion.div
      ref={cardRef}
      animate={{ scale: dimmed ? 0.96 : 1, opacity: dimmed ? 0.5 : 1 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn(
        "group/tilt relative overflow-hidden rounded-xl border",
        "border-zinc-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        "dark:border-white/6 dark:bg-white/3 dark:shadow-none",
        "transition-[border-color] duration-300",
        "hover:border-zinc-300 dark:hover:border-white/14",
        className
      )}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={onClick}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ background: `radial-gradient(ellipse at 20% 20%, ${color}14, transparent 65%)` }} />
      <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ opacity: glowOpacity, background: `radial-gradient(ellipse at 20% 20%, ${color}2e, transparent 65%)` }} />
      <div aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-linear-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 ease-out group-hover/tilt:translate-x-[280%]" />
      <div className="relative z-10">{children}</div>
      <div aria-hidden="true" className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover/tilt:w-full"
        style={{ background: `linear-gradient(to right, ${color}80, transparent)` }} />
    </motion.div>
  );
}
