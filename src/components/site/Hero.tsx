'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { mediaSrcSet, mediaUrl } from '@/lib/media';
import { Candle, RoseWindow } from './Decor';

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  imageKey: string | null;
  ctaLabel: string;
  ctaUrl: string;
}

export function Hero({ slides, organizer }: { slides: HeroSlide[]; organizer: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '30%']);
  const windowY = useTransform(scrollYProgress, [0, 1], ['0%', reduce ? '0%' : '-25%']);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (slides.length < 2 || reduce) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, [slides.length, reduce]);

  const slide = slides[index] ?? slides[0];
  if (!slide) return null;

  return (
    <section ref={ref} className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-museum">
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10">
        <AnimatePresence mode="sync">
          {slide.imageKey && (
            <motion.img
              key={slide.id}
              src={mediaUrl(slide.imageKey, 1600)}
              srcSet={mediaSrcSet(slide.imageKey)}
              sizes="100vw"
              alt=""
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 0.45, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, ease: 'easeOut' }}
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/40 to-ink" />
      </motion.div>

      <motion.div
        style={{ y: windowY }}
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 w-[min(110vw,820px)] -translate-x-1/2 -translate-y-1/2 opacity-40"
      >
        <div className="stained-glass absolute inset-[-10%] animate-[spin_120s_linear_infinite] rounded-full" />
        <RoseWindow className="relative h-auto w-full" />
      </motion.div>

      <div className="pointer-events-none absolute bottom-10 left-6 hidden gap-6 sm:flex">
        <Candle />
        <Candle className="mt-6 scale-90" />
      </div>
      <div className="pointer-events-none absolute right-6 bottom-10 hidden gap-6 sm:flex">
        <Candle className="mt-6 scale-90" />
        <Candle />
      </div>

      <motion.div style={{ opacity: fade }} className="mx-auto w-full max-w-5xl px-4 pt-24 pb-16 text-center sm:px-6">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-[11px] font-semibold tracking-[0.18em] text-gold uppercase sm:text-sm sm:tracking-[0.35em]"
        >
          {organizer} · Mùa Giáng Sinh 2026
        </motion.p>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="mt-6 font-serif text-4xl leading-[1.1] font-bold text-balance sm:text-6xl md:text-7xl">
              <span className="text-gold-gradient animate-shimmer">{slide.title}</span>
            </h1>
            {slide.subtitle && (
              <p className="mx-auto mt-6 max-w-2xl text-lg text-balance text-ivory/85 sm:text-xl">{slide.subtitle}</p>
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href={slide.ctaUrl || '/trien-lam'} className="btn-gold w-full text-lg sm:w-auto">
            {slide.ctaLabel || 'Vào triển lãm'}
          </Link>
          <Link href="/vote" className="btn-outline-gold w-full text-lg sm:w-auto">
            Bình chọn bằng phiếu QR
          </Link>
        </div>
        {slides.length > 1 && (
          <div className="mt-10 flex justify-center gap-2" role="tablist" aria-label="Chọn banner">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-gold' : 'w-2 bg-ivory/40'}`}
              />
            ))}
          </div>
        )}
      </motion.div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-float text-gold/70" aria-hidden>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </section>
  );
}
