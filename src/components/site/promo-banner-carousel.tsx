"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type PromoBannerSlide = {
  id: string;
  src: string;
  alt: string;
  href: "/packages" | "/home-collection" | "/patient-portal";
};

const AUTO_ADVANCE_MS = 6000;
const TRANSITION_MS = 500;

export function PromoBannerCarousel({
  slides,
  className,
}: {
  slides: PromoBannerSlide[];
  className?: string;
}) {
  const t = useTranslations("home.promoBanner");
  const count = slides.length;

  // Track: [last, ...slides, first] so we can keep sliding left forever.
  const trackSlides =
    count > 1 ? [slides[count - 1], ...slides, slides[0]] : slides;

  // Real slides start at index 1 when we have clones.
  const [index, setIndex] = useState(count > 1 ? 1 : 0);
  const [withTransition, setWithTransition] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const jumpingRef = useRef(false);

  const logicalIndex = count > 1 ? (index - 1 + count) % count : index;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (count <= 1 || paused || reduceMotion) return;

    const timer = window.setInterval(() => {
      setWithTransition(true);
      setIndex((current) => current + 1);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [count, paused, reduceMotion]);

  const handleTransitionEnd = () => {
    if (count <= 1 || jumpingRef.current) return;

    // Finished sliding onto the cloned first slide — snap back to the real first.
    if (index === trackSlides.length - 1) {
      jumpingRef.current = true;
      setWithTransition(false);
      setIndex(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          jumpingRef.current = false;
          setWithTransition(true);
        });
      });
      return;
    }

    // Finished sliding onto the cloned last slide — snap back to the real last.
    if (index === 0) {
      jumpingRef.current = true;
      setWithTransition(false);
      setIndex(count);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          jumpingRef.current = false;
          setWithTransition(true);
        });
      });
    }
  };

  if (count === 0) return null;

  const goNext = () => {
    if (jumpingRef.current) return;
    setWithTransition(true);
    setIndex((current) => current + 1);
  };

  const goPrev = () => {
    if (jumpingRef.current) return;
    setWithTransition(true);
    setIndex((current) => current - 1);
  };

  const goToLogical = (target: number) => {
    if (jumpingRef.current || target === logicalIndex) return;
    setWithTransition(true);
    // Always move forward (right → left) to the chosen slide.
    const stepsForward = (target - logicalIndex + count) % count;
    setIndex((current) => current + stepsForward);
  };

  const animate = withTransition && !reduceMotion;

  return (
    <section
      className={cn("border-b bg-background", className)}
      aria-roledescription="carousel"
      aria-label={t("label")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="relative overflow-hidden rounded-xl border bg-secondary/20 shadow-sm">
          <div
            className="flex ease-out"
            style={{
              transform: `translateX(-${index * 100}%)`,
              transitionProperty: animate ? "transform" : "none",
              transitionDuration: animate ? `${TRANSITION_MS}ms` : "0ms",
            }}
            onTransitionEnd={(event) => {
              if (event.target !== event.currentTarget) return;
              handleTransitionEnd();
            }}
          >
            {trackSlides.map((slide, slideIndex) => {
              const isVisible = slideIndex === index;
              // Only eagerly load the first real slide; clones stay lazy.
              const isFirstReal = count > 1 ? slideIndex === 1 : slideIndex === 0;
              return (
                <Link
                  key={`${slide.id}-${slideIndex}`}
                  href={slide.href}
                  className="relative aspect-[16/9] w-full shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:aspect-[21/9]"
                  aria-label={slide.alt}
                  tabIndex={isVisible ? 0 : -1}
                >
                  <Image
                    src={slide.src}
                    alt={slide.alt}
                    fill
                    className="object-cover object-center"
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    priority={isFirstReal}
                    loading={isFirstReal || isVisible ? "eager" : "lazy"}
                  />
                </Link>
              );
            })}
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute top-1/2 left-2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-background sm:left-3"
                aria-label={t("previous")}
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute top-1/2 right-2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition hover:bg-background sm:right-3"
                aria-label={t("next")}
              >
                <ChevronRight className="size-5" aria-hidden />
              </button>

              <div
                className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-2"
                role="tablist"
                aria-label={t("slides")}
              >
                {slides.map((slide, slideIndex) => (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={slideIndex === logicalIndex}
                    aria-label={t("goToSlide", { n: slideIndex + 1 })}
                    onClick={() => goToLogical(slideIndex)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      slideIndex === logicalIndex
                        ? "w-6 bg-primary"
                        : "w-2 bg-primary/35 hover:bg-primary/55",
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
