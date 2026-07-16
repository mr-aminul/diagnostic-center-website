"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const AUTO_ADVANCE_MS = 5500;
const FADE_MS = 900;

export function HeroImageCarousel({
  images,
  className,
}: {
  images: readonly string[];
  className?: string;
}) {
  const count = images.length;
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (count <= 1 || reduceMotion) return;

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(timer);
  }, [count, reduceMotion]);

  if (count === 0) return null;

  // Only mount the active slide + next preload — not all 6 × ~2MB images.
  const nextIndex = count > 1 ? (index + 1) % count : index;
  const visibleIndexes =
    count === 1 ? [0] : Array.from(new Set([index, nextIndex]));

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {visibleIndexes.map((slideIndex) => {
        const isActive = slideIndex === index;
        return (
          <Image
            key={images[slideIndex]}
            src={images[slideIndex]}
            alt=""
            fill
            priority={slideIndex === 0 && index === 0}
            fetchPriority={isActive ? "high" : "low"}
            loading={isActive ? "eager" : "lazy"}
            sizes="100vw"
            className={cn(
              "object-cover object-center",
              reduceMotion
                ? isActive
                  ? "opacity-100"
                  : "opacity-0"
                : "transition-opacity ease-out",
              isActive ? "opacity-100" : "opacity-0",
            )}
            style={
              reduceMotion ? undefined : { transitionDuration: `${FADE_MS}ms` }
            }
          />
        );
      })}
    </div>
  );
}
