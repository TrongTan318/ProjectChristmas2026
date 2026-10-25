"use client";

import { useEffect, useRef, useState } from "react";
import { EFFECTS_EVENT, readEffectsPreference } from "./effects-preference";

interface Flake {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
}

/**
 * Tuyết rơi nhẹ bằng canvas. Tự tắt khi: người dùng bật giảm chuyển động,
 * thiết bị yếu (RAM ≤ 2GB / ≤ 2 nhân), tab bị ẩn, hoặc người dùng tắt hiệu ứng.
 */
export function Snowfall({ enabled }: { enabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const decide = () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const nav = navigator as Navigator & { deviceMemory?: number };
      const weak =
        (nav.deviceMemory ?? 4) <= 2 ||
        (navigator.hardwareConcurrency ?? 4) <= 2;
      setActive(enabled && !reduced && !weak && readEffectsPreference());
    };
    decide();
    window.addEventListener(EFFECTS_EVENT, decide);
    return () => window.removeEventListener(EFFECTS_EVENT, decide);
  }, [enabled]);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];
    let raf = 0;
    let last = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(180, (width * height) / 8000));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.8 + Math.random() * 2.2,
        speed: 0.25 + Math.random() * 0.6,
        drift: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      if (t - last < 33) return; // ~30 FPS là đủ mượt, tiết kiệm pin
      last = t;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(255, 250, 235, 0.85)";
      for (const f of flakes) {
        f.y += f.speed;
        f.phase += 0.01;
        f.x += Math.sin(f.phase) * f.drift * 0.5;
        if (f.y > height + 5) {
          f.y = -5;
          f.x = Math.random() * width;
        }
        ctx.globalAlpha = 0.35 + f.r / 5;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
    />
  );
}
